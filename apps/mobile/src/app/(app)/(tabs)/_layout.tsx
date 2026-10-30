import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { CreateMenu } from '@/features/create-menu';

/** Height of the native tab bar above the bottom safe area (UIKit 49, Material 80). */
const TAB_BAR_HEIGHT = process.env.EXPO_OS === 'ios' ? 49 : 80;

/**
 * The app's tabs: the native tab bar (Liquid Glass on iOS 26) — Сегодня ·
 * Календарь · Клиенты · Меню — and the "+" floating over its right end, which opens
 * the create card. Pushed screens live in the app stack above the tabs, so the bar
 * and the "+" slide away with them. Analytics opens from "Сегодня" the same way.
 *
 * Each tab is a Stack whose screens set their own scroll insets (a native header,
 * or "never" under a drawn one), so the tab doesn't force automatic insets on them.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <NativeTabs tintColor={theme.colors.content.primary}>
        <NativeTabs.Trigger name="(home)" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="today" />
          <NativeTabs.Trigger.Label>{t('tabs.today')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(calendar)" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
          <NativeTabs.Trigger.Label>{t('tabs.calendar')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(clients)" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person.2', selected: 'person.2.fill' }}
            md="group"
          />
          <NativeTabs.Trigger.Label>{t('tabs.clients')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(settings)" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Icon sf="line.3.horizontal" md="menu" />
          <NativeTabs.Trigger.Label>{t('tabs.menu')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <CreateMenu bottom={insets.bottom + TAB_BAR_HEIGHT + theme.space[3]} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
