import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { Sliders, Clock, Smartphone, Target, UserCheck } from 'lucide-react';

export const ScenarioSimulator = () => {
  const {
    studyHours,
    setStudyHours,
    screenTime,
    setScreenTime,
    targetScore,
    setTargetScore,
    attendance,
    setAttendance
  } = useProfile();

  // Quick preset scenario templates
  const applyPreset = (study, screen, target, att) => {
    setStudyHours(study);
    setScreenTime(screen);
    setTargetScore(target);
    setAttendance(att);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6">
      
      {/* Header with Preset buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>Interactive "What-If" Scenario Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust behavioral and engagement sliders to simulate real-time performance impacts.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Presets:</span>
          <button
            onClick={() => applyPreset(26, 2.0, 88, 95)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
          >
            Honors Pace
          </button>
          <button
            onClick={() => applyPreset(16, 4.0, 78, 82)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all"
          >
            Balanced
          </button>
          <button
            onClick={() => applyPreset(5, 9.5, 65, 58)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
          >
            At-Risk Test
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Slider 1: Study Hours */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Study Hours / Week</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-base font-bold text-indigo-400">{studyHours === null ? '—' : studyHours.toFixed(1)}</span>
              <span className="text-slate-400 text-xs font-medium">hrs</span>
            </div>
          </div>

          <input
            id="slider-study-hours"
            type="range"
            min="1"
            max="48"
            step="0.5"
            value={studyHours ?? ''}
            onChange={(e) => setStudyHours(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1 hr (Deficit)</span>
            <span>20 hrs (Target)</span>
            <span>48 hrs (Intensive)</span>
          </div>
        </div>

        {/* Slider 2: Daily Screen Time */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Recreational Screen Time</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-base font-bold ${screenTime > 6 ? 'text-red-400' : 'text-purple-400'}`}>
                {screenTime === null ? '—' : screenTime.toFixed(1)}
              </span>
              <span className="text-slate-400 text-xs font-medium">hrs/day</span>
            </div>
          </div>

          <input
            id="slider-screen-time"
            type="range"
            min="0.5"
            max="14"
            step="0.5"
            value={screenTime ?? ''}
            onChange={(e) => setScreenTime(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.5 hr (Focused)</span>
            <span>4 hrs (Moderate)</span>
            <span>14 hrs (Distracted)</span>
          </div>
        </div>

        {/* Slider 3: Target Assignment Marks */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Target Benchmark Marks</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-base font-bold text-emerald-400">{targetScore === null ? '—' : targetScore.toFixed(0)}</span>
              <span className="text-slate-400 text-xs font-medium">%</span>
            </div>
          </div>

          <input
            id="slider-target-score"
            type="range"
            min="40"
            max="98"
            step="1"
            value={targetScore ?? ''}
            onChange={(e) => setTargetScore(parseFloat(e.target.value))}
            className="w-full accent-emerald-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>40% (Pass)</span>
            <span>75% (First Class)</span>
            <span>98% (Honors)</span>
          </div>
        </div>

        {/* Slider 4: Attendance Percentage */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Simulated Attendance</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-base font-bold ${attendance < 75 ? 'text-red-400' : 'text-amber-400'}`}>
                {attendance === null ? '—' : attendance.toFixed(0)}
              </span>
              <span className="text-slate-400 text-xs font-medium">%</span>
            </div>
          </div>

          <input
            id="slider-attendance"
            type="range"
            min="30"
            max="100"
            step="1"
            value={attendance ?? ''}
            onChange={(e) => setAttendance(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>30% (Critical)</span>
            <span className="text-amber-400 font-bold">75% (Req. Threshold)</span>
            <span>100% (Full)</span>
          </div>
        </div>

      </div>

    </div>
  );
};
