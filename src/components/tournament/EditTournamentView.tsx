import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
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
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h2 className="font-display text-2xl text-white">NO TOURNAMENT SELECTED</h2>
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="rounded-xl bg-red-700 px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-red-600"
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-[#161017] via-[#0F0C12] to-[#0A080C] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Tournaments</span>
            </button>
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wider text-white">
              Edit Tournament &amp; Squads
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Modifying active tournament &quot;{activeTournament.name}&quot;
            </p>
          </div>

          {savedSuccess && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 px-4 py-2 text-xs font-bold text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Changes Saved!</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Mode & Parameters */}
        <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
              Tournament Mode &amp; Limits
            </h2>
            <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs font-bold text-neutral-300">
              {mode === 'CHAMPION_RUSH' ? 'CHAMPION RUSH' : 'SCRIM'}
            </span>
          </div>

          {mode === 'SCRIM' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Total Matches Planned
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalMatchesPlanned(num)}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                      totalMatchesPlanned === num
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {num} Matches
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Target Points with set buttons & custom input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Target Point Threshold
                </label>
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
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-neutral-400">Custom Amount:</span>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(Math.max(1, parseInt(e.target.value) || 50))}
                    className="w-24 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-black text-amber-400 text-center"
                  />
                </div>
              </div>

              {/* Max Matches with set buttons & custom input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Max Match Cutoff
                </label>
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
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-neutral-400">Custom Max:</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={maxMatches}
                    onChange={(e) => setMaxMatches(Math.max(1, parseInt(e.target.value) || 8))}
                    className="w-24 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-black text-white text-center"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Details & Branding */}
        <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-neutral-800/80 pb-3">
            <Shield className="h-5 w-5 text-red-500" />
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
              Tournament Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tournament Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Phase / Day Subtitle
              </label>
              <input
                type="text"
                required
                value={roundOrDay}
                onChange={(e) => setRoundOrDay(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Host / Organizer
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
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
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Crest Logo Upload */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Tournament Crest Logo
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

        {/* Squads Roster */}
        <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-red-500" />
              <div>
                <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
                  Participating Squads ({teams.length})
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Update squad names or upload logos anytime during the tournament.
                </p>
              </div>
            </div>

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
                key={team.id || idx}
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
          </div>
        </section>

        {/* BOTTOM ACTION BAR */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-neutral-700/80 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-3 text-sm font-display font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/80 hover:from-red-500 hover:to-rose-500 active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Save Tournament Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
