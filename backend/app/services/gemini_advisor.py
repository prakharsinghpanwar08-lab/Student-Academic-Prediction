"""
AI Advisor Engine.
Leverages Google Gemini API with strict structured JSON output schemas,
complemented by a deterministic heuristic advisor engine for offline or keyless operation.
Analyzes subject discrepancies, generates actionable prioritized recommendations,
and calculates concrete study shift vectors.
"""

import json
import httpx
from typing import Dict, Any, List
from app.core.config import settings
from app.db.schemas import AdvisorResponse, ShiftVector, ActionRecommendation
from app.services.shift_vector import calculate_study_shift_vectors

def generate_heuristic_advice(
    data: Dict[str, Any],
    pred_score: float,
    risk_status: str,
    failure_probability: float,
    metadata: Dict[str, Any]
) -> AdvisorResponse:
    """
    Deterministic pedagogical advisor generating structured recommendations
    and study-shift vectors without requiring external API calls.
    """
    profile_type = data.get("profile_type", "school")
    attendance = metadata.get("attendance", 75.0)
    study_hours = metadata.get("study_hours", 15.0)
    screen_time = metadata.get("screen_time", 4.0)
    target_score = metadata.get("target_score", 75.0)
    subjects = metadata.get("subjects", [])

    # Calculate shift vectors
    shift_vectors_raw = calculate_study_shift_vectors(subjects, study_hours, target_score)
    shift_vectors = [ShiftVector(**sv) for sv in shift_vectors_raw]

    # Strengths and Vulnerabilities
    sorted_subjs = sorted(subjects, key=lambda s: s.get("combined_score", 0.0), reverse=True)
    key_strengths = []
    critical_vulnerabilities = []

    for s in sorted_subjs[:2]:
        if s.get("combined_score", 0) >= 70:
            key_strengths.append(f"Strong grasp in {s.get('subject_name')} ({s.get('combined_score'):.0f}%)")
    if attendance >= 85:
        key_strengths.append(f"Exemplary classroom engagement ({attendance:.0f}% attendance)")
    if study_hours >= 18:
        key_strengths.append(f"Dedicated study volume ({study_hours:.1f} hrs/week)")

    for s in reversed(sorted_subjs[-2:]):
        if s.get("combined_score", 0) < 65:
            critical_vulnerabilities.append(f"Distress in {s.get('subject_name')} ({s.get('combined_score'):.0f}% vs target {target_score:.0f}%)")
    if attendance < 75:
        critical_vulnerabilities.append(f"Attendance deficit ({attendance:.0f}% is below the 75% institutional threshold)")
    if screen_time > 6.0:
        critical_vulnerabilities.append(f"Elevated non-academic screen exposure ({screen_time:.1f} hrs/day displacing retention cycles)")

    if not key_strengths:
        key_strengths = ["Foundational potential across coursework", "Receptive to structured intervention"]
    if not critical_vulnerabilities:
        critical_vulnerabilities = ["Maintenance required to prevent mid-term score erosion"]

    # Recommendations
    recommendations: List[ActionRecommendation] = []
    
    # Priority 1: Shift Vectors / Critical subject focus
    if shift_vectors:
        sv = shift_vectors[0]
        recommendations.append(ActionRecommendation(
            priority=1,
            category="Study Reallocation",
            title=f"Rebalance Hours to {sv.to_subject}",
            description=sv.rationale,
            actionable_step=f"Dedicate {sv.hours_to_shift} hrs on Tuesdays/Thursdays specifically to {sv.to_subject} problem sets.",
            estimated_gain_points=sv.projected_gain_points
        ))

    # Priority 1/2: Attendance recovery if low
    if attendance < 75:
        att_gain = round((78 - attendance) * 0.4, 1)
        recommendations.append(ActionRecommendation(
            priority=1,
            category="Attendance Recovery",
            title="Institutional Attendance Compliance",
            description=f"Current attendance of {attendance:.0f}% impairs continuous assessment comprehension and increases exam eligibility risk.",
            actionable_step="Maintain 100% attendance over the next 3 consecutive weeks to lift cumulative attendance past 75%.",
            estimated_gain_points=max(4.0, att_gain)
        ))

    # Screen time reduction
    if screen_time > 5.0:
        recommendations.append(ActionRecommendation(
            priority=2,
            category="Wellness & Screen Time",
            title="Screen Time Habit Truncation",
            description=f"Reducing recreational screen time by 1.5 hrs/day provides high-focus evening cognitive recovery.",
            actionable_step="Implement 45-minute distraction-free Pomodoro study blocks using app limits after 8:00 PM.",
            estimated_gain_points=3.5
        ))

    # General Academic habit
    recommendations.append(ActionRecommendation(
        priority=3,
        category="Exam Strategy",
        title="Active Recall & Past-Paper Synthesis",
        description="Transition from passive note reading to timed multi-question diagnostic reviews for upcoming internal exams.",
        actionable_step="Solve 2 past exam papers under timed exam conditions each weekend.",
        estimated_gain_points=4.0
    ))

    # Milestones
    weekly_milestones = [
        f"Week 1: Initiate {shift_vectors[0].hours_to_shift if shift_vectors else 2.0} hr study reallocation and log daily attendance.",
        "Week 2: Complete first subject-specific diagnostic mock quiz to benchmark deficit closure.",
        "Week 3: Schedule 15-minute educator office-hour review on flagged topics.",
        f"Week 4: Evaluate mid-cycle metrics to attain projected final performance of {pred_score:.0f}%."
    ]

    diagnosis = (
        f"Student demonstrates a projected trajectory of {pred_score:.0f}% ({risk_status}). "
        f"Key intervention requires targeted reallocation into {shift_vectors[0].to_subject if shift_vectors else 'core subjects'} "
        f"and rigorous adherence to classroom contact hours."
    )

    return AdvisorResponse(
        overall_diagnosis=diagnosis,
        risk_level=risk_status, # type: ignore
        key_strengths=key_strengths,
        critical_vulnerabilities=critical_vulnerabilities,
        shift_vectors=shift_vectors,
        recommendations=recommendations,
        weekly_milestone_plan=weekly_milestones
    )


