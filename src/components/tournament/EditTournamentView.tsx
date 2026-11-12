import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Flame,
  ClipboardList,
} from 'lucide-react';
import { useTournamentStore, generateInitials, SAMPLE_TEAM_NAMES } from '../../store/tournamentStore';
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
  const [totalMatchesPlanned, setTotalMatchesPlanned] = useState(5);
  const [targetPoints, setTargetPoints] = useState(50);
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
      setTargetPoints(activeTournament.settings.championRush?.targetPoints ?? 50);
      setMaxMatches(activeTournament.settings.championRush?.maxMatches ?? 8);
      setAllowSameMatch(activeTournament.settings.championRush?.allowSameMatchBooyahActivation ?? false);
      setShowLogos(activeTournament.settings.showLogos ?? true);
      setTeams(activeTournament.teams.map((t) => ({ ...t })));
    }
  }, [activeTournament?.id]);

  if (!activeTournament) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-3">
        <h2 className="text-lg font-bold text-white">No Tournament Selected</h2>
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950"
        >
          Return Home
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

  const handleFillDemoNames = () => {
    setTeams(
      SAMPLE_TEAM_NAMES.map((tName, idx) => ({
        id: teams[idx]?.id || `team_${activeTournament.id}_${Date.now()}_${idx + 1}`,
        name: tName,
        shortCode: generateInitials(tName),
        logoUrl: teams[idx]?.logoUrl,
      }))
    );
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

  const handleRemoveLogo = (index: number) => {
    setTeams((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, logoUrl: undefined } : t))
    );
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
    if (teams.length >= 20) return;
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
    setTimeout(() => {
      setSavedSuccess(false);
      setCurrentTab('results');
    }, 800);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Tournaments</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Edit Tournament &amp; Squads
          </h1>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mode Parameters */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#111114] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Tournament Limits
            </h2>
            <span className="rounded bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-zinc-300">
              {mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
            </span>
          </div>

          {mode === 'SCRIM' ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400">
                Total Matches Planned
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalMatchesPlanned(num)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                      totalMatchesPlanned === num
                        ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                        : 'bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {num} Matches
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Target Points */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-400">
                  Target Point Threshold
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[40, 50, 60, 70, 80, 100].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setTargetPoints(pts)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        targetPoints === pts
                          ? 'bg-amber-400 text-zinc-950 shadow-sm'
                          : 'bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {pts} PTS
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
                  <span>Custom:</span>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(Math.max(1, parseInt(e.target.value) || 50))}
                    className="w-20 rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-amber-400 text-center"
                  />
                  <span>Points</span>
                </div>
              </div>

              {/* Max Matches */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-400">
                  Max Match Cutoff
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[6, 8, 10, 12, 14].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxMatches(num)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        maxMatches === num
                          ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                          : 'bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {num} Matches
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
                  <span>Custom:</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={maxMatches}
                    onChange={(e) => setMaxMatches(Math.max(1, parseInt(e.target.value) || 8))}
                    className="w-20 rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white text-center"
                  />
                  <span>Matches</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Details & Branding */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#111114] p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Tournament Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">
                Tournament Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">
                Phase / Day Subtitle
              </label>
              <input
                type="text"
                required
                value={roundOrDay}
                onChange={(e) => setRoundOrDay(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">
                Host / Organizer
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">
                Sponsor(s)
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Tournament Logo Crest
            </label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-zinc-900 overflow-hidden text-zinc-500">
                {customLogoUrl ? (
                  <img src={customLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </div>
              <label className="cursor-pointer rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5">
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
                  className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-zinc-400 hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Squads Roster */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#111114] p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Squad Roster ({teams.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Update squad names or logos mid-tournament.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-white/[0.08] bg-zinc-950 p-1">
                {[12, 16].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSetCount(count)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      teams.length === count
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {count} Teams
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleFillDemoNames}
                className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Fill Names</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBulkPaste(!showBulkPaste)}
                className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Bulk Paste</span>
              </button>
            </div>
          </div>

          {/* Bulk Paste Drawer */}
          {showBulkPaste && (
            <div className="rounded-xl border border-white/[0.08] bg-zinc-950 p-4 space-y-2.5">
              <label className="block text-xs font-medium text-zinc-300">
                Paste Teams (One squad per line)
              </label>
              <textarea
                rows={4}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder="Team Elite&#10;Total Gaming&#10;GodLike Esports"
                className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 p-2.5 text-xs font-mono text-white focus:outline-none focus:border-zinc-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-white"
                >
                  Import List
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(false)}
                  className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Squads Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {teams.map((team, idx) => (
              <div
                key={team.id || idx}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-zinc-900/60 p-2.5 hover:border-zinc-700 transition-colors"
              >
                <span className="font-mono text-xs text-zinc-500 w-5 text-center">
                  #{idx + 1}
                </span>

                {/* Logo Uploader */}
                <div className="relative group shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 border border-white/[0.08] text-xs font-bold text-amber-400 overflow-hidden">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      team.name.slice(0, 3).toUpperCase()
                    )}
                  </div>
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                    <Upload className="h-3 w-3 text-white" />
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
                      className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-600 text-white flex items-center justify-center"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  )}
                </div>

                {/* Name */}
                <input
                  type="text"
                  required
                  value={team.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-xs font-semibold text-white focus:outline-none border-b border-transparent focus:border-zinc-500"
                />

                {teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(idx)}
                    className="text-zinc-600 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddTeam}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors pt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Squad</span>
          </button>
        </section>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-white shadow-md active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
