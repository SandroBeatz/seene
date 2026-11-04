/**
 * "Онлайн-запись" (design AppMenuBooking). Left out for now: prepayment (no payment flow),
 * "Спрашивать имя" (a new client's name is required, a returning client isn't asked),
 * notifications (push, phase 10) and the message after booking (templates, phase 8).
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  masterPageLabel,
  useMasterProfileQuery,
  useMasterSettingsQuery,
  useUpdateMasterSettings,
} from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import {
  GroupedCard,
  ListItem,
  ScreenScrollView,
  SectionLabel,
  Switch,
  Text,
  showFailedToast,
  showToast,
} from '@/shared/ui';
import { optionValue, type BookingOption } from '../lib/options';
import { useOptionLabel } from './useOptionLabel';

type SwitchColumn =
  | 'online_booking_enabled'
  | 'allow_client_reschedule'
  | 'booking_show_prices'
  | 'booking_allow_comment';

export function BookingSettingsScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const services = useServicesQuery(userId);
  const update = useUpdateMasterSettings(userId);
  const optionLabel = useOptionLabel();
  const data = settings.data;
  if (!data) return null;

  const save = (patch: Parameters<typeof update.mutate>[0]) =>
    update.mutate(patch, {
      onSuccess: () => {
        if (patch.online_booking_enabled === false) {
          showToast({ title: t('toasts.bookingOff'), summary: t('toasts.bookingOffHint') });
        } else if (patch.online_booking_enabled === true) {
          showToast({ title: t('toasts.bookingOn') });
        }
      },
      onError: () => showFailedToast(() => save(patch)),
    });

  const toggle = (column: SwitchColumn, title: string, subtitle?: string) => (
    <ListItem
      size="menu"
      inset={false}
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          value={data[column] ?? false}
          onValueChange={(value) => save({ [column]: value })}
          accessibilityLabel={title}
        />
      }
    />
  );

  const choice = (option: BookingOption, title: string) => (
    <ListItem
      size="menu"
      inset={false}
      title={title}
      trailingText={optionLabel(option, optionValue(data, option))}
      onPress={() => router.push({ pathname: '/booking/option', params: { option } })}
    />
  );

  const active = services.data?.filter((service) => service.is_active);
  const online = active?.filter((service) => service.show_online);

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <GroupedCard variant="menu">
        {toggle(
          'online_booking_enabled',
          t('menuHome.booking.accept'),
          t('menuHome.booking.acceptHint'),
        )}
      </GroupedCard>
      {profile.data ? (
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {t('menuHome.booking.link', { link: masterPageLabel(profile.data.username) })}
        </Text>
      ) : null}

      <Section label={t('menuHome.booking.rules')}>
        <ListItem
          size="menu"
          inset={false}
          title={t('menuHome.booking.manual')}
          right={
            <Switch
              value={data.booking_default_status === 'pending'}
              onValueChange={(manual) =>
                save({ booking_default_status: manual ? 'pending' : 'confirmed' })
              }
              accessibilityLabel={t('menuHome.booking.manual')}
            />
          }
        />
        {choice('notice', t('menuHome.booking.notice'))}
        {choice('horizon', t('menuHome.booking.horizon'))}
        {choice('step', t('menuHome.booking.step'))}
        {choice('buffer', t('menuHome.booking.buffer'))}
      </Section>

      <Section label={t('menuHome.booking.cancelSection')}>
        {choice('cancel', t('menuHome.booking.cancel'))}
        {toggle('allow_client_reschedule', t('menuHome.booking.move'))}
      </Section>

      <Section label={t('menuHome.booking.visible')}>
        <ListItem
          size="menu"
          inset={false}
          title={t('menuHome.booking.services')}
          trailingText={
            active && online
              ? t('menuHome.booking.servicesCount', { on: online.length, all: active.length })
              : undefined
          }
          onPress={() => router.push('/booking/services')}
        />
        {toggle('booking_show_prices', t('menuHome.booking.prices'))}
        {toggle('booking_allow_comment', t('menuHome.booking.comment'))}
      </Section>
    </ScreenScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.label}>
        <SectionLabel label={label} />
      </View>
      <GroupedCard variant="menu">{children}</GroupedCard>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.space[5], paddingTop: theme.space[2] },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  section: { marginTop: theme.space[5.5] },
  label: { marginBottom: theme.space[2], marginHorizontal: theme.space[1] },
}));
