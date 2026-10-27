import React, { useState, useEffect, useMemo } from 'react';
import { EVENT_DETAILS } from '../data/games';
import { 
  Megaphone, 
  Calendar, 
  Trophy, 
  Gamepad2, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

interface TopBannerProps {
  onProceedClick: () => void;
}

const ANNOUNCEMENTS = [
  {
    id: 'open-registration',
    badge: 'LIVE PASS',
    icon: Megaphone,
    badgeColor: 'border-emerald-500/70 bg-emerald-950/60 text-emerald-300',
    iconColor: 'text-emerald-400',
    desktopText: 'Registration Open • ₹10 Flat Fee (All 6 Games Included) • Spot Entries Available @ SRMU Arena',
    mobileBadge: 'Open Now',
    mobileBadgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    mobileText: '₹10 All-Access',
  },
  {
    id: 'venue-date',
    badge: 'VENUE & DATE',
    icon: Calendar,
    badgeColor: 'border-amber-500/70 bg-amber-950/60 text-amber-300',
    iconColor: 'text-amber-300',
    desktopText: 'Carnival Day: Thursday, 29 October 2026 @ 11:00 AM • Venue: SRMU B5-408',
    mobileBadge: '29 Oct • 11 AM',
    mobileBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    mobileText: 'Venue: SRMU B5-408',
  },
  {
    id: 'prizes',
    badge: 'REWARDS',
    icon: Trophy,
    badgeColor: 'border-yellow-500/70 bg-yellow-950/60 text-yellow-300',
    iconColor: 'text-yellow-400',
    desktopText: 'Exciting Cash Prizes & Winner Trophies • Official Certificates for All Participants!',
    mobileBadge: 'Prizes & Trophies',
    mobileBadgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    mobileText: 'Cash & Certificates',
  },
  {
    id: 'games',
    badge: '6 CHALLENGES',
    icon: Gamepad2,
    badgeColor: 'border-orange-500/70 bg-orange-950/60 text-orange-300',
    iconColor: 'text-orange-400',
    desktopText: '6 Thrilling Games: Lemon Race, Target Shooting, Balloon Dual, Pyramid Stacking & More!',
    mobileBadge: '6 Epic Games',
    mobileBadgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    mobileText: 'Lemon, Target, Dual...',
  },
  {
    id: 'community',
    badge: 'LIVE HEATS',
    icon: Sparkles,
    badgeColor: 'border-rose-500/70 bg-rose-950/60 text-rose-300',
    iconColor: 'text-rose-400',
    desktopText: 'Real-time Scoreboards, Instant WhatsApp Match Call-ups & Spot Entries!',
    mobileBadge: 'Live Match Calls',
    mobileBadgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    mobileText: 'WhatsApp Updates',
  },
];

// High-Performance Countdown Hook
const useCountdown = (targetTimestamp: number) => {
  const calculate = () => {
    const diff = Math.max(0, targetTimestamp - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isLive: diff === 0,
    };
  };

  const [time, setTime] = useState(calculate);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculate());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTimestamp]);

  return time;
};

// Static Toran Bunting Banner — Memoized to avoid re-rendering on clock ticks
const ToranBunting: React.FC = React.memo(() => {
  const flags = useMemo(() => {
    const colors = ['#881337', '#D4AF37', '#15803D', '#EA580C', '#78350F', '#B91C1C'];
    return Array.from({ length: 48 }).map((_, i) => ({
      color: colors[i % colors.length],
      x: i * 25,
    }));
  }, []);

  return (
    <div className="w-full h-2 sm:h-2.5 overflow-hidden flex items-center">
      <svg 
        viewBox="0 0 1200 16" 
        preserveAspectRatio="none" 
        className="w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {flags.map((flag, i) => (
          <polygon 
            key={i} 
            points={`${flag.x},0 ${flag.x + 25},0 ${flag.x + 12.5},16`} 
            fill={flag.color} 
            stroke="#1A0409" 
            strokeWidth="0.5" 
          />
        ))}
      </svg>
    </div>
  );
});

// Self-Contained Desktop Countdown — Re-renders only itself every second
const DesktopCountdown: React.FC<{ target: number }> = React.memo(({ target }) => {
  const time = useCountdown(target);

  if (time.isLive) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/60 shadow-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">Carnival Live Now</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
      {/* Days */}
      <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[38px] shadow-xs" title="Days">
        <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
          {String(time.days).padStart(2, '0')}<span className="text-[10px] text-amber-500/80 font-normal ml-0.5">d</span>
        </span>
      </div>
      <span className="text-amber-400 font-bold text-xs">:</span>

      {/* Hours */}
      <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[38px] shadow-xs" title="Hours">
        <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
          {String(time.hours).padStart(2, '0')}<span className="text-[10px] text-amber-500/80 font-normal ml-0.5">h</span>
        </span>
      </div>
      <span className="text-amber-400 font-bold text-xs">:</span>

      {/* Mins */}
      <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[38px] shadow-xs" title="Minutes">
        <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
          {String(time.minutes).padStart(2, '0')}<span className="text-[10px] text-amber-500/80 font-normal ml-0.5">m</span>
        </span>
      </div>
      <span className="text-amber-400 font-bold text-xs">:</span>

      {/* Secs */}
      <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[38px] shadow-xs" title="Seconds">
        <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
          {String(time.seconds).padStart(2, '0')}<span className="text-[10px] text-amber-500/80 font-normal ml-0.5">s</span>
        </span>
      </div>
    </div>
  );
});

