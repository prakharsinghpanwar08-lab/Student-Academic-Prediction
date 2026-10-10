"""
Unit & Integration Tests for Backend Pipeline.
Tests FERPA/GDPR PII Stripping, Normalization, Shift Vector calculations,
ML Ensemble predictions, and FastAPI endpoints.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.pii_stripper import strip_pii
from app.services.normalizer import college_gpa_to_percentage, percentage_to_gpa, normalizer
from app.services.shift_vector import calculate_study_shift_vectors
from app.services.ml_engine import ml_engine

client = TestClient(app)

def test_pii_stripping():
    """Verify all PII (names, emails, identifiers, phones) are isolated and stripped."""
    payload = {
        "student_name": "John Doe",
        "student_email": "john.doe@example.edu",
        "phone_number": "+1 (555) 123-4567",
        "identifier": "SCH-12345",
        "grade_or_semester": "Grade 11",
        "attendance_percentage": 78.5,
        "study_hours_per_week": 14.0,
        "school_subjects": [
            {"subject_name": "Math", "student_name": "John Doe", "internal_score": 80.0, "external_score": 85.0}
        ]
    }
    anon_id, sanitized = strip_pii(payload)
    
    assert anon_id is not None
    assert "student_name" not in sanitized
    assert "student_email" not in sanitized
    assert "phone_number" not in sanitized
    assert "identifier" not in sanitized
    assert sanitized["attendance_percentage"] == 78.5
    assert sanitized["school_subjects"][0]["subject_name"] == "Math"
    assert "student_name" not in sanitized["school_subjects"][0]


def test_gpa_normalization():
    """Verify linear mapping of 10.0 and 4.0 GPAs onto a 0-100% scale."""
    # 10.0 scale: 10.0 -> 100%, 7.5 -> 75%
    assert college_gpa_to_percentage(10.0, scale=10.0) == 100.0
    assert college_gpa_to_percentage(7.5, scale=10.0) == 75.0
    assert college_gpa_to_percentage(5.0, scale=10.0) == 50.0

    # 4.0 scale: 4.0 -> 100%, 3.0 -> 75%
    assert college_gpa_to_percentage(4.0, scale=4.0) == 100.0
    assert college_gpa_to_percentage(3.0, scale=4.0) == 75.0

    # Inverse mapping
    assert percentage_to_gpa(100.0, scale=10.0) == 10.0
    assert percentage_to_gpa(75.0, scale=10.0) == 7.5
    assert percentage_to_gpa(100.0, scale=4.0) == 4.0
    assert percentage_to_gpa(75.0, scale=4.0) == 3.0


def test_shift_vector_calculation():
    """Verify calculation of study shift vectors from high-performing to struggling subjects."""
    subjects = [
        {"subject_name": "Physics", "combined_score": 88.0},
        {"subject_name": "Chemistry", "combined_score": 46.0},
        {"subject_name": "Mathematics", "combined_score": 78.0},
        {"subject_name": "English", "combined_score": 82.0}
    ]
    vectors = calculate_study_shift_vectors(subjects, study_hours_per_week=20.0, target_score=75.0)

    assert len(vectors) > 0
    top_vector = vectors[0]
    assert top_vector["to_subject"] == "Chemistry"
    assert top_vector["from_subject"] in ["Physics", "English"]
    assert top_vector["hours_to_shift"] >= 1.5
    assert "Chemistry" in top_vector["rationale"]


def test_ml_ensemble_predictions():
    """Verify Random Forest regressor and classifier ensemble outputs."""
    raw_dict = {
        "profile_type": "school",
        "attendance_percentage": 92.0,
        "study_hours_per_week": 22.0,
        "screen_time_hours": 2.5,
        "target_score": 85.0,
        "school_subjects": [
            {"subject_name": "Math", "internal_score": 88.0, "external_score": 90.0},
            {"subject_name": "Science", "internal_score": 85.0, "external_score": 86.0}
        ]
    }
    raw_vec, _ = normalizer.extract_raw_features(raw_dict)
    score, risk, fail_prob, dial = ml_engine.predict(raw_vec)

    assert 0.0 <= score <= 100.0
    assert risk in ["On Track", "Critical", "At Risk"]
    assert 0.0 <= fail_prob <= 1.0
    assert dial.dial_color in ["#10b981", "#f59e0b", "#ef4444"]
    # High attendance & marks should yield On Track
    assert risk == "On Track"
    assert dial.dial_color == "#10b981"


def test_api_health():
    """Verify /api/v1/health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ml_engine_ready"] is True


def test_api_predict_school():
    """Verify /api/v1/predict endpoint in School mode."""
    payload = {
        "profile_type": "school",
        "student_name": "Test Student",
        "grade_or_semester": "Grade 10",
        "attendance_percentage": 62.0,
        "study_hours_per_week": 6.0,
        "screen_time_hours": 9.0,
        "target_score": 75.0,
        "school_subjects": [
            {"subject_name": "Mathematics", "internal_score": 42.0, "external_score": 45.0},
            {"subject_name": "Physics", "internal_score": 50.0, "external_score": 48.0}
        ]
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "predicted_score" in data
    assert "risk_status" in data
    assert "dial" in data
    assert data["dial"]["dial_status"] in ["Critical", "At Risk"]
    assert data["failure_probability"] > 0.3


def test_api_predict_college():
    """Verify /api/v1/predict endpoint in College mode with GPA."""
    payload = {
        "profile_type": "college",
        "grade_or_semester": "Semester 4",
        "attendance_percentage": 90.0,
        "study_hours_per_week": 20.0,
        "screen_time_hours": 3.0,
        "cumulative_gpa": 8.5,
        "gpa_scale": 10.0,
        "college_courses": [
            {"course_name": "Algorithms", "credit_hours": 4.0, "grade": "A", "internal_score": 88.0, "external_score": 85.0},
            {"course_name": "OS", "credit_hours": 4.0, "grade": "A-", "internal_score": 82.0, "external_score": 80.0}
        ]
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_status"] == "On Track"
    assert data["predicted_gpa_10"] >= 7.5


def test_api_advisor():
    """Verify /api/advisor endpoint returns structured recommendations and shift vectors."""
    payload = {
        "profile_type": "school",
        "attendance_percentage": 68.0,
        "study_hours_per_week": 12.0,
        "screen_time_hours": 6.0,
        "target_score": 80.0,
        "school_subjects": [
            {"subject_name": "Physics", "internal_score": 85.0, "external_score": 88.0},
            {"subject_name": "Chemistry", "internal_score": 48.0, "external_score": 50.0}
        ]
    }
    response = client.post("/api/v1/advisor", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "overall_diagnosis" in data
    assert "risk_level" in data
    assert "shift_vectors" in data
    assert "recommendations" in data
    assert "weekly_milestone_plan" in data
    assert len(data["recommendations"]) > 0


def test_api_roster():
    """Verify /api/v1/roster endpoint returns seeded student profiles."""
    response = client.get("/api/v1/roster?profile_type=all&risk_status=all")
    assert response.status_code == 200
    data = response.json()

    assert data["total_students"] >= 100
    assert len(data["students"]) >= 100
    sample = data["students"][0]
    assert "student_name" in sample
    assert "attendance_percentage" in sample
    assert "internal_marks_avg" in sample
    assert "external_marks_avg" in sample
    assert "risk_status" in sample
    assert "ai_action_suggestion" in sample
