import React, { useMemo, useState } from 'react';
import {
  X,
  ScanLine,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Users,
} from 'lucide-react';
import type { Team } from '../../types/tournament';
import { useAuthStore } from '../../store/authStore';
import { resolveSquadPlayers } from '../../lib/rosterHelpers';
import {
  extractLearnableTokens,
  matchScannedRowsToTeams,
  scanMatchScreenshotsWithAi,
  type MatchedScanRow,
  type ScannedRankRow,
} from '../../lib/screenshotScanner';
import { SquadPlayersModal } from './SquadPlayersModal';

interface ScanScreenshotModalProps {
  isOpen: boolean;
  matchNumber: number;
  teams: Team[];
  autoResultFromScreenshot: boolean;
  onClose: () => void;
  onUpdatePlayers: (updatedTeams: Team[], autoResultEnabled: boolean) => void;
  onApply: (
    entries: Array<{ teamId: string; placement: number | null; kills: number }>,
    learnedByTeamId: Record<string, string[]>
  ) => void;
}

interface ReviewRankDraft {
  rank: number;
  teamId: string;
  kills: number;
  rawPlayerText: string;
  normalizedTokens: string[];
  isEdgeClipped: boolean;
  matchedKeyword?: string;
}

export const ScanScreenshotModal: React.FC<ScanScreenshotModalProps> = ({
  isOpen,
  matchNumber,
  teams,
  autoResultFromScreenshot,
  onClose,
  onUpdatePlayers,
  onApply,
}) => {
  const { allowedRecord, isAdmin, setAdminDashboardOpen } = useAuthStore();

  const [files, setFiles] = useState<File[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draftRows, setDraftRows] = useState<ReviewRankDraft[] | null>(null);
  const [isPlayersOpen, setIsPlayersOpen] = useState(false);

  const assignedKeys = allowedRecord?.aiApiKeys || [];
  const hasQuotaConfigured = assignedKeys.length > 0;

  const squadsWithPlayersCount = useMemo(
    () => teams.filter((t) => resolveSquadPlayers(t).length > 0).length,
    [teams]
  );

  const duplicateTeamIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of draftRows || []) {
      if (!row.teamId) continue;
      counts.set(row.teamId, (counts.get(row.teamId) || 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [id, c] of counts.entries()) {
      if (c > 1) dupes.add(id);
    }
    return dupes;
  }, [draftRows]);

  if (!isOpen) return null;

  const handleSelectFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const picked = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 3);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked].slice(0, 3));
    setError(null);
  };

  const handleRunScan = async () => {
    if (files.length === 0 || scanning) return;

    setScanning(true);
    setError(null);
    setProgressVal(0.1);
    setProgressMsg('Connecting to AI Vision (Beta)...');

    try {
      const scanned: MatchedScanRow[] = await scanMatchScreenshotsWithAi(
        files,
        teams,
        assignedKeys,
        (msg, frac) => {
          setProgressMsg(msg);
          setProgressVal(frac);
        }
      );

      const byRank = new Map<number, MatchedScanRow>();
      for (const item of scanned) {
        byRank.set(item.rank, item);
      }

      const fullRows: ReviewRankDraft[] = Array.from(
        { length: teams.length },
        (_, idx) => {
          const rank = idx + 1;
          const hit = byRank.get(rank);
          return {
            rank,
            teamId: hit?.matchedTeamId || '',
            kills: hit?.kills ?? 0,
            rawPlayerText: hit?.rawPlayerText || '',
            normalizedTokens: hit?.normalizedTokens || [],
            isEdgeClipped: Boolean(hit?.isEdgeClipped),
            matchedKeyword: hit?.matchedKeyword,
          };
        }
      );

      // Auto-fill last remaining squad if 11 of 12 matched cleanly
      const assignedIds = new Set(
        fullRows.map((r) => r.teamId).filter(Boolean)
      );
      const emptyRows = fullRows.filter((r) => !r.teamId);
      const leftTeams = teams.filter((t) => !assignedIds.has(t.id));
      if (emptyRows.length === 1 && leftTeams.length === 1) {
        emptyRows[0].teamId = leftTeams[0].id;
      }

      setDraftRows(fullRows);
      if (scanned.length === 0) {
        setError(
          'No Free Fire rank cards were detected. Upload full-screen post-match scoreboard screenshots (#1-#12).'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI scan could not complete right now. Please try again.'
      );
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmApply = () => {
    if (!draftRows) return;
    if (duplicateTeamIds.size > 0) {
      setError(
        'Each squad can only appear once. Resolve duplicate squad selections highlighted in red.'
      );
      return;
    }

    const entriesByTeam = new Map<
      string,
      { teamId: string; placement: number | null; kills: number }
    >();
    for (const t of teams) {
      entriesByTeam.set(t.id, { teamId: t.id, placement: null, kills: 0 });
    }

    const learnedByTeamId: Record<string, string[]> = {};
    for (const row of draftRows) {
      if (!row.teamId) continue;
      entriesByTeam.set(row.teamId, {
        teamId: row.teamId,
        placement: row.rank,
        kills: Math.max(0, row.kills),
      });
      const learnable = extractLearnableTokens(row);
      if (learnable.length > 0) {
        learnedByTeamId[row.teamId] = learnable;
      }
    }

    onApply(Array.from(entriesByTeam.values()), learnedByTeamId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 select-none">
      <div className="glass-modal flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="glass-accent flex h-10 w-10 items-center justify-center rounded-xl text-amber-400">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  AI Auto Standings · Match {matchNumber}
                </h3>
                <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Beta
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Attach 1-2 Free Fire result screenshots (top #1-#11 + scrolled #7-#12 merge automatically).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlayersOpen(true)}
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Edit Players ({squadsWithPlayersCount}/{teams.length})
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close screenshot scanner"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasQuotaConfigured && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-400/45 bg-amber-500/10 p-4">
              <div className="text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-amber-300">
                  AI Auto Standings (Beta) Setup Pending:{' '}
                </span>
                {isAdmin
                  ? 'Assign one or more AI API keys to your account in Admin Dashboard -> AI / API Management.'
                  : 'Your AI scan quota has not been activated yet. Please contact an administrator.'}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setAdminDashboardOpen(true);
                  }}
                  className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
                >
                  Open AI Management
                </button>
              )}
            </div>
          )}

          {(!autoResultFromScreenshot || squadsWithPlayersCount === 0) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-400/35 bg-amber-500/[0.08] p-3.5">
              <div className="text-xs text-amber-100/90 leading-relaxed">
                <span className="font-semibold text-amber-300">
                  {!autoResultFromScreenshot
                    ? 'Auto-Match is currently off: '
                    : 'No player IGNs added yet: '}
                </span>
                Add 1 or more team member IGNs per squad so AI assigns ranks automatically (or assign once in Match 1 to auto-learn for next matches).
              </div>
              <button
                type="button"
                onClick={() => setIsPlayersOpen(true)}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                <span>
                  {!autoResultFromScreenshot
                    ? 'Turn On & Add Players'
                    : 'Add Team Members'}
                </span>
              </button>
            </div>
          )}

          {/* File Drop / Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">
                {files.length === 0
                  ? 'Select 1 to 3 Free Fire result screenshots'
                  : `${files.length} screenshot(s) ready`}
              </div>
              {files.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {files.map((f, idx) => (
                    <span
                      key={`${f.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0D1017] px-2.5 py-1 text-[11px] text-slate-200"
                    >
                      <span className="truncate max-w-[150px]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Tip: Upload 2 screenshots per match (top #1-#11 + scrolled #7-#12) so Rank #11&apos;s bottom players &amp; Rank #12 are 100% visible.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {files.length < 3 && (
                <label className="glass-pill inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {files.length === 0 ? 'Choose Images' : 'Add Page'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleSelectFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}

              <button
                type="button"
                disabled={files.length === 0 || scanning || !hasQuotaConfigured}
                onClick={handleRunScan}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
              >
                {scanning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="h-3.5 w-3.5" />
                    <span>{draftRows ? 'Re-Scan' : 'AI Scan'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {scanning && (
            <div className="glass-tile rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{progressMsg}</span>
                <span className="tabular-nums font-semibold text-amber-400">
                  {Math.round(progressVal * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-amber-500 transition-all duration-200"
                  style={{ width: `${Math.round(progressVal * 100)}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Review Table */}
          {draftRows && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Review &amp; assign any unmatched squads (auto-learns player IGNs for next matches)
                </span>
                <span className="text-emerald-400 font-semibold tabular-nums">
                  {draftRows.filter((r) => Boolean(r.teamId)).length}/{teams.length} matched
                </span>
              </div>

              <div className="space-y-1.5">
                {draftRows.map((row, idx) => {
                  const isDupe =
                    Boolean(row.teamId) && duplicateTeamIds.has(row.teamId);
                  const isUnmatched = !row.teamId;

                  return (
                    <div
                      key={row.rank}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border p-2.5 ${
                        isDupe
                          ? 'border-rose-500/60 bg-rose-950/25'
                          : isUnmatched
                          ? 'border-amber-500/40 bg-amber-500/[0.06]'
                          : 'border-white/[0.08] bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`flex h-8 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold tabular-nums ${
                            row.rank === 1
                              ? 'bg-amber-500 text-zinc-950'
                              : 'glass-input text-white'
                          }`}
                        >
                          #{row.rank}
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          <select
                            value={row.teamId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftRows((prev) =>
                                prev
                                  ? prev.map((r, i) =>
                                      i === idx ? { ...r, teamId: val } : r
                                    )
                                  : prev
                              );
                            }}
                            className="glass-input w-full rounded-lg bg-[#0D1017] px-2.5 py-1.5 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                          >
                            <option value="">-- Select Squad Manually --</option>
                            {teams.map((tm) => (
                              <option key={tm.id} value={tm.id}>
                                {tm.name}
                              </option>
                            ))}
                          </select>

                          {row.rawPlayerText && (
                            <div className="truncate text-[10.5px] text-slate-400">
                              Players: {row.rawPlayerText}
                            </div>
                          )}
                          {row.isEdgeClipped && (
                            <div className="text-[10.5px] font-medium text-amber-300">
                              Bottom row clipped in screenshot — verify kills or add scrolled screenshot #2
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400">Kills</span>
                        <div className="glass-input inline-flex items-center rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setDraftRows((prev) =>
                                prev
                                  ? prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            kills: Math.max(0, r.kills - 1),
                                          }
                                        : r
                                    )
                                  : prev
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={row.kills}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const k = parseInt(e.target.value, 10);
                              setDraftRows((prev) =>
                                prev
                                  ? prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            kills:
                                              Number.isNaN(k) || k < 0 ? 0 : k,
                                          }
                                        : r
                                    )
                                  : prev
                              );
                            }}
                            className="h-7 w-10 bg-transparent text-center text-xs font-bold text-white tabular-nums focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraftRows((prev) =>
                                prev
                                  ? prev.map((r, i) =>
                                      i === idx
                                        ? { ...r, kills: r.kills + 1 }
                                        : r
                                    )
                                  : prev
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="glass-pill rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!draftRows || duplicateTeamIds.size > 0}
            onClick={handleConfirmApply}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 px-5 py-2.5 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>Apply Results &amp; Auto-Learn</span>
          </button>
        </div>
      </div>

      {isPlayersOpen && (
        <SquadPlayersModal
          isOpen={isPlayersOpen}
          teams={teams}
          autoResultFromScreenshot={autoResultFromScreenshot}
          onClose={() => setIsPlayersOpen(false)}
          onSave={(updatedTeams, nextAuto) => {
            onUpdatePlayers(updatedTeams, nextAuto);
            setDraftRows((prev) => {
              if (!prev) return prev;
              const scannedLike: ScannedRankRow[] = prev.map((r) => ({
                rank: r.rank,
                kills: r.kills,
                rawPlayerText: r.rawPlayerText,
                normalizedTokens: r.normalizedTokens,
                confidence: 95,
                isEdgeClipped: r.isEdgeClipped,
                sourceImageIndex: 0,
              }));
              const rematched = matchScannedRowsToTeams(
                scannedLike,
                updatedTeams
              );
              const byRank = new Map(rematched.map((m) => [m.rank, m]));
              const usedTeams = new Set(
                prev.map((r) => r.teamId).filter(Boolean)
              );
              return prev.map((r) => {
                if (r.teamId) return r;
                const hit = byRank.get(r.rank);
                if (hit?.matchedTeamId && !usedTeams.has(hit.matchedTeamId)) {
                  usedTeams.add(hit.matchedTeamId);
                  return {
                    ...r,
                    teamId: hit.matchedTeamId,
                    matchedKeyword: hit.matchedKeyword,
                  };
                }
                return r;
              });
            });
          }}
        />
      )}
    </div>
  );
};
