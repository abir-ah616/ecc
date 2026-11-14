import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose }) => {
  const { exportJson, importJson } = useTournamentStore();
  const [importText, setImportText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonData = exportJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esp-calc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste valid backup JSON first.',
      });
      return;
    }

    const restored = importJson(importText);
    if (restored) {
      setStatusMessage({
        type: 'success',
        text: 'Backup restored cleanly.',
      });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
        setImportText('');
      }, 1000);
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Invalid JSON structure. Verify backup file contents.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) setImportText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 select-none">
      <div className="glass-modal w-full max-w-2xl rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="glass-tile flex h-10 w-10 items-center justify-center rounded-xl text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Backup & Restore Data
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export active tournament records or import a JSON backup.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close backup modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Export */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Export Backup
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-2.5 py-1 text-xs font-semibold text-zinc-950 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={jsonData}
              rows={9}
              className="glass-input w-full rounded-xl p-3 font-mono text-[11px] text-slate-300 focus:outline-none"
            />
          </div>

          {/* Import */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Restore Backup
              </h4>

              <label className="glass-pill inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors">
                <Upload className="h-3 w-3 text-slate-400" />
                <span>Load File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported JSON here..."
              rows={9}
              className="glass-input w-full rounded-xl p-3 font-mono text-[11px] text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="glass-pill rounded-xl px-4 py-2 text-xs font-medium text-slate-200 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-40 transition-colors"
          >
            Restore Data
          </button>
        </div>
      </div>
    </div>
  );
};
