import React, { useState, useEffect } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { GAMES_DATA } from '../../data/games';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  HelpCircle, 
  Copy, 
  Check, 
  Flame, 
  QrCode,
  Smartphone,
  User,
  Phone,
  GraduationCap,
  Trophy
} from 'lucide-react';

export const Step5Payment: React.FC = () => {
  const { totalFee, selectedGameIds, gameConfigs, student, submitRegistration, isSubmitting, submitError, prevStep } = useRegistration();
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrConfig, setQrConfig] = useState<{ qr_image_url?: string; is_qr_active?: boolean; upi_id?: string } | null>(null);

  const hasTeamGame = selectedGameIds.some(id => {
    const g = GAMES_DATA.find(item => item.id === id);
    return g && g.participationType.toLowerCase().includes('team');
  });

  const selectedGamesList = selectedGameIds.map(id => {
    const found = GAMES_DATA.find(g => g.id === id);
    const config = gameConfigs[id];
    return {
      id,
      title: found?.name || id,
      format: config?.participationType === 'team' ? 'Team Squad' : 'Individual',
      fee: 5
    };
  });

  useEffect(() => {
    fetch('/api/config/payment-qr', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setQrConfig(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const receiverUpi = qrConfig?.upi_id || 'srmu.carnival@upi';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(receiverUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRegistration(utrNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
          Step 5: Registration Fee & Payment Verification
        </h3>
        <p className="text-xs sm:text-sm text-stone-300 mt-1">
          Review your entry, scan the official carnival UPI QR code, and submit your registration.
        </p>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Quick Summary Pill of Registered Participant */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#24060F] to-[#160309] border border-[#D4AF37]/35 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E5C158]/15 border border-[#E5C158]/35 flex items-center justify-center text-[#FFE28A] shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{student.fullName || 'Participant'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {student.course} • {student.academicYear}
                </span>
              </div>
              <div className="text-xs text-stone-400 flex items-center gap-3 mt-0.5">
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
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">Access Pass</span>
            <span className="text-sm font-bold text-amber-300">All 6 Games Included (₹{totalFee})</span>
          </div>
        </div>

        {/* Selected Games Badges */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
          {selectedGamesList.map(game => (
            <div 
              key={game.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-[#D4AF37]/25 text-xs text-stone-200"
            >
              <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="font-semibold text-white">{game.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-emerald-300 font-medium">
                Included in ₹10 Pass
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Notice Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#2A0812] border border-[#D4AF37]/40 text-amber-200 text-xs space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#FFE28A]">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Carnival Helpdesk & Payment Policy Notice
        </div>
        <p className="leading-relaxed text-stone-300">
          The event uses a manual audit verification workflow at the Building B5-408 Helpdesk. You may complete your UPI payment online and enter the 12-digit UTR reference below, or register now and pay cash at the B5-408 registration counter on carnival day.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
        
        {/* QR Code & Payment Instructions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#20050E]/90 border border-[#D4AF37]/35 shadow-sm flex flex-col items-center text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5C158] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Official UPI Payment QR
          </span>

          {/* QR Container: Displays custom uploaded image, or elegant blank placeholder for admin upload */}
          {qrConfig?.qr_image_url && qrConfig.is_qr_active ? (
            <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl p-2.5 bg-white border-2 border-[#D4AF37] shadow-xl flex items-center justify-center overflow-hidden">
              <img 
                src={qrConfig.qr_image_url} 
                alt="Official UPI Payment QR" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl p-4 bg-black/40 border-2 border-dashed border-[#D4AF37]/50 shadow-inner flex flex-col items-center justify-center text-center">
              <QrCode className="w-10 h-10 text-amber-400/60 mb-2 stroke-[1.5]" />
              <span className="text-xs font-bold text-amber-200">QR Code Space</span>
              <span className="text-[10px] text-stone-400 mt-1 leading-tight">Official Carnival QR will be uploaded by Desk Admin</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold mt-2 border border-amber-500/30">
                Pay via UPI ID below or Cash at B5-408
              </span>
            </div>
          )}

          <div className="w-full space-y-2.5 text-xs">
            {/* 1-Click Mobile UPI App Launch (GPay, PhonePe, Paytm, BHIM) */}
            <a
              href={`upi://pay?pa=${encodeURIComponent(receiverUpi)}&pn=SRMU%20Carnival%20B5-408&am=${totalFee}&cu=INR&tn=Vijayadashami%20Carnival%20Entry`}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 border border-emerald-400 shadow-md shadow-emerald-950/40 active:scale-95 transition-all text-center"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pay ₹{totalFee} via UPI App (PhonePe / GPay)</span>
            </a>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 text-stone-200">
              <span className="font-semibold text-stone-400">UPI ID:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-200">{receiverUpi}</span>
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

            <p className="text-[11px] text-stone-400">
              Scan with Google Pay, PhonePe, Paytm, or BHIM UPI
            </p>
          </div>
        </div>

        {/* Amount & UTR Entry */}
        <div className="space-y-4">
          {/* Fee Summary Pill */}
          <div className="p-4 rounded-2xl bg-[#20050E]/90 border border-[#D4AF37]/35 space-y-2 text-xs">
            <div className="flex justify-between items-center text-stone-300">
              <span>Pass Type:</span>
              <span className="font-bold text-emerald-400">All-Access Carnival Pass</span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span>Included Activities:</span>
              <span className="font-bold text-white">All 6 Games</span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span>Registration Fee:</span>
              <span className="font-bold text-amber-300">Flat ₹{totalFee}.00</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
              <span className="text-white">Total Amount Due:</span>
              <span className="text-xl font-heading text-amber-300">
                ₹{totalFee}.00
              </span>
            </div>
          </div>

          {/* UTR Reference Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider">
              UPI Transaction Reference (UTR / Ref ID)
            </label>
            <input
              type="text"
              placeholder="e.g., 429810394821 (12 digits)"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white placeholder-stone-500 text-sm font-mono focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden"
            />
            <p className="text-[11px] text-stone-400">
              Leave blank if you will pay cash at the SRMU B5-408 carnival helpdesk.
            </p>
          </div>

          {/* Security & Verification Guarantee */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your registration reference is generated immediately upon submission. All payments are verified securely by event organizers.
            </span>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={prevStep}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-stone-300 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Details</span>
          <span className="sr-only">Back to Review</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm sm:text-base bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/70 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-[#E5C158]/70 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting Registration...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Confirm & Submit Registration (₹{totalFee})</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
