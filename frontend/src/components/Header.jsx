import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { GraduationCap, School, Users, Activity, Compass, Calculator } from 'lucide-react';

export const Header = () => {
  const { mode, setMode, activeTab, setActiveTab, isPredicting } = useProfile();

  const isSchool = mode === 'school';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand and Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl shadow-lg transition-all duration-300 ${
              isSchool 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25'
            }`}>
              {isSchool ? <School className="w-5 h-5 text-white" /> : <GraduationCap className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  AcadIQ
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isSchool 
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isSchool ? 'K-12 School' : 'Higher-Ed'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Performance Prediction & AI Advisory</p>
            </div>
          </div>

          {/* Real-time sync indicator for mobile */}
          <div className="flex md:hidden items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isPredicting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{isPredicting ? 'Inferring...' : 'Ready'}</span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-sm font-medium">
          <button
            id="tab-custom-predictor"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-slate-800 to-slate-700/80 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Grade Predictor</span>
          </button>
          <button
            id="tab-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-slate-800 to-slate-700/80 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Simulator & Dial</span>
          </button>
          <button
            id="tab-gradebook"
            onClick={() => setActiveTab('gradebook')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'gradebook'
                ? 'bg-gradient-to-r from-slate-800 to-slate-700/80 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Educator Gradebook</span>
          </button>
          <button
            id="tab-gpa-converter"
            onClick={() => setActiveTab('converter')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-gradient-to-r from-slate-800 to-slate-700/80 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>GPA Converter</span>
          </button>
        </div>

        {/* Right: Persistent Dual-Profile Toggle Switch */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          
          {/* Realtime API status indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div className={`w-2 h-2 rounded-full ${isPredicting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-slate-400 font-mono text-[11px]">
              {isPredicting ? 'Predicting...' : 'ML Engine 200 OK'}
            </span>
          </div>

          {/* The Persistent Toggle Switch */}
          <div className="bg-slate-900/95 p-1 rounded-2xl border border-slate-700/80 flex items-center shadow-inner relative">
            <button
              id="school-mode-toggle"
              onClick={() => setMode('school')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                isSchool
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>School Mode</span>
            </button>

            <button
              id="college-mode-toggle"
              onClick={() => setMode('college')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                !isSchool
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>College Mode</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
