import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  SelectedGameConfig, 
  StudentDetails, 
  ParticipationFormat, 
  TeamMember, 
  RegistrationSubmissionResult,
  Game
} from '../types';
import { GAMES_DATA } from '../data/games';

interface RegistrationContextType {
  activeStep: number;
  selectedGameIds: string[];
  gamesList: Game[];
  gameConfigs: Record<string, SelectedGameConfig>;
  student: StudentDetails;
  totalFee: number;
  isSubmitting: boolean;
  submitError: string | null;
  submissionResult: RegistrationSubmissionResult | null;
  
  // Actions
  refreshGames: () => Promise<void>;
  toggleGameSelection: (gameId: string) => void;
  setGameFormat: (gameId: string, format: ParticipationFormat) => void;
  setTeamName: (gameId: string, name: string) => void;
  addTeamMember: (gameId: string) => void;
  removeTeamMember: (gameId: string, memberIndex: number) => void;
  updateTeamMember: (gameId: string, memberIndex: number, field: keyof TeamMember, value: string) => void;
  updateStudent: (fields: Partial<StudentDetails>) => void;
  
  // Navigation
  goToStep: (stepNumber: number) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  resetRegistration: () => void;
  
  // API Submission
  submitRegistration: (utrNumber?: string, paymentMode?: string) => Promise<boolean>;
  submitPostUtr: (utrNumber: string) => Promise<boolean>;
}

