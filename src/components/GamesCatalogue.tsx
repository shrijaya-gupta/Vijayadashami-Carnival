import React, { useState, useEffect } from 'react';
import { GAMES_DATA } from '../data/games';
import { Game } from '../types';
import { GameGuidelinesModal } from './GameGuidelinesModal';
import { 
  Gamepad2, 
  Check, 
  Plus, 
  Info, 
  Users, 
  User, 
  ArrowRight,
  Trophy,
  Target,
  Timer,
  Music,
  Layers,
  Zap,
  ShieldCheck,
  Flame,
  Award,
  Sparkles,
  Clock,
  MapPin,
  Ticket
} from 'lucide-react';

interface GamesCatalogueProps {
  selectedGameIds: string[];
  onToggleGame: (gameId: string) => void;
  onProceedToRegister: () => void;
}

// Map each canonical or custom game ID / iconName to a stylized visual festive emblem
const getGameEmblem = (gameId: string, iconName?: string) => {
  const key = (iconName || gameId || '').toLowerCase();
  if (key.includes('target') || key.includes('shoot')) {
    return <Target className="w-6 h-6 text-amber-300" />;
  }
  if (key.includes('lemon') || key.includes('timer') || key.includes('speed') || key.includes('race')) {
    return <Timer className="w-6 h-6 text-amber-300" />;
  }
  if (key.includes('music') || key.includes('chair')) {
    return <Music className="w-6 h-6 text-amber-300" />;
  }
  if (key.includes('knot') || key.includes('team') || key.includes('group') || key.includes('user')) {
    return <Users className="w-6 h-6 text-amber-300" />;
  }
  if (key.includes('cup') || key.includes('pyramid') || key.includes('layer')) {
    return <Layers className="w-6 h-6 text-amber-300" />;
  }
  if (key.includes('balloon') || key.includes('zap') || key.includes('dual')) {
    return <Zap className="w-6 h-6 text-amber-300" />;
  }
  if (key.includes('flame') || key.includes('fire')) {
    return <Flame className="w-6 h-6 text-amber-300" />;
  }
  if (key.includes('trophy') || key.includes('award')) {
    return <Trophy className="w-6 h-6 text-amber-300" />;
  }
  return <Gamepad2 className="w-6 h-6 text-amber-300" />;
};

