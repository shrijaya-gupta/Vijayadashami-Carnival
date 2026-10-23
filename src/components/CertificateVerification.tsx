import React, { useState, useEffect } from 'react';
import { CertificateVerificationResult } from '../types';
import { 
  Award, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Download
} from 'lucide-react';

export const CertificateVerification: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);

  // Check URL query parameters for ?token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setTokenInput(urlToken);
      verifyToken(urlToken);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/certificates/verify/${encodeURIComponent(cleanToken)}`);
      const data = await response.json();

      if (response.ok && data.success && (data.certificate || data.data)) {
        const cert = data.certificate || data.data;
        setResult({
          valid: true,
          certificate: {
            certificateId: cert.certificateId || cleanToken,
            studentName: cert.participantName || cert.studentName || 'Participant',
            rollNumber: cert.rollNumber || 'Verified Registration Record',
            course: cert.course || cert.eventName || 'Vijayadashami Carnival',
            branch: cert.branch || (Array.isArray(cert.gamesParticipated) ? cert.gamesParticipated.join(', ') : 'Event Activities'),
            academicYear: cert.academicYear || '2026',
            issueDate: cert.eventDate || cert.issueDate || 'October 2026',
            verificationToken: cert.verificationToken || cleanToken,
            verifiedStatus: true
          }
        });
      } else {
        setResult({
          valid: false,
          error: data.message || 'No valid certificate found for the provided identifier.'
        });
      }
    } catch (err: any) {
      setResult({
        valid: false,
        error: 'Network connection failed while verifying certificate. Ensure backend is running.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(tokenInput);
  };

  return (
    <section id="verify" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/50 shadow-md">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Public Verification Registry</span>
        </div>
        
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-decorative tracking-[0.02em] text-white">
          Verify Event Certificate
        </h2>

        {/* Golden Lotus Ornament */}
        <div className="pt-0.5 flex items-center justify-center gap-2.5">
          <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/80" />
          <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D4AF37] drop-shadow-xs">
            <path d="M18 1C15 6 9 9 3 9C6 11 12 11 16 7L18 15L20 7C24 11 30 11 33 9C27 9 21 6 18 1Z" fill="#D4AF37" opacity="0.9"/>
            <circle cx="18" cy="4" r="1.5" fill="#FFE28A" />
            <circle cx="12" cy="8" r="1" fill="#D4AF37" />
            <circle cx="24" cy="8" r="1" fill="#D4AF37" />
          </svg>
          <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/80" />
        </div>

        <p className="text-xs sm:text-sm text-stone-300">
          Enter the unique certificate identifier or scan the QR code printed on the physical or digital certificate.
        </p>
      </div>

      {/* Search Input Form */}
      <div className="bg-gradient-to-b from-[#1C050E]/95 via-[#14030A]/95 to-[#0E0207]/95 p-5 sm:p-7 rounded-3xl border border-[#D4AF37]/45 shadow-2xl backdrop-blur-xl mb-8">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              required
              placeholder="e.g., SRMU-CERT-2026-XXXX or verification token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white placeholder-stone-500 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-rose-950/60 border border-[#E5C158]/70 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-amber-300" />}
            <span>Verify Authenticity</span>
          </button>
        </form>
      </div>

      {/* Result Display */}
      {result && (
        <div className="animate-in fade-in duration-300">
          {result.valid && result.certificate ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1A040B] to-[#0D0206] border-2 border-emerald-400 shadow-2xl shadow-emerald-950/40 space-y-6">
              
              {/* Authenticity Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      Authentic Certificate
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Verified by SRMU Event Board
                    </h3>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono self-start sm:self-auto">
                  {result.certificate.certificateId}
                </div>
              </div>

              {/* Certificate Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-stone-400 block text-xs">Recipient Student</span>
                  <span className="font-bold text-white text-base">
                    {result.certificate.studentName}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-stone-400 block text-xs">Roll Number</span>
                  <span className="font-mono font-bold text-amber-200 text-base">
                    {result.certificate.rollNumber}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-stone-400 block text-xs">Degree & Specialization</span>
                  <span className="font-semibold text-white">
                    {result.certificate.course} — {result.certificate.branch}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-stone-400 block text-xs">Event & Issue Date</span>
                  <span className="font-semibold text-white">
                    Vijayadashami Carnival • {result.certificate.issueDate || 'October 2026'}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                <div className="text-xs text-stone-300 flex items-center gap-1.5 text-center sm:text-left">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Official credential issued under Shri Ramswaroop Memorial University Student Affairs Division.</span>
                </div>

                <a
                  href={`/api/certificates/download/${encodeURIComponent(result.certificate.verificationToken || result.certificate.certificateId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#E5C158] hover:bg-[#FCE7B0] text-stone-950 transition-all shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  <Download className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                  <span>Download Official PDF Certificate</span>
                </a>
              </div>

            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#2A0812] border border-rose-500/50 text-rose-200 text-center space-y-2 shadow-lg">
              <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Certificate Record Not Found</h4>
              <p className="text-xs text-stone-300 max-w-md mx-auto">
                {result.error || 'The identifier provided does not match any authenticated certificates in the event database.'}
              </p>
            </div>
          )}
        </div>
      )}

    </section>
  );
};
