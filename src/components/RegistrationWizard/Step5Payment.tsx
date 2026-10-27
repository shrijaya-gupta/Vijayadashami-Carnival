import React, { useState, useEffect } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  Flame, 
  Smartphone, 
  User, 
  Phone, 
  GraduationCap,
  HelpCircle,
  Banknote,
  QrCode,
  Lock
} from 'lucide-react';

interface EventConfigState {
  upi_id?: string;
  upi_name?: string;
  qr_image_url?: string;
  is_qr_active?: boolean;
  require_utr?: boolean;
  pass_fee?: number;
  registration_open?: boolean;
  payment_mode?: string;
  announcement?: string;
}

export const Step5Payment: React.FC = () => {
  const { totalFee, student, submitRegistration, isSubmitting, submitError, prevStep } = useRegistration();
  
  const [paymentMode, setPaymentMode] = useState<'online_upi' | 'cash_desk'>('online_upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [localUtrError, setLocalUtrError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showUtrHelp, setShowUtrHelp] = useState(false);
  const [config, setConfig] = useState<EventConfigState | null>(null);

  useEffect(() => {
    fetch('/api/config/payment-qr', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setConfig(json.data);
          if (json.data.payment_mode === 'cash_only') {
            setPaymentMode('cash_desk');
          }
        }
      })
      .catch(() => {});
  }, []);

  const receiverUpi = config?.upi_id || 'guptashrijaya-1@oksbi';
  const receiverName = config?.upi_name || 'Shrijaya Gupta (SRMU B5-408 Carnival Desk)';
  const qrImage = config?.qr_image_url || '/assets/official-upi-qr.jpg';
  const isRegOpen = config?.registration_open !== false;
  const allowCash = config?.payment_mode === 'both';
  const requireUtr = config?.require_utr !== false;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(receiverUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const cleanUtrInput = (raw: string) => {
    return raw
      .replace(/^(utr|txn|ref|txnid|refno|upi|rrn)[\s\:\-\.]*/i, '')
      .replace(/[\s\-]/g, '')
      .slice(0, 22);
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanUtrInput(e.target.value);
    setUtrNumber(cleaned);
    if (localUtrError) setLocalUtrError(null);
  };

  const validateUtrStrict = (utr: string): { isValid: boolean; error?: string } => {
    if (!utr || !utr.trim()) {
      return { isValid: false, error: 'Please enter your 12-digit UPI UTR number from your payment app before confirming.' };
    }

    const trimmed = cleanUtrInput(utr);

    // Reject obvious placeholders & dummy sequences
    const dummyPatterns = [
      /^0{6,}$/,
      /^1{6,}$/,
      /^(\d)\1{7,}$/,
      /^(12345678|01234567|98765432)/i,
      /^(test|dummy|demo|fake|na|none|null|nil)$/i
    ];

    for (const pattern of dummyPatterns) {
      if (pattern.test(trimmed)) {
        return { isValid: false, error: 'Please enter a genuine UPI transaction reference number from your payment app, not a dummy or sequential value.' };
      }
    }

    const is12Digit = /^\d{12}$/.test(trimmed);
    const isBankRef = /^[A-Za-z0-9]{10,22}$/.test(trimmed);

    if (!is12Digit && !isBankRef) {
      return { isValid: false, error: 'UPI UTR must be exactly 12 numeric digits (e.g. 429810394821) or a valid 10-22 character bank reference code.' };
    }

    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalUtrError(null);

    if (!isRegOpen) {
      setLocalUtrError('Registrations are currently closed by the organizers. Please visit the B5-408 desk.');
      return;
    }

    if (paymentMode === 'online_upi' && requireUtr) {
      const check = validateUtrStrict(utrNumber);
      if (!check.isValid) {
        setLocalUtrError(check.error || 'Invalid UPI UTR reference.');
        return;
      }
      await submitRegistration(cleanUtrInput(utrNumber), 'online_upi');
    } else if (paymentMode === 'cash_desk') {
      await submitRegistration('CASH_AT_DESK', 'cash_desk');
    } else {
      await submitRegistration(cleanUtrInput(utrNumber), 'online_upi');
    }
  };

  const utrClean = cleanUtrInput(utrNumber);
  const isUtrComplete = utrClean.length === 12;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-white">
      {/* Header */}
      <div className="pb-3 border-b border-white/10 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-xl font-bold font-heading text-white tracking-wide">
            Pass Payment &amp; UTR Verification
          </h3>
          <span className="text-xs font-bold text-amber-300 bg-black/50 px-2.5 py-1 rounded-full border border-[#D4AF37]/40 shadow-xs shrink-0 whitespace-nowrap">
            Fee Due: ₹{totalFee}
          </span>
        </div>
        <p className="text-stone-400 text-xs">
          Complete payment via UPI QR code and enter your 12-digit transaction UTR number to secure your entry pass.
        </p>
      </div>

      {/* Registration Closed Warning */}
      {!isRegOpen && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="block font-bold">Online Registrations Temporarily Closed</strong>
            <span>Online pass submissions are currently closed by festival organizers. Please visit the SRMU B5-408 carnival helpdesk for on-spot assistance.</span>
          </div>
        </div>
      )}

      {/* Global Submit or Local Validation Error */}
      {(submitError || localUtrError) && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-md animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span className="leading-relaxed">{localUtrError || submitError}</span>
        </div>
      )}

      {/* Quick Summary of Registered Participant */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#24060F] to-[#160309] border border-[#D4AF37]/35 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#E5C158]/15 border border-[#E5C158]/35 flex items-center justify-center text-[#FFE28A] shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>{student.fullName || 'Participant'}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {student.course} {student.academicYear ? `• ${student.academicYear}` : ''}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 flex items-center gap-2.5 mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-400" />
                  {student.mobileNumber || 'Phone provided'}
                </span>
                {student.branch && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-amber-400" />
                    {student.branch}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">All-Access Carnival Pass</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300">₹{totalFee}.00 Flat Fee</span>
          </div>
        </div>
      </div>

      {/* Payment Mode Selector (Only shown if Cash at Desk is enabled by Admin) */}
      {allowCash && (
        <div className="p-1 rounded-xl bg-black/40 border border-white/10 grid grid-cols-2 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPaymentMode('online_upi')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              paymentMode === 'online_upi'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-400/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Pay Online via UPI (Instant Pass)</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('cash_desk')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              paymentMode === 'cash_desk'
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border border-emerald-400/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Pay Cash at Carnival Desk</span>
          </button>
        </div>
      )}

      {/* Main Payment Section */}
      {paymentMode === 'online_upi' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
          
          {/* QR Code & Payee Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#20050E]/90 border border-[#D4AF37]/35 shadow-sm flex flex-col items-center text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E5C158] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Official Carnival UPI QR
            </span>

            {/* Official QR Container */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl p-2 bg-white border-2 border-[#D4AF37] shadow-xl flex items-center justify-center overflow-hidden">
              <img 
                src={qrImage} 
                alt="Official Carnival UPI QR Code" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="w-full space-y-2.5 text-xs">
              {/* 1-Click Mobile UPI App Launch (GPay, PhonePe, Paytm, BHIM) */}
              <a
                href={`upi://pay?pa=${encodeURIComponent(receiverUpi)}&pn=${encodeURIComponent(receiverName)}&am=${totalFee}&cu=INR&tn=SRMU%20Carnival%20Pass`}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 border border-emerald-400 shadow-md shadow-emerald-950/40 active:scale-95 transition-all text-center"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Pay ₹{totalFee} via UPI App (PhonePe / GPay)</span>
              </a>

              {/* UPI ID with 1-Click Copy */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200">
                <span className="font-semibold text-stone-400">UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-200 text-xs sm:text-sm">{receiverUpi}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 rounded hover:bg-white/10 text-amber-300 transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-stone-400">
                Payee: <strong className="text-stone-300">{receiverName}</strong>
              </div>
            </div>
          </div>

          {/* Amount & Strict UTR Number Input */}
          <div className="space-y-4">
            
            {/* Fee Breakdown Pill */}
            <div className="p-4 rounded-2xl bg-[#20050E]/90 border border-[#D4AF37]/35 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>Pass Type:</span>
                <span className="font-bold text-emerald-400">All-Access Carnival Pass</span>
              </div>
              <div className="flex justify-between items-center text-stone-300">
                <span>Pass Fee:</span>
                <span className="font-bold text-amber-300">₹{totalFee}.00</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Amount Remitted:</span>
                <span className="text-xl font-heading text-amber-300">₹{totalFee}.00</span>
              </div>
            </div>

            {/* UTR Input Form Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#1A030A] border border-[#D4AF37]/45 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <label htmlFor="utrInput" className="block text-xs font-bold text-amber-200 uppercase tracking-wider">
                  UPI Reference Number (UTR / Ref ID) <span className="text-rose-400">*</span>
                </label>

                {/* Character Counter */}
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                  isUtrComplete 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-black/40 text-stone-400 border border-white/10'
                }`}>
                  {utrClean.length} / 12 digits
                </span>
              </div>

              <div className="relative">
                <input
                  id="utrInput"
                  type="text"
                  required
                  autoComplete="off"
                  maxLength={22}
                  placeholder="e.g. 429810394821"
                  value={utrNumber}
                  onChange={handleUtrChange}
                  className={`w-full px-4 py-3 rounded-xl border text-white placeholder-stone-500 text-sm font-mono tracking-wider focus:outline-hidden transition-all ${
                    isUtrComplete 
                      ? 'border-emerald-500/70 bg-emerald-950/20 focus:ring-1 focus:ring-emerald-400' 
                      : 'border-[#D4AF37]/50 bg-black/60 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]'
                  }`}
                />

                {isUtrComplete && (
                  <div className="absolute right-3.5 top-3.5 text-emerald-400">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">
                  Required: 12-digit numeric reference generated after UPI payment
                </span>

                <button
                  type="button"
                  onClick={() => setShowUtrHelp(!showUtrHelp)}
                  className="text-amber-300 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Where to find UTR?</span>
                </button>
              </div>

              {/* Collapsible Where to find UTR helper */}
              {showUtrHelp && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-stone-300 space-y-2 animate-in fade-in">
                  <div className="font-bold text-amber-200">How to find your 12-digit UPI UTR:</div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-300">
                    <li><strong>PhonePe:</strong> Open History &rarr; Click Payment &rarr; Copy <strong>UTR</strong> (12 digits)</li>
                    <li><strong>Google Pay:</strong> Tap Transaction &rarr; Copy <strong>UPI Transaction ID</strong> (12 digits)</li>
                    <li><strong>Paytm:</strong> Open Passbook/History &rarr; Copy <strong>UPI Ref No.</strong> (12 digits)</li>
                    <li><strong>BHIM:</strong> Tap Transaction &rarr; Copy <strong>RRN</strong> (12 digits)</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Security Guarantee Notice */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Each UTR is strictly verified and mapped to your registration pass to prevent duplicate entries and unauthorized claims.
              </span>
            </div>

          </div>

        </div>
      ) : (
        /* Cash at Helpdesk Alternative (Only when allowed by admin) */
        <div className="p-5 sm:p-6 rounded-2xl bg-[#1C050E] border border-emerald-500/40 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Carnival Desk Cash Remittance</h4>
              <p className="text-xs text-stone-400">SRMU Campus, Building B5 - Room 408</p>
            </div>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            Your registration will be reserved with status <strong className="text-amber-300">Payment Pending (Desk Collection)</strong>.
            You must bring the registration fee of <strong className="text-white">₹{totalFee}.00</strong> in cash to the B5-408 registration desk to collect your verified entry stamp and carnival kit.
          </p>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Games participation is unlocked only after physical cash verification at the desk.</span>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={prevStep}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-stone-300 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Review</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isRegOpen}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm sm:text-base bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/70 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-[#E5C158]/70 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying &amp; Submitting...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>
                {paymentMode === 'cash_desk'
                  ? `Reserve Pass (Pay ₹${totalFee} Cash at B5-408)`
                  : `Submit Registration & UTR (₹${totalFee})`
                }
              </span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
