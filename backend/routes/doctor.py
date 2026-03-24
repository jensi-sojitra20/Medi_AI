from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import get_db
from auth_utils import hash_password, get_current_user
import models, re, os, uuid, json

router     = APIRouter()
UPLOAD_DIR = "uploads"


# ── Safe JSON helper ──────────────────────────────────────────────────────────
def safe_json(text, default=None):
    """Parse JSON string safely. Returns `default` on None, empty, or bad JSON."""
    if default is None:
        default = {}
    if not text or not str(text).strip():
        return default
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError, ValueError):
        return default


# ── File upload helper ────────────────────────────────────────────────────────
async def save_upload(file, subfolder):
    folder = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    ext  = os.path.splitext(file.filename)[1]
    path = os.path.join(folder, f"{uuid.uuid4().hex}{ext}")
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return path


# ═════════════════════════════════════════════════════════════════════════════
# SPECIALIZATION → DISEASE MAPPING
# Maps doctor specializations to the disease keywords they should handle.
# When a patient runs a prediction, assign_doctor_to_recommendation() picks
# the best-matching verified doctor for that disease.
# ═════════════════════════════════════════════════════════════════════════════
SPECIALIZATION_DISEASE_MAP = {
    "General Medicine": [
        "fever", "flu", "cold", "infection", "viral", "bacterial",
        "fatigue", "malaise", "dengue", "typhoid", "malaria", "covid",
        "common cold", "influenza", "pneumonia", "body ache", "weakness",
        "diarrhea", "diarrhoea", "gastroenteritis", "dehydration",
        "anemia", "anaemia", "vitamin deficiency",
    ],
    "Cardiology": [
        "heart", "cardiac", "arrhythmia", "angina", "myocardial",
        "hypertension", "high blood pressure", "chest pain", "palpitation",
        "heart failure", "coronary", "atherosclerosis", "atrial fibrillation",
        "bradycardia", "tachycardia", "stroke", "cardiovascular",
    ],
    "Neurology": [
        "migraine", "headache", "seizure", "epilepsy", "stroke", "parkinson",
        "alzheimer", "dementia", "neuropathy", "multiple sclerosis",
        "bell's palsy", "meningitis", "encephalitis", "vertigo", "dizziness",
        "tremor", "numbness", "tingling", "nerve", "brain",
    ],
    "Orthopedics": [
        "fracture", "bone", "joint", "arthritis", "osteoporosis",
        "back pain", "spine", "disc", "ligament", "tendon", "cartilage",
        "knee", "hip", "shoulder", "neck pain", "scoliosis", "gout",
        "rheumatoid", "musculoskeletal",
    ],
    "Pediatrics": [
        "child", "infant", "toddler", "pediatric", "neonatal", "adolescent",
        "growth disorder", "childhood", "measles", "chickenpox", "whooping cough",
        "croup", "hand foot mouth", "rsv",
    ],
    "Dermatology": [
        "skin", "rash", "eczema", "psoriasis", "acne", "dermatitis",
        "urticaria", "hives", "fungal", "ringworm", "tinea", "vitiligo",
        "melanoma", "wart", "herpes", "scabies", "cellulitis",
        "hair loss", "alopecia",
    ],
    "Gynecology": [
        "gynecology", "obstetrics", "pregnancy", "menstrual", "pcod", "pcos",
        "endometriosis", "ovarian", "uterine", "cervical", "vaginal",
        "menopause", "fertility", "ovulation", "uterus", "fibroids",
        "irregular periods",
    ],
    "Oncology": [
        "cancer", "tumor", "malignant", "benign", "carcinoma", "lymphoma",
        "leukemia", "sarcoma", "melanoma", "oncology", "chemotherapy",
        "metastasis", "biopsy",
    ],
    "Psychiatry": [
        "anxiety", "depression", "mental health", "bipolar", "schizophrenia",
        "ocd", "ptsd", "panic", "phobia", "insomnia", "sleep disorder",
        "eating disorder", "addiction", "substance", "stress", "psychosis",
        "hallucination",
    ],
    "Radiology": [
        "xray", "x-ray", "mri", "ct scan", "ultrasound", "imaging",
        "radiograph", "sonography", "mammogram",
    ],
    "Surgery": [
        "appendicitis", "hernia", "gallstone", "gallbladder", "surgical",
        "abscess", "obstruction", "perforation", "peritonitis",
    ],
    "ENT": [
        "ear", "nose", "throat", "sinusitis", "tonsillitis", "otitis",
        "hearing loss", "tinnitus", "vertigo", "epistaxis", "laryngitis",
        "pharyngitis", "adenoid", "deviated septum",
    ],
    "Ophthalmology": [
        "eye", "vision", "cataract", "glaucoma", "conjunctivitis", "retinal",
        "macular", "myopia", "astigmatism", "diabetic retinopathy",
        "uveitis", "stye",
    ],
    "Urology": [
        "kidney stone", "urinary", "uti", "bladder", "prostate", "kidney",
        "renal", "incontinence", "hematuria", "urethritis", "cystitis",
        "pyelonephritis",
    ],
    "Nephrology": [
        "chronic kidney", "ckd", "renal failure", "dialysis", "glomerulonephritis",
        "nephrotic", "nephritis", "proteinuria", "kidney disease", "creatinine",
    ],
    "Endocrinology": [
        "diabetes", "diabetic", "thyroid", "hypothyroid", "hyperthyroid",
        "hypoglycemia", "hyperglycemia", "insulin", "adrenal", "cushing",
        "acromegaly", "hormonal", "pituitary", "hba1c",
    ],
    "Pulmonology": [
        "asthma", "copd", "bronchitis", "pneumonia", "tuberculosis", "tb",
        "lung", "respiratory", "shortness of breath", "breathlessness",
        "pleural", "pulmonary fibrosis", "sleep apnea", "wheezing",
        "bronchiectasis",
    ],
    "Gastroenterology": [
        "liver", "hepatitis", "cirrhosis", "jaundice", "stomach", "gut",
        "ibs", "crohn", "colitis", "ulcer", "peptic", "gastritis",
        "acid reflux", "gerd", "constipation", "vomiting", "nausea",
        "abdominal pain", "fatty liver", "pancreatitis", "sgpt", "sgot",
    ],
    "Rheumatology": [
        "rheumatoid arthritis", "lupus", "sle", "gout", "fibromyalgia",
        "ankylosing spondylitis", "sjogren", "vasculitis", "autoimmune",
    ],
    "Hematology": [
        "blood disorder", "anemia", "sickle cell", "thalassemia",
        "hemophilia", "thrombocytopenia", "platelet", "leukemia",
        "lymphoma", "bleeding disorder", "coagulation", "dvt",
    ],
}


