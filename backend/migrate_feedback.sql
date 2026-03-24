-- ═══════════════════════════════════════════════════════════
-- Migration: Update feedbacks table for full feature support
-- Run ONCE on your MySQL database
-- ═══════════════════════════════════════════════════════════

-- Add new columns (skip if already added)
ALTER TABLE feedbacks
  ADD COLUMN IF NOT EXISTS doctor_id    INT          NULL        AFTER patient_id,
  ADD COLUMN IF NOT EXISTS role         VARCHAR(20)  NOT NULL DEFAULT 'patient' AFTER doctor_id,
  ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(150) NULL       AFTER role,
  ADD COLUMN IF NOT EXISTS is_public    TINYINT(1)   NOT NULL DEFAULT 1 AFTER reviewer_name;

-- Add FK if not already present
ALTER TABLE feedbacks
  ADD CONSTRAINT fk_feedback_doctor
    FOREIGN KEY IF NOT EXISTS (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL;

-- Make sure rating exists
ALTER TABLE feedbacks MODIFY COLUMN rating INT NULL;

-- Verify result
DESC feedbacks;
