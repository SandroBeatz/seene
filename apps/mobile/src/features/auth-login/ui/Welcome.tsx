/**
 * The app's first screen (design: "Приветствие и вход"): logo, hero photo, the
 * pitch, and the three ways in — Apple, Google, email — then the legal line and
 * the language switch. Identical on iOS and Android; scrolls on short screens.
 *
 * The language switch only reports the press (`onOpenLanguage`) — the route owns
 * the sheet, so this feature stays independent of `language-select`.
 */
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Trans, useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { useSignInWithGoogle } from '@/entities/session';
import { errorMessageKey } from '@/shared/api/errors';
import { featureFlags } from '@/shared/config/feature-flags';
import { externalLinks } from '@/shared/config/links';
import { isSupportedLocale, LOCALE_NATIVE_NAMES } from '@/shared/lib/i18n';
import { layout } from '@/shared/theme/tokens';
import { Button, Icon, Logo, Text } from '@/shared/ui';
import { WelcomeHero } from './WelcomeHero';

const LOGO_HEIGHT = 30;
/** The title stays on one line; it shrinks to fit narrow screens and long locales. */
const TITLE_MIN_SCALE = 0.6;

export interface WelcomeProps {
  onOpenLanguage: () => void;
}

export function Welcome({ onOpenLanguage }: WelcomeProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const google = useSignInWithGoogle();

  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const languageName = LOCALE_NATIVE_NAMES[locale];

  function onApple() {
    // Native Apple Sign In lands once the Apple Developer account exists (Q-PROD-2).
    if (!featureFlags.appleSignIn) Alert.alert(t('auth.appleComingSoon'));
  }

  function onGoogle() {
    google.mutate(undefined, {
      onError: (e) => Alert.alert(t(errorMessageKey(e))),
    });
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + layout.topGap,
          paddingBottom: Math.max(insets.bottom, layout.minBottomGap),
        },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.logo}>
        <Logo height={LOGO_HEIGHT} />
      </View>

      <View style={styles.hero}>
        <WelcomeHero />
      </View>

      <View style={styles.copy}>
        <Text
          variant="display"
          align="center"
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={TITLE_MIN_SCALE}>
          {t('auth.welcome.title')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('auth.welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <Button label={t('auth.continueWithApple')} leftIcon="apple" onPress={onApple} />
        <Button
          label={t('auth.continueWithGoogle')}
          variant="secondary"
          leftIcon="google"
          loading={google.isPending}
          onPress={onGoogle}
        />
        <Button
          label={t('auth.welcome.emailLogin')}
          variant="ghost"
          size="md"
          onPress={() => router.push('/sign-in/email')}
        />
      </View>

      <Text variant="caption" color="secondary" align="center" style={styles.legal}>
        <Trans
          i18nKey="auth.welcome.legal"
          components={{
            terms: (
              <Text
                variant="caption"
                color="secondary"
                style={styles.link}
                accessibilityRole="link"
                onPress={() => void openBrowserAsync(externalLinks.terms)}
              />
            ),
            privacy: (
              <Text
                variant="caption"
                color="secondary"
                style={styles.link}
                accessibilityRole="link"
                onPress={() => void openBrowserAsync(externalLinks.privacy)}
              />
            ),
          }}
        />
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('auth.welcome.languageA11y', { name: languageName })}
        onPress={onOpenLanguage}
        style={({ pressed }) => [styles.language, pressed && styles.pressed]}>
        <Icon name="globe" size="sm" color="content.secondary" />
        <Text variant="footnoteStrong" color="secondary">
          {languageName}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: { flexGrow: 1, paddingHorizontal: theme.layout.gutter },
  logo: {
    height: theme.sizing.control.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { marginTop: theme.space[5.5] },
  copy: { marginTop: theme.space[6.5], gap: theme.space[2], alignItems: 'center' },
  spacer: { flex: 1, minHeight: theme.space[6] },
  actions: { gap: theme.space[2.5] },
  legal: { marginTop: theme.space[2] },
  link: { textDecorationLine: 'underline' },
  language: {
    alignSelf: 'center',
    marginTop: theme.space[1.5],
    height: theme.sizing.control.sm,
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.segment,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.25],
  },
  pressed: { opacity: 0.6 },
}));
