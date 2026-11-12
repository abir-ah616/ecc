import React from 'react';
import { Trophy, Crown, Flame } from 'lucide-react';
import { useTournamentStore, generateInitials } from '../../store/tournamentStore';

export const LiveStandingsPanel: React.FC = () => {
  const { getStandings, settings, setCurrentTab } = useTournamentStore();
  const { standings, tournamentConcluded, conclusionReason } =
    getStandings();

  const isRush = settings.mode === 'CHAMPION_RUSH';
  const targetPts = settings.championRush.targetPoints;

  return (
    <div className="rounded-xl border border-neutral-800 bg-[#11131A] p-4 space-y-4 select-none shadow-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
            Live Standings
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setCurrentTab('results')}
          className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 text-[11px] font-semibold uppercase text-neutral-300 transition-colors"
        >
          <span>Graphic</span>
        </button>
      </div>

      {/* Champion / Conclusion Notice */}
      {tournamentConcluded && (
        <div className="rounded-lg border border-amber-600/40 bg-amber-950/20 p-3 text-xs text-amber-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Crown className="h-4 w-4" />
            <span>
              {conclusionReason === 'CHAMPION_CROWNED'
                ? 'Champion Declared!'
                : 'Tournament Concluded'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
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
            <tr className="border-b border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <th className="py-2 px-1 text-center w-7">#</th>
              <th className="py-2 px-2">Squad</th>
              <th className="py-2 px-1.5 text-center">Booyah</th>
              <th className="py-2 px-1.5 text-center">Kills</th>
              <th className="py-2 px-1.5 text-center">Pos</th>
              <th className="py-2 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-mono">
            {standings.map((team, idx) => {
              const isChamp = team.rushStatus.status === 'CHAMPION';
              const isRushActive = team.rushStatus.status === 'ACTIVE';

              return (
                <tr
                  key={team.teamId}
                  className={`transition-colors hover:bg-neutral-800/20 ${
                    isChamp
                      ? 'bg-amber-500/10'
                      : isRushActive
                      ? 'bg-purple-950/20'
                      : idx === 0
                      ? 'bg-amber-500/5'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2 px-1 text-center font-bold text-neutral-400">
                    {team.rank === 1 ? (
                      <span className="text-amber-400 font-extrabold">#1</span>
                    ) : (
                      <span>#{team.rank}</span>
                    )}
                  </td>

                  {/* Team Info */}
                  <td className="py-2 px-2 font-sans font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-neutral-950 text-[9px] font-bold text-neutral-300 overflow-hidden border border-neutral-800">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt=""
                            className="h-full w-full object-contain p-0.5"
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
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {isChamp ? (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 uppercase">
                                <Crown className="h-2.5 w-2.5" /> Champion
                              </span>
                            ) : isRushActive ? (
                              <span className="flex items-center gap-0.5 rounded bg-purple-950 border border-purple-800 px-1 py-0.2 text-[8px] font-bold text-purple-300 uppercase">
                                <Flame className="h-2.5 w-2.5 text-purple-400" /> Rush Active
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="h-1 w-10 rounded-full bg-neutral-800 overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500"
                                    style={{
                                      width: `${Math.min(100, (team.totalPoints / targetPts) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[8px] text-neutral-500 font-numbers font-semibold">
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
                  <td className="py-2 px-1.5 text-center font-numbers text-xs">
                    {team.booyahCount > 0 ? (
                      <span className="font-bold text-amber-400">
                        {team.booyahCount}
                      </span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </td>

                  {/* Kills */}
                  <td className="py-2 px-1.5 text-center font-numbers text-xs text-neutral-300">
                    {team.kills}
                  </td>

                  {/* Placement Pts */}
                  <td className="py-2 px-1.5 text-center font-numbers text-xs text-neutral-400">
                    {team.placementPoints}
                  </td>

                  {/* Total Pts */}
                  <td className="py-2 px-2 text-right font-numbers text-xs font-bold text-amber-400">
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
