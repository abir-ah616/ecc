import React, { useState } from 'react';
import {
  ArrowRight,
  X,
  Plus,
  Trash2,
  Upload,
  ClipboardList,
  Swords,
  ArrowLeft,
  Trophy,
  Flame,
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
  const [name, setName] = useState('Free Fire Championship');
  const [roundOrDay, setRoundOrDay] = useState('Grand Finals - Day 1');
  const [hostName, setHostName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [totalMatchesPlanned, setTotalMatchesPlanned] = useState(6);

  // Champion Rush settings
  const [targetPoints, setTargetPoints] = useState(80);
  const [maxMatches, setMaxMatches] = useState(8);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(undefined);

  // Teams list
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
      showLogos: true,
      customLogoUrl,
      totalMatchesPlanned,
      championRush: {
        targetPoints,
        maxMatches,
        allowSameMatchBooyahActivation: false,
      },
      teams: teams.map((t) => ({ name: t.name, logoUrl: t.logoUrl })),
    });
  };

  // STEP 1: Select Format (Classic Scrim or Champion Rush)
  if (!selectedMode) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8 select-none">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-white uppercase">
            Select Tournament Format
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Choose whether to run a standard match scrim or Champion Rush target-point race.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Option 1: Classic Scrim */}
          <div
            onClick={() => setSelectedMode('SCRIM')}
            className="cursor-pointer rounded-xl border border-neutral-800 bg-[#11131A] hover:bg-[#151821] hover:border-neutral-700 p-7 flex flex-col justify-between transition-colors shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-cyan-400">
                <Swords className="h-6 w-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Standard Format
                </span>
                <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mt-1">
                  Classic Scrim
                </h2>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Fixed number of matches (e.g. 5, 6, 8 matches). All placement points and kill points accumulate into an overall leaderboard. Highest total score wins.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-300">
              <span>Select Classic Scrim</span>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </div>
          </div>

          {/* Option 2: Champion Rush */}
          <div
            onClick={() => setSelectedMode('CHAMPION_RUSH')}
            className="cursor-pointer rounded-xl border border-neutral-800 bg-[#11131A] hover:bg-[#151821] hover:border-neutral-700 p-7 flex flex-col justify-between transition-colors shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-purple-400">
                <Flame className="h-6 w-6 text-amber-400" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Race to Target
                </span>
                <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mt-1">
                  Champion Rush
                </h2>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Teams race to reach a Target Point threshold (e.g. 80 pts). Once a team reaches the target, getting a Booyah wins them the Championship immediately!
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-300">
              <span>Select Champion Rush</span>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Configure Details
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-[#11131A] p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedMode(null)}
            className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-neutral-400" />
            <span>Change Format</span>
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Selected: <strong className="text-white">{selectedMode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}</strong>
          </span>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Tournament Details */}
        <div className="rounded-xl border border-neutral-800 bg-[#11131A] p-6 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
            Tournament Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tournament Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-neutral-500"
                placeholder="e.g. Free Fire Pro League"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Stage / Round Label
              </label>
              <input
                type="text"
                value={roundOrDay}
                onChange={(e) => setRoundOrDay(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-neutral-500"
                placeholder="e.g. Grand Finals - Day 1"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Host / Organizer (Optional)
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-neutral-500"
                placeholder="e.g. BD Esports Arena"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sponsor / Partner (Optional)
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-neutral-500"
                placeholder="e.g. Asus ROG"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Tournament Logo (Optional)
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              {customLogoUrl ? (
                <div className="relative h-12 w-12 rounded-lg border border-neutral-700 overflow-hidden bg-neutral-900">
                  <img
                    src={customLogoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomLogoUrl(undefined)}
                    className="absolute top-0 right-0 p-0.5 bg-red-600 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-300 transition-colors">
                  <Upload className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Upload Logo</span>
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

        {/* Match Settings */}
        <div className="rounded-xl border border-neutral-800 bg-[#11131A] p-6 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
            {selectedMode === 'CHAMPION_RUSH' ? 'Champion Rush Settings' : 'Match Series Settings'}
          </h2>

          {selectedMode === 'SCRIM' ? (
            /* Classic Scrim: Match Count */
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Number of Matches
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[4, 5, 6, 7, 8, 10, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTotalMatchesPlanned(cnt)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      totalMatchesPlanned === cnt
                        ? 'bg-red-600 text-white'
                        : 'border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {cnt} Matches
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs text-neutral-500 font-semibold">Custom:</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={totalMatchesPlanned}
                    onChange={(e) =>
                      setTotalMatchesPlanned(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-16 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs font-bold text-white text-center focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Champion Rush Settings */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Target Points: Clean direct input field where user can put anything! */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Target Point Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={targetPoints}
                  onChange={(e) =>
                    setTargetPoints(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  placeholder="e.g. 80"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-neutral-500"
                />
                <p className="text-[11px] text-neutral-500 font-medium">
                  Points needed to unlock rush status. (e.g. 50, 75, 80, 100).
                </p>
              </div>

              {/* Max Matches Ceiling: Select 5, 6, 7, 8, 10 or custom */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Max Matches Ceiling
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[5, 6, 7, 8, 10].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setMaxMatches(cnt)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        maxMatches === cnt
                          ? 'bg-amber-500 text-black font-extrabold'
                          : 'border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-1.5">
                    <span className="text-xs text-neutral-500">Custom:</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={maxMatches}
                      onChange={(e) =>
                        setMaxMatches(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-14 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs font-bold text-white text-center focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Fallback match limit if no team captures Booyah after target.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Squad Roster */}
        <div className="rounded-xl border border-neutral-800 bg-[#11131A] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white">
                Squad Roster ({teams.length} Teams)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[12, 16, 18].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetCount(num)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                    teams.length === num
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {num} Teams
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowBulkPaste(!showBulkPaste)}
                className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300 transition-colors"
              >
                <ClipboardList className="h-3.5 w-3.5 text-neutral-400" />
                <span>Bulk Paste</span>
              </button>
            </div>
          </div>

          {/* Bulk Paste Drawer */}
          {showBulkPaste && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-950 p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Paste team names (one per line):
              </label>
              <textarea
                rows={4}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={"TOTAL GAMING\nEVOS ESPORTS\nRRQ KAZU\nMAGIC SQUAD"}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2.5 text-xs font-mono text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(false)}
                  className="rounded px-3 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="rounded bg-neutral-800 hover:bg-neutral-700 px-4 py-1 text-xs font-bold uppercase text-white"
                >
                  Apply List
                </button>
              </div>
            </div>
          )}

          {/* Squad Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {teams.map((team, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-2"
              >
                <span className="w-6 shrink-0 text-center text-xs font-bold text-neutral-500">
                  {idx + 1}
                </span>

                <label className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border border-neutral-700 bg-neutral-950 hover:border-neutral-500 overflow-hidden">
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : (
                    <Upload className="h-3 w-3 text-neutral-500" />
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
                  className="flex-1 min-w-0 bg-transparent text-xs font-bold text-white focus:outline-none"
                  placeholder={`Squad ${idx + 1}`}
                />

                {teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(idx)}
                    className="text-neutral-500 hover:text-red-400 p-1"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddTeam}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-neutral-400" />
            <span>Add Squad</span>
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 px-6 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-colors shadow-sm"
          >
            <Trophy className="h-4 w-4" />
            <span>Create Tournament</span>
          </button>
        </div>
      </form>
    </div>
  );
};
