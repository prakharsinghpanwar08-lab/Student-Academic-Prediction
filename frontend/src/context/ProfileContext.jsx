import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const ProfileContext = createContext(null);

const DEFAULT_SCHOOL_SUBJECTS = [
  { subject_name: "Mathematics", internal_score: 22.8, external_score: 50.4 },
  { subject_name: "Physics", internal_score: 22.2, external_score: 49 },
  { subject_name: "Chemistry", internal_score: 16.2, external_score: 35 },
  { subject_name: "Computer Science", internal_score: 26.4, external_score: 60.2 },
  { subject_name: "English", internal_score: 24.6, external_score: 56 },
];

const DEFAULT_COLLEGE_COURSES = [
  { course_name: "Data Structures & Algorithms", credit_hours: 4.0, grade: "B", internal_score: 21.6, external_score: 47.6 },
  { course_name: "Computer Architecture", credit_hours: 4.0, grade: "B+", internal_score: 23.4, external_score: 52.5 },
  { course_name: "Database Management Systems", credit_hours: 3.0, grade: "A-", internal_score: 25.5, external_score: 57.4 },
  { course_name: "Operating Systems", credit_hours: 4.0, grade: "C+", internal_score: 18.6, external_score: 40.6 },
  { course_name: "Discrete Mathematics", credit_hours: 3.0, grade: "B", internal_score: 21, external_score: 47.6 },
];

const normalizeScores = (items, maxInternalMarks) => items.map((item) => ({
  ...item,
  internal_score: (item.internal_score / maxInternalMarks) * 100,
  external_score: (item.external_score / (100 - maxInternalMarks)) * 100
}));

const hasCompletePredictionInputs = (
  mode,
  maxInternalMarks,
  schoolSubjects,
  collegeCourses,
  attendance,
  studyHours,
  screenTime,
  targetScore,
  gradeOrSemester
) => {
  const marks = mode === "school" ? schoolSubjects : collegeCourses;
  return maxInternalMarks !== null && maxInternalMarks > 0 && maxInternalMarks < 100
    && marks.length > 0
    && marks.every((item) => Number.isFinite(item.internal_score) && Number.isFinite(item.external_score))
    && [attendance, studyHours, screenTime, targetScore].every(Number.isFinite)
    && Boolean(gradeOrSemester);
};

