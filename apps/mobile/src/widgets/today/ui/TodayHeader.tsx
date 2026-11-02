/**
 * "Сегодня" header (design "Таб · Сегодня"): the master's avatar (→ Меню) and the
 * greeting with their name on the left of the native header, notifications and
 * analytics on its right — native bar items side by side, so iOS 26 draws them as one
 * Liquid Glass capsule. There is no notifications feed yet: the bell says so.
 */
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Avatar, Text } from '@/shared/ui';
import type { GreetingPeriod } from '../model/first-steps';

export interface TodayHeaderProps {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  greeting: GreetingPeriod;
}

export function TodayHeader({ firstName, lastName, avatarUrl, greeting }: TodayHeaderProps) {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('today.openMenu')}
            onPress={() => router.navigate('/settings')}
            style={styles.row}>
            <Avatar name={`${firstName} ${lastName}`} imageUrl={avatarUrl} size="md" tone="brand" />
            <View style={styles.names}>
              <Text variant="footnote" color="secondary" numberOfLines={1}>
                {t(`today.greeting.${greeting}`)}
              </Text>
              <Text variant="calloutStrong" numberOfLines={1}>
                {firstName}
              </Text>
            </View>
          </Pressable>
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="bell"
          accessibilityLabel={t('today.notifications')}
          onPress={() => Alert.alert(t('today.notifications'), t('today.notificationsEmpty'))}
        />
        <Stack.Toolbar.Button
          icon="chart.bar.xaxis"
          accessibilityLabel={t('tabs.analytics')}
          onPress={() => router.push('/analytics')}
        />
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  names: { maxWidth: 200, gap: 1 },
}));
