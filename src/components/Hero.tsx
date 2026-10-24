import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Gamepad2, 
  Play, 
  ChevronDown, 
  Users, 
  Gift, 
  Star,
  Flame,
  X
} from 'lucide-react';

interface HeroProps {
  onRegisterClick: () => void;
  onExploreGamesClick: () => void;
  onWatchIntroClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ 
  onRegisterClick, 
  onExploreGamesClick,
  onWatchIntroClick 
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = mobileVideoRef.current;
    if (!vid) return;

    vid.muted = true;
    // Low-bandwidth adaptation (3G/4G / Data Saver)
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const isSlowConn = conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g');

    if (isSlowConn) {
      // In 2G/3G or Data-Saver, keep high-resolution poster to prevent video buffering freeze
      vid.pause();
    } else {
      vid.play().catch(() => {});
    }
  }, []);

  const handleWatchIntro = () => {
    if (onWatchIntroClick) {
      onWatchIntroClick();
    } else {
      setShowVideoModal(true);
    }
  };

  const handleScrollDown = () => {
    const el = document.getElementById('games');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#100308] text-white">
      
      {/* =========================================================================
          DESKTOP FULL PANORAMIC BACKGROUND LAYER (>= 1024px)
          Spectacle (Rama, Ravana, SRMU arch, Ferris wheel, fireworks) is on the right!
          Left side has deep dark negative space with soft gradient overlay for text readability.
          ========================================================================= */}
      <div 
        className="hidden lg:block absolute inset-0 z-0 bg-cover bg-right bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/assets/hero-desktop.jpg')" }}
      >
        {/* Left-to-right atmospheric dark gradient overlay so text on left is 100% crisp and readable without covering Rama */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#100308]/92 via-[#100308]/65 via-38% to-transparent pointer-events-none" />
        {/* Soft bottom edge blend into the section divider */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#100308] via-[#100308]/80 to-transparent pointer-events-none" />
        {/* Soft top edge blend into the header/navbar */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#100308]/70 to-transparent pointer-events-none" />
      </div>

      {/* Ambient Floating Embers / Sparks (Hidden on mobile to avoid overlapping text) */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-amber-400 blur-xs animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-orange-400 blur-xs animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-20 w-1 h-1 rounded-full bg-yellow-300 blur-xs animate-ping" style={{ animationDuration: '5s' }} />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-amber-300 blur-xs animate-pulse" style={{ animationDuration: '3.5s' }} />
      </div>

      {/* =========================================================================
          MOBILE VIEW (< 1024px): CONTINUOUS AMBIENT VIDEO AT THE TOP
          Optimized with preload="metadata" and fast decoding poster for 3G/4G speeds
          ========================================================================= */}
      <div className="block lg:hidden relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-[#100308]">
        <video 
          ref={mobileVideoRef}
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="metadata"
          poster="/assets/hero-mobile.jpg" 
          className="w-full h-full object-cover object-center pointer-events-none"
        >
          <source src="/assets/hero-mobile.mp4" type="video/mp4" />
          {/* Fallback image if video is deferred or network is slow */}
          <img 
            src="/assets/hero-mobile.jpg" 
            alt="Vijayadashami Dussehra Carnival at SRMU B5-408" 
            className="w-full h-full object-cover object-top"
            decoding="async"
          />
        </video>

        {/* Subtle festive ambient tint overlay to harmonize colors with page backdrop */}
        <div className="absolute inset-0 bg-[#100308]/15 mix-blend-multiply pointer-events-none" />

        {/* Seamless downward, side and top feathering into background #100308 */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#100308] via-[#100308]/90 via-35% to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#100308]/75 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-10 sm:w-14 bg-gradient-to-r from-[#100308]/75 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-10 sm:w-14 bg-gradient-to-l from-[#100308]/75 to-transparent pointer-events-none" />
      </div>

      {/* =========================================================================
          HERO MAIN CONTENT CONTAINER
          Desktop: Text is on Left 5 cols, Right 7 cols is open to let background artwork shine
          Mobile: Content sits below the top image, seamlessly flowing
          ========================================================================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 lg:mt-0 pt-0 lg:pt-14 pb-14 sm:pb-22">
        
        {/* ================= DESKTOP LAYOUT (>= 1024px) ================= */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12 items-center">
          
          {/* LEFT 5 COLS: TEXT, BADGES, CTAS */}
          <div className="lg:col-span-5 xl:col-span-5 text-left space-y-5">
            
            {/* Grand Hero Title */}
            <div className="space-y-2 relative">
              {/* Subtle ambient golden backglow for title depth */}
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <h1 className="relative text-4xl xl:text-5xl 2xl:text-6xl font-black font-cinzel tracking-[0.04em] uppercase leading-[1.06]">
                <span className="block text-[#FFFDF9] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                  VIJAYADASHAMI
                </span>
                <span className="block gold-gradient-text drop-shadow-[0_6px_32px_rgba(212,175,55,0.45)]">
                  CARNIVAL
                </span>
              </h1>

              {/* Traditional Golden Lotus Ornament with wings matching mobile */}
              <div className="pt-1 flex items-center gap-2.5">
                <span className="h-[1.5px] w-12 bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37]" />
                <svg width="40" height="18" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
                  <path d="M18 1C15 6 9 9 3 9C6 11 12 11 16 7L18 15L20 7C24 11 30 11 33 9C27 9 21 6 18 1Z" fill="#D4AF37" opacity="0.95"/>
                  <circle cx="18" cy="4" r="1.5" fill="#FFE28A" />
                  <circle cx="12" cy="8" r="1" fill="#D4AF37" />
                  <circle cx="24" cy="8" r="1" fill="#D4AF37" />
                </svg>
                <span className="h-[1.5px] w-12 bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37]" />
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-stone-300 text-sm xl:text-base font-normal leading-relaxed max-w-lg">
              Join the SRMU campus celebration featuring 6 exciting competitions, team challenges, agility arenas, and festive carnival rewards.
            </p>

            {/* Event Badges 2x2 VIP Ticket Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs max-w-lg pt-1">
              {/* Date */}
              <div className="royal-glass-card flex items-center gap-2.5 p-3 rounded-2xl text-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A0E22] to-[#25040D] border border-[#D4AF37]/60 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.25)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">DATE</span>
                  <span className="font-bold text-white text-xs xl:text-sm truncate block">29 Oct 2026</span>
                </div>
              </div>

              {/* Time */}
              <div className="royal-glass-card flex items-center gap-2.5 p-3 rounded-2xl text-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A0E22] to-[#25040D] border border-[#D4AF37]/60 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.25)]">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">TIMING</span>
                  <span className="font-bold text-white text-xs xl:text-sm truncate block">11:00 AM</span>
                </div>
              </div>

              {/* Venue */}
              <div className="royal-glass-card flex items-center gap-2.5 p-3 rounded-2xl text-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A0E22] to-[#25040D] border border-[#D4AF37]/60 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.25)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">VENUE</span>
                  <span className="font-bold text-white text-xs xl:text-sm truncate block">SRMU B5-408</span>
                </div>
              </div>

              {/* Fee */}
              <div className="royal-glass-card flex items-center gap-2.5 p-3 rounded-2xl text-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#9A3412] border border-amber-300/60 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(234,88,12,0.4)]">
                  ₹10
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">ENTRY PASS</span>
                  <span className="font-bold text-amber-200 text-xs xl:text-sm truncate block">All Games Included</span>
                </div>
              </div>
            </div>

            {/* 3 Action CTAs */}
            <div className="space-y-3 pt-2 max-w-lg">
              {/* Primary CTA - Full-width single-line prominent button */}
              <button
                onClick={onRegisterClick}
                className="shine-effect w-full py-4 px-6 rounded-full text-xs xl:text-sm font-bold bg-gradient-to-r from-[#881337] via-[#BE123C] to-[#881337] hover:from-[#9F1239] hover:to-[#BE123C] text-white flex items-center justify-center gap-2.5 border-2 border-[#FFE28A]/80 shadow-[0_12px_35px_rgba(159,18,57,0.65)] hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                <span className="tracking-wide">Get ₹10 Carnival Pass</span>
                <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
              </button>

              {/* Secondary & Tertiary CTAs - Balanced 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onExploreGamesClick}
                  className="py-3 px-4 rounded-full text-xs xl:text-sm font-bold bg-black/60 hover:bg-black/80 text-white flex items-center justify-center gap-2 border border-[#D4AF37]/45 hover:border-[#D4AF37] backdrop-blur-md hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)] whitespace-nowrap cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4 text-[#E5C158] shrink-0" />
                  <span>Explore Games</span>
                </button>

                <button
                  onClick={handleWatchIntro}
                  className="py-3 px-4 rounded-full text-xs xl:text-sm font-bold bg-black/60 hover:bg-black/80 text-[#F5E6B3] flex items-center justify-center gap-2 border border-[#D4AF37]/45 hover:border-[#D4AF37] backdrop-blur-md hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)] whitespace-nowrap cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full bg-[#E5C158] text-[#100308] flex items-center justify-center shrink-0 shadow-xs">
                    <Play className="w-2 h-2 fill-current ml-0.5" />
                  </div>
                  <span>Watch Intro</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT 7 COLS: OPEN SPACE FOR PANORAMIC BACKGROUND SPECTACLE */}
          <div className="lg:col-span-7 xl:col-span-7 min-h-[480px] pointer-events-none" />

        </div>

        {/* ================= MOBILE / TABLET LAYOUT (< 1024px) ================= */}
        {/* Visual artwork is positioned at the top of the section; content flows cleanly below */}
        <div className="block lg:hidden text-center space-y-4">
          
          {/* Grand Hero Title (Mobile / Tablet) - Stylish Readable Cursive Centered Layout */}
          <div className="relative max-w-sm sm:max-w-md mx-auto pt-1 pb-1 text-center">
            <h1 className="flex flex-col items-center justify-center select-none space-y-0.5">
              {/* Vijayadashami */}
              <span 
                className="block text-center text-4xl xs:text-5xl sm:text-6xl font-normal tracking-wide text-[#FFFDF9] drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Runethia', 'Playfair Display', cursive" }}
              >
                Vijayadashami
              </span>
              
              {/* Carnival */}
              <span 
                className="block text-center text-4xl xs:text-5xl sm:text-6xl font-normal gold-gradient-text drop-shadow-[0_4px_24px_rgba(212,175,55,0.45)] -mt-1 xs:-mt-2"
                style={{ fontFamily: "'Runethia', 'Playfair Display', cursive" }}
              >
                Carnival
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-stone-300 text-xs sm:text-sm font-normal leading-relaxed max-w-sm sm:max-w-md mx-auto px-2">
            Join the SRMU campus celebration featuring 6 exciting competitions, team challenges, and festive carnival rewards.
          </p>

          {/* Mobile Event Badges 2x2 VIP Ticket Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs max-w-md mx-auto pt-2">
            {/* Date */}
            <div className="royal-glass-card flex items-center gap-2 p-2.5 rounded-xl text-left">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5A0E22] to-[#25040D] border border-[#D4AF37]/50 text-amber-300 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">DATE</span>
                <span className="font-bold text-white text-xs truncate block">29 Oct 2026</span>
              </div>
            </div>

            {/* Time */}
            <div className="royal-glass-card flex items-center gap-2 p-2.5 rounded-xl text-left">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5A0E22] to-[#25040D] border border-[#D4AF37]/50 text-amber-300 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">TIMING</span>
                <span className="font-bold text-white text-xs truncate block">11:00 AM</span>
              </div>
            </div>

            {/* Venue */}
            <div className="royal-glass-card flex items-center gap-2 p-2.5 rounded-xl text-left">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5A0E22] to-[#25040D] border border-[#D4AF37]/50 text-amber-300 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">VENUE</span>
                <span className="font-bold text-white text-xs truncate block">SRMU B5-408</span>
              </div>
            </div>

            {/* Fee */}
            <div className="royal-glass-card flex items-center gap-2 p-2.5 rounded-xl text-left">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C2410C] to-[#EA580C] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                ₹10
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 font-bold">ENTRY PASS</span>
                <span className="font-bold text-amber-200 text-xs truncate block">All Games Included</span>
              </div>
            </div>
          </div>

          {/* Mobile CTAs */}
          <div className="space-y-2.5 pt-2 max-w-md mx-auto">
            {/* Primary CTA */}
            <button
              onClick={onRegisterClick}
              className="shine-effect w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-[#881337] via-[#BE123C] to-[#881337] text-white flex items-center justify-center gap-2 border-2 border-[#FFE28A]/80 shadow-[0_8px_25px_rgba(159,18,57,0.6)] active:scale-95 transition-all"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Get ₹10 Carnival Pass</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>

            {/* Secondary CTA Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExploreGamesClick}
                className="py-3 px-3 rounded-full text-xs font-bold bg-black/60 hover:bg-black/80 active:bg-black text-white flex items-center justify-center gap-1.5 border border-[#D4AF37]/40 active:scale-95 transition-all shadow-xs"
              >
                <Gamepad2 className="w-4 h-4 text-[#E5C158]" />
                <span>Explore Games</span>
              </button>

              <button
                onClick={handleWatchIntro}
                className="py-3 px-3 rounded-full text-xs font-bold bg-black/60 hover:bg-black/80 active:bg-black text-[#F5E6B3] flex items-center justify-center gap-1.5 border border-[#D4AF37]/40 active:scale-95 transition-all shadow-xs"
              >
                <div className="w-4 h-4 rounded-full bg-[#E5C158] text-[#100308] flex items-center justify-center">
                  <Play className="w-2 h-2 fill-current ml-0.5" />
                </div>
                <span>Watch Intro</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          LUXURIOUS GOLDEN CURVED WAVE DIVIDER & FEATURE BAR
          ========================================================================= */}
      <div className="relative z-20 w-full">
        
        {/* Flowing Golden Wave SVG */}
        <div className="w-full overflow-hidden leading-none">
          <svg 
            viewBox="0 0 1440 110" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-14 sm:h-20 lg:h-24 preserve-3d"
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 C320,110 520,10 720,60 C920,110 1120,10 1440,60 L1440,110 L0,110 Z" 
              fill="#18040C" 
            />
            <path 
              d="M0,60 C320,110 520,10 720,60 C920,110 1120,10 1440,60" 
              stroke="url(#goldenGradientHero)" 
              strokeWidth="2.5" 
            />
            <path 
              d="M0,64 C320,114 520,14 720,64 C920,114 1120,14 1440,64" 
              stroke="#D4AF37" 
              strokeWidth="0.8" 
              strokeOpacity="0.4"
            />
            <defs>
              <linearGradient id="goldenGradientHero" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#AA820A" />
                <stop offset="25%" stopColor="#E5C158" />
                <stop offset="50%" stopColor="#FFF2B8" />
                <stop offset="75%" stopColor="#E5C158" />
                <stop offset="100%" stopColor="#AA820A" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Bottom Feature Bar with Centered Floating Scroll Button */}
        <div className="bg-[#18040C] border-t border-[#3B0E1B] px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
            
            {/* Center: Floating Scroll Button */}
            <div className="flex flex-col items-center justify-center text-center -mt-6 sm:-mt-8">
              <button 
                onClick={handleScrollDown}
                aria-label="Scroll to explore games"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2E0B16] border-2 border-[#E5C158] text-[#E5C158] hover:bg-[#E5C158] hover:text-[#100308] flex items-center justify-center shadow-lg shadow-amber-950/50 hover:scale-110 active:scale-95 transition-all group"
              >
                <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              </button>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5C158] mt-2">
                SCROLL TO EXPLORE
              </span>
              {/* Tiny lotus ornament */}
              <div className="flex items-center gap-1 mt-0.5 opacity-80">
                <span className="w-3 h-[1px] bg-[#E5C158]" />
                <span className="text-[8px] text-[#E5C158]">✦</span>
                <span className="w-3 h-[1px] bg-[#E5C158]" />
              </div>
            </div>

            {/* 4 Feature Highlights Grid: 2 cols on mobile, 4 cols on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 w-full text-left">
              {/* Feature 1 */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#270814]/80 to-[#150308]/90 border border-[#D4AF37]/30 shadow-xs">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2E0B16] border border-[#E5C158]/40 text-[#E5C158] flex items-center justify-center shrink-0 shadow-xs">
                  <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">6 Exciting</div>
                  <div className="text-[10px] sm:text-xs text-stone-400">Carnival Games</div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#270814]/80 to-[#150308]/90 border border-[#D4AF37]/30 shadow-xs">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2E0B16] border border-[#E5C158]/40 text-[#E5C158] flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight">Team Activities</div>
                  <div className="text-[10px] sm:text-xs text-stone-400">& Fun Challenges</div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#270814]/80 to-[#150308]/90 border border-[#D4AF37]/30 shadow-xs">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2E0B16] border border-[#E5C158]/40 text-[#E5C158] flex items-center justify-center shrink-0 shadow-xs">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">Festival</div>
                  <div className="text-[10px] sm:text-xs text-stone-400">Prizes & Medals</div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#270814]/80 to-[#150308]/90 border border-[#D4AF37]/30 shadow-xs">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2E0B16] border border-[#E5C158]/40 text-[#E5C158] flex items-center justify-center shrink-0 shadow-xs">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight">Memorable</div>
                  <div className="text-[10px] sm:text-xs text-stone-400">Campus Experience</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* =========================================================================
          WATCH INTRO MODAL
          ========================================================================= */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="bg-[#1C050F] border border-[#E5C158]/60 p-6 rounded-2xl max-w-lg w-full text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold font-heading text-[#FFFDF9]">
              Vijayadashami Carnival Intro
            </h3>
            <p className="text-xs sm:text-sm text-stone-300">
              Welcome to the ceremonial celebrations at Shri Ramswaroop Memorial University! Join us as good triumphs over evil with games, archery accuracy challenges, teamwork, and festival rewards.
            </p>
            <div className="relative w-full max-w-[280px] aspect-[9/16] max-h-[50vh] mx-auto rounded-2xl overflow-hidden border border-[#D4AF37]/50 bg-[#070104] flex items-center justify-center shadow-xl">
              <video 
                src="/assets/intro.mp4" 
                autoPlay 
                loop 
                controls 
                playsInline 
                className="w-full h-full object-cover" 
              />
            </div>
            <button
              onClick={() => setShowVideoModal(false)}
              className="px-6 py-2 rounded-full font-bold text-xs bg-[#881337] text-white hover:bg-[#9F1239] transition-colors"
            >
              Close Intro
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
