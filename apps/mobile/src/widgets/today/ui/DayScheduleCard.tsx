/**
 * "Расписание" card (design "Таб · Сегодня"): the day as a timeline — visits tinted
 * with their service colour, personal time in grey and the green "now" line. Ended
 * ones are dimmed; unconfirmed visits get a dashed outline in their colour and a
 * warning mark. An empty day shows the free hours.
 */
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { scheduleCardLook, type Appointment } from '@/entities/appointment';
import type { TimeBlock } from '@/entities/time-block';
import { eventSwatch } from '@/shared/lib/color';
import { formatTime } from '@/shared/lib/formats';
import type { TimeInterval, TimelineItem } from '@/shared/lib/scheduling';
import { Icon, Text, type ContextMenuAnchor } from '@/shared/ui';
import type { ScheduleVisit } from '../model/useToday';

type Item = TimelineItem<Appointment, TimeBlock>;

/** What a personal time row says: "13:30–15:00" and "Учёба". */
export interface BlockLook {
  range: string;
  name: string;
}

export interface DayScheduleCardProps {
  /** "Вторник, 27 октября · 5 записей". */
  subtitle: string;
  timeline: Item[];
  visitById: ReadonlyMap<string, ScheduleVisit>;
  /** Working hours today, or null on a day off. */
  hours: TimeInterval | null;
  now: number;
  zone: string;
  timeFormat: 12 | 24;
  formatAmount: (amount: number) => string;
  onOpenVisit: (visit: ScheduleVisit) => void;
  onOpenNote: (visit: ScheduleVisit) => void;
  /** Long press: the menu, anchored where the event is and with its time range. */
  onMenu: (visit: ScheduleVisit, anchor: ContextMenuAnchor, range: string) => void;
  onOpenBlock: (block: TimeBlock) => void;
  /** Long press on personal time: its menu, with the row as drawn. */
  onBlockMenu: (block: TimeBlock, anchor: ContextMenuAnchor, look: BlockLook) => void;
}

export function DayScheduleCard({
  subtitle,
  timeline,
  visitById,
  hours,
  now,
  zone,
  timeFormat,
  formatAmount,
  onOpenVisit,
  onOpenNote,
  onMenu,
  onOpenBlock,
  onBlockMenu,
}: DayScheduleCardProps) {
  const { t } = useTranslation();
  const time = (iso: string) => formatTime(iso, { zone, timeFormat });
  const hasEvents = timeline.some((item) => item.kind === 'appointment' || item.kind === 'block');

  return (
    <View style={styles.card}>
      <Text variant="headline">{t('today.schedule.title')}</Text>
      <Text variant="footnote" color="secondary" style={styles.subtitle}>
        {subtitle}
      </Text>

      {hasEvents ? (
        <View style={styles.list}>
          {timeline.map((item) => {
            switch (item.kind) {
              case 'appointment': {
                const visit = visitById.get(item.record.id);
                if (!visit) return null;
                const range = `${time(item.start)}–${time(item.end)}`;
                return (
                  <VisitRow
                    key={item.record.id}
                    visit={visit}
                    label={time(item.start)}
                    range={range}
                    now={now}
                    formatAmount={formatAmount}
                    onPress={() => onOpenVisit(visit)}
                    onLongPress={(anchor) => onMenu(visit, anchor, range)}
                    onNote={() => onOpenNote(visit)}
                  />
                );
              }
              case 'block': {
                const look = {
                  range: item.allDay
                    ? t('today.schedule.allDay')
                    : `${time(item.start)}–${time(item.end)}`,
                  name: item.record.notes?.trim() || t('today.schedule.personal'),
                };
                return (
                  <BlockRow
                    key={item.record.id}
                    label={item.allDay ? '' : time(item.start)}
                    look={look}
                    dimmed={new Date(item.end).getTime() <= now}
                    onPress={() => onOpenBlock(item.record)}
                    onLongPress={(anchor) => onBlockMenu(item.record, anchor, look)}
                  />
                );
              }
              case 'now':
                return <NowLine key="now" label={time(item.at)} />;
            }
          })}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text variant="bodyStrong" align="center">
            {t('today.schedule.empty')}
          </Text>
          <Text variant="footnote" color="secondary" align="center">
            {hours
              ? t('today.schedule.freeFrom', { from: time(hours.start), to: time(hours.end) })
              : t('today.schedule.dayOff')}
          </Text>
        </View>
      )}
    </View>
  );
}

