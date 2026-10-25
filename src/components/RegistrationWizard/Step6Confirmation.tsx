import React, { useEffect, useState } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
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
  Trophy,
  Printer
} from 'lucide-react';

export const Step6Confirmation: React.FC = () => {
  const { submissionResult, submitPostUtr, isSubmitting, submitError, resetRegistration } = useRegistration();
  const [postUtr, setPostUtr] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const regId = submissionResult?.registrationReference || submissionResult?.registrationId || 'SRMU-VJ-PENDING';

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

    // Generate scannable QR code for event marshals at B5-408
    if (regId) {
      QRCode.toDataURL(regId, {
        width: 140,
        margin: 1,
        color: {
          dark: '#120207',
          light: '#FFFDF9'
        }
      })
      .then((url: string) => setQrDataUrl(url))
      .catch(() => {});
    }
  }, [regId]);

  if (!submissionResult) return null;

  const isPaid = submissionResult.paymentStatus === 'paid';
  const isPendingVerification = submissionResult.paymentStatus === 'payment_verification_pending';

  const handleCopy = () => {
    navigator.clipboard.writeText(regId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrintPass = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const siteUrl = window.location.origin;
    const text = encodeURIComponent(
      `🎯 *VIJAYADASHAMI CARNIVAL 2026 — Campus Games & Competitions!*\n\n` +
      `🔥 Thrilling Games & Challenges | Cash Prizes & Exciting Rewards\n` +
      `🎟️ All-Access Pass: Only ₹10 (All Events Included)\n` +
      `📅 Date: Thursday, 29 October 2026 • 11:00 AM\n` +
      `📍 Venue: SRMU B5-408\n\n` +
      `🎉 I have registered! (Registration ID: ${regId} — ${submissionResult.studentName})\n\n` +
      `👉 Register now & check out the festival:\n${siteUrl}`
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

      {/* Official Carnival WhatsApp Group VIP Call-to-Action */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] text-white border-2 border-emerald-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left animate-in fade-in-50">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
            <span>Official Carnival Community</span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-white">
            Join Official Carnival WhatsApp Group
          </h4>
          <p className="text-xs text-emerald-50 max-w-md leading-relaxed">
            Get instant match schedules, live heats call-ups, team pairings, and winner announcements!
          </p>
        </div>
        <a
          href="https://chat.whatsapp.com/Ev1kiwPGzrDFvopit0B12l"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 rounded-full font-black text-xs sm:text-sm bg-white text-emerald-900 hover:bg-emerald-50 shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border border-emerald-200 cursor-pointer whitespace-nowrap"
        >
          <Share2 className="w-4 h-4 text-emerald-700" />
          <span>Join WhatsApp Group &rarr;</span>
        </a>
      </div>

      {/* Confirmed Registration Digital Pass Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#24060F] to-[#120207] border-2 border-[#D4AF37]/60 shadow-xl text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 gap-4 text-xs flex-1 w-full">
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
              <span className="font-bold text-white">B5-408 • 11:00 AM</span>
            </div>
          </div>

          {/* Entry Verification QR Code */}
          {qrDataUrl && (
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <img src={qrDataUrl} alt="Entry Pass QR" className="w-20 h-20 rounded-lg shadow-sm" />
              <span className="text-[9px] text-amber-300/80 font-semibold mt-1">Scan at B5-408</span>
            </div>
          )}
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

      {/* Share & Print Pass Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handlePrintPass}
          className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white flex items-center gap-2 shadow-md transition-all cursor-pointer border border-[#FFE28A]/60"
        >
          <Printer className="w-4 h-4" />
          <span>Save / Print Entry Pass</span>
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share on WhatsApp</span>
        </button>
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
