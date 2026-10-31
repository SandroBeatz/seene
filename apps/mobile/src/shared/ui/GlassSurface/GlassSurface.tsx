/**
 * The single Liquid Glass surface primitive. Renders Apple's iOS 26 glass material
 * when it is actually available, and a tokened opaque surface everywhere else —
 * so call sites never touch `expo-glass-effect` or repeat the guard/fallback dance
 * (docs/liquid-glass-ios.md §5). Mirrors how `Icon` wraps the icon set.
 *
 * Use this for surfaces WE render that float over content (FAB, floating toolbar,
 * mini-player, overlay pill). OS-owned chrome (tab bar, headers, sheets) gets glass
 * automatically via native components — do NOT wrap those in a GlassSurface.
 */
import {
  GlassView,
  isGlassEffectAPIAvailable,
  type GlassEffectStyleConfig,
  type GlassStyle,
} from 'expo-glass-effect';
import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useThemeStore } from '@/shared/theme/theme.store';
import { useReduceTransparency } from '../hooks/useReduceTransparency';

export interface GlassSurfaceProps extends ViewProps {
  /** Glass material to apply on iOS 26. Ignored by the fallback. @default 'regular' */
  glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
  /**
   * Tint for the glass. Pass a theme token (e.g. theme.colors.accent.default), never raw
   * hex. The opaque fallback takes it as its fill, so a dark glass button stays dark.
   */
  tintColor?: string;
  /** Whether the glass reacts to touches (subtle press deformation). @default false */
  isInteractive?: boolean;
}

export function GlassSurface({
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive = false,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  // The theme mode doubles as the glass color scheme ('auto' | 'light' | 'dark'),
  // so a forced app theme keeps the glass matching our toggle, not just the OS.
  const colorScheme = useThemeStore((s) => s.mode);
  const reduceTransparency = useReduceTransparency();

  // Glass only exists on iOS 26+ (the guard also returns false on Android/web), and
  // Reduce Transparency means the user asked the OS to drop translucency.
  const useGlass = isGlassEffectAPIAvailable() && !reduceTransparency;

  if (useGlass) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        isInteractive={isInteractive}
        colorScheme={colorScheme}
        style={style}
        {...rest}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[styles.fallback, tintColor ? { backgroundColor: tintColor } : null, style]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // The non-glass surface: the app's standard elevated material with a hairline
  // border, matching Card so glass and non-glass builds read consistently.
  fallback: {
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
}));