interface VisitRowProps {
  visit: ScheduleVisit;
  label: string;
  range: string;
  now: number;
  formatAmount: (amount: number) => string;
  onPress: () => void;
  onLongPress: (anchor: ContextMenuAnchor) => void;
  onNote: () => void;
}

function visitInfo(
  visit: ScheduleVisit,
  now: number,
  formatAmount: (amount: number) => string,
  unknownClient: string,
) {
  return {
    look: scheduleCardLook(visit.appointment, now),
    name: visit.client
      ? [visit.client.first_name, visit.client.last_name].filter(Boolean).join(' ')
      : unknownClient,
    details: [visit.serviceNames.join(', '), formatAmount(visit.price)].filter(Boolean).join(' · '),
  };
}

function VisitRow({
  visit,
  label,
  range,
  now,
  formatAmount,
  onPress,
  onLongPress,
  onNote,
}: VisitRowProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const ref = useRef<View>(null);
  const swatch = eventSwatch(visit.color, theme.name);
  const { look, name, details } = visitInfo(
    visit,
    now,
    formatAmount,
    t('today.schedule.unknownClient'),
  );

  return (
    <View style={[styles.row, look.dimmed && styles.dimmed]}>
      <Text variant="caption2" color="secondary" tabularNums style={styles.time}>
        {label}
      </Text>
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={[
          range,
          name,
          details,
          look.unconfirmed ? t('today.schedule.unconfirmed') : '',
        ]
          .filter(Boolean)
          .join(', ')}
        onPress={onPress}
        onLongPress={() =>
          ref.current?.measureInWindow((x, y, width) => onLongPress({ x, y, width }))
        }
        style={({ pressed }) => [
          styles.event,
          { backgroundColor: swatch.fill },
          look.unconfirmed && { borderWidth: 1, borderStyle: 'dashed', borderColor: swatch.bar },
          pressed && styles.pressed,
        ]}>
        <EventContent
          visit={visit}
          range={range}
          name={name}
          details={details}
          unconfirmed={look.unconfirmed}
          bar={swatch.bar}
          onNote={onNote}
        />
      </Pressable>
    </View>
  );
}

/** A schedule event as drawn on the timeline — the lifted card of its long-press menu. */
export function VisitEventPreview({
  visit,
  range,
  now,
  formatAmount,
}: {
  visit: ScheduleVisit;
  range: string;
  now: number;
  formatAmount: (amount: number) => string;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const swatch = eventSwatch(visit.color, theme.name);
  const { look, name, details } = visitInfo(
    visit,
    now,
    formatAmount,
    t('today.schedule.unknownClient'),
  );
  return (
    <View
      style={[
        styles.event,
        styles.lifted,
        { backgroundColor: swatch.fill },
        look.unconfirmed && { borderWidth: 1, borderStyle: 'dashed', borderColor: swatch.bar },
      ]}>
      <EventContent
        visit={visit}
        range={range}
        name={name}
        details={details}
        unconfirmed={look.unconfirmed}
        bar={swatch.bar}
      />
    </View>
  );
}

function EventContent({
  visit,
  range,
  name,
  details,
  unconfirmed,
  bar,
  onNote,
}: {
  visit: ScheduleVisit;
  range: string;
  name: string;
  details: string;
  unconfirmed: boolean;
  bar: string;
  onNote?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <View style={[styles.bar, { backgroundColor: bar }]} />
      <View style={styles.eventHead}>
        <Text variant="microMedium" color="tertiary" tabularNums>
          {range}
        </Text>
        {unconfirmed ? (
          <View
            accessible
            accessibilityLabel={t('today.schedule.unconfirmed')}
            style={styles.headMark}>
            <Icon name="unconfirmed" size={14} color="tone.warning.fg" />
          </View>
        ) : null}
      </View>
      <View style={styles.nameRow}>
        <Text variant="eventTitle" numberOfLines={1} style={styles.shrink}>
          {name}
        </Text>
        {visit.appointment.notes?.trim() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('today.note.open')}
            hitSlop={10}
            disabled={!onNote}
            onPress={onNote}
            style={styles.noteButton}>
            <Icon name="note" size={14} color="content.secondary" />
            <View style={styles.noteDot} />
          </Pressable>
        ) : null}
      </View>
      <Text variant="caption2" color="secondary" tabularNums numberOfLines={1}>
        {details}
      </Text>
    </>
  );
}

