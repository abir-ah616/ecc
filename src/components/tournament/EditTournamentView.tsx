import React, { useState } from 'react';
import { Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  useTournamentStore,
  generateInitials,
} from '../../store/tournamentStore';
import type {
  SavedSquadRecord,
  Team,
  TournamentMode,
  TournamentRecord,
} from '../../types/tournament';
import {
  compressImageFileToDataUrl,
  isPlaceholderSquadName,
  matchLogoFilenameToSquadIndex,
} from '../../lib/rosterHelpers';
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
  const {
    updateTournament,
    setCurrentTab,
    matches,
    savedSquads,
    findSavedSquadByName,
    deleteSavedSquad,
  } = useTournamentStore();

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
  const [autoResultFromScreenshot, setAutoResultFromScreenshot] = useState(
    Boolean(tournament.settings.autoResultFromScreenshot)
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    tournament.teams.map((t) => ({ ...t }))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleTournamentLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await compressImageFileToDataUrl(file, 256);
    if (dataUrl) setCustomLogoUrl(dataUrl);
  };

  const handleLogoUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = await compressImageFileToDataUrl(file, 256);
    if (!url) return;
    setTeams((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, logoUrl: url } : t))
    );
  };

  const handleBulkLogoUpload = async (files: FileList) => {
    const fileList = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (fileList.length === 0) return;

    const compressed = await Promise.all(
      fileList.map(async (f) => ({
        name: f.name,
        url: await compressImageFileToDataUrl(f, 256),
      }))
    );

    setTeams((prev) => {
      const next = prev.map((t) => ({ ...t }));
      const used = new Set<number>();
      const squadNames = next.map((t) => t.name);

      for (const item of compressed) {
        if (!item.url) continue;
        const idx = matchLogoFilenameToSquadIndex(item.name, squadNames, used);
        if (idx >= 0 && idx < next.length) {
          used.add(idx);
          next[idx] = { ...next[idx], logoUrl: item.url };
        }
      }
      return next;
    });
  };

  const handlePickSavedSquad = (sq: SavedSquadRecord) => {
    setTeams((prev) => {
      if (prev.some((t) => t.name.trim().toLowerCase() === sq.name.toLowerCase())) {
        return prev;
      }
      const placeholderIdx = prev.findIndex((t) =>
        isPlaceholderSquadName(t.name)
      );
      if (placeholderIdx >= 0) {
        return prev.map((t, idx) =>
          idx === placeholderIdx
            ? {
                ...t,
                name: sq.name,
                shortCode: sq.shortCode,
                logoUrl: sq.logoUrl,
                player1: sq.player1,
                player2: sq.player2,
                learnedTokens: sq.learnedTokens,
              }
            : t
        );
      }
      if (prev.length >= 24) return prev;
      return [
        ...prev,
        {
          id: `team_${tournament.id}_${Date.now()}_${prev.length + 1}`,
          name: sq.name,
          shortCode: sq.shortCode,
          logoUrl: sq.logoUrl,
          player1: sq.player1,
          player2: sq.player2,
          learnedTokens: sq.learnedTokens,
        },
      ];
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (autoResultFromScreenshot) {
      const missingIdx = teams.findIndex((t) => !t.player1?.trim());
      if (missingIdx >= 0) {
        const label = teams[missingIdx].name.trim() || `Squad ${missingIdx + 1}`;
        setFormError(
          `Please enter Player 1 IGN for "${label}" (Slot ${
            missingIdx + 1
          }) or turn off Screenshot Auto-Result.`
        );
        return;
      }
    }
    setFormError(null);

    updateTournament(tournament.id, {
      name: name.trim() || 'Free Fire Tournament',
      roundOrDay: roundOrDay.trim(),
      hostName: hostName.trim(),
      sponsorName: sponsorName.trim(),
      customLogoUrl,
      showLogos: tournament.settings.showLogos ?? true,
      autoResultFromScreenshot,
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
        player1: t.player1?.trim(),
        player2: t.player2?.trim(),
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
              Squads &amp; Tournament Info
            </h1>
            <p className="text-xs text-slate-400">
              Modify settings, player IGNs, or update team badges anytime
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

      {formError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/45 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

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
            autoResultFromScreenshot={autoResultFromScreenshot}
            onAutoResultFromScreenshotChange={(val) => {
              setAutoResultFromScreenshot(val);
              if (!val) setFormError(null);
            }}
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
              const vaultHit = findSavedSquadByName(val);
              setTeams((prev) =>
                prev.map((t, i) =>
                  i === idx
                    ? {
                        ...t,
                        name: val,
                        shortCode: generateInitials(val),
                        logoUrl: t.logoUrl || vaultHit?.logoUrl,
                        player1: t.player1 || vaultHit?.player1,
                        player2: t.player2 || vaultHit?.player2,
                        learnedTokens:
                          t.learnedTokens || vaultHit?.learnedTokens,
                      }
                    : t
                )
              );
            }}
            onLogoUpload={handleLogoUpload}
            onBulkLogoUpload={handleBulkLogoUpload}
            onBulkImport={(lines) =>
              setTeams(
                lines.slice(0, 24).map((l, idx) => {
                  const vaultHit = findSavedSquadByName(l);
                  return {
                    id:
                      teams[idx]?.id ||
                      `team_${tournament.id}_${Date.now()}_${idx + 1}`,
                    name: l,
                    shortCode: generateInitials(l),
                    logoUrl: teams[idx]?.logoUrl || vaultHit?.logoUrl,
                    player1: teams[idx]?.player1 || vaultHit?.player1,
                    player2: teams[idx]?.player2 || vaultHit?.player2,
                    learnedTokens:
                      teams[idx]?.learnedTokens || vaultHit?.learnedTokens,
                  };
                })
              )
            }
            getInitials={generateInitials}
            autoResultFromScreenshot={autoResultFromScreenshot}
            onPlayerChange={(idx, field, val) => {
              setTeams((prev) =>
                prev.map((t, i) => (i === idx ? { ...t, [field]: val } : t))
              );
            }}
            savedSquads={savedSquads}
            onPickSavedSquad={handlePickSavedSquad}
            onDeleteSavedSquad={deleteSavedSquad}
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
