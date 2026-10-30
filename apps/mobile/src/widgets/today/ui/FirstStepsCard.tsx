/**
 * "Первые шаги" (design "Сегодня · первый день"): the setup steps still open, with a
 * "N из 3" counter. Each row opens the screen that completes it.
 */
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { Icon, Text, type IconName } from '@/shared/ui';
import type { FirstStepId, FirstStepsState } from '../model/first-steps';

const STEP: Record<FirstStepId, { icon: IconName; href: Href }> = {
  prices: { icon: 'tag', href: '/settings/services' },
  clients: { icon: 'userAdd', href: '/clients' },
  profile: { icon: 'userCircle', href: '/settings/profile' },
};

export function FirstStepsCard({ state }: { state: FirstStepsState }) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="overline" color="secondary">
          {t('today.firstSteps.title')}
        </Text>
        <Text variant="captionStrong" color="secondary">
          {t('today.firstSteps.progress', { done: state.doneCount, total: state.steps.length })}
        </Text>
      </View>
      {state.steps
        .filter((step) => !step.done)
        .map((step) => {
          const subtitle =
            step.id === 'prices'
              ? t(
                  `today.firstSteps.prices.subtitle_${pluralCategory(step.unpriced ?? 0, locale)}`,
                  {
                    count: step.unpriced ?? 0,
                  },
                )
              : t(`today.firstSteps.${step.id}.subtitle`);
          return (
            <Pressable
              key={step.id}
              accessibilityRole="button"
              onPress={() => router.push(STEP[step.id].href)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.icon}>
                <Icon name={STEP[step.id].icon} size="base" />
              </View>
              <View style={styles.text}>
                <Text variant="subheadStrong">{t(`today.firstSteps.${step.id}.title`)}</Text>
                <Text variant="caption" color="secondary">
                  {subtitle}
                </Text>
              </View>
              <Icon name="chevronRight" size="sm" color="content.tertiary" />
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    padding: theme.space[3.5],
    gap: theme.space[2],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.surface,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    padding: theme.space[3],
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.elevated,
  },
  pressed: { opacity: 0.7 },
  icon: {
    width: theme.sizing.control.sm,
    height: theme.sizing.control.sm,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.surface,
  },
  text: { flex: 1, minWidth: 0, gap: 1 },
}));
