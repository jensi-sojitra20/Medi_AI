from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from database import get_db
from auth_utils import hash_password, get_current_user
import models, re, os, uuid, json, io, logging

# ── OCR / PDF imports for report validation ───────────────────────────────────
# Install: pip install PyMuPDF pytesseract Pillow

try:
    import fitz                   # PyMuPDF
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logging.warning("PyMuPDF / pytesseract / Pillow not installed. Report validation will use basic mode.")

logger     = logging.getLogger(__name__)
router     = APIRouter()
UPLOAD_DIR = "uploads"


# ══════════════════════════════════════════════════════════════════════════════
# REPORT VALIDATION CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════

ALLOWED_REPORT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}

MIN_TEXT_LENGTH = 50   # characters — anything shorter is unreadable

# (display_label, [search patterns]) — case-insensitive substring match
MEDICAL_FIELD_PATTERNS = [
    ("Patient Name",     ["patient name", "patient:", "name of patient", "pt. name", "pt name", "patient id"]),
    ("Age",              ["age:", "age /", "age/", "d.o.b", "date of birth", "dob:", "years old", "yrs"]),
    ("Test Name",        ["test name", "investigation", "test:", "panel:", "profile:", "assay", "examination", "test(s)"]),
    ("Result",           ["result", "value", "observation", "finding", "report", "reading", "measured"]),
    ("Doctor",           ["doctor", "dr.", "physician", "referred by", "consultant", "clinician", "ordered by", "rmo"]),
    ("Lab / Hospital",   ["laboratory", "lab:", "hospital", "diagnostic", "diagnostics", "pathology",
                          "clinic", "centre", "center", "health", "labs", "lab report"]),
    ("Diagnosis",        ["diagnosis", "impression", "conclusion", "clinical note", "assessment", "comment", "remarks"]),
    ("Date",             ["date:", "collection date", "report date", "sample date", "test date", "collected on"]),
    ("Reference Range",  ["reference range", "normal range", "normal value", "ref range", "ref:",
                          "normal:", "expected", "bio. ref. interval"]),
    ("Units",            ["mg/dl", "mmol/l", "g/dl", "u/l", "iu/l", "%", "cells/μl",
                          "mm/hr", "ng/ml", "pg/ml", "miu/ml", "meq/l", "umol/l"]),
]

MIN_FIELDS_REQUIRED = 3   # need at least this many fields for a valid report

# Known lab / hospital brands — all lowercase for matching
KNOWN_LABS = [
    "apollo", "thyrocare", "dr lal pathlabs", "dr. lal", "lal pathlabs",
    "metropolis", "srl diagnostics", "srl", "healthians", "redcliffe",
    "narayana", "fortis", "max hospital", "max healthcare", "aiims",
    "medanta", "manipal", "columbia asia", "care hospital", "ruby hall",
    "kokilaben", "wockhardt", "city diagnostics", "nirmal diagnostics",
    "vijaya diagnostics", "neuberg", "suraksha diagnostics", "pathkind",
    "quest diagnostics", "labcorp", "quest", "tata medical", "hcg",
    "aster", "cloudnine", "sparsh", "sakra", "manipal hospital",
]

# High-confidence medical vocabulary
STRONG_MEDICAL_TERMS = [
    "hemoglobin", "haemoglobin", "hba1c", "glucose", "creatinine",
    "cholesterol", "platelet", "leukocyte", "lymphocyte", "neutrophil",
    "eosinophil", "basophil", "monocyte", "hematocrit", "mcv", "mchc", "rdw",
    "bilirubin", "albumin", "triglyceride", "urea", "electrolyte",
    "sgpt", "sgot", "alt", "ast", "alkaline phosphatase", "alp",
    "tsh", "t3", "t4", "thyroxine", "insulin", "cortisol", "prolactin",
    "x-ray", "mri", "ct scan", "ultrasound", "ecg", "eeg", "echo",
    "radiograph", "sonography", "echocardiogram", "mammogram",
    "wbc", "rbc", "cbc", "esr", "crp", "hiv", "hbsag", "vdrl",
    "blood urea nitrogen", "bun", "egfr", "psa", "cea", "ca-125",
    "vitamin d", "vitamin b12", "ferritin", "tibc", "serum iron",
    "urine culture", "stool culture", "blood culture",
    "positive", "negative", "reactive", "non-reactive",
    "mg/dl", "mmol/l", "g/dl", "u/l", "iu/l", "miu/ml", "ng/ml", "pg/ml",
    "complete blood count", "liver function", "kidney function",
    "lipid profile", "thyroid profile", "renal function",
]


