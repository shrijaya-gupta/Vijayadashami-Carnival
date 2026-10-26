export type ParticipationFormat = 'individual' | 'team';

export interface Game {
  id: string;
  name: string;
  category: string;
  participationType: string;
  shortDescription: string;
  description: string;
  objective: string;
  approvalStatus: string;
  registrationFee: string;
  suggestedTeamSize: string;
  suggestedDuration: string;
  procedure: string[];
  proposedRules: string[];
  materials: string;
  winningCriteria: string;
  safetyNotes: string[];
  iconName?: string;
}

export interface TeamMember {
  name: string;
  roll: string;
  contact: string;
}

export interface SelectedGameConfig {
  gameId: string;
  gameName: string;
  participationType: ParticipationFormat;
  teamName: string;
  teamMembers: TeamMember[];
}

export interface StudentDetails {
  fullName: string;
  mobileNumber: string;
  rollNumber: string;
  course: string;
  courseOther: string;
  branch: string;
  branchOther: string;
  academicYear: string;
  whatsAppConsent: boolean;
}

export type PaymentStatus = 
  | 'payment_pending' 
  | 'payment_verification_pending' 
  | 'paid' 
  | 'payment_failed';

export interface RegistrationSubmissionResult {
  success: boolean;
  message: string;
  registrationId?: string;
  registrationReference?: string;
  studentName?: string;
  rollNumber?: string;
  selectedGamesCount?: number;
  totalAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  submissionDate?: string;
  error?: string;
}
