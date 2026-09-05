import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Calendar, Zap, RefreshCw } from 'lucide-react';

export const AdvisorPanel = () => {
  const { advisory, fetchAdvisory, isLoadingAdvisor, prediction } = useProfile();

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6">
      
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Gemini AI Academic Advisor & Shift Vectors</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Pydantic Structured Output
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Targeted study hour reallocations, diagnostic gap analysis, and 4-week recovery roadmap.
            </p>
          </div>
        </div>

        <button
          id="btn-generate-advisor"
          onClick={fetchAdvisory}
          disabled={isLoadingAdvisor}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdvisor ? 'animate-spin' : ''}`} />
          <span>{isLoadingAdvisor ? 'Synthesizing Advice...' : 'Synthesize AI Advisory'}</span>
        </button>
      </div>

      {!advisory && !isLoadingAdvisor && (
        <div className="bg-slate-900/40 p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-60" />
          <h3 className="text-sm font-semibold text-slate-300">No Advisory Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Synthesize AI Advisory" above to run the intelligent Gemini Advisor engine across your current grades and simulation sliders.
          </p>
        </div>
      )}

      {isLoadingAdvisor && (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-400">
            Calculating subject elasticity and generating shift vectors via Gemini...
          </p>
        </div>
      )}

      {advisory && !isLoadingAdvisor && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Overall Diagnosis Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 p-4 rounded-xl border border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-indigo-300 block mb-1 text-xs uppercase tracking-wider">
              Diagnostic Summary:
            </span>
            {advisory.overall_diagnosis}
          </div>

          {/* Strengths & Vulnerabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 space-y-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Observed Strengths</span>
              </span>
              <ul className="space-y-1 text-slate-300">
                {advisory.key_strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/20 space-y-2">
              <span className="font-bold text-red-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Critical Vulnerabilities</span>
              </span>
              <ul className="space-y-1 text-slate-300">
                {advisory.critical_vulnerabilities.map((vuln, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{vuln}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Study Shift Vectors Section */}
          {advisory.shift_vectors && advisory.shift_vectors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Calculated Study Shift Vectors</span>
                </span>
                <span className="text-[11px] text-slate-400">Optimal hour reallocation</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advisory.shift_vectors.map((sv, i) => (
                  <div 
                    key={i} 
                    className="glass-panel-interactive p-4 rounded-xl border border-amber-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{sv.from_subject}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">{sv.to_subject}</span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Shift {sv.hours_to_shift} hrs/wk
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-normal">
                      {sv.rationale}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                      <span>Projected Target Impact:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        +{sv.projected_gain_points} Points
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prioritized Recommendations */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Prioritized Pedagogical Recommendations
            </span>

            <div className="space-y-2.5">
              {advisory.recommendations.map((rec, i) => {
                let priBadge = "bg-red-500/10 text-red-400 border-red-500/30";
                let priLabel = "Priority 1 • Urgent";
                if (rec.priority === 2) {
                  priBadge = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                  priLabel = "Priority 2 • High";
                } else if (rec.priority === 3) {
                  priBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                  priLabel = "Priority 3 • Maintenance";
                }

                return (
                  <div key={i} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priBadge}`}>
                          {priLabel}
                        </span>
                        <span className="text-xs font-bold text-white">{rec.title}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-indigo-400">
                        Est. Gain: +{rec.estimated_gain_points} pts
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-normal">
                      {rec.description}
                    </p>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono text-indigo-300 flex items-start gap-2">
                      <span className="font-bold text-indigo-400 shrink-0">Action:</span>
                      <span>{rec.actionable_step}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-Week Milestone Recovery Plan */}
          {advisory.weekly_milestone_plan && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Structured 4-Week Milestone Roadmap</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {advisory.weekly_milestone_plan.map((step, i) => (
                  <div key={i} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-purple-400 block uppercase">
                      Phase {i+1}
                    </span>
                    <p className="text-slate-300 text-xs leading-normal">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
