/**
 * "Расписание" card (design "Таб · Сегодня"): the day as a timeline — visits tinted
 * with their service colour, schedule breaks hatched, personal time in grey and the
 * green "now" line. Ended visits are dimmed; unconfirmed ones get a dashed outline in
 * their colour and a warning mark. An empty day shows the free hours.
 */
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { scheduleCardLook, type Appointment } from '@/entities/appointment';
import type { TimeBlock } from '@/entities/time-block';
import { eventSwatch } from '@/shared/lib/color';
import { formatTime } from '@/shared/lib/formats';
import type { TimeInterval, TimelineItem } from '@/shared/lib/scheduling';
import { Icon, Text, type ContextMenuAnchor } from '@/shared/ui';
import type { ScheduleVisit } from '../model/useToday';

type Item = TimelineItem<Appointment, TimeBlock>;

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
              case 'break':
                return (
                  <BreakRow
                    key={`break-${item.start}`}
                    label={time(item.start)}
                    text={t('today.schedule.breakUntil', { time: time(item.end) })}
                    dimmed={new Date(item.end).getTime() <= now}
                  />
                );
              case 'block':
                return (
                  <BlockRow
                    key={item.record.id}
                    label={item.allDay ? t('today.schedule.allDay') : time(item.start)}
                    text={
                      item.record.notes?.trim()
                        ? t('today.schedule.personalNamed', { name: item.record.notes.trim() })
                        : t('today.schedule.personal')
                    }
                    dimmed={new Date(item.end).getTime() <= now}
                  />
                );
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
            style={styles.unconfirmed}>
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

function BreakRow({ label, text, dimmed }: { label: string; text: string; dimmed: boolean }) {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.row, dimmed && styles.dimmedStrong]}>
      <Text variant="caption2" color="secondary" tabularNums style={styles.slimTime}>
        {label}
      </Text>
      <View style={styles.slim}>
        {/* 135° stripes every 11pt, 6pt of them inked — the design's repeating gradient. */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {HATCH_OFFSETS.map((x) => (
            <Line
              key={x}
              x1={x}
              y1={SLIM_HEIGHT}
              x2={x + SLIM_HEIGHT}
              y2={0}
              stroke={theme.colors.border.default}
              strokeWidth={HATCH_STROKE}
            />
          ))}
        </Svg>
        <Text variant="caption" color="secondary">
          {text}
        </Text>
      </View>
    </View>
  );
}

function BlockRow({ label, text, dimmed }: { label: string; text: string; dimmed: boolean }) {
  return (
    <View style={[styles.row, dimmed && styles.dimmedStrong]}>
      <Text variant="caption2" color="secondary" tabularNums style={styles.slimTime}>
        {label}
      </Text>
      <View style={[styles.slim, styles.block]}>
        <Icon name="blocked" size={13} color="content.secondary" />
        <Text variant="captionMedium" color="secondary" numberOfLines={1} style={styles.shrink}>
          {text}
        </Text>
      </View>
    </View>
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
const SLIM_HEIGHT = 30;
/** Stripe period 11pt along the row; a 6pt band measured along it is 6·sin45° thick. */
const HATCH_STEP = 11;
const HATCH_STROKE = 6 * Math.SQRT1_2;
/** Enough stripes for the widest phone row; the rounded box clips the rest. */
const HATCH_OFFSETS = Array.from({ length: 60 }, (_, i) => i * HATCH_STEP - SLIM_HEIGHT);

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
  dimmedStrong: { opacity: 0.6 },
  time: { width: TIME_COLUMN, paddingTop: 2 },
  slimTime: { width: TIME_COLUMN, paddingTop: theme.space[2] },
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
  unconfirmed: { marginLeft: 'auto' },
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
  slim: {
    flex: 1,
    height: SLIM_HEIGHT,
    borderRadius: theme.radius.segment,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    paddingHorizontal: theme.space[3],
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
