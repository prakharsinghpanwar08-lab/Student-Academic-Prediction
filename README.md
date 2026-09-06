# AcadIQ: Student Academic Performance Prediction & Advisory System

An enterprise-grade, multi-agent academic analytics and advisory platform featuring dual-profile operations (K-12 School & Higher-Ed College), real-time "What-If" scenario simulation, ML-powered academic risk assessment, FERPA/GDPR-compliant anonymization pipelines, AI-driven study shift vector recommendations using Gemini, and a containerized deployment framework.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                           REACT.JS + TAILWIND FRONTEND                            |
|  [ Persistent Mode Switch: School Mode <---> College Mode ]                       |
|  +---------------------------+  +-----------------------------------------------+ |
|  | Dynamic Forms             |  | Interactive "What-If" Simulator (Real-Time)   | |
|  | - School: Year, Marks, %  |  | - Weekly Study Hours, Screen Time, Target, %  | |
|  | - College: Sem, GPA, Cred |  | - Debounced Asynchronous /predict Calls       | |
|  +---------------------------+  +-----------------------------------------------+ |
|  +-----------------------------------------+  +---------------------------------+ |
|  | Color-Coded Performance Dial            |  | Gemini AI Advisor Engine        | |
|  | - Green (On Track) / Amber / Red        |  | - Structured Study Shift Vectors| |
|  | - Failure Probability & Score           |  | - Prioritized 4-Week Milestones | |
|  +-----------------------------------------+  +---------------------------------+ |
|  +------------------------------------------------------------------------------+ |
|  | Educator Gradebook Portal: Prioritized Academic Risk Roster (Filter/Search)  | |
+--+------------------------------------------------------------------------------+-+
                                      | (JSON API)
                                      v
+-----------------------------------------------------------------------------------+
|                             PYTHON FASTAPI BACKEND                                |
|  +-----------------------------+  +---------------------------------------------+ |
|  | FERPA/GDPR PII Stripper     |  | Data Standardization Layer                  | |
|  | - Cold numerical vectors    |  | - Linear College GPA (0-100%) Normalizer    | |
|  | - Anonymized telemetry      |  | - Scikit-Learn Min-Max & Z-Score Scaling    | |
|  +-----------------------------+  +---------------------------------------------+ |
|  +-----------------------------+  +---------------------------------------------+ |
|  | Scikit-Learn Ensemble ML    |  | Gemini AI Structured Advisor Engine         | |
|  | - RandomForest Regressor    |  | - Pydantic JSON Schema Validation           | |
|  | - RandomForest Classifier   |  | - Cross-subject shift vector calculations   | |
|  +-----------------------------+  +---------------------------------------------+ |
+-----------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------------+
|                        CONSOLIDATED DATABASE LAYER                                |
|  PostgreSQL 16: Users, Profiles (Dual-Mode), Attendance_Logs, Marks               |
|  Auto-Seeding (seed.py): 50 Mock School + 50 Mock College Profiles                |
+-----------------------------------------------------------------------------------+
```

---

## Key Modules

### 1. Dual-Profile Frontend (React + Tailwind CSS)
- **Persistent Global Toggle**: Easily switch between `[ School Mode ]` and `[ College Mode ]`. State persists in `localStorage`.
- **Dynamic Adaptive Forms**:
  - *School Mode*: Class Year (Grade 9-12), Subject-wise Internal & External Marks (0-100%), and Attendance %.
  - *College Mode*: Current Semester (Sem 1-8), Course Credit Hours, Subject-wise Letter Grades, and cumulative GPA/CGPA.
- **Interactive "What-If" Scenario Simulator**:
  - Real-time sliders for Study Hours per Week, Daily Screen Time, Target Benchmark Marks, and Attendance.
  - Low-latency asynchronous debounced (120ms) predictive fetching to eliminate UI stutter.
- **Predictive Performance Dial**:
  - Visual semicircular SVG radial gauge with dynamic glow:
    - **Green (On Track)**: Score >= 75%
    - **Amber (Critical)**: Score 60% - 74%
    - **Red (At Risk)**: Score < 60%
  - Displays calibrated failure probability and projected GPA equivalents.
- **Educator Gradebook Portal**:
  - Prioritized "Academic Risk Roster" table mapping Student Name, Attendance %, Internal Marks Avg, External Marks Avg, Cumulative %, Risk Status, and AI Action Suggestions.
  - Interactive drill-down modal for student subject analysis.

### 2. Scalable Backend & ML Engine (Python FastAPI)
- **FERPA & GDPR Anonymization**: Dedicated PII sanitizer strips student names, emails, identifiers, and IPs before passing cold numerical vectors to analytical layers.
- **Data Standardization**: Linear transformation mapping college GPAs (10.0 and 4.0 scales) onto a continuous 0-100% scale alongside Scikit-Learn MinMax/Z-Score scalers.
- **Random Forest Ensemble**:
  - `RandomForestRegressor` predicting projected continuous academic score.
  - `RandomForestClassifier` predicting calibrated failure probability and multi-class risk status.
- **Gemini AI Advisor Engine**:
  - Enforces Pydantic structured outputs (`overall_diagnosis`, `shift_vectors`, `recommendations`, `weekly_milestone_plan`).
  - Pinpoints weak subjects and calculates study shift vectors: e.g. *"Shift 3.0 hours of weekly study from Physics (88%) to Chemistry (48%)"*.
  - Built-in deterministic pedagogical engine ensures 100% offline availability.

### 3. Consolidated Database & Deployment Framework
- **PostgreSQL Relational Schema**: Normalized tables for `users`, `profiles`, `attendance_logs`, and `internal_external_marks`.
- **Automated Mock Seeding (`seed.py`)**: Populates 100 profiles (50 School + 50 College) with realistic risk distributions.
- **Docker Compose**: Containerized multi-service setup (`frontend`, `backend`, `db`).

---

## Quickstart & Local Execution

### ⭐ Recommended: Local Execution (No Docker Required)

This is the easiest way to run AcadIQ on a Windows laptop for demonstration.

**Prerequisites:**
- Python 3.10 or newer
- Node.js 18 or newer
- Git

#### 1. Clone the repository

```bash
git clone https://github.com/prakharsinghpanwar08-lab/Student-Academic-Prediction.git
cd Student-Academic-Prediction
#### 2. Start the Backend

Open Terminal 1 in VS Code:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000