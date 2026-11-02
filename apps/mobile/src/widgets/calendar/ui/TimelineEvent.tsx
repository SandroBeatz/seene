/**
 * What the day's `Timeline` draws inside an event (design "Календарь, день"): a visit in
 * its service colour, personal time in grey, or a free window to book into. The press
 * handling lives here: `Timeline`'s own `onEventPress` keeps the events of its first
 * render, and it has no long press.
 */
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { TimelineEventProps } from 'react-native-calendars';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { TimeBlock } from '@/entities/time-block';
import type { BlockLook, ScheduleVisit } from '@/features/appointment-actions';
import { eventSwatch } from '@/shared/lib/color';
import { Text, VipBadge, type ContextMenuAnchor } from '@/shared/ui';

export type EventMeta =
  | { kind: 'visit'; visit: ScheduleVisit; range: string; dimmed: boolean }
  | { kind: 'block'; block: TimeBlock; look: BlockLook; dimmed: boolean }
  | { kind: 'free'; dayKey: string; label: string };

export type CalendarTimelineEvent = TimelineEventProps & { meta: EventMeta };

/** Below this an event has room for one line. */
const TWO_LINES_HEIGHT = 44;

export interface TimelineEventHandlers {
  onVisit: (visit: ScheduleVisit) => void;
  onVisitMenu: (visit: ScheduleVisit, anchor: ContextMenuAnchor, range: string) => void;
  onBlock: (block: TimeBlock) => void;
  onBlockMenu: (block: TimeBlock, anchor: ContextMenuAnchor, look: BlockLook) => void;
  onFree: (dayKey: string) => void;
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
  const size = { width, height };

  if (meta.kind === 'free') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={meta.label}
        onPress={() => handlers.onFree(meta.dayKey)}
        style={({ pressed }) => [styles.free, size, pressed && styles.pressed]}>
        <Text variant="captionStrong" color="secondary" tabularNums numberOfLines={1}>
          {meta.label}
        </Text>
      </Pressable>
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
          { backgroundColor: theme.colors.bg.sunken },
          meta.dimmed && styles.dimmed,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.bar, { backgroundColor: theme.colors.content.tertiary }]} />
        <Text variant="eventTitle" color="secondary" numberOfLines={1}>
          {two ? look.name : `${look.name} · ${look.range}`}
        </Text>
        {two ? (
          <Text variant="caption2" color="secondary" tabularNums numberOfLines={1}>
            {look.range}
          </Text>
        ) : null}
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
      </View>
      {two ? (
        <Text variant="caption2" color="secondary" tabularNums numberOfLines={1}>
          {[services, range].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
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
  free: {
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.dashed,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
