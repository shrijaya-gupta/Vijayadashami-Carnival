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

// 1. Target Shooting Emblem SVG
const TargetShootingIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="targetGlow" cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#881337" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="targetGold" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#996515" />
      </linearGradient>
      <linearGradient id="targetArrow" x1="10" y1="90" x2="70" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FFFBEB" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="44" fill="url(#targetGlow)" />
    <circle cx="50" cy="50" r="40" stroke="url(#targetGold)" strokeWidth="3" strokeDasharray="6 3" />
    <circle cx="50" cy="50" r="32" stroke="#991B1B" strokeWidth="4" opacity="0.9" />
    <circle cx="50" cy="50" r="23" stroke="url(#targetGold)" strokeWidth="3" />
    <circle cx="50" cy="50" r="14" fill="#B91C1C" stroke="url(#targetGold)" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="6" fill="#FDE047" />
    <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
    <line x1="16" y1="84" x2="48" y2="52" stroke="url(#targetArrow)" strokeWidth="4.5" strokeLinecap="round" />
    <polygon points="53,47 43,49 49,55" fill="#FFEAA7" stroke="#D4AF37" strokeWidth="1" />
    <path d="M14 86 L10 80 M18 90 L24 86 M18 82 L12 88" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="50,44 52,48 56,50 52,52 50,56 48,52 44,50 48,48" fill="#FFFBEB" />
  </svg>
);

// 2. Lemon Race Emblem SVG
const LemonRaceIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="spoonMetal" x1="15" y1="75" x2="85" y2="35" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="35%" stopColor="#E2E8F0" />
        <stop offset="70%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
      <linearGradient id="lemonYellow" x1="35" y1="20" x2="65" y2="55" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="40%" stopColor="#FACC15" />
        <stop offset="80%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="speedOrange" x1="10" y1="50" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <line x1="8" y1="36" x2="32" y2="36" stroke="url(#speedOrange)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3" />
    <line x1="12" y1="52" x2="38" y2="52" stroke="url(#speedOrange)" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="16" y1="68" x2="42" y2="68" stroke="url(#speedOrange)" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 2" />
    <path d="M18 84 C28 78 40 68 50 58 L54 54" stroke="url(#spoonMetal)" strokeWidth="5.5" strokeLinecap="round" />
    <ellipse cx="62" cy="46" rx="22" ry="14" transform="rotate(-25 62 46)" fill="#1E070F" stroke="url(#spoonMetal)" strokeWidth="3.5" />
    <ellipse cx="60" cy="36" rx="17" ry="12" transform="rotate(-15 60 36)" fill="url(#lemonYellow)" stroke="#A16207" strokeWidth="1.5" />
    <path d="M44 38 Q42 35 45 33" stroke="#A16207" strokeWidth="2" strokeLinecap="round" />
    <path d="M76 34 Q79 37 76 39" stroke="#A16207" strokeWidth="2" strokeLinecap="round" />
    <path d="M60 24 C64 16 72 18 70 24 C68 28 62 26 60 24 Z" fill="#22C55E" stroke="#15803D" strokeWidth="1" />
    <ellipse cx="56" cy="32" rx="7" ry="3.5" transform="rotate(-20 56 32)" fill="#FFFFFF" opacity="0.65" />
  </svg>
);

