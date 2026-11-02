/**
 * A schedule event's card content ("Сегодня", calendar) and the lifted copy of it that
 * heads its long-press menu: time, client, services and price, or personal time.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { scheduleCardLook } from '@/entities/appointment';
import { eventSwatch } from '@/shared/lib/color';
import { Icon, Text } from '@/shared/ui';
import type { ScheduleVisit } from '../model/schedule-menu';

/** What a personal time row says: "13:30–15:00" and "Учёба". */
export interface BlockLook {
  range: string;
  name: string;
  /** Happening right now: an hourglass instead of the cup. */
  ongoing?: boolean;
}

export function visitCardInfo(
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
  const { look, name, details } = visitCardInfo(
    visit,
    now,
    formatAmount,
    t('today.schedule.unknownClient'),
  );
  return (
    <View
      style={[
        eventCardStyles.event,
        eventCardStyles.lifted,
        { backgroundColor: swatch.fill },
        look.unconfirmed && { borderWidth: 1, borderStyle: 'dashed', borderColor: swatch.bar },
      ]}>
      <EventContent
        visit={visit}
        range={range}
        name={name}
        details={details}
        unconfirmed={look.unconfirmed}
        ongoing={look.ongoing}
        bar={swatch.bar}
      />
    </View>
  );
}

export function EventContent({
  visit,
  range,
  name,
  details,
  unconfirmed,
  ongoing,
  bar,
  onNote,
}: {
  visit: ScheduleVisit;
  range: string;
  name: string;
  details: string;
  unconfirmed: boolean;
  ongoing: boolean;
  bar: string;
  onNote?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <View style={[eventCardStyles.bar, { backgroundColor: bar }]} />
      <View style={eventCardStyles.eventHead}>
        <Text variant="microMedium" color="tertiary" tabularNums>
          {range}
        </Text>
        {unconfirmed ? (
          <View
            accessible
            accessibilityLabel={t('today.schedule.unconfirmed')}
            style={eventCardStyles.headMark}>
            <Icon name="unconfirmed" size={14} color="tone.warning.fg" />
          </View>
        ) : null}
        {ongoing ? (
          <View
            accessible
            accessibilityLabel={t('today.schedule.ongoing')}
            style={eventCardStyles.headMark}>
            <Icon name="hourglass" size={14} color="content.primary" />
          </View>
        ) : null}
      </View>
      <View style={eventCardStyles.nameRow}>
        <Text variant="eventTitle" numberOfLines={1} style={eventCardStyles.shrink}>
          {name}
        </Text>
        {visit.appointment.notes?.trim() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('today.note.open')}
            hitSlop={10}
            disabled={!onNote}
            onPress={onNote}
            style={eventCardStyles.noteButton}>
            <Icon name="note" size={14} color="content.secondary" />
            <View style={eventCardStyles.noteDot} />
          </Pressable>
        ) : null}
      </View>
      <Text variant="caption2" color="secondary" tabularNums numberOfLines={1}>
        {details}
      </Text>
    </>
  );
}

/** Personal time as drawn on the timeline — the lifted card of its long-press menu. */
export function BlockEventPreview({ look }: { look: BlockLook }) {
  return (
    <View style={[eventCardStyles.event, eventCardStyles.block, eventCardStyles.lifted]}>
      <BlockContent look={look} />
    </View>
  );
}

export function BlockContent({ look }: { look: BlockLook }) {
  return (
    <>
      <View style={eventCardStyles.eventHead}>
        <Text variant="microMedium" color="tertiary" tabularNums>
          {look.range}
        </Text>
        <View style={eventCardStyles.headMark}>
          <Icon
            name={look.ongoing ? 'hourglass' : 'coffee'}
            size={14}
            color={look.ongoing ? 'content.primary' : 'content.tertiary'}
          />
        </View>
      </View>
      <Text variant="eventTitle" numberOfLines={1}>
        {look.name}
      </Text>
    </>
  );
}

export const eventCardStyles = StyleSheet.create((theme) => ({
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
}));