// Self-Contained Mobile Countdown — Re-renders only itself every second
const MobileCountdown: React.FC<{ target: number }> = React.memo(({ target }) => {
  const time = useCountdown(target);

  if (time.isLive) {
    return (
      <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/60 px-2.5 py-0.5 rounded-full shadow-sm text-[11px] font-mono font-bold text-emerald-200 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>LIVE NOW</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-[#3D0A1B] border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full shadow-sm text-[11px] font-mono font-bold text-amber-200 shrink-0">
      <span className="text-amber-400 text-[10px]">⏳</span>
      <span className="text-white">{String(time.days).padStart(2, '0')}d</span>
      <span className="text-amber-500/70">:</span>
      <span className="text-white">{String(time.hours).padStart(2, '0')}h</span>
      <span className="text-amber-500/70">:</span>
      <span className="text-white">{String(time.minutes).padStart(2, '0')}m</span>
      <span className="text-amber-500/70">:</span>
      <span className="text-amber-300">{String(time.seconds).padStart(2, '0')}s</span>
    </div>
  );
});

export const TopBanner: React.FC<TopBannerProps> = React.memo(({ onProceedClick }) => {
  const [activeAnnounceIndex, setActiveAnnounceIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Authoritative target timestamp for Carnival Grand Opening
  const targetTimestamp = EVENT_DETAILS.eventTimestamp || new Date("2026-10-29T11:00:00+05:30").getTime();

  // Rotating Announcements timer
  useEffect(() => {
    if (isPaused) return;

    const rotationInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveAnnounceIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        setIsFading(false);
      }, 250);
    }, 4500);

    return () => clearInterval(rotationInterval);
  }, [isPaused]);

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setActiveAnnounceIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
      setIsFading(false);
    }, 150);
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setActiveAnnounceIndex((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
      setIsFading(false);
    }, 150);
  };

  const currentAnnounce = ANNOUNCEMENTS[activeAnnounceIndex];
  const CurrentIcon = currentAnnounce.icon;

  return (
    <div className="w-full bg-gradient-to-r from-[#1A030A] via-[#2D0613] to-[#1A030A] border-b border-[#D4AF37]/25 text-white shadow-sm relative z-40 select-none">
      {/* Decorative Traditional Indian Bunting / Toran Banner */}
      <ToranBunting />

      {/* Content Ribbon */}
      <div 
        className="px-3 sm:px-6 py-1.5 sm:py-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        
        {/* ================= MOBILE COMPACT VIEW (< 640px) ================= */}
        <div className="flex sm:hidden items-center justify-between gap-2 py-0.5">
          {/* Mobile Left: Rotating Notice & Details with smooth transition */}
          <div 
            className={`flex items-center gap-1.5 shrink-0 transition-all duration-300 ${
              isFading ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] border shadow-xs ${currentAnnounce.mobileBadgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {currentAnnounce.mobileBadge}
            </span>
            <span className="text-stone-200 font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 max-w-[130px] truncate">
              {currentAnnounce.mobileText}
            </span>
          </div>

          {/* Mobile Right: Self-Contained High-Performance Countdown */}
          <MobileCountdown target={targetTimestamp} />
        </div>

        {/* ================= DESKTOP / TABLET VIEW (>= 640px) ================= */}
        <div className="hidden sm:flex items-center justify-between gap-3 text-xs sm:text-sm">
          
          {/* Left: Dynamic Rotating Announcements */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-left overflow-hidden">
            {/* Dynamic Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] sm:text-xs font-bold tracking-wider uppercase shadow-xs shrink-0 transition-colors duration-300 ${currentAnnounce.badgeColor}`}>
              <CurrentIcon className={`w-3 h-3 ${currentAnnounce.iconColor}`} />
              <span>{currentAnnounce.badge}</span>
            </div>
            
            <span className="text-amber-600/60 shrink-0">|</span>
            
            {/* Animated Announcement Text */}
            <div className="overflow-hidden min-w-0">
              <span 
                className={`inline-block font-medium text-[#F7ECE1] text-xs sm:text-sm transition-all duration-300 ${
                  isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                }`}
              >
                {currentAnnounce.desktopText}
              </span>
            </div>

            {/* Quick Next/Prev Controls & Indicator Dots */}
            <div className="flex items-center gap-1 shrink-0 ml-1 opacity-60 hover:opacity-100 transition-opacity">
              <button 
                onClick={handlePrev}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                title="Previous announcement"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              
              <div className="flex items-center gap-0.5 px-0.5">
                {ANNOUNCEMENTS.map((_, i) => (
                  <span 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === activeAnnounceIndex ? 'w-2.5 bg-amber-400' : 'w-1 bg-white/20'
                    }`} 
                  />
                ))}
              </div>

              <button 
                onClick={handleNext}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                title="Next announcement"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Self-Contained Desktop Countdown & Quick Proceed CTA */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* High-Performance Countdown Component */}
            <DesktopCountdown target={targetTimestamp} />

            {/* Proceed CTA button */}
            <button
              onClick={onProceedClick}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#C2410C] to-[#DC2626] hover:from-[#EA580C] hover:to-[#EF4444] text-white flex items-center gap-1 shadow-md shadow-red-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Proceed to Registration</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
});
