import React from 'react';
import { GAMES_DATA } from '../data/games';
import { ArrowRight, Trophy, X, Sparkles } from 'lucide-react';

interface SelectionBarProps {
  selectedGameIds: string[];
  onRemoveGame: (gameId: string) => void;
  onProceed: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedGameIds,
  onRemoveGame,
  onProceed
}) => {
  if (selectedGameIds.length === 0) return null;

  const totalFee = selectedGameIds.length * 5;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-[#14030A]/95 backdrop-blur-xl border-t border-[#D4AF37]/50 shadow-2xl shadow-black transition-all animate-in slide-in-from-bottom duration-300 text-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Count & Fee Display */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-[#881337] to-[#B91C1C] text-[#FFE28A] font-black text-xs flex items-center justify-center shadow-md border border-[#D4AF37]/60 shrink-0">
              {selectedGameIds.length}
            </span>
            <div>
              <span className="text-xs font-bold text-white block">
                {selectedGameIds.length === 1 ? '1 Game Selected' : `${selectedGameIds.length} Games Selected`}
              </span>
              <span className="text-[11px] text-amber-200/80">
                ₹5 entry fee per game
              </span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2B0813] to-[#18030B] border border-[#D4AF37]/50 text-amber-300 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Total: ₹{totalFee}</span>
          </div>
        </div>

        {/* Selected Chips */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-xl py-1 px-2">
          {selectedGameIds.map(id => {
            const game = GAMES_DATA.find(g => g.id === id);
            if (!game) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2A0812]/90 text-amber-200 border border-[#D4AF37]/40 shadow-xs whitespace-nowrap"
              >
                <span>{game.name}</span>
                <button
                  onClick={() => onRemoveGame(id)}
                  aria-label={`Remove ${game.name}`}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>

        {/* Proceed Button */}
        <button
          onClick={onProceed}
          className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/70 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#E5C158]/70 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Proceed to Registration</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>

      </div>
    </div>
  );
};
