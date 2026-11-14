import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose }) => {
  const { resetTournament } = useTournamentStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    resetTournament();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 select-none">
      <div className="glass-modal w-full max-w-md rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/12 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Reset Active Match Data?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clear current match results and keep squads intact
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          All placement and elimination scores recorded for the active tournament will be cleared, leaving a clean Match 1 scorecard. Saved archives in History remain unaffected.
        </p>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="glass-pill rounded-xl px-4 py-2 text-xs font-medium text-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
};
