import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, X } from 'lucide-react';
import { getPlacementPoints } from '../../lib/scoring';
import type { PointSystemConfig, Team } from '../../types/tournament';

interface RankPickerPopoverProps {
  anchorRect: DOMRect;
  team: Team;
  teams: Team[];
  currentRank: number | null;
  nextOpenRank: number | null;
  teamByRank: Map<number, string>;
  pointSystem: PointSystemConfig;
  onSelectRank: (nextRank: number | null) => void;
  onClose: () => void;
}

export const RankPickerPopover: React.FC<RankPickerPopoverProps> = ({
  anchorRect,
  team,
  teams,
  currentRank,
  nextOpenRank,
  teamByRank,
  pointSystem,
  onSelectRank,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  const panelWidth = Math.min(284, window.innerWidth - 24);
  const estimatedHeight = Math.ceil(teams.length / 3) * 52 + 86;
  const left = Math.max(
    12,
    Math.min(anchorRect.right - panelWidth, window.innerWidth - panelWidth - 12)
  );
  const fitsBelow = anchorRect.bottom + 8 + estimatedHeight <= window.innerHeight - 12;
  const top = fitsBelow
    ? anchorRect.bottom + 8
    : Math.max(12, anchorRect.top - estimatedHeight - 8);

  const teamById = new Map(teams.map((t) => [t.id, t]));

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Select placement for ${team.name}`}
      style={{ top, left, width: panelWidth }}
      className="glass-modal fixed z-[70] rounded-2xl p-3 text-slate-100 select-none"
    >
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/[0.08]">
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-white">
            Set Rank · {team.name}
          </div>
          <div className="text-[11px] text-slate-400">
            Pick free rank or swap with an occupied slot
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close rank picker"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.08] hover:text-white cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: teams.length }, (_, idx) => idx + 1).map((rank) => {
          const isCurrent = currentRank === rank;
          const occupantId = teamByRank.get(rank);
          const occupant =
            occupantId && occupantId !== team.id
              ? teamById.get(occupantId)
              : undefined;
          const isNextOpen = !occupant && !isCurrent && nextOpenRank === rank;
          const pts = getPlacementPoints(rank, pointSystem);

          return (
            <button
              key={rank}
              type="button"
              onClick={() => {
                if (!isCurrent) {
                  onSelectRank(rank);
                }
                onClose();
              }}
              className={`flex flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center transition-colors cursor-pointer ${
                isCurrent
                  ? 'border-amber-400 bg-amber-500 text-zinc-950'
                  : isNextOpen
                  ? 'border-amber-500/60 bg-amber-500/12 text-amber-200 hover:bg-amber-500/20'
                  : occupant
                  ? 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-amber-400/50 hover:bg-white/[0.07]'
                  : 'border-white/[0.1] bg-[#0B0E14] text-white hover:border-amber-400/50 hover:bg-white/[0.06]'
              }`}
            >
              <span className="text-xs font-extrabold tabular-nums leading-tight">
                {rank === 1 ? '#1 WIN' : `#${rank}`}
              </span>
              <span
                className={`mt-0.5 max-w-full truncate text-[10px] leading-tight ${
                  isCurrent
                    ? 'text-zinc-900 font-semibold'
                    : occupant
                    ? 'text-slate-400'
                    : isNextOpen
                    ? 'text-amber-300 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {occupant ? (
                  <span className="inline-flex items-center gap-0.5 max-w-full truncate">
                    <ArrowLeftRight className="h-2.5 w-2.5 shrink-0 opacity-75" />
                    <span className="truncate">{occupant.shortCode || occupant.name}</span>
                  </span>
                ) : isNextOpen ? (
                  `Next · +${pts}p`
                ) : (
                  `+${pts}p`
                )}
              </span>
            </button>
          );
        })}
      </div>

      {currentRank !== null && (
        <button
          type="button"
          onClick={() => {
            onSelectRank(null);
            onClose();
          }}
          className="mt-2.5 w-full rounded-xl border border-rose-500/30 bg-rose-500/10 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
        >
          Clear Rank (#{currentRank})
        </button>
      )}
    </div>,
    document.body
  );
};
