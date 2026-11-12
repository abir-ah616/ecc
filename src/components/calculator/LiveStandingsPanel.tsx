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
    <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#121522] to-[#0E1019] p-5 sm:p-6 shadow-2xl space-y-5 select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white">
            LIVE LEADERBOARD RADAR
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setCurrentTab('results')}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 transition-all"
        >
          <span>4K GRAPHIC</span>
        </button>
      </div>

      {/* Champion / Conclusion Notice */}
      {tournamentConcluded && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent p-4 text-xs text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-2 font-display text-base font-black tracking-wider text-amber-400">
            <Crown className="h-5 w-5" />
            <span>
              {conclusionReason === 'CHAMPION_CROWNED'
                ? 'CHAMPION CROWNED!'
                : 'TOURNAMENT CONCLUDED'}
            </span>
          </div>
          <p className="text-xs font-semibold text-neutral-300 mt-1">
            {conclusionReason === 'CHAMPION_CROWNED'
              ? 'Active rush team claimed Booyah to seal 1st place overall.'
              : 'All matches have been concluded and official standings are finalized.'}
          </p>
        </div>
      )}

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-neutral-400">
              <th className="py-2.5 px-1.5 text-center w-8">#</th>
              <th className="py-2.5 px-2">Squad</th>
              <th className="py-2.5 px-2 text-center">Booyah</th>
              <th className="py-2.5 px-2 text-center">Kills</th>
              <th className="py-2.5 px-2 text-center">Pos</th>
              <th className="py-2.5 px-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((team, idx) => {
              const isChamp = team.rushStatus.status === 'CHAMPION';
              const isRushActive = team.rushStatus.status === 'ACTIVE';

              return (
                <tr
                  key={team.teamId}
                  className={`transition-colors hover:bg-white/5 ${
                    isChamp
                      ? 'bg-amber-500/15'
                      : isRushActive
                      ? 'bg-purple-950/30'
                      : idx === 0
                      ? 'bg-amber-500/5'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-1.5 text-center font-numbers text-sm font-black">
                    {team.rank === 1 ? (
                      <span className="text-amber-400 drop-shadow-[0_0_8px_#FACC15]">#1</span>
                    ) : team.rank === 2 ? (
                      <span className="text-neutral-300">#2</span>
                    ) : team.rank === 3 ? (
                      <span className="text-amber-600">#3</span>
                    ) : (
                      <span className="text-neutral-500 font-bold">#{team.rank}</span>
                    )}
                  </td>

                  {/* Team Info */}
                  <td className="py-2.5 px-2 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/60 text-[10px] font-black text-amber-300 overflow-hidden border border-white/10">
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
                      <div className="min-w-0 max-w-[130px] sm:max-w-[170px]">
                        <div className="truncate text-xs sm:text-sm font-bold text-white">
                          {team.teamName}
                        </div>

                        {/* Rush Badge / Progress Bar */}
                        {isRush && (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {isChamp ? (
                              <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-400 uppercase">
                                <Crown className="h-3 w-3" /> CHAMPION
                              </span>
                            ) : isRushActive ? (
                              <span className="flex items-center gap-0.5 rounded bg-purple-500/20 px-1 py-0.2 text-[9px] font-black text-purple-300 uppercase">
                                <Flame className="h-3 w-3 text-purple-400" /> RUSH ACTIVE
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500"
                                    style={{
                                      width: `${Math.min(100, (team.totalPoints / targetPts) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[9px] text-neutral-400 font-numbers font-semibold">
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
                  <td className="py-2.5 px-2 text-center font-numbers font-bold text-xs">
                    {team.booyahCount > 0 ? (
                      <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-amber-400 font-black">
                        {team.booyahCount}
                      </span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </td>

                  {/* Kills */}
                  <td className="py-2.5 px-2 text-center font-numbers font-bold text-xs text-neutral-300">
                    {team.kills}
                  </td>

                  {/* Placement Pts */}
                  <td className="py-2.5 px-2 text-center font-numbers font-bold text-xs text-neutral-400">
                    {team.placementPoints}
                  </td>

                  {/* Total Pts */}
                  <td className="py-2.5 px-2.5 text-right font-numbers text-sm sm:text-base font-black text-amber-300">
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
