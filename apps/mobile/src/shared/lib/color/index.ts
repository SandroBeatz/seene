/**
 * Pure colour math for domain colours that are data, not theme roles (a service's
 * `color` comes from the database). Inputs and outputs are `#RRGGBB`.
 *
 * Event cards ("Сегодня" schedule, calendar): a light fill tinted with the service
 * colour, the colour itself as the left bar, and text pulled toward ink so it stays
 * readable on the fill (≥ 4.5:1 for every section colour, see color.test.ts).
 */

export type ColorScheme = 'light' | 'dark';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
/** Brand ink (`neutral.950`) — the design's text and dark-canvas colour. */
const INK: Rgb = { r: 11, g: 11, b: 12 };

/** Share of the service colour in the card fill. Matches the design's tints. */
const FILL_SHARE = { light: 0.2, dark: 0.24 } as const;
/** Share of the service colour left in the card's accent text. */
const TEXT_SHARE = { light: 0.4, dark: 0.35 } as const;

export function hexToRgb(hex: string): Rgb {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`Invalid hex colour: ${hex}`);
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const part = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** `share` of `color` over `base` (0 = base, 1 = color). */
function mix(color: Rgb, base: Rgb, share: number): Rgb {
  return {
    r: base.r + (color.r - base.r) * share,
    g: base.g + (color.g - base.g) * share,
    b: base.b + (color.b - base.b) * share,
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two `#RRGGBB` colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface EventSwatch {
  /** Card background. */
  fill: string;
  /** Left bar, dashed outline of an unconfirmed record, dots. */
  bar: string;
  /** Accent text on `fill` (time, tinted labels). */
  text: string;
}

/** Card colours for an event whose service colour is `hex`. */
export function eventSwatch(hex: string, scheme: ColorScheme = 'light'): EventSwatch {
  const color = hexToRgb(hex);
  const canvas = scheme === 'light' ? WHITE : INK;
  const text = scheme === 'light' ? INK : WHITE;
  return {
    fill: rgbToHex(mix(color, canvas, FILL_SHARE[scheme])),
    bar: rgbToHex(color),
    text: rgbToHex(mix(color, text, TEXT_SHARE[scheme])),
  };
}
