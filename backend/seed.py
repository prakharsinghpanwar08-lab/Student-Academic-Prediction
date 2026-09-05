"""
Database Seeding Script (seed.py).
Populates the database with >= 50 mock school profiles and >= 50 mock college profiles
with realistic risk distributions (At Risk, Critical, On Track), historical attendance logs,
subject internal/external marks, and tailored AI suggestions.
"""

import sys
import os
import random
from datetime import date, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, SessionLocal, Base
from app.db.models import User, Profile, AttendanceLog, InternalExternalMark
from app.services.ml_engine import ml_engine
from app.services.normalizer import normalizer

FIRST_NAMES = [
    "Aarav", "Ananya", "Dev", "Isha", "Rohan", "Diya", "Kabir", "Meera", "Arjun", "Pooja",
    "Aditya", "Riya", "Kavya", "Vihaan", "Tanvi", "Pranav", "Sneha", "Rahul", "Nisha", "Siddharth",
    "Liam", "Emma", "Noah", "Olivia", "William", "Ava", "James", "Sophia", "Oliver", "Isabella",
    "Benjamin", "Mia", "Elijah", "Charlotte", "Lucas", "Amelia", "Mason", "Harper", "Logan", "Evelyn",
    "Alexander", "Abigail", "Ethan", "Emily", "Jacob", "Elizabeth", "Michael", "Mila", "Daniel", "Ella"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Gupta", "Nair", "Iyer", "Rao", "Joshi", "Chopra",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"
]

SCHOOL_SUBJECTS = [
    "Mathematics", "Physics", "Chemistry", "Computer Science", "English", "Social Science"
]

COLLEGE_COURSES = [
    {"name": "Data Structures & Algorithms", "credits": 4.0},
    {"name": "Computer Architecture", "credits": 4.0},
    {"name": "Database Management Systems", "credits": 3.0},
    {"name": "Operating Systems", "credits": 4.0},
    {"name": "Discrete Mathematics", "credits": 3.0},
    {"name": "Software Engineering", "credits": 3.0}
]

GRADE_TO_POINTS = {
    "A+": 10.0, "A": 9.0, "A-": 8.0, "B+": 7.0, "B": 6.0, "B-": 5.0, "C+": 4.0, "C": 3.0, "D": 2.0, "F": 0.0
}

