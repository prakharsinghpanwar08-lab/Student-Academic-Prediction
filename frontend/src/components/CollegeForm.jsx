import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { Plus, Trash2, GraduationCap, Award } from 'lucide-react';

const GRADE_OPTIONS = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

export const CollegeForm = () => {
  const {
    semester,
    setSemester,
    cumulativeGpa,
    setCumulativeGpa,
    gpaScale,
    setGpaScale,
    collegeCourses,
    setCollegeCourses,
    maxInternalMarks,
    setMaxInternalMarks
  } = useProfile();

  const handleCourseChange = (index, field, value) => {
    setCollegeCourses((courses) => courses.map((course, courseIndex) => {
      if (courseIndex !== index) return course;
      if (field === 'credit_hours') {
        return { ...course, [field]: Math.max(1, parseFloat(value) || 1) };
      }
      if (field === 'internal_score' || field === 'external_score') {
        const limit = field === 'internal_score' ? maxInternalMarks : 100 - maxInternalMarks;
        return { ...course, [field]: value === '' ? null : Math.min(limit, Math.max(0, Number(value))) };
      }
      return { ...course, [field]: value };
    }));
  };

  const handleCourseNameChange = (index, name) => {
    setCollegeCourses((courses) => courses.map((course, courseIndex) => (
      courseIndex === index ? { ...course, course_name: name } : course
    )));
  };

  const addCourse = () => {
    setCollegeCourses([
      ...collegeCourses,
      { course_name: "Advanced Elective", credit_hours: 3.0, grade: "B", internal_score: null, external_score: null }
    ]);
  };

  const removeCourse = (index) => {
    if (collegeCourses.length <= 1) return;
    setCollegeCourses(collegeCourses.filter((_, i) => i !== index));
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 shadow-xl space-y-6">
      {/* Header and Semester */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <span>Higher-Ed Undergraduate Profile</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Credit weighted degree curriculum, letter grading, and cumulative GPA analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Semester:
          </label>
          <select
            value={semester ?? ''}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">Choose semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={`Semester ${s}`}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cumulative GPA & Scale Controls */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Cumulative GPA / CGPA</span>
            <p className="text-xs text-slate-400">Past cumulative academic standing (linearly normalized)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scale Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setGpaScale(10.0)}
              className={`px-2 py-1 rounded font-semibold transition-all ${
                gpaScale === 10.0 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              10.0 Scale
            </button>
            <button
              onClick={() => setGpaScale(4.0)}
              className={`px-2 py-1 rounded font-semibold transition-all ${
                gpaScale === 4.0 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4.0 Scale
            </button>
          </div>

          {/* GPA Input */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.01"
              min="0"
              max={gpaScale}
              value={cumulativeGpa}
              onChange={(e) => setCumulativeGpa(Math.min(gpaScale, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-right font-mono font-bold text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-slate-400 font-mono text-xs">/ {gpaScale.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Courses & Credits Table */}
      <div className="space-y-3">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-300">Maximum Internal Marks (out of 100)</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={maxInternalMarks ?? ''}
              onChange={(e) => setMaxInternalMarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </label>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-300">Maximum External Marks</span>
            <div className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono">
              {maxInternalMarks === null ? '—' : `${100 - maxInternalMarks} points (100 − internal maximum)`}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Enrolled Courses, Credits & Grades
          </span>
          <button
            onClick={addCourse}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-semibold">Course Title</th>
                <th className="pb-2 font-semibold text-center w-20">Credits</th>
                <th className="pb-2 font-semibold text-center w-24">Letter Grade</th>
                <th className="pb-2 font-semibold text-center w-24">Internal Marks</th>
                <th className="pb-2 font-semibold text-center w-24">External Marks</th>
                <th className="pb-2 text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {collegeCourses.map((course, index) => {
                return (
                  <tr key={index} className="group hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 pr-2">
                      <input
                        type="text"
                        value={course.course_name}
                        onChange={(e) => handleCourseNameChange(index, e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="10"
                        value={course.credit_hours}
                        onChange={(e) => handleCourseChange(index, 'credit_hours', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-slate-100 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        value={course.grade || "B"}
                        onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-mono font-bold text-emerald-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={maxInternalMarks ?? 0}
                        value={course.internal_score ?? ''}
                        disabled={maxInternalMarks === null}
                        onChange={(e) => handleCourseChange(index, 'internal_score', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-slate-100 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={maxInternalMarks === null ? 0 : 100 - maxInternalMarks}
                        value={course.external_score ?? ''}
                        disabled={maxInternalMarks === null}
                        onChange={(e) => handleCourseChange(index, 'external_score', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-slate-100 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 text-right pl-2">
                      <button
                        onClick={() => removeCourse(index)}
                        disabled={collegeCourses.length <= 1}
                        className="text-slate-500 hover:text-red-400 disabled:opacity-20 p-1.5 rounded transition-colors"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
