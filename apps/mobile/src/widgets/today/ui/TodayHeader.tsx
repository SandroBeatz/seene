/**
 * "Сегодня" header (design "Таб · Сегодня"): the master's avatar (→ Меню), the
 * greeting with their name, and the analytics button. The bell joins when
 * notifications exist.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Avatar, IconButton, Text } from '@/shared/ui';
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
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('today.openMenu')}
        onPress={() => router.navigate('/settings')}
        hitSlop={4}>
        <Avatar name={`${firstName} ${lastName}`} imageUrl={avatarUrl} size="md" tone="brand" />
      </Pressable>
      <View style={styles.names}>
        <Text variant="footnote" color="secondary">
          {t(`today.greeting.${greeting}`)}
        </Text>
        <Text variant="calloutStrong" numberOfLines={1}>
          {firstName}
        </Text>
      </View>
      <IconButton
        icon="analytics"
        accessibilityLabel={t('tabs.analytics')}
        variant="ghost"
        size="lg"
        onPress={() => router.push('/analytics')}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  names: { flex: 1, minWidth: 0, gap: 1 },
}));
