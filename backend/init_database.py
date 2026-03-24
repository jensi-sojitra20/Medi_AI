"""Database Initialization Script for MediAI"""
from database import engine, Base
import models
from sqlalchemy import text


def init_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")

    # ── Safe column migrations (ADD COLUMN IF NOT EXISTS) ────────────────────
    # Adds new columns to existing tables without breaking existing data
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) NULL",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception as e:
                # Column likely already exists — safe to ignore
                print(f"  (migration note: {e})")

    print("\nTables created:")
    tables = ["users", "patients", "doctors", "medical_reports",
              "ai_recommendations", "prescriptions", "subscriptions",
              "notifications", "feedbacks", "chatbot_logs"]
    for table in tables:
        print(f"  ✓ {table}")


if __name__ == "__main__":
    init_database()
