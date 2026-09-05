"""
Data Standardization Layer.
Linearly maps college GPAs onto a uniform 0-100% scale, calculates weighted
subject aggregates, and transforms numerical feature vectors using Scikit-Learn
Min-Max and Z-Score Normalizers.
"""

from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.preprocessing import MinMaxScaler, StandardScaler

# Grade conversion mappings
GRADE_TO_PERCENTAGE = {
    "A+": 98.0,
    "A": 92.0,
    "A-": 86.0,
    "B+": 80.0,
    "B": 74.0,
    "B-": 68.0,
    "C+": 62.0,
    "C": 56.0,
    "C-": 50.0,
    "D": 42.0,
    "F": 20.0
}

def college_gpa_to_percentage(gpa: float, scale: float = 10.0) -> float:
    """
    Linearly maps distinct college GPAs onto a uniform 0-100% scale.
    - 10.0 scale: 10.0 GPA = 100%, 7.5 GPA = 75%
    - 4.0 scale: 4.0 GPA = 100%, 3.0 GPA = 75%
    """
    if gpa is None or gpa < 0:
        return 0.0
    if scale <= 0:
        scale = 10.0
    
    pct = (gpa / scale) * 100.0
    return float(np.clip(pct, 0.0, 100.0))

def percentage_to_gpa(percentage: float, scale: float = 10.0) -> float:
    """
    Inverse mapping: converts a 0-100% scale back to college GPA.
    """
    if percentage is None or percentage < 0:
        return 0.0
    gpa = (percentage / 100.0) * scale
    return float(np.clip(round(gpa, 2), 0.0, scale))

