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
    <div className="min-h-screen flex flex-col bg-[#100308] text-stone-100 transition-colors">
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
