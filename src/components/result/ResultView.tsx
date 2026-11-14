import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Copy,
  Check,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateSingleMatchStandings } from '../../lib/scoring';
import { ResultGraphic } from './ResultGraphic';
import type {
  AspectRatioMode,
  StandingsViewMode,
  ThemePreset,
} from '../../types/tournament';

const GRAPHIC_THEMES: {
  id: ThemePreset;
  label: string;
  swatchColor: string;
}[] = [
  { id: 'v2', label: 'FF Yellow', swatchColor: '#F59E0B' },
  { id: 'blue', label: 'Arctic Cyan', swatchColor: '#06B6D4' },
  { id: 'gold', label: 'Cyber Rose', swatchColor: '#FF2A6D' },
  { id: 'eclipse', label: 'Imperial Gold', swatchColor: '#EAB308' },
  { id: 'crimson', label: 'Crimson Blade', swatchColor: '#E02A36' },
  { id: 'emerald', label: 'Emerald Street', swatchColor: '#10B981' },
  { id: 'violet', label: 'Violet Prism', swatchColor: '#8B5CF6' },
];

export const ResultView: React.FC = () => {
  const {
    teams,
    matches,
    settings,
    setSettings,
    getStandings,
    getActiveTournament,
    setCurrentTab,
    endTournament,
    reopenTournament,
  } = useTournamentStore();

  const activeTournament = getActiveTournament();
  const [viewMode, setViewMode] = useState<StandingsViewMode>('OVERALL');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matches[matches.length - 1]?.id || ''
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('16:9');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewStageRef = useRef<HTMLDivElement>(null);
  const graphicRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(800);

  // Dynamically measure preview box width for fluid responsive scaling on any screen
  useEffect(() => {
    const node = previewStageRef.current;
    if (!node) return;

    const updateWidth = () => {
      const nextWidth = node.clientWidth;
      if (nextWidth > 0) {
        setStageWidth(nextWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const selectedMatch =
    matches.find((m) => m.id === selectedMatchId) ||
    matches[matches.length - 1] ||
    matches[0];

  const completedMatches = useMemo(
    () => matches.filter((m) => m.isCompleted),
    [matches]
  );

  const overallResult = getStandings();
  const singleMatchStandings = useMemo(() => {
    if (!selectedMatch) return overallResult.standings;
    return calculateSingleMatchStandings(
      teams,
      selectedMatch,
      settings.pointSystem,
      settings.tieBreakOrder
    );
  }, [teams, selectedMatch, settings, overallResult.standings]);

  const activeStandings =
    viewMode === 'SINGLE_MATCH' ? singleMatchStandings : overallResult.standings;

  const isTournamentEnded = Boolean(
    activeTournament?.isEnded ||
      settings.isManuallyEnded ||
      overallResult.tournamentConcluded
  );

  const designWidth = aspectRatio === '4:5' ? 1080 : 1920;
  const designHeight = aspectRatio === '4:5' ? 1350 : 1080;

  // Keep portrait graphics comfortably bounded on large desktops while fitting mobile 100%
  const maxAllowedStageWidth =
    aspectRatio === '4:5' ? Math.min(stageWidth, 540) : stageWidth;
  const previewScale = Math.min(1, maxAllowedStageWidth / designWidth);
  const scaledHeight = Math.round(designHeight * previewScale);
  const scaledWidth = Math.round(designWidth * previewScale);

  const getExportOptions = () => ({
    width: designWidth,
    height: designHeight,
    canvasWidth: designWidth * 2,
    canvasHeight: designHeight * 2,
    pixelRatio: 2,
    cacheBust: true,
    quality: 1,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      width: `${designWidth}px`,
      height: `${designHeight}px`,
    },
  });

  const handleDownloadPng = async () => {
    try {
      setIsExporting(true);
      setStatusMsg('Preparing high-resolution PNG...');
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((r) => setTimeout(r, 150));

      const targetNode = exportRef.current || graphicRef.current;
      if (!targetNode) return;

      const dataUrl = await toPng(targetNode, getExportOptions());
      const a = document.createElement('a');
      const slug = settings.name.toLowerCase().replace(/\s+/g, '-') || 'standings';
      const filename = `freefire-${slug}-${
        viewMode === 'SINGLE_MATCH'
          ? `match-${selectedMatch?.matchNumber || 1}`
          : 'overall'
      }-${settings.theme}-${aspectRatio === '4:5' ? 'portrait' : 'landscape'}.png`;
      a.href = dataUrl;
      a.download = filename;
      a.click();

      setStatusMsg('PNG graphic downloaded.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPng = async () => {
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        setStatusMsg('Clipboard copy requires HTTPS or Download PNG.');
        return;
      }
      setIsExporting(true);
      setStatusMsg('Rendering PNG for clipboard...');
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((r) => setTimeout(r, 150));

      const targetNode = exportRef.current || graphicRef.current;
      if (!targetNode) return;

      const blob = await toBlob(targetNode, getExportOptions());
      if (!blob) throw new Error('Failed to generate image blob');

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setStatusMsg('Copied graphic to clipboard.');
      setTimeout(() => {
        setCopied(false);
        setStatusMsg(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setStatusMsg('Clipboard copy failed. Use Download PNG instead.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!activeTournament) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center space-y-4">
        <h2 className="text-lg font-semibold text-white">
          No Active Tournament Selected
        </h2>
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none">
      {/* Studio Controls Panel */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Top Action Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Overall vs Single Match Segmented Control */}
            <div className="glass-input inline-flex rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('OVERALL')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === 'OVERALL'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overall Standings
              </button>
              <button
                type="button"
                onClick={() => setViewMode('SINGLE_MATCH')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === 'SINGLE_MATCH'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Single Match
              </button>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="glass-input inline-flex rounded-xl p-1">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  aspectRatio === '16:9'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>16:9</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('4:5')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  aspectRatio === '4:5'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>4:5</span>
              </button>
            </div>

            {/* Quick Event Actions */}
            <button
              type="button"
              onClick={() => setCurrentTab('edit')}
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-400" />
              <span>Edit Info</span>
            </button>

            <button
              type="button"
              onClick={() =>
                activeTournament.isEnded ? reopenTournament() : endTournament()
              }
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
            >
              {activeTournament.isEnded ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                  <span>Reopen Event</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Mark Concluded</span>
                </>
              )}
            </button>
          </div>

          {/* Export CTAs */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPng}
              disabled={isExporting}
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 disabled:opacity-50 transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>{copied ? 'Copied' : 'Copy PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-950 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Rendering...' : 'Download PNG'}</span>
            </button>
          </div>
        </div>

        {/* Optional Single Match Selector Row */}
        {viewMode === 'SINGLE_MATCH' && matches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-3">
            <span className="text-xs font-medium text-slate-400">
              Select match:
            </span>
            {matches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMatchId(m.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedMatch?.id === m.id
                    ? 'glass-accent text-amber-300'
                    : 'glass-tile text-slate-400 hover:text-white'
                }`}
              >
                Match {m.matchNumber}
              </button>
            ))}
          </div>
        )}

        {/* Poster Style Selector (Scoped Strictly to ResultGraphic Theme) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 border-t border-white/[0.08] pt-3">
          <span className="text-xs font-medium text-slate-400 shrink-0">
            Graphic theme:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {GRAPHIC_THEMES.map((theme) => {
              const isSelected = settings.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSettings({ theme: theme.id })}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'glass-tile border-amber-400/60 bg-white/[0.12] text-white'
                      : 'glass-tile text-slate-400 hover:border-white/[0.2] hover:text-slate-200'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: theme.swatchColor }}
                  />
                  <span>{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {statusMsg && (
          <div className="glass-tile rounded-xl px-3.5 py-2 text-xs text-slate-300">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Centered Fluid Preview Stage */}
      <div className="glass-panel rounded-2xl p-3 sm:p-5">
        <div ref={previewStageRef} className="w-full flex justify-center">
          <div
            className="relative overflow-hidden rounded-xl border border-white/[0.12] bg-black"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
            }}
          >
            <div
              style={{
                width: `${designWidth}px`,
                height: `${designHeight}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <ResultGraphic
                settings={settings}
                standings={activeStandings}
                aspectRatio={aspectRatio}
                viewMode={viewMode}
                selectedMatchNumber={selectedMatch?.matchNumber}
                totalCompletedMatches={completedMatches.length}
                isTournamentEnded={isTournamentEnded}
                graphicRef={graphicRef}
                isExporting={false}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] text-slate-500">
          Preview scaled cleanly to fit screen · Exports at{' '}
          <span className="text-slate-300 font-medium tabular-nums">
            {designWidth * 2} x {designHeight * 2}px
          </span>{' '}
          resolution
        </div>
      </div>

      {/* Off-Screen Full-Resolution Export Target (Untouched Theme Engine) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: `${designWidth}px`,
          height: `${designHeight}px`,
          pointerEvents: 'none',
        }}
      >
        <ResultGraphic
          settings={settings}
          standings={activeStandings}
          aspectRatio={aspectRatio}
          viewMode={viewMode}
          selectedMatchNumber={selectedMatch?.matchNumber}
          totalCompletedMatches={completedMatches.length}
          isTournamentEnded={isTournamentEnded}
          graphicRef={exportRef}
          isExporting={true}
        />
      </div>
    </div>
  );
};
