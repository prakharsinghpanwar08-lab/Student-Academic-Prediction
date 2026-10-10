import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../api';
import { 
  Users, Search, Filter, AlertTriangle, AlertOctagon, ShieldCheck, 
  ChevronRight, X, Sparkles, BookOpen, Clock, Smartphone, TrendingUp 
} from 'lucide-react';

export const EducatorGradebook = ({ resetKey = 0 }) => {
  const [roster, setRoster] = useState(null);
  const [uploadedRoster, setUploadedRoster] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(resetKey === 0);
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterProfile, setFilterProfile] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [studentPrediction, setStudentPrediction] = useState(null);
  const [studentAdvisory, setStudentAdvisory] = useState(null);
  const [studentModalError, setStudentModalError] = useState('');
  const detailRequestRef = useRef(null);
  const fileReaderRef = useRef(null);

  const fetchRoster = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRisk !== "all") params.append("risk_status", filterRisk);
      if (filterProfile !== "all") params.append("profile_type", filterProfile);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(apiUrl(`/roster?${params.toString()}`));
      if (!res.ok) throw new Error("Failed to fetch roster");
      const data = await res.json();
      setRoster(data);
    } catch (err) {
      console.error("Roster error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resetKey > 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchRoster();
    }, 200);
    return () => clearTimeout(timer);
  }, [filterRisk, filterProfile, searchQuery, resetKey]);

  useEffect(() => () => {
    detailRequestRef.current?.abort();
    fileReaderRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        detailRequestRef.current?.abort();
        detailRequestRef.current = null;
        setSelectedStudentId(null);
        setSelectedStudent(null);
        setStudentDetail(null);
        setStudentPrediction(null);
        setStudentAdvisory(null);
        setStudentModalError('');
        setIsLoadingDetail(false);
        setIsLoadingAdvice(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedStudentId]);

  // Fetch individual student drill-down
  const openStudentModal = async (student) => {
    detailRequestRef.current?.abort();
    const controller = new AbortController();
    detailRequestRef.current = controller;
    setSelectedStudentId(student.id);
    setSelectedStudent(student);
    setStudentDetail(null);
    setStudentPrediction(null);
    setStudentAdvisory(null);
    setStudentModalError('');
    setIsLoadingDetail(true);
    setIsLoadingAdvice(true);

    try {
      let detail = null;
      if (!student.id.startsWith('upload-')) {
        const detailResponse = await fetch(apiUrl(`/students/${student.id}`), { signal: controller.signal });
        if (!detailResponse.ok) throw new Error('Failed to fetch student details.');
        detail = await detailResponse.json();
        if (detailRequestRef.current !== controller) return;
        setStudentDetail(detail);
      }
      setIsLoadingDetail(false);

      const subject = detail?.subjects?.[0];
      const internalScore = subject
        ? (subject.internal_score / (subject.max_internal || 100)) * 100
        : student.internal_marks_avg;
      const externalScore = subject
        ? (subject.external_score / (subject.max_external || 100)) * 100
        : student.external_marks_avg;
      const gradeOrSemester = detail?.profile?.grade_or_semester || student.grade_or_semester || 'Uploaded roster';
      const profileType = detail?.profile?.profile_type || student.profile_type || 'school';
      const course = {
        course_name: subject?.subject_name || 'Uploaded subject',
        credit_hours: subject?.credit_hours || 3,
        grade: subject?.letter_grade || 'B',
        internal_score: internalScore,
        external_score: externalScore
      };
      const payload = {
        profile_type: profileType,
        grade_or_semester: gradeOrSemester,
        attendance_percentage: detail?.profile?.attendance_percentage ?? student.attendance_percentage,
        study_hours_per_week: detail?.study_hours_per_week ?? student.study_hours_per_week ?? 15,
        screen_time_hours: detail?.screen_time_hours ?? 4,
        target_score: detail?.target_score ?? 75,
        school_subjects: profileType === 'school'
          ? [{ subject_name: course.course_name, internal_score: internalScore, external_score: externalScore }]
          : null,
        college_courses: profileType === 'college' ? [course] : null,
        cumulative_gpa: null,
        gpa_scale: 10
      };

      const [predictionResponse, advisoryResponse] = await Promise.all([
        fetch(apiUrl('/predict'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        }),
        fetch(apiUrl('/advisor'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })
      ]);
      if (!predictionResponse.ok) throw new Error(`Prediction failed (${predictionResponse.status}).`);
      if (!advisoryResponse.ok) throw new Error(`AI advice failed (${advisoryResponse.status}).`);
      const [prediction, advisory] = await Promise.all([
        predictionResponse.json(),
        advisoryResponse.json()
      ]);
      if (detailRequestRef.current === controller) {
        setStudentPrediction(prediction);
        setStudentAdvisory(advisory);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Student advisory error:', err);
        setStudentModalError(err.message || 'Could not load this student’s recommendations.');
      }
    } finally {
      if (detailRequestRef.current === controller) {
        detailRequestRef.current = null;
        setIsLoadingDetail(false);
        setIsLoadingAdvice(false);
      }
    }
  };

  const closeStudentModal = () => {
    detailRequestRef.current?.abort();
    detailRequestRef.current = null;
    setSelectedStudentId(null);
    setSelectedStudent(null);
    setStudentDetail(null);
    setStudentPrediction(null);
    setStudentAdvisory(null);
    setStudentModalError('');
    setIsLoadingDetail(false);
    setIsLoadingAdvice(false);
  };

  const handleFileUpload = (event) => {
    const file = event.dataTransfer?.files?.[0] ?? event.target.files?.[0];
    if (!file) return;

    console.info('Class roster file selected:', file.name);
    if (!/\.csv$/i.test(file.name)) {
      setUploadError('Roster parsing currently supports CSV files only. Please upload a .csv file.');
      window.alert('Please upload a CSV file (.csv). Excel file parsing is not supported yet.');
      if (event.target?.value) event.target.value = '';
      return;
    }

    const reader = new FileReader();
    fileReaderRef.current?.abort();
    fileReaderRef.current = reader;
    reader.onload = () => {
      try {
        const content = typeof reader.result === 'string' ? reader.result : '';
        const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
        if (lines.length < 2) {
          throw new Error('The CSV must include a header row and at least one student row.');
        }

        const headers = lines[0].replace(/^\uFEFF/, '').split(',').map((header) => header.trim().toLowerCase());
        const requiredHeaders = ['student name', 'internal marks', 'external marks', 'attendance %', 'study hours'];
        const columnIndexes = requiredHeaders.map((header) => headers.indexOf(header));
        const missingHeaders = requiredHeaders.filter((_, index) => columnIndexes[index] === -1);
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}.`);
        }

        const students = lines.slice(1).map((line, index) => {
          const cells = line.split(',').map((cell) => cell.trim());
          const studentName = cells[columnIndexes[0]];
          const numericValues = columnIndexes.slice(1).map((columnIndex) => cells[columnIndex]?.replace('%', '').trim());
          const [internalValue, externalValue, attendanceValue, studyHoursValue] = numericValues;
          if (numericValues.some((value) => !value)) {
            throw new Error(`Student row ${index + 2} has a missing numeric value.`);
          }
          const internalMarks = Number(internalValue);
          const externalMarks = Number(externalValue);
          const attendancePercentage = Number(attendanceValue);
          const studyHours = Number(studyHoursValue);

          if (!studentName || ![internalMarks, externalMarks, attendancePercentage, studyHours].every(Number.isFinite)) {
            throw new Error(`Student row ${index + 2} has a missing name or invalid numeric value.`);
          }
          if (
            internalMarks < 0 || internalMarks > 100
            || externalMarks < 0 || externalMarks > 100
            || attendancePercentage < 0 || attendancePercentage > 100
            || studyHours < 0
          ) {
            throw new Error(`Student row ${index + 2} contains marks/attendance outside 0-100 or negative study hours.`);
          }

          const cumulativeScore = (internalMarks + externalMarks) / 2;
          const riskStatus = cumulativeScore < 60 || attendancePercentage < 65
            ? 'At Risk'
            : cumulativeScore < 75 || attendancePercentage < 75
              ? 'Critical'
              : 'On Track';

          return {
            id: `upload-${index + 1}`,
            student_name: studentName,
            identifier: `UPLOAD-${String(index + 1).padStart(3, '0')}`,
            profile_type: 'school',
            grade_or_semester: 'Uploaded roster',
            attendance_percentage: attendancePercentage,
            internal_marks_avg: internalMarks,
            external_marks_avg: externalMarks,
            cumulative_score: Number(cumulativeScore.toFixed(1)),
            risk_status: riskStatus,
            failure_probability: riskStatus === 'At Risk' ? 0.75 : riskStatus === 'Critical' ? 0.4 : 0.1,
            ai_action_suggestion: `Study ${studyHours} hours per week and review this subject's practice questions.`,
            study_hours_per_week: studyHours
          };
        });

        const counts = students.reduce((result, student) => {
          if (student.risk_status === 'At Risk') result.at_risk_count += 1;
          else if (student.risk_status === 'Critical') result.critical_count += 1;
          else result.on_track_count += 1;
          return result;
        }, { at_risk_count: 0, critical_count: 0, on_track_count: 0 });

        setUploadedRoster({ total_students: students.length, ...counts, students });
        setUploadedFileName(file.name);
        setUploadError('');
        setFilterRisk('all');
        setFilterProfile('all');
        setSearchQuery('');
        setIsLoading(false);
        window.alert('Class Roster file uploaded successfully! Processing student rows...');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The CSV could not be read.';
        setUploadError(message);
        window.alert(`Unable to process roster: ${message}`);
      } finally {
        if (fileReaderRef.current === reader) fileReaderRef.current = null;
        if (event.target?.value) event.target.value = '';
      }
    };
    reader.onerror = () => {
      if (fileReaderRef.current === reader) fileReaderRef.current = null;
      const message = 'The selected CSV file could not be read. Please try again.';
      setUploadError(message);
      window.alert(message);
      if (event.target?.value) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    handleFileUpload(event);
  };

  const activeRoster = uploadedRoster ?? roster;
  const visibleStudents = (activeRoster?.students ?? []).filter((student) => {
    const matchesRisk = filterRisk === 'all' || student.risk_status === filterRisk;
    const matchesProfile = filterProfile === 'all' || student.profile_type === filterProfile;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || student.student_name.toLowerCase().includes(query)
      || student.identifier.toLowerCase().includes(query);
    return matchesRisk && matchesProfile && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      <aside
        role="note"
        aria-label="Subject teacher upload notice"
        className="flex items-start gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 text-sm leading-relaxed text-sky-100 shadow-lg"
      >
        <p>
          📊 Subject Teacher Notice: Please ensure your uploaded Excel/CSV template contains the following columns for your specific subject: Student Name, Internal Marks, External Marks, Attendance %, Study Hours.
        </p>
      </aside>

      <label
        htmlFor="class-roster-upload"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDraggingFile(false);
          }
        }}
        onDrop={handleFileDrop}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors ${
          isDraggingFile
            ? 'border-indigo-400 bg-indigo-500/15 text-indigo-100'
            : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-indigo-500/60 hover:bg-slate-900/80'
        }`}
      >
        <input
          id="class-roster-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="sr-only"
        />
        <span className="text-2xl" aria-hidden="true">📁</span>
        <span className="mt-2 text-sm font-semibold">
          Drag &amp; Drop class roster file here, or click to browse
        </span>
        <span className="mt-1 text-xs text-slate-500">CSV, XLSX, or XLS spreadsheets</span>
        {uploadedFileName && (
          <span className="mt-2 max-w-full truncate text-xs text-indigo-300" aria-live="polite">
            Selected: {uploadedFileName}
          </span>
        )}
      </label>

      {uploadError && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {uploadError}
        </p>
      )}

      {/* Top Banner and Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Enrolled</span>
            <span className="text-3xl font-extrabold text-white font-mono">{activeRoster?.total_students ?? 0}</span>
            <p className="text-[11px] text-slate-500 mt-1">Dual-mode active cohort</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-red-500/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-400 block uppercase tracking-wider">At Risk Cohort</span>
            <span className="text-3xl font-extrabold text-red-400 font-mono">{activeRoster?.at_risk_count ?? 0}</span>
            <p className="text-[11px] text-red-400/70 mt-1">Immediate intervention required</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 block uppercase tracking-wider">Critical Threshold</span>
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{activeRoster?.critical_count ?? 0}</span>
            <p className="text-[11px] text-amber-400/70 mt-1">Borderline attendance / marks</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 block uppercase tracking-wider">On Track</span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{activeRoster?.on_track_count ?? 0}</span>
            <p className="text-[11px] text-emerald-400/70 mt-1">Meeting target milestones</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-roster"
            type="text"
            placeholder="Search student or ID (e.g. SCH-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          
          {/* Profile Mode Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Profile:</span>
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Profiles</option>
              <option value="school">School Only</option>
              <option value="college">College Only</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Risk Tier:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="At Risk">At Risk</option>
              <option value="Critical">Critical</option>
              <option value="On Track">On Track</option>
            </select>
          </div>

        </div>

      </div>

      {/* Prioritized Academic Risk Roster Table */}
      <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Prioritized Academic Risk Roster</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {visibleStudents.length} students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3 text-center">Attendance %</th>
                <th className="py-3 px-3 text-center">Internal Avg</th>
                <th className="py-3 px-3 text-center">External Avg</th>
                <th className="py-3 px-3 text-center">Study Hours / Week</th>
                <th className="py-3 px-3 text-center">Cumulative %</th>
                <th className="py-3 px-3 text-center">Risk Status</th>
                <th className="py-3 px-4">AI Action Suggestion</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && !uploadedRoster && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              )}

              {!isLoading && activeRoster && visibleStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              )}

              {!isLoading && visibleStudents.map((student) => {
                let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                if (student.risk_status === "Critical") {
                  badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                } else if (student.risk_status === "At Risk") {
                  badgeClass = "bg-red-500/10 text-red-400 border-red-500/30";
                }

                return (
                  <tr
                    key={student.id}
                    onClick={() => openStudentModal(student)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openStudentModal(student);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`View student prediction and study plan for ${student.student_name}`}
                    className="cursor-pointer hover:bg-slate-800/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 transition-colors group"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      <div>{student.student_name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{student.identifier}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                        student.profile_type === 'school' 
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {student.profile_type}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`font-bold ${student.attendance_percentage < 75 ? 'text-red-400' : 'text-slate-200'}`}>
                        {student.attendance_percentage}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {student.internal_marks_avg}%
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {student.external_marks_avg}%
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {student.study_hours_per_week ?? '—'}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-100">
                      {student.cumulative_score}%
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                        {student.risk_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-300 max-w-xs truncate">
                      {student.ai_action_suggestion}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-slate-400 group-hover:text-indigo-400 p-1 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Student Drill-Down Modal */}
      {selectedStudentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeStudentModal();
          }}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-advisory-title"
            className="glass-panel max-w-2xl w-full rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="student-advisory-title" className="text-base font-bold text-white">
                    {selectedStudent?.student_name || "Student Study Plan"}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedStudent?.identifier} • {studentDetail?.profile?.grade_or_semester || selectedStudent?.grade_or_semester}
                  </span>
                </div>
              </div>
              <button 
                onClick={closeStudentModal}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {isLoadingDetail && !selectedStudent && (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading student metrics...</span>
                </div>
              )}

              {selectedStudent && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Internal</span>
                      <span className="font-mono text-base font-bold text-indigo-300">{selectedStudent.internal_marks_avg}%</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">External</span>
                      <span className="font-mono text-base font-bold text-purple-300">{selectedStudent.external_marks_avg}%</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Attendance</span>
                      <span className="font-mono text-base font-bold text-white">{selectedStudent.attendance_percentage}%</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Study / Week</span>
                      <span className="font-mono text-base font-bold text-emerald-300">
                        {studentDetail?.study_hours_per_week ?? selectedStudent.study_hours_per_week ?? '—'} hrs
                      </span>
                    </div>
                  </div>

                  {studentPrediction && (
                    <section className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-indigo-100">Predicted performance</h4>
                        <span className="rounded-full border border-indigo-400/30 px-2.5 py-1 text-xs font-bold text-indigo-200">
                          {studentPrediction.risk_status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">
                        Projected score: <strong>{studentPrediction.predicted_score.toFixed(1)}%</strong>
                        {' · '}Risk estimate: {(studentPrediction.failure_probability * 100).toFixed(1)}%
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">{studentPrediction.summary_message}</p>
                    </section>
                  )}

                  {studentModalError && (
                    <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                      {studentModalError}
                    </p>
                  )}

                  {isLoadingAdvice && (
                    <div className="py-6 text-center text-sm text-slate-400" role="status">
                      <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      Generating this student’s prediction and four-week study plan...
                    </div>
                  )}

                  {/* Subject Breakdown */}
                  {studentDetail?.subjects?.length > 0 && <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Enrolled Courses / Subjects
                    </span>
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden text-xs">
                      {studentDetail.subjects.map((sub, i) => (
                        <div key={i} className="p-3 bg-slate-900/60 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-200">{sub.subject_name}</span>
                            {sub.letter_grade && (
                              <span className="ml-2 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                                Grade {sub.letter_grade}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="text-slate-400">Int: {sub.internal_score}</span>
                            <span className="text-slate-400">Ext: {sub.external_score}</span>
                            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                              {sub.standardized_percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>}

                  {studentAdvisory && (
                    <div className="space-y-4">
                      <section className="rounded-xl border border-violet-500/20 bg-violet-950/30 p-4">
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                          <Sparkles className="h-4 w-4" />
                          AI study coach
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-200">{studentAdvisory.overall_diagnosis}</p>
                      </section>

                      {studentAdvisory.recommendations?.length > 0 && (
                        <section className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Practical recommendations</h4>
                          {studentAdvisory.recommendations.map((recommendation, index) => (
                            <article key={`${recommendation.title}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <h5 className="text-sm font-semibold text-white">{recommendation.title}</h5>
                              <p className="mt-1 text-xs leading-relaxed text-slate-300">{recommendation.description}</p>
                              <p className="mt-2 text-xs leading-relaxed text-indigo-200">{recommendation.actionable_step}</p>
                            </article>
                          ))}
                        </section>
                      )}

                      {studentAdvisory.weekly_milestone_plan?.length > 0 && (
                        <section className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-300">4-week roadmap</h4>
                          <ol className="space-y-2">
                            {studentAdvisory.weekly_milestone_plan.map((milestone, index) => (
                              <li key={`week-${index}`} className="flex gap-2 text-xs leading-relaxed text-slate-200">
                                <span className="shrink-0 font-bold text-emerald-400">Week {index + 1}</span>
                                <span>{milestone.replace(/^Week\s+\d+:\s*/i, '')}</span>
                              </li>
                            ))}
                          </ol>
                        </section>
                      )}
                    </div>
                  )}

                  {studentDetail?.profile?.ai_action_suggestion && (
                    <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 space-y-2 text-xs">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Recommended Educator Action</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed">{studentDetail.profile.ai_action_suggestion}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                onClick={closeStudentModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Close student study plan
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
};
