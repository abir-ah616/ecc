import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getFontEmbedCSS, toPng } from 'html-to-image';
import './poster.css';
import { ResultGraphic } from '../../src/components/result/ResultGraphic';
import type {
  AspectRatioMode,
  StandingsViewMode,
  TeamCumulativeStanding,
  TournamentSettings,
} from '../../src/types/tournament';

interface PosterPayload {
  settings: TournamentSettings;
  standings: TeamCumulativeStanding[];
  aspectRatio: AspectRatioMode;
  viewMode: StandingsViewMode;
  selectedMatchNumber?: number;
  totalCompletedMatches: number;
  isTournamentEnded?: boolean;
}

interface BridgeChannel {
  postMessage: (msg: string) => void;
}

declare global {
  interface Window {
    FlutterPosterBridge?: BridgeChannel;
    renderStandingsPayload?: (payload: PosterPayload) => void;
    exportStandingsPng?: (requestId: string, pixelRatio?: number) => Promise<void>;
    __pendingPosterPayload?: PosterPayload;
  }
}

const TRANSPARENT_IMAGE_FALLBACK =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const fontEmbedCssCache = new Map<string, Promise<string>>();

async function resolveFontEmbedCss(
  node: HTMLElement,
  themeKey: string
): Promise<string> {
  let cached = fontEmbedCssCache.get(themeKey);
  if (!cached) {
    // Omit preferredFontFormat due to html-to-image global regex lastIndex bug
    // that strips src from subsequent @font-face declarations.
    cached = getFontEmbedCSS(node).catch((err) => {
      fontEmbedCssCache.delete(themeKey);
      throw err;
    });
    fontEmbedCssCache.set(themeKey, cached);
  }
  return cached;
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return;
  await Promise.race([
    Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            const done = () => {
              img.removeEventListener('load', done);
              img.removeEventListener('error', done);
              resolve();
            };
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          })
      )
    ),
    new Promise<void>((resolve) => setTimeout(resolve, 1800)),
  ]);
}

async function waitForPaintSettle(node: HTMLElement, delayMs = 32): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForImages(node);
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function postToFlutter(data: Record<string, unknown>) {
  const serialized = JSON.stringify(data);
  if (window.FlutterPosterBridge?.postMessage) {
    window.FlutterPosterBridge.postMessage(serialized);
  }
}

const PosterBridgeApp: React.FC = () => {
  const [payload, setPayload] = useState<PosterPayload | null>(
    () => window.__pendingPosterPayload ?? null
  );
  const [viewport, setViewport] = useState<{ width: number; height: number }>(
    () => ({
      width: document.documentElement.clientWidth || window.innerWidth || 360,
      height:
        document.documentElement.clientHeight || window.innerHeight || 203,
    })
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const payloadRef = useRef<PosterPayload | null>(payload);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    const updateViewport = () => {
      const width = document.documentElement.clientWidth || window.innerWidth;
      const height =
        document.documentElement.clientHeight || window.innerHeight;
      if (width > 0 && height > 0) {
        setViewport((prev) =>
          prev.width === width && prev.height === height
            ? prev
            : { width, height }
        );
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateViewport)
        : null;
    resizeObserver?.observe(document.documentElement);

    return () => {
      window.removeEventListener('resize', updateViewport);
      resizeObserver?.disconnect();
    };
  }, []);

  const captureGraphicDataUrl = async (
    target: HTMLElement,
    current: PosterPayload,
    pixelRatio: number
  ): Promise<string> => {
    const width = current.aspectRatio === '4:5' ? 1080 : 1920;
    const height = current.aspectRatio === '4:5' ? 1350 : 1080;
    const themeKey = `${current.settings?.theme || 'v2'}`;
    const fontEmbedCSS = await resolveFontEmbedCss(target, themeKey);

    return toPng(target, {
      width,
      height,
      pixelRatio,
      cacheBust: false,
      quality: 1,
      skipAutoScale: true,
      fontEmbedCSS,
      imagePlaceholder: TRANSPARENT_IMAGE_FALLBACK,
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        width: `${width}px`,
        height: `${height}px`,
      },
    });
  };

  useEffect(() => {
    window.renderStandingsPayload = (nextPayload: PosterPayload) => {
      payloadRef.current = nextPayload;
      setPayload(nextPayload);
    };

    window.exportStandingsPng = async (requestId: string, pixelRatio = 2) => {
      try {
        const current = payloadRef.current;
        const target = stageRef.current;
        if (!current || !target) {
          postToFlutter({
            type: 'exportResult',
            requestId,
            ok: false,
            error: 'Poster canvas is not ready yet.',
          });
          return;
        }

        await waitForPaintSettle(target, 48);
        const dataUrl = await captureGraphicDataUrl(target, current, pixelRatio);

        postToFlutter({
          type: 'exportResult',
          requestId,
          ok: true,
          dataUrl,
        });
      } catch (err) {
        postToFlutter({
          type: 'exportResult',
          requestId,
          ok: false,
          error: err instanceof Error ? err.message : 'PNG export failed',
        });
      }
    };

    postToFlutter({ type: 'ready' });
  }, []);

  if (!payload) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090B0F',
          color: '#94A3B8',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        Preparing standing poster...
      </div>
    );
  }

  const designWidth = payload.aspectRatio === '4:5' ? 1080 : 1920;
  const designHeight = payload.aspectRatio === '4:5' ? 1350 : 1080;
  const scale = Math.max(
    0.05,
    Math.min(viewport.width / designWidth, viewport.height / designHeight)
  );
  const scaledWidth = Math.round(designWidth * scale * 100) / 100;
  const scaledHeight = Math.round(designHeight * scale * 100) / 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#090B0F',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          overflow: 'hidden',
          borderRadius: '10px',
          position: 'relative',
          flexShrink: 0,
          backgroundColor: '#070506',
        }}
      >
        <div
          style={{
            width: `${designWidth}px`,
            height: `${designHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <ResultGraphic
            settings={payload.settings}
            standings={payload.standings}
            aspectRatio={payload.aspectRatio}
            viewMode={payload.viewMode}
            selectedMatchNumber={payload.selectedMatchNumber}
            totalCompletedMatches={payload.totalCompletedMatches}
            isTournamentEnded={payload.isTournamentEnded}
            graphicRef={stageRef}
            isExporting={true}
          />
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<PosterBridgeApp />);
