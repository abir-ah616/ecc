import React, { useState } from 'react';
import {
  Flame,
  ArrowRight,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Upload,
  ClipboardList,
  Target,
  Swords,
  ArrowLeft,
  Trophy,
} from 'lucide-react';
import { useTournamentStore, SAMPLE_TEAM_NAMES } from '../../store/tournamentStore';
import type { TournamentMode } from '../../types/tournament';

interface SquadDraft {
  name: string;
  logoUrl?: string;
}

export const CreateTournamentView: React.FC = () => {
  const { createTournament, setCurrentTab } = useTournamentStore();

  // Mode selection state: null until user selects either SCRIM or CHAMPION_RUSH
  const [selectedMode, setSelectedMode] = useState<TournamentMode | null>(null);

  // Tournament parameters
  const [name, setName] = useState('FREE FIRE CHAMPIONSHIP');
  const [roundOrDay, setRoundOrDay] = useState('GRAND FINALS - DAY 1');
  const [hostName, setHostName] = useState('BD ESPORTS ARENA');
  const [sponsorName, setSponsorName] = useState('RED BULL / ASUS ROG');
  const [totalMatchesPlanned, setTotalMatchesPlanned] = useState(5);

  // Champion Rush specific settings: set buttons + custom inputs
  const [targetPoints, setTargetPoints] = useState(50);
  const [maxMatches, setMaxMatches] = useState(8);
  const allowSameMatch = false;
  const showLogos = true;
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(undefined);

  // Teams list with logo support (defaults to clean 12 squads)
  const [teams, setTeams] = useState<SquadDraft[]>(
    Array.from({ length: 12 }, (_, i) => ({ name: `Team ${i + 1}` }))
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
        (_, i) => ({ name: `Team ${teams.length + i + 1}` })
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

  const handleRemoveLogo = (index: number) => {
    setTeams((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, logoUrl: undefined } : t))
    );
  };

  const handleNameChange = (index: number, val: string) => {
    setTeams((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, name: val } : t))
    );
  };

  const handleAddTeam = () => {
    if (teams.length >= 20) return;
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

  const handleFillDemoNames = () => {
    setTeams(SAMPLE_TEAM_NAMES.map((name) => ({ name })));
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

  // -------------------------------------------------------------
  // SCREEN 1: User has NOT selected a mode yet -> Show 2 Big Cards
  // -------------------------------------------------------------
  if (!selectedMode) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8 animate-in fade-in duration-200">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-3.5 py-1 text-xs font-semibold text-neutral-300">
            <Trophy className="h-3.5 w-3.5 text-red-500" />
            <span>Step 1: Choose Your Tournament Format</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wider text-white">
            Select Tournament Format
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
            Choose how matches and champions will be determined for this competition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Option 1: Classic Scrim */}
          <div
            onClick={() => setSelectedMode('SCRIM')}
            className="group cursor-pointer rounded-2xl border border-neutral-800 bg-gradient-to-b from-[#161017] to-[#0D0A10] p-8 shadow-xl transition-all hover:border-red-600 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/80 border border-red-800/60 text-red-400 group-hover:bg-red-600 group-hover:text-white transition-all shadow-md">
                <Swords className="h-7 w-7" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-red-400">
                  Standard Format
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mt-1">
                  Classic Scrim / League
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                A fixed number of matches (e.g. 4, 5, 6, or 8 matches). All placement and kill points accumulate into an overall leaderboard. The squad with the highest total points wins the title.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-bold text-red-400 group-hover:text-red-300">
              <span>Select Classic Scrim</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option 2: Champion Rush (Match Point) */}
          <div
            onClick={() => setSelectedMode('CHAMPION_RUSH')}
            className="group cursor-pointer rounded-2xl border border-neutral-800 bg-gradient-to-b from-[#181310] to-[#0D0A10] p-8 shadow-xl transition-all hover:border-amber-500 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/80 border border-amber-800/60 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all shadow-md">
                <Target className="h-7 w-7" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                  Esports Thriller Format
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mt-1">
                  Champion Rush
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Squads race to reach a point threshold (e.g. 50, 60, 70, or custom points). Once a squad hits the mark, their Champion Point activates. The first activated squad to get a Booyah wins immediately.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <span>Select Champion Rush</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="text-xs font-semibold text-neutral-500 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 2: Mode is selected -> Show full customizable creation form
  // -------------------------------------------------------------
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-[#161017] via-[#0F0C12] to-[#0A080C] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedMode(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Format ({selectedMode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'})</span>
            </button>
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wider text-white">
              Create {selectedMode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Configure parameters, customize match count, target points, and participating squad rosters.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="self-start sm:self-auto rounded-xl border border-neutral-800 bg-neutral-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        {/* FORMAT SPECIFIC CONTROLS */}
        {selectedMode === 'SCRIM' ? (
          <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Swords className="h-5 w-5 text-red-500" />
                <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
                  Classic Scrim Match Plan
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Number of Matches Planned
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {[3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalMatchesPlanned(num)}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                      totalMatchesPlanned === num
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {num} Matches
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500">
                You can always add more matches or conclude early at any point during the tournament.
              </p>
            </div>
          </section>
        ) : (
          /* CHAMPION RUSH CONTROLS: Set buttons + Custom target & match inputs */
          <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Target className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
                  Champion Rush Threshold &amp; Match Limits
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Point Threshold with set buttons & custom input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Target Point Threshold (To Activate Champion Point)
                </label>

                {/* Quick set preset buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[40, 50, 60, 70, 80, 100].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setTargetPoints(pts)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                        targetPoints === pts
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {pts} PTS
                    </button>
                  ))}
                </div>

                {/* Custom numeric input */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-neutral-400 font-semibold">Or Custom Amount:</span>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(Math.max(1, parseInt(e.target.value) || 50))}
                    className="w-24 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm font-black text-amber-400 focus:border-amber-500 focus:outline-none font-numbers text-center"
                  />
                  <span className="text-xs text-neutral-400">Points</span>
                </div>
              </div>

              {/* Max Matches with set buttons & custom input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Maximum Match Cap (Emergency Cutoff)
                </label>

                {/* Quick set preset buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[6, 8, 10, 12, 14].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxMatches(num)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                        maxMatches === num
                          ? 'bg-neutral-700 text-white shadow-md'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {num} Matches
                    </button>
                  ))}
                </div>

                {/* Custom numeric input */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-neutral-400 font-semibold">Or Custom Max:</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={maxMatches}
                    onChange={(e) => setMaxMatches(Math.max(1, parseInt(e.target.value) || 8))}
                    className="w-24 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm font-black text-white focus:border-neutral-500 focus:outline-none font-numbers text-center"
                  />
                  <span className="text-xs text-neutral-400">Matches max</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* METADATA SECTION */}
        <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
              Tournament Details &amp; Branding
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tournament Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. FREE FIRE BANGLADESH CHAMPIONSHIP"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Phase / Day / Round Subtitle
              </label>
              <input
                type="text"
                required
                value={roundOrDay}
                onChange={(e) => setRoundOrDay(e.target.value)}
                placeholder="e.g. GRAND FINALS - DAY 1"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Host / Organizer Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. BD ESPORTS ARENA"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sponsor(s)
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="e.g. RED BULL / ASUS ROG"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tournament Logo Upload */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Tournament Crest Logo (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900 text-neutral-400 overflow-hidden">
                {customLogoUrl ? (
                  <img src={customLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-neutral-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Crest</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleTournamentLogoUpload(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
                {customLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomLogoUrl(undefined)}
                    className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/60"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SQUADS & ROSTER */}
        <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
                Participating Squads ({teams.length})
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Set squad names and optional logo badges for the standing graphic.
              </p>
            </div>

            {/* Quick Squad Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-1">
                {[12, 16].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSetCount(count)}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                      teams.length === count
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {count} Teams
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleFillDemoNames}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Fill Squad Names</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBulkPaste(!showBulkPaste)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                <ClipboardList className="h-3.5 w-3.5 text-neutral-400" />
                <span>Bulk Paste</span>
              </button>
            </div>
          </div>

          {/* Bulk Paste Drawer */}
          {showBulkPaste && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Paste Squad List (One squad per line)
              </label>
              <textarea
                rows={5}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder="Team Elite&#10;Total Gaming&#10;GodLike Esports&#10;Nigma Galaxy"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-xs font-mono text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500"
                >
                  Import Pasted Teams
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(false)}
                  className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Squads Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 hover:border-neutral-700 transition-all"
              >
                <span className="font-display font-black text-sm text-neutral-500 w-5 text-center">
                  #{idx + 1}
                </span>

                {/* Team Logo / Uploader */}
                <div className="relative group shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 overflow-hidden font-display font-black text-xs text-amber-400">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      team.name.slice(0, 3).toUpperCase()
                    )}
                  </div>
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                    <Upload className="h-3.5 w-3.5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleLogoUpload(idx, e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                  {team.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLogo(idx)}
                      title="Remove logo"
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>

                {/* Squad Name Input */}
                <input
                  type="text"
                  required
                  value={team.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-red-500 transition-colors"
                />

                {teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(idx)}
                    title="Delete squad"
                    className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddTeam}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              <Plus className="h-4 w-4 text-red-500" />
              <span>Add Another Squad</span>
            </button>
            <span className="text-xs text-neutral-500 font-medium">
              Maximum 20 teams supported per tournament
            </span>
          </div>
        </section>

        {/* BOTTOM ACTION BAR */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-neutral-700/80 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSelectedMode(null)}
            className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            ← Change Format
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-3 text-sm font-display font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/80 hover:from-red-500 hover:to-rose-500 active:scale-95 transition-all"
          >
            <span>Launch Tournament &amp; Start Scoring</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
