import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const ProfileContext = createContext(null);

const DEFAULT_SCHOOL_SUBJECTS = [
  { subject_name: "Mathematics", internal_score: 76, external_score: 72 },
  { subject_name: "Physics", internal_score: 74, external_score: 70 },
  { subject_name: "Chemistry", internal_score: 54, external_score: 50 },
  { subject_name: "Computer Science", internal_score: 88, external_score: 86 },
  { subject_name: "English", internal_score: 82, external_score: 80 },
];

const DEFAULT_COLLEGE_COURSES = [
  { course_name: "Data Structures & Algorithms", credit_hours: 4.0, grade: "B", internal_score: 72, external_score: 68 },
  { course_name: "Computer Architecture", credit_hours: 4.0, grade: "B+", internal_score: 78, external_score: 75 },
  { course_name: "Database Management Systems", credit_hours: 3.0, grade: "A-", internal_score: 85, external_score: 82 },
  { course_name: "Operating Systems", credit_hours: 4.0, grade: "C+", internal_score: 62, external_score: 58 },
  { course_name: "Discrete Mathematics", credit_hours: 3.0, grade: "B", internal_score: 70, external_score: 68 },
];

export const ProfileProvider = ({ children }) => {
  // Persistent global toggle: 'school' | 'college'
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem("academic_mode") || "school";
  });

  const [activeTab, setActiveTab] = useState("custom"); // "custom" | "simulator" | "gradebook"

  // School Mode State
  const [classYear, setClassYear] = useState("Grade 10");
  const [schoolSubjects, setSchoolSubjects] = useState(DEFAULT_SCHOOL_SUBJECTS);

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

  const setMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem("academic_mode", newMode);
  };

  // Asynchronous debounced predictive fetch
  const triggerPredict = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsPredicting(true);

    const payload = {
      profile_type: mode,
      grade_or_semester: mode === "school" ? classYear : semester,
      attendance_percentage: parseFloat(attendance),
      study_hours_per_week: parseFloat(studyHours),
      screen_time_hours: parseFloat(screenTime),
      target_score: parseFloat(targetScore),
      school_subjects: mode === "school" ? schoolSubjects : null,
      college_courses: mode === "college" ? collegeCourses : null,
      cumulative_gpa: mode === "college" ? parseFloat(cumulativeGpa) : null,
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
        setPrediction(data);
        setIsPredicting(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Predict error:", err);
          setIsPredicting(false);
        }
      });
  }, [mode, classYear, semester, attendance, studyHours, screenTime, targetScore, schoolSubjects, collegeCourses, cumulativeGpa, gpaScale]);

  // Debounce effect on slider or subject changes
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerPredict();
    }, 120); // 120ms debouncing for instant, zero-stutter responsiveness

    return () => clearTimeout(timer);
  }, [triggerPredict]);

  // Deep AI Advisor generation
  const fetchAdvisory = async () => {
    setIsLoadingAdvisor(true);
    try {
      const payload = {
        profile_type: mode,
        grade_or_semester: mode === "school" ? classYear : semester,
        attendance_percentage: parseFloat(attendance),
        study_hours_per_week: parseFloat(studyHours),
        screen_time_hours: parseFloat(screenTime),
        target_score: parseFloat(targetScore),
        school_subjects: mode === "school" ? schoolSubjects : null,
        college_courses: mode === "college" ? collegeCourses : null,
        cumulative_gpa: mode === "college" ? parseFloat(cumulativeGpa) : null,
        gpa_scale: parseFloat(gpaScale)
      };

      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Advisor generation failed");
      const data = await res.json();
      setAdvisory(data);
    } catch (err) {
      console.error("Advisory error:", err);
    } finally {
      setIsLoadingAdvisor(false);
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
        triggerPredict
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
