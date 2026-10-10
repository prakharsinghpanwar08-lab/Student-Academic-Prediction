import React, { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../api';
import { 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Percent, 
  GraduationCap, 
  Compass, 
  ArrowRightLeft, 
  CheckCircle,
  RotateCcw,
  Zap,
  Target,
  Smartphone
} from 'lucide-react';

const SUPPORT_LEVELS = [
  { id: 'none', label: 'None / Self-Study Only', bonusHours: 0, description: 'Independent study without external support' },
  { id: 'peer', label: 'Peer Study Group', bonusHours: 2, description: 'Weekly collaborative peer learning sessions (+2h)' },
  { id: 'tutoring', label: 'Formal Academic Tutoring', bonusHours: 4, description: 'Bi-weekly dedicated subject coaching (+4h)' },
  { id: 'intensive', label: 'Intensive Remediation Plan', bonusHours: 7, description: 'Daily structured intervention & mentorship (+7h)' },
];

export const CustomPredictionForm = ({ mode = 'school', isReset = false }) => {
  // Form State
  const [studentName, setStudentName] = useState('');
  const [profileType, setProfileType] = useState(mode); // 'school' | 'college'
  const [gradeOrSemester, setGradeOrSemester] = useState(isReset ? '' : mode === 'school' ? 'Grade 10' : 'Semester 1');
  const [maxInternalMarks, setMaxInternalMarks] = useState(isReset ? null : 30);
  const [internalScore, setInternalScore] = useState(isReset ? null : 21.6);
  const [externalScore, setExternalScore] = useState(isReset ? null : 47.6);
  const [attendance, setAttendance] = useState(isReset ? null : 78.0);
  const [studyHours, setStudyHours] = useState(isReset ? null : 14.0);
  const [screenTime, setScreenTime] = useState(isReset ? null : 4.0);
  const [targetScore, setTargetScore] = useState(isReset ? null : 75.0);
  const [supportLevel, setSupportLevel] = useState('none');

  // Loading & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [advisoryResult, setAdvisoryResult] = useState(null);
  const requestControllerRef = useRef(null);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  // Quick Preset Scenarios
  const applyPreset = (presetType) => {
    setErrorMsg(null);
    setMaxInternalMarks(30);
    if (presetType === 'at_risk') {
      setStudentName('Alex Mercer (At-Risk)');
      setProfileType('school');
      setGradeOrSemester('Grade 10');
      setInternalScore(14.4);
      setExternalScore(29.4);
      setAttendance(52.0);
      setStudyHours(6.0);
      setScreenTime(8.0);
      setTargetScore(65.0);
      setSupportLevel('none');
    } else if (presetType === 'critical') {
      setStudentName('Jordan Lee (Critical)');
      setProfileType('school');
      setGradeOrSemester('Grade 11');
      setInternalScore(19.8);
      setExternalScore(43.4);
      setAttendance(71.0);
      setStudyHours(12.0);
      setScreenTime(5.0);
      setTargetScore(75.0);
      setSupportLevel('peer');
    } else if (presetType === 'on_track') {
      setStudentName('Samantha Reed (On Track)');
      setProfileType('school');
      setGradeOrSemester('Grade 12');
      setInternalScore(26.4);
      setExternalScore(59.5);
      setAttendance(94.0);
      setStudyHours(22.0);
      setScreenTime(2.5);
      setTargetScore(90.0);
      setSupportLevel('tutoring');
    }
  };

  const handleReset = () => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setStudentName('');
    setProfileType(mode);
    setGradeOrSemester('');
    setMaxInternalMarks(null);
    setInternalScore(null);
    setExternalScore(null);
    setAttendance(null);
    setStudyHours(null);
    setScreenTime(null);
    setTargetScore(null);
    setSupportLevel('none');
    setIsSubmitting(false);
    setPredictionResult(null);
    setAdvisoryResult(null);
    setErrorMsg(null);
  };

  const handleMaxInternalMarksChange = (value) => {
    const maximum = value === '' ? null : Math.min(100, Math.max(0, Number(value)));
    setMaxInternalMarks(maximum);
    setInternalScore((score) => maximum === null || score === null ? null : Math.min(maximum, score));
    setExternalScore((score) => maximum === null || score === null ? null : Math.min(100 - maximum, score));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredValues = [internalScore, externalScore, maxInternalMarks, attendance, studyHours, screenTime, targetScore];
    if (requiredValues.some((value) => value === null || value === '' || !Number.isFinite(Number(value)))
      || maxInternalMarks <= 0 || maxInternalMarks >= 100 || !gradeOrSemester) {
      setErrorMsg('Enter all required values, choose a grade or semester, and set an internal maximum between 0 and 100.');
      return;
    }
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsSubmitting(true);
    setErrorMsg(null);

    // Calculate effective study hours including support bonus
    const supportBonus = SUPPORT_LEVELS.find(s => s.id === supportLevel)?.bonusHours || 0;
    const effectiveStudyHours = Math.min(60, parseFloat(studyHours) + supportBonus);

    // Build payload conforming to PredictRequest schema
    const payload = {
      profile_type: profileType,
      student_name: studentName,
      grade_or_semester: gradeOrSemester,
      attendance_percentage: Math.min(100, Math.max(0, parseFloat(attendance) || 0)),
      study_hours_per_week: effectiveStudyHours,
      screen_time_hours: Math.min(24, Math.max(0, parseFloat(screenTime) || 0)),
      target_score: Math.min(100, Math.max(0, parseFloat(targetScore) || 0)),
      school_subjects: profileType === 'school' ? [
        { subject_name: 'Core Internal Assessment', internal_score: (Number(internalScore) / maxInternalMarks) * 100, external_score: (Number(externalScore) / (100 - maxInternalMarks)) * 100 },
        { subject_name: 'Core External Assessment', internal_score: (Number(internalScore) / maxInternalMarks) * 100, external_score: (Number(externalScore) / (100 - maxInternalMarks)) * 100 }
      ] : null,
      college_courses: profileType === 'college' ? [
        { course_name: 'Core Major Course', credit_hours: 4.0, internal_score: (Number(internalScore) / maxInternalMarks) * 100, external_score: (Number(externalScore) / (100 - maxInternalMarks)) * 100 },
        { course_name: 'Allied Course', credit_hours: 3.0, internal_score: (Number(internalScore) / maxInternalMarks) * 100, external_score: (Number(externalScore) / (100 - maxInternalMarks)) * 100 }
      ] : null,
      cumulative_gpa: profileType === 'college' ? ((Number(internalScore) / maxInternalMarks) + (Number(externalScore) / (100 - maxInternalMarks))) * 5 : null,
      gpa_scale: 10.0
    };

    try {
      // 1. Call /api/predict endpoint
      const predictRes = await fetch(apiUrl('/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!predictRes.ok) {
        throw new Error(`Prediction failed with status: ${predictRes.status}`);
      }

      const predictData = await predictRes.json();
      setPredictionResult(predictData);

      // 2. Concurrently or immediately call /api/advisor for rich recommendations
      try {
        const advisorRes = await fetch(apiUrl('/advisor'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        if (advisorRes.ok) {
          const advData = await advisorRes.json();
          setAdvisoryResult(advData);
        }
      } catch (advErr) {
        if (advErr.name !== 'AbortError') {
          console.warn('AI Advisor call notice:', advErr);
        }
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Custom prediction error:', err);
        setErrorMsg(err.message || 'Failed to generate performance prediction. Please ensure the backend is running.');
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Interactive Custom Input Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/25 shadow-2xl relative overflow-hidden">
        
        {/* Subtle decorative background glow */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <aside
          role="note"
          className="relative z-10 mb-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100"
        >
          💡 Notice: This predictor evaluates metrics and calculates scores for a single subject at a time.
        </aside>

        {/* Top Header & Presets Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md text-white">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Custom Academic Performance Predictor
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Enter custom student metrics to compute real-time ML risk scores and tailored AI advisory interventions.
            </p>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('at_risk')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              At-Risk Student
            </button>
            <button
              type="button"
              onClick={() => applyPreset('critical')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical / Borderline
            </button>
            <button
              type="button"
              onClick={() => applyPreset('on_track')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              High Achiever
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset Form"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 relative z-10">
          
          {/* Row 1: Student Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Student Name / Identifier
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Jordan Smith"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Profile Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Education Level
              </label>
              <select
                value={profileType}
                onChange={(e) => {
                  setProfileType(e.target.value);
                  setGradeOrSemester(e.target.value === 'school' ? 'Grade 10' : 'Semester 4');
                }}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              >
                <option value="school">K-12 School Student</option>
                <option value="college">Higher-Ed College Student</option>
              </select>
            </div>

            {/* Class Year / Semester */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {profileType === 'school' ? 'Grade / Class' : 'Active Semester'}
              </label>
              {profileType === 'school' ? (
                <select
                  value={gradeOrSemester}
                  onChange={(e) => setGradeOrSemester(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                >
                  <option value="">Choose grade</option>
                  <option value="Grade 9">Grade 9 (Secondary)</option>
                  <option value="Grade 10">Grade 10 (Secondary Board)</option>
                  <option value="Grade 11">Grade 11 (Senior Secondary)</option>
                  <option value="Grade 12">Grade 12 (Senior Board)</option>
                </select>
              ) : (
                <select
                  value={gradeOrSemester}
                  onChange={(e) => setGradeOrSemester(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                >
                  <option value="">Choose semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={`Semester ${sem}`}>Semester {sem}</option>
                  ))}
                </select>
              )}
            </div>

          </div>

          {/* Row 2: Performance & Academic Metrics Grid */}
          <div className="mb-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-300">Maximum Internal Marks (out of 100)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={maxInternalMarks ?? ''}
                onChange={(e) => handleMaxInternalMarksChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </label>
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-300">Maximum External Marks</span>
              <div className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-purple-300 font-mono">
                {maxInternalMarks === null ? '—' : `${100 - maxInternalMarks} points (100 − internal maximum)`}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Internal Marks */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Internal Marks</span>
                </div>
                <span className="font-mono text-base font-extrabold text-indigo-400">{internalScore ?? '—'} / {maxInternalMarks ?? '—'}</span>
              </div>
              <input
                type="number"
                min="0"
                max={maxInternalMarks ?? 0}
                step="0.5"
                required
                disabled={maxInternalMarks === null}
                value={internalScore ?? ''}
                onChange={(e) => setInternalScore(e.target.value === '' ? null : Math.min(maxInternalMarks, Math.max(0, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">Formative tests, quizzes & assignments</span>
            </div>

            {/* External Marks */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-400">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">External Marks</span>
                </div>
                <span className="font-mono text-base font-extrabold text-purple-400">{externalScore ?? '—'} / {maxInternalMarks === null ? '—' : 100 - maxInternalMarks}</span>
              </div>
              <input
                type="number"
                min="0"
                max={maxInternalMarks === null ? 0 : 100 - maxInternalMarks}
                step="0.5"
                required
                disabled={maxInternalMarks === null}
                value={externalScore ?? ''}
                onChange={(e) => setExternalScore(e.target.value === '' ? null : Math.min(100 - maxInternalMarks, Math.max(0, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">Summative term-end & board examination</span>
            </div>

            {/* Attendance Rate */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Percent className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Attendance Rate</span>
                </div>
                <span className="font-mono text-base font-extrabold text-emerald-400">{attendance}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={attendance}
                onChange={(e) => setAttendance(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">Institutional lecture & lab presence</span>
            </div>

            {/* Study Hours / Week */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Study Hours / Wk</span>
                </div>
                <span className="font-mono text-base font-extrabold text-cyan-400">{studyHours}h</span>
              </div>
              <input
                type="number"
                min="1"
                max="60"
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">Dedicated weekly self-directed revision</span>
            </div>

          </div>

          {/* Row 3: Support Level & Secondary Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Support Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Academic Support Level
              </label>
              <select
                value={supportLevel}
                onChange={(e) => setSupportLevel(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              >
                {SUPPORT_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {SUPPORT_LEVELS.find(l => l.id === supportLevel)?.description}
              </p>
            </div>

            {/* Daily Screen Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Daily Screen Time (Hrs)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="18"
                  step="0.5"
                  value={screenTime}
                  onChange={(e) => setScreenTime(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
                <Smartphone className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Average leisure & non-academic screen exposure
              </p>
            </div>

            {/* Target Benchmark Score */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Benchmark Score (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="40"
                  max="100"
                  step="1"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
                <Target className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Student target goal for semester completion
              </p>
            </div>

          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertOctagon className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Sends cold sanitized numerical vectors to Scikit-Learn Ensemble & Gemini AI</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              id="predict-performance-btn"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Inferring Academic Risk...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                  <span>Predict Performance</span>
                  <Send className="w-4 h-4 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* ===================================================================== */}
      {/* PREDICTION & AI ADVISORY RESULTS SECTION (Rendered Right Below Form)  */}
      {/* ===================================================================== */}
      {predictionResult && (
        <div className="space-y-6 animate-fade-in" id="prediction-results-container">
          
          {/* 1. Dynamic Risk Status Header Card */}
          <div className={`p-6 sm:p-7 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-500 ${
            predictionResult.risk_status === 'On Track'
              ? 'glass-panel border-emerald-500/30 bg-emerald-950/20'
              : predictionResult.risk_status === 'Critical'
              ? 'glass-panel border-amber-500/30 bg-amber-950/20'
              : 'glass-panel border-red-500/30 bg-red-950/20'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Left: Risk Badge & Headline */}
              <div className="flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl shadow-lg ${
                  predictionResult.risk_status === 'On Track'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : predictionResult.risk_status === 'Critical'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}>
                  {predictionResult.risk_status === 'On Track' ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : predictionResult.risk_status === 'Critical' ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <AlertOctagon className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                      predictionResult.risk_status === 'On Track'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : predictionResult.risk_status === 'Critical'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {predictionResult.risk_status} Tier
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {studentName}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white mt-1.5">
                    {predictionResult.risk_status === 'On Track' && 'Academic Performance On Track'}
                    {predictionResult.risk_status === 'Critical' && 'Borderline Critical Academic Threshold'}
                    {predictionResult.risk_status === 'At Risk' && 'High Academic Failure Risk Detected'}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {predictionResult.summary_message}
                  </p>
                </div>
              </div>

              {/* Right: Primary Numerical Dials */}
              <div className="flex items-center gap-4 sm:gap-6 bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 self-start md:self-auto">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Projected Score
                  </span>
                  <span className={`text-3xl font-black font-mono ${
                    predictionResult.risk_status === 'On Track' ? 'text-emerald-400' :
                    predictionResult.risk_status === 'Critical' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {predictionResult.predicted_score.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Ensemble Regressor</span>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Failure Probability
                  </span>
                  <span className={`text-3xl font-black font-mono ${
                    predictionResult.failure_probability < 0.25 ? 'text-emerald-400' :
                    predictionResult.failure_probability < 0.5 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {(predictionResult.failure_probability * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Calibrated ML Risk</span>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Analytical Metrics Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                PROJECTED SUBJECT GRADE POINT (10-PT SCALE)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {predictionResult.predicted_gpa_10.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">/ 10.0</span>
              </div>
              <p className="text-[11px] text-slate-500">Projected grade point for this subject on a 10-point scale</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                PROJECTED SUBJECT GRADE POINT (4-PT SCALE)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {predictionResult.predicted_gpa_4.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">/ 4.0</span>
              </div>
              <p className="text-[11px] text-slate-500">Projected grade point for this subject on a 4-point scale</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Internal vs External Avg
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-indigo-400">{predictionResult.internal_avg.toFixed(1)}%</span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-lg font-bold font-mono text-purple-400">{predictionResult.external_avg.toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Gap: {Math.abs(predictionResult.internal_avg - predictionResult.external_avg).toFixed(1)}% variance
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Target Benchmark Delta
              </span>
              {(() => {
                const delta = predictionResult.predicted_score - parseFloat(targetScore);
                const isAhead = delta >= 0;
                return (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold font-mono ${isAhead ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isAhead ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}
                      </span>
                      <span className="text-xs text-slate-500">vs target {targetScore}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isAhead ? 'Exceeding target benchmark' : 'Requires academic intervention'}
                    </p>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* 3. Tailored AI Advisory & Study Shift Vectors */}
          {advisoryResult && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-indigo-500/20 shadow-xl space-y-6">
              
              {/* Advisor Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Tailored AI Advisory & Pedagogical Action Plan
                    </h4>
                    <p className="text-xs text-slate-400">
                      Automated study shift vectors and priority intervention milestones
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-300">
                  AI Advisor Engine
                </span>
              </div>

              {/* Diagnosis Summary */}
              {advisoryResult.overall_diagnosis && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <span className="font-bold text-white block mb-1">Strategic Academic Assessment:</span>
                  {advisoryResult.overall_diagnosis}
                </div>
              )}

              {/* Action Recommendations */}
              {advisoryResult.recommendations && advisoryResult.recommendations.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Prioritized Action Recommendations
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {advisoryResult.recommendations.map((rec, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            rec.priority === 1 ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            rec.priority === 2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          }`}>
                            Priority {rec.priority}: {rec.priority === 1 ? 'Urgent' : rec.priority === 2 ? 'High' : 'Medium'}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-400">
                            +{rec.estimated_gain_points} pts projected
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-white">{rec.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                        <div className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                          <strong>Action: </strong>{rec.actionable_step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Shift Vectors */}
              {advisoryResult.shift_vectors && advisoryResult.shift_vectors.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                    Recommended Study Shift Vectors
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {advisoryResult.shift_vectors.map((vec, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white">
                            Shift {vec.hours_to_shift}h from <span className="text-emerald-400 font-bold">{vec.from_subject}</span> to <span className="text-amber-400 font-bold">{vec.to_subject}</span>
                          </div>
                          <div className="text-slate-400 text-[11px]">{vec.rationale}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-bold text-emerald-400 font-mono">+{vec.projected_gain_points} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4-Week Milestone Recovery Roadmap */}
              {advisoryResult.weekly_milestone_plan && advisoryResult.weekly_milestone_plan.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    4-Week Progressive Milestone Plan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {advisoryResult.weekly_milestone_plan.map((step, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                          Week {idx + 1}
                        </span>
                        <p className="text-xs text-slate-300 leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
