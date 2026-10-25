import React, { useState, useEffect } from 'react';
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
    id: 'deadline',
    badge: 'DEADLINE',
    icon: Megaphone,
    badgeColor: 'border-amber-500/70 bg-amber-950/60 text-amber-300',
    iconColor: 'text-amber-400',
    desktopText: 'Registration closes Monday, 26 October 2026 (11:59 PM) • ₹10 Flat Fee (All 6 Games Included)',
    mobileBadge: 'Closes 26 Oct',
    mobileBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
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

export const TopBanner: React.FC<TopBannerProps> = ({ onProceedClick }) => {
  const [activeAnnounceIndex, setActiveAnnounceIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 2,
    minutes: 59,
    seconds: 51,
  });

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const diff = EVENT_DETAILS.deadlineTimestamp - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotating Announcements timer
  useEffect(() => {
    if (isPaused) return;

    const rotationInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveAnnounceIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        setIsFading(false);
      }, 300);
    }, 4000);

    return () => clearInterval(rotationInterval);
  }, [isPaused]);

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setActiveAnnounceIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
      setIsFading(false);
    }, 200);
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setActiveAnnounceIndex((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
      setIsFading(false);
    }, 200);
  };

  const currentAnnounce = ANNOUNCEMENTS[activeAnnounceIndex];
  const CurrentIcon = currentAnnounce.icon;

  return (
    <div className="w-full bg-gradient-to-r from-[#1A030A] via-[#2D0613] to-[#1A030A] border-b border-[#D4AF37]/25 text-white shadow-sm relative z-40 select-none">
      {/* Decorative Traditional Indian Bunting / Toran Banner */}
      <div className="w-full h-2 sm:h-2.5 overflow-hidden flex items-center">
        <svg 
          viewBox="0 0 1200 16" 
          preserveAspectRatio="none" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {Array.from({ length: 48 }).map((_, i) => {
            const colors = ['#881337', '#D4AF37', '#15803D', '#EA580C', '#78350F', '#B91C1C'];
            const color = colors[i % colors.length];
            const x = i * 25;
            return (
              <polygon 
                key={i} 
                points={`${x},0 ${x + 25},0 ${x + 12.5},16`} 
                fill={color} 
                stroke="#1A0409" 
                strokeWidth="0.5" 
              />
            );
          })}
        </svg>
      </div>

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

          {/* Mobile Right: High-contrast unified countdown pill (Numbers Only) */}
          <div className="flex items-center gap-1 bg-[#3D0A1B] border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full shadow-sm text-[11px] font-mono font-bold text-amber-200 shrink-0">
            <span className="text-amber-400">⏳</span>
            <span className="text-white">{String(timeLeft.days).padStart(2, '0')}</span>
            <span className="text-amber-500">:</span>
            <span className="text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-amber-500">:</span>
            <span className="text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-amber-500">:</span>
            <span className="text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
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

          {/* Right: Countdown & Quick Proceed CTA (Numbers Only) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* 4 Countdown Boxes (Numbers Only - Zero text labels) */}
            <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
              {/* Days */}
              <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[34px] shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
              </div>
              <span className="text-amber-400 font-bold text-xs">:</span>

              {/* Hours */}
              <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[34px] shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-amber-400 font-bold text-xs">:</span>

              {/* Mins */}
              <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[34px] shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-amber-400 font-bold text-xs">:</span>

              {/* Secs */}
              <div className="flex items-center justify-center bg-[#3D0A17] border border-[#6B1429] rounded-md px-2 py-1 min-w-[34px] shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

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
};

