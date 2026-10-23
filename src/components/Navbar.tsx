import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  Gamepad2, 
  UserPlus, 
  ExternalLink,
  Award,
  Flame,
  Trophy
} from 'lucide-react';

{/* Sacred Vijayadashami Bow & Arrow (Teer Dhanush pe chadha hua - Drawn Bow with Nocked Arrow) */}
const VijayadashamiBowIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-hidden="true"
  >
    <g transform="rotate(-25 12 12)">
      {/* Bow Limb (Golden Recurve Arc under tension) */}
      <path 
        d="M7 3 C9.5 4.5, 12 7.5, 15.5 12 C12 16.5, 9.5 19.5, 7 21" 
        stroke="#F59E0B" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* Bow Grip Accent */}
      <path 
        d="M15 10.5 C15.6 11.2, 15.8 11.6, 15.8 12 C15.8 12.4, 15.6 12.8, 15 13.5" 
        stroke="#D97706" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      {/* Bow Horn Nocks */}
      <circle cx="7" cy="3" r="0.9" fill="#FDE047" />
      <circle cx="7" cy="21" r="0.9" fill="#FDE047" />

      {/* Pulled Bowstring (Deep V-Shape under full draw tension) */}
      <path 
        d="M7 3 L2.5 12 L7 21" 
        stroke="#FDE047" 
        strokeWidth="1.4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Arrow Shaft (Mounted directly on the drawn string vertex through the bow) */}
      <line 
        x1="2.5" 
        y1="12" 
        x2="21" 
        y2="12" 
        stroke="#FFFDF9" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />

      {/* Flaming Golden Arrowhead (Pointed & barbed) */}
      <path 
        d="M16 8 L22.5 12 L16 16 L17.8 12 Z" 
        fill="#FDE047" 
        stroke="#D97706" 
        strokeWidth="0.8" 
        strokeLinejoin="round" 
      />

      {/* Arrow Fletching (Feathers at the nock) */}
      <path 
        d="M4.5 9.5 L2 12 L4.5 14.5" 
        stroke="#FDE047" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </g>
  </svg>
);

interface NavbarProps {
  activeTab: 'home' | 'games' | 'register' | 'verify';
  setActiveTab: (tab: 'home' | 'games' | 'register' | 'verify') => void;
  onOpenScoreboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenScoreboard }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: 'home' | 'games' | 'register' | 'verify') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#18040C]/90 backdrop-blur-md border-b border-[#3D0A17] text-stone-200 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        
        {/* Brand / Logo with authentic Vijayadashami Dhanush-Baan icon */}
        <button 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-hidden min-w-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#881337] to-[#4C0519] text-[#E5C158] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-[#D4AF37]/40 shrink-0">
            <VijayadashamiBowIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-base sm:text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF9] via-[#FCE7B0] to-[#E5C158] truncate">
                VIJAYADASHAMI
              </span>
              <span className="hidden sm:inline-block text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold bg-[#E5C158]/20 text-[#E5C158] border border-[#E5C158]/40 shrink-0">
                SRMU B5
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-200/80 font-medium truncate">
              <span className="sm:hidden font-bold text-amber-400">SRMU B5 • </span>Campus Carnival 2026
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => handleNavClick('home')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'home'
                ? 'bg-[#881337] text-white shadow-xs border border-[#E5C158]/40'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleNavClick('games')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'games'
                ? 'bg-[#881337] text-white shadow-xs border border-[#E5C158]/40'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Games Catalogue</span>
          </button>

          <button
            onClick={() => handleNavClick('register')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'register'
                ? 'bg-[#881337] text-white shadow-xs border border-[#E5C158]/40'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Registration</span>
          </button>

          <button
            onClick={() => handleNavClick('verify')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'verify'
                ? 'bg-[#881337] text-white shadow-xs border border-[#E5C158]/40'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Verify Certificate</span>
          </button>

          <button
            onClick={onOpenScoreboard}
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all text-amber-300 hover:bg-amber-400/10 border border-[#D4AF37]/30 hover:border-[#D4AF37]/70 cursor-pointer"
            title="Live Campus Scores & Heat Rankings"
          >
            <Trophy className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Leaderboard</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Admin link */}
          <a
            href="/admin/login.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E0B16] hover:bg-[#3D0A17] text-amber-200 border border-[#D4AF37]/30 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Admin Desk</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </a>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
            className="md:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2E0B16] border border-[#D4AF37]/30 text-stone-200 flex items-center justify-center hover:bg-[#3D0A17]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 border-t border-[#3D0A17] bg-[#14030A] shadow-xl space-y-2">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'home'
                ? 'bg-[#881337] text-white border border-[#E5C158]/40'
                : 'text-stone-200 hover:bg-white/10'
            }`}
          >
            <Flame className="w-4 h-4 text-[#E5C158]" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleNavClick('games')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'games'
                ? 'bg-[#881337] text-white border border-[#E5C158]/40'
                : 'text-stone-200 hover:bg-white/10'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-[#E5C158]" />
            <span>Games Catalogue</span>
          </button>

          <button
            onClick={() => handleNavClick('register')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'register'
                ? 'bg-[#881337] text-white border border-[#E5C158]/40'
                : 'text-stone-200 hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#E5C158]" />
            <span>Registration Wizard</span>
          </button>

          <button
            onClick={() => handleNavClick('verify')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'verify'
                ? 'bg-[#881337] text-white border border-[#E5C158]/40'
                : 'text-stone-200 hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4 text-[#E5C158]" />
            <span>Verify Certificate</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenScoreboard?.();
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 text-amber-300 hover:bg-amber-400/10 border border-[#D4AF37]/30"
          >
            <Trophy className="w-4 h-4 text-[#E5C158]" />
            <span>Live Leaderboard</span>
          </button>

          <a
            href="/admin/login.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#2E0B16] text-amber-200 border border-[#D4AF37]/30"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E5C158]" />
              Organizer Admin Desk
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </a>
        </div>
      )}
    </header>
  );
};
