import React from 'react';
import { ProtocolStep } from '../types/lab';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface PraxiStepsGuideProps {
  steps: ProtocolStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const PraxiStepsGuide: React.FC<PraxiStepsGuideProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  onNextStep,
  onPrevStep,
}) => {
  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <h3 className="text-sm font-bold text-slate-200">
            دليل المراحل المنهجية (PraxiLabs Scientific Protocol)
          </h3>
        </div>

        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          المرحلة {currentStepIndex + 1} من {steps.length}
        </span>
      </div>

      {/* Stepper Progress Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const isDone = step.completed;
          const isCurrent = idx === currentStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              className={`flex-1 min-w-[36px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                isCurrent
                  ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30 shadow-md'
                  : isDone
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
              }`}
              title={step.title}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="font-mono text-xs">{idx + 1}</span>
              )}
              <span className="hidden md:inline truncate">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Current Step Focus Card */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-blue-400 font-mono">#{currentStepIndex + 1}</span>
              <span>{currentStep.title}</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {currentStep.instruction}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onPrevStep}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors"
              title="المرحلة السابقة"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNextStep}
              disabled={currentStepIndex === steps.length - 1}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
              title="المرحلة التالية"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scientific Concept & Safety Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-start gap-1.5 text-cyan-300 bg-cyan-950/30 p-2 rounded-lg border border-cyan-900/40">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-cyan-200">المفهوم العلمي:</strong>
              <span className="text-slate-300">{currentStep.scientificConcept}</span>
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-900/40">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="block text-amber-200">إرشادات السلامة المخبرية:</strong>
              <span className="text-slate-300">{currentStep.safetyTip}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
