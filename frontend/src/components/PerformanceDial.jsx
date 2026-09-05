import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingUp, Compass } from 'lucide-react';

export const PerformanceDial = () => {
  const { prediction, isPredicting, mode, gpaScale } = useProfile();

  // Fallback defaults while loading or initial render
  const score = prediction ? prediction.predicted_score : 75.0;
  const riskStatus = prediction ? prediction.risk_status : "On Track";
  const failProb = prediction ? prediction.failure_probability : 0.05;
  const dialColor = prediction?.dial?.dial_color || "#10b981";
  const gpa = prediction ? (gpaScale === 4.0 ? prediction.predicted_gpa_4 : prediction.predicted_gpa_10) : 7.5;

  // Semicircle gauge angles: -90 degrees (0%) to +90 degrees (100%)
  // Clamped score [0, 100] -> angle [-90, +90]
  const angle = -90 + (score / 100) * 180;

  // Icon based on risk
  let RiskIcon = ShieldCheck;
  let statusBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let glowClass = "glow-green";

  if (riskStatus === "Critical") {
    RiskIcon = AlertTriangle;
    statusBadgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    glowClass = "glow-amber";
  } else if (riskStatus === "At Risk") {
    RiskIcon = AlertOctagon;
    statusBadgeClass = "bg-red-500/10 text-red-400 border-red-500/30";
    glowClass = "glow-red";
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-between relative overflow-hidden">
      
      {/* Background ambient radial glow */}
      <div 
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: dialColor }}
      />

      {/* Card Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Predictive Performance Dial
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}>
            <RiskIcon className="w-3 h-3" />
            <span>{riskStatus}</span>
          </span>
        </div>
      </div>

      {/* Semicircular SVG Radial Dial Gauge */}
      <div className="relative my-4 flex flex-col items-center justify-center z-10">
        <svg 
          viewBox="0 0 200 120" 
          className={`w-64 h-36 max-w-full overflow-visible transition-all duration-300 ${glowClass}`}
        >
          <defs>
            {/* Gradients for gauge tracks */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <filter id="dialShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Arc Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Calibrated Color Spectrum Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (score / 100) * 251.2}
            className="transition-all duration-500 ease-out"
          />

          {/* Tick Labels */}
          <text x="20" y="118" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">0%</text>
          <text x="100" y="18" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">50%</text>
          <text x="180" y="118" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">100%</text>

          {/* Needle Center Pivot */}
          <circle cx="100" cy="100" r="7" fill="#0f172a" stroke={dialColor} strokeWidth="3" />
          <circle cx="100" cy="100" r="2.5" fill="#ffffff" />

          {/* Gauge Needle Pointer */}
          <g 
            transform={`rotate(${angle}, 100, 100)`}
            className="transition-transform duration-500 ease-out"
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#dialShadow)"
            />
            <polygon
              points="97,34 103,34 100,24"
              fill={dialColor}
            />
          </g>
        </svg>

        {/* Live Score and Metric Callout */}
        <div className="text-center -mt-6">
          <div className="flex items-baseline justify-center gap-1">
            <span 
              className="text-4xl font-extrabold font-mono tracking-tight transition-colors duration-300"
              style={{ color: dialColor }}
            >
              {score.toFixed(1)}
            </span>
            <span className="text-xl font-bold text-slate-400">%</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs font-semibold text-slate-400">
              {mode === 'college' ? `Projected CGPA: ${gpa.toFixed(2)} / ${gpaScale.toFixed(1)}` : 'Continuous Performance'}
            </span>
          </div>
        </div>

      </div>

      {/* Failure Probability & Risk Factor Indicator */}
      <div className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Failure Probability:</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, failProb * 100)}%`,
                backgroundColor: failProb > 0.5 ? '#ef4444' : (failProb > 0.25 ? '#f59e0b' : '#10b981')
              }}
            />
          </div>
          <span className={`font-mono text-xs font-bold ${
            failProb > 0.5 ? 'text-red-400' : (failProb > 0.25 ? 'text-amber-400' : 'text-emerald-400')
          }`}>
            {(failProb * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Coursework Component Breakdown Chips */}
      {prediction && (
        <div className="w-full grid grid-cols-3 gap-2 mt-3 text-center text-[11px] font-mono z-10">
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Internal Avg</span>
            <span className="font-bold text-slate-200">{prediction.internal_avg}%</span>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">External Avg</span>
            <span className="font-bold text-slate-200">{prediction.external_avg}%</span>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Aggregate</span>
            <span className="font-bold text-slate-200">{prediction.combined_avg}%</span>
          </div>
        </div>
      )}

      {/* Dynamic Summary Note */}
      {prediction?.summary_message && (
        <p className="text-[11px] text-slate-400 text-center mt-3 line-clamp-2 italic z-10">
          "{prediction.summary_message}"
        </p>
      )}

    </div>
  );
};
