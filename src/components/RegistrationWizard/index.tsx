import React from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { WizardProgress } from './WizardProgress';
import { Step1GamesSelection } from './Step1GamesSelection';
import { Step2StudentDetails } from './Step2StudentDetails';
import { Step3TeamRoster } from './Step3TeamRoster';
import { Step4ReviewSummary } from './Step4ReviewSummary';
import { Step5Payment } from './Step5Payment';
import { Step6Confirmation } from './Step6Confirmation';
import { Gamepad2, UserCheck, CreditCard, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export const RegistrationWizard: React.FC = () => {
  const { activeStep, goToStep, selectedGameIds, totalFee } = useRegistration();

  return (
    <section id="register" className="relative py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
      
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
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-decorative tracking-[0.02em] leading-tight text-white">
          <span className="block text-[#FFFDF9] drop-shadow-md">
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
          Quick and streamlined registration for SRMU students. Select your games, enter enrollment details, and verify payment.
        </p>

        {/* 3 Quick Steps Roadmap */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div 
            onClick={() => goToStep(1)}
            className={`royal-glass-card p-3.5 rounded-2xl transition-all cursor-pointer ${
              activeStep === 1 
                ? 'bg-[#3D0A1B] border-amber-400 shadow-lg shadow-rose-950/50 scale-[1.02]' 
                : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#9F1239] to-[#BE123C] border border-[#FFE28A]/80 text-white flex items-center justify-center text-[10px] shadow-xs">1</span>
              <span>1. Pick Games</span>
            </div>
            <p className="text-[11px] text-stone-300 line-clamp-1">1 to 6 games at ₹5 per entry</p>
          </div>

          <div 
            onClick={() => goToStep(2)}
            className={`royal-glass-card p-3.5 rounded-2xl transition-all cursor-pointer ${
              activeStep === 2 || activeStep === 3 
                ? 'bg-[#3D0A1B] border-amber-400 shadow-lg shadow-rose-950/50 scale-[1.02]' 
                : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#9F1239] to-[#BE123C] border border-[#FFE28A]/80 text-white flex items-center justify-center text-[10px] shadow-xs">2</span>
              <span>2. Student Info</span>
            </div>
            <p className="text-[11px] text-stone-300 line-clamp-1">Name, Roll Number & Phone</p>
          </div>

          <div 
            onClick={() => goToStep(5)}
            className={`royal-glass-card p-3.5 rounded-2xl transition-all cursor-pointer ${
              activeStep >= 4 
                ? 'bg-[#3D0A1B] border-amber-400 shadow-lg shadow-rose-950/50 scale-[1.02]' 
                : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#9F1239] to-[#BE123C] border border-[#FFE28A]/80 text-white flex items-center justify-center text-[10px] shadow-xs">3</span>
              <span>3. Pay & Get Pass</span>
            </div>
            <p className="text-[11px] text-stone-300 line-clamp-1">₹{totalFee || 5} UPI / Cash & Instant ID</p>
          </div>
        </div>
      </div>
      
      {/* Wizard Progress Stepper Header */}
      <WizardProgress />

      {/* Dynamic Step Panes in Royal Velvet Theme */}
      <div className="relative rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-b from-[#1E0510]/95 via-[#14030A]/95 to-[#0C0206] border-2 border-[#D4AF37]/45 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,240,190,0.15)] backdrop-blur-2xl transition-all">
        {activeStep === 1 && <Step1GamesSelection />}
        {activeStep === 2 && <Step2StudentDetails />}
        {activeStep === 3 && <Step3TeamRoster />}
        {activeStep === 4 && <Step4ReviewSummary />}
        {activeStep === 5 && <Step5Payment />}
        {activeStep === 6 && <Step6Confirmation />}
      </div>

    </section>
  );
};
