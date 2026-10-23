import React, { useEffect, useState } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  Copy, 
  Check, 
  Share2, 
  RotateCcw, 
  Clock, 
  ExternalLink,
  Award,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

export const Step6Confirmation: React.FC = () => {
  const { submissionResult, submitPostUtr, isSubmitting, submitError, resetRegistration } = useRegistration();
  const [postUtr, setPostUtr] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on mounting Step 6
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#801823', '#D4AF37', '#FF9933', '#10B981']
      });
    } catch (e) {
      // Graceful fallback
    }
  }, []);

  if (!submissionResult) return null;

  const regId = submissionResult.registrationReference || submissionResult.registrationId || 'SRMU-VJ-PENDING';
  const isPaid = submissionResult.paymentStatus === 'paid';
  const isPendingVerification = submissionResult.paymentStatus === 'payment_verification_pending';

  const handleCopy = () => {
    navigator.clipboard.writeText(regId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 I have registered for the Vijayadashami Carnival at SRMU B5!\n\n` +
      `Registration ID: ${regId}\n` +
      `Participant: ${submissionResult.studentName}\n` +
      `Date: Thursday, 29 October 2026 • 11:00 AM\n` +
      `Venue: SRMU Campus, B5 Building Grounds\n\n` +
      `Join the carnival!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePostUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUtr.trim()) return;
    const ok = await submitPostUtr(postUtr);
    if (ok) {
      setUtrSuccess(true);
      setPostUtr('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center text-white">
      
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg border-2 border-emerald-400 animate-in zoom-in-95">
        <CheckCircle className="w-8 h-8 stroke-[2.5]" />
      </div>

      <div>
        <h3 className="text-2xl sm:text-3xl font-black font-heading text-white">
          Registration Confirmed!
        </h3>
        <p className="text-xs sm:text-sm text-stone-300 mt-1">
          Thank you, <strong className="text-amber-300 font-bold">{submissionResult.studentName}</strong>. Your entry for the Vijayadashami Carnival has been recorded.
        </p>
      </div>

      {/* Confirmed Registration Reference Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#24060F] to-[#120207] border-2 border-[#D4AF37]/60 shadow-xl text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Official Registration Reference
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#FFE28A]">
                {regId}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-amber-300 border border-white/10 transition-colors cursor-pointer"
                title="Copy Registration ID"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Payment Status Pill */}
          <div className="self-start sm:self-auto">
            {isPaid ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400">
                Payment Verified
              </span>
            ) : isPendingVerification ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Verification Pending
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400">
                Desk Payment Pending
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-stone-400 block">Roll Number</span>
            <span className="font-bold text-white">{submissionResult.rollNumber}</span>
          </div>
          <div>
            <span className="text-stone-400 block">Total Entry Fee</span>
            <span className="font-bold text-amber-300">₹{submissionResult.totalAmount}.00</span>
          </div>
          <div>
            <span className="text-stone-400 block">Selected Games</span>
            <span className="font-bold text-white">{submissionResult.selectedGamesCount} Games</span>
          </div>
          <div>
            <span className="text-stone-400 block">Venue & Time</span>
            <span className="font-bold text-white">B5 Grounds • 11:00 AM</span>
          </div>
        </div>
      </div>

      {/* Post-submission UTR update if pending */}
      {!isPaid && (
        <div className="p-4 rounded-2xl bg-black/40 border border-[#D4AF37]/35 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Submit or Update Payment UTR
            </h4>
          </div>
          <p className="text-xs text-stone-300">
            If you completed your UPI transfer after submitting, enter your 12-digit transaction reference number below for instant audit pairing.
          </p>

          {utrSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> UTR reference successfully submitted for desk verification!
            </div>
          )}

          {submitError && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {submitError}
            </div>
          )}

          <form onSubmit={handlePostUtrSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., 429810394821"
              value={postUtr}
              onChange={(e) => setPostUtr(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-[#D4AF37]/30 bg-black/50 text-white text-xs font-mono"
            />
            <button
              type="submit"
              disabled={isSubmitting || !postUtr.trim()}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white hover:from-[#9F1239] hover:to-[#B91C1C] border border-[#E5C158]/60 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit UTR'}
            </button>
          </form>
        </div>
      )}

      {/* Share & Certificate Links */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share on WhatsApp</span>
        </button>

        <a
          href="/verify.html"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-black/50 hover:bg-black/80 text-amber-200 hover:text-white flex items-center gap-2 border border-[#D4AF37]/50 transition-colors"
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Certificate Verification Portal</span>
          <ExternalLink className="w-3 h-3 text-stone-400" />
        </a>
      </div>

      {/* Reset button */}
      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={resetRegistration}
          className="text-xs font-semibold text-stone-400 hover:text-white flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Register Another Participant</span>
        </button>
      </div>

    </div>
  );
};
