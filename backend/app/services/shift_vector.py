"""
Shift Vector Calculation Engine.
Calculates high-impact study reallocation vectors across subjects,
transferring surplus weekly study hours from peak-performing subjects
to underperforming/vulnerable subjects to maximize target GPA/score attainment.
"""

from typing import List, Dict, Any
import numpy as np

def calculate_study_shift_vectors(
    subjects: List[Dict[str, Any]],
    study_hours_per_week: float = 15.0,
    target_score: float = 75.0
) -> List[Dict[str, Any]]:
    """
    Analyzes subject-level discrepancies and computes exact weekly study hour reallocations.
    """
    if not subjects or len(subjects) < 2:
        return []

    # Sort subjects by combined score ascending (weakest first)
    sorted_subjects = sorted(subjects, key=lambda s: s.get("combined_score", 0.0))

    shift_vectors = []
    
    # Identify subjects lagging below target or below 70%
    lagging = [s for s in sorted_subjects if s.get("combined_score", 0.0) < target_score]
    # Identify subjects excelling with a safe buffer above 75%
    surplus = [s for s in sorted_subjects if s.get("combined_score", 0.0) >= 75.0]

    if not lagging:
        # Student is performing well in all subjects! Suggest optimization for top subject
        weakest = sorted_subjects[0]
        strongest = sorted_subjects[-1]
        diff = strongest.get("combined_score", 0.0) - weakest.get("combined_score", 0.0)
        if diff > 10:
            shift_vectors.append({
                "from_subject": strongest.get("subject_name", "Leading Subject"),
                "to_subject": weakest.get("subject_name", "Secondary Subject"),
                "hours_to_shift": 1.5,
                "rationale": f"Reallocate 1.5 hrs/week from {strongest.get('subject_name')} ({strongest.get('combined_score'):.0f}%) to {weakest.get('subject_name')} ({weakest.get('combined_score'):.0f}%) to achieve balanced academic honors.",
                "projected_gain_points": round(diff * 0.2, 1)
            })
        return shift_vectors

    if not surplus:
        # If no subject is >= 75%, take from the relatively strongest subject that is >= 65%
        candidates = [s for s in sorted_subjects if s.get("combined_score", 0.0) > sorted_subjects[0].get("combined_score", 0.0) + 12]
        if candidates:
            surplus = [candidates[-1]]

    # Pair weakest subjects with strongest donors
    for weak in lagging[:2]:
        weak_name = weak.get("subject_name", "Lagging Subject")
        weak_score = weak.get("combined_score", 0.0)
        gap = max(5.0, target_score - weak_score)

        donor = None
        for cand in reversed(surplus):
            if cand.get("subject_name") != weak_name and cand.get("combined_score", 0.0) > weak_score + 10:
                donor = cand
                break

        if donor:
            donor_name = donor.get("subject_name", "Excelling Subject")
            donor_score = donor.get("combined_score", 0.0)

            # Determine proportional shift hours based on gap and current study hours
            # Base shift: 1.5 to 4.0 hours
            hours_ratio = min(0.3, max(0.1, gap / 100.0))
            hours = round(max(1.5, min(4.5, study_hours_per_week * hours_ratio)), 1)
            
            projected_gain = round(min(15.0, gap * 0.45 + (hours * 1.8)), 1)

            rationale = (
                f"Shift {hours} hours of weekly study from {donor_name} ({donor_score:.0f}%) "
                f"to {weak_name} ({weak_score:.0f}%) to mitigate failure risk and bridge the "
                f"{gap:.0f}-point deficit towards your {target_score:.0f}% target."
            )

            shift_vectors.append({
                "from_subject": donor_name,
                "to_subject": weak_name,
                "hours_to_shift": hours,
                "rationale": rationale,
                "projected_gain_points": projected_gain
            })

    return shift_vectors
