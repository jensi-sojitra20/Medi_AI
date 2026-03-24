"""
Run once after setting up MySQL to create demo accounts:
  python seed_db.py
"""
from datetime import datetime, timedelta
from database import engine, SessionLocal
import models
from auth_utils import hash_password

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def create_user_with_profile(full_name, email, password, role, profile_data=None):
    if db.query(models.User).filter(models.User.email == email).first():
        print(f"  Skipping {email} (already exists)")
        return

    user = models.User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=role
    )
    db.add(user)
    db.flush()

    if role == models.UserRole.admin:
        pass  # Admin has no profile
    elif role == models.UserRole.patient and profile_data:
        profile = models.PatientProfile(user_id=user.id, **profile_data)
        db.add(profile)
    elif role == models.UserRole.doctor and profile_data:
        profile = models.DoctorProfile(user_id=user.id, **profile_data)
        db.add(profile)

    db.commit()
    print(f"  Created: {email}")


print("Seeding demo accounts...")

# Admin
create_user_with_profile(
    "System Admin", "admin@medi.ai", "Admin123!", models.UserRole.admin
)

# Doctors
create_user_with_profile(
    "Dr. Sarah Johnson", "doctor1@medi.ai", "Doctor123!", models.UserRole.doctor,
    {"license_number": "MD-12345", "specialization": "Cardiology",
     "experience": 10, "phone": "9876543210", "hospital": "City Heart Hospital",
     "status": models.DoctorStatus.verified}
)
create_user_with_profile(
    "Dr. Michael Chen", "doctor2@medi.ai", "Doctor123!", models.UserRole.doctor,
    {"license_number": "MD-67890", "specialization": "Neurology",
     "experience": 5, "phone": "9876543211", "hospital": "Brain & Spine Clinic",
     "status": models.DoctorStatus.provisional}
)

# Patients
create_user_with_profile(
    "John Doe", "patient1@medi.ai", "Patient123!", models.UserRole.patient,
    {"age": 30, "gender": "Male", "phone": "9876543212", "blood_group": "O+",
     "subscription_status": models.SubscriptionStatus.trial,
     "subscription_plan": models.SubscriptionPlan.trial,
     "trial_start_date": datetime.utcnow(),
     "trial_end_date": datetime.utcnow() + timedelta(days=14),
     "predictions_used": 0}
)
create_user_with_profile(
    "Jane Smith", "patient2@medi.ai", "Patient123!", models.UserRole.patient,
    {"age": 25, "gender": "Female", "phone": "9876543213", "blood_group": "A+",
     "subscription_status": models.SubscriptionStatus.trial,
     "subscription_plan": models.SubscriptionPlan.trial,
     "trial_start_date": datetime.utcnow(),
     "trial_end_date": datetime.utcnow() + timedelta(days=14),
     "predictions_used": 0}
)

db.close()
print("\nSeeding complete!")
print("\nDemo Accounts:")
print("  Admin:   admin@medi.ai    / Admin123!")
print("  Doctor:  doctor1@medi.ai  / Doctor123!  (verified)")
print("  Doctor:  doctor2@medi.ai  / Doctor123!  (provisional)")
print("  Patient: patient1@medi.ai / Patient123! (active subscription)")
print("  Patient: patient2@medi.ai / Patient123! (no subscription)")