def find_best_doctor(disease: str, db: Session) -> Optional[int]:
    """
    Given a predicted disease string, find the best verified doctor
    whose specialization matches the disease keywords.

    Priority:
      1. Exact specialization keyword match (scored by number of keyword hits)
      2. Fallback to any verified General Medicine doctor
      3. Fallback to ANY verified doctor

    Returns doctor_id (int) or None if no verified doctor exists.
    """
    if not disease:
        disease = ""
    disease_lower = disease.lower()

    # Fetch all verified, non-blocked doctors
    verified_doctors = (
        db.query(models.Doctor)
        .join(models.User, models.User.user_id == models.Doctor.doctor_id)
        .filter(
            models.Doctor.verification_status == models.DoctorVerificationStatus.verified,
            models.User.is_blocked == False,
        )
        .all()
    )

    if not verified_doctors:
        return None

    # Score each doctor based on keyword hits
    best_doctor_id = None
    best_score = 0

    for doc in verified_doctors:
        spec = (doc.specialization or "").strip()
        keywords = SPECIALIZATION_DISEASE_MAP.get(spec, [])
        score = sum(1 for kw in keywords if kw in disease_lower)

        if score > best_score:
            best_score = score
            best_doctor_id = doc.doctor_id

    if best_score > 0:
        return best_doctor_id

    # Fallback 1: General Medicine doctor
    for doc in verified_doctors:
        if (doc.specialization or "").strip() == "General Medicine":
            return doc.doctor_id

    # Fallback 2: Any verified doctor (round-robin by least load)
    # Pick the doctor with the fewest assigned pending recommendations
    least_loaded = min(
        verified_doctors,
        key=lambda doc: db.query(models.AIRecommendation).filter(
            models.AIRecommendation.doctor_id == doc.doctor_id,
            models.AIRecommendation.status == models.RecommendationStatus.pending,
        ).count(),
    )
    return least_loaded.doctor_id