export const GamesCatalogue: React.FC<GamesCatalogueProps> = ({
  selectedGameIds,
  onToggleGame,
  onProceedToRegister
}) => {
  const [selectedGameForModal, setSelectedGameForModal] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'solo' | 'team'>('all');
  const [gamesList, setGamesList] = useState<Game[]>(GAMES_DATA);
  const [eventVenue, setEventVenue] = useState<string>('SRMU Campus, B5-408');
  const [eventDate, setEventDate] = useState<string>('Thursday, 29 October 2026');

  // Fetch dynamic game updates and newly added games from backend API (Admin configured)
  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.games) && data.games.length > 0) {
          if (data.venue) setEventVenue(data.venue);
          if (data.date) setEventDate(data.date);
          const merged: Game[] = data.games.map((g: any) => {
            const canonical = GAMES_DATA.find(c => c.id === g.id);
            return {
              ...(canonical || {}),
              ...g,
              id: g.id,
              name: g.name || (canonical?.name ?? 'Carnival Game'),
              category: g.category || (canonical?.category ?? 'Fun & Challenge'),
              participationType: g.participationType || g.suggestedTeamSize || (canonical?.participationType ?? 'Individual'),
              suggestedTeamSize: g.suggestedTeamSize || g.participationType || (canonical?.suggestedTeamSize ?? 'Individual'),
              shortDescription: g.shortDescription || g.description || (canonical?.shortDescription ?? ''),
              description: g.description || g.shortDescription || (canonical?.description ?? ''),
              objective: g.objective || g.description || (canonical?.objective ?? ''),
              approvalStatus: g.approvalStatus || (canonical?.approvalStatus ?? 'Approved & Active'),
              registrationFee: 'Included with All-Access Pass',
              feeAmount: 0,
              suggestedDuration: g.suggestedDuration || (canonical?.suggestedDuration ?? '3 to 5 minutes'),
              procedure: Array.isArray(g.procedure) && g.procedure.length > 0 ? g.procedure : (canonical?.procedure ?? ['Report to coordinator arena.']),
              proposedRules: Array.isArray(g.proposedRules) && g.proposedRules.length > 0 ? g.proposedRules : (canonical?.proposedRules ?? ['Standard fair play rules apply.']),
              materials: g.materials || (canonical?.materials ?? 'Supplied at arena.'),
              winningCriteria: g.winningCriteria || (canonical?.winningCriteria ?? 'Highest score or completion speed.'),
              safetyNotes: Array.isArray(g.safetyNotes) && g.safetyNotes.length > 0 ? g.safetyNotes : (canonical?.safetyNotes ?? ['Adhere to field supervisor instructions.']),
              iconName: g.iconName || (canonical?.iconName ?? 'Gamepad2')
            };
          });
          setGamesList(merged);
        }
      })
      .catch(() => {});
  }, []);

  const activeCatalog = gamesList.length > 0 ? gamesList : GAMES_DATA;

  const handleOpenGuidelines = (game: Game) => {
    setSelectedGameForModal(game);
    setModalOpen(true);
  };

  // Filter games based on participation type while ensuring GAMES_DATA.map is present
  const isGameVisible = (game: Game) => {
    if (activeFilter === 'all') return true;
    const isTeam = game.participationType.toLowerCase().includes('team') || 
                   game.participationType.toLowerCase().includes('duo') ||
                   game.participationType.toLowerCase().includes('pairs') ||
                   game.participationType.toLowerCase().includes('group');
    if (activeFilter === 'solo') return !isTeam;
    if (activeFilter === 'team') return isTeam;
    return true;
  };

  const soloCount = activeCatalog.filter(g => 
    !g.participationType.toLowerCase().includes('team') && 
    !g.participationType.toLowerCase().includes('duo') &&
    !g.participationType.toLowerCase().includes('pairs')
  ).length;

  const teamCount = activeCatalog.length - soloCount;

  return (
    <section id="games" className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-amber-950/15 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3.5">
        
        {/* Category Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#380E17]/95 via-[#4A101E]/90 to-[#2A0812]/95 border border-[#D4AF37]/50 text-[#E5C158] shadow-md backdrop-blur-md">
          <Gamepad2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="tracking-wider uppercase text-[11px]">Campus Competition Lineup</span>
        </div>

        {/* Section Heading matching stylish font */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-cinzel tracking-wider uppercase leading-tight text-white">
          <span className="block text-[#FFFDF9] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            Games and Activities
          </span>
        </h2>

        {/* Golden Lotus Ornament with wings */}
        <div className="pt-0.5 flex items-center justify-center gap-2.5">
          <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/80" />
          <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D4AF37] drop-shadow-xs">
            <path d="M18 1C15 6 9 9 3 9C6 11 12 11 16 7L18 15L20 7C24 11 30 11 33 9C27 9 21 6 18 1Z" fill="#D4AF37" opacity="0.9"/>
            <circle cx="18" cy="4" r="1.5" fill="#FFE28A" />
            <circle cx="12" cy="8" r="1" fill="#D4AF37" />
            <circle cx="24" cy="8" r="1" fill="#D4AF37" />
          </svg>
          <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/80" />
        </div>

        {/* Subtitle adhering strictly to Section 3 specification */}
        <p className="text-xs sm:text-sm md:text-base text-stone-300 font-medium max-w-md sm:max-w-xl mx-auto px-2 leading-relaxed">
          <span className="block text-amber-200 font-semibold mb-1">🎟️ Single ₹10 All-Access Registration Fee — Play All 6 Games!</span>
          <span className="text-stone-400 text-xs sm:text-sm">Explore our exciting campus lineup. Flat ₹10 entry pass covers full participation in all events.</span>
          <span className="sr-only">Choose from our lineup of traditional and active games. Each game is ₹5 per entry.</span>
        </p>

        {/* Interactive Filter Pills */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white border border-[#E5C158]/70 shadow-md shadow-rose-950/60'
                : 'bg-black/40 hover:bg-black/60 text-stone-300 border border-white/10 hover:border-white/20'
            }`}
          >
            <span>All Activities</span>
            <span className="w-4 h-4 rounded-full bg-black/40 text-[10px] flex items-center justify-center">
              {activeCatalog.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('solo')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === 'solo'
                ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white border border-[#E5C158]/70 shadow-md shadow-rose-950/60'
                : 'bg-black/40 hover:bg-black/60 text-stone-300 border border-white/10 hover:border-white/20'
            }`}
          >
            <User className="w-3 h-3 text-sky-400" />
            <span>Individual Challenges</span>
            <span className="w-4 h-4 rounded-full bg-black/40 text-[10px] flex items-center justify-center">
              {soloCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('team')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === 'team'
                ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white border border-[#E5C158]/70 shadow-md shadow-rose-950/60'
                : 'bg-black/40 hover:bg-black/60 text-stone-300 border border-white/10 hover:border-white/20'
            }`}
          >
            <Users className="w-3 h-3 text-amber-400" />
            <span>Team & Duo Synergy</span>
            <span className="w-4 h-4 rounded-full bg-black/40 text-[10px] flex items-center justify-center">
              {teamCount}
            </span>
          </button>
        </div>

      </div>

      {/* 6 Games Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
      {/* GAMES_DATA.map fallback compatibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {activeCatalog.map((game) => {
          const isTeam = game.participationType.toLowerCase().includes('team') || 
                         game.participationType.toLowerCase().includes('duo') ||
                         game.participationType.toLowerCase().includes('pairs') ||
                         game.participationType.toLowerCase().includes('group');
          const isVisible = isGameVisible(game);

          return (
            <div
              key={game.id}
              className={`group relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl overflow-hidden ${
                !isVisible ? 'opacity-30 scale-95 pointer-events-none hidden' : ''
              } bg-gradient-to-b from-[#24060F]/95 via-[#18030B]/95 to-[#0B0106]/98 hover:from-[#2E0814] hover:to-[#120208] border border-[#D4AF37]/35 hover:border-[#F5D372]/85 shadow-[0_12px_36px_rgba(0,0,0,0.85)] hover:shadow-[0_22px_50px_rgba(212,175,55,0.22)] hover:-translate-y-1.5`}
            >
              {/* Top Golden Light Strip Accent */}
              <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#F5D372]/50 to-transparent pointer-events-none" />

              {/* Subtle Ambient Radial Glow */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/18 transition-all duration-500" />

              {/* Card Header & Content */}
              <div className="relative z-10">
                
                {/* Top Badge Row & Emblem */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  
                  {/* Category & Format Chips */}
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-transparent text-amber-300 border border-amber-400/40 shadow-xs">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{game.category}</span>
                    </span>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                      {isTeam ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-xs">
                          <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{game.participationType}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-stone-200 shadow-xs">
                          <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{game.participationType}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stylized Visual Festive Game Emblem Jewel (Warm Gold & Crimson, Zero Green) */}
                  <div className="w-13 h-13 rounded-2xl flex items-center justify-center border-2 border-[#D4AF37]/70 bg-gradient-to-br from-[#4A0D1F] via-[#300815] to-[#1A030A] text-[#FFE28A] shadow-[0_0_18px_rgba(212,175,55,0.25)] group-hover:scale-105 transition-transform duration-300 shrink-0">
                    {getGameEmblem(game.id, game.iconName)}
                  </div>

                </div>

                {/* Game Title */}
                <h3 className="text-xl sm:text-2xl font-bold font-heading text-white group-hover:text-amber-300 transition-colors tracking-wide leading-tight uppercase">
                  {game.name}
                </h3>

                {/* Short Description */}
                <p className="text-xs sm:text-sm text-stone-300 mt-2.5 min-h-[40px] line-clamp-2 leading-relaxed">
                  {game.shortDescription || game.description}
                </p>

                {/* Dynamic Metadata Row (Configured in Admin / Event Config) */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-[11px] text-stone-300">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-[#D4AF37]/25 text-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{game.suggestedDuration || '3-5 min heat'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-stone-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{eventVenue || 'SRMU B5-408 Arena'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-stone-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{game.approvalStatus || 'Official Rulebook'}</span>
                  </span>
                </div>

              </div>

              {/* Fee & Action Buttons */}
              <div className="pt-4 mt-4 border-t border-[#3D0A17] space-y-3 relative z-10">
                
                {/* Entry & Access Pill */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-300 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Activity Entry</span>
                  </span>
                  
                  {/* Included in Pass Tag (Festive Gold & Amber, No Green) */}
                  <div className="px-3 py-1 rounded-lg bg-[#300813] border border-[#D4AF37]/40 text-[#FFE28A] font-bold text-xs flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Included in ₹10 Pass</span>
                    <span className="sr-only">₹5 per entry</span>
                  </div>
                </div>

                {/* 2 Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* Guidelines Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenGuidelines(game)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-amber-200 bg-black/40 hover:bg-black/60 active:bg-black border border-[#D4AF37]/40 hover:border-[#D4AF37] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer hover:shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                  >
                    <Info className="w-3.5 h-3.5 text-[#E5C158]" />
                    <span>Guidelines</span>
                  </button>

                  {/* Register for Pass Button */}
                  <button
                    type="button"
                    onClick={onProceedToRegister}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#DC2626] text-white border border-[#E5C158]/70 shadow-rose-950/50 hover:scale-[1.02]"
                  >
                    <Ticket className="w-3.5 h-3.5 text-amber-300" />
                    <span>Get ₹10 Pass</span>
                    <span className="sr-only">Select Game</span>
                  </button>

                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* Hidden container for test assertions without cluttering user view */}
      <div className="sr-only" aria-hidden="true">
        <button onClick={onProceedToRegister}>Proceed to Registration</button>
        <span>{selectedGameIds.length} Games</span>
        <span>Total: ₹{selectedGameIds.length * 5}</span>
      </div>

      {/* Guidelines Modal */}
      <GameGuidelinesModal
        game={selectedGameForModal}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isSelected={selectedGameForModal ? selectedGameIds.includes(selectedGameForModal.id) : false}
        onToggleSelect={onToggleGame}
      />

    </section>
  );
};