async def get_ai_advisory(
    data: Dict[str, Any],
    pred_score: float,
    risk_status: str,
    failure_probability: float,
    metadata: Dict[str, Any]
) -> AdvisorResponse:
    """
    Attempts to query Google Gemini via structured JSON outputs.
    Gracefully falls back to the deterministic pedagogical engine if API key is not present or calls fail.
    """
    if not settings.GEMINI_API_KEY:
        return generate_heuristic_advice(data, pred_score, risk_status, failure_probability, metadata)

    prompt = f"""
You are an expert Chief Academic Advisor in a high-performance university and school analytics office.
Analyze the following anonymized student performance metrics and generate a strictly structured JSON response.

METRICS:
- Profile: {data.get('profile_type')}
- Projected Score: {pred_score}%
- Risk Status: {risk_status}
- Failure Probability: {failure_probability * 100:.1f}%
- Attendance: {metadata.get('attendance')}%
- Weekly Study Hours: {metadata.get('study_hours')} hrs
- Daily Screen Time: {metadata.get('screen_time')} hrs
- Target Score: {metadata.get('target_score')}%
- Subject Breakdown: {json.dumps(metadata.get('subjects', []))}

REQUIREMENTS:
1. Enforce rigorous pedagogical reasoning.
2. Pinpoint lagging subjects and calculate precise study shift vectors (transferring hours from high-scoring subjects to low-scoring subjects).
3. Provide prioritized recommendations (Priority 1 = Urgent, 2 = High, 3 = Medium).
4. Outline a 4-week structured milestone recovery plan.

RETURN STRICT JSON matching this schema:
{{
  "overall_diagnosis": "string",
  "risk_level": "On Track" | "Critical" | "At Risk",
  "key_strengths": ["string"],
  "critical_vulnerabilities": ["string"],
  "shift_vectors": [
    {{
      "from_subject": "string",
      "to_subject": "string",
      "hours_to_shift": float,
      "rationale": "string",
      "projected_gain_points": float
    }}
  ],
  "recommendations": [
    {{
      "priority": 1 | 2 | 3,
      "category": "string",
      "title": "string",
      "description": "string",
      "actionable_step": "string",
      "estimated_gain_points": float
    }}
  ],
  "weekly_milestone_plan": ["string"]
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                body = resp.json()
                text_content = body["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)
                return AdvisorResponse(**parsed)
    except Exception:
        pass

    # Fallback heuristic if API call fails or times out
    return generate_heuristic_advice(data, pred_score, risk_status, failure_probability, metadata)
