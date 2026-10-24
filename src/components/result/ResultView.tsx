import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Smartphone,
  Monitor,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Palette,
  Settings,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { useTournamentStore } from '../../store/tournamentStore';
import { ResultGraphic } from './ResultGraphic';
import {
  calculateSingleMatchStandings,
  DEFAULT_TIE_BREAK_ORDER,
} from '../../lib/scoring';
import type {
  AspectRatioMode,
  StandingsViewMode,
  ThemePreset,
} from '../../types/tournament';

export const ResultView: React.FC = () => {
  const {
    settings,
    setSettings,
    teams,
    matches,
    getStandings,
    setCurrentTab,
    endTournament,
    reopenTournament,
  } = useTournamentStore();

  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('16:9');
  const [viewMode, setViewMode] = useState<StandingsViewMode>('OVERALL');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matches[0]?.id || ''
  );
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const graphicRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.65);

  const overallStandingsResult = getStandings();
  const completedMatches = matches.filter((m) => m.isCompleted);

  const handleThemeChange = (theme: ThemePreset) => {
    setSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  // Compute standings based on overall vs single match view
  const activeStandings = useMemo(() => {
    if (viewMode === 'SINGLE_MATCH') {
      const match = matches.find((m) => m.id === selectedMatchId) || matches[0];
      if (!match) return overallStandingsResult.standings;
      return calculateSingleMatchStandings(
        teams,
        match,
        settings.pointSystem,
        settings.tieBreakOrder || DEFAULT_TIE_BREAK_ORDER
      );
    }
    return overallStandingsResult.standings;
  }, [
    viewMode,
    selectedMatchId,
    matches,
    teams,
    settings.pointSystem,
    settings.tieBreakOrder,
    overallStandingsResult.standings,
  ]);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const selectedMatchNumber = selectedMatch?.matchNumber ?? 1;

  // Responsive scaling calculation
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      const designWidth = aspectRatio === '4:5' ? 1080 : 1920;
      const targetScale = Math.min(1, Math.max(0.25, containerWidth / designWidth));
      setScale(targetScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [aspectRatio]);

  const handleDownloadPng = async () => {
    if (!graphicRef.current) return;
    try {
      setIsExporting(true);
      setStatusMsg('Rendering high-res 2x graphic...');
      await new Promise((r) => setTimeout(r, 120));

      const dataUrl = await toPng(graphicRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        quality: 1,
      });

      const a = document.createElement('a');
      const filename = `freefire-${settings.name.toLowerCase().replace(/\s+/g, '-')}-${
        viewMode === 'SINGLE_MATCH' ? `match-${selectedMatchNumber}` : 'overall'
      }-${settings.theme}-${aspectRatio === '4:5' ? 'portrait' : 'landscape'}.png`;
      a.href = dataUrl;
      a.download = filename;
      a.click();
      setStatusMsg('Graphic downloaded successfully!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!graphicRef.current) return;
    try {
      setIsExporting(true);
      setStatusMsg('Generating clipboard image...');
      await new Promise((r) => setTimeout(r, 120));

      const blob = await toBlob(graphicRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setStatusMsg('Copied PNG to clipboard!');
        setTimeout(() => {
          setCopied(false);
          setStatusMsg(null);
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Clipboard copy failed. Use Download PNG instead.');
    } finally {
      setIsExporting(false);
    }
  };

  const designWidth = aspectRatio === '4:5' ? 1080 : 1920;
  const designHeight = aspectRatio === '4:5' ? 1350 : 1080;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 rounded border border-neutral-800 bg-[#14080A] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Back to Home */}
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded border border-neutral-800 bg-neutral-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('OVERALL')}
              className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'OVERALL'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Overall Standing
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SINGLE_MATCH')}
              className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'SINGLE_MATCH'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Single Match
            </button>
          </div>

          {/* If Single Match selected, show match picker */}
          {viewMode === 'SINGLE_MATCH' && matches.length > 0 && (
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-200 focus:outline-none"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  Match {m.matchNumber} {m.isCompleted ? '(Saved)' : '(Draft)'}
                </option>
              ))}
            </select>
          )}

          {/* Aspect Ratio Toggle */}
          <div className="flex items-center rounded border border-neutral-800 bg-neutral-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              title="1920x1080 Landscape"
              className={`flex items-center gap-1 px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
                aspectRatio === '16:9'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>16:9 Landscape</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('4:5')}
              title="1080x1350 Portrait"
              className={`flex items-center gap-1 px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
                aspectRatio === '4:5'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>4:5 Portrait</span>
            </button>
          </div>

          {/* End Tournament / Reopen Toggle button */}
          {overallStandingsResult.tournamentConcluded ? (
            <button
              type="button"
              onClick={reopenTournament}
              className="flex items-center gap-1.5 rounded border border-amber-600/50 bg-amber-950/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-900/50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reopen Tournament</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={endTournament}
              className="flex items-center gap-1.5 rounded border border-red-700 bg-red-950/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/60 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
              <span>Conclude Tournament (Show Final Champion)</span>
            </button>
          )}
        </div>

        {/* Export & Edit Buttons */}
        <div className="flex items-center gap-2">
          {statusMsg && (
            <span className="text-xs text-amber-400 font-medium animate-pulse">
              {statusMsg}
            </span>
          )}

          <button
            type="button"
            onClick={() => setCurrentTab('edit')}
            className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
            title="Edit tournament name, sponsors, emblem logo, squads and settings"
          >
            <Settings className="h-4 w-4 text-neutral-300" />
            <span>Edit Tournament Info</span>
          </button>

          <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:border-neutral-600 hover:bg-neutral-800 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copied ? 'Copied PNG!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded bg-red-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 shadow-md shadow-red-950/50 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Download PNG (2X)'}</span>
          </button>
        </div>
      </div>

      {/* Theme Presets Bar (Instant Color Palettes) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-neutral-800 bg-[#12070A] px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-neutral-300">
          <Palette className="h-4 w-4 text-neutral-400" />
          <span>Broadcast Color Theme:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'v2', label: 'Yellow', color: 'bg-amber-500' },
            { id: 'crimson', label: 'Crimson Red', color: 'bg-red-700' },
            { id: 'blue', label: 'Cyber Blue', color: 'bg-blue-600' },
            { id: 'gold', label: 'Championship Gold', color: 'bg-amber-400' },
            { id: 'emerald', label: 'Toxic Green', color: 'bg-emerald-600' },
            { id: 'violet', label: 'Royal Violet', color: 'bg-purple-600' },
          ].map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => handleThemeChange(th.id as ThemePreset)}
              className={`flex items-center gap-1.5 rounded px-3 py-1 font-semibold uppercase tracking-wider transition-all ${
                settings.theme === th.id
                  ? 'bg-neutral-800 text-white border border-neutral-600 shadow-md'
                  : 'bg-neutral-950/70 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${th.color}`} />
              <span>{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Graphic Preview Container */}
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#070506] p-4 shadow-2xl"
      >
        <div
          style={{
            width: `${designWidth * scale}px`,
            height: `${designHeight * scale}px`,
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${designWidth}px`,
              height: `${designHeight}px`,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <ResultGraphic
              settings={settings}
              standings={activeStandings}
              aspectRatio={aspectRatio}
              viewMode={viewMode}
              selectedMatchNumber={selectedMatchNumber}
              totalCompletedMatches={completedMatches.length}
              isTournamentEnded={overallStandingsResult.tournamentConcluded}
              graphicRef={graphicRef}
              isExporting={isExporting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
