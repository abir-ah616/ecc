import React from 'react';
import { ArrowRight, Camera, Palette, Smartphone, Zap } from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { GRAPHIC_THEMES } from '../../lib/theme';

interface ReleaseHighlight {
  id: string;
  tag: string;
  title: string;
  summary: string;
  details: string[];
  accentBg: string;
  accentBorder: string;
  accentText: string;
  icon: React.ReactNode;
}

export const WhatsNewView: React.FC = () => {
  const { setCurrentTab, matches, getActiveTournament } = useTournamentStore();
  const activeTournament = getActiveTournament();
  const preferredMatch =
    matches.find((m) => !m.isCompleted) || matches[matches.length - 1];

  const highlights: ReleaseHighlight[] = [
    {
      id: 'ai-auto-detect',
      tag: 'AI · BETA',
      title: 'AI Auto Detect',
      summary:
        'Import match leaderboard screenshots directly to extract squad placements and elimination counts automatically.',
      details: [
        'Works inside match scorecards when enabled for your organizer account',
        'Matches leaderboard screenshots against your tournament roster automatically',
        'Lets you inspect or adjust every placement and kill right after scanning',
      ],
      accentBg: 'bg-sky-500/10',
      accentBorder: 'border-sky-400/30',
      accentText: 'text-sky-300',
      icon: <Camera className="h-5 w-5 text-sky-300" />,
    },
    {
      id: 'rapid-point-enter',
      tag: 'FASTER SCORING',
      title: 'New Rapid Mode Point Enter',
      summary:
        'Step-by-step guided placement scoring built for speed on both touchscreens and desktops.',
      details: [
        'Starts with "Which team took Booyah?", then walks cleanly through 2nd, 3rd, and beyond',
        'Tapping a squad slides it to the top spotlight and opens a focused "Total Kills?" prompt below',
        'Includes Reverse & Redo controls plus full editing inside Team List anytime',
      ],
      accentBg: 'bg-amber-500/10',
      accentBorder: 'border-amber-400/35',
      accentText: 'text-amber-300',
      icon: <Zap className="h-5 w-5 text-amber-300" />,
    },
    {
      id: 'more-themes',
      tag: `${GRAPHIC_THEMES.length} THEMES`,
      title: 'More Themes',
      summary:
        'Expanded broadcast poster library with three new high-contrast arena palettes synced across Web and Android.',
      details: [
        'Added Inferno Blaze (molten volcanic orange), Obsidian Noir (brushed platinum titanium), and Royal Amethyst (electric violet)',
        'Supports both 16:9 widescreen broadcast graphics and 4:5 vertical social cards',
        'Instant 2x crisp PNG export and WhatsApp/Discord standings text copy',
      ],
      accentBg: 'bg-purple-500/10',
      accentBorder: 'border-purple-400/30',
      accentText: 'text-purple-300',
      icon: <Palette className="h-5 w-5 text-purple-300" />,
    },
  ];

  const handleOpenRapid = () => {
    if (activeTournament && preferredMatch) {
      setCurrentTab(preferredMatch.id);
    } else {
      setCurrentTab('create');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Release Header */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
            <span>EspCalc v1.1</span>
          </div>
          <span className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-slate-300">
            com.mroppy.espcalc
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            What&apos;s New in EspCalc v1.1
          </h1>
          <p className="max-w-2xl text-sm text-slate-400 leading-relaxed">
            Built for faster live lobby scoring, screenshot-assisted standings detection, and an expanded set of broadcast poster styles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleOpenRapid}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 transition-colors cursor-pointer"
          >
            <span>
              {activeTournament && preferredMatch
                ? `Open Match ${preferredMatch.matchNumber}`
                : 'Start New Tournament'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {activeTournament && (
            <button
              type="button"
              onClick={() => setCurrentTab('results')}
              className="glass-pill inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Palette className="h-4 w-4 text-slate-400" />
              <span>Preview Themes</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentTab('download')}
            className="glass-pill inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <Smartphone className="h-4 w-4 text-slate-400" />
            <span>Android v1.1 APK</span>
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <div className="space-y-4">
        {highlights.map((item) => (
          <section
            key={item.id}
            className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.accentBorder} ${item.accentBg}`}
              >
                {item.icon}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.accentBorder} ${item.accentBg} ${item.accentText}`}
                  >
                    {item.tag}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    {item.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-3 pt-1">
              {item.details.map((detail) => (
                <li
                  key={detail}
                  className="glass-tile rounded-xl px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed"
                >
                  {detail}
                </li>
              ))}
            </ul>

            {item.id === 'more-themes' && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {GRAPHIC_THEMES.map((theme) => (
                  <span
                    key={theme.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-white/25"
                      style={{
                        background: `linear-gradient(135deg, ${theme.swatchColor} 0%, ${theme.swatchSecondary} 100%)`,
                      }}
                    />
                    <span>{theme.label}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
