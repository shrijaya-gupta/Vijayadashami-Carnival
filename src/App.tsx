import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThemeProvider } from './context/ThemeContext';
import { SmoothScrollProvider, useSmoothScroll } from './context/SmoothScrollContext';
import { RegistrationProvider, useRegistration } from './context/RegistrationContext';
import { TopBanner } from './components/TopBanner';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GamesCatalogue } from './components/GamesCatalogue';
import { RegistrationWizard } from './components/RegistrationWizard';
import { SelectionBar } from './components/SelectionBar';
import { ScoreboardModal } from './components/ScoreboardModal';
import { Footer } from './components/Footer';
import { IntroScreen } from './components/IntroScreen';
import { FloatingRegisterPill } from './components/FloatingRegisterPill';

const CarnivalApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'register'>('home');
  const [isScoreboardOpen, setIsScoreboardOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('carnival_intro_seen');
    } catch (e) {
      return true;
    }
  });
  const { selectedGameIds, toggleGameSelection, goToStep, activeStep } = useRegistration();
  const { scrollTo, stopScroll, startScroll } = useSmoothScroll();

  // Manage Lenis scroll locking when modals are open
  useEffect(() => {
    if (isScoreboardOpen || showIntro) {
      stopScroll();
    } else {
      startScroll();
    }
  }, [isScoreboardOpen, showIntro, stopScroll, startScroll]);

  // Synchronize Navbar activeTab indicator with actual scroll position
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => setActiveTab('home'),
        onEnterBack: () => setActiveTab('home')
      });

      ScrollTrigger.create({
        trigger: '#games',
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => setActiveTab('games'),
        onEnterBack: () => setActiveTab('games')
      });

      ScrollTrigger.create({
        trigger: '#register',
        start: 'top 60%',
        end: 'bottom 60%',
        onEnter: () => setActiveTab('register'),
        onEnterBack: () => setActiveTab('register')
      });
    });

    return () => ctx.revert();
  }, []);

  const handleRegisterClick = () => {
    goToStep(2);
    scrollTo('#wizard-form-card', { offset: -70, duration: 1.2 });
  };

  const handleExploreGamesClick = () => {
    scrollTo('#games', { offset: -70, duration: 1.2 });
  };

  const handleToggleGame = (gameId: string) => {
    handleRegisterClick();
  };

  const handleProceedFromSelectionBar = () => {
    handleRegisterClick();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0207] text-stone-100 transition-colors relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Dynamic Background Ambient Aurora Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-rose-900/20 via-amber-600/10 to-transparent blur-[120px] animate-aura-pulse" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-amber-600/15 via-rose-950/20 to-transparent blur-[140px] animate-aura-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-950/25 via-yellow-600/10 to-transparent blur-[130px] animate-aura-pulse" style={{ animationDelay: '5s' }} />
      </div>

      {/* Top Ribbon Notice with Bunting Flags & Countdown */}
      <TopBanner onProceedClick={handleRegisterClick} />

      {/* Main Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenScoreboard={() => setIsScoreboardOpen(true)} 
      />

      <main className="flex-1 pb-10 sm:pb-12">
        <Hero 
          onRegisterClick={handleRegisterClick} 
          onExploreGamesClick={handleExploreGamesClick} 
          onWatchIntroClick={() => setShowIntro(true)}
        />
        <GamesCatalogue
          selectedGameIds={selectedGameIds}
          onToggleGame={handleToggleGame}
          onProceedToRegister={handleProceedFromSelectionBar}
        />
        <RegistrationWizard />
      </main>

      {/* SelectionBar hidden as ₹10 all-access pass covers all games without individual selection */}
      <div className="sr-only">
        <SelectionBar
          selectedGameIds={selectedGameIds}
          onRemoveGame={handleToggleGame}
          onProceed={handleProceedFromSelectionBar}
        />
      </div>

      {/* Live Campus Scoreboard Modal */}
      <ScoreboardModal 
        isOpen={isScoreboardOpen} 
        onClose={() => setIsScoreboardOpen(false)} 
      />

      {/* Cinematic Battle Intro Splash Screen */}
      <IntroScreen 
        isOpen={showIntro} 
        onClose={() => setShowIntro(false)} 
      />

      {/* Floating Register CTA Pill */}
      <FloatingRegisterPill onRegisterClick={handleRegisterClick} />

      <Footer 
        onRegisterClick={handleRegisterClick} 
        onOpenScoreboard={() => setIsScoreboardOpen(true)} 
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SmoothScrollProvider>
        <RegistrationProvider>
          <CarnivalApp />
        </RegistrationProvider>
      </SmoothScrollProvider>
    </ThemeProvider>
  );
};

export default App;
