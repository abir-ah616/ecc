import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  ClipboardList,
  Target,
  Trophy,
  Shield,
} from 'lucide-react';
import { useTournamentStore, generateInitials } from '../../store/tournamentStore';
import type { Team, TournamentMode } from '../../types/tournament';

export const EditTournamentView: React.FC = () => {
  const {
    getActiveTournament,
    updateTournament,
    setCurrentTab,
  } = useTournamentStore();

  const activeTournament = getActiveTournament();

  const [name, setName] = useState('');
  const [roundOrDay, setRoundOrDay] = useState('');
  const [hostName, setHostName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [mode, setMode] = useState<TournamentMode>('SCRIM');
  const [totalMatchesPlanned, setTotalMatchesPlanned] = useState(6);
  const [targetPoints, setTargetPoints] = useState(80);
  const [maxMatches, setMaxMatches] = useState(8);
  const [allowSameMatch, setAllowSameMatch] = useState(false);
  const [showLogos, setShowLogos] = useState(true);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(undefined);

  // Editable squads list
  const [teams, setTeams] = useState<Team[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);

  useEffect(() => {
    if (activeTournament) {
      setName(activeTournament.settings.name);
      setRoundOrDay(activeTournament.settings.roundOrDay);
      setHostName(activeTournament.settings.hostName || '');
      setSponsorName(activeTournament.settings.sponsorName || '');
      setCustomLogoUrl(activeTournament.settings.customLogoUrl);
      setMode(activeTournament.settings.mode);
      setTotalMatchesPlanned(activeTournament.settings.totalMatchesPlanned);
      setTargetPoints(activeTournament.settings.championRush?.targetPoints ?? 80);
      setMaxMatches(activeTournament.settings.championRush?.maxMatches ?? 8);
      setAllowSameMatch(activeTournament.settings.championRush?.allowSameMatchBooyahActivation ?? false);
      setShowLogos(activeTournament.settings.showLogos ?? true);
      setTeams(activeTournament.teams.map((t) => ({ ...t })));
    }
  }, [activeTournament?.id]);

  if (!activeTournament) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
          NO TOURNAMENT SELECTED
        </h2>
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black"
        >
          RETURN TO DASHBOARD
        </button>
      </div>
    );
  }

  const handleTournamentLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomLogoUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSetCount = (count: number) => {
    if (count === teams.length) return;
    if (count < teams.length) {
      setTeams(teams.slice(0, count));
    } else {
      const added: Team[] = Array.from(
        { length: count - teams.length },
        (_, i) => {
          const num = teams.length + i + 1;
          return {
            id: `team_${activeTournament.id}_${Date.now()}_${num}`,
            name: `Squad ${num}`,
            shortCode: `S${num}`,
          };
        }
      );
      setTeams([...teams, ...added]);
    }
  };

  const handleBulkImport = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 0) {
      setTeams(
        lines.map((l, idx) => ({
          id: teams[idx]?.id || `team_${activeTournament.id}_${Date.now()}_${idx + 1}`,
          name: l,
          shortCode: generateInitials(l),
          logoUrl: teams[idx]?.logoUrl,
        }))
      );
      setShowBulkPaste(false);
      setBulkPasteText('');
    }
  };

  const handleLogoUpload = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setTeams((prev) =>
        prev.map((t, idx) => (idx === index ? { ...t, logoUrl: dataUrl } : t))
      );
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (index: number, val: string) => {
    setTeams((prev) =>
      prev.map((t, idx) =>
        idx === index
          ? { ...t, name: val, shortCode: generateInitials(val) }
          : t
      )
    );
  };

  const handleAddTeam = () => {
    if (teams.length >= 24) return;
    const nextNum = teams.length + 1;
    const defaultName = `Squad ${nextNum}`;
    setTeams([
      ...teams,
      {
        id: `team_${activeTournament.id}_${Date.now()}_${nextNum}`,
        name: defaultName,
        shortCode: `S${nextNum}`,
      },
    ]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 2) return;
    setTeams(teams.filter((_, idx) => idx !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTournament(activeTournament.id, {
      name,
      roundOrDay,
      hostName,
      sponsorName,
      customLogoUrl,
      showLogos,
      mode,
      totalMatchesPlanned,
      championRush: {
        targetPoints,
        maxMatches,
        allowSameMatchBooyahActivation: allowSameMatch,
      },
      teams,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/15 bg-[#121522] p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 px-3 py-2 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-amber-400" />
            <span>DASHBOARD</span>
          </button>

          <div className="h-6 w-[1px] bg-white/15 hidden sm:block" />

          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-white">
            EDIT SQUADS &amp; PARAMETERS
          </h1>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>CHANGES SAVED</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Identity & Broadcast Labels */}
        <div className="rounded-3xl border border-white/15 bg-[#121522] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Trophy className="h-6 w-6 text-amber-400" />
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-white">
              TOURNAMENT DETAILS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                TOURNAMENT TITLE *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                ROUND / STAGE HEADER
              </label>
              <input
                type="text"
                value={roundOrDay}
                onChange={(e) => setRoundOrDay(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                HOST / ORGANIZER
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                SPONSOR / PARTNER
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Tournament Crest Upload */}
          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              CUSTOM TOURNAMENT LOGO (OPTIONAL)
            </label>
            <div className="mt-2 flex items-center gap-4">
              {customLogoUrl ? (
                <div className="relative h-14 w-14 rounded-xl border border-amber-400 overflow-hidden bg-black/60 shadow-lg">
                  <img
                    src={customLogoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomLogoUrl(undefined)}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 hover:border-amber-400/50 hover:bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-300 transition-all">
                  <Upload className="h-4 w-4 text-amber-400" />
                  <span>UPLOAD PNG / SVG LOGO</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleTournamentLogoUpload(f);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Match Count / Target Points */}
        <div className="rounded-3xl border border-white/15 bg-[#121522] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Target className="h-6 w-6 text-cyan-400" />
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-white">
              {mode === 'CHAMPION_RUSH' ? 'CHAMPION RUSH TARGET' : 'MATCH COUNT PLANNED'}
            </h2>
          </div>

          {mode === 'SCRIM' ? (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                PLANNED MATCHES
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[4, 5, 6, 8, 10, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTotalMatchesPlanned(cnt)}
                    className={`rounded-xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                      totalMatchesPlanned === cnt
                        ? 'bg-cyan-500 text-black border border-cyan-400 shadow-md'
                        : 'border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {cnt} MATCHES
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  TARGET POINT THRESHOLD
                </label>
                <div className="flex flex-wrap gap-2">
                  {[50, 75, 80, 100, 120].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setTargetPoints(pts)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                        targetPoints === pts
                          ? 'bg-purple-500 text-black border border-purple-400 shadow-md'
                          : 'border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {pts} PTS
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  MAX MATCHES LIMIT
                </label>
                <div className="flex flex-wrap gap-2">
                  {[6, 8, 10, 12].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setMaxMatches(cnt)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                        maxMatches === cnt
                          ? 'bg-amber-500 text-black border border-amber-400 shadow-md'
                          : 'border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {cnt} MATCHES
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Squad Roster */}
        <div className="rounded-3xl border border-white/15 bg-[#121522] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-emerald-400" />
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-wider text-white">
                  SQUAD ROSTER ({teams.length} SQUADS)
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[12, 16, 18].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetCount(num)}
                  className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    teams.length === num
                      ? 'bg-emerald-500 text-black border border-emerald-400 shadow-md'
                      : 'border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {num} SQUADS
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowBulkPaste(!showBulkPaste)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300"
              >
                <ClipboardList className="h-4 w-4 text-amber-400" />
                <span>BULK PASTE</span>
              </button>
            </div>
          </div>

          {/* Bulk Paste Drawer */}
          {showBulkPaste && (
            <div className="rounded-2xl border border-amber-500/30 bg-black/60 p-5 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-amber-300">
                PASTE SQUAD NAMES (ONE TEAM PER LINE)
              </label>
              <textarea
                rows={5}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={"TOTAL GAMING\nEVOS ESPORTS\nRRQ KAZU\nMAGIC SQUAD"}
                className="w-full rounded-xl border border-white/15 bg-black/80 p-3.5 text-xs sm:text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold uppercase text-neutral-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-black uppercase tracking-wider text-black shadow-md"
                >
                  APPLY SQUAD LIST
                </button>
              </div>
            </div>
          )}

          {/* Squad Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teams.map((team, idx) => (
              <div
                key={team.id || idx}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 p-2.5 hover:border-white/20 transition-all"
              >
                <span className="w-8 shrink-0 text-center text-xs font-black text-amber-400">
                  #{idx + 1}
                </span>

                <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:border-amber-400 overflow-hidden">
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : (
                    <Upload className="h-3.5 w-3.5 text-neutral-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(idx, f);
                    }}
                  />
                </label>

                <input
                  type="text"
                  required
                  value={team.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none"
                />

                {teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(idx)}
                    className="text-neutral-500 hover:text-red-400 p-1"
                    title="Remove squad"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-start pt-2">
            <button
              type="button"
              onClick={handleAddTeam}
              className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 hover:border-amber-400/50 hover:bg-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-300"
            >
              <Plus className="h-4 w-4 text-amber-400" />
              <span>ADD SQUAD SLOT</span>
            </button>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-300"
          >
            CANCEL &amp; RETURN
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-8 py-4 text-sm sm:text-base font-black uppercase tracking-wider text-black shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Save className="h-5 w-5" />
            <span>SAVE TOURNAMENT CHANGES</span>
          </button>
        </div>
      </form>
    </div>
  );
};
