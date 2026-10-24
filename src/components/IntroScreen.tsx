import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, X, Volume2, VolumeX } from 'lucide-react';

interface IntroScreenProps {
  isOpen: boolean;
  onClose: () => void;
  autoDismissDelay?: number; // In milliseconds, default 8500ms (matches video duration)
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  isOpen,
  onClose,
  autoDismissDelay = 8500
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      setProgress(0);
      return;
    }

    // Attempt video playback immediately
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (ambientVideoRef.current) {
      ambientVideoRef.current.currentTime = 0;
      ambientVideoRef.current.play().catch(() => {});
    }

    // Smooth progress bar animation
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

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleDismiss = () => {
    setIsClosing(true);
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
      className={`fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-[#060103] text-white transition-all duration-700 ease-out select-none ${
        isClosing ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* =========================================================================
          IMMERSIVE BACKGROUND VIDEO LAYER ("background me ghused do")
          Fills the entire background on mobile, and creates a large theatrical
          ambient canvas on desktop with seamless edge vignette dissolving into #060103
          ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Ambient Blurred Video Glow (widescreen fill for tablet / desktop) */}
        <video
          ref={ambientVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="hidden md:block absolute inset-0 w-full h-full object-cover object-center filter blur-3xl opacity-35 scale-125"
        >
          <source src="/assets/intro.mp4" type="video/mp4" />
        </video>

        {/* High-Definition Main Video Layer (Full-screen background coverage) */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            loop
            preload="auto"
            poster="/assets/hero-mobile.jpg"
            className="w-full h-full max-w-none md:max-w-2xl lg:max-w-3xl object-cover object-center scale-100 sm:scale-105 transition-transform duration-1000"
          >
            <source src="/assets/intro.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Seamless Vignette & Edge Blend Overlays: Completely dissolves video edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060103] via-[#060103]/25 to-[#060103]/85 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060103]/90 via-transparent via-40% to-[#060103] pointer-events-none" />
        <div className="hidden sm:block absolute inset-y-0 left-0 w-36 md:w-56 bg-gradient-to-r from-[#060103] to-transparent pointer-events-none" />
        <div className="hidden sm:block absolute inset-y-0 right-0 w-36 md:w-56 bg-gradient-to-l from-[#060103] to-transparent pointer-events-none" />

        {/* Festive Golden Embers / Ambient Aura Overlay */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#060103]/20 to-[#060103]/90 pointer-events-none" />
        <div className="absolute inset-0 bg-amber-500/5 mix-blend-color-dodge pointer-events-none" />
      </div>

      {/* Floating Golden Sparks / Embers */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute top-1/4 left-8 sm:left-16 w-2 h-2 rounded-full bg-amber-400 blur-xs animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-10 sm:right-24 w-1.5 h-1.5 rounded-full bg-orange-400 blur-xs animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-yellow-300 blur-xs animate-ping" style={{ animationDuration: '5s' }} />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 rounded-full bg-amber-300 blur-xs animate-pulse" style={{ animationDuration: '3.5s' }} />
      </div>

      {/* =========================================================================
          TOP HEADER: BADGE, AUDIO TOGGLE, SKIP BUTTON
          ========================================================================= */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between">
        
        {/* Event Pill Badge */}
        <div className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#1A050F]/80 border border-[#D4AF37]/40 backdrop-blur-md shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-amber-200">
            SRMU B5-408 • Carnival Battle Intro
          </span>
        </div>

        {/* Action Controls: Sound Toggle & Skip */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-stone-200 hover:text-white transition-all text-xs font-medium backdrop-blur-md cursor-pointer"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden xs:inline text-[11px]">Unmute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden xs:inline text-[11px]">Sound On</span>
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-stone-200 hover:text-white transition-all text-xs font-medium backdrop-blur-md cursor-pointer"
            title="Skip Intro"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5 text-stone-300 group-hover:text-white transition-colors" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          CENTER TITLE OVERLAY
          Floating elegantly above the animated battle scene
          ========================================================================= */}
      <div className="relative z-20 w-full max-w-3xl mx-auto px-4 text-center my-auto pointer-events-none">
        <div className="inline-block px-4 py-1.5 mb-2 rounded-full bg-amber-500/10 border border-amber-400/25 backdrop-blur-sm">
          <span className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-amber-300">
            Victory of Good Over Evil
          </span>
        </div>
        
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black font-cinzel tracking-wider uppercase text-[#FFFDF9] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
          VIJAYADASHAMI <span className="gold-gradient-text drop-shadow-[0_4px_30px_rgba(212,175,55,0.5)]">CARNIVAL</span>
        </h1>
        
        <p className="text-xs sm:text-sm md:text-base text-stone-200 font-normal tracking-wide max-w-lg mx-auto mt-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          The celestial arrow is drawn. 6 thrilling campus challenges await!
        </p>
      </div>

      {/* =========================================================================
          BOTTOM FOOTER: ENTER CARNIVAL CTA & AUTO-TRANSITION PROGRESS
          ========================================================================= */}
      <footer className="relative z-20 w-full max-w-md mx-auto px-4 pb-7 sm:pb-9 flex flex-col items-center gap-3.5">
        
        {/* Grand Enter Carnival CTA */}
        <button
          onClick={handleDismiss}
          className="group relative w-full sm:w-auto min-w-[260px] px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#D4AF37] hover:from-[#9F1239] hover:to-[#E5C158] text-white font-bold text-sm sm:text-base tracking-wide shadow-[0_4px_28px_rgba(136,19,55,0.7)] hover:shadow-[0_6px_36px_rgba(212,175,55,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 border border-[#D4AF37]/60 cursor-pointer"
        >
          <span className="drop-shadow-md">Enter Carnival</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 group-hover:translate-x-1.5 transition-transform" />
        </button>

        {/* Progress Bar & Countdown Indicator */}
        <div className="w-52 sm:w-64 flex flex-col items-center gap-1.5">
          <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-[#881337] via-amber-400 to-[#D4AF37] transition-all duration-75 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-[11px] text-stone-300 font-mono tracking-wider drop-shadow-sm">
            Auto-entering in {Math.max(1, Math.ceil((autoDismissDelay * (1 - progress / 100)) / 1000))}s
          </span>
        </div>
      </footer>
    </div>
  );
};
