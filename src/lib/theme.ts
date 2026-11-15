import type { ThemePreset } from '../types/tournament';

export interface GraphicThemeMeta {
  id: ThemePreset;
  label: string;
  swatchColor: string;
  swatchSecondary: string;
  thumbFrom: string;
  thumbTo: string;
  thumbBorder: string;
  isLightThumb?: boolean;
}

export const GRAPHIC_THEMES: GraphicThemeMeta[] = [
  {
    id: 'v2',
    label: 'FF Yellow',
    swatchColor: '#F59E0B',
    swatchSecondary: '#B45309',
    thumbFrom: '#B45309',
    thumbTo: '#F59E0B',
    thumbBorder: 'rgba(245, 158, 11, 0.5)',
  },
  {
    id: 'scarlet',
    label: 'Scarlet Strike',
    swatchColor: '#E11D2E',
    swatchSecondary: '#7F1D1D',
    thumbFrom: '#991B1B',
    thumbTo: '#E11D2E',
    thumbBorder: 'rgba(225, 29, 46, 0.55)',
  },
  {
    id: 'volt',
    label: 'Apex Volt',
    swatchColor: '#00EA87',
    swatchSecondary: '#059669',
    thumbFrom: '#043825',
    thumbTo: '#00EA87',
    thumbBorder: 'rgba(0, 234, 135, 0.55)',
  },
  {
    id: 'whiteout',
    label: 'Whiteout Pro',
    swatchColor: '#F1F5F9',
    swatchSecondary: '#DC142C',
    thumbFrom: '#FFFFFF',
    thumbTo: '#E2E8F0',
    thumbBorder: 'rgba(220, 20, 44, 0.5)',
    isLightThumb: true,
  },
  {
    id: 'blue',
    label: 'Arctic Cyan',
    swatchColor: '#06B6D4',
    swatchSecondary: '#1D4ED8',
    thumbFrom: '#1D4ED8',
    thumbTo: '#38BDF8',
    thumbBorder: 'rgba(56, 189, 248, 0.5)',
  },
  {
    id: 'gold',
    label: 'Cyber Rose',
    swatchColor: '#FF2A6D',
    swatchSecondary: '#9D174D',
    thumbFrom: '#9D174D',
    thumbTo: '#FF2A6D',
    thumbBorder: 'rgba(255, 42, 109, 0.5)',
  },
  {
    id: 'eclipse',
    label: 'Imperial Gold',
    swatchColor: '#EAB308',
    swatchSecondary: '#854D0E',
    thumbFrom: '#854D0E',
    thumbTo: '#EAB308',
    thumbBorder: 'rgba(234, 179, 8, 0.5)',
  },
];

export const THEME_META_MAP: Record<ThemePreset, GraphicThemeMeta> =
  Object.fromEntries(GRAPHIC_THEMES.map((t) => [t.id, t])) as Record<
    ThemePreset,
    GraphicThemeMeta
  >;

/** Maps stored theme IDs (including deleted legacy presets) to active presets. */
export function resolveThemePreset(raw?: string | null): ThemePreset {
  switch (raw) {
    case 'v2':
    case 'scarlet':
    case 'volt':
    case 'whiteout':
    case 'blue':
    case 'gold':
    case 'eclipse':
      return raw;
    case 'crimson':
      return 'scarlet';
    case 'emerald':
    case 'cobalt':
      return 'volt';
    case 'violet':
      return 'whiteout';
    default:
      return 'v2';
  }
}
