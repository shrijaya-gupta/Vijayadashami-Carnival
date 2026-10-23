/**
 * Authoritative Event & Payment Configuration — Vijayadashami Carnival
 * 
 * Provides centralized settings for event identity, registration deadline,
 * dynamic fee policies, online payment QR integration, and official WhatsApp group.
 * 
 * IMPORTANT CONSTRAINTS:
 * - Do not invent payment credentials, UPI IDs, or gateway secrets.
 * - Do not invent WhatsApp invite links.
 * - If unconfigured, explicit placeholders are rendered for the organizers.
 */

const EVENT_CONFIG = {
  eventName: 'Vijayadashami Carnival',
  institution: 'SRMU',
  venue: 'SRMU Campus, B5',
  date: 'Thursday, 29 October 2026',
  time: '11:00 AM',
  reportingTime: '10:45 AM',
  
  // Confirmed Registration Deadline
  registrationDeadline: 'Monday, 26 October 2026',
  registrationDeadlineNotice: 'Students are requested to complete their registration and online payment by the registration deadline.',
  
  // Registration Fee Policy
  feePerGame: 5,
  feeCurrency: 'INR',
  
  // Online Payment Configuration
  payment: {
    // True only if organizer explicitly configures QR image or gateway in environment
    isConfigured: Boolean(process.env.ORGANIZER_PAYMENT_QR_URL || process.env.PAYMENT_GATEWAY_KEY),
    qrImageUrl: process.env.ORGANIZER_PAYMENT_QR_URL || null,
    merchantName: process.env.ORGANIZER_MERCHANT_NAME || 'SRMU Vijayadashami Carnival Organizer',
    upiId: process.env.ORGANIZER_UPI_ID || null, // Organizer-provided only
    instructions: 'Scan the organizer-approved QR code using any supported UPI app (GPay, PhonePe, Paytm, BHIM) and remit the exact calculated registration fee.',
    placeholderNotice: 'Online payment integration is awaiting official organizer configuration. Once the organizing committee provides the official merchant QR code or gateway credentials, direct online scanning will be active. Please check with the registration desk.'
  },
  
  // Official WhatsApp Group Announcement
  whatsapp: {
    sectionTitle: 'Join the Official Event WhatsApp Group',
    groupName: 'SRMU Vijayadashami Carnivals',
    supportingText: 'Registered participants will be added to the event\'s WhatsApp group for important announcements, coordination and event-related updates.',
    // Optional organizer-provided group invitation URL
    inviteUrl: process.env.WHATSAPP_GROUP_INVITE_URL || null,
    unconfiguredNotice: 'The official WhatsApp group invitation link will be shared directly by the event organizers with registered participants following registration verification.'
  },

  // Exciting Gifts, Rewards & Participation Certificates
  rewardsAndCertificates: {
    sectionTitle: 'Exciting Gifts, Rewards & Participation Certificates',
    publicText: 'Participate in the Vijayadashami Carnival, enjoy exciting games and activities, and stand a chance to receive gifts and rewards. Participation certificates will also be provided to participants.'
  }
};

module.exports = EVENT_CONFIG;
