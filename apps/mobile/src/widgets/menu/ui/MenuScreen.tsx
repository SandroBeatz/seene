/**
 * The "Меню" tab (design "Меню v2 · разделы по темам"): online booking (page, portfolio,
 * accepting bookings), work, clients, money, then account, settings and help. The screen has
 * no bar, so content dissolves under the status bar while scrolling.
 */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useMasterProfileQuery, useMasterSettingsQuery } from '@/entities/master';
import { usePortfolioQuery } from '@/entities/portfolio';
import { useProductsQuery } from '@/entities/product';
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
  const portfolio = usePortfolioQuery(userId);
  const products = useProductsQuery(userId);
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

        <MenuGroup label={t('menuHome.bookingGroup')}>
          {profile.data ? <PageLinkCard username={profile.data.username} /> : null}
          <MenuRow
            icon="home"
            title={t('menuHome.page.title')}
            value={t('menuHome.page.value')}
            onPress={() => router.push('/settings/page')}
          />
          <MenuRow
            icon="gallery"
            title={t('menuHome.portfolio.title')}
            value={portfolio.data ? String(portfolio.data.length) : undefined}
            onPress={() => router.push('/settings/portfolio')}
          />
          <MenuRow
            icon="link"
            title={t('menuHome.booking.title')}
            value={
              settings.data
                ? t(
                    settings.data.online_booking_enabled
                      ? 'menuHome.booking.on'
                      : 'menuHome.booking.off',
                  )
                : undefined
            }
            onPress={() => router.push('/settings/booking')}
          />
        </MenuGroup>

        <MenuGroup label={t('menuHome.work')}>
          <MenuRow
            icon="services"
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
            icon="tube"
            title={t('menuHome.products.title')}
            value={products.data ? String(products.data.length) : undefined}
            onPress={() => router.push('/settings/products')}
          />
          <MenuRow
            icon="autoComplete"
            title={t('menuHome.visits.title')}
            value={
              settings.data
                ? t(
                    settings.data.auto_complete_since
                      ? 'menuHome.visits.auto'
                      : 'menuHome.visits.manual',
                  )
                : undefined
            }
            onPress={() => router.push('/settings/visits')}
          />
        </MenuGroup>

        <MenuGroup label={t('menuHome.clientsGroup')}>
          <MenuRow
            icon="bell"
            title={t('menuHome.messages.menuTitle')}
            onPress={() => router.push('/settings/messages')}
          />
        </MenuGroup>

        {moneySection}

        <MenuGroup>
          <MenuRow
            icon="userCircle"
            title={t('menuHome.account.title')}
            value={t('menuHome.account.value', { plan: t('menuHome.tariffs.currentPlan') })}
            onPress={() => router.push('/settings/account')}
          />
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