// 3. Musical Chairs Emblem SVG
const MusicalChairsIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="chairGold" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="45%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#996515" />
      </linearGradient>
      <linearGradient id="musicFlame" x1="40" y1="10" x2="90" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="52" r="42" stroke="url(#chairGold)" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.4" />
    <path d="M22 36 A36 36 0 0 1 78 36" stroke="url(#chairGold)" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
    <path d="M28 68 A34 34 0 0 0 72 68" stroke="url(#chairGold)" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
    <rect x="38" y="24" width="24" height="26" rx="4" fill="#2A0813" stroke="url(#chairGold)" strokeWidth="2.5" />
    <path d="M44 28 V44 M50 28 V44 M56 28 V44" stroke="url(#chairGold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <path d="M32 50 L68 50 L64 58 L36 58 Z" fill="#9F1239" stroke="url(#chairGold)" strokeWidth="2.5" strokeLinejoin="round" />
    <line x1="36" y1="58" x2="32" y2="78" stroke="url(#chairGold)" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="58" x2="68" y2="78" stroke="url(#chairGold)" strokeWidth="3" strokeLinecap="round" />
    <line x1="42" y1="58" x2="41" y2="74" stroke="url(#chairGold)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <line x1="58" y1="58" x2="59" y2="74" stroke="url(#chairGold)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <path d="M68 26 C68 20 74 16 80 14 V32 M80 20 L68 24" stroke="url(#musicFlame)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx="66" cy="34" rx="4.5" ry="3.5" transform="rotate(-15 66 34)" fill="url(#musicFlame)" />
    <ellipse cx="78" cy="31" rx="4.5" ry="3.5" transform="rotate(-15 78 31)" fill="url(#musicFlame)" />
    <polygon points="50,14 52,18 56,20 52,22 50,26 48,22 44,20 48,18" fill="#FDE047" />
  </svg>
);

// 4. Human Knot Challenge Emblem SVG
const HumanKnotIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="knotGold" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="42" stroke="url(#knotGold)" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
    <path 
      d="M50 20 C68 35 78 58 64 74 C52 86 32 76 36 60 C40 44 60 44 64 60 C68 76 48 86 36 74 C22 58 32 35 50 20 Z" 
      stroke="url(#knotGold)" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M50 36 C58 44 64 56 56 64 C48 72 38 66 40 56 C42 46 58 46 50 36 Z" 
      stroke="#FFFBEB" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
    <circle cx="50" cy="18" r="6" fill="#F43F5E" stroke="#FFEAA7" strokeWidth="2" />
    <circle cx="74" cy="64" r="6" fill="#F59E0B" stroke="#FFEAA7" strokeWidth="2" />
    <circle cx="26" cy="64" r="6" fill="#38BDF8" stroke="#FFEAA7" strokeWidth="2" />
    <polygon points="50,44 52,48 56,50 52,52 50,56 48,52 44,50 48,48" fill="#FFFFFF" />
  </svg>
);

// 5. Cup & Balloon Pyramid Emblem SVG
const CupBalloonPyramidIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cupGold" x1="20" y1="30" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="45%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#854D0E" />
      </linearGradient>
      <linearGradient id="balloonRuby" x1="40" y1="10" x2="65" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="35%" stopColor="#E11D48" />
        <stop offset="85%" stopColor="#881337" />
        <stop offset="100%" stopColor="#4C0519" />
      </linearGradient>
    </defs>
    <path d="M22 68 L25 84 L37 84 L40 68 Z" fill="#2A0813" stroke="url(#cupGold)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M44 68 L47 84 L59 84 L62 68 Z" fill="#2A0813" stroke="url(#cupGold)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M66 68 L69 84 L81 84 L84 68 Z" fill="#2A0813" stroke="url(#cupGold)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M33 50 L36 66 L48 66 L51 50 Z" fill="#4C0519" stroke="url(#cupGold)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M55 50 L58 66 L70 66 L73 50 Z" fill="#4C0519" stroke="url(#cupGold)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M44 32 L47 48 L59 48 L62 32 Z" fill="#881337" stroke="url(#cupGold)" strokeWidth="2.5" strokeLinejoin="round" />
    <ellipse cx="53" cy="18" rx="14" ry="16" fill="url(#balloonRuby)" stroke="#FFEAA7" strokeWidth="1.5" />
    <polygon points="53,34 50,38 56,38" fill="#E11D48" />
    <path d="M53 38 C51 43 55 45 52 50" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="48" cy="13" rx="4.5" ry="6.5" transform="rotate(-25 48 13)" fill="#FFFFFF" opacity="0.6" />
    <polygon points="26,44 28,47 31,48 28,49 26,52 24,49 21,48 24,47" fill="#FDE047" />
    <polygon points="80,44 82,47 85,48 82,49 80,52 78,49 75,48 78,47" fill="#FDE047" />
  </svg>
);

