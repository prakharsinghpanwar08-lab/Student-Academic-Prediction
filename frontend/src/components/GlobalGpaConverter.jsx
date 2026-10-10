import React, { useState } from 'react';
import { Calculator, ArrowLeftRight } from 'lucide-react';

export const GlobalGpaConverter = () => {
  const [scale, setScale] = useState('');
  const [gpa, setGpa] = useState('');
  const [percentage, setPercentage] = useState('');

  const maxGpa = Number(scale);
  const hasScale = Number.isFinite(maxGpa) && maxGpa > 0;
  const normalizedGpa = Number(gpa);
  const normalizedPercentage = Number(percentage);
  const gpaPercentage = hasScale && gpa !== '' && Number.isFinite(normalizedGpa)
    ? (Math.min(maxGpa, Math.max(0, normalizedGpa)) / maxGpa) * 100
    : null;
  const expectedGpa = hasScale && percentage !== '' && Number.isFinite(normalizedPercentage)
    ? (Math.min(100, Math.max(0, normalizedPercentage)) / 100) * maxGpa
    : null;

  const updateScale = (value) => {
    if (value === '') {
      setScale('');
      return;
    }
    const nextScale = Math.max(0.01, Number(value));
    setScale(nextScale);
    setGpa((currentGpa) => currentGpa === '' ? '' : Math.min(nextScale, Math.max(0, Number(currentGpa))));
  };

  const updateGpa = (value) => {
    if (value === '') {
      setGpa('');
      return;
    }
    setGpa(hasScale ? Math.min(maxGpa, Math.max(0, Number(value))) : Math.max(0, Number(value)));
  };

  const updatePercentage = (value) => {
    if (value === '') {
      setPercentage('');
      return;
    }
    setPercentage(Math.min(100, Math.max(0, Number(value))));
  };

  return (
    <section className="glass-panel w-full max-w-4xl mx-auto rounded-3xl border border-cyan-500/20 p-6 sm:p-8 shadow-2xl">
      <header className="mb-8 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-300">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Global GPA Converter</h1>
            <p className="mt-1 text-sm text-slate-400">Convert between your institution’s GPA scale and percentage.</p>
          </div>
        </div>
      </header>

      <div className="mb-6 max-w-sm">
        <label htmlFor="gpa-scale" className="mb-2 block text-sm font-semibold text-slate-200">
          Institution’s maximum GPA
        </label>
        <input
          id="gpa-scale"
          type="number"
          min="0.01"
          step="any"
          inputMode="decimal"
          value={scale}
          onChange={(event) => updateScale(event.target.value)}
          placeholder="e.g. 4, 9.5, or 10"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <label htmlFor="current-gpa" className="mb-2 block text-sm font-semibold text-slate-200">
            Current GPA
          </label>
          <input
            id="current-gpa"
            type="number"
            min="0"
            max={hasScale ? maxGpa : undefined}
            step="any"
            inputMode="decimal"
            value={gpa}
            onChange={(event) => updateGpa(event.target.value)}
            placeholder={hasScale ? `0 to ${maxGpa}` : 'Enter your GPA'}
            disabled={!hasScale}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="mt-5 flex items-center gap-2 text-cyan-300">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-sm font-medium">Equivalent percentage</span>
          </div>
          <output aria-live="polite" className="mt-2 block text-3xl font-bold text-white">
            {gpaPercentage === null ? '—' : `${gpaPercentage.toFixed(2)}%`}
          </output>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <label htmlFor="current-percentage" className="mb-2 block text-sm font-semibold text-slate-200">
            Percentage
          </label>
          <div className="relative">
            <input
              id="current-percentage"
              type="number"
              min="0"
              max="100"
              step="any"
              inputMode="decimal"
              value={percentage}
              onChange={(event) => updatePercentage(event.target.value)}
              placeholder="0 to 100"
              disabled={!hasScale}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-10 text-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-cyan-300">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-sm font-medium">Equivalent GPA</span>
          </div>
          <output aria-live="polite" className="mt-2 block text-3xl font-bold text-white">
            {expectedGpa === null ? '—' : `${expectedGpa.toFixed(2)} / ${maxGpa}`}
          </output>
        </div>
      </div>

      {!hasScale && <p className="mt-5 text-sm text-amber-300" role="status">Enter your institution’s maximum GPA to use both calculators.</p>}
      {hasScale && <p className="mt-5 text-xs text-slate-500">Conversions use a direct linear scale. Values outside the allowed range are limited to the nearest valid value.</p>}
    </section>
  );
};
