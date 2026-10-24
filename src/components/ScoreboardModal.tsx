import React, { useState, useEffect } from 'react';
import { Trophy, Medal, X, Sparkles, Flame, User, Users, RefreshCw } from 'lucide-react';

interface ScoreItem {
  id: string;
  game_id: string;
  game_name: string;
  participant_name: string;
  roll_number?: string;
  score: string;
  rank: number;
  category: string;
}

interface ScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({ isOpen, onClose }) => {
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchScores = async (gameId: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = gameId === 'all' ? '/api/config/scoreboard' : `/api/config/scoreboard?gameId=${gameId}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setScores(json.data);
      }
    } catch (e) {
      // Fallback local list
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchScores(selectedGame);

    // Live Real-Time Auto Refresh every 4 seconds while modal is open
    const interval = setInterval(() => {
      fetchScores(selectedGame, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, selectedGame]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-white">
      
      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoreboardModalTitle"
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#18040C] border border-[#D4AF37]/50 shadow-2xl shadow-rose-950/80 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#3D0A17] bg-gradient-to-r from-[#2A0812] via-[#20050E] to-[#150309] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/40 shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Campus Live Leaderboard</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>LIVE FEED</span>
              </span>
            </div>

            <h3 id="scoreboardModalTitle" className="text-xl sm:text-2xl font-extrabold font-cinzel tracking-wider uppercase text-white">
              Official Carnival Rankings
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Live heat rankings and top scores verified by SRMU faculty safety marshals & event judges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchScores(selectedGame)}
              aria-label="Refresh leaderboard"
              className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/70 text-amber-300 border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh Scores"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              aria-label="Close leaderboard"
              className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/70 text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex border-b border-[#3D0A17] bg-[#120208] p-3 overflow-x-auto text-xs font-semibold gap-2">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'lemon-race', label: 'Lemon Race' },
            { id: 'target-shooting', label: 'Target Shooting' },
            { id: 'musical-chairs', label: 'Musical Chairs' },
            { id: 'cup-balloon-pyramid', label: 'Cup Pyramid' },
            { id: 'balloon-dual-race', label: 'Balloon Dual Race' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedGame(tab.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                selectedGame === tab.id
                  ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white border border-[#E5C158]/70 shadow-sm'
                  : 'bg-black/40 text-stone-400 hover:text-stone-200 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scores List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#15030A] flex-1">
          {scores.length === 0 ? (
            <div className="p-10 text-center text-stone-400 space-y-2">
              <Trophy className="w-10 h-10 text-amber-400/40 mx-auto" />
              <p className="text-sm font-semibold">No scores recorded for this event yet.</p>
              <p className="text-xs text-stone-500">Heats will commence at 11:00 AM on Thursday, 29 October 2026.</p>
            </div>
          ) : (
            scores.map((item, idx) => {
              const isFirst = item.rank === 1;
              const isSecond = item.rank === 2;
              const isThird = item.rank === 3;

              return (
                <div 
                  key={item.id || idx}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isFirst 
                      ? 'bg-gradient-to-r from-[#380E17] via-[#2A0812] to-[#1A030A] border-[#D4AF37] shadow-lg shadow-amber-950/20'
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isFirst 
                        ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-stone-950 shadow-md ring-2 ring-amber-300/40' 
                        : isSecond
                          ? 'bg-stone-300 text-stone-950'
                          : isThird
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-stone-400'
                    }`}>
                      {item.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base truncate">
                          {item.participant_name}
                        </span>
                        {isFirst && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            <Flame className="w-3 h-3 text-amber-400" />
                            1st Place
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5 truncate">
                        <span className="text-amber-200/90 font-medium">{item.game_name}</span>
                        {item.roll_number && <span>• Roll: {item.roll_number}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-amber-300 text-sm sm:text-base block">
                      {item.score}
                    </span>
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3D0A17] bg-[#120208] flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Scores updated dynamically during carnival heats</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
          >
            Close Leaderboard
          </button>
        </div>

      </div>
    </div>
  );
};
