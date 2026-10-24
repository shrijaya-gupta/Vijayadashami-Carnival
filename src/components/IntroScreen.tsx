import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';

interface IntroScreenProps {
  isOpen: boolean;
  onClose: () => void;
  autoDismissDelay?: number; // In milliseconds, default 8500ms (matches GIF loop)
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  isOpen,
  onClose,
  autoDismissDelay = 8500
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      setProgress(0);
      return;
    }

    // Progress bar animation
    const intervalTime = 50;
    const step = 100 / (autoDismissDelay / intervalTime);
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, intervalTime);

    // Auto-dismiss when intro completes
    const autoCloseTimer = setTimeout(() => {
      handleDismiss();
    }, autoDismissDelay);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [isOpen, autoDismissDelay]);

  const handleDismiss = () => {
    setIsClosing(true);
    // Mark in sessionStorage so regular page refreshes within session enter directly
    try {
      sessionStorage.setItem('carnival_intro_seen', 'true');
    } catch (e) {}

    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-[#070104] transition-all duration-700 ease-out ${
        isClosing ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Ambient Glow Behind Artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-amber-600/15 via-rose-950/20 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[90px]" />
      </div>

      {/* Floating Golden Sparks / Embers */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-amber-400 blur-xs animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-14 w-1.5 h-1.5 rounded-full bg-orange-400 blur-xs animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-yellow-300 blur-xs animate-ping" style={{ animationDuration: '5s' }} />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 rounded-full bg-amber-300 blur-xs animate-pulse" style={{ animationDuration: '3.5s' }} />
      </div>

      {/* Top Header: Badge & Quick Skip */}
      <header className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A050F]/80 border border-[#D4AF37]/35 backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-amber-200">
            SRMU B5-408 • Grand Carnival Intro
          </span>
        </div>

        <button
          onClick={handleDismiss}
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-stone-300 hover:text-white transition-all text-xs font-medium backdrop-blur-md cursor-pointer"
          title="Skip Intro"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors" />
        </button>
      </header>

      {/* Centerpiece: Cinematic Intro GIF with Seamless Radial & Gradient Feathering */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-2 my-auto">
        
        {/* Title Heading */}
        <div className="text-center mb-2 sm:mb-3 select-none">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black font-cinzel tracking-wide uppercase text-[#FFFDF9] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            VIJAYADASHAMI <span className="gold-gradient-text">CARNIVAL</span>
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/80 font-medium tracking-wide mt-1">
            Victory of Good Over Evil • The Grand Celebration Begins
          </p>
        </div>

        {/* Seamless Animated Artwork Container */}
        <div className="relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[360px] md:max-w-[400px] aspect-[9/16] max-h-[58vh] xs:max-h-[62vh] sm:max-h-[65vh] rounded-3xl overflow-hidden flex items-center justify-center">
          
          {/* Animated Intro GIF */}
          <img
            src="/assets/intro.gif"
            alt="Vijayadashami Carnival Battle Intro Animation"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            style={{
              // Seamless radial vignette mask so rectangular borders dissolve into background
              maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 50%, transparent 98%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 50%, transparent 98%)'
            }}
          />

          {/* Seamless Edge Blends: Top, Bottom, Sides */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#070104] via-[#070104]/80 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070104] via-[#070104]/90 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-[#070104] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-[#070104] to-transparent pointer-events-none" />

          {/* Subtle warm festive color harmonization overlay */}
          <div className="absolute inset-0 bg-[#801823]/10 mix-blend-color pointer-events-none" />
        </div>
      </div>

      {/* Bottom Footer: Enter Button & Progress Track */}
      <footer className="relative z-20 w-full max-w-md mx-auto px-4 pb-6 sm:pb-8 flex flex-col items-center gap-3.5 select-none">
        
        {/* Enter Carnival Main CTA */}
        <button
          onClick={handleDismiss}
          className="group relative w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-full bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#D4AF37] hover:from-[#9F1239] hover:to-[#E5C158] text-white font-bold text-sm sm:text-base tracking-wide shadow-[0_4px_24px_rgba(136,19,55,0.6)] hover:shadow-[0_6px_32px_rgba(212,175,55,0.45)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 border border-[#D4AF37]/50 cursor-pointer"
        >
          <span className="drop-shadow-sm">Enter Carnival</span>
          <ArrowRight className="w-4 h-4 text-amber-200 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Animated Progress Bar Indicator */}
        <div className="w-48 sm:w-56 flex flex-col items-center gap-1.5">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-[#881337] via-amber-500 to-[#D4AF37] transition-all duration-75 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400 font-mono tracking-wider">
            Auto-entering in {Math.max(1, Math.ceil((autoDismissDelay * (1 - progress / 100)) / 1000))}s
          </span>
        </div>
      </footer>
    </div>
  );
};
