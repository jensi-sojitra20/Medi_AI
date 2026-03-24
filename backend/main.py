from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from database import engine, get_db
import models
from auth_utils import get_current_user
from routes import auth, patient, doctor, admin

# Create all DB tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medi AI API",
    version="2.0.0",
    description="AI-Powered Healthcare Platform with MySQL + ML",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,    prefix="/auth",    tags=["Auth"])
app.include_router(patient.router, prefix="/patient", tags=["Patient"])
app.include_router(doctor.router,  prefix="/doctor",  tags=["Doctor"])
app.include_router(admin.router,   prefix="/admin",   tags=["Admin"])

# ── Shorthand registration routes ────────────────────────────────────────────
from routes.patient import register_patient
from routes.doctor  import register_doctor

app.add_api_route("/register/patient", register_patient, methods=["POST"], tags=["Registration"])
app.add_api_route("/register/doctor",  register_doctor,  methods=["POST"], tags=["Registration"])


@app.get("/")
def root():
    return {"message": "Medi AI API v2 is running", "docs": "/docs"}


@app.get("/public/testimonials")
def get_testimonials(db: Session = Depends(get_db)):
    """Public endpoint — no auth needed. Returns all public feedbacks for landing page."""
    rows = (
        db.query(models.Feedback)
        .filter(models.Feedback.is_public == True)
        .order_by(models.Feedback.date.desc())
        .limit(50)
        .all()
    )
    result = []
    for r in rows:
        if not r.message or not r.message.strip():
            continue
        name = r.reviewer_name or "Anonymous"
        role = r.role or "patient"
        spec = ""
        if role == "doctor" and r.doctor_id:
            try:
                spec = r.doctor.specialization or ""
            except Exception:
                spec = ""
        result.append({
            "id":      r.feedback_id,
            "name":    name,
            "role":    role,
            "message": r.message,
            "rating":  r.rating or 5,
            "spec":    spec,
            "date":    r.date.isoformat() if r.date else None,
        })
    return {"testimonials": result}


@app.get("/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    u = current_user
    data = {
        "id":    u.user_id,
        "email": u.email,
        "name":  u.name,
        "role":  u.role.value,
    }
    if u.role == models.UserRole.patient and u.patient_profile:
        p = u.patient_profile
        data.update({
            "subscription":  p.subscription_status.value,
            "age":           p.age,
            "gender":        p.gender,
            "blood_group":   p.blood_group,
            "profile_image": p.profile_image,
        })
    elif u.role == models.UserRole.doctor and u.doctor_profile:
        d = u.doctor_profile
        data.update({
            "status":         d.verification_status.value,
            "specialization": d.specialization,
        })
    return data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)