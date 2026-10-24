import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { RegistrationProvider, useRegistration } from './context/RegistrationContext';
import { TopBanner } from './components/TopBanner';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GamesCatalogue } from './components/GamesCatalogue';
import { RegistrationWizard } from './components/RegistrationWizard';
import { SelectionBar } from './components/SelectionBar';
import { CertificateVerification } from './components/CertificateVerification';
import { ScoreboardModal } from './components/ScoreboardModal';
import { Footer } from './components/Footer';

const CarnivalApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'register' | 'verify'>('home');
  const [isScoreboardOpen, setIsScoreboardOpen] = useState<boolean>(false);
  const { selectedGameIds, toggleGameSelection, goToStep, activeStep } = useRegistration();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') || window.location.pathname.startsWith('/verify')) {
      setActiveTab('verify');
    }
  }, []);

  const handleRegisterClick = () => {
    setActiveTab('register');
    const el = document.getElementById('register');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExploreGamesClick = () => {
    setActiveTab('games');
    const el = document.getElementById('games');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleProceedFromSelectionBar = () => {
    setActiveTab('register');
    goToStep(2);
    const el = document.getElementById('register');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
        {activeTab === 'home' && (
          <>
            <Hero 
              onRegisterClick={handleRegisterClick} 
              onExploreGamesClick={handleExploreGamesClick} 
            />
            <GamesCatalogue
              selectedGameIds={selectedGameIds}
              onToggleGame={toggleGameSelection}
              onProceedToRegister={handleProceedFromSelectionBar}
            />
            <RegistrationWizard />
          </>
        )}

        {activeTab === 'games' && (
          <div className="pt-6">
            <GamesCatalogue
              selectedGameIds={selectedGameIds}
              onToggleGame={toggleGameSelection}
              onProceedToRegister={handleProceedFromSelectionBar}
            />
          </div>
        )}

        {activeTab === 'register' && (
          <div className="pt-6">
            <RegistrationWizard />
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="pt-6">
            <CertificateVerification />
          </div>
        )}
      </main>

      {/* Floating Action Pill (Bottom-Right corner, compact and non-obtrusive) */}
      {activeStep < 5 && (
        <SelectionBar
          selectedGameIds={selectedGameIds}
          onRemoveGame={toggleGameSelection}
          onProceed={handleProceedFromSelectionBar}
        />
      )}

      {/* Live Campus Scoreboard Modal */}
      <ScoreboardModal 
        isOpen={isScoreboardOpen} 
        onClose={() => setIsScoreboardOpen(false)} 
      />

      <Footer />
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
