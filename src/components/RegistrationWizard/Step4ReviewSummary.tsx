import React from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { GAMES_DATA } from '../../data/games';
import { 
  ArrowLeft, 
  ArrowRight, 
  Edit3, 
  User, 
  Gamepad2, 
  Trophy, 
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export const Step4ReviewSummary: React.FC = () => {
  const { student, selectedGameIds, gameConfigs, totalFee, goToStep, nextStep, prevStep } = useRegistration();

  // Privacy phone masking: e.g. ••••••3210 (Protected)
  const maskPhone = (phone: string): string => {
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    if (clean.length >= 4) {
      return `••••••${clean.slice(-4)} (Protected)`;
    }
    return 'Provided (Protected)';
  };

  return (
    <div className="space-y-6 text-white">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
          Step 4: Review Your Registration Summary
        </h3>
        <p className="text-xs sm:text-sm text-stone-300 mt-1">
          Please verify all participant information, game formats, and fee calculations before proceeding to payment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Student Details Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#20050E]/90 border border-[#D4AF37]/35 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-200 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Participant Information
              </h4>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="text-xs font-bold text-amber-300 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-stone-400">Student Name:</span>
                <span className="font-bold text-white">{student.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">University Roll No:</span>
                <span className="font-mono font-bold text-amber-200">{student.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Mobile Number:</span>
                <span className="font-mono font-bold text-stone-200">{maskPhone(student.mobileNumber)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Course & Branch:</span>
                <span className="font-semibold text-white">
                  {student.course === 'Other' ? student.courseOther : student.course} — {student.branch === 'Other' ? student.branchOther : student.branch}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Academic Year:</span>
                <span className="font-semibold text-white">{student.academicYear}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Full phone number is encrypted & visible only to event marshals.</span>
          </div>
        </div>

        {/* Selected Games & Teams Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#20050E]/90 border border-[#D4AF37]/35 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-200 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                Selected Events ({selectedGameIds.length})
              </h4>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="text-xs font-bold text-amber-300 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Change Games
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedGameIds.map((gameId) => {
                const gameMeta = GAMES_DATA.find(g => g.id === gameId);
                const config = gameConfigs[gameId];
                if (!gameMeta || !config) return null;

                const isTeam = config.participationType === 'team';

                return (
                  <div key={gameId} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-white block">
                        {gameMeta.name}
                      </span>
                      {isTeam ? (
                        <div className="text-stone-300 mt-0.5">
                          Squad: <strong className="text-amber-300">{config.teamName}</strong> • {config.teamMembers.length + 1} players
                        </div>
                      ) : (
                        <span className="text-stone-400">Individual Entry</span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-bold bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/40">
                      ₹5
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="text-xs font-semibold text-stone-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              Edit Team Members
            </button>
          </div>
        </div>

      </div>

      {/* Itemized Fee Breakdown Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#2B0813] via-[#1F050E] to-[#16030A] border border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              Authoritative Fee Breakdown
            </span>
            <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
              ₹5 Per Selected Game
            </h4>
            <p className="text-xs text-stone-300 mt-1 max-w-md">
              Fee is calculated strictly per chosen activity ({selectedGameIds.length} games × ₹5). Team members are NOT charged additional fees.
            </p>
          </div>

          <div className="flex items-baseline gap-2 bg-black/60 py-2.5 px-4 rounded-xl border border-[#D4AF37]/40 shadow-xs self-start sm:self-auto">
            <span className="text-xs text-stone-400 font-semibold uppercase">Total Payable:</span>
            <span className="text-2xl sm:text-3xl font-black font-heading text-amber-300">
              ₹{totalFee}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={prevStep}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-stone-300 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team Setup</span>
        </button>

        <button
          type="button"
          onClick={() => nextStep()}
          className="w-full sm:w-auto px-7 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#E5C158]/70 cursor-pointer"
        >
          <span>Proceed to Payment (₹{totalFee})</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>
      </div>
    </div>
  );
};
