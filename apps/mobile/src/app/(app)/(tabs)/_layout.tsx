import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { useCreateMenu } from '@/features/create-menu';

/**
 * The app's tabs: the native tab bar (Liquid Glass on iOS 26) — Сегодня ·
 * Календарь · Клиенты · Меню — and a separate round "+" on its right. The "+" is
 * the system search slot with a plus: iOS 26 draws it apart from the bar, and it
 * opens the create menu instead of a tab. Pushed screens live in the app stack
 * above the tabs, so the bar slides away with them. Analytics opens from
 * "Сегодня" the same way.
 *
 * Each tab is a Stack whose screens set their own scroll insets (a native header,
 * or "never" under a drawn one), so the tab doesn't force automatic insets on them.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const openCreateMenu = useCreateMenu();

  return (
    <NativeTabs
      tintColor={theme.colors.content.primary}
      screenListeners={({ route }) =>
        route.name === 'create' ? { tabPress: () => openCreateMenu() } : {}
      }>
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
      <NativeTabs.Trigger
        name="create"
        role="search"
        disabled
        accessibilityLabel={t('createMenu.title')}>
        <NativeTabs.Trigger.Icon sf="plus" md="add" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