# ══════════════════════════════════════════════════════════════════════════════
# REPORT VALIDATION HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    if not OCR_AVAILABLE:
        return ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"PDF text extraction error: {e}")
        return ""


def _extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from a JPG/PNG image using Tesseract OCR."""
    if not OCR_AVAILABLE:
        return ""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        config = r"--oem 3 --psm 3"
        return pytesseract.image_to_string(image, lang="eng", config=config).strip()
    except Exception as e:
        logger.error(f"Image OCR error: {e}")
        return ""


def _extract_text(file_bytes: bytes, content_type: str, filename: str) -> str:
    """Route file to the correct extractor."""
    is_pdf = (content_type == "application/pdf" or filename.lower().endswith(".pdf"))
    return _extract_text_from_pdf(file_bytes) if is_pdf else _extract_text_from_image(file_bytes)


def _detect_medical_fields(text: str) -> list:
    """Return list of medical field labels found in the text."""
    lower = text.lower()
    found = []
    for label, patterns in MEDICAL_FIELD_PATTERNS:
        if any(p in lower for p in patterns):
            found.append(label)
    return found


def _detect_strong_terms(text: str) -> list:
    """Return strong medical vocabulary words found in the text."""
    lower = text.lower()
    return [t for t in STRONG_MEDICAL_TERMS if t in lower]


def _detect_lab_name(text: str) -> Optional[str]:
    """Return first matched known lab/hospital name, or None."""
    lower = text.lower()
    for lab in KNOWN_LABS:
        if lab in lower:
            return lab.title()
    return None


def _has_numeric_values(text: str) -> bool:
    """Check for numeric lab result patterns like '13.5 g/dL'."""
    pattern = r"\d+(\.\d+)?\s*(mg\/dl|mmol\/l|g\/dl|u\/l|iu\/l|%|μl|mm\/hr|ng\/ml|pg\/ml|miu\/ml|cells)"
    return bool(re.search(pattern, text, re.IGNORECASE))


def _compute_score(fields: list, terms: list, lab: Optional[str],
                   has_values: bool, text_len: int) -> int:
    """
    Scoring:
      +5  per medical field found
      +3  per strong term (capped at 30)
      +10 known lab name detected
      +10 numeric lab values found
      +5  text length > 300 chars
    Threshold ≥ 20 = valid
    """
    score = 0
    score += len(fields) * 5
    score += min(len(terms) * 3, 30)
    if lab:        score += 10
    if has_values: score += 10
    if text_len > 300: score += 5
    return score


def validate_medical_report_file(file_bytes: bytes, content_type: str, filename: str) -> dict:
    """
    Full validation pipeline.
    Returns a structured dict — same shape used in the API response.
    """

    # ── 1. File type ──────────────────────────────────────────────────────────
    is_pdf = filename.lower().endswith(".pdf")
    if content_type not in ALLOWED_REPORT_TYPES and not is_pdf:
        return {
            "valid": False,
            "lab_detected": None,
            "fields_found": [],
            "confidence_score": 0,
            "message": (
                f"Invalid file format '{content_type}'. "
                "Please upload a PDF, JPG, or PNG medical report."
            ),
            "error_code": "INVALID_FILE_TYPE",
        }

    # ── 2. Extract text ───────────────────────────────────────────────────────
    extracted_text = _extract_text(file_bytes, content_type, filename)

    # ── 3. Minimum content check ──────────────────────────────────────────────
    if len(extracted_text.strip()) < MIN_TEXT_LENGTH:
        return {
            "valid": False,
            "lab_detected": None,
            "fields_found": [],
            "confidence_score": 0,
            "extracted_text_length": len(extracted_text.strip()),
            "message": (
                "Could not read enough text from the uploaded file. "
                "The image may be blurry or low quality, or the PDF has no text layer. "
                "Please upload a clear, high-quality scan or photo of your report."
            ),
            "error_code": "INSUFFICIENT_TEXT",
        }

    # ── 4. Detect fields, terms, lab ─────────────────────────────────────────
    fields_found  = _detect_medical_fields(extracted_text)
    strong_terms  = _detect_strong_terms(extracted_text)
    lab_detected  = _detect_lab_name(extracted_text)
    has_values    = _has_numeric_values(extracted_text)

    # ── 5. Score & decide ─────────────────────────────────────────────────────
    score    = _compute_score(fields_found, strong_terms, lab_detected, has_values, len(extracted_text))
    is_valid = score >= 20

    if not is_valid:
        if len(fields_found) == 0 and len(strong_terms) == 0:
            reason = (
                "No medical content detected. "
                "This does not appear to be a medical report. "
                "Please upload a valid lab report, prescription, or imaging report."
            )
        elif len(fields_found) < MIN_FIELDS_REQUIRED:
            reason = (
                f"Only {len(fields_found)} medical field(s) found "
                f"(minimum {MIN_FIELDS_REQUIRED} required). "
                "The report may be incomplete or the image quality is too low."
            )
        else:
            reason = "Insufficient medical content. Please upload a complete medical report."

        return {
            "valid": False,
            "lab_detected": lab_detected,
            "fields_found": fields_found,
            "strong_terms_found": strong_terms[:10],
            "confidence_score": score,
            "has_numeric_values": has_values,
            "extracted_text_length": len(extracted_text),
            "message": f"Uploaded file is not a valid medical report. {reason}",
            "error_code": "INVALID_MEDICAL_CONTENT",
        }

    return {
        "valid": True,
        "lab_detected": lab_detected or "Unknown Source",
        "fields_found": fields_found,
        "strong_terms_found": strong_terms[:10],
        "confidence_score": score,
        "has_numeric_values": has_values,
        "extracted_text_length": len(extracted_text),
        "extracted_text": extracted_text,          # used by AI prediction downstream
        "message": "Report appears valid and ready for AI analysis.",
    }


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY
# ══════════════════════════════════════════════════════════════════════════════

async def save_upload(file: UploadFile, subfolder: str) -> str:
    folder = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    ext      = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    path     = os.path.join(folder, filename)
    content  = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return path


# ══════════════════════════════════════════════════════════════════════════════
# REGISTRATION
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/register", status_code=201)
async def register_patient(
    full_name:        str             = Form(...),
    age:              int             = Form(...),
    gender:           str             = Form(...),
    email:            str             = Form(...),
    phone:            str             = Form(...),
    password:         str             = Form(...),
    confirm_password: str             = Form(...),
    blood_group:      Optional[str]   = Form(None),
    address:          Optional[str]   = Form(None),
    height_cm:        Optional[float] = Form(None),
    weight_kg:        Optional[float] = Form(None),
    profile_image:    Optional[UploadFile] = File(None),
    db:               Session         = Depends(get_db),
):
    if not re.match(r"^[A-Za-z\s]{1,100}$", full_name):
        raise HTTPException(400, "Full name must contain letters only")
    if not (0 <= age <= 120):
        raise HTTPException(400, "Age must be 0–120")
    if gender not in ["Male", "Female", "Other"]:
        raise HTTPException(400, "Invalid gender")
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise HTTPException(400, "Invalid email")
    if len(re.sub(r"\D", "", phone)) < 10:
        raise HTTPException(400, "Phone must be at least 10 digits")
    if password != confirm_password:
        raise HTTPException(400, "Passwords do not match")
    if not (
        len(password) >= 8
        and re.search(r"[A-Z]", password)
        and re.search(r"[a-z]", password)
        and re.search(r"\d", password)
        and re.search(r"[!@#$%^&*(),.?\":{}|<>]", password)
    ):
        raise HTTPException(400, "Password must have uppercase, lowercase, number & special char")
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(400, "Email already registered")

    image_path = None
    if profile_image and profile_image.filename:
        if profile_image.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(400, "Profile image must be JPG or PNG")
        image_path = await save_upload(profile_image, "patients/images")

    user = models.User(
        name=full_name, email=email,
        password=hash_password(password),
        role=models.UserRole.patient,
    )
    db.add(user)
    db.flush()

    now = datetime.utcnow()
    patient = models.Patient(
        patient_id=user.user_id, age=age, gender=gender, phone=phone,
        address=address, blood_group=blood_group,
        height_cm=height_cm, weight_kg=weight_kg,
        profile_image=image_path,
        subscription_status=models.SubscriptionStatus.trial,
        subscription_plan=models.SubscriptionPlan.trial,
        trial_start_date=now,
        trial_end_date=now + timedelta(days=models.TRIAL_DAYS),
        predictions_used=0,
    )
    db.add(patient)
    db.add(models.Notification(
        user_id=user.user_id,
        message=f"Welcome {full_name}! Your 14-day free trial has started.",
    ))
    db.commit()

    return {
        "message": "Registration successful! 14-day free trial started.",
        "email": email,
        "name": full_name,
    }


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
def patient_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p   = current_user.patient_profile
    sub = p.get_subscription_info() if p else {}

    recent_recs = (
        db.query(models.AIRecommendation)
        .filter(models.AIRecommendation.patient_id == p.patient_id)
        .order_by(models.AIRecommendation.generated_date.desc())
        .limit(5).all()
        if p else []
    )

    notifications = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == current_user.user_id,
            models.Notification.is_read == False,
        )
        .order_by(models.Notification.date.desc())
        .limit(5).all()
    )

    recent_prescriptions = (
        db.query(models.Prescription)
        .filter(models.Prescription.patient_id == p.patient_id)
        .order_by(models.Prescription.date.desc())
        .limit(2).all()
        if p else []
    )

    recent_reports = (
        db.query(models.MedicalReport)
        .filter(models.MedicalReport.patient_id == p.patient_id)
        .order_by(models.MedicalReport.upload_date.desc())
        .limit(2).all()
        if p else []
    )

    activity = []
    for rx in recent_prescriptions:
        activity.append({
            "type":   "prescription",
            "action": "Prescription added",
            "desc":   f"Dr. {rx.doctor.user.name if rx.doctor else 'Unknown'} added a prescription",
            "time":   rx.date.isoformat() if rx.date else None,
        })
    for rep in recent_reports:
        activity.append({
            "type":   "record",
            "action": "Medical record uploaded",
            "desc":   f"{rep.file_name} uploaded",
            "time":   rep.upload_date.isoformat() if rep.upload_date else None,
        })
    for rec in recent_recs[:2]:
        activity.append({
            "type":   "ai",
            "action": "AI recommendation",
            "desc":   f"New recommendation: {rec.predicted_disease}",
            "time":   rec.generated_date.isoformat() if rec.generated_date else None,
        })
    activity.sort(key=lambda x: x["time"] or "", reverse=True)

    upcoming_prescriptions = (
        db.query(models.Prescription)
        .filter(
            models.Prescription.patient_id == p.patient_id,
            models.Prescription.status == models.PrescriptionStatus.sent,
        ).count()
        if p else 0
    )

    return {
        "patient": {
            "id": current_user.user_id, "name": current_user.name,
            "email": current_user.email, "age": p.age, "gender": p.gender,
            "phone": p.phone, "blood_group": p.blood_group, "address": p.address,
            "height_cm": p.height_cm, "weight_kg": p.weight_kg,
            "profile_image": p.profile_image,
            "bmi": round(p.weight_kg / ((p.height_cm / 100) ** 2), 1)
                   if p.height_cm and p.weight_kg else None,
        },
        "subscription": sub,
        "stats": {
            "total_predictions": db.query(models.AIRecommendation).filter(
                models.AIRecommendation.patient_id == p.patient_id).count() if p else 0,
            "approved_prescriptions": upcoming_prescriptions,
            "medical_reports": db.query(models.MedicalReport).filter(
                models.MedicalReport.patient_id == p.patient_id).count() if p else 0,
            "unread_notifications": len(notifications),
        },
        "recent_recommendations": [{
            "id":         r.recommendation_id,
            "disease":    r.predicted_disease,
            "confidence": r.confidence_score,
            "severity":   r.severity_level,
            "risk":       r.risk_level,
            "date":       r.generated_date.isoformat() if r.generated_date else None,
            "status":     r.status.value,
            "has_prescription": r.prescription is not None,
        } for r in recent_recs],
        "notifications": [{
            "id": n.notification_id, "message": n.message,
            "date": n.date.isoformat(), "is_read": n.is_read,
        } for n in notifications],
        "activity": activity[:6],
    }


# ══════════════════════════════════════════════════════════════════════════════
# PROFILE
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/profile")
def get_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(404, "Profile not found")
    return {
        "id": current_user.user_id, "name": current_user.name,
        "email": current_user.email, "age": p.age, "gender": p.gender,
        "phone": p.phone, "address": p.address, "blood_group": p.blood_group,
        "height_cm": p.height_cm, "weight_kg": p.weight_kg,
        "profile_image": p.profile_image,
        "bmi": round(p.weight_kg / ((p.height_cm / 100) ** 2), 1)
               if p.height_cm and p.weight_kg else None,
    }


class ProfileUpdateRequest(BaseModel):
    name:               Optional[str]   = None
    age:                Optional[int]   = None
    gender:             Optional[str]   = None
    phone:              Optional[str]   = None
    address:            Optional[str]   = None
    blood_group:        Optional[str]   = None
    height_cm:          Optional[float] = None
    weight_kg:          Optional[float] = None
    allergies:          Optional[str]   = None
    chronic_conditions: Optional[str]   = None


@router.put("/profile")
def update_profile(
    req: ProfileUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(404, "Profile not found")

    if req.name:            current_user.name = req.name
    if req.age is not None: p.age = req.age
    if req.gender:          p.gender = req.gender
    if req.phone:           p.phone = req.phone
    if req.address:         p.address = req.address
    if req.blood_group:     p.blood_group = req.blood_group
    if req.height_cm is not None: p.height_cm = req.height_cm
    if req.weight_kg is not None: p.weight_kg = req.weight_kg

    db.commit()
    return {"message": "Profile updated successfully"}


@router.post("/profile/picture")
async def update_profile_picture(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(404, "Profile not found")
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(400, "Only JPG/PNG allowed")

    path = await save_upload(file, "patients/images")
    p.profile_image = path
    db.commit()
    return {"message": "Profile picture updated", "profile_image": path}


# ══════════════════════════════════════════════════════════════════════════════
# MEDICAL RECORDS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/records")
def get_medical_records(
    date: Optional[str] = None,
    record_type: Optional[str] = None,
    doctor: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(404, "Profile not found")

    query = db.query(models.MedicalReport).filter(
        models.MedicalReport.patient_id == p.patient_id
    )
    if date:
        query = query.filter(models.MedicalReport.upload_date >= date)

    records = query.order_by(models.MedicalReport.upload_date.desc()).all()

    return {"records": [{
        "id":        r.report_id,
        "title":     r.file_name,
        "date":      r.upload_date.strftime("%Y-%m-%d") if r.upload_date else None,
        "doctor":    "Self Uploaded",
        "type":      "Document" if r.file_name.endswith(".pdf") else "Image",
        "note":      "",
        "file_path": r.file_path,
    } for r in records]}


@router.post("/records/upload")
async def upload_medical_record(
    file: UploadFile = File(...),
    note: Optional[str] = Form(None),
    record_type: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(404, "Profile not found")

    if file.content_type not in ["application/pdf", "image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(400, "Only PDF, JPG, PNG allowed")

    path   = await save_upload(file, "reports")
    report = models.MedicalReport(
        patient_id=p.patient_id,
        file_name=file.filename,
        file_path=path,
    )
    db.add(report)
    db.add(models.Notification(
        user_id=current_user.user_id,
        message=f"Medical record '{file.filename}' uploaded successfully.",
    ))
    db.commit()
    db.refresh(report)

    return {
        "message": "Record uploaded successfully",
        "record": {
            "id":        report.report_id,
            "title":     report.file_name,
            "date":      report.upload_date.strftime("%Y-%m-%d") if report.upload_date else None,
            "doctor":    "Self Uploaded",
            "type":      "Document" if file.filename.endswith(".pdf") else "Image",
            "note":      note or "",
            "file_path": path,
        },
    }


@router.delete("/records/{record_id}")
def delete_medical_record(
    record_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    record = db.query(models.MedicalReport).filter(
        models.MedicalReport.report_id == record_id,
        models.MedicalReport.patient_id == p.patient_id,
    ).first()
    if not record:
        raise HTTPException(404, "Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}


# ══════════════════════════════════════════════════════════════════════════════
# REPORT VALIDATION ENDPOINT  ← NEW
# POST /patient/validate-report
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/validate-report")
async def validate_report(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """
    Validate a medical report before AI analysis.

    Steps:
      1. Check file type (PDF / JPG / PNG only)
      2. Extract real text using OCR (images) or PyMuPDF (PDFs)
      3. Check minimum text length
      4. Detect medical fields (Patient Name, Age, Test, Result …)
      5. Detect strong medical vocabulary (hemoglobin, mg/dl …)
      6. Detect known lab / hospital names
      7. Score everything and return valid / invalid

    Returns:
      { "valid": true,  "lab_detected": "Thyrocare", "fields_found": [...], ... }
      { "valid": false, "message": "Not a valid medical report", ... }
    """
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")

    # Read file bytes (keep a copy — file stream can only be read once)
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(400, "Uploaded file is empty.")

    if len(file_bytes) > 10 * 1024 * 1024:   # 10 MB hard limit
        return {
            "valid": False,
            "message": "File size exceeds 10 MB. Please upload a smaller file.",
            "error_code": "FILE_TOO_LARGE",
        }

    result = validate_medical_report_file(
        file_bytes=file_bytes,
        content_type=file.content_type or "",
        filename=file.filename or "",
    )

    # Strip extracted_text from the response (don't expose full text to frontend)
    result.pop("extracted_text", None)

    return result


# ══════════════════════════════════════════════════════════════════════════════
# AI PREDICTION  (with built-in report validation when a file is provided)
# ══════════════════════════════════════════════════════════════════════════════

class PredictionRequest(BaseModel):
    age:              int
    temperature:      float
    blood_pressure:   str
    has_diabetes:     bool        = False
    has_hypertension: bool        = False
    symptoms:         List[str]


@router.post("/predict")
def run_prediction(
    request: PredictionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(400, "Patient profile not found")

    sub = p.get_subscription_info()
    if not sub["can_predict"]:
        raise HTTPException(
            403,
            "TRIAL_EXPIRED" if sub.get("trial_expired") else "SUBSCRIPTION_EXPIRED",
        )

    try:
        parts  = request.blood_pressure.strip().split("/")
        bp_sys = int(parts[0])
        bp_dia = int(parts[1])
    except Exception:
        raise HTTPException(400, "Blood pressure must be in format 120/80")

    if not request.symptoms:
        raise HTTPException(400, "At least one symptom is required")

    from ml.predictor import predict
    result = predict(
        age=request.age, temperature=request.temperature,
        bp_systolic=bp_sys, bp_diastolic=bp_dia,
        has_diabetes=request.has_diabetes,
        has_hypertension=request.has_hypertension,
        symptoms=request.symptoms,
    )

    rec = models.AIRecommendation(
        patient_id=p.patient_id,
        symptom_text=json.dumps(request.symptoms),
        result_text=json.dumps(result),
        predicted_disease=result["predicted_disease"],
        confidence_score=result["confidence_score"],
        severity_level=result["severity_level"],
        risk_level=result["risk_level"],
        recommended_treatment=result["recommended_treatment"],
        age=request.age, temperature=request.temperature,
        blood_pressure_systolic=bp_sys, blood_pressure_diastolic=bp_dia,
        has_diabetes=request.has_diabetes,
        has_hypertension=request.has_hypertension,
        status=models.RecommendationStatus.pending,
    )
    db.add(rec)
    p.predictions_used = (p.predictions_used or 0) + 1

    db.add(models.Notification(
        user_id=current_user.user_id,
        message=f"AI Analysis Complete: {result['predicted_disease']} detected. View your recommendations.",
    ))

    doctor = db.query(models.Doctor).filter(
        models.Doctor.verification_status == models.DoctorVerificationStatus.verified
    ).first()
    if doctor:
        rec.doctor_id = doctor.doctor_id
        db.add(models.Notification(
            user_id=doctor.doctor_id,
            message=f"New AI recommendation requires your review. Patient: {current_user.name}",
        ))

    db.commit()
    db.refresh(rec)

    return {
        "recommendation_id": rec.recommendation_id,
        "subscription":      p.get_subscription_info(),
        **result,
    }


# ══════════════════════════════════════════════════════════════════════════════
# RECOMMENDATIONS / PREDICTIONS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/recommendations")
def get_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(400, "Profile not found")

    recs = (
        db.query(models.AIRecommendation)
        .filter(models.AIRecommendation.patient_id == p.patient_id)
        .order_by(models.AIRecommendation.generated_date.desc())
        .all()
    )

    def safe_json(text, fallback):
        if not text or not str(text).strip():
            return fallback
        try:
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
            return fallback

    return {"recommendations": [{
        "id":                    r.recommendation_id,
        "predicted_disease":     r.predicted_disease,
        "confidence_score":      r.confidence_score,
        "severity_level":        r.severity_level,
        "risk_level":            r.risk_level,
        "recommended_treatment": r.recommended_treatment,
        "symptoms":              safe_json(r.symptom_text, []),
        "vitals": {
            "age": r.age, "temperature": r.temperature,
            "bp":  f"{r.blood_pressure_systolic}/{r.blood_pressure_diastolic}",
            "has_diabetes": r.has_diabetes, "has_hypertension": r.has_hypertension,
        },
        "status":      r.status.value,
        "date":        r.generated_date.isoformat() if r.generated_date else None,
        "full_result": safe_json(r.result_text, {}),
        "prescription": {
            "id":               r.prescription.prescription_id,
            "medicine_details": r.prescription.medicine_details,
            "dosage":           r.prescription.dosage,
            "notes":            r.prescription.notes,
            "status":           r.prescription.status.value,
            "date":             r.prescription.date.isoformat() if r.prescription.date else None,
            "doctor":           r.prescription.doctor.user.name if r.prescription.doctor else None,
        } if r.prescription else None,
    } for r in recs]}


@router.get("/predictions")
def get_predictions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(400, "Profile not found")

    recs = (
        db.query(models.AIRecommendation)
        .filter(models.AIRecommendation.patient_id == p.patient_id)
        .order_by(models.AIRecommendation.generated_date.desc())
        .all()
    )

    def safe_json(text):
        """Safely parse JSON — return empty list if text is empty or invalid."""
        if not text or not str(text).strip():
            return []
        try:
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
            return []

    return {"predictions": [{
        "id":                    r.recommendation_id,
        "predicted_disease":     r.predicted_disease,
        "confidence_score":      r.confidence_score,
        "severity_level":        r.severity_level,
        "risk_level":            r.risk_level,
        "recommended_treatment": r.recommended_treatment,
        "symptoms":              safe_json(r.symptom_text),
        "created_at":            r.generated_date.isoformat() if r.generated_date else None,
        "status":                r.status.value,
    } for r in recs]}


# ══════════════════════════════════════════════════════════════════════════════
# PRESCRIPTIONS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/prescriptions")
def get_prescriptions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(404, "Profile not found")

    all_rx = (
        db.query(models.Prescription)
        .filter(models.Prescription.patient_id == p.patient_id)
        .order_by(models.Prescription.date.desc())
        .all()
    )

    now           = datetime.utcnow()
    current_list  = []
    past_list     = []

    for rx in all_rx:
        disease     = rx.recommendation.predicted_disease if rx.recommendation else "General"
        doctor_name = rx.doctor.user.name if rx.doctor else "Unknown Doctor"
        entry = {
            "id":             rx.prescription_id,
            "medication":     rx.medicine_details or "",
            "dosage":         rx.dosage or "",
            "frequency":      "",
            "startDate":      rx.date.strftime("%Y-%m-%d") if rx.date else "",
            "endDate":        rx.approved_at.strftime("%Y-%m-%d") if rx.approved_at else "Ongoing",
            "doctor":         f"Dr. {doctor_name}",
            "specialization": rx.doctor.specialization if rx.doctor else "",
            "notes":          rx.notes or "",
            "status":         rx.status.value,
            "disease":        disease,
            "pdf_path":       rx.pdf_path,
        }
        if rx.status == models.PrescriptionStatus.sent and rx.approved_at:
            (current_list if rx.approved_at >= now - timedelta(days=30) else past_list).append(entry)
        elif rx.status == models.PrescriptionStatus.generated:
            current_list.append(entry)
        else:
            past_list.append(entry)

    return {"current": current_list, "past": past_list}


# ══════════════════════════════════════════════════════════════════════════════
# APPOINTMENTS
# ══════════════════════════════════════════════════════════════════════════════

class AppointmentBookRequest(BaseModel):
    date:   str
    time:   str
    reason: str
    doctor: Optional[str] = None


@router.get("/appointments")
def get_appointments(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")

    notifs = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == current_user.user_id,
            models.Notification.message.like("APPOINTMENT::%"),
        )
        .order_by(models.Notification.date.desc())
        .all()
    )

    upcoming = []
    past     = []
    today    = datetime.utcnow().date()

    for n in notifs:
        try:
            data     = json.loads(n.message.replace("APPOINTMENT::", "", 1))
            apt_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            entry    = {
                "id":       n.notification_id,
                "doctor":   data.get("doctor", "Dr. Available"),
                "specialty": data.get("specialty", "General Physician"),
                "date":     data["date"],
                "time":     data.get("time", ""),
                "reason":   data.get("reason", ""),
                "status":   data.get("status", "Pending"),
            }
            if apt_date >= today:
                upcoming.append(entry)
            else:
                entry["status"] = "Completed"
                past.append(entry)
        except Exception:
            continue

    return {"upcoming": upcoming, "past": past}


@router.post("/appointments/book")
def book_appointment(
    req: AppointmentBookRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")

    payload = json.dumps({
        "date":      req.date, "time": req.time,
        "reason":    req.reason,
        "doctor":    req.doctor or "Dr. Available",
        "specialty": "General Physician",
        "status":    "Pending",
    })
    notif = models.Notification(
        user_id=current_user.user_id,
        message=f"APPOINTMENT::{payload}",
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    return {
        "message": "Appointment booked successfully",
        "appointment": {
            "id":        notif.notification_id,
            "doctor":    req.doctor or "Dr. Available",
            "specialty": "General Physician",
            "date":      req.date, "time": req.time,
            "reason":    req.reason, "status": "Pending",
        },
    }


@router.delete("/appointments/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")

    notif = db.query(models.Notification).filter(
        models.Notification.notification_id == appointment_id,
        models.Notification.user_id == current_user.user_id,
        models.Notification.message.like("APPOINTMENT::%"),
    ).first()
    if not notif:
        raise HTTPException(404, "Appointment not found")
    db.delete(notif)
    db.commit()
    return {"message": "Appointment cancelled"}


# ══════════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/notifications")
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifs = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == current_user.user_id,
            ~models.Notification.message.like("APPOINTMENT::%"),
        )
        .order_by(models.Notification.date.desc())
        .limit(50).all()
    )

    return {"notifications": [{
        "id":      n.notification_id,
        "title":   _notif_title(n.message),
        "message": n.message,
        "time":    _time_ago(n.date),
        "is_read": n.is_read,
    } for n in notifs]}


def _notif_title(msg: str) -> str:
    m = msg.lower()
    if "appointment"  in m: return "Appointment"
    if "prescription" in m: return "Prescription"
    if "ai" in m or "analysis" in m: return "AI Health Alert"
    if "welcome"      in m: return "Welcome"
    if "subscription" in m or "plan" in m: return "Subscription"
    return "Notification"


def _time_ago(dt: datetime) -> str:
    if not dt:
        return ""
    diff = datetime.utcnow() - dt
    if diff.days == 0:
        if diff.seconds < 3600:
            return f"{diff.seconds // 60} minute(s) ago"
        return f"{diff.seconds // 3600} hour(s) ago"
    if diff.days == 1: return "1 day ago"
    if diff.days < 7:  return f"{diff.days} days ago"
    return dt.strftime("%b %d, %Y")


@router.post("/notifications/mark-read")
def mark_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.user_id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# ══════════════════════════════════════════════════════════════════════════════
# LEGACY UPLOAD + FEEDBACK + SUBSCRIPTION
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/upload-report")
async def upload_report(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(400, "Profile not found")

    if file.content_type not in ["application/pdf", "image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(400, "Only PDF, JPG, PNG allowed")

    path   = await save_upload(file, "reports")
    report = models.MedicalReport(
        patient_id=p.patient_id, file_name=file.filename, file_path=path
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message":   "Report uploaded successfully",
        "report_id": report.report_id,
        "file_name": report.file_name,
    }


class FeedbackRequest(BaseModel):
    message: str
    rating:  Optional[int] = None


@router.post("/feedback")
def submit_feedback(
    req: FeedbackRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(400, "Profile not found")
    if req.rating and not (1 <= req.rating <= 5):
        raise HTTPException(400, "Rating must be 1–5")

    fb = models.Feedback(
        patient_id    = p.patient_id,
        doctor_id     = None,
        message       = req.message.strip(),
        rating        = req.rating,
        role          = "patient",
        reviewer_name = current_user.name,
        is_public     = True,
    )
    db.add(fb)
    db.commit()
    return {"message": "Feedback submitted successfully. Thank you!"}


@router.get("/subscription")
def get_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")
    p = current_user.patient_profile
    if not p:
        raise HTTPException(404, "Profile not found")
    return p.get_subscription_info()


class UpgradeRequest(BaseModel):
    plan: str


@router.post("/upgrade-plan")
def upgrade_plan(
    req: UpgradeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")

    plan_map = {
        "basic": "basic", "premium": "premium",
        "Basic": "basic", "Premium": "premium",
    }
    plan_key = plan_map.get(req.plan)
    if not plan_key:
        raise HTTPException(400, "Invalid plan. Choose: Basic or Premium")

    p = current_user.patient_profile
    if not p:
        raise HTTPException(400, "Profile not found")

    plan_enum    = models.SubscriptionPlan[plan_key]
    plan_display = plan_enum.value
    plan_title   = plan_display.title()

    now = datetime.utcnow()
    p.subscription_status = models.SubscriptionStatus.active
    p.subscription_plan   = plan_enum
    p.subscription_start  = now
    p.subscription_end    = now + timedelta(days=30)
    p.predictions_used    = 0

    sub = models.Subscription(
        patient_id=p.patient_id, plan_name=plan_display,
        price=models.PLAN_PRICES.get(plan_display, 0),
        start_date=now.date(),
        end_date=(now + timedelta(days=30)).date(),
        status=models.SubscriptionStatus.active,
    )
    db.add(sub)
    db.add(models.Notification(
        user_id=current_user.user_id,
        message=f"Subscription upgraded to {plan_title} plan. Valid for 30 days.",
    ))
    db.commit()

    return {
        "message":      f"Upgraded to {plan_title} plan!",
        "subscription": p.get_subscription_info(),
    }