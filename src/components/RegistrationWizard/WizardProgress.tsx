import React from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { Check, Trophy, Sparkles } from 'lucide-react';

const STEP_LABELS = [
  'Select Games',
  'Student Details',
  'Team Setup',
  'Review',
  'Payment',
  'Confirmed'
];

export const WizardProgress: React.FC = () => {
  const { activeStep, goToStep, totalFee, selectedGameIds } = useRegistration();

  const progressPercent = Math.round(((activeStep - 1) / (STEP_LABELS.length - 1)) * 100);

  return (
    <div className="w-full bg-gradient-to-r from-[#24060F]/90 via-[#1A040B]/95 to-[#120207]/90 rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/40 shadow-xl mb-6 text-white backdrop-blur-md">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5C158] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Step {activeStep} of 6
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
              Fast Track Active
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold font-heading text-white mt-0.5">
            {STEP_LABELS[activeStep - 1]}
          </h3>
        </div>

        {/* Dynamic Fee Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2E0914] to-[#18030B] border border-[#D4AF37]/50 text-amber-200 text-xs font-bold shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{selectedGameIds.length} {selectedGameIds.length === 1 ? 'Game' : 'Games'} • ₹{totalFee} Fee</span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 rounded-full bg-black/50 border border-white/5 overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-carnival-maroon to-carnival-gold transition-all duration-300 rounded-full shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps Navigation Bar */}
      <div className="grid grid-cols-6 gap-1 sm:gap-2 text-center">
        {STEP_LABELS.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < activeStep;
          const isCurrent = stepNum === activeStep;

          return (
            <button
              key={stepNum}
              disabled={!isCompleted && !isCurrent}
              onClick={() => goToStep(stepNum)}
              className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${
                isCurrent 
                  ? 'text-[#FFE28A] font-bold scale-105' 
                  : isCompleted 
                    ? 'text-stone-300 hover:text-white hover:bg-white/5' 
                    : 'text-stone-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-[#FFE28A] border border-[#E5C158] ring-2 ring-[#D4AF37]/30 shadow-md'
                    : isCompleted
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400'
                      : 'bg-black/40 text-stone-400 border border-white/10'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
              </div>
              <span className="text-[10px] sm:text-xs truncate max-w-full hidden sm:block font-medium">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