def assign_doctor_to_recommendation(rec_id: int, disease: str, db: Session) -> Optional[int]:
    """
    Assigns a verified doctor to an AIRecommendation based on the predicted
    disease. Updates the record in-place. Returns the assigned doctor_id or None.
    """
    doctor_id = find_best_doctor(disease, db)

    if doctor_id:
        rec = db.query(models.AIRecommendation).filter(
            models.AIRecommendation.recommendation_id == rec_id
        ).first()
        if rec:
            rec.doctor_id = doctor_id
            db.commit()

    return doctor_id


# ═════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINT: called by the patient prediction flow to assign a doctor
# POST /doctor/assign  { "recommendation_id": int, "disease": str }
# ═════════════════════════════════════════════════════════════════════════════
class AssignDoctorRequest(BaseModel):
    recommendation_id: int
    disease: str

@router.post("/assign")
def assign_doctor(
    req: AssignDoctorRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Assign a verified doctor to a patient's AI recommendation based on the
    predicted disease and doctor specialization. Called automatically after
    the AI prediction is saved.
    """
    if current_user.role != models.UserRole.patient:
        raise HTTPException(403, "Patient access only")

    rec = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.recommendation_id == req.recommendation_id,
        models.AIRecommendation.patient_id == current_user.patient_profile.patient_id,
    ).first()
    if not rec:
        raise HTTPException(404, "Recommendation not found")

    doctor_id = assign_doctor_to_recommendation(req.recommendation_id, req.disease, db)

    if doctor_id:
        # Notify the assigned doctor
        try:
            db.add(models.Notification(
                user_id=doctor_id,
                message=(
                    f"New patient AI report assigned to you: "
                    f"{current_user.name} — Predicted: {req.disease}. "
                    f"Please review in your dashboard."
                ),
            ))
            db.commit()
        except Exception:
            pass
        return {"message": "Doctor assigned successfully", "doctor_id": doctor_id}
    else:
        return {"message": "No verified doctor available yet", "doctor_id": None}


# ═════════════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINT: re-assign all unassigned recommendations
# POST /doctor/assign-all-unassigned  (admin only, useful for backfill)
# ═════════════════════════════════════════════════════════════════════════════
@router.post("/assign-all-unassigned")
def assign_all_unassigned(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Backfill: assign verified doctors to all AIRecommendation rows where
    doctor_id is NULL. Run once after adding the first verified doctor.
    Admin-only.
    """
    if current_user.role != models.UserRole.admin:
        raise HTTPException(403, "Admin access only")

    unassigned = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.doctor_id == None  # noqa: E711
    ).all()

    assigned_count = 0
    for rec in unassigned:
        doctor_id = find_best_doctor(rec.predicted_disease or "", db)
        if doctor_id:
            rec.doctor_id = doctor_id
            assigned_count += 1

            # Notify doctor
            try:
                db.add(models.Notification(
                    user_id=doctor_id,
                    message=(
                        f"A backfilled patient report has been assigned to you: "
                        f"Predicted condition: {rec.predicted_disease}. "
                        f"Please review in your dashboard."
                    ),
                ))
            except Exception:
                pass

    db.commit()
    return {
        "message": f"Assigned {assigned_count} of {len(unassigned)} unassigned recommendations",
        "total_unassigned": len(unassigned),
        "assigned": assigned_count,
    }


