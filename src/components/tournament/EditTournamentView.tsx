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
      setTeams(activeTournament.teams.map((t) => ({ ...t })));
    }
  }, [activeTournament?.id]);

  if (!activeTournament) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-3">
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
          No Tournament Selected
        </h2>
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Dashboard
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
      showLogos: true,
      mode,
      totalMatchesPlanned,
      championRush: {
        targetPoints,
        maxMatches,
        allowSameMatchBooyahActivation: false,
      },
      teams,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-[#11131A] p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-neutral-400" />
            <span>Dashboard</span>
          </button>
          <span className="font-display text-lg font-bold uppercase tracking-wider text-white">
            Edit Tournament &amp; Squads
          </span>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-950/60 border border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Changes Saved</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Host / Organizer
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sponsor / Partner
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Tournament Logo
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
            {mode === 'CHAMPION_RUSH' ? 'Champion Rush Settings' : 'Match Series Settings'}
          </h2>

          {mode === 'SCRIM' ? (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Number of Matches Planned
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Target Points: direct input */}
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
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-neutral-500"
                />
                <p className="text-[11px] text-neutral-500 font-medium">
                  Points needed to unlock rush status. (e.g. 50, 75, 80, 100).
                </p>
              </div>

              {/* Max Matches: 5, 6, 7, 8, 10 or custom */}
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
                key={team.id || idx}
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
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
