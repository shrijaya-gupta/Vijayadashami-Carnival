import React, { useState, useEffect } from 'react';
import { EVENT_DETAILS } from '../data/games';
import { Megaphone, ChevronRight, ChevronLeft, Award, Sparkles, Flame, Clock } from 'lucide-react';

interface TopBannerProps {
  onProceedClick: () => void;
}

const BULLETINS = [
  {
    id: 1,
    tag: 'REGISTRATION DEADLINE',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    icon: Megaphone,
    iconColor: 'text-amber-400',
    text: 'Registration closes Monday, 26 October 2026 • ₹5 fee per selected game',
    mobileText: 'Closes Mon 26 Oct • ₹5/game'
  },
  {
    id: 2,
    tag: 'DIGITAL CREDENTIALS',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    icon: Award,
    iconColor: 'text-amber-300',
    text: 'Verified SRMU Participation Certificates with Instant QR Authenticity Scan',
    mobileText: 'Official QR Certificates'
  },
  {
    id: 3,
    tag: 'CAMPUS B5-408 ARENA',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    icon: Sparkles,
    iconColor: 'text-emerald-400',
    text: 'Carnival Venue: Campus B5-408 • 6 Thrilling Athletic Challenges & Cooperative Puzzles',
    mobileText: 'Venue: Campus B5-408'
  }
];

export const TopBanner: React.FC<TopBannerProps> = ({ onProceedClick }) => {
  const [currentBulletinIndex, setCurrentBulletinIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 2,
    minutes: 59,
    seconds: 51,
  });

  // Countdown timer calculation
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

  // Bulletin auto-rotation ticker every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const ticker = setInterval(() => {
      setCurrentBulletinIndex((prev) => (prev + 1) % BULLETINS.length);
    }, 4500);
    return () => clearInterval(ticker);
  }, [isPaused]);

  const activeBulletin = BULLETINS[currentBulletinIndex];
  const BulletinIcon = activeBulletin.icon;

  const handlePrev = () => {
    setCurrentBulletinIndex((prev) => (prev - 1 + BULLETINS.length) % BULLETINS.length);
  };

  const handleNext = () => {
    setCurrentBulletinIndex((prev) => (prev + 1) % BULLETINS.length);
  };

  return (
    <div 
      className="w-full relative z-40 bg-gradient-to-r from-[#170208] via-[#2A0512] to-[#170208] border-b border-[#D4AF37]/35 text-white shadow-[0_4px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative Traditional Indian Bunting / Toran Banner with Golden Wire */}
      <div className="w-full relative h-2.5 sm:h-3 overflow-hidden flex items-center bg-[#100206]">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFE28A] to-transparent shadow-[0_0_4px_rgba(255,226,138,0.8)]" />
        <svg 
          viewBox="0 0 1200 16" 
          preserveAspectRatio="none" 
          className="w-full h-full drop-shadow-xs"
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2">
        
        {/* ================= MOBILE VIEW (< 640px) ================= */}
        <div className="flex sm:hidden items-center justify-between gap-2 py-0.5">
          {/* Mobile Left: Rotating announcement pill */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-amber-200 truncate">
                {activeBulletin.mobileText}
              </span>
            </div>
          </div>

          {/* Mobile Right: Ultra-sleek Chronometer Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-gradient-to-r from-[#3D0A1B] to-[#25040E] border border-[#D4AF37]/60 px-2 py-0.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-[10px] font-mono font-bold text-amber-200">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-white">{String(timeLeft.days).padStart(2, '0')}d</span>
              <span className="text-amber-500">:</span>
              <span className="text-white">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="text-amber-500">:</span>
              <span className="text-amber-300">{String(timeLeft.minutes).padStart(2, '0')}m</span>
            </div>

            {/* Quick Mobile Mini CTA */}
            <button
              onClick={onProceedClick}
              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#C2410C] to-[#DC2626] text-white border border-amber-300/60 shadow-xs flex items-center gap-0.5 active:scale-95"
            >
              <span>Join</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* ================= DESKTOP / TABLET VIEW (>= 640px) ================= */}
        <div className="hidden sm:flex items-center justify-between gap-4 text-xs sm:text-sm">
          
          {/* Left: Dynamic Rotating Bulletin with Interactive Controls */}
          <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
            
            {/* Live Indicator Beacon */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/60 bg-emerald-950/40 text-emerald-300 font-extrabold text-[10px] tracking-wider uppercase shrink-0 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>

            {/* Category Tag */}
            <div className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${activeBulletin.tagColor} font-bold text-[10px] tracking-wider uppercase shrink-0 transition-all`}>
              <BulletinIcon className={`w-3 h-3 ${activeBulletin.iconColor} shrink-0`} />
              <span>{activeBulletin.tag}</span>
            </div>

            <span className="text-amber-500/40 hidden md:inline">|</span>

            {/* Rotating Text Message */}
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="font-medium text-[#FFF7EC] text-xs sm:text-sm truncate animate-in fade-in duration-300">
                {activeBulletin.text}
              </p>
            </div>

            {/* Bulletin manual navigation arrows */}
            <div className="hidden lg:flex items-center gap-1 shrink-0 text-amber-300/70">
              <button
                onClick={handlePrev}
                aria-label="Previous announcement"
                className="w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next announcement"
                className="w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>

          {/* Right: Royal Chronometer & Quick Proceed CTA */}
          <div className="flex items-center gap-3 lg:gap-4 shrink-0">
            
            {/* 4 Luxury Chronometer Pods with Micro-Labels */}
            <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
              {/* Flame Urgency Icon */}
              <div className="hidden xl:flex items-center justify-center mr-1">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              </div>

              {/* Days */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#380715] to-[#1C030A] border border-[#D4AF37]/50 rounded-lg px-2 py-0.5 min-w-[36px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-sans font-bold text-amber-400/70 uppercase">Days</span>
              </div>
              <span className="text-amber-400 font-bold text-xs leading-none">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#380715] to-[#1C030A] border border-[#D4AF37]/50 rounded-lg px-2 py-0.5 min-w-[36px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-sans font-bold text-amber-400/70 uppercase">Hours</span>
              </div>
              <span className="text-amber-400 font-bold text-xs leading-none">:</span>

              {/* Mins */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#380715] to-[#1C030A] border border-[#D4AF37]/50 rounded-lg px-2 py-0.5 min-w-[36px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <span className="text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-sans font-bold text-amber-400/70 uppercase">Mins</span>
              </div>
              <span className="text-amber-400 font-bold text-xs leading-none">:</span>

              {/* Secs */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#380715] to-[#1C030A] border border-[#D4AF37]/50 rounded-lg px-2 py-0.5 min-w-[36px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <span className="text-xs sm:text-sm font-bold text-amber-200 leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-sans font-bold text-amber-400/70 uppercase">Secs</span>
              </div>
            </div>

            {/* Proceed CTA button */}
            <button
              onClick={onProceedClick}
              className="shine-effect px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#C2410C] via-[#DC2626] to-[#B91C1C] hover:from-[#EA580C] hover:to-[#EF4444] text-white flex items-center gap-1.5 shadow-[0_4px_16px_rgba(220,38,38,0.4)] border border-amber-300/60 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
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


