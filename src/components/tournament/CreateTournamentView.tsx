import React, { useState } from 'react';
import {
  Flame,
  ArrowRight,
  X,
  Plus,
  Trash2,
  Upload,
  ClipboardList,
  Target,
  Swords,
  ArrowLeft,
  Trophy,
  Radio,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import type { TournamentMode } from '../../types/tournament';

interface SquadDraft {
  name: string;
  logoUrl?: string;
}

export const CreateTournamentView: React.FC = () => {
  const { createTournament, setCurrentTab } = useTournamentStore();

  const [selectedMode, setSelectedMode] = useState<TournamentMode | null>(null);

  // Tournament parameters
  const [name, setName] = useState('FREE FIRE CHAMPIONSHIP');
  const [roundOrDay, setRoundOrDay] = useState('GRAND FINALS - DAY 1');
  const [hostName, setHostName] = useState('BD ESPORTS ARENA');
  const [sponsorName, setSponsorName] = useState('RED BULL / ASUS ROG');
  const [totalMatchesPlanned, setTotalMatchesPlanned] = useState(6);

  // Champion Rush specific settings
  const [targetPoints, setTargetPoints] = useState(80);
  const [maxMatches, setMaxMatches] = useState(8);
  const allowSameMatch = false;
  const showLogos = true;
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(undefined);

  // Teams list with logo support
  const [teams, setTeams] = useState<SquadDraft[]>(
    Array.from({ length: 12 }, (_, i) => ({ name: `Squad ${i + 1}` }))
  );
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);

  const handleSetCount = (count: number) => {
    if (count === teams.length) return;
    if (count < teams.length) {
      setTeams(teams.slice(0, count));
    } else {
      const added: SquadDraft[] = Array.from(
        { length: count - teams.length },
        (_, i) => ({ name: `Squad ${teams.length + i + 1}` })
      );
      setTeams([...teams, ...added]);
    }
  };

  const handleTournamentLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomLogoUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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
      prev.map((t, idx) => (idx === index ? { ...t, name: val } : t))
    );
  };

  const handleAddTeam = () => {
    if (teams.length >= 24) return;
    const nextNum = teams.length + 1;
    setTeams([...teams, { name: `Squad ${nextNum}` }]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 2) return;
    setTeams(teams.filter((_, idx) => idx !== index));
  };

  const handleBulkImport = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 0) {
      setTeams(lines.map((l) => ({ name: l })));
      setShowBulkPaste(false);
      setBulkPasteText('');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMode) return;

    createTournament({
      name,
      mode: selectedMode,
      roundOrDay,
      hostName,
      sponsorName,
      showLogos,
      customLogoUrl,
      totalMatchesPlanned,
      championRush: {
        targetPoints,
        maxMatches,
        allowSameMatchBooyahActivation: allowSameMatch,
      },
      teams: teams.map((t) => ({ name: t.name, logoUrl: t.logoUrl })),
    });
  };

  // STEP 1: HOLOGRAPHIC FORMAT SELECTION
  if (!selectedMode) {
    return (
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-10 select-none animate-in fade-in duration-200">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Radio className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            <span>STEP 1 OF 2 // BATTLE PROTOCOL SELECTION</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-wider text-white">
            CHOOSE COMPETITIVE FORMAT
          </h1>

          <p className="text-sm sm:text-base font-semibold text-neutral-400 max-w-lg mx-auto">
            Select the tournament protocol for scoring, leaderboard mechanics, and championship qualification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Protocol 1: Classic Scrim */}
          <div
            onClick={() => setSelectedMode('SCRIM')}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-[#121927] via-[#0E131E] to-[#0A0D15] p-8 shadow-2xl hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(6,182,212,0.35)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                  <Swords className="h-8 w-8 text-cyan-400" />
                </div>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/40 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-300">
                  STANDARD LEAGUE
                </span>
              </div>

              <div>
                <h2 className="font-display text-3xl font-black uppercase tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                  CLASSIC SCRIM
                </h2>
                <p className="mt-2 text-sm font-semibold text-neutral-300 leading-relaxed">
                  Fixed series of matches (e.g. 4, 6, 8, 12). Teams earn placement and kill points on every match. The squad with the highest aggregate points wins the championship.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Fixed match count series (4, 6, 8 or custom)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Cumulative Placement &amp; Kill scoring</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Real-time overall leaderboard with Booyah count</span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-5 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-md">
              <span>SELECT CLASSIC SCRIM PROTOCOL</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Protocol 2: Champion Rush */}
          <div
            onClick={() => setSelectedMode('CHAMPION_RUSH')}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-br from-[#1C1327] via-[#140D1D] to-[#0D0814] p-8 shadow-2xl hover:border-purple-400 hover:shadow-[0_0_40px_rgba(168,85,247,0.35)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                  <Flame className="h-8 w-8 text-amber-400" />
                </div>
                <span className="rounded-full bg-purple-500/15 border border-purple-500/40 px-3 py-1 text-xs font-black uppercase tracking-widest text-purple-300">
                  HIGH STAKES CLUTCH
                </span>
              </div>

              <div>
                <h2 className="font-display text-3xl font-black uppercase tracking-wider text-white group-hover:text-purple-300 transition-colors">
                  CHAMPION RUSH
                </h2>
                <p className="mt-2 text-sm font-semibold text-neutral-300 leading-relaxed">
                  Point-Rush Race! Teams race to breach a Target Point threshold (e.g. 80 pts). Once unlocked, getting a subsequent Booyah instantly crowns the Champion!
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Target Point Threshold (50, 75, 80, 100+ pts)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Match-point qualification &amp; Championship Booyah</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Emergency Match Cap fallback limit</span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between rounded-xl bg-purple-500/10 border border-purple-500/30 px-5 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-purple-300 group-hover:bg-purple-500 group-hover:text-black transition-all shadow-md">
              <span>SELECT CHAMPION RUSH PROTOCOL</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: CONFIGURATION & DEPLOYMENT DECK
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 select-none animate-in fade-in duration-200">
      {/* Top Protocol Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/15 bg-[#121522] p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedMode(null)}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 px-3 py-2 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-amber-400" />
            <span>CHANGE FORMAT</span>
          </button>

          <div className="h-6 w-[1px] bg-white/15 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              ACTIVE PROTOCOL:
            </span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border ${
                selectedMode === 'CHAMPION_RUSH'
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                  : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
              }`}
            >
              {selectedMode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
            </span>
          </div>
        </div>

        <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
          STEP 2 // TACTICAL DEPLOYMENT
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        {/* SECTION 1: IDENTITY & BROADCAST LABELS */}
        <div className="rounded-3xl border border-white/15 bg-[#121522] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Trophy className="h-6 w-6 text-amber-400" />
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-white">
              TOURNAMENT IDENTITY &amp; BROADCAST LABELS
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
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm sm:text-base font-bold text-white focus:border-amber-400 focus:outline-none"
                placeholder="e.g. FREE FIRE PRO LEAGUE"
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
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm sm:text-base font-bold text-white focus:border-amber-400 focus:outline-none"
                placeholder="e.g. GRAND FINALS - DAY 1"
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
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm sm:text-base font-bold text-white focus:border-amber-400 focus:outline-none"
                placeholder="e.g. BD ESPORTS ARENA"
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
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm sm:text-base font-bold text-white focus:border-amber-400 focus:outline-none"
                placeholder="e.g. ASUS ROG / MONSTER"
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

        {/* SECTION 2: MATCH PROTOCOL SETTINGS */}
        <div className="rounded-3xl border border-white/15 bg-[#121522] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Target className="h-6 w-6 text-cyan-400" />
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-white">
              {selectedMode === 'CHAMPION_RUSH'
                ? 'CHAMPION RUSH TARGET & LIMITS'
                : 'SERIES MATCH COUNT SETTINGS'}
            </h2>
          </div>

          {selectedMode === 'SCRIM' ? (
            /* Classic Scrim: Match Count Selector */
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                PLANNED NUMBER OF MATCHES
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[4, 5, 6, 8, 10, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTotalMatchesPlanned(cnt)}
                    className={`rounded-xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${
                      totalMatchesPlanned === cnt
                        ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-400'
                        : 'border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {cnt} MATCHES
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold uppercase text-neutral-400">CUSTOM:</span>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={totalMatchesPlanned}
                  onChange={(e) =>
                    setTotalMatchesPlanned(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-24 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* Champion Rush: Target Points + Max Matches */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Target Points Threshold */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  TARGET POINT THRESHOLD (POINTS TO ACTIVATE RUSH)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[50, 75, 80, 100, 120].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setTargetPoints(pts)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                        targetPoints === pts
                          ? 'bg-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400'
                          : 'border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {pts} PTS
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold uppercase text-neutral-400">CUSTOM:</span>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={targetPoints}
                    onChange={(e) =>
                      setTargetPoints(Math.max(10, parseInt(e.target.value, 10) || 10))
                    }
                    className="w-28 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm font-bold text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Max Matches Fallback Limit */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  MAX MATCHES CEILING (FALLBACK LIMIT)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[6, 8, 10, 12].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setMaxMatches(cnt)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                        maxMatches === cnt
                          ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-400'
                          : 'border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {cnt} MATCHES
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold uppercase text-neutral-400">CUSTOM:</span>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={maxMatches}
                    onChange={(e) =>
                      setMaxMatches(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-28 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: SQUAD ROSTER BUILDER */}
        <div className="rounded-3xl border border-white/15 bg-[#121522] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-emerald-400" />
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-wider text-white">
                  SQUAD ROSTER DECK
                </h2>
                <p className="text-xs font-semibold text-neutral-400">
                  {teams.length} Squads Enrolled // Free Fire Standard is 12 Squads
                </p>
              </div>
            </div>

            {/* Quick Count Presets & Bulk Import */}
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
            <div className="rounded-2xl border border-amber-500/30 bg-black/60 p-5 space-y-3 animate-in fade-in duration-150">
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
                key={idx}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 p-2.5 hover:border-white/20 transition-all"
              >
                <span className="w-8 shrink-0 text-center text-xs font-black text-amber-400">
                  #{idx + 1}
                </span>

                {/* Team Logo Button */}
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

                {/* Team Name Input */}
                <input
                  type="text"
                  required
                  value={team.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none"
                  placeholder={`Squad ${idx + 1}`}
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
              <span>ADD EXTRA SQUAD SLOT</span>
            </button>
          </div>
        </div>

        {/* BOTTOM DEPLOYMENT ACTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="w-full sm:w-auto rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-300"
          >
            DISCARD &amp; RETURN HOME
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-10 py-4 text-base font-black uppercase tracking-wider text-black shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Trophy className="h-5 w-5 stroke-[2.5]" />
            <span>DEPLOY &amp; START TOURNAMENT</span>
            <ArrowRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </form>
    </div>
  );
};
