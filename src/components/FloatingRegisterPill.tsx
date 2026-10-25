import React, { useState, useEffect } from 'react';
import { ArrowRight, Ticket } from 'lucide-react';
import { useRegistration } from '../context/RegistrationContext';

interface FloatingRegisterPillProps {
  onRegisterClick: () => void;
}

export const FloatingRegisterPill: React.FC<FloatingRegisterPillProps> = ({ onRegisterClick }) => {
  const { activeStep } = useRegistration();
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('wizard-form-card') || document.getElementById('register');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFormVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Do not render if participant is on confirmation screen (step 6) or already viewing the form
  if (activeStep === 6 || isFormVisible) {
    return null;
  }

  return (
    <aside 
      aria-label="Registration Floating Action" 
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <button
        type="button"
        onClick={onRegisterClick}
        className="group flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#DC2626] text-white border-2 border-[#FFE28A]/80 shadow-[0_10px_30px_rgba(136,19,55,0.7)] hover:shadow-[0_12px_35px_rgba(217,119,6,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
      >
        <div className="w-6 h-6 rounded-full bg-[#FFE28A]/20 flex items-center justify-center text-[#FFE28A] shrink-0 group-hover:rotate-12 transition-transform">
          <Ticket className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black tracking-wide">
          <span>Get ₹10 Carnival Pass</span>
          <span className="text-amber-300 font-extrabold">• Register Now</span>
        </div>
        <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
      </button>
    </aside>
  );
};
