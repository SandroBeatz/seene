/**
 * The appointment preview sheet (design "Запись · превью": предстоящая, идёт сейчас,
 * ожидает завершения, завершена): status pill, client card with call / WhatsApp /
 * reminder, date, services and price, the note, the ongoing visit's progress, and a
 * glass bottom bar whose actions follow the status. "⋯" — a native header menu —
 * holds the rest.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { PREVIEW_ACTIONS, visitProgress } from '@/entities/appointment';
import { useAppointmentActions } from '@/features/appointment-actions';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { DateTime, formatAmount, formatTime } from '@/shared/lib/formats';
import { formatDurationLabel, isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { formatPhone } from '@/shared/lib/phone';
import { EmptyState, ErrorState, SheetChrome, Skeleton, Text } from '@/shared/ui';
import { MORE_MENU, relativeDay, statusLabel } from '../model/labels';
import { usePreview } from '../model/usePreview';
import {
  AddRow,
  BottomBar,
  ClientCard,
  InfoRow,
  MENU_ICON,
  MENU_SYMBOL,
  StatusPill,
  TimerBar,
} from './parts';

export function AppointmentPreview({ appointmentId }: { appointmentId: string }) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const insets = useSafeAreaInsets();
  const preview = usePreview(appointmentId);
  const data = preview.data;
  const client = preview.client;

  const time = (iso: string) =>
    formatTime(iso, { zone: preview.zone, timeFormat: preview.timeFormat });
  const money = (amount: number) => formatAmount(amount, { currency: preview.currency, locale });

  // Date row: "Сегодня, чт 30 октября" / "Пн, 26 октября".
  let dateTitle = '';
  if (data) {
    const local = DateTime.fromISO(data.appointment.start_at, { zone: 'utc' })
      .setZone(preview.zone)
      .setLocale(locale);
    const weekday = (t('weekdays.short', { returnObjects: true }) as string[])[local.weekday - 1];
    const dayMonth = local.toFormat('d MMMM');
    const relative = relativeDay(data.dayKey, data.todayKey);
    dateTitle = relative
      ? `${t(`preview.day.${relative}`)}, ${weekday.toLocaleLowerCase(locale)} ${dayMonth}`
      : `${weekday}, ${dayMonth}`;
  }

  const actions = useAppointmentActions(
    data
      ? {
          appointment: data.appointment,
          clientFirstName: client?.first_name ?? '',
          phone: client?.phone ?? '',
          when: t('preview.when', {
            date: dateTitle.toLocaleLowerCase(locale),
            time: time(data.appointment.start_at),
          }),
          services: data.serviceNames.join(', '),
          price: money(data.price),
        }
      : null,
  );

  const sheetBottom = Math.max(insets.bottom - 6, 16);

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <SheetChrome
        title=""
        leadingLabel={t('common.close')}
        menu={
          data
            ? {
                label: t('preview.more'),
                cancelLabel: t('common.cancel'),
                items: [...MORE_MENU[data.phase].regular, ...MORE_MENU[data.phase].danger].map(
                  (action) => ({
                    key: action,
                    label:
                      action === 'note' && !data.appointment.notes?.trim()
                        ? t('preview.menu.addNote')
                        : t(`preview.menu.${action}`),
                    sf: MENU_SYMBOL[action],
                    icon: MENU_ICON[action],
                    destructive: MORE_MENU[data.phase].danger.includes(action),
                    onPress: () => actions.run(action),
                  }),
                ),
              }
            : undefined
        }
      />

      {preview.isPending ? (
        <View style={styles.content}>
          <Skeleton height={28} width={160} radius={14} />
          <Skeleton height={140} radius={18} />
          <Skeleton height={70} radius={18} />
          <Skeleton height={70} radius={18} />
        </View>
      ) : preview.error ? (
        <ErrorState
          message={t(errorMessageKey(normalizeError(preview.error)))}
          onRetry={preview.refetch}
        />
      ) : !data ? (
        <EmptyState
          icon="calendar"
          title={t('preview.missingTitle')}
          description={t('preview.missing')}
        />
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: sheetBottom + 68 + 32 }]}
            showsVerticalScrollIndicator={false}>
            <StatusPill
              phase={data.phase}
              label={(() => {
                const label = statusLabel(data.phase, data.appointment, preview.now, time);
                return t(label.key, label.params);
              })()}
            />

            <ClientCard
              client={client}
              subtitle={[
                client?.phone ? formatPhone(client.phone) : null,
                preview.visitCount !== null
                  ? t(`preview.visits_${pluralCategory(preview.visitCount, locale)}`, {
                      count: preview.visitCount,
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              onOpen={() => {
                router.dismiss();
                router.navigate({
                  pathname: '/clients/[clientId]',
                  params: { clientId: data.appointment.client_id },
                });
              }}
              onCall={() => actions.run('call')}
              onWhatsApp={() => actions.run('whatsapp')}
              onRemind={() => actions.run('remind')}
            />

            <InfoRow
              icon="calendar"
              title={<Text variant="bodyStrong">{dateTitle}</Text>}
              subtitle={
                <Text variant="footnote" color="tertiary" tabularNums>
                  {`${time(data.appointment.start_at)} – ${time(data.endAt)}`}
                </Text>
              }
              accessibilityLabel={t('preview.reschedule')}
              onPress={() => actions.run('reschedule')}
            />

            <InfoRow
              icon="services"
              title={
                <Text variant="bodyStrong" numberOfLines={2}>
                  {data.serviceNames.join(', ') || t('preview.noServices')}
                </Text>
              }
              subtitle={
                <Text variant="footnote" color="tertiary" tabularNums>
                  {formatDurationLabel(data.appointment.duration, t)}
                  {' · '}
                  {data.ownPrice ? (
                    <Text variant="footnote" color="tertiary" style={styles.strike}>
                      {money(data.listPrice)}
                    </Text>
                  ) : null}
                  {data.ownPrice ? ' ' : null}
                  <Text variant="footnoteStrong">{money(data.price)}</Text>
                  {data.ownPrice ? ` · ${t('preview.ownPrice')}` : null}
                </Text>
              }
              accessibilityLabel={t('preview.editServices')}
              onPress={() => actions.run('edit')}
            />

            {data.appointment.notes?.trim() ? (
              <InfoRow
                icon="noteCard"
                caption={t('preview.note')}
                title={
                  <Text variant="subhead" color="secondary">
                    {data.appointment.notes.trim()}
                  </Text>
                }
                accessibilityLabel={t('preview.editNote')}
                onPress={() => actions.run('note')}
              />
            ) : (
              <AddRow
                icon="noteCard"
                label={t('preview.addNote')}
                onPress={() => actions.run('note')}
              />
            )}

            {data.phase === 'ongoing' ? (
              <OngoingProgress data={data} now={preview.now} time={time} />
            ) : null}
          </ScrollView>

          {PREVIEW_ACTIONS[data.phase].timer ? (
            <TimerBar
              startAt={data.appointment.start_at}
              bottom={sheetBottom}
              disabled={actions.isPending}
              onComplete={() => actions.run('complete')}
            />
          ) : (
            <BottomBar
              actions={PREVIEW_ACTIONS[data.phase]}
              bottom={sheetBottom}
              disabled={actions.isPending}
              onAction={actions.run}
            />
          )}
        </>
      )}
    </View>
  );
}

function OngoingProgress({
  data,
  now,
  time,
}: {
  data: NonNullable<ReturnType<typeof usePreview>['data']>;
  now: number;
  time: (iso: string) => string;
}) {
  const { t } = useTranslation();
  const progress = visitProgress(data.appointment, now);
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHead}>
        <Text variant="caption" color="secondary">
          {t('preview.progress.elapsed', {
            duration: formatDurationLabel(progress.elapsedMinutes, t),
          })}
        </Text>
        <Text variant="caption" color="secondary">
          {t('preview.progress.plan', {
            duration: formatDurationLabel(progress.plannedMinutes, t),
            time: time(data.endAt),
          })}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress.ratio * 100}%` }]} />
      </View>
      <Text variant="caption" color="tertiary">
        {t('preview.progress.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  scroll: { flex: 1 },
  content: {
    paddingTop: theme.space[3.5],
    paddingHorizontal: theme.space[4],
    gap: theme.space[2.5],
  },
  strike: { textDecorationLine: 'line-through' },
  progressCard: {
    padding: theme.space[3.5],
    gap: theme.space[2],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.block,
  },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.bg.sunken,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.brand.default },
}));
