import React from 'react';
import { Trophy, Crown, Flame, Image as ImageIcon } from 'lucide-react';
import {
  useTournamentStore,
  generateInitials,
} from '../../store/tournamentStore';

export const LiveStandingsPanel: React.FC = () => {
  const { getStandings, settings, matches, setCurrentTab } = useTournamentStore();
  const { standings, tournamentConcluded, conclusionReason } = getStandings();
  const hasDraftMatch = matches.some((m) => !m.isCompleted);

  const isRush = settings.mode === 'CHAMPION_RUSH';
  const targetPts = settings.championRush.targetPoints;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Overall Standings</h3>
          </div>
          {hasDraftMatch && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              Totals update when a match is saved
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCurrentTab('results')}
          className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors"
        >
          <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
          <span>Poster</span>
        </button>
      </div>

      {/* Tournament Concluded Notice */}
      {tournamentConcluded && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <Crown className="h-4 w-4" />
            <span>
              {conclusionReason === 'CHAMPION_CROWNED'
                ? 'Champion Crowned'
                : 'Tournament Concluded'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {conclusionReason === 'CHAMPION_CROWNED'
              ? 'An eligible Match Point squad secured Booyah to clinch the title.'
              : 'All scheduled matches are complete and standings are finalized.'}
          </p>
        </div>
      )}

      {/* Standings List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] font-medium text-slate-400">
              <th className="py-2 px-1 w-8 text-center">#</th>
              <th className="py-2 px-2">Squad</th>
              <th className="py-2 px-1.5 text-center" title="Booyahs">
                W
              </th>
              <th className="py-2 px-1.5 text-center" title="Kills">
                K
              </th>
              <th className="py-2 px-1.5 text-center" title="Placement Points">
                Pos
              </th>
              <th className="py-2 pl-2 pr-1 text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {standings.map((team, idx) => {
              const isChamp = team.rushStatus.status === 'CHAMPION';
              const isRushActive = team.rushStatus.status === 'ACTIVE';

              return (
                <tr
                  key={team.teamId}
                  className={
                    isChamp
                      ? 'bg-amber-500/14'
                      : isRushActive
                      ? 'bg-amber-500/[0.08]'
                      : idx === 0
                      ? 'bg-white/[0.04]'
                      : ''
                  }
                >
                  <td className="py-2.5 px-1 text-center font-bold tabular-nums">
                    <span
                      className={
                        team.rank === 1 ? 'text-amber-400' : 'text-slate-400'
                      }
                    >
                      {team.rank}
                    </span>
                  </td>

                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="glass-input flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[10px] font-bold text-slate-300">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt=""
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : (
                          <span>
                            {team.shortCode || generateInitials(team.teamName)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 max-w-[140px]">
                        <div className="truncate font-medium text-white">
                          {team.teamName}
                        </div>

                        {isRush && (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {isChamp ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-400">
                                <Crown className="h-2.5 w-2.5" /> Champion
                              </span>
                            ) : isRushActive ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-amber-300">
                                <Flame className="h-2.5 w-2.5" /> Match Point
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="h-1 w-10 overflow-hidden rounded-full bg-[#242A38]">
                                  <div
                                    className="h-full bg-amber-500"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        (team.totalPoints /
                                          Math.max(1, targetPts)) *
                                          100
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500 tabular-nums">
                                  {team.totalPoints}/{targetPts}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-1.5 text-center tabular-nums">
                    {team.booyahCount > 0 ? (
                      <span className="font-semibold text-amber-400">
                        {team.booyahCount}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-2.5 px-1.5 text-center tabular-nums text-slate-300">
                    {team.kills}
                  </td>

                  <td className="py-2.5 px-1.5 text-center tabular-nums text-slate-400">
                    {team.placementPoints}
                  </td>

                  <td className="py-2.5 pl-2 pr-1 text-right font-bold tabular-nums text-white">
                    {team.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
