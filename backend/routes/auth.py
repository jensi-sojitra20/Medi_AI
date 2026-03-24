from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from auth_utils import hash_password, verify_password, create_access_token
import models, re, os, random, time, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import EMAIL_USER, EMAIL_PASSWORD
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

load_dotenv()

router = APIRouter()
otp_store = {}  # { email: {otp, expires_at} }


# ─── Request Models ───────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class GoogleLoginRequest(BaseModel):
    token: str
    role: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str


# ─── Helper ───────────────────────────────────────────────────────────────────

def send_email(to_email: str, subject: str, html_body: str):
    if not EMAIL_USER or not EMAIL_PASSWORD:
        raise Exception("EMAIL_USER and EMAIL_PASSWORD must be set in .env")
    msg = MIMEMultipart()
    msg["From"] = EMAIL_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(EMAIL_USER, EMAIL_PASSWORD)
    server.sendmail(EMAIL_USER, to_email, msg.as_string())
    server.quit()


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role.value.upper() != request.role.upper():
        raise HTTPException(status_code=401, detail="Invalid role selected")
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token({"sub": user.email, "role": user.role.value})

    user_data = {
        "id": user.user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role.value
    }

    if user.role == models.UserRole.patient and user.patient_profile:
        p = user.patient_profile
        user_data.update({
            "age": p.age,
            "gender": p.gender,
            "phone": p.phone,
            "blood_group": p.blood_group,
            "subscription": p.subscription_status.value,
            "profile_image": p.profile_image
        })
    elif user.role == models.UserRole.doctor and user.doctor_profile:
        d = user.doctor_profile
        user_data.update({
            "license": d.license_number,
            "specialization": d.specialization,
            "experience": d.experience_years,
            "phone": d.phone,
            "status": d.verification_status.value,
            "hospital": d.hospital
        })

    return {"token": token, "user": user_data}


@router.post("/google")
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    # ── Step 1: Verify Google token ──────────────────────────────────────────
    try:
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        id_info = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        google_email = id_info.get("email")
        google_name = id_info.get("name", "")

        if not google_email:
            raise HTTPException(status_code=400, detail="Could not extract email from Google token")

    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    # ── Step 2: Find user by email ───────────────────────────────────────────
    user = db.query(models.User).filter(models.User.email == google_email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found for this Google email. Please register first."
        )

    # ── Step 3: Check role matches ───────────────────────────────────────────
    if user.role.value.lower() != request.role.lower():
        raise HTTPException(
            status_code=403,
            detail=f"This email is registered as '{user.role.value}', not '{request.role}'"
        )

    # ── Step 4: Check if blocked ─────────────────────────────────────────────
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account has been deactivated")

    # ── Step 5: Create access token ──────────────────────────────────────────
    access_token = create_access_token({"sub": user.email, "role": user.role.value})

    user_data = {
        "id": user.user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role.value
    }

    if user.role == models.UserRole.doctor and user.doctor_profile:
        d = user.doctor_profile
        user_data.update({
            "license": d.license_number,
            "specialization": d.specialization,
            "experience": d.experience_years,
            "phone": d.phone,
            "status": d.verification_status.value,
            "hospital": d.hospital
        })
    elif user.role == models.UserRole.patient and user.patient_profile:
        p = user.patient_profile
        user_data.update({
            "age": p.age,
            "gender": p.gender,
            "phone": p.phone,
            "blood_group": p.blood_group,
            "subscription": p.subscription_status.value,
            "profile_image": p.profile_image
        })

    return {"access_token": access_token, "role": user.role.value, "user": user_data}


@router.get("/me")
def get_me(db: Session = Depends(get_db)):
    return {"message": "use /auth/me with Bearer token"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    otp = str(random.randint(100000, 999999))
    otp_store[data.email] = {"otp": otp, "expires_at": time.time() + 600}

    if user:
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0099cc;">Password Reset Code</h2>
          <p>Use this verification code to reset your MediAI password:</p>
          <div style="background:#f5f5f5;padding:20px;text-align:center;margin:20px 0;border-radius:8px;">
            <h1 style="color:#0099cc;font-size:36px;letter-spacing:8px;margin:0;">{otp}</h1>
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#999;font-size:12px;">MediAI - AI-Powered Healthcare Platform</p>
        </div>"""
        try:
            send_email(data.email, "MediAI - Password Reset Code", html)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

    return {"message": "OTP sent successfully", "expiresIn": 600}


@router.post("/verify-otp")
def verify_otp(data: VerifyOtpRequest):
    stored = otp_store.get(data.email)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP not found or expired")
    if time.time() > stored["expires_at"]:
        otp_store.pop(data.email, None)
        raise HTTPException(status_code=400, detail="OTP has expired")
    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"message": "OTP verified successfully"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(data.newPassword) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    stored = otp_store.get(data.email)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP not found or expired")
    if time.time() > stored["expires_at"]:
        otp_store.pop(data.email, None)
        raise HTTPException(status_code=400, detail="OTP expired")
    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(models.User).filter(models.User.email == data.email).first()
    if user:
        user.password = hash_password(data.newPassword)
        db.commit()

    otp_store.pop(data.email, None)
    return {"message": "Password reset successful"}