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
from app.db.schemas import AdvisorResponse, ActionRecommendation

def generate_heuristic_advice(
    data: Dict[str, Any],
    pred_score: float,
    risk_status: str,
    failure_probability: float,
    metadata: Dict[str, Any]
) -> AdvisorResponse:
    """
    Deterministic academic coach providing practical recommendations offline.
    """
    profile_type = data.get("profile_type", "school")
    attendance = metadata.get("attendance", 75.0)
    study_hours = metadata.get("study_hours", 15.0)
    screen_time = metadata.get("screen_time", 4.0)
    target_score = metadata.get("target_score", 75.0)
    subjects = metadata.get("subjects", [])

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
            critical_vulnerabilities.append(f"{s.get('subject_name')} is currently at {s.get('combined_score'):.0f}%, below your {target_score:.0f}% goal.")
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
    
    # Focus the first recommendation on the subject with the most room to improve.
    if sorted_subjs:
        focus_subject = sorted_subjs[-1]
        recommendations.append(ActionRecommendation(
            priority=1,
            category="Study habits",
            title=f"Build confidence in {focus_subject.get('subject_name')}",
            description=f"Your current mark shows that {focus_subject.get('subject_name')} could use a little extra practice.",
            actionable_step=f"On three days this week, spend 25 minutes reviewing one {focus_subject.get('subject_name')} topic, then solve two practice questions without looking at your notes.",
            estimated_gain_points=4.0
        ))

    # Priority 1/2: Attendance recovery if low
    if attendance < 75:
        att_gain = round((78 - attendance) * 0.4, 1)
        recommendations.append(ActionRecommendation(
            priority=1,
            category="Attendance",
            title="Make it easier to get to class",
            description=f"Your current attendance is {attendance:.0f}%. Being in class gives you more chances to ask questions and practise new ideas.",
            actionable_step="Choose your next five class days now. Pack what you need the night before and aim to attend each one.",
            estimated_gain_points=max(4.0, att_gain)
        ))

    # Screen time reduction
    if screen_time > 5.0:
        recommendations.append(ActionRecommendation(
            priority=2,
            category="Study environment",
            title="Make study time easier to protect",
            description="A quieter study period can make it easier to focus and remember what you learn.",
            actionable_step="For one 25-minute study block each evening, leave your phone in another room and take a five-minute break afterward.",
            estimated_gain_points=3.5
        ))

    # General Academic habit
    recommendations.append(ActionRecommendation(
        priority=3,
        category="Remembering what you learn",
        title="Practise remembering, not just rereading",
        description="Try recalling an idea before checking your notes. Making a small set of question-and-answer cards can help you review it later.",
        actionable_step="On four days this week, use two 25-minute study blocks. In the first, close your notes and write what you remember. In the second, make flashcards with one question per card, answer from memory, and repeat the cards you miss.",
        estimated_gain_points=4.0
    ))

    # Milestones
    weekly_milestones = [
        "Week 1: Try the short study blocks and note which topics feel hardest.",
        "Week 2: Make a small set of question-and-answer flashcards and practise them from memory.",
        "Week 3: Ask a teacher, tutor, or classmate to explain one topic that still feels unclear.",
        f"Week 4: Review your practice and choose one habit to continue as you work toward your {target_score:.0f}% goal."
    ]

    diagnosis = (
        f"Your current information points to a projected score of {pred_score:.0f}% ({risk_status}). "
        "Small, steady practice and asking for help when a topic is confusing can help you keep moving forward."
    )

    return AdvisorResponse(
        overall_diagnosis=diagnosis,
        risk_level=risk_status, # type: ignore
        key_strengths=key_strengths,
        critical_vulnerabilities=critical_vulnerabilities,
        shift_vectors=[],
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
You are a warm, clear, student-friendly academic mentor. Help the student understand what to do next without judgment.
Use plain language suitable for a student to read and act on immediately. Every sentence shown to the student must be simple, specific, encouraging, and practical.
Do not use academic analytics, software, or engineering jargon. Never use the phrases "shift vectors" or "structured output models" in any student-facing text field.
Analyze the anonymized student information below and return valid JSON matching the required response shape.

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
1. Be kind, direct, and realistic. Do not shame the student or promise a specific score increase.
2. Name subjects in everyday language and explain one clear next step for each important challenge.
3. Give practical actions with a time and frequency. Include a manageable time-blocking routine, active recall (close the notes and explain or write what the student remembers), and a plain-language flashcard method (one question per card, answer from memory, then repeat missed cards).
4. Provide prioritized recommendations (Priority 1 = most important, 2 = next, 3 = helpful extra).
5. Outline four simple weekly milestones. Each milestone must say what the student should do that week.
6. Keep every student-facing text value free of technical terms. The JSON field names below are required for compatibility and are not student-facing prose.
7. Keep "shift_vectors" as an empty array; explain study-time choices only in plain-language recommendation text.

RETURN STRICT JSON matching this schema:
{{
  "overall_diagnosis": "string",
  "risk_level": "On Track" | "Critical" | "At Risk",
  "key_strengths": ["string"],
  "critical_vulnerabilities": ["string"],
  "shift_vectors": [],
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
