from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from auth_utils import get_current_user, hash_password
import models, os, uuid

router     = APIRouter()
UPLOAD_DIR = "uploads"


# ── File upload helper ────────────────────────────────────────────────────────
async def save_upload(file: UploadFile, subfolder: str) -> str:
    folder = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    ext      = os.path.splitext(file.filename or "file")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    path     = os.path.join(folder, filename)
    content  = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return path


# ── Auth guard ────────────────────────────────────────────────────────────────
def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(403, "Admin access required")
    return current_user


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN PROFILE  (GET / UPDATE / UPLOAD PICTURE)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/profile")
def get_admin_profile(
    current_user: models.User = Depends(require_admin),
):
    """Return admin's own profile data including profile image path."""
    return {
        "id":            current_user.user_id,
        "name":          current_user.name,
        "email":         current_user.email,
        "role":          current_user.role.value,
        "profile_image": getattr(current_user, "profile_image", None),
    }


class AdminProfileUpdateRequest(BaseModel):
    name:  Optional[str] = None
    email: Optional[str] = None


@router.put("/profile")
def update_admin_profile(
    req: AdminProfileUpdateRequest,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update admin name and/or email."""
    if req.name and req.name.strip():
        current_user.name = req.name.strip()
    if req.email and req.email.strip():
        # Check no other user has that email
        existing = db.query(models.User).filter(
            models.User.email == req.email.strip(),
            models.User.user_id != current_user.user_id,
        ).first()
        if existing:
            raise HTTPException(400, "Email already used by another account")
        current_user.email = req.email.strip()
    db.commit()
    return {
        "message": "Profile updated successfully",
        "name":    current_user.name,
        "email":   current_user.email,
    }


@router.post("/profile/picture")
async def upload_admin_profile_picture(
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Upload admin profile picture — saves to uploads/admin/images/ folder."""
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(400, "Only JPG, PNG, or WebP images allowed")

    path = await save_upload(file, "admin/images")

    # Store path on the User row (add profile_image column if missing via ALTER)
    try:
        current_user.profile_image = path  # works if column exists
        db.commit()
    except Exception:
        db.rollback()
        # Column may not exist yet in older DB — still return path so frontend can use it
        pass

    return {
        "message":       "Profile picture uploaded successfully",
        "profile_image": path,
        "url":           f"/{path.replace(os.sep, '/')}",
    }


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD STATS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
def admin_dashboard(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    total_doctors        = db.query(models.Doctor).count()
    verified             = db.query(models.Doctor).filter(models.Doctor.verification_status == models.DoctorVerificationStatus.verified).count()
    pending              = db.query(models.Doctor).filter(models.Doctor.verification_status == models.DoctorVerificationStatus.pending).count()
    rejected             = db.query(models.Doctor).filter(models.Doctor.verification_status == models.DoctorVerificationStatus.rejected).count()
    total_patients       = db.query(models.Patient).count()
    on_trial             = db.query(models.Patient).filter(models.Patient.subscription_status == models.SubscriptionStatus.trial).count()
    paying               = db.query(models.Patient).filter(models.Patient.subscription_status == models.SubscriptionStatus.active).count()
    expired              = db.query(models.Patient).filter(models.Patient.subscription_status == models.SubscriptionStatus.expired).count()
    total_predictions    = db.query(models.AIRecommendation).count()
    total_prescriptions  = db.query(models.Prescription).count()
    pending_reviews      = db.query(models.AIRecommendation).filter(models.AIRecommendation.status == models.RecommendationStatus.pending).count()
    approved_predictions = db.query(models.AIRecommendation).filter(models.AIRecommendation.status == models.RecommendationStatus.approved).count()

    return {
        "stats": {
            "totalDoctors":        total_doctors,
            "verifiedDoctors":     verified,
            "pendingDoctors":      pending,
            "rejectedDoctors":     rejected,
            "totalPatients":       total_patients,
            "onTrial":             on_trial,
            "payingPatients":      paying,
            "expiredPatients":     expired,
            "totalPredictions":    total_predictions,
            "totalPrescriptions":  total_prescriptions,
            "pendingReviews":      pending_reviews,
            "approvedPredictions": approved_predictions,
        }
    }



# ══════════════════════════════════════════════════════════════════════════════
# DOCTOR MANAGEMENT
# ═══════════════════=══════════════════════════════════════════════════════════

@router.get("/doctors")
def get_doctors(
    status: Optional[str] = None,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(models.User).filter(models.User.role == models.UserRole.doctor).all()

    doctors = []
    for u in users:
        d = u.doctor_profile

        # Effective status: blocked overrides verification status
        if u.is_blocked:
            effective_status = "blocked"
        elif d:
            effective_status = d.verification_status.value.lower()  # pending / verified / rejected
        else:
            effective_status = "pending"

        # Optional query-param filter
        if status and effective_status != status.lower():
            continue

        doctors.append({
            "id":             u.user_id,
            "name":           u.name,
            "email":          u.email,
            "specialization": d.specialization   if d else None,
            "license":        d.license_number   if d else None,
            "experience":     d.experience_years if d else None,
            "hospital":       d.hospital         if d else None,
            "phone":          d.phone            if d else None,
            "qualification":  d.qualification    if d else None,
            "status":         effective_status,
            "registered_at":  u.created_at.isoformat() if u.created_at else None,
            "is_blocked":     u.is_blocked,
            # ── File paths ─────────────────────────────────────────────────
            "id_proof":       d.id_proof if d else None,
            "id_proof_url":   f"/{d.id_proof.replace(os.sep, '/')}" if (d and d.id_proof) else None,
        })

    return {"doctors": doctors}


@router.put("/doctors/{doctor_id}/verify")
def verify_doctor(
    doctor_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    doctor = db.query(models.Doctor).filter(models.Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    doctor.verification_status = models.DoctorVerificationStatus.verified

    # Also unblock if they were previously blocked
    user = db.query(models.User).filter(models.User.user_id == doctor_id).first()
    if user:
        user.is_blocked = False

    db.add(models.Notification(
        user_id=doctor_id,
        message="Congratulations! Your doctor account has been verified. You can now review patient AI reports.",
    ))
    db.commit()
    return {"message": "Doctor verified successfully", "doctor_id": doctor_id, "status": "verified"}


@router.put("/doctors/{doctor_id}/reject")
def reject_doctor(
    doctor_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    doctor = db.query(models.Doctor).filter(models.Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    doctor.verification_status = models.DoctorVerificationStatus.rejected
    db.add(models.Notification(
        user_id=doctor_id,
        message="Your doctor verification request has been rejected. Please contact support for more information.",
    ))
    db.commit()
    return {"message": "Doctor rejected", "doctor_id": doctor_id, "status": "rejected"}


@router.put("/doctors/{doctor_id}/block")
def block_doctor(
    doctor_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.user_id == doctor_id,
        models.User.role == models.UserRole.doctor,
    ).first()
    if not user:
        raise HTTPException(404, "Doctor not found")

    user.is_blocked = True
    db.add(models.Notification(
        user_id=doctor_id,
        message="Your account has been blocked by the admin. Please contact support.",
    ))
    db.commit()
    return {"message": "Doctor blocked", "doctor_id": doctor_id}


@router.put("/doctors/{doctor_id}/unblock")
def unblock_doctor(
    doctor_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.user_id == doctor_id,
        models.User.role == models.UserRole.doctor,
    ).first()
    if not user:
        raise HTTPException(404, "Doctor not found")

    user.is_blocked = False
    db.add(models.Notification(
        user_id=doctor_id,
        message="Your account has been unblocked. You can now log in to MediAI.",
    ))
    db.commit()
    return {"message": "Doctor unblocked", "doctor_id": doctor_id}


# ══════════════════════════════════════════════════════════════════════════════
# PATIENT MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/patients")
def get_patients(
    subscription: Optional[str] = None,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(models.User).filter(models.User.role == models.UserRole.patient).all()

    patients = []
    for u in users:
        p   = u.patient_profile
        sub = p.get_subscription_info() if p else {}

        # Optional subscription status filter
        if subscription and sub.get("status", "").lower() != subscription.lower():
            continue

        patients.append({
            "id":            u.user_id,
            "name":          u.name,
            "email":         u.email,
            "age":           p.age         if p else None,
            "gender":        p.gender      if p else None,
            "phone":         p.phone       if p else None,
            "blood_group":   p.blood_group if p else None,
            "registered_at": u.created_at.isoformat() if u.created_at else None,
            "subscription":  sub,
            "is_blocked":    u.is_blocked,
        })

    return {"patients": patients}


class AdminGrantPlanRequest(BaseModel):
    plan: str           # "trial" | "basic" | "premium"
    days: Optional[int] = 30


@router.put("/patients/{patient_id}/grant-plan")
def admin_grant_plan(
    patient_id: int,
    req: AdminGrantPlanRequest,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    profile = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not profile:
        raise HTTPException(404, "Patient not found")

    now = datetime.utcnow()

    if req.plan == "trial":
        profile.subscription_status = models.SubscriptionStatus.trial
        profile.subscription_plan   = models.SubscriptionPlan.trial
        profile.trial_start_date    = now
        profile.trial_end_date      = now + timedelta(days=models.TRIAL_DAYS)
        profile.predictions_used    = 0
        label = f"14-day free trial"
    elif req.plan in ("basic", "premium"):
        profile.subscription_status = models.SubscriptionStatus.active
        profile.subscription_plan   = models.SubscriptionPlan(req.plan)
        profile.subscription_start  = now
        profile.subscription_end    = now + timedelta(days=req.days or 30)
        profile.predictions_used    = 0
        label = f"{req.plan.title()} plan for {req.days or 30} days"
    else:
        raise HTTPException(400, "Invalid plan. Choose: trial, basic, or premium")

    db.add(models.Notification(
        user_id=patient_id,
        message=f"Your subscription has been updated by admin: {label} granted.",
    ))
    db.commit()

    return {
        "message":      f"Plan '{req.plan}' granted successfully",
        "patient_id":   patient_id,
        "plan":         req.plan,
        "days":         req.days or 30,
        "subscription": profile.get_subscription_info(),
    }


@router.put("/patients/{patient_id}/block")
def block_patient(
    patient_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.user_id == patient_id,
        models.User.role == models.UserRole.patient,
    ).first()
    if not user:
        raise HTTPException(404, "Patient not found")

    user.is_blocked = True
    db.add(models.Notification(
        user_id=patient_id,
        message="Your account has been blocked by the admin. Please contact support.",
    ))
    db.commit()
    return {"message": "Patient blocked", "patient_id": patient_id}


@router.put("/patients/{patient_id}/unblock")
def unblock_patient(
    patient_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.user_id == patient_id,
        models.User.role == models.UserRole.patient,
    ).first()
    if not user:
        raise HTTPException(404, "Patient not found")

    user.is_blocked = False
    db.add(models.Notification(
        user_id=patient_id,
        message="Your account has been unblocked. You can now log in to MediAI.",
    ))
    db.commit()
    return {"message": "Patient unblocked", "patient_id": patient_id}

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN USER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

class CreateAdminRequest(BaseModel):
    full_name: str
    email:     str
    password:  str


@router.post("/create-admin", status_code=201)
def create_admin(
    req: CreateAdminRequest,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(400, "Email already registered")

    user = models.User(
        name=req.full_name,
        email=req.email,
        password=hash_password(req.password),
        role=models.UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Admin created successfully", "admin_id": user.user_id}