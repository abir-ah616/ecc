import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Save,
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Flame,
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
          className="rounded bg-red-700 px-4 py-2 text-xs font-bold uppercase text-white"
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
    const newTeam: Team = {
      id: `team_${activeTournament.id}_${Date.now()}_${nextNum}`,
      name: `Squad ${nextNum}`,
      shortCode: `S${nextNum}`,
    };
    setTeams([...teams, newTeam]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 2) return;
    setTeams(teams.filter((_, idx) => idx !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTournament(activeTournament.id, {
      name,
      mode,
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
      teams,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setCurrentTab('results');
    }, 900);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header Title */}
        <div className="rounded-lg border border-neutral-800 bg-[#12080A] p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>CREATED: {activeTournament.createdAt}</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl tracking-wider text-white uppercase font-black">
                EDIT TOURNAMENT SETTINGS
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Update tournament title, host, sponsors, game mode, and upload or edit team logos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentTab('results')}
                className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded bg-red-700 px-5 py-2 text-xs font-display tracking-wider uppercase font-black text-white hover:bg-red-600 shadow-md shadow-red-950/50 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>SAVED!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>SAVE CHANGES</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Branding */}
          <div className="rounded-lg border border-neutral-800 bg-[#14080A] p-5 space-y-4 shadow-sm">
            <h2 className="font-display text-lg tracking-wider text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Shield className="h-4 w-4 text-red-500" />
              <span>TOURNAMENT BRANDING</span>
            </h2>

            {/* Tournament Official Emblem / Logo */}
            <div className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/80 p-3.5">
              <div className="relative h-16 w-16 shrink-0 rounded-lg bg-black/90 border border-neutral-700 flex items-center justify-center overflow-hidden shadow-inner">
                {customLogoUrl ? (
                  <img
                    src={customLogoUrl}
                    alt="Tournament Logo"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <img
                    src="/assets/logo-placeholder.png"
                    alt="Default Emblem"
                    className="h-full w-full object-contain p-1 opacity-70"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Tournament Emblem / Logo
                </label>
                <p className="text-[11px] text-neutral-400 mb-2">
                  Official emblem displayed in the broadcast graphic showcase.
                </p>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors inline-flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5 text-red-400" />
                    <span>{customLogoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleTournamentLogoUpload(file);
                      }}
                    />
                  </label>

                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomLogoUrl(undefined)}
                      className="rounded border border-red-900/60 bg-red-950/40 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-colors inline-flex items-center gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reset Default</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tournament Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. FREE FIRE CHAMPIONSHIP"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Round / Phase Name
              </label>
              <input
                type="text"
                required
                value={roundOrDay}
                onChange={(e) => setRoundOrDay(e.target.value)}
                placeholder="e.g. GRAND FINALS - DAY 1"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white focus:border-red-500 focus:outline-none"
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
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sponsors / Powered By
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="e.g. RED BULL / ASUS ROG"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Toggle Team Logos On/Off */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogos}
                  onChange={(e) => setShowLogos(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-red-600 focus:ring-0"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Enable Team Logos on Graphic
                </span>
              </label>
              <p className="text-[11px] text-neutral-400 mt-1 pl-6.5">
                When enabled, logos appear directly to the left of each team name. Uncheck to hide logos and maximize name width.
              </p>
            </div>
          </div>

          {/* Card 2: Game Mode Settings */}
          <div className="rounded-lg border border-neutral-800 bg-[#14080A] p-5 space-y-4 shadow-sm">
            <h2 className="font-display text-lg tracking-wider text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Shield className="h-4 w-4 text-red-500" />
              <span>GAME MODE SETTINGS</span>
            </h2>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('SCRIM')}
                className={`rounded-lg border p-3 text-left transition-all ${
                  mode === 'SCRIM'
                    ? 'border-red-600 bg-red-950/40 text-white'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-display text-base font-bold uppercase text-red-400">
                  Mode A: Scrim
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Fixed match count. Ranking decided strictly by cumulative points.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('CHAMPION_RUSH')}
                className={`rounded-lg border p-3 text-left transition-all ${
                  mode === 'CHAMPION_RUSH'
                    ? 'border-amber-600 bg-amber-950/40 text-white'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-display text-base font-bold uppercase text-amber-400">
                  Mode B: Champion Rush
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Cross target points to activate Rush. Active team to get Booyah wins Champion.
                </div>
              </button>
            </div>

            {/* Scrim Config */}
            {mode === 'SCRIM' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Total Matches Planned
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalMatchesPlanned(num)}
                      className={`rounded py-1.5 text-xs font-bold transition-colors ${
                        totalMatchesPlanned === num
                          ? 'bg-red-700 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {num} Matches
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Champion Rush Config */}
            {mode === 'CHAMPION_RUSH' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Target Points to Activate Rush
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 60, 70].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setTargetPoints(pts)}
                        className={`rounded py-1.5 text-xs font-bold transition-colors ${
                          targetPoints === pts
                            ? 'bg-amber-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {pts} Points
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Maximum Matches Cap
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxMatches(num)}
                        className={`rounded py-1.5 text-xs font-bold transition-colors ${
                          maxMatches === num
                            ? 'bg-amber-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {num} Matches
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 border-t border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSameMatch}
                    onChange={(e) => setAllowSameMatch(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-700 bg-neutral-950 text-red-600 focus:ring-0"
                  />
                  <span className="text-xs text-neutral-300">
                    Allow same-match Booyah activation (Default OFF)
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Teams & Logo Uploads (Full Width) */}
        <div className="rounded-lg border border-neutral-800 bg-[#14080A] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="font-display text-xl tracking-wider text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-red-500" />
                <span>SQUADS &amp; LOGOS ({teams.length})</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Edit team names and upload custom logos (PNG/JPG). Logos appear to the left of each team name.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded border border-neutral-700 bg-neutral-900 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetCount(12)}
                  className={`rounded px-2.5 py-1 font-bold transition-colors ${
                    teams.length === 12
                      ? 'bg-red-700 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  12 Teams
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCount(15)}
                  className={`rounded px-2.5 py-1 font-bold transition-colors ${
                    teams.length === 15
                      ? 'bg-red-700 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  15 League
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddTeam}
                className="flex items-center gap-1.5 rounded border border-dashed border-red-700/80 bg-red-950/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Squad</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBulkPaste(true)}
                className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
              >
                Paste Squad List
              </button>

              <button
                type="button"
                onClick={handleFillDemoNames}
                className="flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900/60 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                <Flame className="h-3 w-3 text-red-500" />
                <span>Fill Sample Names</span>
              </button>
            </div>
          </div>

          {/* Bulk Paste Modal */}
          {showBulkPaste && (
            <div className="rounded border border-neutral-700 bg-neutral-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Paste Squad Names (One per line)
                </span>
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(false)}
                  className="text-neutral-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                rows={5}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder="RED CLIFF&#10;FALLEN ONES&#10;AXON BLAZE..."
                className="w-full rounded border border-neutral-800 bg-neutral-900 p-2 font-mono text-xs text-white focus:border-red-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(false)}
                  className="rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="rounded bg-red-700 px-3 py-1 text-xs font-bold text-white hover:bg-red-600"
                >
                  Apply Names
                </button>
              </div>
            </div>
          )}

          {/* Teams Grid with Image Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teams.map((team, index) => (
              <div
                key={team.id || index}
                className="flex items-center gap-2 rounded border border-neutral-800 bg-neutral-900/90 p-2 hover:border-neutral-700 transition-colors"
              >
                {/* Index Badge */}
                <span className="w-5 text-center font-display text-xs text-neutral-400 font-bold shrink-0">
                  #{index + 1}
                </span>

                {/* Team Logo Upload / Avatar */}
                <div className="relative shrink-0">
                  {team.logoUrl ? (
                    <div className="relative group/logo h-9 w-9 rounded bg-black/80 border border-neutral-700 overflow-hidden flex items-center justify-center shadow-inner">
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLogo(index)}
                        title="Remove logo"
                        className="absolute inset-0 bg-red-950/90 text-red-200 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label
                      title="Upload team logo image"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-dashed border-neutral-700 bg-neutral-950/80 text-neutral-400 hover:border-red-500 hover:text-red-400 transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(index, file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Team Name Input */}
                <input
                  type="text"
                  required
                  value={team.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder={`Squad ${index + 1}`}
                  className="flex-1 min-w-0 rounded border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-white focus:border-red-600 focus:bg-neutral-950 focus:outline-none"
                />

                {/* Delete Squad Button (if > 2 teams) */}
                {teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(index)}
                    title="Remove squad"
                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setCurrentTab('results')}
            className="rounded border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 rounded bg-red-700 px-8 py-3 text-sm font-display tracking-wider uppercase font-black text-white hover:bg-red-600 shadow-xl shadow-red-950/60 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>SAVE TOURNAMENT CHANGES</span>
          </button>
        </div>
      </form>
    </div>
  );
};
