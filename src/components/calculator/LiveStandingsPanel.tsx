import React from 'react';
import { Trophy, Zap, Crown } from 'lucide-react';
import { useTournamentStore, generateInitials } from '../../store/tournamentStore';

export const LiveStandingsPanel: React.FC = () => {
  const { getStandings, settings } = useTournamentStore();
  const { standings, tournamentConcluded, conclusionReason } =
    getStandings();

  const isRush = settings.mode === 'CHAMPION_RUSH';
  const targetPts = settings.championRush.targetPoints;

  return (
    <div className="rounded border border-neutral-800 bg-[#14080A] p-4 shadow-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="font-display text-base tracking-wider text-neutral-100">
            LIVE OVERALL STANDINGS
          </h3>
        </div>
        <span className="rounded bg-neutral-900 px-2 py-0.5 text-[11px] font-bold text-neutral-400 border border-neutral-800">
          {standings.length} TEAMS
        </span>
      </div>

      {/* Champion / Conclusion Notice */}
      {tournamentConcluded && (
        <div className="mb-3 rounded border border-amber-600/40 bg-amber-950/30 p-2.5 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
            <Crown className="h-4 w-4 text-amber-400" />
            <span>
              {conclusionReason === 'CHAMPION_CROWNED'
                ? 'CHAMPION DECLARED — TOURNAMENT CONCLUDED'
                : 'TOURNAMENT COMPLETED'}
            </span>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-0.5">
            {conclusionReason === 'CHAMPION_CROWNED'
              ? 'An active rush team captured Booyah to claim 1st place overall.'
              : 'All matches have been concluded and final standings are locked.'}
          </p>
        </div>
      )}

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-numbers">
          <thead>
            <tr className="border-b border-neutral-800/80 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              <th className="py-2 px-1 text-center w-7">#</th>
              <th className="py-2 px-2">Team</th>
              <th className="py-2 px-1.5 text-center">Booyah</th>
              <th className="py-2 px-1.5 text-center">Kills</th>
              <th className="py-2 px-1.5 text-center">Pos.</th>
              <th className="py-2 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850">
            {standings.map((team) => {
              const isChamp = team.rushStatus.status === 'CHAMPION';
              const isRushActive = team.rushStatus.status === 'ACTIVE';

              // Top 3 distinct metallic border accents
              let rankAccent = 'text-neutral-400';
              if (team.rank === 1) rankAccent = 'text-amber-400 font-extrabold';
              else if (team.rank === 2) rankAccent = 'text-neutral-300 font-bold';
              else if (team.rank === 3) rankAccent = 'text-amber-600 font-bold';

              return (
                <tr
                  key={team.teamId}
                  className={`transition-colors hover:bg-neutral-900/60 ${
                    isChamp
                      ? 'bg-amber-950/25 border-l-2 border-amber-500'
                      : isRushActive
                      ? 'bg-red-950/20'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <td className={`py-2 px-1 text-center font-display text-sm ${rankAccent}`}>
                    {team.rank}
                  </td>

                  {/* Team Info */}
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-black/60 text-[9px] font-bold text-red-400 overflow-hidden border border-neutral-800">
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
                      <div className="min-w-0 max-w-[130px] sm:max-w-[180px]">
                        <div className="truncate font-semibold text-neutral-100 text-xs">
                          {team.teamName}
                        </div>

                        {/* Rush Badge / Progress Bar */}
                        {isRush && (
                          <div className="mt-0.5">
                            {isChamp ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-400 border border-amber-500/40">
                                <Crown className="h-2.5 w-2.5" />
                                <span>Champion</span>
                              </span>
                            ) : isRushActive ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-400 border border-amber-500/30">
                                <Zap className="h-2.5 w-2.5 text-amber-400" />
                                <span>
                                  Rush Active (M{team.rushStatus.status === 'ACTIVE' ? team.rushStatus.activatedAtMatch : 1})
                                </span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="h-1 w-12 rounded-full bg-neutral-800 overflow-hidden">
                                  <div
                                    className="h-full bg-neutral-600 transition-all duration-300"
                                    style={{
                                      width: `${Math.round(team.progressToTarget * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[9px] text-neutral-500">
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
                  <td className="py-2 px-1.5 text-center text-xs font-semibold text-neutral-300">
                    X{team.booyahCount}
                  </td>

                  {/* Kills */}
                  <td className="py-2 px-1.5 text-center text-xs text-neutral-300">
                    {team.kills}
                  </td>

                  {/* Pos Pts */}
                  <td className="py-2 px-1.5 text-center text-xs text-neutral-400">
                    {team.placementPoints}
                  </td>

                  {/* Total */}
                  <td className="py-2 px-2 text-right text-xs font-bold text-neutral-100">
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
