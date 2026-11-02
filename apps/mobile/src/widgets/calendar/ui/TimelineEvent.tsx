/**
 * What the day's `Timeline` draws inside an event (design "Календарь, день"): a visit in
 * its service colour, personal time as on "Расписание", or an empty cell that lights up under the
 * finger and books into that time. Touches are handled
 * here: `Timeline`'s own touchable has no long press and no pressed state.
 */
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { TimelineEventProps } from 'react-native-calendars';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { TimeBlock } from '@/entities/time-block';
import {
  BlockContent,
  eventCardStyles,
  type BlockLook,
  type ScheduleVisit,
} from '@/features/appointment-actions';
import { eventSwatch } from '@/shared/lib/color';
import { Icon, Text, VipBadge, type ContextMenuAnchor } from '@/shared/ui';

export type EventMeta =
  | { kind: 'visit'; visit: ScheduleVisit; range: string; dimmed: boolean; ongoing: boolean }
  | { kind: 'block'; block: TimeBlock; look: BlockLook; dimmed: boolean }
  | { kind: 'free'; dayKey: string; minutes: number };

export type CalendarTimelineEvent = TimelineEventProps & { meta: EventMeta };

/** Below this an event has room for one line. */
const TWO_LINES_HEIGHT = 44;
/** Air between events that follow each other. */
const EVENT_GAP = 2;
/** A tap that starts a scroll shouldn't flash the cell. */
const CELL_PRESS_DELAY = 80;

export interface TimelineEventHandlers {
  onVisit: (visit: ScheduleVisit) => void;
  onVisitMenu: (visit: ScheduleVisit, anchor: ContextMenuAnchor, range: string) => void;
  onBlock: (block: TimeBlock) => void;
  onBlockMenu: (block: TimeBlock, anchor: ContextMenuAnchor, look: BlockLook) => void;
  onFree: (dayKey: string, minutes: number) => void;
  /** "10:30" for minutes of a day, on the master's clock format. */
  clockTime: (minutes: number) => string;
}

/** A tap on an event. Screen readers activate the library's touchable, which calls this. */
export function pressEvent(meta: EventMeta, handlers: TimelineEventHandlers) {
  if (meta.kind === 'visit') handlers.onVisit(meta.visit);
  else if (meta.kind === 'block') handlers.onBlock(meta.block);
  else handlers.onFree(meta.dayKey, meta.minutes);
}

export function TimelineEvent({
  meta,
  width,
  height,
  handlers,
}: {
  meta: EventMeta;
  width: number;
  height: number;
  handlers: TimelineEventHandlers;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const ref = useRef<View>(null);
  const two = height >= TWO_LINES_HEIGHT;
  const size = { width, height: Math.max(height - EVENT_GAP, 0) };

  if (meta.kind === 'free') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('calendar.newAt', { time: handlers.clockTime(meta.minutes) })}
        unstable_pressDelay={CELL_PRESS_DELAY}
        onPress={() => handlers.onFree(meta.dayKey, meta.minutes)}
        style={({ pressed }) => [styles.cell, { width, height }, pressed && styles.cellOn]}
      />
    );
  }

  if (meta.kind === 'block') {
    const { block, look } = meta;
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={t('today.schedule.blockA11y', { text: `${look.range}, ${look.name}` })}
        onPress={() => handlers.onBlock(block)}
        onLongPress={() =>
          ref.current?.measureInWindow((x, y, w) =>
            handlers.onBlockMenu(block, { x, y, width: w }, look),
          )
        }
        style={({ pressed }) => [
          styles.event,
          two ? styles.eventTall : styles.eventShort,
          size,
          eventCardStyles.block,
          meta.dimmed && styles.dimmed,
          pressed && styles.pressed,
        ]}>
        {two ? (
          <BlockContent look={look} />
        ) : (
          <View style={styles.nameRow}>
            <Text variant="eventTitle" numberOfLines={1} style={styles.shrink}>
              {`${look.name} · ${look.range}`}
            </Text>
            {look.ongoing ? <OngoingMark /> : null}
          </View>
        )}
      </Pressable>
    );
  }

  const { visit, range } = meta;
  const swatch = eventSwatch(visit.color, theme.name);
  const name = visit.client
    ? [visit.client.first_name, visit.client.last_name].filter(Boolean).join(' ')
    : t('today.schedule.unknownClient');
  const unconfirmed = visit.appointment.status === 'pending';
  const services = visit.serviceNames.join(', ');

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={[range, name, services, unconfirmed ? t('calendar.awaitingReply') : '']
        .filter(Boolean)
        .join(', ')}
      onPress={() => handlers.onVisit(visit)}
      onLongPress={() =>
        ref.current?.measureInWindow((x, y, w) =>
          handlers.onVisitMenu(visit, { x, y, width: w }, range),
        )
      }
      style={({ pressed }) => [
        styles.event,
        two ? styles.eventTall : styles.eventShort,
        size,
        unconfirmed
          ? [styles.unconfirmed, { borderColor: swatch.bar }]
          : { backgroundColor: swatch.fill },
        meta.dimmed && styles.dimmed,
        pressed && styles.pressed,
      ]}>
      {unconfirmed ? null : <View style={[styles.bar, { backgroundColor: swatch.bar }]} />}
      <View style={styles.nameRow}>
        <Text variant="eventTitle" numberOfLines={1} style={styles.shrink}>
          {two ? name : `${name} · ${range.split('–')[0]}`}
        </Text>
        {two && visit.client?.is_favorite ? (
          <VipBadge accessibilityLabel={t('clients.list.vipA11y')} />
        ) : null}
        {unconfirmed ? (
          <View style={styles.pill}>
            <Text variant="micro" style={styles.pillText} numberOfLines={1}>
              {t('calendar.awaitingReply')}
            </Text>
          </View>
        ) : null}
        {meta.ongoing ? <OngoingMark /> : null}
      </View>
      {two ? (
        <Text variant="caption2" color="secondary" tabularNums numberOfLines={1}>
          {[services, range].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

function OngoingMark() {
  const { t } = useTranslation();
  return (
    <View accessible accessibilityLabel={t('today.schedule.ongoing')} style={styles.ongoing}>
      <Icon name="hourglass" size={14} color="content.primary" />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  ongoing: { marginLeft: 'auto' },
  event: {
    paddingLeft: theme.space[2.5],
    paddingRight: theme.space[2],
    gap: 1,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  eventTall: { paddingTop: 6 },
  eventShort: { justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  unconfirmed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.bg.canvas,
  },
  dimmed: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  shrink: { flexShrink: 1 },
  pill: {
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 9,
    justifyContent: 'center',
    backgroundColor: theme.colors.tone.warning.bg,
  },
  pillText: { color: theme.colors.tone.warning.fg },
  cell: { borderRadius: theme.radius.sm },
  cellOn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.brand.default,
    backgroundColor: theme.colors.brand.subtle,
  },
}));
