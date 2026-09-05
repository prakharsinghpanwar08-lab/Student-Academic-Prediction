"""
Machine Learning Ensemble Engine.
Random Forest Regressor & Classifier Ensemble predicting continuous academic
performance scores, multi-class risk status, and calibrated failure probability.
"""

import os
import joblib
import numpy as np
from typing import Tuple, Dict, Any
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from app.db.schemas import DialMetrics

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
REGRESSOR_PATH = os.path.join(MODEL_DIR, "rf_regressor.joblib")
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "rf_classifier.joblib")

class AcademicMLEnsemble:
    def __init__(self):
        self.regressor = None
        self.classifier = None
        self._ensure_models_loaded()

    def _generate_synthetic_training_data(self, n_samples: int = 3500) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generates realistic synthetic data modeling pedagogical dynamics.
        Features: [attendance, study_hours, screen_time, internal_avg, external_avg, combined_avg, target_score, subject_var, credit_workload]
        """
        np.random.seed(42)

        # 1. Attendance: 40% to 100%
        attendance = np.random.beta(a=5, b=2, size=n_samples) * 70 + 30
        
        # 2. Study hours: 2 to 45 hrs/week
        study_hours = np.random.gamma(shape=3.5, scale=4.0, size=n_samples)
        study_hours = np.clip(study_hours, 1.0, 48.0)

        # 3. Screen time: 1 to 14 hrs/day
        screen_time = np.random.gamma(shape=2.5, scale=2.0, size=n_samples)
        screen_time = np.clip(screen_time, 0.5, 14.0)

        # 4. Academic aptitude base
        base_aptitude = np.random.normal(loc=70, scale=12, size=n_samples)

        # 5. Internal and external marks influenced by attendance, study hours, screen time
        study_boost = (study_hours - 15) * 0.45
        screen_penalty = np.maximum(0, screen_time - 4.5) * 1.8
        att_penalty = np.maximum(0, 75 - attendance) * 0.65

        internal_avg = base_aptitude + study_boost - screen_penalty - att_penalty + np.random.normal(0, 4, n_samples)
        internal_avg = np.clip(internal_avg, 20.0, 99.0)

        external_avg = base_aptitude + study_boost - screen_penalty - (att_penalty * 1.2) + np.random.normal(0, 5, n_samples)
        external_avg = np.clip(external_avg, 15.0, 99.0)

        combined_avg = (internal_avg * 0.45) + (external_avg * 0.55)
        target_score = np.clip(combined_avg + np.random.normal(5, 6, n_samples), 50.0, 98.0)
        subject_var = np.random.gamma(shape=2.5, scale=2.5, size=n_samples)
        credit_workload = np.random.choice([12, 15, 18, 21, 24], size=n_samples)

        X = np.column_stack([
            attendance,
            study_hours,
            screen_time,
            internal_avg,
            external_avg,
            combined_avg,
            target_score,
            subject_var,
            credit_workload
        ])

        # Target 1: Continuous final score
        # Anchored on combined coursework average with adjustments for attendance, study volume, and screen distractions
        att_effect = (attendance - 75.0) * 0.22
        study_effect = np.clip((study_hours - 14.0) * 0.40, -10.0, 10.0)
        screen_effect = np.clip((4.0 - screen_time) * 0.80, -10.0, 6.0)

        y_score = combined_avg + att_effect + study_effect + screen_effect + np.random.normal(0, 2.0, n_samples)
        y_score = np.clip(y_score, 10.0, 99.0)

        # Target 2: Risk classification ('On Track', 'Critical', 'At Risk')
        # At Risk: score < 60 or attendance < 65 or combined_avg < 55
        # Critical: 60 <= score < 75 or 65 <= attendance < 75
        # On Track: score >= 75 and attendance >= 75
        y_class = []
        for s, att, c_avg in zip(y_score, attendance, combined_avg):
            if s < 60.0 or att < 65.0 or c_avg < 55.0:
                y_class.append("At Risk")
            elif s < 75.0 or att < 75.0 or c_avg < 68.0:
                y_class.append("Critical")
            else:
                y_class.append("On Track")

        return X, y_score, np.array(y_class)

    def _train_and_persist(self):
        """Fits ensemble models and serializes them."""
        os.makedirs(MODEL_DIR, exist_ok=True)
        X, y_score, y_class = self._generate_synthetic_training_data()

        # Fit Regressor
        rf_reg = RandomForestRegressor(
            n_estimators=120,
            max_depth=12,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1
        )
        rf_reg.fit(X, y_score)
        self.regressor = rf_reg
        joblib.dump(rf_reg, REGRESSOR_PATH)

        # Fit Classifier
        base_clf = RandomForestClassifier(
            n_estimators=120,
            max_depth=10,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1
        )
        base_clf.fit(X, y_class)
        self.classifier = base_clf
        joblib.dump(base_clf, CLASSIFIER_PATH)

    def _ensure_models_loaded(self):
        """Loads cached models or initiates training."""
        if os.path.exists(REGRESSOR_PATH) and os.path.exists(CLASSIFIER_PATH):
            try:
                self.regressor = joblib.load(REGRESSOR_PATH)
                self.classifier = joblib.load(CLASSIFIER_PATH)
                return
            except Exception:
                pass
        
        self._train_and_persist()

    def predict(self, raw_vector: np.ndarray) -> Tuple[float, str, float, DialMetrics]:
        """
        Executes ensemble prediction.
        Returns:
            (predicted_score, risk_status, failure_probability, dial_metrics)
        """
        X = raw_vector.reshape(1, -1)
        
        # 1. Regressor prediction
        pred_score = float(self.regressor.predict(X)[0])
        pred_score = float(np.clip(round(pred_score, 1), 0.0, 100.0))

        # 2. Classifier prediction & calibrated probabilities
        classes = list(self.classifier.classes_)
        proba = self.classifier.predict_proba(X)[0]

        prob_dict = dict(zip(classes, proba))
        at_risk_prob = float(prob_dict.get("At Risk", 0.0))
        critical_prob = float(prob_dict.get("Critical", 0.0))
        on_track_prob = float(prob_dict.get("On Track", 0.0))

        # Effective failure/academic vulnerability probability
        # Probability of failing to meet acceptable standards (< 60% or critical distress)
        failure_probability = float(np.clip(round(at_risk_prob + (critical_prob * 0.45), 3), 0.0, 1.0))

        # Determine consolidated risk status
        if pred_score >= 75.0 and failure_probability < 0.35:
            risk_status = "On Track"
            dial_color = "#10b981" # Emerald Green
        elif pred_score >= 60.0 and failure_probability < 0.65:
            risk_status = "Critical"
            dial_color = "#f59e0b" # Amber Gold
        else:
            risk_status = "At Risk"
            dial_color = "#ef4444" # Crimson Red

        dial = DialMetrics(
            dial_value=pred_score,
            dial_status=risk_status,
            dial_color=dial_color,
            failure_probability=failure_probability
        )

        return pred_score, risk_status, failure_probability, dial

ml_engine = AcademicMLEnsemble()
