import React, { useState, useEffect, useRef } from 'react';
import { useRegistration } from '../context/RegistrationContext';
import { useSmoothScroll } from '../context/SmoothScrollContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  Gamepad2, 
  UserPlus, 
  ExternalLink,
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
  activeTab: 'home' | 'games' | 'register';
  setActiveTab: (tab: 'home' | 'games' | 'register') => void;
  onOpenScoreboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenScoreboard }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedGameIds, goToStep } = useRegistration();
  const { scrollTo } = useSmoothScroll();
  const headerRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Dynamic navbar elevation & shadow as user scrolls down
      ScrollTrigger.create({
        start: 'top -30',
        end: 99999,
        onUpdate: (self) => {
          if (pillRef.current) {
            if (self.progress > 0) {
              gsap.to(pillRef.current, {
                backgroundColor: 'rgba(15, 2, 8, 0.96)',
                borderColor: 'rgba(212, 175, 55, 0.7)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.92), 0 0 25px rgba(212, 175, 55, 0.2)',
                duration: 0.3,
                overwrite: 'auto'
              });
            } else {
              gsap.to(pillRef.current, {
                backgroundColor: 'rgba(20, 2, 10, 0.92)',
                borderColor: 'rgba(212, 175, 55, 0.5)',
                boxShadow: '0 14px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(212, 175, 55, 0.1)',
                duration: 0.3,
                overwrite: 'auto'
              });
            }
          }
        }
      });
    }, headerRef);

    return () => ctx.revert();
  }, []);

  // Smooth drawer entrance when mobileMenuOpen changes
  useEffect(() => {
    if (mobileMenuOpen && drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { opacity: 0, y: -12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }
      );
    }
  }, [mobileMenuOpen]);

  const handleProceedToRegister = () => {
    setActiveTab('register');
    goToStep(2);
    setMobileMenuOpen(false);
    scrollTo('#wizard-form-card', { offset: -70, duration: 1.2 });
  };

  const handleNavClick = (tab: 'home' | 'games' | 'register') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab === 'home') {
      scrollTo(0, { duration: 1.2 });
    } else if (tab === 'games') {
      scrollTo('#games', { offset: -70, duration: 1.2 });
    } else if (tab === 'register') {
      scrollTo('#wizard-form-card', { offset: -70, duration: 1.2 });
    }
  };

  return (
    <header ref={headerRef} className="sticky top-2 sm:top-3 z-50 w-full px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-1 transition-all pointer-events-auto">
      <div ref={pillRef} className="max-w-7xl mx-auto rounded-full bg-[#14020A]/92 backdrop-blur-2xl border border-[#D4AF37]/50 ring-1 ring-white/10 text-stone-200 shadow-[0_14px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(212,175,55,0.1)] h-16 sm:h-[4.25rem] px-5 sm:px-7 lg:px-8 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 transition-all">
        
        {/* Brand / Logo with authentic Vijayadashami Dhanush-Baan icon */}
        <button 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-hidden shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#9F1239] via-[#630B22] to-[#2E040E] text-[#E5C158] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.35)] group-hover:scale-105 transition-all border border-[#D4AF37]/60 shrink-0">
            <VijayadashamiBowIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow-md" />
          </div>
          <div className="shrink-0">
            <span className="font-heading font-black text-base sm:text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF9] via-[#FCE7B0] to-[#E5C158] whitespace-nowrap drop-shadow-sm block">
              VIJAYADASHAMI
            </span>
            <p className="text-[10px] sm:text-[11px] text-amber-200/90 font-medium whitespace-nowrap flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-amber-400" />
              <span>SRMU B5-408</span>
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          <button
            onClick={() => handleNavClick('home')}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#881337] text-white shadow-md border border-[#E5C158]/60'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleNavClick('games')}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'games'
                ? 'bg-[#881337] text-white shadow-xs border border-[#E5C158]/40'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
            <span>Games<span className="hidden xl:inline"> Catalogue</span></span>
          </button>

          <button
            onClick={() => handleNavClick('register')}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'register'
                ? 'bg-[#881337] text-white shadow-xs border border-[#E5C158]/40'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
            <span>Registration</span>
            {selectedGameIds.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#E5C158] text-[#881337] font-black text-[9px] flex items-center justify-center shrink-0 ml-0.5 shadow-xs">
                {selectedGameIds.length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenScoreboard}
            className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-amber-300 hover:bg-amber-400/10 border border-[#D4AF37]/30 hover:border-[#D4AF37]/70 cursor-pointer"
            title="Live Campus Scores & Heat Rankings"
          >
            <Trophy className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
            <span>Leaderboard</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Admin Desk link (Desktop/Laptop only; on mobile it is inside the 3-line menu) */}
          <a
            href="/admin/login.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2E0B16] hover:bg-[#3D0A17] text-amber-200 border border-[#D4AF37]/35 hover:border-[#D4AF37]/70 transition-all whitespace-nowrap shadow-xs shrink-0"
            title="Organizer Admin Desk"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
            <span>Admin Desk</span>
            <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
          </a>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
            className="md:hidden w-9 h-9 rounded-full bg-[#2E0B16] border border-[#D4AF37]/40 text-stone-200 flex items-center justify-center hover:bg-[#3D0A17] active:scale-95 transition-all shadow-xs"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-amber-300" /> : <Menu className="w-4 h-4 text-amber-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div ref={drawerRef} className="md:hidden max-w-7xl mx-auto mt-2.5 p-4 rounded-2xl border border-[#D4AF37]/45 bg-[#14030A]/98 backdrop-blur-2xl shadow-2xl space-y-2">
          {selectedGameIds.length > 0 && (
            <button
              onClick={handleProceedToRegister}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white border border-[#E5C158]/60 shadow-md"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E5C158] text-[#881337] font-black text-xs flex items-center justify-center">
                  {selectedGameIds.length}
                </span>
                <span>{selectedGameIds.length === 1 ? '1 Game Selected' : `${selectedGameIds.length} Games Selected`}</span>
              </div>
              <span className="text-amber-300 font-extrabold">₹{selectedGameIds.length * 5} · Proceed →</span>
            </button>
          )}

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
