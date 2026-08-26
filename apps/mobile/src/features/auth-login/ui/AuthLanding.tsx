/**
 * The app's first screen: a hero background image with the logo, fading into the
 * app canvas, over a stack of platform auth buttons and the legal links.
 *
 *  - iOS shows Apple + Google + email; Android shows Google + email.
 *  - The logo (`logo-black.svg`) tints to the theme's primary content color so it
 *    reads in both light and dark.
 *  - "Continue with email" pushes the `/(auth)/email` screen (a full-screen modal on
 *    iOS, a pushed page on Android — configured in the (auth) layout).
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSignInWithGoogle } from '@/entities/session';
import { errorMessageKey } from '@/shared/api/errors';
import { externalLinks } from '@/shared/config/links';
import { featureFlags } from '@/shared/config/feature-flags';
import { Button, Text } from '@/shared/ui';
import { SocialButton } from './SocialButton';
import authBackground from '@/shared/assets/img/auth-background.jpg';
import logoBlack from '@/shared/assets/img/logo-black.svg';

export function AuthLanding() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const google = useSignInWithGoogle();
  const [notice, setNotice] = useState<string | null>(null);

  const isIOS = process.env.EXPO_OS === 'ios';

  function onGoogle() {
    setNotice(null);
    google.mutate(undefined, { onError: (e) => setNotice(t(errorMessageKey(e))) });
  }

  function onApple() {
    setNotice(null);
    if (!featureFlags.appleSignIn) {
      setNotice(t('auth.appleComingSoon'));
      return;
    }
    // Real native Apple Sign In lands once the Apple Developer account exists (Q-PROD-2).
  }

  return (
    <View style={styles.root}>
      <Image source={authBackground} style={styles.bg} contentFit="cover" />
      <View style={styles.bgScrim} pointerEvents="none" />
      <View style={styles.bgFade} pointerEvents="none" />

      <View style={[styles.hero, { paddingTop: insets.top }]} pointerEvents="none">
        <Image
          source={logoBlack}
          tintColor={theme.colors.content.primary}
          contentFit="contain"
          style={styles.logo}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space[8] }]}>
        <Text variant="title2" style={styles.tagline}>
          {t('auth.landingTagline')}
        </Text>

        {notice ? (
          <Text variant="footnote" color="danger" style={styles.notice}>
            {notice}
          </Text>
        ) : null}

        <View style={styles.buttons}>
          {isIOS ? (
            <SocialButton provider="apple" label={t('auth.continueWithApple')} onPress={onApple} />
          ) : null}
          {featureFlags.googleSignIn ? (
            <SocialButton
              provider="google"
              label={t('auth.continueWithGoogle')}
              onPress={onGoogle}
              loading={google.isPending}
            />
          ) : null}
          <Button
            label={t('auth.continueWithEmail')}
            variant="secondary"
            size="lg"
            onPress={() => router.push('/(auth)/email')}
            fullWidth
          />
        </View>

        <View style={styles.legal}>
          <Text
            variant="footnote"
            color="tertiary"
            style={styles.legalLink}
            onPress={() => void openBrowserAsync(externalLinks.terms)}>
            {t('auth.legalTerms')}
          </Text>
          <Text variant="footnote" color="tertiary">
            {'  ·  '}
          </Text>
          <Text
            variant="footnote"
            color="tertiary"
            style={styles.legalLink}
            onPress={() => void openBrowserAsync(externalLinks.privacy)}>
            {t('auth.legalPrivacy')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, height: '56%' },
  // Darken the photo a touch so the logo + gradient read cleanly.
  bgScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '56%',
    backgroundColor: theme.colors.constant.black,
    opacity: 0.28,
  },
  bgFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '56%',
    experimental_backgroundImage: `linear-gradient(to bottom, ${theme.colors.bg.canvas}00 18%, ${theme.colors.bg.canvas}ff 100%)`,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 172, height: 68 },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: theme.space[5],
    gap: theme.space[3],
  },
  tagline: { textAlign: 'center', marginBottom: theme.space[1] },
  notice: { textAlign: 'center' },
  buttons: { gap: theme.space[3] },
  legal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.space[6],
  },
  legalLink: { textDecorationLine: 'underline' },
}));
