/**
 * A branded social auth button. Non-brand actions (email, sign in, etc.) use the
 * standard kit `Button` — keep that split consistent everywhere.
 *
 *  - `google` — always a white surface with a soft shadow and the full-color Google
 *    glyph (never tinted), per Google's sign-in branding.
 *  - `apple`  — inverts with the theme: black button in light mode, white in dark;
 *    the Apple glyph tints to the opposite so it always reads.
 *
 * Sized (`control.lg`) to line up with a kit `Button size="lg"` beside it.
 */
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/ui';
import appleGlyph from '@/shared/assets/img/apple.svg';
import googleGlyph from '@/shared/assets/img/google.svg';

export type SocialProvider = 'apple' | 'google';

export interface SocialButtonProps {
  provider: SocialProvider;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const GLYPH: Record<SocialProvider, number> = {
  apple: appleGlyph,
  google: googleGlyph,
};

export function SocialButton({ provider, label, onPress, loading, disabled }: SocialButtonProps) {
  const { theme } = useUnistyles();
  const isDark = theme.name === 'dark';
  const c = theme.colors;

  // Resolve the brand surface + foreground for this provider/theme.
  const surface =
    provider === 'google' ? c.constant.white : isDark ? c.constant.white : c.constant.black;
  const foreground =
    provider === 'google' ? c.constant.black : isDark ? c.constant.black : c.constant.white;

  // Google keeps its native colors; Apple tints to the foreground.
  const glyphTint = provider === 'apple' ? foreground : undefined;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        provider === 'google' && styles.googleShadow,
        { backgroundColor: surface },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          <Image
            source={GLYPH[provider]}
            tintColor={glyphTint}
            contentFit="contain"
            // Apple's glyph sits in a tall viewBox; nudge it up a hair so both
            // logos read at the same optical size next to the label.
            style={[styles.glyph, provider === 'apple' && styles.glyphApple]}
          />
          <Text variant="headline" style={{ color: foreground }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Mirror the kit Button (size="lg") exactly so a Button and a SocialButton in the
// same stack share radius + height + padding. Keep these in lockstep.
const styles = StyleSheet.create((theme) => ({
  button: {
    minHeight: theme.sizing.control.lg,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: theme.space[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  glyph: { width: theme.sizing.icon.md, height: theme.sizing.icon.md },
  glyphApple: { width: theme.sizing.icon.md - 2, height: theme.sizing.icon.md, marginTop: -2 },
  googleShadow: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
}));
