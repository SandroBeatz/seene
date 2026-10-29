/**
 * "Всё верно?" after step 4 (design: AppObDone): a summary card of what the four
 * steps collected, each part linking back to its step, then "Создать профиль".
 * Nothing is written here; the creating screen does the single write.
 */
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { StyleSheet } from 'react-native-unistyles';
import { zoneOffsetLabel } from '@/shared/config/time-zones';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { Avatar, Button, FormScreen, IconButton, ListItem, ScreenTitle, Text } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { formatHoursLabel, formatSentenceList } from '../model/format';

export type ReviewTarget = 'profile' | 'professions' | 'settings' | 'services';

export interface ReviewStepProps {
  onBack: () => void;
  /** "Изменить" / a row: go back to that step. */
  onEdit: (target: ReviewTarget) => void;
  onCreate: () => void;
}

export function ReviewStep({ onBack, onEdit, onCreate }: ReviewStepProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const draft = useOnboardingDraft(
    useShallow((state) => ({
      firstName: state.firstName,
      lastName: state.lastName,
      username: state.username,
      specializations: state.specializations,
      timezone: state.timezone,
      currency: state.currency,
      hours: state.hours,
      onlineBooking: state.onlineBooking,
      services: state.services,
      servicesSkipped: state.servicesSkipped,
    })),
  );

  const name = [draft.firstName.trim(), draft.lastName.trim()].filter(Boolean).join(' ');
  const professions = formatSentenceList(
    draft.specializations.map((key) => t(`onboarding.specializations.${key}`)),
    locale,
  );
  const currencyName = t(`currencies.${draft.currency}`, { defaultValue: draft.currency });
  const serviceCount = draft.services.filter((s) => s.selected).length;

  const rows: { key: string; title: string; value: string; target: ReviewTarget }[] = [
    { key: 'professions', title: t('onboarding.review.professions'), value: professions, target: 'professions' },
    {
      key: 'zone',
      title: t('onboarding.review.zoneCurrency'),
      value: `${zoneOffsetLabel(draft.timezone)}, ${currencyName.toLocaleLowerCase(locale)}`,
      target: 'settings',
    },
    {
      key: 'hours',
      title: t('onboarding.review.hours'),
      value: formatHoursLabel(draft.hours, t, locale),
      target: 'settings',
    },
    {
      key: 'online',
      title: t('onboarding.review.online'),
      value: draft.onlineBooking ? t('onboarding.review.onlineOn') : t('onboarding.review.onlineOff'),
      target: 'settings',
    },
    {
      key: 'services',
      title: t('onboarding.review.services'),
      value: draft.servicesSkipped ? t('onboarding.review.servicesNone') : String(serviceCount),
      target: 'services',
    },
  ];

  return (
    <FormScreen
      edges={['top', 'right', 'bottom', 'left']}
      footer={<Button label={t('onboarding.review.create')} onPress={onCreate} />}>
      <IconButton
        icon="chevronLeft"
        variant="neutral"
        accessibilityLabel={t('common.back')}
        onPress={onBack}
      />
      <View style={styles.title}>
        <ScreenTitle title={t('onboarding.review.title')} subtitle={t('onboarding.review.subtitle')} />
      </View>

      <View style={styles.card}>
        <View style={styles.profile}>
          <Avatar name={name} size="lg" tone="brand" />
          <View style={styles.profileText}>
            <Text variant="title3" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="subhead" color="secondary" numberOfLines={1}>
              {`getseene.app/${draft.username}`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.review.editProfile')}
            hitSlop={12}
            onPress={() => onEdit('profile')}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text variant="subheadStrong">{t('onboarding.review.edit')}</Text>
          </Pressable>
        </View>
        <View style={styles.rows}>
          {rows.map((row, index) => (
            <View key={row.key} style={index > 0 && styles.separator}>
              <ListItem
                title={row.title}
                titleTone="secondary"
                trailingText={row.value}
                size="sm"
                inset={false}
                showChevron={false}
                onPress={() => onEdit(row.target)}
              />
            </View>
          ))}
        </View>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { marginTop: theme.space[7] },
  card: {
    marginTop: theme.space[5.5],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.panel,
    overflow: 'hidden',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3.5],
    padding: theme.space[4.5],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  profileText: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
  rows: { paddingHorizontal: theme.space[4.5], paddingVertical: theme.space[1] },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  pressed: { opacity: 0.6 },
}));
