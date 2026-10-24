import React from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { WizardProgress } from './WizardProgress';
import { Step1GamesSelection } from './Step1GamesSelection';
import { Step2StudentDetails } from './Step2StudentDetails';
import { Step3TeamRoster } from './Step3TeamRoster';
import { Step4ReviewSummary } from './Step4ReviewSummary';
import { Step5Payment } from './Step5Payment';
import { Step6Confirmation } from './Step6Confirmation';
import { Gamepad2, UserCheck, CreditCard, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

export const RegistrationWizard: React.FC = () => {
  const { activeStep, goToStep, selectedGameIds, totalFee } = useRegistration();

  return (
    <section id="register" className="relative py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-white scroll-mt-20">
      
      {/* Decorative Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-3">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#380E17]/95 via-[#4A101E]/90 to-[#2A0812]/95 border border-[#D4AF37]/50 text-[#E5C158] shadow-md backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span className="tracking-wider uppercase text-[11px]">Instant 2-Minute Entry</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-cinzel tracking-wider uppercase leading-tight text-white">
          <span className="block text-[#FFFDF9] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            Student Registration Portal
          </span>
        </h2>

        {/* Golden Lotus Ornament */}
        <div className="pt-0.5 flex items-center justify-center gap-2.5">
          <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/80" />
          <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D4AF37] drop-shadow-xs">
            <path d="M18 1C15 6 9 9 3 9C6 11 12 11 16 7L18 15L20 7C24 11 30 11 33 9C27 9 21 6 18 1Z" fill="#D4AF37" opacity="0.9"/>
            <circle cx="18" cy="4" r="1.5" fill="#FFE28A" />
            <circle cx="12" cy="8" r="1" fill="#D4AF37" />
            <circle cx="24" cy="8" r="1" fill="#D4AF37" />
          </svg>
          <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/80" />
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-lg mx-auto leading-relaxed">
          Quick and streamlined registration for SRMU students. Flat ₹10 All-Access Carnival Pass covering all 6 games — simply fill in your details and pay ₹10.
        </p>

        {/* 3 Quick Steps Roadmap */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div 
            onClick={() => goToStep(2)}
            className={`royal-glass-card p-3.5 rounded-2xl transition-all cursor-pointer ${
              activeStep === 2 
                ? 'bg-[#3D0A1B] border-amber-400 shadow-lg shadow-rose-950/50 scale-[1.02]' 
                : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#9F1239] to-[#BE123C] border border-[#FFE28A]/80 text-white flex items-center justify-center text-[10px] shadow-xs">1</span>
              <span>1. Student Details</span>
            </div>
            <p className="text-[11px] text-stone-300 line-clamp-1">Name, Mobile, Course & Year</p>
          </div>

          <div 
            onClick={() => goToStep(5)}
            className={`royal-glass-card p-3.5 rounded-2xl transition-all cursor-pointer ${
              activeStep === 5 
                ? 'bg-[#3D0A1B] border-amber-400 shadow-lg shadow-rose-950/50 scale-[1.02]' 
                : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#9F1239] to-[#BE123C] border border-[#FFE28A]/80 text-white flex items-center justify-center text-[10px] shadow-xs">2</span>
              <span>2. Pay ₹10 Pass</span>
            </div>
            <p className="text-[11px] text-stone-300 line-clamp-1">₹10 Flat Fee • All Games Included</p>
          </div>

          <div 
            onClick={() => goToStep(6)}
            className={`royal-glass-card p-3.5 rounded-2xl transition-all cursor-pointer ${
              activeStep === 6 
                ? 'bg-[#3D0A1B] border-amber-400 shadow-lg shadow-rose-950/50 scale-[1.02]' 
                : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#9F1239] to-[#BE123C] border border-[#FFE28A]/80 text-white flex items-center justify-center text-[10px] shadow-xs">3</span>
              <span>3. Get Pass & ID</span>
            </div>
            <p className="text-[11px] text-stone-300 line-clamp-1">Instant Pass & Scannable QR</p>
          </div>
        </div>
      </div>
      
      {/* Wizard Progress Stepper Header */}
      <WizardProgress />

      {/* Dynamic Step Panes in Royal Velvet Theme */}
      <div 
        id="wizard-form-card" 
        className="relative rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-b from-[#1E0510]/95 via-[#14030A]/95 to-[#0C0206] border-2 border-[#D4AF37]/45 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,240,190,0.15)] backdrop-blur-2xl transition-all min-h-[580px] scroll-mt-24"
      >
        {selectedGameIds.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4 space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#881337] to-[#B91C1C] border border-[#D4AF37]/60 flex items-center justify-center text-amber-300 shadow-lg shadow-rose-950/60">
              <Gamepad2 className="w-8 h-8 text-[#FFE28A]" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
                Choose Games to Begin Registration
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Please select between 1 and 6 games from the <strong>Games and Activities</strong> section above to unlock your student entry form. Entry fee is strictly ₹5 per game.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('games');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white inline-flex items-center gap-2 shadow-lg shadow-rose-950/60 border border-[#E5C158]/70 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Explore & Select Games Above</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        ) : (
          <>
            {activeStep === 1 && <Step1GamesSelection />}
            {activeStep === 2 && <Step2StudentDetails />}
            {activeStep === 3 && <Step3TeamRoster />}
            {activeStep === 4 && <Step4ReviewSummary />}
            {activeStep === 5 && <Step5Payment />}
            {activeStep === 6 && <Step6Confirmation />}
          </>
        )}
      </div>

    </section>
  );
};
