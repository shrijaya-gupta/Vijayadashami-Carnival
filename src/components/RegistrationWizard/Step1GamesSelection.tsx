import React, { useState } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { GAMES_DATA } from '../../data/games';
import { Game } from '../../types';
import { GameGuidelinesModal } from '../GameGuidelinesModal';
import { Check, Info, ArrowRight, AlertCircle, Sparkles, Zap } from 'lucide-react';

export const Step1GamesSelection: React.FC = () => {
  const { selectedGameIds, toggleGameSelection, nextStep, submitError } = useRegistration();
  const [selectedGameForModal, setSelectedGameForModal] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6 text-white">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
            Step 1: Choose Your Carnival Games
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Select between 1 and 6 games to participate in. The entry fee is strictly ₹5 per selected game.
          </p>
        </div>

        {/* Quick-Advance Button if games already chosen */}
        {selectedGameIds.length > 0 && (
          <button
            type="button"
            onClick={() => nextStep()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950/40 border border-emerald-300 animate-in fade-in cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Continue with {selectedGameIds.length} Selected (₹{selectedGameIds.length * 5})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      {/* 6 Games Selection List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES_DATA.map((game) => {
          const isSelected = selectedGameIds.includes(game.id);

          return (
            <div
              key={game.id}
              onClick={() => toggleGameSelection(game.id)}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-[#132A1C] to-[#0A170F] border-emerald-400 shadow-lg shadow-emerald-950/40 scale-[1.01]'
                  : 'bg-[#20050E]/90 hover:bg-[#280813] border-[#D4AF37]/30 hover:border-[#D4AF37]/60 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/40">
                    {game.category}
                  </span>

                  {/* Selection Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs'
                        : 'border-2 border-stone-500 bg-black/30'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white">
                  {game.name}
                </h4>
                <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                  {game.shortDescription}
                </p>
              </div>

              <div className="pt-3.5 mt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ₹5 Online Entry
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGameForModal(game);
                    setModalOpen(true);
                  }}
                  className="text-xs font-semibold text-stone-300 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-lg bg-black/40 hover:bg-black/70 border border-white/10 transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-amber-300" />
                  Guidelines
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-medium text-stone-300">
          Selected: <strong className="text-amber-300 font-bold">{selectedGameIds.length}</strong> of 6 games (₹{selectedGameIds.length * 5})
        </div>

        <button
          type="button"
          onClick={() => nextStep()}
          className="w-full sm:w-auto px-7 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#E5C158]/70 cursor-pointer"
        >
          <span>Continue to Student Details</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* Guidelines Modal */}
      <GameGuidelinesModal
        game={selectedGameForModal}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isSelected={selectedGameForModal ? selectedGameIds.includes(selectedGameForModal.id) : false}
        onToggleSelect={toggleGameSelection}
      />
    </div>
  );
};
