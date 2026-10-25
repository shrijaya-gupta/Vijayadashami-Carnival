import React, { useEffect, useRef } from 'react';
import { useSmoothScroll } from '../context/SmoothScrollContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Trophy, 
  ArrowUp, 
  ExternalLink, 
  MessageCircle, 
  Sparkles, 
  Clock, 
  Ticket,
  Gamepad2
} from 'lucide-react';

// Authentic Vijayadashami Bow with Nocked Arrow Brand Icon
const VijayadashamiBowIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="footerBowGoldGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFE8A3" />
        <stop offset="40%" stopColor="#D4AF37" />
        <stop offset="70%" stopColor="#996515" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="footerArrowFlameGrad" x1="20" y1="80" x2="85" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="35%" stopColor="#EA580C" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FFFBEB" />
      </linearGradient>
    </defs>
    {/* Bow Curve */}
    <path 
      d="M 18,22 C 38,42 38,58 18,78" 
      stroke="url(#footerBowGoldGrad)" 
      strokeWidth="5.5" 
      strokeLinecap="round" 
    />
    {/* Bowstring */}
    <path 
      d="M 18,22 L 34,50 L 18,78" 
      stroke="#FFEAA7" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeDasharray="1 0.5" 
    />
    {/* Arrow Shaft & Tip */}
    <path 
      d="M 28,50 L 82,50" 
      stroke="url(#footerArrowFlameGrad)" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
    <polygon points="88,50 74,43 78,50 74,57" fill="#FFEAA7" stroke="#D4AF37" strokeWidth="1" />
  </svg>
);

interface FooterProps {
  onRegisterClick?: () => void;
  onOpenScoreboard?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onRegisterClick, onOpenScoreboard }) => {
  const { scrollTo } = useSmoothScroll();
  const footerRef = useRef<HTMLElement>(null);
  const columnsGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (columnsGridRef.current) {
        gsap.from(columnsGridRef.current.children, {
          opacity: 0,
          y: 35,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: columnsGridRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        });
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    scrollTo(0, { duration: 1.4 });
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      scrollTo('#wizard-form-card', { offset: -70, duration: 1.2 });
    }
  };

  const handleGames = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollTo('#games', { offset: -70, duration: 1.2 });
  };

  return (
    <footer ref={footerRef} className="w-full bg-gradient-to-b from-[#18030C] via-[#0E0207] to-[#040002] text-stone-300 border-t-2 border-[#D4AF37]/40 pt-16 pb-10 mt-14 text-white shadow-[0_-25px_60px_rgba(0,0,0,0.95)] relative overflow-hidden">
      
      {/* Decorative Golden Ambient Backglow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-28 bg-[#D4AF37]/10 blur-[90px] pointer-events-none" />

      {/* Traditional Lotus Divider Ornament */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-center gap-4">
          <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />
          <div className="flex items-center gap-2 text-amber-300 px-3 py-1 rounded-full bg-black/40 border border-[#D4AF37]/40 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FFE28A]">SRMU Campus Festival</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 3-Column Grid */}
        <div ref={columnsGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          
          {/* Column 1: Brand & University Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9F1239] via-[#630B22] to-[#2E040E] text-amber-300 flex items-center justify-center border-2 border-[#D4AF37]/70 shadow-[0_0_20px_rgba(212,175,55,0.35)] shrink-0">
                <VijayadashamiBowIcon className="w-8 h-8" />
              </div>
              <div>
                <span className="font-heading font-black text-lg text-white tracking-wide block leading-tight">
                  VIJAYADASHAMI
                </span>
                <span className="text-xs text-amber-300 font-bold tracking-wide">
                  CARNIVAL 2026 • SRMU B5-408
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Shri Ramswaroop Memorial University's grand Dussehra festive carnival celebrating student sportsmanship, teamwork, agility, and victory over challenges.
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-[#D4AF37]/30 space-y-2.5 text-xs text-stone-200">
              <div className="flex items-center gap-2 text-amber-200 font-semibold">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Thursday, 29 October 2026</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>11:00 AM to 04:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Venue: SRMU B5-408 Arena</span>
              </div>
            </div>
          </div>

          {/* Column 2: Official WhatsApp Community & Pass Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>Pass &amp; WhatsApp Group</span>
            </h4>

            {/* Official Pass Highlight */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#2E040E] to-[#120106] border border-[#D4AF37]/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">All-Access Pass</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black text-xs">
                  ₹10 Flat
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Single registration grants unlimited access across all festival arenas. Open for all SRMU faculties and batches.
              </p>
            </div>

            {/* Direct WhatsApp Community CTA Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#075E54]/85 to-[#128C7E]/85 border border-emerald-400/50 shadow-md space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <MessageCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Carnival WhatsApp Group</span>
              </div>
              <p className="text-[11px] text-emerald-100 leading-relaxed">
                Get real-time heat announcements, tournament fixtures, and winner updates directly on your phone.
              </p>
              <a
                href="https://chat.whatsapp.com/Ev1kiwPGzrDFvopit0B12l"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-white text-emerald-900 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Join Official WhatsApp Group</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              </a>
            </div>
          </div>

          {/* Column 3: Quick Navigation & Admin Desk */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span>Event Shortcuts</span>
            </h4>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGames}
                className="w-full text-left py-2 px-3 rounded-lg text-stone-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#D4AF37]/30 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Explore Games Catalogue</span>
                <span className="text-xs text-amber-400 font-bold">&rarr;</span>
              </button>
              <button
                type="button"
                onClick={handleRegister}
                className="w-full text-left py-2 px-3 rounded-lg text-amber-200 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Register for ₹10 Pass</span>
                <span className="text-xs text-amber-400 font-bold">&rarr;</span>
              </button>
              {onOpenScoreboard && (
                <button
                  type="button"
                  onClick={onOpenScoreboard}
                  className="w-full text-left py-2 px-3 rounded-lg text-stone-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#D4AF37]/30 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Live Leaderboard</span>
                  </span>
                  <span className="text-xs text-amber-400 font-bold">&rarr;</span>
                </button>
              )}
            </div>

            {/* Organizer Admin Desk Portal */}
            <div className="pt-1">
              <a 
                href="/admin/login.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full p-2.5 rounded-xl bg-[#2A0610] hover:bg-[#380816] border border-[#D4AF37]/40 text-amber-200 text-xs font-semibold transition-all flex items-center justify-between shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Organizer Admin Desk</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400/70" />
              </a>
              <span className="text-[10px] text-stone-400 block mt-1.5 pl-1">
                Desk verification &amp; participant management portal
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="font-semibold text-stone-300">
              © 2026 Shri Ramswaroop Memorial University (SRMU). All rights reserved.
            </p>
            <p className="text-[11px] text-stone-500">
              Vijayadashami Fest at Building B5-408 • Powered by Student Organizing Committee
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/50 hover:bg-black/80 text-amber-300 hover:text-white border border-[#D4AF37]/40 text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 shrink-0"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

      </div>
    </footer>
  );
};