const initialStudent: StudentDetails = {
  fullName: '',
  mobileNumber: '',
  rollNumber: '',
  course: 'B.Tech',
  courseOther: '',
  branch: 'CSE',
  branchOther: '',
  academicYear: '3rd Year',
  whatsAppConsent: true,
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeStep, setActiveStep] = useState<number>(2);
  const [gamesList, setGamesList] = useState<Game[]>(() => GAMES_DATA);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>(() => GAMES_DATA.map(g => g.id));
  
  // Initialize game configs
  const [gameConfigs, setGameConfigs] = useState<Record<string, SelectedGameConfig>>(() => {
    const configs: Record<string, SelectedGameConfig> = {};
    GAMES_DATA.forEach(game => {
      configs[game.id] = {
        gameId: game.id,
        gameName: game.name,
        participationType: 'individual',
        teamName: '',
        teamMembers: []
      };
    });
    return configs;
  });

  const [student, setStudent] = useState<StudentDetails>(initialStudent);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<RegistrationSubmissionResult | null>(null);
  // Authoritative dynamic registration pass fee (synced with admin event configuration; defaults to 10)
  const [passFee, setPassFee] = useState<number>(10);
  const totalFee = passFee;

  const lastGamesPayloadRef = useRef<string>('');

  // Real-time bidirectional game sync between Admin dashboard and Student Portal
  const loadGamesFromApi = useCallback(async () => {
    try {
      const res = await fetch('/api/games', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.games)) {
        const rawPayload = JSON.stringify(data.games);
        if (rawPayload === lastGamesPayloadRef.current) {
          // Payload has not changed, avoid unnecessary state setting and re-renders
          return;
        }
        lastGamesPayloadRef.current = rawPayload;

        if (data.games.length === 0) {
          setGamesList([]);
          setSelectedGameIds([]);
          setGameConfigs({});
          return;
        }

        const mappedGames: Game[] = data.games.map((g: any) => {
          const canonical = GAMES_DATA.find(c => c.id === g.id);
          return {
            ...(canonical || {}),
            ...g,
            id: g.id,
            name: g.name || (canonical?.name ?? 'Carnival Game'),
            category: g.category || (canonical?.category ?? 'Fun & Challenge'),
            participationType: g.participationType || g.suggestedTeamSize || (canonical?.participationType ?? 'Individual'),
            suggestedTeamSize: g.suggestedTeamSize || g.participationType || (canonical?.suggestedTeamSize ?? 'Individual'),
            shortDescription: g.shortDescription || g.description || (canonical?.shortDescription ?? ''),
            description: g.description || g.shortDescription || (canonical?.description ?? ''),
            objective: g.objective || g.description || (canonical?.objective ?? ''),
            approvalStatus: g.approvalStatus || (canonical?.approvalStatus ?? 'Approved & Active'),
            registrationFee: 'Included with All-Access Pass',
            suggestedDuration: g.suggestedDuration || (canonical?.suggestedDuration ?? '3 to 5 minutes'),
            procedure: Array.isArray(g.procedure) && g.procedure.length > 0 ? g.procedure : (canonical?.procedure ?? ['Report to coordinator arena.']),
            proposedRules: Array.isArray(g.proposedRules) && g.proposedRules.length > 0 ? g.proposedRules : (canonical?.proposedRules ?? ['Standard fair play rules apply.']),
            materials: g.materials || (canonical?.materials ?? 'Supplied at arena.'),
            winningCriteria: g.winningCriteria || (canonical?.winningCriteria ?? 'Highest score or completion speed.'),
            safetyNotes: Array.isArray(g.safetyNotes) && g.safetyNotes.length > 0 ? g.safetyNotes : (canonical?.safetyNotes ?? ['Adhere to field supervisor instructions.']),
            iconName: g.iconName || (canonical?.iconName ?? 'Gamepad2')
          };
        });

        setGamesList(mappedGames);

        const activeGameIds = mappedGames.map(g => g.id);
        setSelectedGameIds(activeGameIds);

        setGameConfigs(prev => {
          const next = { ...prev };
          mappedGames.forEach(g => {
            const isTeam = g.participationType.toLowerCase().includes('team') || 
                           g.participationType.toLowerCase().includes('duo') ||
                           g.participationType.toLowerCase().includes('pair');
            if (!next[g.id]) {
              next[g.id] = {
                gameId: g.id,
                gameName: g.name,
                participationType: isTeam ? 'team' : 'individual',
                teamName: '',
                teamMembers: []
              };
            } else {
              next[g.id] = {
                ...next[g.id],
                gameName: g.name
              };
            }
          });
          // Prune removed/hidden games
          Object.keys(next).forEach(id => {
            if (!activeGameIds.includes(id)) {
              delete next[id];
            }
          });
          return next;
        });
      }
    } catch (e) {
      console.warn('RegistrationContext: Could not sync games from API:', e);
    }
  }, []);

  // Sync dynamic game configs & event config from API with multi-channel live updates
  useEffect(() => {
    loadGamesFromApi();

    // Sync authoritative event config (pass fee, deadlines) from admin/server
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && typeof data.data.allAccessPassFee === 'number') {
          setPassFee(data.data.allAccessPassFee);
        }
      })
      .catch(() => {});

    // Listen for cross-tab BroadcastChannel from admin saves
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('srmu_carnival_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'GAMES_UPDATED') {
          loadGamesFromApi();
        }
      };
    } catch (e) {}

    // Listen for storage events across browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'srmu_games_updated_at') {
        loadGamesFromApi();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Refresh when user returns to this browser tab
    const handleFocus = () => {
      loadGamesFromApi();
    };
    window.addEventListener('focus', handleFocus);

    const handleVisibility = () => {
      if (!document.hidden) {
        loadGamesFromApi();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Polling safety net every 15 seconds to ensure instant reflection
    const pollInterval = setInterval(() => {
      loadGamesFromApi();
    }, 15000);

    return () => {
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollInterval);
    };
  }, [loadGamesFromApi]);

  // Precision scroll helper to keep student focused directly on the active form card
  const scrollToWizard = () => {
    const target = document.getElementById('wizard-form-card') || document.getElementById('register');
    if (!target) return;

    const navbarHeight = 80;
    const targetY = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - navbarHeight);

    // Immediate scroll before render so page height shrink never forces scroll to footer
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });

    // Guard timeout to verify position after React unmounts previous step and mounts new step
    setTimeout(() => {
      const recheckTarget = document.getElementById('wizard-form-card') || document.getElementById('register');
      if (recheckTarget) {
        const recheckY = Math.max(0, recheckTarget.getBoundingClientRect().top + window.pageYOffset - navbarHeight);
        if (Math.abs(window.pageYOffset - recheckY) > 80) {
          window.scrollTo({
            top: recheckY,
            behavior: 'smooth'
          });
        }
      }
    }, 70);
  };

  // Toggle game selection with non-blocking feedback
  const toggleGameSelection = (gameId: string) => {
    setSubmitError(null);
    setSelectedGameIds(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId);
      } else {
        if (prev.length >= 6) {
          setSubmitError('Maximum 6 games can be selected.');
          setTimeout(() => setSubmitError(null), 4000);
          return prev;
        }
        return [...prev, gameId];
      }
    });
  };

  const setGameFormat = (gameId: string, format: ParticipationFormat) => {
    setGameConfigs(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        participationType: format
      }
    }));
  };

  const setTeamName = (gameId: string, name: string) => {
    setGameConfigs(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        teamName: name
      }
    }));
  };

  const addTeamMember = (gameId: string) => {
    setSubmitError(null);
    setGameConfigs(prev => {
      const current = prev[gameId];
      if (current.teamMembers.length >= 10) {
        setSubmitError('Maximum 10 squad members allowed per game.');
        setTimeout(() => setSubmitError(null), 4000);
        return prev;
      }
      return {
        ...prev,
        [gameId]: {
          ...current,
          teamMembers: [
            ...current.teamMembers,
            { name: '', roll: '', contact: '' }
          ]
        }
      };
    });
  };

  const removeTeamMember = (gameId: string, memberIndex: number) => {
    setGameConfigs(prev => {
      const current = prev[gameId];
      const updated = current.teamMembers.filter((_, idx) => idx !== memberIndex);
      return {
        ...prev,
        [gameId]: {
          ...current,
          teamMembers: updated
        }
      };
    });
  };

  const updateTeamMember = (
    gameId: string, 
    memberIndex: number, 
    field: keyof TeamMember, 
    value: string
  ) => {
    setGameConfigs(prev => {
      const current = prev[gameId];
      const members = [...current.teamMembers];
      members[memberIndex] = {
        ...members[memberIndex],
        [field]: value
      };
      return {
        ...prev,
        [gameId]: {
          ...current,
          teamMembers: members
        }
      };
    });
  };

  const updateStudent = (fields: Partial<StudentDetails>) => {
    setStudent(prev => ({ ...prev, ...fields }));
  };

  // Indian mobile validation
  const validateMobile = (mobile: string): boolean => {
    const clean = mobile.replace(/[\s\-\(\)]/g, '');
    return /^(?:\+91|0)?[6-9]\d{9}$/.test(clean);
  };

  const nextStep = (): boolean => {
    setSubmitError(null);
    if (activeStep === 1) {
      if (selectedGameIds.length === 0) {
        setSubmitError('Please select at least 1 game to continue.');
        return false;
      }
      setActiveStep(2);
      scrollToWizard();
      return true;
    }

    if (activeStep === 2) {
      if (!student.fullName.trim() || student.fullName.trim().length < 2) {
        setSubmitError('Please enter the student\'s full name (minimum 2 characters).');
        return false;
      }
      if (!validateMobile(student.mobileNumber)) {
        setSubmitError('Please provide a valid 10-digit Indian mobile number (e.g., 9876543210).');
        return false;
      }
      if (student.course === 'Other' && !student.courseOther.trim()) {
        setSubmitError('Please specify your course name.');
        return false;
      }
      if (student.branch === 'Other' && !student.branchOther.trim()) {
        setSubmitError('Please specify your branch/specialization.');
        return false;
      }

      // Direct to Payment! (Flat ₹10 All-Access Pass)
      setActiveStep(5);
      scrollToWizard();
      return true;
    }

    if (activeStep === 3) {
      // Validate team names for games set to 'team'
      for (const gameId of selectedGameIds) {
        const config = gameConfigs[gameId];
        if (config && config.participationType === 'team') {
          if (!config.teamName.trim()) {
            setSubmitError(`Please provide a Team Name for ${config.gameName}.`);
            return false;
          }
        }
      }
      setActiveStep(5); // Direct to Payment!
      scrollToWizard();
      return true;
    }

    if (activeStep === 4) {
      setActiveStep(5);
      scrollToWizard();
      return true;
    }

    return true;
  };

  const prevStep = () => {
    setSubmitError(null);
    if (activeStep === 5) {
      setActiveStep(2);
      scrollToWizard();
      return;
    }
    if (activeStep === 3) {
      setActiveStep(2);
      scrollToWizard();
      return;
    }
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
      scrollToWizard();
    }
  };

  const goToStep = (stepNumber: number) => {
    let target = stepNumber;
    if (target === 1) target = 2; // Under flat ₹10 pass, registration begins directly at student details
    if (target === 3 || target === 4) target = 5; // Fast-track directly to payment
    setSubmitError(null);
    setActiveStep(target);
    scrollToWizard();
  };

  const resetRegistration = () => {
    setActiveStep(2);
    setSelectedGameIds(gamesList.map(g => g.id));
    setStudent(initialStudent);
    setSubmissionResult(null);
    setSubmitError(null);
    scrollToWizard();
  };

  // Submit Registration API with network resilience
  const submitRegistration = async (utrNumber?: string, paymentMode: string = 'online_upi'): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Clean mobile number
    const cleanMobile = student.mobileNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0)/, '');
    const cleanUtr = utrNumber ? utrNumber.trim() : '';

    // Build payload matching backend Registration model
    const payload = {
      student: {
        fullName: student.fullName.trim(),
        mobileNumber: cleanMobile,
        rollNumber: student.rollNumber.trim(),
        course: student.course === 'Other' ? student.courseOther.trim() : student.course,
        branch: student.branch === 'Other' ? student.branchOther.trim() : student.branch,
        academicYear: student.academicYear,
        whatsAppConsent: student.whatsAppConsent
      },
      selectedGames: selectedGameIds.map(gameId => {
        const config = gameConfigs[gameId];
        const gameMeta = gamesList.find(g => g.id === gameId) || GAMES_DATA.find(g => g.id === gameId);
        const hasTeamName = Boolean(config?.teamName && config.teamName.trim());
        const isTeam = config?.participationType === 'team' && hasTeamName;
        return {
          gameId,
          gameName: gameMeta?.name || config?.gameName || gameId,
          participationType: isTeam ? 'team' : 'individual',
          teamName: isTeam ? config.teamName.trim() : '',
          teamMembers: isTeam ? (config.teamMembers || []).map(m => ({
            name: (m.name || '').trim(),
            roll: (m.roll || '').trim(),
            contact: (m.contact || '').trim()
          })) : []
        };
      }),
      paymentMode,
      paymentReference: cleanUtr
    };

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null) || {};

      if (!response.ok || !data.success) {
        const errorMsg = (Array.isArray(data.errors) && data.errors.length > 0)
          ? data.errors.join(' • ')
          : (data.error || data.message || 'Validation failed. Please verify your inputs.');
        const serverErr: any = new Error(errorMsg);
        serverErr.isServerError = true;
        throw serverErr;
      }

      const resData = data.data || {};
      const result: RegistrationSubmissionResult = {
        success: true,
        message: data.message || 'Registration successfully submitted!',
        registrationId: resData.registrationId || resData._id,
        registrationReference: resData.registrationReference || resData.registrationId,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        selectedGamesCount: selectedGameIds.length,
        totalAmount: totalFee,
        paymentStatus: resData.paymentStatus || (cleanUtr ? 'payment_verification_pending' : 'pending_desk_collection'),
        paymentReference: cleanUtr || '',
        submissionDate: new Date().toLocaleString('en-IN')
      };

      setSubmissionResult(result);
      setActiveStep(6);
      scrollToWizard();
      return true;
    } catch (err: any) {
      console.warn('Registration submission error:', err.message);

      // CRITICAL SECURITY FIX: Never generate offline fake passes for legitimate server validation/duplicate errors!
      if (err.isServerError) {
        setSubmitError(err.message || 'Submission error occurred. Please verify inputs or contact B5-408.');
        return false;
      }

      // ONLY if user is truly offline (no internet) or DNS failure occurred before touching server
      const isTrueOffline = !navigator.onLine || (err.name === 'TypeError' && err.message?.includes('fetch'));
      if (isTrueOffline) {
        // Enforce UTR requirement even in offline queue if payment mode is online UPI
        if (paymentMode === 'online_upi' && (!cleanUtr || cleanUtr.length < 10)) {
          setSubmitError('Offline mode requires a valid 12-digit UPI UTR number from your payment app.');
          return false;
        }

        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let rand = '';
        for (let i = 0; i < 6; i++) {
          rand += chars[Math.floor(Math.random() * chars.length)];
        }
        const offlineRegId = `SRMU-2026-${rand}`;
        const offlineResult: RegistrationSubmissionResult = {
          success: true,
          message: 'Registration queued offline! (Saved for SRMU B5-408 desk verification)',
          registrationId: offlineRegId,
          registrationReference: offlineRegId,
          studentName: student.fullName,
          rollNumber: student.rollNumber,
          selectedGamesCount: selectedGameIds.length,
          totalAmount: totalFee,
          paymentStatus: cleanUtr ? 'payment_verification_pending' : 'pending_desk_collection',
          paymentReference: cleanUtr || '',
          submissionDate: new Date().toLocaleString('en-IN')
        };

        try {
          const queue = JSON.parse(localStorage.getItem('srmu_carnival_registrations') || '[]');
          queue.push({ payload, result: offlineResult, timestamp: Date.now() });
          localStorage.setItem('srmu_carnival_registrations', JSON.stringify(queue));
        } catch (e) {}

        setSubmissionResult(offlineResult);
        setActiveStep(6);
        scrollToWizard();
        return true;
      }

      setSubmitError(err.message || 'Submission error occurred. Please verify inputs.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit post-submission UTR
  const submitPostUtr = async (utrNumber: string): Promise<boolean> => {
    if (!submissionResult?.registrationId) return false;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/registrations/${submissionResult.registrationId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentReference: utrNumber.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update payment reference.');
      }

      setSubmissionResult(prev => prev ? ({
        ...prev,
        paymentReference: utrNumber.trim(),
        paymentStatus: 'payment_verification_pending'
      }) : null);

      return true;
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to update UTR.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextValue = useMemo(() => ({
    activeStep,
    selectedGameIds,
    gamesList,
    gameConfigs,
    student,
    totalFee,
    isSubmitting,
    submitError,
    submissionResult,
    refreshGames: loadGamesFromApi,
    toggleGameSelection,
    setGameFormat,
    setTeamName,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    updateStudent,
    goToStep,
    nextStep,
    prevStep,
    resetRegistration,
    submitRegistration,
    submitPostUtr
  }), [
    activeStep,
    selectedGameIds,
    gamesList,
    gameConfigs,
    student,
    totalFee,
    isSubmitting,
    submitError,
    submissionResult,
    loadGamesFromApi
  ]);

  return (
    <RegistrationContext.Provider value={contextValue}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