# ── Format helper shared by pending / all predictions endpoints ───────────────
def _fmt_rec(r):
    """Safely format an AIRecommendation row into a dict."""
    symptoms    = safe_json(r.symptom_text,  default=[])
    full_result = safe_json(getattr(r, "result_text", None), default={})

    try:
        patient_name = r.patient.user.name
    except Exception:
        patient_name = "Unknown"

    has_prescription = bool(
        getattr(r, "prescription", None) or
        getattr(r, "prescriptions", None)
    )

    presc = getattr(r, "prescription", None)
    presc_detail = None
    if presc:
        presc_detail = {
            "medicine_details": getattr(presc, "medicine_details", None),
            "dosage":           getattr(presc, "dosage", None),
            "notes":            getattr(presc, "notes", None),
            "date":             presc.approved_at.isoformat() if getattr(presc, "approved_at", None) else None,
        }

    return {
        "id":               r.recommendation_id,
        "patient_id":       r.patient_id,
        "patient_name":     patient_name,
        "patient_age":      getattr(r, "age", None),
        "disease":          r.predicted_disease,
        "confidence":       r.confidence_score,
        "severity":         getattr(r, "severity_level", None),
        "risk":             getattr(r, "risk_level", None),
        "symptoms":         symptoms,
        "full_result":      full_result,
        "treatment":        r.recommended_treatment,
        "blood_pressure":   (
            f"{r.blood_pressure_systolic}/{r.blood_pressure_diastolic}"
            if getattr(r, "blood_pressure_systolic", None) else None
        ),
        "temperature":      getattr(r, "temperature", None),
        "status":           r.status.value if hasattr(r.status, "value") else str(r.status),
        "has_prescription": has_prescription,
        "prescription":     presc_detail,
        "date":             r.generated_date.isoformat() if getattr(r, "generated_date", None) else None,
    }


# ═════════════════════════════════════════════════════════════════════════════
# REGISTER
# ═════════════════════════════════════════════════════════════════════════════
@router.post("/register", status_code=201)
async def register_doctor(
    full_name:        str  = Form(...),
    email:            str  = Form(...),
    password:         str  = Form(...),
    confirm_password: str  = Form(...),
    specialization:   str  = Form(...),
    qualification:    str  = Form(...),
    experience_years: int  = Form(...),
    license_number:   str  = Form(...),
    hospital:         Optional[str] = Form(None),
    phone:            Optional[str] = Form(None),
    id_proof:         Optional[UploadFile] = File(None),
    db:               Session = Depends(get_db)
):
    if not re.match(r"^[A-Za-z\s]{1,100}$", full_name):
        raise HTTPException(400, "Invalid name")
    if password != confirm_password:
        raise HTTPException(400, "Passwords do not match")
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(models.Doctor).filter(models.Doctor.license_number == license_number).first():
        raise HTTPException(400, "License number already registered")

    proof_path = None
    if id_proof and id_proof.filename:
        proof_path = await save_upload(id_proof, "doctors/id_proofs")

    user = models.User(
        name=full_name, email=email,
        password=hash_password(password), role=models.UserRole.doctor
    )
    db.add(user); db.flush()

    doctor = models.Doctor(
        doctor_id=user.user_id, specialization=specialization,
        qualification=qualification, experience_years=experience_years,
        license_number=license_number, hospital=hospital, phone=phone,
        id_proof=proof_path,
        verification_status=models.DoctorVerificationStatus.pending
    )
    db.add(doctor)
    db.add(models.Notification(user_id=user.user_id,
        message="Registration received! Awaiting admin verification. You'll be notified soon."))
    db.commit()

    return {"message": "Doctor registered. Awaiting verification.", "email": email}


