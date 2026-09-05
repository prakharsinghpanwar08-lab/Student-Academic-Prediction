from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# Profile Type Enum
ProfileMode = Literal["school", "college"]
RiskLevel = Literal["On Track", "Critical", "At Risk"]

# Subject and Course Schemas
class SchoolSubjectInput(BaseModel):
    subject_name: str
    internal_score: float = Field(..., ge=0, le=100)
    external_score: float = Field(..., ge=0, le=100)

class CollegeCourseInput(BaseModel):
    course_name: str
    credit_hours: float = Field(default=3.0, ge=1, le=10)
    grade: Optional[str] = Field(default="B")  # A+, A, A-, B+, B, B-, C+, C, D, F
    internal_score: Optional[float] = Field(default=75.0, ge=0, le=100)
    external_score: Optional[float] = Field(default=75.0, ge=0, le=100)

# Prediction Schemas
class PredictRequest(BaseModel):
    profile_type: ProfileMode = "school"
    student_name: Optional[str] = None  # Will be stripped by PII sanitizer
    student_email: Optional[str] = None # Will be stripped by PII sanitizer
    grade_or_semester: str = "Grade 10"
    attendance_percentage: float = Field(..., ge=0, le=100)
    study_hours_per_week: float = Field(default=15.0, ge=0, le=60)
    screen_time_hours: float = Field(default=4.0, ge=0, le=24)
    target_score: float = Field(default=75.0, ge=0, le=100)
    
    # Mode specific inputs
    school_subjects: Optional[List[SchoolSubjectInput]] = None
    college_courses: Optional[List[CollegeCourseInput]] = None
    cumulative_gpa: Optional[float] = Field(default=None, ge=0)
    gpa_scale: Optional[float] = Field(default=10.0) # 10.0 or 4.0

class DialMetrics(BaseModel):
    dial_value: float = Field(..., ge=0, le=100) # 0 to 100
    dial_status: RiskLevel
    dial_color: str # hex code: #10b981, #f59e0b, #ef4444
    failure_probability: float = Field(..., ge=0, le=1)

class PredictResponse(BaseModel):
    predicted_score: float
    predicted_gpa_10: float
    predicted_gpa_4: float
    risk_status: RiskLevel
    failure_probability: float
    dial: DialMetrics
    internal_avg: float
    external_avg: float
    combined_avg: float
    summary_message: str

# AI Advisor Schemas
class ShiftVector(BaseModel):
    from_subject: str
    to_subject: str
    hours_to_shift: float
    rationale: str
    projected_gain_points: float

class ActionRecommendation(BaseModel):
    priority: int = Field(..., ge=1, le=3) # 1: Urgent, 2: High, 3: Medium
    category: str
    title: str
    description: str
    actionable_step: str
    estimated_gain_points: float

class AdvisorResponse(BaseModel):
    overall_diagnosis: str
    risk_level: RiskLevel
    key_strengths: List[str]
    critical_vulnerabilities: List[str]
    shift_vectors: List[ShiftVector]
    recommendations: List[ActionRecommendation]
    weekly_milestone_plan: List[str]

# Educator Roster Schemas
class RosterItem(BaseModel):
    id: str
    student_name: str
    identifier: str
    profile_type: ProfileMode
    grade_or_semester: str
    attendance_percentage: float
    internal_marks_avg: float
    external_marks_avg: float
    cumulative_score: float
    risk_status: RiskLevel
    failure_probability: float
    ai_action_suggestion: str

class RosterResponse(BaseModel):
    total_students: int
    at_risk_count: int
    critical_count: int
    on_track_count: int
    students: List[RosterItem]

# Detailed Student Profile Schema
class SubjectDetail(BaseModel):
    subject_name: str
    internal_score: float
    external_score: float
    max_internal: float
    max_external: float
    credit_hours: Optional[float]
    letter_grade: Optional[str]
    standardized_percentage: float

class StudentDetailResponse(BaseModel):
    profile: RosterItem
    study_hours_per_week: float
    screen_time_hours: float
    target_score: float
    subjects: List[SubjectDetail]
    recommendations: List[ActionRecommendation]
    shift_vectors: List[ShiftVector]
