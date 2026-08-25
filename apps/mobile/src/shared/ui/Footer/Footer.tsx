/**
 * Footer bar for the layout wrappers — the floating action strip that sits over the
 * bottom of a page (reference IMG_1014: scan / add / mic). It owns three things call
 * sites keep re-deriving: a configurable background (Liquid Glass on iOS 26 via
 * GlassSurface, tokened fallback elsewhere), left/center/right action slots, and the
 * bottom safe-area inset so actions never sit under the home indicator.
 *
 * Standalone here; PageLayout (app.master.seene-df8) composes it over its scroll area.
 * OS-owned chrome (the native tab bar) is separate — don't use this to replace it.
 */
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { GlassSurface } from '@/shared/ui/GlassSurface';

/** Footer background material. `glass` → Liquid Glass on iOS 26, tokened fallback otherwise. */
export type FooterBackground = 'glass' | 'solid' | 'transparent';

export interface FooterProps {
  /** Full-control content. Rendered centered; ignored when any of left/center/right is set. */
  children?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  /** Background material. @default 'glass' */
  background?: FooterBackground;
  /** Solid background color, or glass tint. Pass a theme token; defaults to bg.elevated for 'solid'. */
  color?: string;
  /** Float over content, pinned to the bottom. When false the footer sits in normal flow. @default true */
  floating?: boolean;
  /** Extra style for the bar surface (e.g. override radius/padding). */
  style?: StyleProp<ViewStyle>;
}

export function Footer({
  children,
  left,
  center,
  right,
  background = 'glass',
  color,
  floating = true,
  style,
}: FooterProps) {
  // Subscribe to the theme so solid/transparent colors repaint on a theme change even
  // on frozen native tab screens (same reason Screen does it).
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const hasSlots = left !== undefined || center !== undefined || right !== undefined;
  const content = hasSlots ? (
    <View style={styles.row}>
      <View style={styles.sideStart}>{left}</View>
      <View style={styles.center}>{center}</View>
      <View style={styles.sideEnd}>{right}</View>
    </View>
  ) : (
    <View style={styles.rowCenter}>{children}</View>
  );

  const bar =
    background === 'glass' ? (
      <GlassSurface tintColor={color} style={[styles.bar, floating && styles.floatingBar, style]}>
        {content}
      </GlassSurface>
    ) : (
      <View
        style={[
          styles.bar,
          background === 'solid' && {
            backgroundColor: color ?? theme.colors.bg.elevated,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border.subtle,
          },
          floating && styles.floatingBar,
          style,
        ]}>
        {content}
      </View>
    );

  return (
    <View
      style={[
        floating ? styles.floatingWrap : styles.flowWrap,
        { paddingBottom: insets.bottom + (floating ? theme.space[2] : 0) },
      ]}>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Floating: overlay pinned to the bottom. box-none lets taps through the empty
  // margins around the bar while the bar itself stays interactive.
  floatingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.space[4],
    pointerEvents: 'box-none',
  },
  flowWrap: { paddingHorizontal: theme.space[4] },
  bar: {
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
    overflow: 'hidden',
  },
  floatingBar: { ...theme.elevation[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[3],
  },
  sideStart: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: theme.space[2] },
  center: { alignItems: 'center', justifyContent: 'center' },
  sideEnd: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: theme.space[2] },
}));