class AcademicFeatureNormalizer:
    def __init__(self):
        # Baseline reference distributions for MinMax and Z-Score scaling
        # Features: [attendance, study_hours, screen_time, internal_avg, external_avg, combined_avg, target_score, subject_variance, credit_workload]
        baseline_min = np.array([0.0,   0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0])
        baseline_max = np.array([100.0, 50.0, 16.0, 100.0, 100.0, 100.0, 100.0, 30.0, 30.0])
        
        self.min_max_scaler = MinMaxScaler(feature_range=(0, 1))
        self.min_max_scaler.fit([baseline_min, baseline_max])

        baseline_mean = np.array([75.0, 15.0, 4.5, 70.0, 68.0, 69.0, 75.0, 8.0, 16.0])
        baseline_std  = np.array([15.0,  8.0, 2.5, 16.0, 18.0, 17.0, 12.0, 5.0,  4.0])
        self.z_mean = baseline_mean
        self.z_std = baseline_std

    def extract_subject_metrics(self, data: Dict[str, Any]) -> Tuple[float, float, float, float, float, List[Dict[str, Any]]]:
        """
        Extracts subject/course marks, calculating:
        (internal_avg, external_avg, combined_avg, subject_variance, credit_workload, subject_list)
        """
        profile_type = data.get("profile_type", "school")
        subject_list = []
        internal_scores = []
        external_scores = []
        combined_scores = []
        total_credits = 0.0

        if profile_type == "school":
            school_subjects = data.get("school_subjects") or []
            if not school_subjects:
                # Default baseline subjects if empty
                school_subjects = [
                    {"subject_name": "Mathematics", "internal_score": 75.0, "external_score": 70.0},
                    {"subject_name": "Physics", "internal_score": 72.0, "external_score": 68.0},
                    {"subject_name": "Chemistry", "internal_score": 65.0, "external_score": 60.0},
                    {"subject_name": "English", "internal_score": 82.0, "external_score": 80.0},
                ]

            for subj in school_subjects:
                i_score = float(subj.get("internal_score", 70.0))
                e_score = float(subj.get("external_score", 70.0))
                c_score = (i_score + e_score) / 2.0
                internal_scores.append(i_score)
                external_scores.append(e_score)
                combined_scores.append(c_score)
                subject_list.append({
                    "subject_name": subj.get("subject_name", "Subject"),
                    "internal_score": i_score,
                    "external_score": e_score,
                    "combined_score": c_score,
                    "credit_hours": 3.0
                })
            total_credits = len(school_subjects) * 3.0

        else: # college mode
            college_courses = data.get("college_courses") or []
            if not college_courses:
                # Default baseline courses if empty
                college_courses = [
                    {"course_name": "Data Structures & Algorithms", "credit_hours": 4.0, "grade": "B+", "internal_score": 78.0, "external_score": 74.0},
                    {"course_name": "Operating Systems", "credit_hours": 4.0, "grade": "B", "internal_score": 70.0, "external_score": 68.0},
                    {"course_name": "Database Management", "credit_hours": 3.0, "grade": "A-", "internal_score": 85.0, "external_score": 82.0},
                    {"course_name": "Probability & Statistics", "credit_hours": 3.0, "grade": "C+", "internal_score": 60.0, "external_score": 58.0},
                ]

            for course in college_courses:
                credits = float(course.get("credit_hours", 3.0))
                total_credits += credits
                
                # Check for explicit scores or letter grade
                i_score = course.get("internal_score")
                e_score = course.get("external_score")
                grade = course.get("grade")

                if i_score is None or e_score is None:
                    base_pct = GRADE_TO_PERCENTAGE.get(grade, 70.0)
                    i_score = base_pct + 2.0
                    e_score = base_pct - 2.0

                i_score = float(i_score)
                e_score = float(e_score)
                c_score = (i_score + e_score) / 2.0

                internal_scores.append(i_score)
                external_scores.append(e_score)
                combined_scores.append(c_score)
                subject_list.append({
                    "subject_name": course.get("course_name", "Course"),
                    "internal_score": i_score,
                    "external_score": e_score,
                    "combined_score": c_score,
                    "credit_hours": credits,
                    "grade": grade
                })

        internal_avg = float(np.mean(internal_scores)) if internal_scores else 70.0
        external_avg = float(np.mean(external_scores)) if external_scores else 68.0
        combined_avg = float(np.mean(combined_scores)) if combined_scores else 69.0
        subject_var = float(np.std(combined_scores)) if len(combined_scores) > 1 else 5.0

        # If college cumulative GPA is provided directly, blend it with current course averages
        gpa = data.get("cumulative_gpa")
        gpa_scale = data.get("gpa_scale", 10.0)
        if gpa is not None and gpa > 0:
            gpa_pct = college_gpa_to_percentage(gpa, gpa_scale)
            # Blend 40% cumulative GPA history + 60% active semester courses
            combined_avg = (gpa_pct * 0.4) + (combined_avg * 0.6)

        return internal_avg, external_avg, combined_avg, subject_var, total_credits, subject_list

    def extract_raw_features(self, data: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Extracts raw numerical vector:
        [attendance, study_hours, screen_time, internal_avg, external_avg, combined_avg, target_score, subject_variance, credit_workload]
        """
        attendance = float(data.get("attendance_percentage", 75.0))
        study_hours = float(data.get("study_hours_per_week", 15.0))
        screen_time = float(data.get("screen_time_hours", 4.0))
        target_score = float(data.get("target_score", 75.0))

        internal_avg, external_avg, combined_avg, subject_var, total_credits, subjects = self.extract_subject_metrics(data)

        raw_vector = np.array([
            attendance,
            study_hours,
            screen_time,
            internal_avg,
            external_avg,
            combined_avg,
            target_score,
            subject_var,
            total_credits
        ], dtype=np.float64)

        metadata = {
            "internal_avg": round(internal_avg, 2),
            "external_avg": round(external_avg, 2),
            "combined_avg": round(combined_avg, 2),
            "subject_var": round(subject_var, 2),
            "total_credits": round(total_credits, 1),
            "subjects": subjects,
            "attendance": round(attendance, 1),
            "study_hours": round(study_hours, 1),
            "screen_time": round(screen_time, 1),
            "target_score": round(target_score, 1)
        }

        return raw_vector, metadata

    def transform_min_max(self, raw_vector: np.ndarray) -> np.ndarray:
        """Transforms feature vector to [0, 1] range."""
        return self.min_max_scaler.transform(raw_vector.reshape(1, -1))[0]

    def transform_z_score(self, raw_vector: np.ndarray) -> np.ndarray:
        """Transforms feature vector to Z-Scores (mean=0, std=1)."""
        return (raw_vector - self.z_mean) / self.z_std

normalizer = AcademicFeatureNormalizer()
