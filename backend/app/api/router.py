"""
FastAPI Router Engine.
Provides low-latency asynchronous API endpoints for real-time predictions,
AI advisory generation, educator gradebook rosters, and student drill-downs.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.config import settings
from app.db.session import get_db
from app.db.models import Profile, InternalExternalMark, AttendanceLog
from app.db.schemas import (
    PredictRequest,
    PredictResponse,
    AdvisorResponse,
    RosterResponse,
    RosterItem,
    StudentDetailResponse,
    SubjectDetail
)
from app.services.pii_stripper import strip_pii
from app.services.normalizer import normalizer, percentage_to_gpa
from app.services.ml_engine import ml_engine
from app.services.gemini_advisor import get_ai_advisory

router = APIRouter()

@router.get("/health")
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ml_engine_ready": ml_engine.regressor is not None,
        "gemini_api_configured": bool(settings.GEMINI_API_KEY)
    }

@router.post("/predict", response_model=PredictResponse)
async def predict_performance(payload: PredictRequest):
    """
    Dedicated low-latency asynchronous endpoint for 'What-If' scenario simulation.
    Accepts student metrics, sanitizes PII, standardizes data, and returns
    ensemble predictions and predictive performance dial parameters.
    """
    raw_dict = payload.model_dump()
    
    # 1. PII Stripping (FERPA/GDPR compliance)
    _, sanitized_data = strip_pii(raw_dict)

    # 2. Extract standardized numerical vector and metadata
    raw_vector, metadata = normalizer.extract_raw_features(sanitized_data)

    # 3. Ensemble ML Prediction
    pred_score, risk_status, failure_probability, dial = ml_engine.predict(raw_vector)

    # 4. Linear mapping for college GPA equivalents
    gpa_10 = percentage_to_gpa(pred_score, scale=10.0)
    gpa_4 = percentage_to_gpa(pred_score, scale=4.0)

    # Dynamic summary message
    if risk_status == "On Track":
        summary = f"Student is performing solidly with a projected score of {pred_score:.1f}% ({gpa_10:.2f}/10 GPA)."
    elif risk_status == "Critical":
        summary = f"Academic metrics are bordering critical thresholds ({pred_score:.1f}%). Moderate risk of falling behind."
    else:
        summary = f"High Academic Risk detected! Projected performance is {pred_score:.1f}% with an elevated {failure_probability*100:.0f}% failure probability."

    return PredictResponse(
        predicted_score=pred_score,
        predicted_gpa_10=gpa_10,
        predicted_gpa_4=gpa_4,
        risk_status=risk_status, # type: ignore
        failure_probability=failure_probability,
        dial=dial,
        internal_avg=metadata["internal_avg"],
        external_avg=metadata["external_avg"],
        combined_avg=metadata["combined_avg"],
        summary_message=summary
    )


@router.post("/advisor", response_model=AdvisorResponse)
async def generate_advisory(payload: PredictRequest):
    """
    Intelligent AI Advisor endpoint utilizing Gemini API (or robust deterministic fallback).
    Computes precise study shift vectors and prioritized action recommendations.
    """
    raw_dict = payload.model_dump()
    _, sanitized_data = strip_pii(raw_dict)
    raw_vector, metadata = normalizer.extract_raw_features(sanitized_data)
    pred_score, risk_status, failure_probability, _ = ml_engine.predict(raw_vector)

    advisory = await get_ai_advisory(
        sanitized_data,
        pred_score,
        risk_status,
        failure_probability,
        metadata
    )

    return advisory


@router.get("/roster", response_model=RosterResponse)
def get_academic_risk_roster(
    profile_type: Optional[str] = Query("all", description="Filter by 'all', 'school', or 'college'"),
    risk_status: Optional[str] = Query("all", description="Filter by 'all', 'At Risk', 'Critical', or 'On Track'"),
    search: Optional[str] = Query(None, description="Search by student name or identifier"),
    db: Session = Depends(get_db)
):
    """
    Educator Gradebook Portal: Prioritized Academic Risk Roster.
    Maps student name, attendance, internal/external averages, risk badges, and actionable advice strings.
    """
    query = db.query(Profile)

    if profile_type and profile_type.lower() != "all":
        query = query.filter(Profile.profile_type == profile_type.lower())

    if risk_status and risk_status != "all":
        query = query.filter(Profile.risk_status == risk_status)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Profile.student_name.ilike(search_pattern)) | 
            (Profile.identifier.ilike(search_pattern))
        )

    # Order by risk priority: At Risk first, then Critical, then On Track
    # Order by failure_probability descending
    profiles = query.order_by(desc(Profile.failure_probability)).all()

    roster_items: List[RosterItem] = []
    at_risk_count = 0
    critical_count = 0
    on_track_count = 0

    for p in profiles:
        if p.risk_status == "At Risk":
            at_risk_count += 1
        elif p.risk_status == "Critical":
            critical_count += 1
        else:
            on_track_count += 1

        # Calculate student's internal and external averages from DB marks
        internal_scores = [m.internal_score for m in p.marks] if p.marks else [70.0]
        external_scores = [m.external_score for m in p.marks] if p.marks else [68.0]
        internal_avg = round(sum(internal_scores) / len(internal_scores), 1)
        external_avg = round(sum(external_scores) / len(external_scores), 1)

        # Get latest attendance percentage from logs or fallback
        att_pct = 75.0
        if p.attendance_logs:
            att_pct = round(p.attendance_logs[-1].attendance_percentage, 1)

        action_suggestion = p.last_ai_suggestion or (
            "Mandate bi-weekly tutoring and remediate attendance immediately." if p.risk_status == "At Risk"
            else "Target low-scoring subjects and audit homework consistency." if p.risk_status == "Critical"
            else "Maintain current study velocity and explore honors advancement."
        )

        roster_items.append(RosterItem(
            id=str(p.id),
            student_name=p.student_name,
            identifier=p.identifier,
            profile_type=p.profile_type, # type: ignore
            grade_or_semester=p.grade_or_semester,
            attendance_percentage=att_pct,
            internal_marks_avg=internal_avg,
            external_marks_avg=external_avg,
            cumulative_score=round(p.cumulative_score, 1),
            risk_status=p.risk_status, # type: ignore
            failure_probability=round(p.failure_probability, 3),
            ai_action_suggestion=action_suggestion
        ))

    return RosterResponse(
        total_students=len(roster_items),
        at_risk_count=at_risk_count,
        critical_count=critical_count,
        on_track_count=on_track_count,
        students=roster_items
    )


@router.get("/students/{student_id}", response_model=StudentDetailResponse)
def get_student_details(student_id: str, db: Session = Depends(get_db)):
    """Drill-down view for an individual student profile."""
    profile = db.query(Profile).filter(Profile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    internal_scores = [m.internal_score for m in profile.marks] if profile.marks else [70.0]
    external_scores = [m.external_score for m in profile.marks] if profile.marks else [68.0]
    internal_avg = round(sum(internal_scores) / len(internal_scores), 1)
    external_avg = round(sum(external_scores) / len(external_scores), 1)

    att_pct = profile.attendance_logs[-1].attendance_percentage if profile.attendance_logs else 75.0

    roster_item = RosterItem(
        id=str(profile.id),
        student_name=profile.student_name,
        identifier=profile.identifier,
        profile_type=profile.profile_type, # type: ignore
        grade_or_semester=profile.grade_or_semester,
        attendance_percentage=round(att_pct, 1),
        internal_marks_avg=internal_avg,
        external_marks_avg=external_avg,
        cumulative_score=round(profile.cumulative_score, 1),
        risk_status=profile.risk_status, # type: ignore
        failure_probability=round(profile.failure_probability, 3),
        ai_action_suggestion=profile.last_ai_suggestion or "Schedule advisory review."
    )

    subjects = [
        SubjectDetail(
            subject_name=m.subject_name,
            internal_score=m.internal_score,
            external_score=m.external_score,
            max_internal=m.max_internal,
            max_external=m.max_external,
            credit_hours=m.credit_hours,
            letter_grade=m.letter_grade,
            standardized_percentage=round((m.internal_score + m.external_score) / 2.0, 1)
        )
        for m in profile.marks
    ]

    # Quick advisory generation for the drilldown
    synth_payload = {
        "profile_type": profile.profile_type,
        "attendance_percentage": att_pct,
        "study_hours_per_week": profile.study_hours_per_week,
        "screen_time_hours": profile.screen_time_hours,
        "target_score": profile.target_score,
        "school_subjects": [
            {"subject_name": s.subject_name, "internal_score": s.internal_score, "external_score": s.external_score}
            for s in subjects
        ]
    }
    raw_vec, meta = normalizer.extract_raw_features(synth_payload)
    ps, rs, fp, _ = ml_engine.predict(raw_vec)
    from app.services.gemini_advisor import generate_heuristic_advice
    adv = generate_heuristic_advice(synth_payload, ps, rs, fp, meta)

    return StudentDetailResponse(
        profile=roster_item,
        study_hours_per_week=profile.study_hours_per_week,
        screen_time_hours=profile.screen_time_hours,
        target_score=profile.target_score,
        subjects=subjects,
        recommendations=adv.recommendations,
        shift_vectors=adv.shift_vectors
    )