# ═════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═════════════════════════════════════════════════════════════════════════════
@router.get("/dashboard")
def doctor_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d = current_user.doctor_profile
    if not d:
        raise HTTPException(400, "Doctor profile not found")

    pending_recs = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.doctor_id == d.doctor_id,
        models.AIRecommendation.status    == models.RecommendationStatus.pending
    ).order_by(models.AIRecommendation.generated_date.desc()).all()

    approved_count = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.doctor_id == d.doctor_id,
        models.AIRecommendation.status    == models.RecommendationStatus.approved
    ).count()

    total_patients = db.query(models.AIRecommendation.patient_id).filter(
        models.AIRecommendation.doctor_id == d.doctor_id
    ).distinct().count()

    return {
        "doctor": {
            "id":                  current_user.user_id,
            "name":                current_user.name,
            "email":               current_user.email,
            "specialization":      d.specialization,
            "qualification":       d.qualification,
            "experience":          d.experience_years,
            "license":             d.license_number,
            "hospital":            d.hospital,
            "phone":               d.phone,
            "status":              d.verification_status.value,
        },
        "stats": {
            "pendingReviews":           len(pending_recs),
            "approvedPrescriptions":    approved_count,
            "totalPatients":            total_patients,
        },
        "pending_recommendations": [
            {
                "id":           r.recommendation_id,
                "patient_name": r.patient.user.name,
                "patient_age":  r.age,
                "disease":      r.predicted_disease,
                "confidence":   r.confidence_score,
                "severity":     getattr(r, "severity_level", None),
                "risk":         getattr(r, "risk_level", None),
                "symptoms":     safe_json(r.symptom_text, default=[]),
                "vitals": {
                    "temperature":    getattr(r, "temperature", None),
                    "bp":             (
                        f"{r.blood_pressure_systolic}/{r.blood_pressure_diastolic}"
                        if getattr(r, "blood_pressure_systolic", None) else None
                    ),
                    "has_diabetes":   getattr(r, "has_diabetes", None),
                    "has_hypertension": getattr(r, "has_hypertension", None),
                },
                "ai_treatment": r.recommended_treatment,
                "date":         r.generated_date.isoformat() if r.generated_date else None,
            }
            for r in pending_recs
        ]
    }


# ═════════════════════════════════════════════════════════════════════════════
# PENDING PREDICTIONS  (GET /doctor/pending-predictions)
# ═════════════════════════════════════════════════════════════════════════════
@router.get("/pending-predictions")
def get_pending_predictions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d = current_user.doctor_profile
    if not d:
        raise HTTPException(400, "Doctor profile not found")

    recs = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.doctor_id == d.doctor_id,
        models.AIRecommendation.status    == models.RecommendationStatus.pending
    ).order_by(models.AIRecommendation.generated_date.desc()).all()

    return {"predictions": [_fmt_rec(r) for r in recs]}


# ═════════════════════════════════════════════════════════════════════════════
# ALL PREDICTIONS  (GET /doctor/all-predictions)
# ═════════════════════════════════════════════════════════════════════════════
@router.get("/all-predictions")
def get_all_predictions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d = current_user.doctor_profile
    if not d:
        raise HTTPException(400, "Doctor profile not found")

    recs = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.doctor_id == d.doctor_id
    ).order_by(models.AIRecommendation.generated_date.desc()).all()

    return {"predictions": [_fmt_rec(r) for r in recs]}


# ═════════════════════════════════════════════════════════════════════════════
# MY PATIENTS  (GET /doctor/my-patients)
# ═════════════════════════════════════════════════════════════════════════════
@router.get("/my-patients")
def get_my_patients(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d = current_user.doctor_profile
    if not d:
        raise HTTPException(400, "Doctor profile not found")

    recs = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.doctor_id == d.doctor_id
    ).all()

    seen    = set()
    patients = []
    for r in recs:
        pid = r.patient_id
        if pid in seen:
            continue
        seen.add(pid)

        patient = r.patient
        user    = patient.user if patient else None
        if not user:
            continue

        pending_count = sum(
            1 for x in recs
            if x.patient_id == pid
            and x.status == models.RecommendationStatus.pending
        )

        latest = next(
            (x for x in sorted(recs, key=lambda x: x.generated_date or datetime.min, reverse=True)
             if x.patient_id == pid),
            None
        )

        patients.append({
            "id":              pid,
            "name":            user.name,
            "email":           user.email,
            "phone":           getattr(patient, "phone", None),
            "age":             getattr(patient, "age", None),
            "gender":          getattr(patient, "gender", None),
            "blood_group":     getattr(patient, "blood_group", None),
            "bmi":             getattr(patient, "bmi", None),
            "height_cm":       getattr(patient, "height_cm", None),
            "weight_kg":       getattr(patient, "weight_kg", None),
            "subscription":    getattr(patient, "subscription_status", "active"),
            "last_disease":    latest.predicted_disease if latest else None,
            "last_visit":      latest.generated_date.isoformat() if latest and latest.generated_date else None,
            "total_reports":   sum(1 for x in recs if x.patient_id == pid),
            "pending_reports": pending_count,
        })

    return {"patients": patients}


