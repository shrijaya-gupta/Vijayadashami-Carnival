import React from 'react';
import { MapPin, Calendar, ShieldCheck, Heart, Sparkles } from 'lucide-react';

// Authentic Vijayadashami Bow with Nocked Arrow Brand Icon matching Navbar
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

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gradient-to-b from-[#140209] via-[#0A0105] to-[#040002] text-stone-300 border-t-2 border-[#D4AF37]/40 pt-16 pb-12 mt-12 text-white shadow-[0_-20px_50px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#D4AF37]/20">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9F1239] via-[#5C0A1E] to-[#25030C] text-amber-300 flex items-center justify-center border-2 border-[#D4AF37]/70 shadow-[0_0_20px_rgba(212,175,55,0.35)]">
                <VijayadashamiBowIcon className="w-8 h-8" />
              </div>
              <div>
                <span className="font-heading font-black text-xl text-white tracking-wide block">
                  VIJAYADASHAMI CARNIVAL 2026
                </span>
                <span className="text-xs text-amber-300 font-semibold">
                  Shri Ramswaroop Memorial University (SRMU B5-408)
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md">
              A university festival honoring valor, unity, and excellence. Featuring 6 thrilling athletic challenges, agility arenas, and cooperative puzzles at B5-408.
            </p>

            <div className="space-y-1.5 text-xs text-amber-200/90 pt-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Thursday, 29 October 2026 • 11:00 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>SRMU Campus, B5-408</span>
              </div>
            </div>
          </div>

          {/* 6 Carnival Games */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Carnival Games (₹5 / Entry)
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li>• Lemon and Spoon Race</li>
              <li>• Target Shooting Challenge</li>
              <li>• Musical Chairs</li>
              <li>• Human Knot Challenge</li>
              <li>• Cup & Balloon Pyramid</li>
              <li>• Balloon Dual Race</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-4">
              Event Management
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#games" className="text-stone-300 hover:text-amber-300 transition-colors">
                  Games Catalogue
                </a>
              </li>
              <li>
                <a href="#register" className="text-stone-300 hover:text-amber-300 transition-colors">
                  Registration Wizard
                </a>
              </li>
              <li>
                <a href="/verify.html" className="text-stone-300 hover:text-amber-300 transition-colors">
                  Certificate Verification
                </a>
              </li>
              <li>
                <a 
                  href="/admin/login.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-amber-300 hover:text-white font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Organizer Admin Desk
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© 2026 Shri Ramswaroop Memorial University. All rights reserved.</p>
          <div className="flex items-center gap-1 text-stone-400">
            <span>Built with festive spirit for SRMU B5-408 Carnival</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
