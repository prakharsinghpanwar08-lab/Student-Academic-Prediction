import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, AlertTriangle, AlertOctagon, ShieldCheck, 
  ChevronRight, X, Sparkles, BookOpen, Clock, Smartphone, TrendingUp 
} from 'lucide-react';

export const EducatorGradebook = () => {
  const [roster, setRoster] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterProfile, setFilterProfile] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchRoster = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRisk !== "all") params.append("risk_status", filterRisk);
      if (filterProfile !== "all") params.append("profile_type", filterProfile);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/roster?${params.toString()}`);
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
    const timer = setTimeout(() => {
      fetchRoster();
    }, 200);
    return () => clearTimeout(timer);
  }, [filterRisk, filterProfile, searchQuery]);

  // Fetch individual student drill-down
  const openStudentModal = async (studentId) => {
    setSelectedStudentId(studentId);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch student details");
      const data = await res.json();
      setStudentDetail(data);
    } catch (err) {
      console.error("Student detail error:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeStudentModal = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
  };

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

      {/* Top Banner and Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Enrolled</span>
            <span className="text-3xl font-extrabold text-white font-mono">{roster?.total_students ?? 100}</span>
            <p className="text-[11px] text-slate-500 mt-1">Dual-mode active cohort</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-red-500/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-400 block uppercase tracking-wider">At Risk Cohort</span>
            <span className="text-3xl font-extrabold text-red-400 font-mono">{roster?.at_risk_count ?? 30}</span>
            <p className="text-[11px] text-red-400/70 mt-1">Immediate intervention required</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 block uppercase tracking-wider">Critical Threshold</span>
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{roster?.critical_count ?? 35}</span>
            <p className="text-[11px] text-amber-400/70 mt-1">Borderline attendance / marks</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 block uppercase tracking-wider">On Track</span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{roster?.on_track_count ?? 35}</span>
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
            Showing {roster?.students?.length || 0} students
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
                <th className="py-3 px-3 text-center">Cumulative %</th>
                <th className="py-3 px-3 text-center">Risk Status</th>
                <th className="py-3 px-4">AI Action Suggestion</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              )}

              {!isLoading && roster?.students?.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              )}

              {!isLoading && roster?.students?.map((student) => {
                let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                if (student.risk_status === "Critical") {
                  badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                } else if (student.risk_status === "At Risk") {
                  badgeClass = "bg-red-500/10 text-red-400 border-red-500/30";
                }

                return (
                  <tr 
                    key={student.id} 
                    onClick={() => openStudentModal(student.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
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
                      <button className="text-slate-400 group-hover:text-indigo-400 p-1 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel max-w-2xl w-full rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {studentDetail?.profile.student_name || "Student Profile Drill-Down"}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {studentDetail?.profile.identifier} • {studentDetail?.profile.grade_or_semester}
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
              {isLoadingDetail && (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading student metrics...</span>
                </div>
              )}

              {!isLoadingDetail && studentDetail && (
                <>
                  {/* Behavioral Chips */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Attendance</span>
                      <span className="font-mono text-base font-bold text-white">
                        {studentDetail.profile.attendance_percentage}%
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Weekly Study</span>
                      <span className="font-mono text-base font-bold text-indigo-400">
                        {studentDetail.study_hours_per_week} hrs
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Daily Screen Time</span>
                      <span className="font-mono text-base font-bold text-purple-400">
                        {studentDetail.screen_time_hours} hrs
                      </span>
                    </div>
                  </div>

                  {/* Subject Breakdown */}
                  <div className="space-y-2">
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
                  </div>

                  {/* AI Intervention Advice */}
                  <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 space-y-2 text-xs">
                    <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended Educator Action</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {studentDetail.profile.ai_action_suggestion}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                onClick={closeStudentModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Close Drill-Down
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
