import React from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { GAMES_DATA } from '../../data/games';
import { 
  Users, 
  User, 
  Crown, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const Step3TeamRoster: React.FC = () => {
  const { 
    selectedGameIds, 
    gamesList,
    gameConfigs, 
    student, 
    setGameFormat, 
    setTeamName, 
    addTeamMember, 
    removeTeamMember, 
    updateTeamMember,
    nextStep, 
    prevStep,
    submitError 
  } = useRegistration();

  const anyTeamGame = selectedGameIds.some(id => gameConfigs[id]?.participationType === 'team');

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
            Step 3: Participation Format & Team Rosters
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Specify whether you are competing solo or registering a squad for each selected event.
          </p>
        </div>

        {/* Quick Skip if only solo */}
        {!anyTeamGame && (
          <button
            type="button"
            onClick={() => nextStep()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950/40 border border-emerald-300 cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>All Solo Events • Skip to Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Selected Games Configuration Cards */}
      <div className="space-y-4">
        {selectedGameIds.map((gameId) => {
          const gameMeta = gamesList?.find(g => g.id === gameId) || GAMES_DATA.find(g => g.id === gameId);
          const config = gameConfigs[gameId];
          if (!gameMeta || !config) return null;

          const isTeam = config.participationType === 'team';

          return (
            <div
              key={gameId}
              className="p-4 sm:p-5 rounded-2xl bg-[#20050E]/90 border border-[#D4AF37]/35 shadow-sm space-y-4"
            >
              {/* Game Title & Format Radios */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    {gameMeta.category}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {gameMeta.name}
                  </h4>
                </div>

                {/* Individual vs Team Radio Selector */}
                <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setGameFormat(gameId, 'individual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isTeam
                        ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white shadow-xs border border-[#D4AF37]/50'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Individual Entry
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameFormat(gameId, 'team')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isTeam
                        ? 'bg-gradient-to-r from-[#881337] to-[#B91C1C] text-white shadow-xs border border-[#D4AF37]/50'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Team / Squad
                  </button>
                </div>
              </div>

              {/* Team Setup Section (Only shown if format is Team) */}
              {isTeam ? (
                <div className="space-y-4 pt-1">
                  {/* Team Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-2">
                      Team Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., SRMU Thunderbolts"
                      value={config.teamName}
                      onChange={(e) => setTeamName(gameId, e.target.value)}
                      className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-[#D4AF37]/35 bg-black/50 text-white placeholder-stone-500 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden"
                    />
                  </div>

                  {/* Team Leader Banner */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#2E0914] to-[#18030B] border border-[#D4AF37]/40 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-200">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Team Leader: <strong className="font-bold text-white">{student.fullName || 'Primary Student'}</strong> ({student.rollNumber || 'Your Roll'})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                      Captain / Primary Contact
                    </span>
                  </div>

                  {/* Additional Squad Members */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                        Additional Squad Members ({config.teamMembers.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => addTeamMember(gameId)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#380E17] hover:bg-[#4A101E] text-amber-200 border border-[#D4AF37]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Member
                      </button>
                    </div>

                    {config.teamMembers.length === 0 ? (
                      <p className="text-xs text-stone-300 italic p-3 rounded-xl bg-black/30 border border-dashed border-white/10">
                        No additional members added yet. Click &quot;Add Member&quot; to register your teammates. Note: Entry fee remains strictly ₹5 per game (not charged per member).
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {config.teamMembers.map((member, mIdx) => (
                          <div 
                            key={mIdx}
                            className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center gap-2.5 text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#380E17] text-amber-300 border border-[#D4AF37]/40 flex items-center justify-center font-bold shrink-0">
                              {mIdx + 2}
                            </span>

                            <input
                              type="text"
                              required
                              placeholder="Enter member's full name"
                              value={member.name}
                              onChange={(e) => updateTeamMember(gameId, mIdx, 'name', e.target.value)}
                              className="w-full sm:flex-1 px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 bg-black/50 text-white placeholder-stone-500"
                            />

                            <input
                              type="text"
                              placeholder="Enter roll number (optional)"
                              value={member.roll}
                              onChange={(e) => updateTeamMember(gameId, mIdx, 'roll', e.target.value)}
                              className="w-full sm:w-40 px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 bg-black/50 text-white placeholder-stone-500"
                            />

                            <input
                              type="tel"
                              placeholder="Enter mobile number (optional)"
                              value={member.contact}
                              onChange={(e) => updateTeamMember(gameId, mIdx, 'contact', e.target.value)}
                              className="w-full sm:w-36 px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 bg-black/50 text-white placeholder-stone-500"
                            />

                            <button
                              type="button"
                              onClick={() => removeTeamMember(gameId, mIdx)}
                              className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors shrink-0 cursor-pointer"
                              aria-label="Remove teammate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs text-stone-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>You are registered as a <strong>Solo Competitor</strong> for this game.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={prevStep}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-stone-300 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Details</span>
        </button>

        <button
          type="button"
          onClick={() => nextStep()}
          className="w-full sm:w-auto px-7 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#881337] via-[#B91C1C] to-[#881337] hover:from-[#9F1239] hover:to-[#B91C1C] text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#E5C158]/70 cursor-pointer"
        >
          <span>Continue to Review Summary</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>
      </div>
    </div>
  );
};
