import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { Icon, type IconName } from '@/shared/ui';

function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return <Icon name={name} size="md" color={focused ? 'accent.default' : 'content.tertiary'} />;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent.default,
        tabBarInactiveTintColor: theme.colors.content.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.bg.elevated,
          borderTopColor: theme.colors.border.subtle,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: t('tabs.calendar'), tabBarIcon: ({ focused }) => <TabBarIcon name="calendar" focused={focused} /> }}
      />
      <Tabs.Screen
        name="clients"
        options={{ title: t('tabs.clients'), tabBarIcon: ({ focused }) => <TabBarIcon name="clients" focused={focused} /> }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: t('tabs.analytics'), tabBarIcon: ({ focused }) => <TabBarIcon name="analytics" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} /> }}
      />
    </Tabs>
  );
}
