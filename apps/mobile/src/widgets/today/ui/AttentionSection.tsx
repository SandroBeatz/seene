/**
 * "Требуют внимания" (design "Таб · Сегодня", "Карточки «Требуют внимания» · все 7
 * типов"): a grey band with a count and a snapping row of compact cards — what
 * happened and when, who and what, two round buttons. Tap opens the visit, long
 * press opens the card's menu.
 */
import { useRef } from 'react';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { formatTime } from '@/shared/lib/formats';
import { pluralCategory, type AppLocale } from '@/shared/lib/i18n';
import { Avatar, Icon, Text, type ContextMenuAnchor, type IconName } from '@/shared/ui';
import { ATTENTION_ACTIONS, ATTENTION_TONE, type AttentionAction } from '../model/attention';
import type { AttentionCard } from '../model/useAttention';

const CARD_WIDTH = 292;
const CARD_GAP = 10;
const WEEK = 7;

const ACTION_ICON: Record<AttentionAction, IconName> = {
  confirm: 'check',
  decline: 'close',
  complete: 'check',
  no_show: 'noShow',
  propose_time: 'whatsapp',
  call: 'call',
  message: 'whatsapp',
  dismiss: 'check',
  send_reminders: 'whatsapp',
  snooze: 'clock',
  invite: 'whatsapp',
};

export interface AttentionFormat {
  zone: string;
  todayKey: string;
  timeFormat: 12 | 24;
  locale: AppLocale;
  /** "3 200" — the amount without currency, as the design shows it. */
  formatNumber: (n: number) => string;
}

export interface AttentionSectionProps {
  cards: AttentionCard[];
  format: AttentionFormat;
  onAction: (card: AttentionCard, action: AttentionAction) => void;
  onOpen: (card: AttentionCard) => void;
  onNote: (card: AttentionCard) => void;
  onMenu: (card: AttentionCard, anchor: ContextMenuAnchor) => void;
}

