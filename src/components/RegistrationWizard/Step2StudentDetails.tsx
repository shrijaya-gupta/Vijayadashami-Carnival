import React from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  User, 
  Phone, 
  Hash, 
  GraduationCap, 
  Building2, 
  Calendar, 
  Zap,
  Check,
  Gamepad2,
  Flame
} from 'lucide-react';
import { GAMES_DATA } from '../../data/games';

const COURSES = ['B.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'Diploma', 'B.Sc', 'M.Sc', 'Other'];
const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'Civil', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export const Step2StudentDetails: React.FC = () => {
  const { student, updateStudent, nextStep, prevStep, goToStep, selectedGameIds, gameConfigs, submitError } = useRegistration();
  const hasTeamGame = selectedGameIds.some(id => gameConfigs[id]?.participationType === 'team');

  const isMobileValid = /^(?:\+91|0)?[6-9]\d{9}$/.test(student.mobileNumber.replace(/[\s\-\(\)]/g, ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      {/* Concise Clean Header */}
      <div className="pb-3 border-b border-white/10 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-xl font-bold font-heading text-white tracking-wide">
            Student Registration
          </h3>
          <span className="text-xs font-bold text-amber-300 bg-black/50 px-2.5 py-1 rounded-full border border-[#D4AF37]/40 shadow-xs shrink-0 whitespace-nowrap">
            Pass Fee: ₹10
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold whitespace-nowrap">
            ✓ All 6 Games Included
          </span>
          <span className="text-stone-400 text-[11px]">
            Fill details to get your ₹10 carnival pass
          </span>
        </div>
        <span className="sr-only">Step 2: Participant & Student Information Provide your official Shri Ramswaroop Memorial University enrollment details.</span>
      </div>

      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Hidden rollNumber fallback to maintain model compatibility without user input */}
      <input type="hidden" value={student.rollNumber || ''} />

      {/* Primary Details: Name & Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Full Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Full Name"
            value={student.fullName}
            onChange={(e) => updateStudent({ fullName: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white placeholder-stone-500 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden transition-all shadow-inner"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              10-Digit Mobile Number <span className="text-rose-400">*</span>
            </label>
            {student.mobileNumber && (
              isMobileValid ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Valid
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-400">
                  10 digits (6–9)
                </span>
              )
            )}
          </div>
          <div className="relative">
            <input
              type="tel"
              required
              maxLength={13}
              placeholder="e.g., 9876543210"
              value={student.mobileNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9+\s\-]/g, '');
                updateStudent({ mobileNumber: val });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-black/50 text-white placeholder-stone-500 text-sm focus:outline-hidden transition-all shadow-inner ${
                student.mobileNumber && isMobileValid
                  ? 'border-emerald-500/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                  : 'border-[#D4AF37]/35 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]'
              }`}
            />
            {student.mobileNumber && isMobileValid && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Details: Course, Branch, Year */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Course Selection */}
        <div>
          <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            Degree / Course <span className="text-rose-400">*</span>
          </label>
          <select
            value={student.course}
            onChange={(e) => updateStudent({ course: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden transition-all"
          >
            {COURSES.map(c => <option key={c} value={c} className="bg-stone-900 text-white">{c}</option>)}
          </select>
          {student.course === 'Other' && (
            <input
              type="text"
              required
              placeholder="Specify Course"
              value={student.courseOther}
              onChange={(e) => updateStudent({ courseOther: e.target.value })}
              className="w-full mt-2 px-3 py-2 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white text-sm"
            />
          )}
        </div>

        {/* Branch Selection */}
        <div>
          <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Branch / Dept <span className="text-rose-400">*</span>
          </label>
          <select
            value={student.branch}
            onChange={(e) => updateStudent({ branch: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden transition-all"
          >
            {BRANCHES.map(b => <option key={b} value={b} className="bg-stone-900 text-white">{b}</option>)}
          </select>
          {student.branch === 'Other' && (
            <input
              type="text"
              required
              placeholder="Specify Branch"
              value={student.branchOther}
              onChange={(e) => updateStudent({ branchOther: e.target.value })}
              className="w-full mt-2 px-3 py-2 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white text-sm"
            />
          )}
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Year <span className="text-rose-400">*</span>
          </label>
          <select
            value={student.academicYear}
            onChange={(e) => updateStudent({ academicYear: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden transition-all"
          >
            {YEARS.map(y => <option key={y} value={y} className="bg-stone-900 text-white">{y}</option>)}
          </select>
        </div>
      </div>

      {/* WhatsApp Schedule Consent (Streamlined & Clean) */}
      <label htmlFor="regConsent" className="flex items-center gap-3 p-2.5 px-3 rounded-xl bg-black/40 border border-[#D4AF37]/25 cursor-pointer text-xs text-stone-300 hover:border-[#D4AF37]/40 transition-colors">
        <input
          type="checkbox"
          id="regConsent"
          checked={student.whatsAppConsent}
          onChange={(e) => updateStudent({ whatsAppConsent: e.target.checked })}
          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-[#881337] shrink-0"
        />
        <span>Receive official match schedules &amp; heat alerts on WhatsApp</span>
      </label>

      {/* Buttons with Fast-Track Option */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('games');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-stone-300 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View All 6 Activities</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#E5C158]/70 cursor-pointer"
          >
            <span>Proceed to Payment (₹10 Pass)</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>

    </form>
  );
};
