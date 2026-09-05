-- ====================================================================
-- Student Academic Performance Prediction & Advisory System
-- PostgreSQL Relational Database Schema
-- ====================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
DROP TABLE IF EXISTS internal_external_marks CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'educator', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. PROFILES TABLE (Dual-Profile: School vs College)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_type VARCHAR(20) NOT NULL CHECK (profile_type IN ('school', 'college')),
    student_name VARCHAR(255) NOT NULL,
    identifier VARCHAR(100) UNIQUE NOT NULL, -- e.g., SCH-2026-001 or COL-2026-001
    grade_or_semester VARCHAR(50) NOT NULL,  -- e.g., 'Grade 10', 'Grade 12', 'Semester 4'
    cumulative_score NUMERIC(5, 2) DEFAULT 0.00, -- Scaled 0-100% or GPA
    target_score NUMERIC(5, 2) DEFAULT 75.00,
    study_hours_per_week NUMERIC(4, 1) DEFAULT 15.0,
    screen_time_hours NUMERIC(4, 1) DEFAULT 4.0,
    risk_status VARCHAR(30) DEFAULT 'On Track' CHECK (risk_status IN ('On Track', 'Critical', 'At Risk')),
    failure_probability NUMERIC(4, 3) DEFAULT 0.050,
    last_ai_suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_type ON profiles(profile_type);
CREATE INDEX idx_profiles_risk ON profiles(risk_status);
CREATE INDEX idx_profiles_identifier ON profiles(identifier);

-- 3. ATTENDANCE_LOGS TABLE
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late')),
    attendance_percentage NUMERIC(5, 2) NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_profile_id ON attendance_logs(profile_id);
CREATE INDEX idx_attendance_date ON attendance_logs(recorded_date);

-- 4. INTERNAL_EXTERNAL_MARKS TABLE
CREATE TABLE internal_external_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject_name VARCHAR(120) NOT NULL,
    internal_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (internal_score >= 0),
    external_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (external_score >= 0),
    max_internal NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    max_external NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    credit_hours NUMERIC(3, 1) DEFAULT 3.0, -- Applicable to College Mode
    letter_grade VARCHAR(5),                -- A, B, C, D, F
    standardized_percentage NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marks_profile_id ON internal_external_marks(profile_id);
CREATE INDEX idx_marks_subject ON internal_external_marks(subject_name);