function BlockRow({
  label,
  look,
  dimmed,
  onPress,
  onLongPress,
}: {
  label: string;
  look: BlockLook;
  dimmed: boolean;
  onPress: () => void;
  onLongPress: (anchor: ContextMenuAnchor) => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<View>(null);
  return (
    <View style={[styles.row, dimmed && styles.dimmed]}>
      <Text variant="caption2" color="secondary" tabularNums style={styles.time}>
        {label}
      </Text>
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={t('today.schedule.blockA11y', { text: `${look.range}, ${look.name}` })}
        onPress={onPress}
        onLongPress={() =>
          ref.current?.measureInWindow((x, y, width) => onLongPress({ x, y, width }))
        }
        style={({ pressed }) => [styles.event, styles.block, pressed && styles.pressed]}>
        <BlockContent look={look} />
      </Pressable>
    </View>
  );
}

/** Personal time as drawn on the timeline — the lifted card of its long-press menu. */
export function BlockEventPreview({ look }: { look: BlockLook }) {
  return (
    <View style={[styles.event, styles.block, styles.lifted]}>
      <BlockContent look={look} />
    </View>
  );
}

function BlockContent({ look }: { look: BlockLook }) {
  return (
    <>
      <View style={styles.eventHead}>
        <Text variant="microMedium" color="tertiary" tabularNums>
          {look.range}
        </Text>
        <View style={styles.headMark}>
          <Icon name="coffee" size={14} color="content.tertiary" />
        </View>
      </View>
      <Text variant="eventTitle" numberOfLines={1}>
        {look.name}
      </Text>
    </>
  );
}

function NowLine({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <View
      style={styles.now}
      accessible
      accessibilityLabel={t('today.schedule.nowA11y', { time: label })}>
      <View style={styles.nowPill}>
        <Text variant="micro" color="white" tabularNums>
          {label}
        </Text>
      </View>
      <View style={styles.nowLine} />
    </View>
  );
}

const TIME_COLUMN = 36;
const styles = StyleSheet.create((theme) => ({
  card: {
    padding: theme.space[3.5],
    paddingLeft: theme.space[3],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.elevated,
  },
  subtitle: { marginTop: 2 },
  list: { marginTop: theme.space[3.5], gap: theme.space[1.5] },
  row: { flexDirection: 'row', gap: theme.space[2.5] },
  dimmed: { opacity: 0.7 },
  time: { width: TIME_COLUMN, paddingTop: 2 },
  event: {
    flex: 1,
    minWidth: 0,
    gap: 1,
    paddingVertical: 7,
    paddingRight: theme.space[2.5],
    paddingLeft: theme.space[3],
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },
  lifted: { flex: 0 },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  eventHead: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  /** The mark at the end of the time line. */
  headMark: { marginLeft: 'auto' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  shrink: { flexShrink: 1 },
  noteButton: {
    width: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteDot: {
    position: 'absolute',
    top: 1,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.bg.elevated,
    backgroundColor: theme.colors.brand.default,
  },
  block: { backgroundColor: theme.colors.bg.sunken },
  now: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2], marginVertical: 2 },
  nowPill: {
    width: 40,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    // Fixed green in both themes: white text stays readable on it.
    backgroundColor: theme.colors.constant.success,
  },
  nowLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: theme.colors.constant.success },
  empty: {
    marginTop: theme.space[3.5],
    paddingVertical: theme.space[5.5],
    paddingHorizontal: theme.space[4],
    gap: theme.space[1],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.dashed,
  },
}));
