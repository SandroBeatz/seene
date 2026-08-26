import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { AuthForm, AuthModalHeader, type AuthMode } from '@/features/auth-login';

export default function EmailAuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const title = mode === 'signIn' ? t('auth.logIn') : t('auth.createAccount');

  // Drives the custom header: the compact title + gradient scrim fade in on scroll.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <>
      {/* The screen's native Stack header, rendered custom so it can show a gradient
          scrim + a scroll-driven compact title. */}
      <Stack.Header asChild>
        <AuthModalHeader title={title} scrollY={scrollY} onClose={() => router.back()} />
      </Stack.Header>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 52, paddingBottom: insets.bottom + 40 },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AuthForm onModeChange={setMode} />
      </Animated.ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: { paddingHorizontal: theme.space[4], gap: theme.space[3] },
}));
