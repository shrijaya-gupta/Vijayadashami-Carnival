import React, { useState } from 'react';
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
  Sparkles,
  ArrowRight,
  Trophy,
  Target,
  Timer,
  Music,
  Layers,
  Zap,
  ShieldCheck,
  Flame,
  Award
} from 'lucide-react';

interface GamesCatalogueProps {
  selectedGameIds: string[];
  onToggleGame: (gameId: string) => void;
  onProceedToRegister: () => void;
}

// Map each canonical game ID to a stylized visual festive emblem
const getGameEmblem = (gameId: string) => {
  switch (gameId) {
    case 'lemon-race':
      return <Timer className="w-5 h-5 text-amber-300" />;
    case 'target-shooting':
      return <Target className="w-5 h-5 text-amber-300" />;
    case 'musical-chairs':
      return <Music className="w-5 h-5 text-amber-300" />;
    case 'human-knot':
      return <Users className="w-5 h-5 text-amber-300" />;
    case 'cup-balloon-pyramid':
      return <Layers className="w-5 h-5 text-amber-300" />;
    case 'balloon-dual-race':
      return <Zap className="w-5 h-5 text-amber-300" />;
    default:
      return <Gamepad2 className="w-5 h-5 text-amber-300" />;
  }
};

export const GamesCatalogue: React.FC<GamesCatalogueProps> = ({
  selectedGameIds,
  onToggleGame,
  onProceedToRegister
}) => {
  const [selectedGameForModal, setSelectedGameForModal] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'solo' | 'team'>('all');

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

  const soloCount = GAMES_DATA.filter(g => 
    !g.participationType.toLowerCase().includes('team') && 
    !g.participationType.toLowerCase().includes('duo') &&
    !g.participationType.toLowerCase().includes('pairs')
  ).length;

  const teamCount = GAMES_DATA.length - soloCount;

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
          Choose from our lineup of traditional and active games. Each game is ₹5 per entry.
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
              {GAMES_DATA.length}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES_DATA.map((game) => {
          const isSelected = selectedGameIds.includes(game.id);
          const isTeam = game.participationType.toLowerCase().includes('team') || 
                         game.participationType.toLowerCase().includes('duo') ||
                         game.participationType.toLowerCase().includes('pairs') ||
                         game.participationType.toLowerCase().includes('group');
          const isVisible = isGameVisible(game);

          return (
            <div
              key={game.id}
              className={`group relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ${
                !isVisible ? 'opacity-30 scale-95 pointer-events-none hidden' : ''
              } ${
                isSelected
                  ? 'bg-gradient-to-b from-[#0C2417] via-[#081B10] to-[#040F08] border-2 border-emerald-400 shadow-[0_15px_40px_-5px_rgba(16,185,129,0.35)] scale-[1.01] backdrop-blur-xl'
                  : 'bg-gradient-to-b from-[#24060F]/95 via-[#18030B]/95 to-[#0E0207] hover:from-[#2E0914] hover:to-[#14030A] border border-[#D4AF37]/35 hover:border-[#F5D372]/90 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_45px_-8px_rgba(212,175,55,0.25)] hover:-translate-y-1.5 backdrop-blur-xl'
              }`}
            >
              {/* Selected VIP Badge */}
              {isSelected && (
                <div className="absolute -top-3 -right-2 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-950/60 flex items-center gap-1 border border-white/40 animate-in fade-in zoom-in-95">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Selected</span>
                </div>
              )}

              {/* Card Header & Content */}
              <div>
                
                {/* Top Badge Row & Emblem */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  
                  {/* Category & Format Chips */}
                  <div className="space-y-1.5">
                    <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/50 shadow-xs">
                      {game.category}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-300">
                      {isTeam ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
                          <Users className="w-3 h-3 text-amber-400" />
                          <span>{game.participationType}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300">
                          <User className="w-3 h-3 text-sky-400" />
                          <span>{game.participationType}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stylized Visual Festive Game Emblem */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform duration-300 group-hover:scale-110 shadow-md ${
                    isSelected 
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                      : 'bg-gradient-to-br from-[#4A0D1F] via-[#2F0815] to-[#1A030A] border-[#D4AF37]/60 text-[#E5C158] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                  }`}>
                    {getGameEmblem(game.id)}
                  </div>

                </div>

                {/* Game Title */}
                <h3 className="text-xl sm:text-2xl font-bold font-heading text-white group-hover:text-amber-300 transition-colors">
                  {game.name}
                </h3>

                {/* Short Description */}
                <p className="text-xs sm:text-sm text-stone-300 mt-2 line-clamp-2 leading-relaxed">
                  {game.shortDescription}
                </p>

                {/* Highlights / Safety Badge */}
                <div className="mt-3.5 flex items-center gap-2 text-[11px] text-amber-200/80">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">SRMU Campus B5-408 • Official Rulebook</span>
                </div>

              </div>

              {/* Fee & Action Buttons */}
              <div className="pt-4 mt-4 border-t border-[#3D0A17] space-y-3">
                
                {/* Fee & Entry Pill */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <span>Registration Fee</span>
                  </span>
                  
                  {/* Golden Ticket Fee Pill */}
                  <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#2B0813] to-[#18030B] border border-[#D4AF37]/50 shadow-xs flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#EA580C] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      ₹
                    </span>
                    <span className="text-amber-200 font-bold text-xs">
                      ₹5 per entry
                    </span>
                  </div>
                </div>

                {/* 2 Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* Guidelines Button */}
                  <button
                    onClick={() => handleOpenGuidelines(game)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-amber-200 bg-black/40 hover:bg-black/60 active:bg-black border border-[#D4AF37]/40 hover:border-[#D4AF37] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-[#E5C158]" />
                    <span>Guidelines</span>
                  </button>

                  {/* Select Game Button */}
                  <button
                    onClick={() => onToggleGame(game.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-300'
                        : 'bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#DC2626] text-white border border-[#E5C158]/60 hover:scale-[1.02]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Select Game</span>
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* Inline Selection Banner (Natural in-page card, zero sticky obstruction) */}
      {selectedGameIds.length > 0 && (
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-[#2B0813] via-[#3F0C1B] to-[#2B0813] border border-[#D4AF37]/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-r from-[#881337] to-[#B91C1C] text-[#FFE28A] font-black text-sm flex items-center justify-center border border-[#D4AF37]/60 shadow-md">
              {selectedGameIds.length}
            </span>
            <div>
              <h4 className="text-sm font-bold text-white">
                {selectedGameIds.length === 1 ? '1 Game Selected' : `${selectedGameIds.length} Games Selected`}
              </h4>
              <p className="text-xs text-amber-200/80">
                Total Registration Fee: <strong className="text-amber-300 font-extrabold text-sm">₹{selectedGameIds.length * 5}</strong> (₹5 per game)
              </p>
            </div>
          </div>

          <button
            onClick={onProceedToRegister}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/70 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#E5C158]/70 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Proceed to Registration</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      )}

      {/* Value Props & Safety Assurance Banner */}
      <div className="mt-12 sm:mt-16 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#24060F]/90 via-[#350A16]/90 to-[#18030B]/90 border border-[#D4AF37]/40 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center sm:text-left">
          
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Safe & Supervised</h4>
              <p className="text-[11px] text-stone-300">All games operate under faculty safety marshals.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Certificates & Awards</h4>
              <p className="text-[11px] text-stone-300">Official SRMU certificates awarded to participants.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Affordable ₹5 Entry</h4>
              <p className="text-[11px] text-stone-300">Register for any 1 game or all 6 games at ₹5 each.</p>
            </div>
          </div>

        </div>
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
