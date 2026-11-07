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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded border border-red-700/60 bg-[#14080A] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-red-500 font-display text-lg tracking-wider">
            <AlertTriangle className="h-5 w-5" />
            <span>RESET TOURNAMENT?</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="py-4 text-xs text-neutral-300 leading-relaxed">
          This will wipe all match results and scores, restoring the default 12 demo teams and initial settings. This action cannot be undone unless you have a JSON backup.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-neutral-700 bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-red-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 shadow-sm"
          >
            Yes, Reset All
          </button>
        </div>
      </div>
    </div>
  );
};