export const ProfileProvider = ({ children }) => {
  // Persistent global toggle: 'school' | 'college'
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem("academic_mode") || "school";
  });

  const [activeTab, setActiveTab] = useState("custom"); // "custom" | "simulator" | "gradebook"

  // School Mode State
  const [classYear, setClassYear] = useState("Grade 10");
  const [schoolSubjects, setSchoolSubjects] = useState(DEFAULT_SCHOOL_SUBJECTS);
  const [maxInternalMarks, setMaxInternalMarksState] = useState(30);

  // College Mode State
  const [semester, setSemester] = useState("Semester 4");
  const [cumulativeGpa, setCumulativeGpa] = useState(7.6);
  const [gpaScale, setGpaScale] = useState(10.0);
  const [collegeCourses, setCollegeCourses] = useState(DEFAULT_COLLEGE_COURSES);

  // What-If Simulator Sliders
  const [studyHours, setStudyHours] = useState(16.0);
  const [screenTime, setScreenTime] = useState(4.5);
  const [targetScore, setTargetScore] = useState(78.0);
  const [attendance, setAttendance] = useState(78.0);

  // Prediction and Advisor State
  const [prediction, setPrediction] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoadingAdvisor, setIsLoadingAdvisor] = useState(false);

  // AbortController ref for canceling in-flight debounced requests
  const abortControllerRef = useRef(null);
  const advisorAbortControllerRef = useRef(null);
  const [resetKey, setResetKey] = useState(0);

  const resetProfile = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    advisorAbortControllerRef.current?.abort();
    advisorAbortControllerRef.current = null;
    setClassYear(null);
    setSchoolSubjects([]);
    setMaxInternalMarksState(null);
    setSemester(null);
    setCumulativeGpa(null);
    setCollegeCourses([]);
    setStudyHours(null);
    setScreenTime(null);
    setTargetScore(null);
    setAttendance(null);
    setPrediction(null);
    setAdvisory(null);
    setIsPredicting(false);
    setIsLoadingAdvisor(false);
    setResetKey((current) => current + 1);
  };

  const setMode = (newMode) => {
    resetProfile();
    setModeState(newMode);
    localStorage.setItem("academic_mode", newMode);
  };

  const setMaxInternalMarks = (value) => {
    const parsed = value === "" ? null : Number(value);
    const nextMaximum = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : null;
    const externalMaximum = nextMaximum === null ? null : 100 - nextMaximum;
    setMaxInternalMarksState(nextMaximum);
    setSchoolSubjects((subjects) => subjects.map((subject) => ({
      ...subject,
      internal_score: nextMaximum === null || subject.internal_score === null ? null : Math.min(subject.internal_score, nextMaximum),
      external_score: externalMaximum === null || subject.external_score === null ? null : Math.min(subject.external_score, externalMaximum)
    })));
    setCollegeCourses((courses) => courses.map((course) => ({
      ...course,
      internal_score: nextMaximum === null || course.internal_score === null ? null : Math.min(course.internal_score, nextMaximum),
      external_score: externalMaximum === null || course.external_score === null ? null : Math.min(course.external_score, externalMaximum)
    })));
  };

  const canPredict = hasCompletePredictionInputs(
    mode,
    maxInternalMarks,
    schoolSubjects,
    collegeCourses,
    attendance,
    studyHours,
    screenTime,
    targetScore,
    mode === "school" ? classYear : semester
  );

  // Asynchronous debounced predictive fetch
  const triggerPredict = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!canPredict) {
      setPrediction(null);
      setIsPredicting(false);
      return;
    }

    setIsPredicting(true);

    const payload = {
      profile_type: mode,
      grade_or_semester: mode === "school" ? classYear : semester,
      attendance_percentage: parseFloat(attendance),
      study_hours_per_week: parseFloat(studyHours),
      screen_time_hours: parseFloat(screenTime),
      target_score: parseFloat(targetScore),
      school_subjects: mode === "school" ? normalizeScores(schoolSubjects, maxInternalMarks) : null,
      college_courses: mode === "college" ? normalizeScores(collegeCourses, maxInternalMarks) : null,
      cumulative_gpa: mode === "college" && Number.isFinite(cumulativeGpa) ? parseFloat(cumulativeGpa) : null,
      gpa_scale: parseFloat(gpaScale)
    };

    fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
      .then((res) => {
        if (!res.ok) throw new Error("Prediction request failed");
        return res.json();
      })
      .then((data) => {
        if (abortControllerRef.current === controller) {
          setPrediction(data);
          setIsPredicting(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError" && abortControllerRef.current === controller) {
          console.error("Predict error:", err);
          setIsPredicting(false);
        }
      });
  }, [mode, classYear, semester, attendance, studyHours, screenTime, targetScore, schoolSubjects, collegeCourses, cumulativeGpa, gpaScale, maxInternalMarks, canPredict]);

  // Debounce effect on slider or subject changes
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerPredict();
    }, 120); // 120ms debouncing for instant, zero-stutter responsiveness

    return () => clearTimeout(timer);
  }, [triggerPredict]);

  // Deep AI Advisor generation
  const fetchAdvisory = async () => {
    if (!canPredict) {
      setAdvisory(null);
      return;
    }
    advisorAbortControllerRef.current?.abort();
    const controller = new AbortController();
    advisorAbortControllerRef.current = controller;
    setIsLoadingAdvisor(true);
    try {
      const payload = {
        profile_type: mode,
        grade_or_semester: mode === "school" ? classYear : semester,
        attendance_percentage: parseFloat(attendance),
        study_hours_per_week: parseFloat(studyHours),
        screen_time_hours: parseFloat(screenTime),
        target_score: parseFloat(targetScore),
        school_subjects: mode === "school" ? normalizeScores(schoolSubjects, maxInternalMarks) : null,
        college_courses: mode === "college" ? normalizeScores(collegeCourses, maxInternalMarks) : null,
        cumulative_gpa: mode === "college" && Number.isFinite(cumulativeGpa) ? parseFloat(cumulativeGpa) : null,
        gpa_scale: parseFloat(gpaScale)
      };

      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!res.ok) throw new Error("Advisor generation failed");
      const data = await res.json();
      if (advisorAbortControllerRef.current === controller) {
        setAdvisory(data);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Advisory error:", err);
      }
    } finally {
      if (advisorAbortControllerRef.current === controller) {
        advisorAbortControllerRef.current = null;
        setIsLoadingAdvisor(false);
      }
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        mode,
        setMode,
        activeTab,
        setActiveTab,
        classYear,
        setClassYear,
        schoolSubjects,
        setSchoolSubjects,
        maxInternalMarks,
        setMaxInternalMarks,
        semester,
        setSemester,
        cumulativeGpa,
        setCumulativeGpa,
        gpaScale,
        setGpaScale,
        collegeCourses,
        setCollegeCourses,
        studyHours,
        setStudyHours,
        screenTime,
        setScreenTime,
        targetScore,
        setTargetScore,
        attendance,
        setAttendance,
        prediction,
        advisory,
        isPredicting,
        isLoadingAdvisor,
        fetchAdvisory,
        triggerPredict,
        canPredict,
        resetKey
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
