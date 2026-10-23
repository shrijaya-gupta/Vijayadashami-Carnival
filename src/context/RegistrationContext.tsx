import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  SelectedGameConfig, 
  StudentDetails, 
  ParticipationFormat, 
  TeamMember, 
  RegistrationSubmissionResult 
} from '../types';
import { GAMES_DATA } from '../data/games';

interface RegistrationContextType {
  activeStep: number;
  selectedGameIds: string[];
  gameConfigs: Record<string, SelectedGameConfig>;
  student: StudentDetails;
  totalFee: number;
  isSubmitting: boolean;
  submitError: string | null;
  submissionResult: RegistrationSubmissionResult | null;
  
  // Actions
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
  submitRegistration: (utrNumber?: string) => Promise<boolean>;
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
  academicYear: '1st Year',
  whatsAppConsent: true,
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>(['lemon-race']);
  
  // Initialize game configs
  const [gameConfigs, setGameConfigs] = useState<Record<string, SelectedGameConfig>>(() => {
    const configs: Record<string, SelectedGameConfig> = {};
    GAMES_DATA.forEach(game => {
      configs[game.id] = {
        gameId: game.id,
        gameName: game.name,
        participationType: game.participationType.toLowerCase().includes('team') ? 'team' : 'individual',
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

  // Authoritative Fee calculation: Strictly count * 5
  const totalFee = selectedGameIds.length * 5;

  // Toggle game selection
  const toggleGameSelection = (gameId: string) => {
    setSelectedGameIds(prev => {
      if (prev.includes(gameId)) {
        if (prev.length <= 1) {
          alert('You must choose at least 1 game to participate in the carnival.');
          return prev;
        }
        return prev.filter(id => id !== gameId);
      } else {
        if (prev.length >= 6) {
          alert('Maximum 6 games can be selected.');
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
    setGameConfigs(prev => {
      const current = prev[gameId];
      if (current.teamMembers.length >= 10) {
        alert('Maximum team members reached.');
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
      if (!student.rollNumber.trim()) {
        setSubmitError('Please enter your university roll number.');
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
      setActiveStep(3);
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
      setActiveStep(4);
      return true;
    }

    if (activeStep === 4) {
      setActiveStep(5);
      return true;
    }

    return true;
  };

  const prevStep = () => {
    setSubmitError(null);
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  const goToStep = (stepNumber: number) => {
    if (stepNumber < activeStep || stepNumber === 1) {
      setSubmitError(null);
      setActiveStep(stepNumber);
    }
  };

  const resetRegistration = () => {
    setActiveStep(1);
    setSelectedGameIds(['lemon-race']);
    setStudent(initialStudent);
    setSubmissionResult(null);
    setSubmitError(null);
  };

  // Submit Registration API
  const submitRegistration = async (utrNumber?: string): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean mobile number
      const cleanMobile = student.mobileNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0)/, '');

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
          const gameMeta = GAMES_DATA.find(g => g.id === gameId);
          return {
            gameId,
            gameName: gameMeta?.name || config.gameName,
            participationType: config.participationType,
            teamName: config.participationType === 'team' ? config.teamName.trim() : '',
            teamMembers: config.participationType === 'team' ? config.teamMembers.map(m => ({
              name: m.name.trim(),
              roll: m.roll.trim(),
              contact: m.contact.trim()
            })) : []
          };
        }),
        paymentReference: utrNumber ? utrNumber.trim() : ''
      };

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to submit registration. Please check inputs.');
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
        paymentStatus: resData.paymentStatus || (utrNumber ? 'payment_verification_pending' : 'payment_pending'),
        paymentReference: utrNumber || '',
        submissionDate: new Date().toLocaleString('en-IN')
      };

      setSubmissionResult(result);
      setActiveStep(6);
      return true;
    } catch (err: any) {
      console.error('Registration submission error:', err);
      setSubmitError(err.message || 'Network error occurred. Please verify backend connection.');
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

  return (
    <RegistrationContext.Provider
      value={{
        activeStep,
        selectedGameIds,
        gameConfigs,
        student,
        totalFee,
        isSubmitting,
        submitError,
        submissionResult,
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
      }}
    >
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
