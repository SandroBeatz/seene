/**
 * A day off or a vacation (design AppHoursOff, AppHoursOffNew). A part of a day stays on
 * one date; the design has no screen for it, so its times use the system picker. With
 * "Предупредить клиентов" on, saving goes on to the list of clients to message.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useAppointmentsRangeQuery } from '@/entities/appointment';
import {
  useCreateTimeBlockMutation,
  useDeleteTimeBlockMutation,
  useTimeBlockQuery,
  useUpdateTimeBlockMutation,
  type TimeBlock,
} from '@/entities/time-block';
import { type TimeContext, useTimeContext } from '@/features/pick-time';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import {
  Button,
  FormScreen,
  GroupedCard,
  Input,
  ListItem,
  MonthGrid,
  SegmentedControl,
  SheetChrome,
  Switch,
  Text,
  TimePicker,
  showFailedToast,
  showToast,
} from '@/shared/ui';
import {
  dayOffRecord,
  draftOfBlock,
  EMPTY_DRAFT,
  pickRange,
  type DayOffDraft,
  type DayOffKind,
} from '../lib/day-off';
import { isAffectedVisit } from '../lib/visits';

export function DayOffSheet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ctx = useTimeContext();
  const query = useTimeBlockQuery(ctx.userId, id);
  if (ctx.isPending || (id && !query.data)) return null;
  return <DayOffForm key={id ?? 'new'} block={query.data ?? undefined} ctx={ctx} />;
}

function DayOffForm({ block, ctx }: { block?: TimeBlock; ctx: TimeContext }) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const create = useCreateTimeBlockMutation(ctx.userId);
  const update = useUpdateTimeBlockMutation(ctx.userId);
  const remove = useDeleteTimeBlockMutation(ctx.userId);
  const [draft, setDraft] = useState<DayOffDraft>(() =>
    block ? draftOfBlock(block, ctx.zone) : EMPTY_DRAFT,
  );
  // Null: not touched yet, so it follows whether any visit falls on these days.
  const [warnChoice, setWarnChoice] = useState<boolean | null>(null);
  const [timeEdge, setTimeEdge] = useState<'fromTime' | 'toTime' | null>(null);
  const [today] = useState(() => new Date());
  const patch = (next: Partial<DayOffDraft>) => setDraft((d) => ({ ...d, ...next }));

  const record = useMemo(() => dayOffRecord(draft, ctx.zone), [draft, ctx.zone]);
  const visits = useAppointmentsRangeQuery(
    ctx.userId,
    record?.start_at ?? '',
    record?.end_at ?? '',
  );
  const affected = (visits.data ?? []).filter((visit) => isAffectedVisit(visit, today));
  const warn = affected.length > 0 && (warnChoice ?? true);

  const failed = () => showFailedToast();
  const saved = () => {
    if (warn && record) {
      router.replace({
        pathname: '/hours/warn',
        params: { from: record.start_at, to: record.end_at },
      });
    } else {
      showToast({ title: t(block ? 'toasts.saved' : `toasts.${draft.kind}Added`) });
      router.back();
    }
  };
  const save = () => {
    if (!record) return;
    const options = { onSuccess: saved, onError: () => showFailedToast(save) };
    if (block) update.mutate({ id: block.id, ...record }, options);
    else create.mutate(record, options);
  };
  const confirmDelete = () =>
    Alert.alert(t('menuHome.hours.deleteTitle'), t('menuHome.hours.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          block && remove.mutate(block.id, { onSuccess: () => router.back(), onError: failed }),
      },
    ]);

  const kindLabel = t(
    draft.kind === 'vacation' ? 'menuHome.hours.kindVacation' : 'menuHome.hours.kindDayOff',
  );

  return (
    <>
      <FormScreen
        edges={['left', 'right', 'bottom']}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        footerDivider
        footer={
          <Button
            label={block ? t('common.save') : t('menuHome.hours.addSubmit')}
            disabled={!record}
            loading={create.isPending || update.isPending}
            onPress={save}
            fullWidth
          />
        }>
        <SheetChrome
          title={block ? kindLabel : t('menuHome.hours.newTitle')}
          leadingLabel={t('common.close')}
          action={
            block
              ? {
                  key: 'delete',
                  label: t('common.delete'),
                  sf: 'trash',
                  icon: 'trash',
                  destructive: true,
                  onPress: confirmDelete,
                }
              : undefined
          }
        />
        <SegmentedControl<DayOffKind>
          accessibilityLabel={t('menuHome.hours.kindA11y')}
          options={[
            { value: 'day_off', label: t('menuHome.hours.kindDayOff') },
            { value: 'vacation', label: t('menuHome.hours.kindVacation') },
          ]}
          value={draft.kind}
          onChange={(kind) => patch({ kind })}
        />

        <View style={styles.month}>
          <MonthGrid
            start={draft.start}
            end={draft.end}
            minKey={block ? undefined : ctx.dayKeyOf(today.toISOString())}
            onPick={(day) => patch(pickRange(draft, day, draft.allDay))}
            monthNames={t('months', { returnObjects: true }) as string[]}
            weekdayNames={t('weekdays.short', { returnObjects: true }) as string[]}
            prevLabel={t('common.back')}
            nextLabel={t('common.continue')}
          />
        </View>

        <View style={styles.group}>
          <GroupedCard>
            <ListItem
              size="menu"
              inset={false}
              title={t('menuHome.hours.fromDay')}
              trailingText={draft.start ? ctx.dayLabel(draft.start) : t('menuHome.hours.pickDate')}
            />
            {draft.allDay ? (
              <ListItem
                size="menu"
                inset={false}
                title={t('menuHome.hours.to')}
                trailingText={draft.end ? ctx.dayLabel(draft.end) : '—'}
              />
            ) : null}
            {!draft.allDay ? (
              <ListItem
                size="menu"
                inset={false}
                title={t('menuHome.hours.fromDay')}
                trailingText={draft.fromTime}
                onPress={() => setTimeEdge('fromTime')}
              />
            ) : null}
            {!draft.allDay ? (
              <ListItem
                size="menu"
                inset={false}
                title={t('menuHome.hours.toTime')}
                trailingText={draft.toTime}
                onPress={() => setTimeEdge('toTime')}
              />
            ) : null}
            <ListItem
              inset={false}
              title={t('menuHome.hours.allDay')}
              subtitle={t('menuHome.hours.allDayHint')}
              right={
                <Switch
                  value={draft.allDay}
                  onValueChange={(allDay) =>
                    // A part of a day is on one date.
                    patch(allDay ? { allDay } : { allDay, end: draft.start })
                  }
                  accessibilityLabel={t('menuHome.hours.allDay')}
                />
              }
            />
          </GroupedCard>
        </View>

        <View style={styles.group}>
          <GroupedCard>
            <ListItem
              inset={false}
              title={t('menuHome.hours.closeOnline')}
              right={
                <Switch
                  value={draft.closeOnline}
                  onValueChange={(closeOnline) => patch({ closeOnline })}
                  accessibilityLabel={t('menuHome.hours.closeOnline')}
                />
              }
            />
            <ListItem
              inset={false}
              title={t('menuHome.hours.warn')}
              subtitle={
                affected.length
                  ? t(`menuHome.hours.warnCount_${pluralCategory(affected.length, locale)}`, {
                      count: affected.length,
                    })
                  : t('menuHome.hours.warnNone')
              }
              right={
                <Switch
                  value={warn}
                  disabled={affected.length === 0}
                  onValueChange={setWarnChoice}
                  accessibilityLabel={t('menuHome.hours.warn')}
                />
              }
            />
          </GroupedCard>
        </View>
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {t('menuHome.hours.warnHint')}
        </Text>

        <View style={styles.note}>
          <Input
            variant="filled"
            label={t('menuHome.hours.note')}
            placeholder={t('menuHome.hours.notePlaceholder')}
            value={draft.note}
            onChangeText={(note) => patch({ note })}
            autoCapitalize="sentences"
          />
        </View>
      </FormScreen>

      <TimePicker
        visible={timeEdge !== null}
        value={timeEdge ? draft[timeEdge] : EMPTY_DRAFT.fromTime}
        title={timeEdge === 'toTime' ? t('menuHome.hours.toTime') : t('menuHome.hours.fromDay')}
        cancelLabel={t('common.cancel')}
        doneLabel={t('common.done')}
        onCancel={() => setTimeEdge(null)}
        onConfirm={(time) => {
          if (timeEdge) patch({ [timeEdge]: time });
          setTimeEdge(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2] },
  month: { marginTop: theme.space[4] },
  group: { marginTop: theme.space[3.5] },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  note: { marginTop: theme.space[4.5] },
}));