# ═════════════════════════════════════════════════════════════════════════════
# PRESCRIBE / APPROVE  (POST /doctor/prescribe)
# ═════════════════════════════════════════════════════════════════════════════
class PrescribeRequest(BaseModel):
    prediction_id:    int
    final_treatment:  Optional[str] = None
    medicine_details: Optional[str] = None
    dosage:           Optional[str] = "As prescribed"
    notes:            Optional[str] = None
    status:           Optional[str] = "approved"

@router.post("/prescribe")
def prescribe(
    req: PrescribeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d = current_user.doctor_profile
    if not d:
        raise HTTPException(400, "Doctor profile not found")

    rec = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.recommendation_id == req.prediction_id,
        models.AIRecommendation.doctor_id         == d.doctor_id
    ).first()
    if not rec:
        raise HTTPException(404, "Recommendation not found")

    rec.status = models.RecommendationStatus.approved

    existing_presc = db.query(models.Prescription).filter(
        models.Prescription.recommendation_id == req.prediction_id
    ).first()

    if existing_presc:
        existing_presc.medicine_details = req.medicine_details or rec.recommended_treatment
        existing_presc.dosage           = req.dosage or "As prescribed"
        existing_presc.notes            = req.notes
        existing_presc.approved_at      = datetime.utcnow()
    else:
        presc = models.Prescription(
            patient_id=rec.patient_id,
            doctor_id=d.doctor_id,
            recommendation_id=req.prediction_id,
            medicine_details=req.medicine_details or rec.recommended_treatment,
            dosage=req.dosage or "As prescribed",
            notes=req.notes,
            status=models.PrescriptionStatus.sent,
            approved_at=datetime.utcnow()
        )
        db.add(presc)

    try:
        patient_user_id = rec.patient.user.user_id
        db.add(models.Notification(
            user_id=patient_user_id,
            message=(
                f"Dr. {current_user.name} has approved your report for "
                f"{rec.predicted_disease} and issued a prescription."
            )
        ))
    except Exception:
        pass

    db.commit()
    return {"message": "Prescription created successfully", "prediction_id": req.prediction_id}


# ═════════════════════════════════════════════════════════════════════════════
# REJECT PREDICTION  (POST /doctor/reject-prediction)
# ═════════════════════════════════════════════════════════════════════════════
class RejectRequest(BaseModel):
    prediction_id: int
    reason:        Optional[str] = None

@router.post("/reject-prediction")
def reject_prediction(
    req: RejectRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d = current_user.doctor_profile
    if not d:
        raise HTTPException(400, "Doctor profile not found")

    rec = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.recommendation_id == req.prediction_id,
        models.AIRecommendation.doctor_id         == d.doctor_id
    ).first()
    if not rec:
        raise HTTPException(404, "Recommendation not found")

    rec.status = models.RecommendationStatus.rejected

    try:
        patient_user_id = rec.patient.user.user_id
        db.add(models.Notification(
            user_id=patient_user_id,
            message=(
                f"Dr. {current_user.name} has reviewed your case"
                + (f": {req.reason}" if req.reason else ".")
                + " Please consult in-person for further evaluation."
            )
        ))
    except Exception:
        pass

    db.commit()
    return {"message": "Recommendation rejected", "prediction_id": req.prediction_id}