def seed_database():
    print("[INIT] Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        print("[CLEAN] Purging old records for fresh seed...")
        db.query(InternalExternalMark).delete()
        db.query(AttendanceLog).delete()
        db.query(Profile).delete()
        db.query(User).delete()
        db.commit()

        print("[SEED] Seeding 50 School Profiles & 50 College Profiles...")

        # 1. Create Educator / Admin Account
        educator = User(
            email="educator@academy.edu",
            hashed_password="scrypt:mock_hash_for_dev",
            role="educator"
        )
        db.add(educator)
        db.commit()
        db.refresh(educator)

        used_names = set()
        def get_unique_name():
            while True:
                name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
                if name not in used_names:
                    used_names.add(name)
                    return name

        # Risk distribution: 30% At Risk, 35% Critical, 35% On Track
        risk_targets = ["At Risk"] * 15 + ["Critical"] * 18 + ["On Track"] * 17
        random.shuffle(risk_targets)

        # -------------------------------------------------------------
        # SEED 50 SCHOOL PROFILES
        # -------------------------------------------------------------
        for idx in range(50):
            target_risk = risk_targets[idx]
            name = get_unique_name()
            identifier = f"SCH-2026-{idx+1:03d}"
            grade = f"Grade {random.choice([9, 10, 11, 12])}"

            # Set feature profiles according to risk tier
            if target_risk == "At Risk":
                attendance = round(random.uniform(48.0, 64.0), 1)
                study_hours = round(random.uniform(3.0, 7.5), 1)
                screen_time = round(random.uniform(6.5, 12.0), 1)
                target_score = round(random.uniform(60.0, 70.0), 1)
                base_marks = random.uniform(35.0, 56.0)
            elif target_risk == "Critical":
                attendance = round(random.uniform(67.0, 75.0), 1)
                study_hours = round(random.uniform(8.0, 13.0), 1)
                screen_time = round(random.uniform(4.5, 7.0), 1)
                target_score = round(random.uniform(70.0, 80.0), 1)
                base_marks = random.uniform(58.0, 68.0)
            else: # On Track
                attendance = round(random.uniform(82.0, 98.0), 1)
                study_hours = round(random.uniform(16.0, 28.0), 1)
                screen_time = round(random.uniform(1.5, 4.0), 1)
                target_score = round(random.uniform(80.0, 95.0), 1)
                base_marks = random.uniform(76.0, 94.0)

            # Create User for student
            student_user = User(
                email=f"{name.lower().replace(' ', '.')}.sch{idx+1}@school.edu",
                hashed_password="scrypt:mock_hash_for_dev",
                role="student"
            )
            db.add(student_user)
            db.flush()

            # Create School Profile
            profile = Profile(
                user_id=student_user.id,
                profile_type="school",
                student_name=name,
                identifier=identifier,
                grade_or_semester=grade,
                study_hours_per_week=study_hours,
                screen_time_hours=screen_time,
                target_score=target_score,
                risk_status=target_risk,
                cumulative_score=round(base_marks, 1)
            )
            db.add(profile)
            db.flush()

            # Create Marks for each subject
            subject_dicts = []
            for subj_name in SCHOOL_SUBJECTS:
                # Add subject-specific variance
                jitter = random.uniform(-10.0, 10.0)
                # If At Risk, make Chemistry or Math especially low
                if target_risk == "At Risk" and subj_name in ["Chemistry", "Mathematics"]:
                    jitter -= 15.0

                internal = float(min(100.0, max(15.0, base_marks + jitter + random.uniform(-3, 3))))
                external = float(min(100.0, max(15.0, base_marks + jitter + random.uniform(-5, 4))))

                mark = InternalExternalMark(
                    profile_id=profile.id,
                    subject_name=subj_name,
                    internal_score=round(internal, 1),
                    external_score=round(external, 1),
                    max_internal=100.0,
                    max_external=100.0,
                    credit_hours=3.0,
                    standardized_percentage=round((internal + external) / 2.0, 1)
                )
                db.add(mark)
                subject_dicts.append({
                    "subject_name": subj_name,
                    "internal_score": internal,
                    "external_score": external
                })

            # Create historical Attendance Logs (last 30 days)
            today = date.today()
            for day_offset in range(15, 0, -3):
                log_date = today - timedelta(days=day_offset)
                status = "present" if random.uniform(0, 100) < attendance else "absent"
                att_log = AttendanceLog(
                    profile_id=profile.id,
                    recorded_date=log_date,
                    status=status,
                    attendance_percentage=attendance,
                    notes=f"Periodic attendance review ({status})"
                )
                db.add(att_log)

            # Compute ML prediction to get exact calibrated risk and failure probability
            payload = {
                "profile_type": "school",
                "attendance_percentage": attendance,
                "study_hours_per_week": study_hours,
                "screen_time_hours": screen_time,
                "target_score": target_score,
                "school_subjects": subject_dicts
            }
            raw_v, meta = normalizer.extract_raw_features(payload)
            p_score, r_status, f_prob, _ = ml_engine.predict(raw_v)

            profile.cumulative_score = p_score
            profile.risk_status = r_status
            profile.failure_probability = f_prob

            if r_status == "At Risk":
                profile.last_ai_suggestion = "Emergency parent-teacher conference required; reassign 3 hrs/wk to failing STEM units."
            elif r_status == "Critical":
                profile.last_ai_suggestion = "Attendance is marginal; implement weekly assignment checklist to secure passing tier."
            else:
                profile.last_ai_suggestion = "Optimal trajectory maintained; recommend entry into advanced STEM honors track."

        # -------------------------------------------------------------
        # SEED 50 COLLEGE PROFILES
        # -------------------------------------------------------------
        random.shuffle(risk_targets)
        for idx in range(50):
            target_risk = risk_targets[idx]
            name = get_unique_name()
            identifier = f"COL-2026-{idx+1:03d}"
            semester = f"Semester {random.choice([1, 2, 3, 4, 5, 6, 7, 8])}"

            if target_risk == "At Risk":
                attendance = round(random.uniform(45.0, 65.0), 1)
                study_hours = round(random.uniform(4.0, 8.0), 1)
                screen_time = round(random.uniform(7.0, 13.0), 1)
                target_score = round(random.uniform(65.0, 75.0), 1)
                base_marks = random.uniform(38.0, 58.0)
                gpa = round(random.uniform(3.5, 5.8), 2) # on 10.0 scale
            elif target_risk == "Critical":
                attendance = round(random.uniform(66.0, 76.0), 1)
                study_hours = round(random.uniform(9.0, 14.0), 1)
                screen_time = round(random.uniform(4.0, 6.5), 1)
                target_score = round(random.uniform(72.0, 82.0), 1)
                base_marks = random.uniform(60.0, 70.0)
                gpa = round(random.uniform(6.2, 7.3), 2)
            else: # On Track
                attendance = round(random.uniform(84.0, 99.0), 1)
                study_hours = round(random.uniform(18.0, 32.0), 1)
                screen_time = round(random.uniform(1.5, 4.0), 1)
                target_score = round(random.uniform(85.0, 96.0), 1)
                base_marks = random.uniform(78.0, 95.0)
                gpa = round(random.uniform(8.2, 9.8), 2)

            student_user = User(
                email=f"{name.lower().replace(' ', '.')}.col{idx+1}@university.edu",
                hashed_password="scrypt:mock_hash_for_dev",
                role="student"
            )
            db.add(student_user)
            db.flush()

            profile = Profile(
                user_id=student_user.id,
                profile_type="college",
                student_name=name,
                identifier=identifier,
                grade_or_semester=semester,
                study_hours_per_week=study_hours,
                screen_time_hours=screen_time,
                target_score=target_score,
                risk_status=target_risk,
                cumulative_score=round(gpa * 10.0, 1) # Stored normalized to 0-100%
            )
            db.add(profile)
            db.flush()

            course_dicts = []
            for c_info in COLLEGE_COURSES:
                jitter = random.uniform(-9.0, 9.0)
                if target_risk == "At Risk" and "Algorithms" in c_info["name"]:
                    jitter -= 16.0

                internal = float(min(100.0, max(20.0, base_marks + jitter + random.uniform(-2, 2))))
                external = float(min(100.0, max(20.0, base_marks + jitter + random.uniform(-4, 3))))
                c_avg = (internal + external) / 2.0

                if c_avg >= 90: grade_let = "A+"
                elif c_avg >= 80: grade_let = "A"
                elif c_avg >= 70: grade_let = "B+"
                elif c_avg >= 60: grade_let = "B"
                elif c_avg >= 50: grade_let = "C"
                elif c_avg >= 40: grade_let = "D"
                else: grade_let = "F"

                mark = InternalExternalMark(
                    profile_id=profile.id,
                    subject_name=c_info["name"],
                    internal_score=round(internal, 1),
                    external_score=round(external, 1),
                    credit_hours=c_info["credits"],
                    letter_grade=grade_let,
                    standardized_percentage=round(c_avg, 1)
                )
                db.add(mark)
                course_dicts.append({
                    "course_name": c_info["name"],
                    "credit_hours": c_info["credits"],
                    "internal_score": internal,
                    "external_score": external,
                    "grade": grade_let
                })

            today = date.today()
            for day_offset in range(15, 0, -3):
                log_date = today - timedelta(days=day_offset)
                status = "present" if random.uniform(0, 100) < attendance else "absent"
                att_log = AttendanceLog(
                    profile_id=profile.id,
                    recorded_date=log_date,
                    status=status,
                    attendance_percentage=attendance,
                    notes=f"Lecture attendance record ({status})"
                )
                db.add(att_log)

            payload = {
                "profile_type": "college",
                "attendance_percentage": attendance,
                "study_hours_per_week": study_hours,
                "screen_time_hours": screen_time,
                "target_score": target_score,
                "cumulative_gpa": gpa,
                "college_courses": course_dicts
            }
            raw_v, meta = normalizer.extract_raw_features(payload)
            p_score, r_status, f_prob, _ = ml_engine.predict(raw_v)

            profile.cumulative_score = p_score
            profile.risk_status = r_status
            profile.failure_probability = f_prob

            if r_status == "At Risk":
                profile.last_ai_suggestion = "Academic probation warning: Shift 4 hrs from elective to DSA and consult faculty advisor."
            elif r_status == "Critical":
                profile.last_ai_suggestion = "Moderate GPA contraction: Engage peer study circles and raise lab attendance to 85%."
            else:
                profile.last_ai_suggestion = "Dean's List trajectory: Maintain credit velocity and consider research assistantship."

        db.commit()
        print("[SUCCESS] Successfully seeded 100 profiles (50 School + 50 College) with realistic risk distributions!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
