import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Trophy, 
  X, 
  Award, 
  Flame, 
  User, 
  Users, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Target, 
  Timer, 
  Zap 
} from 'lucide-react';
import { GAMES_DATA, EVENT_DETAILS } from '../data/games';

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

// Game-specific scoring metrics and rules
const GAME_SCORING_METRICS: Record<string, {
  metricName: string;
  metricFormula: string;
  winningCriteria: string;
  badgeLabel: string;
}> = {
  'lemon-race': {
    metricName: 'Sprint Lap Time',
    metricFormula: 'Timed single-lane sprint with lemon balanced on spoon. Lowest time wins.',
    winningCriteria: 'Lowest completed course lap time without hand-touching penalties.',
    badgeLabel: 'Lap Time (Seconds)'
  },
  'target-shooting': {
    metricName: 'Target Precision Accuracy',
    metricFormula: 'Supervised target precision shots on numbered concentric bullseye rings.',
    winningCriteria: 'Highest total cumulative score out of 100 points.',
    badgeLabel: 'Accuracy Points'
  },
  'musical-chairs': {
    metricName: 'Elimination Showdown',
    metricFormula: 'Multi-round survival heats with continuous musical rotation and seat claim.',
    winningCriteria: 'Last remaining participant in the final 2-player showdown wins 1st place.',
    badgeLabel: 'Showdown Rounds'
  },
  'human-knot': {
    metricName: 'Squad Untangle Speed',
    metricFormula: 'Team of 4–6 students untangling interlocked hands into an unbroken circle.',
    winningCriteria: 'Fastest team to resolve into a complete circle without releasing hand grips.',
    badgeLabel: 'Untangle Time'
  },
  'cup-balloon-pyramid': {
    metricName: 'Pyramid Stack Time',
    metricFormula: 'Building cup pyramid using balloon air suction without touching cups by hand.',
    winningCriteria: 'Fastest pyramid stack that remains freestanding for 10 consecutive seconds.',
    badgeLabel: 'Stack Time'
  },
  'balloon-dual-race': {
    metricName: 'Tandem Duo Course Time',
    metricFormula: 'Pairs carry inflated balloon between their bodies without hands over course.',
    winningCriteria: 'Fastest tandem pair to complete the sprint without dropping or bursting balloon.',
    badgeLabel: 'Tandem Time'
  }
};

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({ isOpen, onClose }) => {
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [totalRegistered, setTotalRegistered] = useState<number>(0);

  const fetchScores = async (gameId: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = gameId === 'all' ? '/api/config/scoreboard' : `/api/config/scoreboard?gameId=${gameId}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.data)) {
          setScores(json.data);
        }
        if (json.participantCounts) {
          setParticipantCounts(json.participantCounts);
        }
        if (json.totalRegistered != null) {
          setTotalRegistered(json.totalRegistered);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.94, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    }

    fetchScores(selectedGame);

    // Live Real-Time Auto Refresh every 4 seconds while modal is open
    const interval = setInterval(() => {
      fetchScores(selectedGame, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, selectedGame]);

  if (!isOpen) return null;

  // Active game metadata if a specific game is selected
  const activeGameData = selectedGame !== 'all' ? GAMES_DATA.find(g => g.id === selectedGame) : null;
  const activeMetrics = selectedGame !== 'all' ? GAME_SCORING_METRICS[selectedGame] : null;
  const registeredCountForActive = selectedGame !== 'all' 
    ? (participantCounts[selectedGame] || 0) 
    : totalRegistered;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-white">
      
      {/* Modal Dialog Card */}
      <div 
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoreboardModalTitle"
        data-lenis-prevent
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#140209] border-2 border-[#D4AF37]/50 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#3D0A17] bg-gradient-to-r from-[#2A0812] via-[#20050E] to-[#150309] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/40 shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Event Leaderboard</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>REAL-TIME SCORING</span>
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

        {/* Dynamic 6 Games Filter Tabs */}
        <div className="flex border-b border-[#3D0A17] bg-[#100207] p-2.5 sm:p-3 overflow-x-auto text-xs font-semibold gap-2 no-scrollbar">
          {/* All Activities tab */}
          <button
            onClick={() => setSelectedGame('all')}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedGame === 'all'
                ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white border border-[#E5C158]/70 shadow-sm'
                : 'bg-black/40 text-stone-400 hover:text-stone-200 border border-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>All Activities ({GAMES_DATA.length})</span>
          </button>

          {/* All 6 canonical games from GAMES_DATA */}
          {GAMES_DATA.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedGame === game.id
                  ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white border border-[#E5C158]/70 shadow-sm'
                  : 'bg-black/40 text-stone-400 hover:text-stone-200 border border-white/5'
              }`}
            >
              <span>{game.name}</span>
              {participantCounts[game.id] ? (
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                  {participantCounts[game.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Selected Game Specific Context Banner */}
        {activeGameData && activeMetrics && (
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[#20040D] via-[#160209] to-[#20040D] border-b border-[#D4AF37]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {activeGameData.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                  {activeGameData.participationType}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-semibold border border-sky-500/30">
                  Metric: {activeMetrics.badgeLabel}
                </span>
              </div>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                {activeMetrics.metricFormula}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-[11px] text-stone-300 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>29 Oct, 11:00 AM</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{registeredCountForActive} Registered</span>
              </div>
            </div>
          </div>
        )}

        {/* Scores List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#120207] flex-1 min-h-[300px]">
          {scores.length === 0 ? (
            /* Clean, authentic Awaiting Heats state (No fake mock names) */
            <div className="py-12 px-4 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/40 text-amber-300 flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(212,175,55,0.2)]">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              
              <div>
                <h4 className="text-base sm:text-lg font-bold font-heading text-white">
                  {activeGameData ? `${activeGameData.name} — Heats Scheduled` : 'Carnival Heats Awaiting Judges\' Scores'}
                </h4>
                <p className="text-xs sm:text-sm text-stone-300 mt-1.5 leading-relaxed">
                  {activeMetrics 
                    ? activeMetrics.winningCriteria 
                    : 'All 6 carnival challenges commence at 11:00 AM on Thursday, 29 October 2026 at SRMU B5-408.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs text-stone-300 space-y-2 text-left">
                <div className="flex items-center justify-between text-amber-200 font-semibold border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Official Judging & Marshals</span>
                  </span>
                  <span>SRMU Faculty Safety Panel</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Scores will be timed and logged directly by authorized judges at the B5-408 arena lane. Verified ranks and heat times will appear here in real-time.
                </p>
              </div>
            </div>
          ) : (
            /* Dynamic Recorded Scores */
            scores.map((item, idx) => {
              const rankNum = Number(item.rank) || (idx + 1);
              const isFirst = rankNum === 1;
              const isSecond = rankNum === 2;
              const isThird = rankNum === 3;

              return (
                <div 
                  key={item.id || idx}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isFirst 
                      ? 'bg-gradient-to-r from-[#380E17] via-[#2A0812] to-[#1A030A] border-[#D4AF37] shadow-lg shadow-amber-950/20'
                      : isSecond
                        ? 'bg-gradient-to-r from-[#220710] to-[#140208] border-stone-400/40'
                        : isThird
                          ? 'bg-gradient-to-r from-[#220710] to-[#140208] border-amber-700/40'
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
                      {rankNum}
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
                      {item.category || 'Heat Rank'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3D0A17] bg-[#100207] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Scores updated dynamically during carnival heats</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-full font-bold text-xs bg-black/60 hover:bg-black text-white border border-[#D4AF37]/40 hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs"
          >
            Close Leaderboard
          </button>
        </div>

      </div>
    </div>
  );
};