export function AttentionSection({
  cards,
  format,
  onAction,
  onOpen,
  onNote,
  onMenu,
}: AttentionSectionProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const screen = useWindowDimensions();
  // One card fills the row; several peek so the row reads as scrollable.
  const width = cards.length === 1 ? screen.width - theme.space[5] * 2 : CARD_WIDTH;

  return (
    <View style={styles.band}>
      <View style={styles.head}>
        <Text variant="headline" accessibilityRole="header">
          {t('today.attention.title')}
        </Text>
        <View style={styles.count}>
          <Text variant="captionStrong" tabularNums>
            {cards.length}
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
        accessibilityRole="list">
        {cards.map((card) => (
          <AttentionCardItem
            key={card.key}
            card={card}
            width={width}
            format={format}
            onAction={(action) => onAction(card, action)}
            onOpen={() => onOpen(card)}
            onNote={() => onNote(card)}
            onMenu={(anchor) => onMenu(card, anchor)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface AttentionCardItemProps {
  card: AttentionCard;
  width: number;
  format: AttentionFormat;
  onAction: (action: AttentionAction) => void;
  onOpen: () => void;
  onNote: () => void;
  onMenu: (anchor: ContextMenuAnchor) => void;
}

function AttentionCardItem({
  card,
  width,
  format,
  onAction,
  onOpen,
  onNote,
  onMenu,
}: AttentionCardItemProps) {
  const ref = useRef<View>(null);
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      onPress={onOpen}
      onLongPress={
        card.kind === 'tomorrow_reminders'
          ? undefined
          : () => ref.current?.measureInWindow((x, y, w) => onMenu({ x, y, width: w }))
      }
      style={({ pressed }) => [pressed && styles.pressed]}>
      <AttentionCardView
        card={card}
        width={width}
        format={format}
        onAction={onAction}
        onNote={onNote}
      />
    </Pressable>
  );
}

/** The card itself — also the lifted card of its long-press menu (no handlers). */
export function AttentionCardView({
  card,
  width,
  format,
  onAction,
  onNote,
}: {
  card: AttentionCard;
  width: number;
  format: AttentionFormat;
  onAction?: (action: AttentionAction) => void;
  onNote?: () => void;
}) {
  const { t } = useTranslation();
  const text = describe(card, format, t);
  const tone = ATTENTION_TONE[card.kind];
  const { secondary, primary } = ATTENTION_ACTIONS[card.kind];
  const hasNote = card.kind !== 'tomorrow_reminders' && !!card.visit?.appointment.notes?.trim();

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.cardHead}>
        <View style={[styles.dot, styles.toneDot(tone)]} />
        <Text variant="micro" style={[styles.toneText(tone), styles.shrink]} numberOfLines={1}>
          {t(`today.attention.kinds.${card.kind}`)}
        </Text>
        <Text variant="microMedium" color="tertiary" tabularNums style={styles.when}>
          {text.when}
        </Text>
      </View>
      <View style={styles.body}>
        {card.kind === 'tomorrow_reminders' ? (
          <View style={styles.remindIcon}>
            <Icon name="whatsapp" size={14} />
          </View>
        ) : (
          <Avatar name={text.name} emoji={text.emoji} size="sm" />
        )}
        <View style={styles.grow}>
          <View style={styles.nameRow}>
            <Text variant="eventTitle" numberOfLines={1} style={styles.shrink}>
              {text.name}
            </Text>
            {hasNote ? (
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
            {text.subtitle}
          </Text>
        </View>
        <View style={styles.buttons}>
          {secondary ? (
            <RoundButton
              action={secondary}
              variant="secondary"
              onPress={onAction && (() => onAction(secondary))}
            />
          ) : null}
          <RoundButton
            action={primary}
            variant="primary"
            onPress={onAction && (() => onAction(primary))}
          />
        </View>
      </View>
    </View>
  );
}

function RoundButton({
  action,
  variant,
  onPress,
}: {
  action: AttentionAction;
  variant: 'primary' | 'secondary';
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const icon = ACTION_ICON[action];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`today.attention.actions.${action}`)}
      hitSlop={6}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        variant === 'primary' ? styles.roundPrimary : styles.roundSecondary,
        pressed && styles.pressed,
      ]}>
      {/* The WhatsApp mark keeps its own green; other glyphs follow the button. */}
      <Icon
        name={icon}
        size={13}
        color={variant === 'primary' ? 'accent.onAccent' : 'content.primary'}
      />
    </Pressable>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

/** The card's words: when, who, and what. */
function describe(card: AttentionCard, format: AttentionFormat, t: T) {
  const plural = (key: string, count: number) =>
    t(`today.attention.${key}_${pluralCategory(count, format.locale)}`, { count });

  if (card.kind === 'tomorrow_reminders') {
    return {
      when: t('preview.day.tomorrow'),
      name: plural('clients', card.appointments.length),
      subtitle: t('today.attention.remindersReady'),
      emoji: null,
    };
  }
  if (card.kind === 'recall') {
    const weeks = card.cadenceDays >= 2 * WEEK;
    return {
      when:
        card.sinceDays >= 2 * WEEK
          ? plural('sinceWeeks', Math.round(card.sinceDays / WEEK))
          : plural('sinceDays', card.sinceDays),
      name: fullName(card.client),
      subtitle: weeks
        ? plural('cadenceWeeks', Math.round(card.cadenceDays / WEEK))
        : plural('cadenceDays', card.cadenceDays),
      emoji: card.client?.emoji ?? null,
    };
  }
  const visit = card.visit!;
  return {
    when: visitWhen(visit.appointment.start_at, format, t),
    name: fullName(visit.client) || t('today.schedule.unknownClient'),
    subtitle: [visit.serviceNames.join(' + '), format.formatNumber(visit.price)]
      .filter(Boolean)
      .join(' · '),
    emoji: visit.client?.emoji ?? null,
  };
}

const fullName = (client: { first_name: string; last_name: string | null } | undefined) =>
  client ? [client.first_name, client.last_name].filter(Boolean).join(' ') : '';

/** "Сегодня · 11:30", "Ср 28 · 12:00". */
function visitWhen(iso: string, format: AttentionFormat, t: T) {
  const local = DateTime.fromISO(iso, { zone: 'utc' }).setZone(format.zone);
  const days = Math.round(
    local.startOf('day').diff(DateTime.fromISO(format.todayKey, { zone: format.zone }), 'days')
      .days,
  );
  const relative = days === 0 ? 'today' : days === 1 ? 'tomorrow' : days === -1 ? 'yesterday' : null;
  // Hermes' Intl has no weekday names, so they come from i18n.
  const day = relative
    ? t(`preview.day.${relative}`)
    : `${(t('weekdays.short', { returnObjects: true }) as string[])[local.weekday - 1]} ${local.day}`;
  return `${day} · ${formatTime(iso, { zone: format.zone, timeFormat: format.timeFormat })}`;
}

type Tone = (typeof ATTENTION_TONE)[keyof typeof ATTENTION_TONE];

const styles = StyleSheet.create((theme) => ({
  band: {
    marginHorizontal: -theme.space[5],
    paddingTop: theme.space[4],
    paddingBottom: 18,
    backgroundColor: theme.colors.bg.surface,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.space[5],
  },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.elevated,
  },
  row: { gap: CARD_GAP, paddingTop: theme.space[3], paddingHorizontal: theme.space[5] },
  pressed: { opacity: 0.7 },
  card: {
    gap: theme.space[2],
    paddingVertical: 10,
    paddingLeft: theme.space[3],
    paddingRight: 10,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.elevated,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  toneDot: (tone: Tone) => ({ backgroundColor: theme.colors.tone[tone].dot }),
  toneText: (tone: Tone) => ({ color: theme.colors.tone[tone].fg }),
  when: { marginLeft: 'auto' },
  body: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  remindIcon: {
    width: theme.sizing.avatar.sm,
    height: theme.sizing.avatar.sm,
    borderRadius: theme.sizing.avatar.sm / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.tone.success.bg,
  },
  grow: { flex: 1, minWidth: 0, gap: 1 },
  shrink: { flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  noteButton: { width: 20, height: 18, alignItems: 'center', justifyContent: 'center' },
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
  buttons: { flexDirection: 'row', gap: 6 },
  round: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPrimary: { backgroundColor: theme.colors.accent.default },
  roundSecondary: { backgroundColor: theme.colors.bg.surface },
}));
