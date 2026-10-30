import { router, usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useTranslation } from 'react-i18next';
import {
  FloatingTabBar,
  FloatingTabBarAction,
  FloatingTabBarItem,
  FloatingTabBarVisibility,
} from '@/shared/ui';

/** Tab roots: the bar shows only here, pushed screens get the full height. */
const TAB_ROOTS = ['/', '/calendar', '/clients', '/settings'];

/**
 * The app's tabs (design "Таб · Сегодня"): Сегодня · Календарь · ＋ · Клиенты · Меню.
 * Headless Expo Router tabs: the hidden `TabList` declares the routes, and the
 * floating bar renders its own `TabTrigger`s, so the raised "new appointment"
 * button can sit in the middle — the native tab bar can't host it. Analytics opens
 * from "Сегодня" as a stack screen, not a tab.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const visible = TAB_ROOTS.includes(usePathname());

  return (
    <FloatingTabBarVisibility value={visible}>
      <Tabs>
        <TabSlot />
        <TabList style={{ display: 'none' }}>
          <TabTrigger name="(home)" href="/" />
          <TabTrigger name="(calendar)" href="/calendar" />
          <TabTrigger name="(clients)" href="/clients" />
          <TabTrigger name="(settings)" href="/settings" />
        </TabList>

        <FloatingTabBar visible={visible}>
          <TabTrigger name="(home)" asChild>
            <FloatingTabBarItem icon="today" label={t('tabs.today')} />
          </TabTrigger>
          <TabTrigger name="(calendar)" asChild>
            <FloatingTabBarItem icon="calendar" label={t('tabs.calendar')} />
          </TabTrigger>
          <FloatingTabBarAction
            icon="add"
            accessibilityLabel={t('navigation.quickCreate')}
            onPress={() => router.push('/quick-create')}
          />
          <TabTrigger name="(clients)" asChild>
            <FloatingTabBarItem icon="clients" label={t('tabs.clients')} />
          </TabTrigger>
          <TabTrigger name="(settings)" asChild>
            <FloatingTabBarItem icon="menu" label={t('tabs.menu')} />
          </TabTrigger>
        </FloatingTabBar>
      </Tabs>
    </FloatingTabBarVisibility>
  );
}
