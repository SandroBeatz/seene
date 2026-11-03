/**
 * The "Меню" tab (design "Таб · Меню: финальная версия"). Sections join as their
 * screens get built, see docs/mobile-menu-plan.md. The screen has no bar, so content
 * dissolves under the status bar while scrolling.
 */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useMasterProfileQuery, useMasterSettingsQuery } from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { appVersionLabel } from '@/shared/lib/app-version';
import { MenuGroup, MenuRow, ScrollFade, Text, useScrollFade } from '@/shared/ui';
import { MenuProfileCard } from './MenuProfileCard';
import { PageLinkCard } from './PageLinkCard';

/** The "+" floating above the tab bar: the last row scrolls clear of it. */
const FAB_CLEARANCE = 80;

export interface MenuScreenProps {
  /** The "Деньги" group: another widget, so the route passes it in. */
  moneySection: ReactNode;
}

export function MenuScreen({ moneySection }: MenuScreenProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const fade = useScrollFade();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const services = useServicesQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const servicesCount = services.data?.filter((service) => service.is_active).length;

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        onScroll={fade.onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + theme.space[1],
            paddingBottom: insets.bottom + FAB_CLEARANCE,
          },
        ]}>
        <MenuProfileCard profile={profile.data} />
        {profile.data ? <PageLinkCard username={profile.data.username} /> : null}

        <MenuGroup label={t('menuHome.work')}>
          <MenuRow
            icon="tag"
            title={t('menuHome.services')}
            value={servicesCount === undefined ? undefined : String(servicesCount)}
            onPress={() => router.push('/settings/services')}
          />
          <MenuRow
            icon="clock"
            title={t('menuHome.hours.title')}
            onPress={() => router.push('/settings/hours')}
          />
          <MenuRow
            icon="calendar"
            title={t('menuHome.booking.title')}
            value={
              settings.data
                ? t(settings.data.online_booking_enabled ? 'menuHome.booking.on' : 'menuHome.booking.off')
                : undefined
            }
            onPress={() => router.push('/settings/booking')}
          />
        </MenuGroup>

        {moneySection}

        <MenuGroup>
          <MenuRow
            icon="settings"
            title={t('menuHome.settings')}
            onPress={() => router.push('/settings/preferences')}
          />
          <MenuRow
            icon="help"
            title={t('menuHome.help.title')}
            onPress={() => router.push('/settings/help')}
          />
        </MenuGroup>

        <Text variant="caption" color="tertiary" align="center" style={styles.version}>
          {appVersionLabel()}
        </Text>
      </Animated.ScrollView>
      <ScrollFade topFade={fade.topFade} edges="top" height={insets.top} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: { paddingHorizontal: theme.space[5] },
  version: { marginTop: theme.space[4.5] },
}));
