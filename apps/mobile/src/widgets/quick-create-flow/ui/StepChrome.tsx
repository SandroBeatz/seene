/**
 * The top of a "Новая запись" step (design "Запись · N из 4"): the title — "Новая
 * запись" on step 1, then the chosen client with VIP — the step under it, close on
 * the right, back on the left from step 2, and the four-part progress.
 *
 * On iOS the title and buttons are the native bar of the modal's own Stack: Back is
 * the Stack's native back button, close a toolbar item (Liquid Glass on iOS 26). The
 * bar is translucent and lies over the content, so a spacer of its height comes
 * first. Android's sheet has no header: the same chrome is drawn in content.
 */
import { router, Stack, useNavigation } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { Client } from '@/entities/client';
import { clientName } from '@/entities/client';
import { Avatar, IconButton, Text, VipBadge } from '@/shared/ui';

export const STEP_COUNT = 4;

export interface StepChromeProps {
  /** 1…4 */
  step: number;
  /** What this step asks ("Услуги", "Дата и время"). */
  subtitle: string;
  client: Client | null;
}

/**
 * Closes the whole flow: the modal is the parent Stack's screen. Opened by a deep link
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

export function StepChrome({ step, subtitle, client }: StepChromeProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const close = useCloseFlow();
  const headerHeight = useHeaderHeight();
  const isIOS = process.env.EXPO_OS === 'ios';

  const title = <StepTitle client={client} subtitle={subtitle} />;
  const progress = (
    <View
      style={styles.progress}
      accessibilityRole="progressbar"
      accessibilityLabel={t('quickCreate.progressA11y', { step, count: STEP_COUNT })}>
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <View key={i} style={[styles.segment, i < step && styles.segmentOn]} />
      ))}
    </View>
  );

  if (isIOS) {
    return (
      <>
        <View style={{ height: headerHeight }} />
        <Stack.Screen options={{ headerTitle: () => title, title: subtitle }} />
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="xmark"
            accessibilityLabel={t('common.close')}
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
            accessibilityLabel={t('common.back')}
            onPress={() => navigation.goBack()}
          />
        ) : (
          <View style={styles.side} />
        )}
        <View style={styles.androidTitle}>{title}</View>
        <IconButton
          icon="close"
          variant="neutral"
          accessibilityLabel={t('common.close')}
          onPress={close}
        />
      </View>
      {progress}
    </>
  );
}

function StepTitle({ client, subtitle }: { client: Client | null; subtitle: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.title} accessibilityRole="header">
      {client ? (
        <View style={styles.clientLine}>
          <Avatar name={clientName(client)} color={client.avatar_color} size="sm" />
          <Text variant="headline" numberOfLines={1} style={styles.shrink}>
            {clientName(client)}
          </Text>
          {client.is_favorite ? <VipBadge accessibilityLabel={t('clients.list.vipA11y')} /> : null}
        </View>
      ) : (
        <Text variant="headline">{t('quickCreate.title')}</Text>
      )}
      <Text variant="footnote" color="tertiary">
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { alignItems: 'center', gap: 1, maxWidth: 260 },
  clientLine: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  shrink: { flexShrink: 1 },
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
