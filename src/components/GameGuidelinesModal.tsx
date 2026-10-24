import React, { useState } from 'react';
import { Game } from '../types';
import { 
  X, 
  Check, 
  ShieldAlert, 
  Trophy, 
  ListOrdered, 
  FileText, 
  Package, 
  AlertTriangle,
  Target,
  Users,
  Clock
} from 'lucide-react';

interface GameGuidelinesModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelect: (gameId: string) => void;
}

export const GameGuidelinesModal: React.FC<GameGuidelinesModalProps> = ({
  game,
  isOpen,
  onClose,
  isSelected,
  onToggleSelect
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'procedure' | 'safety' | 'materials'>('rules');

  if (!isOpen || !game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-white">
      
      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalGameTitle"
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#18040C] border border-[#D4AF37]/50 shadow-2xl shadow-rose-950/80 overflow-hidden"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#3D0A17] bg-gradient-to-r from-[#2A0812] via-[#20050E] to-[#150309] flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/40 shadow-xs">
                {game.category}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-black/50 text-stone-300 border border-white/10">
                {game.participationType}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#2A0710] text-amber-200 border border-[#D4AF37]/50 shadow-xs flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C] text-white text-[9px] flex items-center justify-center font-black">₹</span>
                <span>{game.registrationFee}</span>
              </span>
            </div>

            <h3 id="modalGameTitle" className="text-xl sm:text-2xl font-black font-heading text-white">
              {game.name}
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 mt-1 leading-relaxed">
              {game.shortDescription}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-xl bg-black/50 hover:bg-black/80 text-stone-300 hover:text-white border border-white/10 hover:border-white/30 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3D0A17] bg-[#120208] px-3 sm:px-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'rules', label: 'Rules & Objective', icon: FileText },
            { id: 'procedure', label: 'Procedure & Heats', icon: ListOrdered },
            { id: 'safety', label: 'Safety Protocols', icon: ShieldAlert },
            { id: 'materials', label: 'Equipment & Info', icon: Package }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#E5C158] text-[#E5C158] font-bold bg-[#24060F]/40'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-stone-200 bg-[#15030A]">
          
          {/* Rules & Objective Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase font-bold text-amber-300/80 tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Objective</span>
                </h4>
                <p className="p-3.5 rounded-xl bg-[#24060F]/90 border border-[#D4AF37]/30 font-medium text-stone-200 leading-relaxed">
                  {game.objective}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-amber-300/80 tracking-wider mb-2">Official Proposed Rules</h4>
                <ul className="space-y-2">
                  {game.proposedRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-[#380E17] text-[#E5C158] border border-[#D4AF37]/40 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-stone-200 text-xs sm:text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-amber-300/80 tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Winning Criteria</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-200 text-xs sm:text-sm font-medium">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{game.winningCriteria}</span>
                </div>
              </div>
            </div>
          )}

          {/* Procedure Tab */}
          {activeTab === 'procedure' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#24060F]/90 border border-[#D4AF37]/30">
                  <span className="font-semibold text-amber-300/80 block uppercase text-[10px] tracking-wider mb-0.5">Suggested Team Size</span>
                  <span className="font-bold text-white">{game.suggestedTeamSize}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#24060F]/90 border border-[#D4AF37]/30">
                  <span className="font-semibold text-amber-300/80 block uppercase text-[10px] tracking-wider mb-0.5">Suggested Duration</span>
                  <span className="font-bold text-white">{game.suggestedDuration}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-amber-300/80 tracking-wider mb-2">Round Execution Steps</h4>
                <ol className="space-y-2.5">
                  {game.procedure.map((step, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-[#24060F]/70 border border-white/5 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-[#380E17] text-[#E5C158] font-mono text-xs font-bold shrink-0">
                        Step {idx + 1}
                      </span>
                      <span className="text-stone-200 text-xs sm:text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Safety Protocols Tab */}
          {activeTab === 'safety' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed">
                  Safety Marshals and Event Supervisors will oversee all participants. Disregard for instructions will result in disqualification.
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {game.safetyNotes.map((note, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#24060F]/80 border border-rose-500/20 text-xs flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                    <span className="text-stone-200">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment & Info Tab */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase font-bold text-amber-300/80 tracking-wider mb-1.5">Equipment & Setup</h4>
                <p className="p-3.5 rounded-xl bg-[#24060F]/90 border border-[#D4AF37]/30 text-xs leading-relaxed text-stone-200">
                  {game.materials}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-amber-300/80 tracking-wider mb-1.5">Official Approval Status</h4>
                <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-200 text-xs">
                  {game.approvalStatus}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#3D0A17] bg-[#120208] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-300 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 transition-colors cursor-pointer"
          >
            Close Guidelines
          </button>

          <button
            onClick={() => onToggleSelect(game.id)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isSelected
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white border border-[#E5C158]/70 shadow-rose-950/60'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Selected for Registration</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Select this Game (+₹5)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
