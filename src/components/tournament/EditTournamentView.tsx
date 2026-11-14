import React, { useState } from 'react';
import { Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  useTournamentStore,
  generateInitials,
} from '../../store/tournamentStore';
import type { Team, TournamentMode, TournamentRecord } from '../../types/tournament';
import {
  TournamentDetailsSection,
  FormatRulesSection,
  SquadRosterSection,
} from './TournamentFormSections';

interface EditTournamentFormProps {
  tournament: TournamentRecord;
}

const EditTournamentForm: React.FC<EditTournamentFormProps> = ({
  tournament,
}) => {
  const { updateTournament, setCurrentTab, matches } = useTournamentStore();

  const [name, setName] = useState(tournament.settings.name);
  const [roundOrDay, setRoundOrDay] = useState(tournament.settings.roundOrDay);
  const [hostName, setHostName] = useState(tournament.settings.hostName || '');
  const [sponsorName, setSponsorName] = useState(
    tournament.settings.sponsorName || ''
  );
  const [mode, setMode] = useState<TournamentMode>(tournament.settings.mode);
  const [totalMatchesPlanned, setTotalMatchesPlanned] = useState(
    tournament.settings.totalMatchesPlanned
  );
  const [targetPoints, setTargetPoints] = useState(
    tournament.settings.championRush?.targetPoints ?? 80
  );
  const [maxMatches, setMaxMatches] = useState(
    tournament.settings.championRush?.maxMatches ?? 8
  );
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(
    tournament.settings.customLogoUrl
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    tournament.teams.map((t) => ({ ...t }))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

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
            id: `team_${tournament.id}_${Date.now()}_${num}`,
            name: `Squad ${num}`,
            shortCode: `S${num}`,
          };
        }
      );
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTournament(tournament.id, {
      name: name.trim() || 'Free Fire Tournament',
      roundOrDay: roundOrDay.trim(),
      hostName: hostName.trim(),
      sponsorName: sponsorName.trim(),
      customLogoUrl,
      showLogos: true,
      mode,
      totalMatchesPlanned: Math.max(1, totalMatchesPlanned || 6),
      championRush: {
        targetPoints: Math.max(1, targetPoints || 80),
        maxMatches,
        allowSameMatchBooyahActivation: false,
      },
      teams: teams.map((t, idx) => ({
        ...t,
        name: t.name.trim() || `Squad ${idx + 1}`,
        shortCode: generateInitials(t.name.trim() || `Squad ${idx + 1}`),
      })),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const fallbackTab = matches[0]?.id || 'home';

  return (
    <form onSubmit={handleSave} className="space-y-6 select-none">
      {/* Top Action Bar */}
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentTab(fallbackTab)}
            className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">
              Squads & Tournament Info
            </h1>
            <p className="text-xs text-slate-400">
              Modify settings or update team badges anytime
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved</span>
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-5">
          <FormatRulesSection
            mode={mode}
            onModeChange={setMode}
            totalMatchesPlanned={totalMatchesPlanned}
            onTotalMatchesPlannedChange={setTotalMatchesPlanned}
            targetPoints={targetPoints}
            onTargetPointsChange={setTargetPoints}
            maxMatches={maxMatches}
            onMaxMatchesChange={setMaxMatches}
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
              const nextNum = teams.length + 1;
              setTeams([
                ...teams,
                {
                  id: `team_${tournament.id}_${Date.now()}_${nextNum}`,
                  name: `Squad ${nextNum}`,
                  shortCode: `S${nextNum}`,
                },
              ]);
            }}
            onRemoveTeam={(idx) => {
              if (teams.length <= 2) return;
              setTeams(teams.filter((_, i) => i !== idx));
            }}
            onNameChange={(idx, val) => {
              setTeams((prev) =>
                prev.map((t, i) =>
                  i === idx
                    ? { ...t, name: val, shortCode: generateInitials(val) }
                    : t
                )
              );
            }}
            onLogoUpload={handleLogoUpload}
            onBulkImport={(lines) =>
              setTeams(
                lines.slice(0, 24).map((l, idx) => ({
                  id:
                    teams[idx]?.id ||
                    `team_${tournament.id}_${Date.now()}_${idx + 1}`,
                  name: l,
                  shortCode: generateInitials(l),
                  logoUrl: teams[idx]?.logoUrl,
                }))
              )
            }
            getInitials={generateInitials}
          />
        </div>
      </div>
    </form>
  );
};

export const EditTournamentView: React.FC = () => {
  const { getActiveTournament, setCurrentTab } = useTournamentStore();
  const activeTournament = getActiveTournament();

  if (!activeTournament) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center space-y-4">
        <h2 className="text-lg font-semibold text-white">
          No Active Tournament Selected
        </h2>
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          Back to Overview
        </button>
      </div>
    );
  }

  return (
    <EditTournamentForm key={activeTournament.id} tournament={activeTournament} />
  );
};
