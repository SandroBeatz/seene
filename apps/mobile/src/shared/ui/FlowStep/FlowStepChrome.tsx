/**
 * The top of a step in a flow sheet ("Новая запись · N из 4", "Личное время · N из 2"):
 * the title with the step under it, close on the right, back on the left from step 2,
 * and the segmented progress. Labels come from the caller so the kit stays i18n-free.
 *
 * On iOS the title and buttons are the native bar of the sheet's own Stack: Back is
 * the Stack's native back button, close a toolbar item (Liquid Glass on iOS 26). The
 * bar is translucent and lies over the content, so a spacer of its height comes
 * first. Android's sheet has no header: the same chrome is drawn in content.
 */
import type { ReactNode } from 'react';
import { router, Stack, useNavigation } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { IconButton } from '../IconButton';
import { Text } from '../Text';

export interface FlowStepChromeProps {
  /** 1-based. */
  step: number;
  count: number;
  /** What this step asks ("Услуги", "Когда"): under the title, and the screen's name. */
  subtitle: string;
  /** The line above the subtitle: a plain title, or a richer node (a client with VIP). */
  title: ReactNode;
  closeLabel: string;
  backLabel: string;
  /** "Шаг 2 из 4". */
  progressLabel: string;
}

/**
 * Closes the whole flow: the sheet is the parent Stack's screen. Opened by a deep link
 * there is nothing under it, so it gives way to "Сегодня".
 */
export function useCloseFlow() {
  const navigation = useNavigation();
  return () => {
    const parent = navigation.getParent();
    // The parent's own history: `canGoBack()` would count this flow's steps too.
    if (parent && parent.getState().index > 0) parent.goBack();
    else router.replace('/');
  };
}

export function FlowStepChrome({
  step,
  count,
  subtitle,
  title,
  closeLabel,
  backLabel,
  progressLabel,
}: FlowStepChromeProps) {
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const close = useCloseFlow();
  const headerHeight = useHeaderHeight();

  const heading = (
    <View style={styles.title} accessibilityRole="header">
      {typeof title === 'string' ? <Text variant="headline">{title}</Text> : title}
      <Text variant="footnote" color="tertiary">
        {subtitle}
      </Text>
    </View>
  );
  const progress = (
    <View
      style={styles.progress}
      accessibilityRole="progressbar"
      accessibilityLabel={progressLabel}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.segment, i < step && styles.segmentOn]} />
      ))}
    </View>
  );

  if (process.env.EXPO_OS === 'ios') {
    return (
      <>
        <View style={{ height: headerHeight }} />
        <Stack.Screen options={{ headerTitle: () => heading, title: subtitle }} />
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="xmark"
            accessibilityLabel={closeLabel}
            tintColor={theme.colors.content.primary}
            onPress={close}
          />
        </Stack.Toolbar>
        {progress}
      </>
    );
  }

  return (
    <>
      <View style={styles.androidBar}>
        {step > 1 ? (
          <IconButton
            icon="chevronLeft"
            variant="neutral"
            accessibilityLabel={backLabel}
            onPress={() => navigation.goBack()}
          />
        ) : (
          <View style={styles.side} />
        )}
        <View style={styles.androidTitle}>{heading}</View>
        <IconButton
          icon="close"
          variant="neutral"
          accessibilityLabel={closeLabel}
          onPress={close}
        />
      </View>
      {progress}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { alignItems: 'center', gap: 1, maxWidth: 260 },
  androidBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
  },
  androidTitle: { flex: 1, alignItems: 'center' },
  side: { width: theme.sizing.iconButton },
  progress: {
    flexDirection: 'row',
    gap: theme.space[1],
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.border.default,
  },
  segmentOn: { backgroundColor: theme.colors.accent.default },
}));
