import React from 'react';
import { Trophy, Crown, Zap } from 'lucide-react';
import { useTournamentStore, generateInitials } from '../../store/tournamentStore';

export const LiveStandingsPanel: React.FC = () => {
  const { getStandings, settings } = useTournamentStore();
  const { standings, tournamentConcluded, conclusionReason } =
    getStandings();

  const isRush = settings.mode === 'CHAMPION_RUSH';
  const targetPts = settings.championRush.targetPoints;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-sm space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Live Standings Preview
          </h3>
        </div>
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
          {standings.length} Teams
        </span>
      </div>

      {/* Champion / Conclusion Notice */}
      {tournamentConcluded && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/05 p-3 text-xs text-amber-300">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
            <Crown className="h-4 w-4" />
            <span>
              {conclusionReason === 'CHAMPION_CROWNED'
                ? 'Champion Declared!'
                : 'Tournament Concluded'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {conclusionReason === 'CHAMPION_CROWNED'
              ? 'An active rush team captured Booyah to win 1st place overall.'
              : 'All matches have been concluded and final standings are locked.'}
          </p>
        </div>
      )}

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="py-2 px-1 text-center w-7">#</th>
              <th className="py-2 px-2">Team</th>
              <th className="py-2 px-1.5 text-center">Booyah</th>
              <th className="py-2 px-1.5 text-center">Kills</th>
              <th className="py-2 px-1.5 text-center">Pos.</th>
              <th className="py-2 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-mono">
            {standings.map((team) => {
              const isChamp = team.rushStatus.status === 'CHAMPION';
              const isRushActive = team.rushStatus.status === 'ACTIVE';

              return (
                <tr
                  key={team.teamId}
                  className={`transition-colors hover:bg-white/[0.02] ${
                    isChamp
                      ? 'bg-amber-500/05'
                      : isRushActive
                      ? 'bg-amber-500/[0.03]'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2 px-1 text-center font-bold text-zinc-400">
                    {team.rank}
                  </td>

                  {/* Team Info */}
                  <td className="py-2 px-2 font-sans font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-950 text-[9px] font-bold text-zinc-300 overflow-hidden border border-white/[0.08]">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{team.shortCode || generateInitials(team.teamName)}</span>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[120px] sm:max-w-[160px]">
                        <div className="truncate text-xs">
                          {team.teamName}
                        </div>

                        {/* Rush Badge / Progress Bar */}
                        {isRush && (
                          <div className="mt-0.5">
                            {isChamp ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                                <Crown className="h-2.5 w-2.5" />
                                <span>Champion</span>
                              </span>
                            ) : isRushActive ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                                <Zap className="h-2.5 w-2.5" />
                                <span>Rush Active</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="h-1 w-10 rounded-full bg-zinc-800 overflow-hidden">
                                  <div
                                    className="h-full bg-zinc-500 transition-all duration-300"
                                    style={{
                                      width: `${Math.round(team.progressToTarget * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[9px] text-zinc-500">
                                  {team.totalPoints}/{targetPts}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Booyah */}
                  <td className="py-2 px-1.5 text-center text-xs text-zinc-400">
                    {team.booyahCount}
                  </td>

                  {/* Kills */}
                  <td className="py-2 px-1.5 text-center text-xs text-zinc-400">
                    {team.kills}
                  </td>

                  {/* Pos Pts */}
                  <td className="py-2 px-1.5 text-center text-xs text-zinc-500">
                    {team.placementPoints}
                  </td>

                  {/* Total */}
                  <td className="py-2 px-2 text-right text-xs font-bold text-white">
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
