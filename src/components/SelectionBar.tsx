import React, { useState } from 'react';
import { GAMES_DATA } from '../data/games';
import { ArrowRight, Trophy, X, Flame, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  if (selectedGameIds.length === 0) return null;

  const totalFee = 10; // selectedGameIds.length * 5
  const isAllIncluded = true;

  return (
    <aside 
      aria-label="Selected Games Summary"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-6 z-40 max-w-[calc(100vw-1.5rem)] sm:max-w-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto w-auto"
    >
      {/* Expandable Chips Tray */}
      {isExpanded && (
        <div className="mb-2 p-3 rounded-2xl bg-[#1A040E]/95 backdrop-blur-xl border border-[#D4AF37]/50 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-bold text-amber-200">
            <span>All-Access Carnival Pass</span>
            <span className="text-amber-400 font-extrabold">Total: ₹{totalFee}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {selectedGameIds.map(id => {
              const game = GAMES_DATA.find(g => g.id === id);
              if (!game) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2A0812] text-amber-100 border border-[#D4AF37]/40 shadow-xs"
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
        </div>
      )}

      {/* Main Compact Floating Pill */}
      <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#120208]/95 backdrop-blur-2xl border-2 border-[#D4AF37]/70 shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-white">
        
        {/* Count & Fee Display */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left"
          title={isExpanded ? "Hide games" : "View included games"}
        >
          <span className="w-7 h-7 rounded-full bg-gradient-to-r from-[#9F1239] to-[#BE123C] text-[#FFE28A] font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)] border border-[#D4AF37] shrink-0">
            ₹10
          </span>
          <div className="hidden sm:flex flex-col pr-1">
            <span className="text-[11px] font-bold text-white leading-tight">
              All-Access Pass (All Games)
            </span>
            <span className="text-[10px] text-amber-300 font-bold leading-tight">
              Total: ₹{totalFee}
            </span>
          </div>
          <div className="sm:hidden font-extrabold text-amber-300 text-xs">
            Total: ₹{totalFee}
          </div>
          <span className="text-stone-400 hover:text-white transition-colors">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </span>
        </button>

        {/* Hidden screen-reader friendly elements to ensure full compatibility */}
        <div className="sr-only">
          <span>{selectedGameIds.length === 1 ? '1 Game Selected' : `${selectedGameIds.length} Games Selected`}</span>
          <span>Total: ₹{totalFee}</span>
          <div>
            {selectedGameIds.map(id => (
              <span key={`sr-${id}`}>{id}</span>
            ))}
          </div>
        </div>

        {/* Proceed Action Button */}
        <button
          onClick={onProceed}
          className="shine-effect px-4 py-2 rounded-full font-bold text-xs bg-gradient-to-r from-[#881337] via-[#BE123C] to-[#881337] hover:from-[#9F1239] hover:to-[#BE123C] text-white flex items-center gap-1.5 shadow-md shadow-rose-950/70 hover:scale-105 active:scale-95 transition-all border border-[#FFE28A]/80 cursor-pointer whitespace-nowrap"
        >
          <Flame className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Proceed to Registration</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        </button>

      </div>
    </aside>
  );
};
