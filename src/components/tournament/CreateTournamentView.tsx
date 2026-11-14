import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Swords, Flame, Play } from 'lucide-react';
import {
  useTournamentStore,
  generateInitials,
} from '../../store/tournamentStore';
import type { TournamentMode } from '../../types/tournament';
import {
  TournamentDetailsSection,
  FormatRulesSection,
  SquadRosterSection,
  type RosterDraftItem,
} from './TournamentFormSections';

export const CreateTournamentView: React.FC = () => {
  const { createTournament, setCurrentTab, defaultPointSystem } =
    useTournamentStore();

  const [selectedMode, setSelectedMode] = useState<TournamentMode | null>(null);

  // Event info
  const [name, setName] = useState('Free Fire Championship');
  const [roundOrDay, setRoundOrDay] = useState('Grand Finals - Day 1');
  const [hostName, setHostName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(
    undefined
  );

  // Format config
  const [totalMatchesPlanned, setTotalMatchesPlanned] = useState(6);
  const [targetPoints, setTargetPoints] = useState(80);
  const [maxMatches, setMaxMatches] = useState(8);

  // Roster
  const [teams, setTeams] = useState<RosterDraftItem[]>(
    Array.from({ length: 12 }, (_, i) => ({ name: `Squad ${i + 1}` }))
  );

  const handleSetCount = (count: number) => {
    if (count === teams.length) return;
    if (count < teams.length) {
      setTeams(teams.slice(0, count));
    } else {
      const added = Array.from({ length: count - teams.length }, (_, i) => ({
        name: `Squad ${teams.length + i + 1}`,
      }));
      setTeams([...teams, ...added]);
    }
  };

  const handleTournamentLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setCustomLogoUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setTeams((prev) =>
        prev.map((t, idx) => (idx === index ? { ...t, logoUrl: url } : t))
      );
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMode) return;

    createTournament({
      name: name.trim() || 'Free Fire Tournament',
      mode: selectedMode,
      roundOrDay: roundOrDay.trim(),
      hostName: hostName.trim(),
      sponsorName: sponsorName.trim(),
      showLogos: true,
      customLogoUrl,
      totalMatchesPlanned: Math.max(1, totalMatchesPlanned || 6),
      championRush: {
        targetPoints: Math.max(1, targetPoints || 80),
        maxMatches,
        allowSameMatchBooyahActivation: false,
      },
      teams: teams.map((t, idx) => ({
        name: t.name.trim() || `Squad ${idx + 1}`,
        logoUrl: t.logoUrl,
      })),
    });
  };

  // Step 1: Select Format
  if (!selectedMode) {
    return (
      <div className="mx-auto max-w-4xl py-4 sm:py-6 space-y-6 select-none">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Overview</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Choose Tournament Mode
          </h1>
          <p className="text-sm text-slate-400">
            Pick how matches are scored and when the tournament concludes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedMode('SCRIM')}
            className="glass-panel group rounded-2xl hover:border-white/[0.22] hover:bg-white/[0.06] p-6 text-left transition-colors flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="glass-tile flex h-11 w-11 items-center justify-center rounded-xl text-slate-200">
                  <Swords className="h-5 w-5" />
                </div>
                <span className="glass-tile rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  Standard Format
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Classic Scrim</h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                  Play a fixed set of matches. After all scheduled matches finish, highest cumulative points wins.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
                <li>• Set your own match count freely</li>
                <li>• Automatic placement & elimination point calculation</li>
                <li>• Built-in tie-breaker hierarchy</li>
              </ul>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 text-sm font-semibold text-white">
              <span>Select Classic Scrim</span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode('CHAMPION_RUSH')}
            className="glass-panel group rounded-2xl hover:border-amber-400/50 hover:bg-white/[0.06] p-6 text-left transition-colors flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-xl text-amber-400">
                  <Flame className="h-5 w-5" />
                </div>
                <span className="glass-accent rounded-md px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                  Finals Format
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Champion Rush</h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                  Squads reaching Target Points unlock Match Point status. The first activated squad to secure a Booyah wins.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
                <li>• Open custom Target Points threshold</li>
                <li>• Safety fallback Max Matches ceiling (5, 6, 7, 8, or 10)</li>
                <li>• Automatic Rush status badges in standings & posters</li>
              </ul>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 text-sm font-semibold text-amber-400">
              <span>Select Champion Rush</span>
              <ArrowRight className="h-4 w-4 transition-colors" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Configure Event & Roster
  const pointSummary = `#1 = ${
    defaultPointSystem.placementPoints[0] ?? 12
  } pts · ${defaultPointSystem.killPoints} pt/kill`;

  return (
    <form onSubmit={handleCreate} className="space-y-6 select-none">
      {/* Top Action Header */}
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedMode(null)}
            className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Change Mode</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">
              {selectedMode === 'CHAMPION_RUSH'
                ? 'New Champion Rush Event'
                : 'New Classic Scrim'}
            </h1>
            <p className="text-xs text-slate-400">
              Fill event settings and participating squads
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Start Tournament</span>
        </button>
      </div>

      {/* Main Two-Column Setup Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-5">
          <FormatRulesSection
            mode={selectedMode}
            totalMatchesPlanned={totalMatchesPlanned}
            onTotalMatchesPlannedChange={setTotalMatchesPlanned}
            targetPoints={targetPoints}
            onTargetPointsChange={setTargetPoints}
            maxMatches={maxMatches}
            onMaxMatchesChange={setMaxMatches}
            pointSystemSummary={pointSummary}
            onOpenRules={() => setCurrentTab('rules')}
          />

          <TournamentDetailsSection
            name={name}
            onNameChange={setName}
            roundOrDay={roundOrDay}
            onRoundOrDayChange={setRoundOrDay}
            hostName={hostName}
            onHostNameChange={setHostName}
            sponsorName={sponsorName}
            onSponsorNameChange={setSponsorName}
            customLogoUrl={customLogoUrl}
            onLogoUpload={handleTournamentLogoUpload}
            onClearLogo={() => setCustomLogoUrl(undefined)}
          />
        </div>

        <div className="lg:col-span-7">
          <SquadRosterSection
            teams={teams}
            onSetCount={handleSetCount}
            onAddTeam={() => {
              if (teams.length >= 24) return;
              setTeams([...teams, { name: `Squad ${teams.length + 1}` }]);
            }}
            onRemoveTeam={(idx) => {
              if (teams.length <= 2) return;
              setTeams(teams.filter((_, i) => i !== idx));
            }}
            onNameChange={(idx, val) => {
              setTeams((prev) =>
                prev.map((t, i) => (i === idx ? { ...t, name: val } : t))
              );
            }}
            onLogoUpload={handleLogoUpload}
            onBulkImport={(lines) =>
              setTeams(lines.slice(0, 24).map((l) => ({ name: l })))
            }
            getInitials={generateInitials}
          />
        </div>
      </div>

      {/* Mobile Bottom Submit CTA */}
      <div className="flex justify-end sm:hidden pt-2">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Start Tournament</span>
        </button>
      </div>
    </form>
  );
};