# ═════════════════════════════════════════════════════════════════════════════
# UPDATE PROFILE  (PUT /doctor/profile)
# ═════════════════════════════════════════════════════════════════════════════
class ProfileUpdateRequest(BaseModel):
    name:          Optional[str] = None
    phone:         Optional[str] = None
    hospital:      Optional[str] = None
    qualification: Optional[str] = None
    experience:    Optional[int] = None

@router.put("/profile")
def update_profile(
    req: ProfileUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d = current_user.doctor_profile
    if not d:
        raise HTTPException(400, "Doctor profile not found")

    if req.name:
        current_user.name = req.name
    if req.phone is not None:
        d.phone = req.phone
    if req.hospital is not None:
        d.hospital = req.hospital
    if req.qualification is not None:
        d.qualification = req.qualification
    if req.experience is not None:
        d.experience_years = req.experience

    db.commit()
    db.refresh(current_user)
    db.refresh(d)

    return {
        "message": "Profile updated successfully",
        "doctor": {
            "name":          current_user.name,
            "email":         current_user.email,
            "phone":         d.phone,
            "hospital":      d.hospital,
            "qualification": d.qualification,
            "experience":    d.experience_years,
            "specialization": d.specialization,
            "license":       d.license_number,
            "status":        d.verification_status.value,
        }
    }


# ═════════════════════════════════════════════════════════════════════════════
# LEGACY: review recommendation (kept for backward compatibility)
# ═════════════════════════════════════════════════════════════════════════════
class ReviewRequest(BaseModel):
    action:           str
    notes:            Optional[str] = None
    medicine_details: Optional[str] = None
    dosage:           Optional[str] = None

@router.post("/recommendation/{rec_id}/review")
def review_recommendation(
    rec_id: int,
    req: ReviewRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    d   = current_user.doctor_profile
    rec = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.recommendation_id == rec_id,
        models.AIRecommendation.doctor_id         == d.doctor_id
    ).first()
    if not rec:
        raise HTTPException(404, "Recommendation not found")

    if req.action == "approve":
        rec.status = models.RecommendationStatus.approved
        presc = models.Prescription(
            patient_id=rec.patient_id, doctor_id=d.doctor_id,
            recommendation_id=rec_id,
            medicine_details=req.medicine_details or rec.recommended_treatment,
            dosage=req.dosage or "As prescribed",
            notes=req.notes,
            status=models.PrescriptionStatus.sent,
            approved_at=datetime.utcnow()
        )
        db.add(presc)
        db.add(models.Notification(user_id=rec.patient.user.user_id,
            message=(
                f"Dr. {current_user.name} has approved your recommendation "
                f"for {rec.predicted_disease} and issued a prescription."
            )))
    else:
        rec.status = models.RecommendationStatus.rejected
        db.add(models.Notification(user_id=rec.patient.user.user_id,
            message=(
                f"Dr. {current_user.name} has reviewed your case. "
                "Please consult in-person for further evaluation."
            )))

    db.commit()
    return {"message": f"Recommendation {req.action}d successfully"}


# ═════════════════════════════════════════════════════════════════════════════
# DOCTOR FEEDBACK
# ═════════════════════════════════════════════════════════════════════════════
class DoctorFeedbackRequest(BaseModel):
    message: str
    rating:  Optional[int] = None

@router.post("/feedback")
def submit_doctor_feedback(
    req: DoctorFeedbackRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.doctor:
        raise HTTPException(403, "Doctor access only")
    if req.rating and not (1 <= req.rating <= 5):
        raise HTTPException(400, "Rating must be 1–5")
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")

    d = current_user.doctor_profile
    fb = models.Feedback(
        doctor_id     = d.doctor_id if d else None,
        patient_id    = None,
        message       = req.message.strip(),
        rating        = req.rating,
        role          = "doctor",
        reviewer_name = current_user.name,
        is_public     = True,
    )
    db.add(fb)
    db.commit()
    return {"message": "Feedback submitted successfully. Thank you!"}