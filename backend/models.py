"""
Medi AI – Complete Database Models
Full Data Dictionary implementation
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime,
    Text, Enum, ForeignKey, Date, Double
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime, timedelta
import enum

# ─── Enums ────────────────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    patient = "PATIENT"
    doctor  = "DOCTOR"
    admin   = "ADMIN"

class DoctorVerificationStatus(str, enum.Enum):
    pending  = "PENDING"
    verified = "VERIFIED"
    rejected = "REJECTED"

class RecommendationStatus(str, enum.Enum):
    pending  = "PENDING"
    approved = "APPROVED"
    rejected = "REJECTED"

class PrescriptionStatus(str, enum.Enum):
    generated = "GENERATED"
    sent      = "SENT"

class SubscriptionStatus(str, enum.Enum):
    active    = "ACTIVE"
    expired   = "EXPIRED"
    trial     = "TRIAL"
    cancelled = "CANCELLED"

class SubscriptionPlan(str, enum.Enum):
    trial   = "trial"
    basic   = "basic"
    premium = "premium"

PLAN_PRICES    = {"basic": 299, "premium": 999}
PLAN_FEATURES  = {
    "trial":   {"predictions": 5,  "label": "14-Day Free Trial"},
    "basic":   {"predictions": 30, "label": "Basic Plan – ₹299/mo"},
    "premium": {"predictions": -1, "label": "Premium Plan – ₹999/mo"},
}
TRIAL_DAYS = 14

# ─── USER TABLE ───────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    user_id    = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(100), nullable=False)
    email      = Column(String(100), unique=True, index=True, nullable=False)
    password   = Column(String(255), nullable=False)
    role       = Column(Enum(UserRole), nullable=False)
    is_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    profile_image = Column(String(255), nullable=True)   # used by admin & doctor

    patient_profile   = relationship("Patient",      back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile    = relationship("Doctor",       back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications     = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    chatbot_logs      = relationship("ChatbotLog",   back_populates="user", cascade="all, delete-orphan")

# ─── PATIENT TABLE ────────────────────────────────────────────────────────────
class Patient(Base):
    __tablename__ = "patients"
    patient_id  = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    age         = Column(Integer)
    gender      = Column(String(10))
    phone       = Column(String(15))
    address     = Column(String(200))
    blood_group = Column(String(5))
    height_cm   = Column(Double, nullable=True)
    weight_kg   = Column(Double, nullable=True)
    profile_image = Column(String(255), nullable=True)
    subscription_status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.trial)
    subscription_plan   = Column(Enum(SubscriptionPlan),   default=SubscriptionPlan.trial)
    trial_start_date    = Column(DateTime, nullable=True)
    trial_end_date      = Column(DateTime, nullable=True)
    subscription_start  = Column(DateTime, nullable=True)
    subscription_end    = Column(DateTime, nullable=True)
    predictions_used    = Column(Integer, default=0)

    user               = relationship("User",           back_populates="patient_profile")
    medical_reports    = relationship("MedicalReport",  back_populates="patient", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="patient", cascade="all, delete-orphan")
    prescriptions      = relationship("Prescription",   back_populates="patient", cascade="all, delete-orphan")
    subscriptions      = relationship("Subscription",   back_populates="patient", cascade="all, delete-orphan")
    feedbacks          = relationship("Feedback",       back_populates="patient", cascade="all, delete-orphan")

    def get_subscription_info(self):
        now = datetime.utcnow()
        if self.subscription_status == SubscriptionStatus.trial:
            if self.trial_end_date and now > self.trial_end_date:
                return {"status":"expired","plan":"trial","label":"Trial Expired",
                        "can_predict":False,"days_left":0,"predictions_left":0,"trial_expired":True}
            days_left = max(0,(self.trial_end_date - now).days+1) if self.trial_end_date else 0
            used=self.predictions_used or 0; limit=PLAN_FEATURES["trial"]["predictions"]
            return {"status":"trial","plan":"trial","label":f"Free Trial – {days_left} day(s) left",
                    "can_predict":days_left>0 and used<limit,"days_left":days_left,
                    "trial_expired":False,"predictions_used":used,
                    "predictions_limit":limit,"predictions_left":max(0,limit-used)}
        elif self.subscription_status == SubscriptionStatus.active:
            if self.subscription_end and now > self.subscription_end:
                return {"status":"expired","plan":self.subscription_plan.value,
                        "label":"Subscription Expired","can_predict":False,"days_left":0,"predictions_left":0}
            days_left=(self.subscription_end-now).days+1 if self.subscription_end else 999
            plan=self.subscription_plan.value; limit=PLAN_FEATURES.get(plan, PLAN_FEATURES["trial"])["predictions"]
            used=self.predictions_used or 0; can=limit==-1 or used<limit
            return {"status":"active","plan":plan,"label":PLAN_FEATURES.get(plan, {"label":plan.title()+" Plan"})["label"],
                    "can_predict":can,"days_left":days_left,"predictions_used":used,
                    "predictions_limit":limit if limit!=-1 else "Unlimited",
                    "predictions_left":"Unlimited" if limit==-1 else max(0,limit-used)}
        return {"status":"expired","plan":"none","label":"No Active Plan",
                "can_predict":False,"days_left":0,"predictions_left":0}

# ─── DOCTOR TABLE ─────────────────────────────────────────────────────────────
class Doctor(Base):
    __tablename__ = "doctors"
    doctor_id           = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    specialization      = Column(String(100))
    qualification       = Column(String(100))
    experience_years    = Column(Integer, default=0)
    license_number = Column(String(50), unique=True, nullable=False)
    verification_status = Column(Enum(DoctorVerificationStatus), default=DoctorVerificationStatus.pending)
    hospital            = Column(String(150), nullable=True)
    phone               = Column(String(15), nullable=True)
    id_proof            = Column(String(255), nullable=True)

    user               = relationship("User",             back_populates="doctor_profile")
    ai_recommendations = relationship("AIRecommendation", back_populates="doctor")
    prescriptions      = relationship("Prescription",     back_populates="doctor")
    feedbacks          = relationship("Feedback",         back_populates="doctor")

# ─── MEDICAL REPORT TABLE ─────────────────────────────────────────────────────
class MedicalReport(Base):
    __tablename__ = "medical_reports"
    report_id   = Column(Integer, primary_key=True, autoincrement=True)
    patient_id  = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    file_name   = Column(String(150), nullable=False)
    file_path   = Column(String(255), nullable=False)
    upload_date = Column(DateTime, server_default=func.now())
    patient     = relationship("Patient", back_populates="medical_reports")

# ─── AI RECOMMENDATION TABLE ──────────────────────────────────────────────────
class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    recommendation_id        = Column(Integer, primary_key=True, autoincrement=True)
    patient_id               = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    doctor_id                = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    symptom_text             = Column(Text, nullable=False)
    result_text              = Column(Text, nullable=False)
    predicted_disease        = Column(String(150))
    confidence_score         = Column(Float)
    severity_level           = Column(String(50))
    risk_level               = Column(String(50))
    recommended_treatment    = Column(Text)
    age                      = Column(Integer)
    temperature              = Column(Float)
    blood_pressure_systolic  = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    has_diabetes             = Column(Boolean, default=False)
    has_hypertension         = Column(Boolean, default=False)
    generated_date           = Column(DateTime, server_default=func.now())
    status                   = Column(Enum(RecommendationStatus), default=RecommendationStatus.pending)

    patient      = relationship("Patient",      back_populates="ai_recommendations")
    doctor       = relationship("Doctor",       back_populates="ai_recommendations")
    prescription = relationship("Prescription", back_populates="recommendation", uselist=False)

# ─── PRESCRIPTION TABLE ───────────────────────────────────────────────────────
class Prescription(Base):
    __tablename__ = "prescriptions"
    prescription_id   = Column(Integer, primary_key=True, autoincrement=True)
    patient_id        = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    doctor_id         = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False)
    recommendation_id = Column(Integer, ForeignKey("ai_recommendations.recommendation_id"), nullable=True)
    medicine_details  = Column(Text)
    dosage            = Column(Text)
    pdf_path          = Column(String(255), nullable=True)
    notes             = Column(Text, nullable=True)
    date              = Column(DateTime, server_default=func.now())
    status            = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.generated)
    approved_at       = Column(DateTime, nullable=True)

    patient        = relationship("Patient",          back_populates="prescriptions")
    doctor         = relationship("Doctor",           back_populates="prescriptions")
    recommendation = relationship("AIRecommendation", back_populates="prescription")

# ─── SUBSCRIPTION TABLE ───────────────────────────────────────────────────────
class Subscription(Base):
    __tablename__ = "subscriptions"
    subscription_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id      = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    plan_name       = Column(String(50))
    price           = Column(Double)
    start_date      = Column(Date)
    end_date        = Column(Date)
    status          = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.active)
    patient         = relationship("Patient", back_populates="subscriptions")

# ─── NOTIFICATION TABLE ───────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message         = Column(String(255), nullable=False)
    date            = Column(DateTime, server_default=func.now())
    is_read         = Column(Boolean, default=False)
    user            = relationship("User", back_populates="notifications")

# ─── FEEDBACK TABLE ───────────────────────────────────────────────────────────
class Feedback(Base):
    __tablename__ = "feedbacks"
    feedback_id   = Column(Integer, primary_key=True, autoincrement=True)
    patient_id    = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=True)
    doctor_id     = Column(Integer, ForeignKey("doctors.doctor_id",  ondelete="SET NULL"), nullable=True)
    message       = Column(Text, nullable=False)
    rating        = Column(Integer, nullable=True)
    role          = Column(String(20), default="patient")   # 'patient' | 'doctor'
    reviewer_name = Column(String(150), nullable=True)      # cached name at submission
    is_public     = Column(Boolean, default=True)
    date          = Column(DateTime, server_default=func.now())

    patient = relationship("Patient", back_populates="feedbacks")
    doctor  = relationship("Doctor",  back_populates="feedbacks")

# ─── CHATBOT LOG TABLE ────────────────────────────────────────────────────────
class ChatbotLog(Base):
    __tablename__ = "chatbot_logs"
    chat_id      = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    user_query   = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)
    timestamp    = Column(DateTime, server_default=func.now())
    user         = relationship("User", back_populates="chatbot_logs")