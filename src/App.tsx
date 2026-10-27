import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
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

  // Direct URL navigation: when /admin or /admin/ is entered in URL, route to Organizer Desk
  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    if (pathname === '/admin') {
      window.location.replace('/admin/login.html');
    }
  }, []);

  const handleRegisterClick = React.useCallback(() => {
    setActiveTab('home');
    goToStep(2);
    setTimeout(() => {
      const el = document.getElementById('wizard-form-card') || document.getElementById('register');
      if (el) {
        const y = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - 80);
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }, [goToStep]);

  const handleExploreGamesClick = React.useCallback(() => {
    setActiveTab('games');
    setTimeout(() => {
      const el = document.getElementById('games');
      if (el) {
        const y = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - 80);
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }, []);

  const handleToggleGame = React.useCallback((_gameId: string) => {
    handleRegisterClick();
  }, [handleRegisterClick]);

  const handleProceedFromSelectionBar = React.useCallback(() => {
    handleRegisterClick();
  }, [handleRegisterClick]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0207] text-stone-100 transition-colors relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* High-Performance Hardware-Accelerated Ambient Aurora Backdrop (Zero Blur Filter Cost) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: 'radial-gradient(circle at 10% 8%, rgba(136,19,55,0.22) 0%, transparent 45%), radial-gradient(circle at 90% 45%, rgba(217,119,6,0.12) 0%, transparent 50%), radial-gradient(circle at 25% 85%, rgba(136,19,55,0.18) 0%, transparent 45%)'
        }}
      />

      {/* Top Ribbon Notice with Bunting Flags & Countdown */}
      <TopBanner onProceedClick={handleRegisterClick} />

      {/* Main Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenScoreboard={() => setIsScoreboardOpen(true)}
      />

      <main className="flex-1 pb-10 sm:pb-12">
        {activeTab === 'home' && (
          <>
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
          </>
        )}

        {activeTab === 'games' && (
          <div className="pt-6">
            <GamesCatalogue
              selectedGameIds={selectedGameIds}
              onToggleGame={handleToggleGame}
              onProceedToRegister={handleProceedFromSelectionBar}
            />
          </div>
        )}

        {activeTab === 'register' && (
          <div className="pt-6">
            <RegistrationWizard />
          </div>
        )}
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
      <RegistrationProvider>
        <CarnivalApp />
      </RegistrationProvider>
    </ThemeProvider>
  );
};

export default App;
