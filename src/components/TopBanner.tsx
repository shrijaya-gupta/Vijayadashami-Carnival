import React, { useState, useEffect } from 'react';
import { EVENT_DETAILS } from '../data/games';
import { Megaphone, ChevronRight } from 'lucide-react';

interface TopBannerProps {
  onProceedClick: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({ onProceedClick }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 2,
    minutes: 59,
    seconds: 51,
  });

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

  return (
    <div className="w-full bg-gradient-to-r from-[#1A030A] via-[#2D0613] to-[#1A030A] border-b border-[#D4AF37]/35 text-white shadow-md relative z-40">
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
        <div className="px-3 sm:px-6 py-1.5 sm:py-2">
        
        {/* ================= MOBILE COMPACT VIEW (< 640px) ================= */}
        {/* Single clean row: high contrast, zero clutter, fully readable */}
        <div className="flex sm:hidden items-center justify-between gap-2 py-0.5">
          {/* Mobile Left: Clear Notice & Fee */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/40 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Closes 26 Oct
            </span>
            <span className="text-stone-200 font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
              ₹5/game
            </span>
          </div>

          {/* Mobile Right: High-contrast unified countdown pill (Numbers Only) */}
          <div className="flex items-center gap-1 bg-[#3D0A17] border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full shadow-sm text-[11px] font-mono font-bold text-amber-200 shrink-0">
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
          
          {/* Left: Important Notice */}
          <div className="flex items-center gap-2 sm:gap-3 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-amber-500/70 bg-amber-950/60 text-amber-300 font-bold text-[11px] sm:text-xs tracking-wider uppercase shadow-xs">
              <Megaphone className="w-3 h-3 text-amber-400" />
              <span>IMPORTANT</span>
            </div>
            <span className="text-amber-600/60">|</span>
            <span className="font-medium text-[#F7ECE1] text-xs sm:text-sm">
              Registration closes Monday, 26 October 2026 • ₹5 fee per selected game
            </span>
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
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#C2410C] to-[#DC2626] hover:from-[#EA580C] hover:to-[#EF4444] text-white flex items-center gap-1 shadow-md shadow-red-950/40 hover:scale-105 active:scale-95 transition-all"
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

