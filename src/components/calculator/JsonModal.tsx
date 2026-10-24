import React, { useState } from 'react';
import { Download, Upload, Copy, Check, X, AlertCircle } from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose }) => {
  const { exportJson, importJson } = useTournamentStore();
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentJson = exportJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setError(null);
    setSuccessMsg(null);
    if (!jsonText.trim()) {
      setError('Please paste JSON data to import.');
      return;
    }
    const success = importJson(jsonText);
    if (success) {
      setSuccessMsg('Tournament successfully restored!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setError('Invalid JSON format or corrupted tournament schema.');
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded border border-neutral-800 bg-[#14080A] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <h3 className="font-display text-lg tracking-wider text-neutral-100 flex items-center gap-2">
            <Download className="h-5 w-5 text-red-500" />
            <span>EXPORT / IMPORT TOURNAMENT DATA</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Export Section */}
        <div className="py-3 border-b border-neutral-800">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
            Backup Current Tournament
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied JSON!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 rounded border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .json file</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Restore from Backup
            </span>
            <label className="cursor-pointer text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload file</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={5}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste your tournament JSON here..."
            className="w-full rounded border border-neutral-700 bg-neutral-950 p-2.5 font-mono text-[11px] text-neutral-200 placeholder-neutral-600 focus:border-red-500 focus:outline-none"
          />

          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-700 bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="flex items-center gap-1.5 rounded bg-red-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Restore Tournament</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
