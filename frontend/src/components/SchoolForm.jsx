import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { Plus, Trash2, BookOpen, Percent } from 'lucide-react';

export const SchoolForm = () => {
  const {
    classYear,
    setClassYear,
    schoolSubjects,
    setSchoolSubjects,
    maxInternalMarks,
    setMaxInternalMarks,
    attendance,
    setAttendance
  } = useProfile();

  const handleSubjectChange = (index, field, value) => {
    const limit = field === 'internal_score' ? maxInternalMarks : 100 - maxInternalMarks;
    const score = value === '' ? null : Math.min(limit, Math.max(0, Number(value)));
    setSchoolSubjects((subjects) => subjects.map((subject, subjectIndex) => (
      subjectIndex === index ? { ...subject, [field]: score } : subject
    )));
  };

  const handleSubjectNameChange = (index, name) => {
    setSchoolSubjects((subjects) => subjects.map((subject, subjectIndex) => (
      subjectIndex === index ? { ...subject, subject_name: name } : subject
    )));
  };

  const addSubject = () => {
    setSchoolSubjects([
      ...schoolSubjects,
      { subject_name: "New Elective", internal_score: null, external_score: null }
    ]);
  };

  const removeSubject = (index) => {
    if (schoolSubjects.length <= 1) return;
    setSchoolSubjects(schoolSubjects.filter((_, i) => i !== index));
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-xl space-y-6">
      {/* Header and Class Year */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>K-12 School Curriculum Profile</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure internal continuous assessment and external board exam metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Class Year:
          </label>
          <select
            value={classYear ?? ''}
            onChange={(e) => setClassYear(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Choose grade</option>
            <option value="Grade 9">Grade 9 (Secondary)</option>
            <option value="Grade 10">Grade 10 (Secondary Board)</option>
            <option value="Grade 11">Grade 11 (Senior Secondary)</option>
            <option value="Grade 12">Grade 12 (Senior Board)</option>
          </select>
        </div>
      </div>

      {/* Attendance Direct Input (Synced with Slider) */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Institutional Attendance</span>
            <p className="text-xs text-slate-400">Continuous attendance records across all school terms</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={attendance}
            onChange={(e) => setAttendance(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-right font-mono font-bold text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <span className="text-slate-400 font-bold text-sm">%</span>
        </div>
      </div>

      {/* Subject Marks Table */}
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
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </label>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-300">Maximum External Marks</span>
            <div className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-indigo-300 font-mono">
              {maxInternalMarks === null ? '—' : `${100 - maxInternalMarks} points (100 − internal maximum)`}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Subject-wise Marks (points)
          </span>
          <button
            onClick={addSubject}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-semibold">Subject</th>
                <th className="pb-2 font-semibold text-center w-28">Internal Marks</th>
                <th className="pb-2 font-semibold text-center w-28">External Marks</th>
                <th className="pb-2 font-semibold text-center w-24">Aggregate</th>
                <th className="pb-2 text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {schoolSubjects.map((subj, index) => {
                const combined = subj.internal_score === null || subj.external_score === null
                  ? null
                  : Math.round(subj.internal_score + subj.external_score);
                let badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                if (combined !== null && combined < 60) badgeColor = "text-red-400 bg-red-500/10 border-red-500/20";
                else if (combined !== null && combined < 75) badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";

                return (
                  <tr key={index} className="group hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 pr-3">
                      <input
                        type="text"
                        value={subj.subject_name}
                        onChange={(e) => handleSubjectNameChange(index, e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={maxInternalMarks ?? 0}
                        value={subj.internal_score ?? ''}
                        disabled={maxInternalMarks === null}
                        onChange={(e) => handleSubjectChange(index, 'internal_score', e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-slate-100 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={maxInternalMarks === null ? 0 : 100 - maxInternalMarks}
                        value={subj.external_score ?? ''}
                        disabled={maxInternalMarks === null}
                        onChange={(e) => handleSubjectChange(index, 'external_score', e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-slate-100 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-md border ${badgeColor}`}>
                        {combined === null ? '—' : `${combined}/100`}
                      </span>
                    </td>
                    <td className="py-2.5 text-right pl-2">
                      <button
                        onClick={() => removeSubject(index)}
                        disabled={schoolSubjects.length <= 1}
                        className="text-slate-500 hover:text-red-400 disabled:opacity-20 p-1.5 rounded transition-colors"
                        title="Delete subject"
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
