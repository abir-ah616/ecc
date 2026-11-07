import React, { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  AlertCircle,
  Play,
  Flame,
} from 'lucide-react';
import { useTournamentStore, SAMPLE_TEAM_NAMES, generateInitials } from '../../store/tournamentStore';

export const SetupView: React.FC = () => {
  const {
    settings,
    setSettings,
    teams,
    setTeams,
    addTeam,
    updateTeam,
    removeTeam,
    reorderTeams,
    createMatch,
    matches,
    setCurrentTab,
    loadDemoTeams,
  } = useTournamentStore();

  const [newTeamName, setNewTeamName] = useState('');
  const [teamError, setTeamError] = useState<string | null>(null);

  const handleAddTeam = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTeamName.trim();
    if (!trimmed) {
      setTeamError('Team name cannot be empty');
      return;
    }
    const duplicate = teams.some(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setTeamError(`Team "${trimmed}" already exists`);
      return;
    }
    const success = addTeam(trimmed);
    if (success) {
      setNewTeamName('');
      setTeamError(null);
    }
  };

  const handleLogoUpload = (teamId: string, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateTeam(teamId, { logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleTournamentLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSettings({ customLogoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleStartTournament = () => {
    if (matches.length === 0) {
      const matchId = createMatch();
      setCurrentTab(matchId);
    } else {
      setCurrentTab(matches[0].id);
    }
  };

  const handleSetTeamCount = (count: number) => {
    if (count === teams.length) return;
    if (count < teams.length) {
      const sliced = teams.slice(0, count);
      setTeams(sliced);
      setSettings({ teamCount: count });
    } else {
      const toAdd = count - teams.length;
      const currentNames = new Set(teams.map((t) => t.name.toLowerCase()));
      const availableSamples = SAMPLE_TEAM_NAMES.filter(
        (n) => !currentNames.has(n.toLowerCase())
      );
      const newTeams = [...teams];
      for (let i = 0; i < toAdd; i++) {
        const name = availableSamples[i] || `Team ${teams.length + i + 1}`;
        newTeams.push({
          id: `team_${Date.now()}_${i}`,
          name,
          shortCode: generateInitials(name),
        });
      }
      setTeams(newTeams);
      setSettings({ teamCount: count });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: Tournament Settings & Points (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Metadata Card */}
          <div className="rounded border border-neutral-800 bg-[#14080A] p-5 shadow-sm">
            <h2 className="font-display text-lg tracking-wider text-neutral-100 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <span>TOURNAMENT DETAILS</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Tournament Title
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ name: e.target.value })}
                  placeholder="e.g. FREE FIRE BANGLADESH CHAMPIONSHIP"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Round / Phase / Day
                </label>
                <input
                  type="text"
                  value={settings.roundOrDay}
                  onChange={(e) => setSettings({ roundOrDay: e.target.value })}
                  placeholder="e.g. GRAND FINALS - DAY 1"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Organizer / Host Name
                </label>
                <input
                  type="text"
                  value={settings.hostName || ''}
                  onChange={(e) => setSettings({ hostName: e.target.value })}
                  placeholder="e.g. BD ESPORTS ARENA"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Tournament Sponsors / Partners
                </label>
                <input
                  type="text"
                  value={settings.sponsorName || ''}
                  onChange={(e) => setSettings({ sponsorName: e.target.value })}
                  placeholder="e.g. RED BULL / ASUS ROG"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Tournament Logo */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Tournament Logo Plate (Graphic Left Side)
                </label>
                <div className="flex items-center gap-3">
                  {settings.customLogoUrl ? (
                    <div className="relative h-14 w-14 shrink-0 rounded border border-red-700/60 bg-black/60 p-1">
                      <img
                        src={settings.customLogoUrl}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setSettings({ customLogoUrl: undefined })}
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-red-700 p-0.5 text-white hover:bg-red-600"
                        title="Remove logo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-dashed border-neutral-700 bg-neutral-900 text-neutral-500">
                      <Shield className="h-6 w-6" />
                    </div>
                  )}

                  <label className="cursor-pointer rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:border-neutral-600 hover:text-white transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{settings.customLogoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleTournamentLogoUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Configuration Card */}
          <div className="rounded border border-neutral-800 bg-[#14080A] p-5 shadow-sm">
            <h2 className="font-display text-lg tracking-wider text-neutral-100 mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              <span>TOURNAMENT MODE</span>
            </h2>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setSettings({ mode: 'SCRIM' })}
                className={`rounded border p-3 text-left transition-all ${
                  settings.mode === 'SCRIM'
                    ? 'border-red-600 bg-red-950/40 text-neutral-100'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-display text-base tracking-wider text-red-400">
                  MODE A: SCRIM
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Fixed match count. Ranking strictly decided by cumulative points.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ mode: 'CHAMPION_RUSH' })}
                className={`rounded border p-3 text-left transition-all ${
                  settings.mode === 'CHAMPION_RUSH'
                    ? 'border-red-600 bg-red-950/40 text-neutral-100'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-display text-base tracking-wider text-amber-400">
                  MODE B: CHAMPION RUSH
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Cross target points to activate Rush. Active team that gets Booyah wins Champion.
                </div>
              </button>
            </div>

            {/* Mode Specific Settings */}
            {settings.mode === 'SCRIM' ? (
              <div className="space-y-3 rounded bg-neutral-900/80 p-3.5 border border-neutral-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Total Matches Planned
                </label>
                <div className="flex flex-wrap gap-2">
                  {[2, 3, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSettings({ totalMatchesPlanned: num })}
                      className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                        settings.totalMatchesPlanned === num
                          ? 'bg-red-700 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {num} Matches
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-400">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.totalMatchesPlanned}
                      onChange={(e) =>
                        setSettings({
                          totalMatchesPlanned: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)),
                        })
                      }
                      className="w-16 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-center text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded bg-neutral-900/80 p-3.5 border border-neutral-800">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Target Points to Activate Rush
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[50, 60, 70].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() =>
                          setSettings({
                            championRush: { ...settings.championRush, targetPoints: pts },
                          })
                        }
                        className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                          settings.championRush.targetPoints === pts
                            ? 'bg-amber-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {pts} Points
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-neutral-400">Custom:</span>
                      <input
                        type="number"
                        min={10}
                        max={200}
                        value={settings.championRush.targetPoints}
                        onChange={(e) =>
                          setSettings({
                            championRush: {
                              ...settings.championRush,
                              targetPoints: Math.max(10, parseInt(e.target.value) || 50),
                            },
                          })
                        }
                        className="w-16 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-center text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Max Matches Cap
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[5, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setSettings({
                            championRush: { ...settings.championRush, maxMatches: num },
                          })
                        }
                        className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                          settings.championRush.maxMatches === num
                            ? 'bg-amber-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {num} Matches
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.championRush.allowSameMatchBooyahActivation}
                      onChange={(e) =>
                        setSettings({
                          championRush: {
                            ...settings.championRush,
                            allowSameMatchBooyahActivation: e.target.checked,
                          },
                        })
                      }
                      className="mt-0.5 rounded border-neutral-700 bg-neutral-950 text-red-600 focus:ring-0"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-neutral-200">
                        Allow Same-Match Booyah Activation
                      </span>
                      <p className="text-neutral-400 text-[11px] mt-0.5">
                        Default OFF: If disabled, a team crossing the target in Match X must wait until Match X+1 to win by Booyah.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Point System Configuration Card */}
          <div className="rounded border border-neutral-800 bg-[#14080A] p-5 shadow-sm">
            <h2 className="font-display text-lg tracking-wider text-neutral-100 mb-3 flex items-center justify-between">
              <span>POINT SYSTEM SETTINGS</span>
              <span className="text-xs font-normal text-neutral-400">Official Esports Preset</span>
            </h2>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Kill Points (per kill)
              </label>
              <input
                type="number"
                min={0}
                value={settings.pointSystem.killPoints}
                onChange={(e) =>
                  setSettings({
                    pointSystem: {
                      ...settings.pointSystem,
                      killPoints: Math.max(0, parseInt(e.target.value) || 0),
                    },
                  })
                }
                className="w-24 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Placement Points Scale (1st - 15th)
              </label>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {Array.from({ length: 15 }, (_, i) => {
                  const pts = settings.pointSystem.placementPoints[i] ?? 0;
                  return (
                    <div key={i} className="rounded bg-neutral-900 border border-neutral-800 p-1">
                      <div className="text-[10px] text-neutral-400 font-semibold">#{i + 1}</div>
                      <input
                        type="number"
                        min={0}
                        value={pts}
                        onChange={(e) => {
                          const updated = [...settings.pointSystem.placementPoints];
                          updated[i] = Math.max(0, parseInt(e.target.value) || 0);
                          setSettings({
                            pointSystem: {
                              ...settings.pointSystem,
                              placementPoints: updated,
                            },
                          });
                        }}
                        className="w-full bg-transparent text-center font-bold text-neutral-100 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded bg-neutral-900/60 p-2.5 text-[11px] text-neutral-400 border border-neutral-800">
              <span className="font-semibold text-neutral-300">Tie-Break Order:</span> Total Points → Booyah Count → Placement Points → Total Kills → Last Match Placement.
            </div>
          </div>
        </div>

        {/* Right column: Teams Management (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded border border-neutral-800 bg-[#14080A] p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="font-display text-xl tracking-wider text-neutral-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-500" />
                  <span>TEAMS IN TOURNAMENT ({teams.length})</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Organizers can add, reorder, upload logos, or edit team names.
                </p>
              </div>

              {/* Quick Count Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetTeamCount(12)}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                    teams.length === 12
                      ? 'bg-red-700 text-white'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  12 Teams
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTeamCount(15)}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                    teams.length === 15
                      ? 'bg-red-700 text-white'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  15 League
                </button>
                <button
                  type="button"
                  onClick={loadDemoTeams}
                  className="rounded px-2.5 py-1 text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                >
                  Reset Names
                </button>
              </div>
            </div>

            {/* Add Team Input */}
            <form onSubmit={handleAddTeam} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => {
                    setNewTeamName(e.target.value);
                    if (teamError) setTeamError(null);
                  }}
                  placeholder="Enter new team name..."
                  className={`flex-1 rounded border bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none ${
                    teamError
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-700 focus:border-red-500'
                  }`}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded bg-red-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Team</span>
                </button>
              </div>
              {teamError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{teamError}</span>
                </div>
              )}
            </form>

            {/* Teams List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {teams.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-500">
                  No teams added yet. Add teams or click &quot;12 Teams&quot; above.
                </div>
              ) : (
                teams.map((team, index) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-2.5 rounded border border-neutral-800 bg-neutral-900/90 px-3 py-2 transition-colors hover:border-neutral-700"
                  >
                    {/* Index */}
                    <span className="w-6 text-center font-display text-sm text-neutral-400">
                      {index + 1}
                    </span>

                    {/* Logo / Avatar */}
                    <label className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded border border-neutral-700 bg-black/60 text-xs font-bold text-red-400 overflow-hidden hover:border-red-500">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{team.shortCode || generateInitials(team.name)}</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(team.id, file);
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Team Name Input */}
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                      className="flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-neutral-100 hover:border-neutral-800 focus:border-red-600 focus:bg-neutral-950 focus:outline-none"
                    />

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (index > 0) reorderTeams(index, index - 1);
                        }}
                        disabled={index === 0}
                        title="Move Up"
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (index < teams.length - 1) reorderTeams(index, index + 1);
                        }}
                        disabled={index === teams.length - 1}
                        title="Move Down"
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeTeam(team.id)}
                      title="Remove team"
                      className="rounded p-1 text-neutral-500 hover:bg-red-950/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Proceed Button */}
            <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={handleStartTournament}
                className="flex items-center gap-2 rounded bg-red-700 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-all shadow-md shadow-red-950/40"
              >
                <Play className="h-4 w-4" />
                <span>
                  {matches.length === 0 ? 'Start Match 1' : 'Proceed to Matches'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
