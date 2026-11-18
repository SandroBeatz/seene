import { View } from 'react-native';
import { type NativeStackNavigationOptions, Stack, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ONBOARDING_REVIEW_STEP, OnboardingHeader, useConfirmSignOut } from '@/features/onboarding';
import { useStackScreenOptions } from '@/shared/ui';

/** Which step each onboarding route belongs to (sheets keep their step's header). */
const STEP_BY_ROUTE: Partial<Record<string, number>> = {
  profile: 1,
  professions: 2,
  settings: 3,
  timezone: 3,
  currency: 3,
  hours: 3,
  services: 4,
  service: 4,
  'service-section': 4,
  'service-category': 4,
  review: ONBOARDING_REVIEW_STEP,
};

/**
 * Onboarding: one route per step, pushed left to right. The step header (back,
 * progress, "N из 4") floats above the stack on a canvas-to-clear fade: it stays put
 * while steps slide and scroll under it, and its progress animates between steps. Back on step 1 = sign out (confirmed).
 * The step sheets (time zone, currency, hours; the step-4 service editor and its
 * section/category pickers) are native form sheets. The review after step 4 keeps only
 * the header's back button; the "creating" screen has no header.
 */
export default function OnboardingLayout() {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const confirmSignOut = useConfirmSignOut();
  const stackOptions = useStackScreenOptions();
  const isIOS = process.env.EXPO_OS === 'ios';
  const step = STEP_BY_ROUTE[segments[segments.length - 1] ?? ''];

  // Picker sheets shared with the app (time zone, currency): full height, their own
  // in-content chrome and grabber.
  const sheet: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    sheetAllowedDetents: [1],
    sheetCornerRadius: theme.radius.xxl,
    sheetGrabberVisible: false,
  };
  // Onboarding's own sheets (hours, the service editor and its pickers): on iOS the
  // native bar of the sheet holds close/back, the title and actions (`SheetChrome`,
  // Liquid Glass on iOS 26), translucent over the content, plus the system grabber.
  // Android form sheets have no header; `SheetChrome` draws the chrome in content.
  const nativeSheet: NativeStackNavigationOptions = {
    ...stackOptions,
    ...sheet,
    headerShown: isIOS,
    sheetGrabberVisible: isIOS,
  };

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
          contentStyle: { backgroundColor: theme.colors.bg.canvas },
        }}>
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="onboarding/professions" />
        <Stack.Screen name="onboarding/settings" />
        <Stack.Screen name="onboarding/timezone" options={sheet} />
        <Stack.Screen name="onboarding/currency" options={sheet} />
        <Stack.Screen name="onboarding/hours" options={nativeSheet} />
        <Stack.Screen name="onboarding/services" />
        <Stack.Screen name="onboarding/service" options={nativeSheet} />
        <Stack.Screen name="onboarding/service-section" options={nativeSheet} />
        <Stack.Screen name="onboarding/service-category" options={nativeSheet} />
        <Stack.Screen name="onboarding/review" />
        {/* Finishing: no going back while the profile is being created. */}
        <Stack.Screen name="onboarding/creating" options={{ gestureEnabled: false }} />
        <Stack.Screen name="welcome" />
      </Stack>
      {step ? (
        // Floats over the steps; the fade lets scrolled content slip softly under it.
        <View
          style={[styles.header, { paddingTop: insets.top + theme.layout.topGap }]}>
          <OnboardingHeader step={step} onBack={step === 1 ? confirmSignOut : () => router.back()} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  header: {
    position: 'absolute',
    pointerEvents: 'box-none',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.space[6],
    // Solid canvas behind the header row, fading to clear over the bottom 24pt.
    experimental_backgroundImage: `linear-gradient(to bottom, ${theme.colors.bg.canvas} 0%, ${theme.colors.bg.canvas} 72%, ${theme.colors.bg.canvas}00 100%)`,
  },
}));