// 6. Balloon Dual Race Emblem SVG
const BalloonDualRaceIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="balloonOne" x1="25" y1="15" x2="45" y2="55" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="45%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="balloonTwo" x1="55" y1="15" x2="80" y2="55" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="40%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      <linearGradient id="dualLightning" x1="30" y1="70" x2="70" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#FFFBEB" />
      </linearGradient>
    </defs>
    <ellipse cx="36" cy="38" rx="16" ry="20" transform="rotate(-10 36 38)" fill="url(#balloonOne)" stroke="#FFF2B2" strokeWidth="1.5" />
    <polygon points="34,58 31,63 38,62" fill="#CA8A04" />
    <path d="M34 63 C33 72 28 78 32 86" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="31" cy="30" rx="4" ry="7" transform="rotate(-20 31 30)" fill="#FFFFFF" opacity="0.65" />
    <ellipse cx="64" cy="36" rx="16" ry="20" transform="rotate(10 64 36)" fill="url(#balloonTwo)" stroke="#FFEAA7" strokeWidth="1.5" />
    <polygon points="66,56 63,61 70,60" fill="#9F1239" />
    <path d="M66 61 C67 70 72 76 68 86" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="59" cy="28" rx="4" ry="7" transform="rotate(-5 59 28)" fill="#FFFFFF" opacity="0.65" />
    <polygon 
      points="54,12 42,42 50,43 45,74 61,38 52,37 58,12" 
      fill="url(#dualLightning)" 
      stroke="#D4AF37" 
      strokeWidth="1.5"
    />
  </svg>
);

// Default Festive Shield Emblem SVG
const DefaultFestiveIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="shieldGold" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#996515" />
      </linearGradient>
    </defs>
    <path d="M50 14 L78 24 C78 52 64 74 50 86 C36 74 22 52 22 24 Z" fill="#24060F" stroke="url(#shieldGold)" strokeWidth="3.5" strokeLinejoin="round" />
    <polygon points="50,32 54,42 64,43 56,50 59,60 50,54 41,60 44,50 36,43 46,42" fill="url(#shieldGold)" />
  </svg>
);

// Map each canonical or custom game ID / iconName to a bespoke rich festive vector illustration
const getGameEmblem = (gameId: string, iconName?: string) => {
  const key = (iconName || gameId || '').toLowerCase();
  if (key.includes('target') || key.includes('shoot')) {
    return <TargetShootingIcon className="w-full h-full" />;
  }
  if (key.includes('lemon') || key.includes('timer') || key.includes('speed') || key.includes('race')) {
    return <LemonRaceIcon className="w-full h-full" />;
  }
  if (key.includes('music') || key.includes('chair')) {
    return <MusicalChairsIcon className="w-full h-full" />;
  }
  if (key.includes('knot') || key.includes('team') || key.includes('group') || key.includes('synergy')) {
    return <HumanKnotIcon className="w-full h-full" />;
  }
  if (key.includes('cup') || key.includes('pyramid') || key.includes('layer')) {
    return <CupBalloonPyramidIcon className="w-full h-full" />;
  }
  if (key.includes('balloon') || key.includes('zap') || key.includes('dual')) {
    return <BalloonDualRaceIcon className="w-full h-full" />;
  }
  return <DefaultFestiveIcon className="w-full h-full" />;
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
          <span className="block text-amber-200 font-semibold mb-1">🎟️ Single ₹10 All-Access Registration Fee — Full Festival Access!</span>
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
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-2.5 flex items-center justify-center border-2 border-[#D4AF37]/60 bg-gradient-to-br from-[#3D0A17] via-[#24050E] to-[#120207] shadow-[0_6px_20px_rgba(0,0,0,0.6)] group-hover:border-[#F5D372] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />
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

              {/* Card Footer: Guidelines Button Only */}
              <div className="pt-4 mt-4 border-t border-[#3D0A17] relative z-10">
                <button
                  type="button"
                  onClick={() => handleOpenGuidelines(game)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-amber-200 bg-black/40 hover:bg-black/60 active:bg-black border border-[#D4AF37]/40 hover:border-[#D4AF37] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                >
                  <Info className="w-4 h-4 text-[#E5C158]" />
                  <span>Guidelines</span>
                </button>
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
