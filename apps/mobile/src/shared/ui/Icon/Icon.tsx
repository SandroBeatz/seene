/**
 * Icon facade — a single component so the underlying icon set can change without
 * touching call sites (docs/design-system.md §3.7). Names are semantic; glyphs are
 * SVG line icons from the design (see glyphs.tsx), identical on iOS and Android.
 */
import Svg from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';
import { iconStroke, sizing } from '@/shared/theme/tokens';
import { GLYPHS, type IconName, type IconWeight } from './glyphs';

export type { IconName, IconWeight };
export type IconSize = keyof typeof sizing.icon;

/** Every glyph name — for catalogs and pickers. */
export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  /** Path into theme.colors, e.g. 'content.primary' | 'accent.default'. */
  color?: string;
  /** Overrides the glyph's default stroke weight (line icons only). */
  weight?: IconWeight;
}

function resolveColor(theme: ReturnType<typeof useUnistyles>['theme'], path?: string): string {
  if (!path) return theme.colors.content.primary;
  const parts = path.split('.');
  let node: unknown = theme.colors;
  for (const part of parts) {
    node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
  }
  return typeof node === 'string' ? node : theme.colors.content.primary;
}

export function Icon({ name, size = 'md', color, weight }: IconProps) {
  const { theme } = useUnistyles();
  const px = typeof size === 'number' ? size : sizing.icon[size];
  const resolved = resolveColor(theme, color);
  const glyph = GLYPHS[name];

  if (glyph.kind === 'fill') {
    return (
      <Svg width={px} height={px} viewBox="0 0 24 24" accessible={false}>
        {glyph.render(resolved)}
      </Svg>
    );
  }

  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke={resolved}
      strokeWidth={iconStroke[weight ?? glyph.weight]}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}>
      {glyph.body}
    </Svg>
  );
}
