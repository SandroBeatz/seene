/**
 * Icon facade — a single component so the underlying icon set can change without
 * touching call sites (docs/design-system.md §3.7). Names are semantic; the map
 * points them at concrete glyphs (Ionicons today).
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUnistyles } from 'react-native-unistyles';
import { sizing } from '@/shared/theme/tokens';

// Semantic name → concrete glyph. Add names as features need them.
const GLYPHS = {
  home: 'home-outline',
  calendar: 'calendar-outline',
  clients: 'people-outline',
  analytics: 'stats-chart-outline',
  settings: 'settings-outline',
  add: 'add',
  close: 'close',
  check: 'checkmark',
  chevronLeft: 'chevron-back',
  chevronRight: 'chevron-forward',
  chevronDown: 'chevron-down',
  search: 'search-outline',
  edit: 'create-outline',
  trash: 'trash-outline',
  star: 'star',
  starOutline: 'star-outline',
  phone: 'call-outline',
  warning: 'warning-outline',
  info: 'information-circle-outline',
  error: 'alert-circle-outline',
  empty: 'file-tray-outline',
  wifiOff: 'cloud-offline-outline',
} as const;

export type IconName = keyof typeof GLYPHS;
export type IconSize = keyof typeof sizing.icon;

/** A content-token color role, or an explicit theme color already resolved. */
export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  /** Path into theme.colors, e.g. 'content.primary' | 'accent.default'. */
  color?: string;
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

export function Icon({ name, size = 'md', color }: IconProps) {
  const { theme } = useUnistyles();
  const px = typeof size === 'number' ? size : sizing.icon[size];
  return <Ionicons name={GLYPHS[name]} size={px} color={resolveColor(theme, color)} />;
}
