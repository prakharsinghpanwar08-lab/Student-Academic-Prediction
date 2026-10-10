import React from 'react';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { Header } from './components/Header';
import { CustomPredictionForm } from './components/CustomPredictionForm';
import { SchoolForm } from './components/SchoolForm';
import { CollegeForm } from './components/CollegeForm';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PerformanceDial } from './components/PerformanceDial';
import { AdvisorPanel } from './components/AdvisorPanel';
import { EducatorGradebook } from './components/EducatorGradebook';
import { GlobalGpaConverter } from './components/GlobalGpaConverter';
import { ShieldCheck, Cpu, Database } from 'lucide-react';

const DashboardContent = () => {
  const { mode, activeTab, resetKey } = useProfile();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-8">
        
        {activeTab === 'custom' ? (
          /* Interactive Custom Academic Predictor */
          <div className="animate-fade-in">
            <CustomPredictionForm key={resetKey} mode={mode} isReset={resetKey > 0} />
          </div>
        ) : activeTab === 'converter' ? (
          <div className="animate-fade-in">
            <GlobalGpaConverter key={resetKey} />
          </div>
        ) : activeTab === 'simulator' ? (
          <div className="space-y-8 animate-fade-in">
            
            {/* Top Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Dynamic Forms & What-If Simulator (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Dynamically altered UI form based on persistent global toggle */}
                {mode === 'school' ? <SchoolForm /> : <CollegeForm />}

                {/* Real-time What-If Scenario Simulator */}
                <ScenarioSimulator />

              </div>

              {/* Right Column: Predictive Dial & AI Advisor (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Color-Coded Performance Dial */}
                <PerformanceDial />

                {/* Gemini AI Advisor Engine */}
                <AdvisorPanel />

              </div>

            </div>

          </div>
        ) : (
          /* Educator Gradebook Portal Tab */
          <div className="animate-fade-in">
            <EducatorGradebook key={resetKey} resetKey={resetKey} />
          </div>
        )}

      </main>

      {/* Enterprise Footer */}
      <footer className="glass-panel border-t border-white/10 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>FERPA & GDPR Anonymization Compliant</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-500">
              <Cpu className="w-3.5 h-3.5" />
              <span>Scikit-Learn Random Forest Ensemble</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-500">
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL Relational Storage</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>Dual-Profile Architecture v1.0</span>
            <span>•</span>
            <span className="text-indigo-400">Low-Latency Async Core</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <ProfileProvider>
      <DashboardContent />
    </ProfileProvider>
  );
}
