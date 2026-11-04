/**
 * Building blocks of the appointment preview (design "Запись · превью"): status
 * pill, client card, the "add" row, the glass bottom bar and its timer variant, the
 * "⋯" menu and the VIP badge.
 */
import { useEffect } from 'react';
import type { SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  DESTRUCTIVE_ACTIONS,
  PHASE_TONE,
  type AppointmentAction,
  type AppointmentPhase,
  type PreviewActions,
} from '@/entities/appointment';
import type { Client } from '@/entities/client';
import {
  ActionBar,
  Avatar,
  Icon,
  Text,
  showToast,
  useNow,
  useReducedMotion,
  VipBadge,
  type IconName,
} from '@/shared/ui';
import type { MenuAction } from '../model/labels';

// ---- Status pill ----

const PHASE_ICON: Record<AppointmentPhase, IconName | 'pulse'> = {
  request: 'unconfirmed',
  unconfirmed: 'unconfirmed',
  overdue: 'unconfirmed',
  upcoming: 'check',
  ongoing: 'pulse',
  awaiting: 'unconfirmed',
  completed: 'check',
  cancelled: 'cancelCircle',
  no_show: 'noShow',
  expired: 'clock',
};

export function StatusPill({ phase, label }: { phase: AppointmentPhase; label: string }) {
  const { theme } = useUnistyles();
  const tone = theme.colors.tone[PHASE_TONE[phase]];
  const icon = PHASE_ICON[phase];
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      {icon === 'pulse' ? (
        <PulseDot color={tone.dot} />
      ) : (
        <Icon name={icon} size={14} color={`tone.${PHASE_TONE[phase]}.fg`} />
      )}
      <Text variant="footnoteStrong" style={{ color: tone.fg }}>
        {label}
      </Text>
    </View>
  );
}

export function PulseDot({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    opacity.value = withRepeat(withTiming(0.35, { duration: 900 }), -1, true);
  }, [opacity, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, animated]} />;
}

/** "Завершится автоматически в 18:00": no words on the card, the words on a tap. */
export function AutoCompleteMark({ label }: { label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => showToast({ title: label, icon: 'autoComplete' })}
      onLongPress={() => showToast({ title: label, icon: 'autoComplete' })}
      style={({ pressed }) => [styles.autoMark, pressed && styles.pressed]}>
      <Icon name="autoComplete" size={16} color="tone.success.fg" />
    </Pressable>
  );
}

// ---- Client card ----

export interface ClientCardProps {
  client: Client | null;
  subtitle: string;
  /** A tap on the client: another client for the visit. Left out (a closed visit), the row is still. */
  onOpen?: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onRemind: () => void;
}

export function ClientCard({
  client,
  subtitle,
  onOpen,
  onCall,
  onWhatsApp,
  onRemind,
}: ClientCardProps) {
  const { t } = useTranslation();
  const name = client ? [client.first_name, client.last_name].filter(Boolean).join(' ') : '…';
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole={onOpen ? 'button' : undefined}
        accessibilityHint={onOpen ? t('preview.changeClient') : undefined}
        disabled={!onOpen}
        onPress={onOpen}
        style={({ pressed }) => [styles.clientRow, pressed && styles.pressed]}>
        <Avatar name={name} color={client?.avatar_color} size="md" />
        <View style={styles.grow}>
          <View style={styles.inline}>
            <Text variant="calloutStrong" numberOfLines={1} style={styles.shrink}>
              {name}
            </Text>
            {client?.is_favorite ? <VipBadge accessibilityLabel={t('preview.vip')} /> : null}
          </View>
          <Text variant="footnote" color="tertiary" tabularNums numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {onOpen ? <Icon name="chevronRight" size="sm" color="content.disabled" /> : null}
      </Pressable>
      <View style={styles.quick}>
        <QuickButton icon="call" label={t('preview.call')} onPress={onCall} />
        <QuickButton icon="whatsapp" label="WhatsApp" onPress={onWhatsApp} />
        <QuickButton icon="bell" label={t('preview.remind')} onPress={onRemind} />
      </View>
    </View>
  );
}

function QuickButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}>
      <Icon name={icon} size="md" />
      <Text variant="captionMedium">{label}</Text>
    </Pressable>
  );
}

// ---- Services and chips ----

/** The services in a line and the time, amount and payment as chips (design AppEventDone). */
export function VisitCard({
  names,
  count,
  duration,
  amount,
  method,
  onServices,
  onChip,
}: {
  names: string;
  count: string;
  duration: string;
  amount: string;
  /** Only a finished visit has one. */
  method: string | null;
  onServices: () => void;
  onChip: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={onServices}
        style={({ pressed }) => [styles.servicesRow, pressed && styles.pressed]}>
        <Icon name="services" size="md" color="content.tertiary" />
        <View style={styles.grow}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {names}
          </Text>
          <Text variant="footnote" color="tertiary" numberOfLines={1}>
            {count}
          </Text>
        </View>
        <Icon name="chevronRight" size="sm" color="content.disabled" />
      </Pressable>
      <View style={styles.chips}>
        <Chip icon="clock" label={duration} onPress={onChip} />
        <Chip icon="tag" label={amount} onPress={onChip} />
        {method ? <Chip icon="check" label={method} paid onPress={onChip} /> : null}
      </View>
    </View>
  );
}

function Chip({
  icon,
  label,
  paid = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  paid?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.chip, paid && styles.chipPaid, pressed && styles.pressed]}>
      <Icon name={icon} size={14} color={paid ? 'tone.success.fg' : 'content.tertiary'} />
      <Text
        variant="footnoteStrong"
        tabularNums
        numberOfLines={1}
        style={paid ? styles.chipPaidText : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---- Add row ----

export function AddRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}>
      <Icon name={icon} size="md" color="content.secondary" />
      <Text variant="subheadMedium" color="secondary">
        {label}
      </Text>
    </Pressable>
  );
}

// ---- Bottom bar ----

const ACTION_ICON: Record<AppointmentAction, IconName> = {
  confirm: 'check',
  decline: 'cancelCircle',
  complete: 'completeVisit',
  reschedule: 'reschedule',
  cancel: 'cancelCircle',
  no_show: 'noShow',
  propose_time: 'whatsapp',
  book_again: 'repeat',
  edit: 'pencil',
};

export interface BottomBarProps {
  actions: PreviewActions;
  disabled: boolean;
  bottom: number;
  onAction: (action: AppointmentAction) => void;
}

export function BottomBar({ actions, disabled, bottom, onAction }: BottomBarProps) {
  const { t } = useTranslation();
  const item = (action: AppointmentAction | null) =>
    action
      ? {
          label: t(`preview.actions.${action}`),
          icon: ACTION_ICON[action],
          danger: DESTRUCTIVE_ACTIONS.has(action),
          onPress: () => onAction(action),
        }
      : null;

  return (
    <ActionBar
      start={item(actions.start)}
      primary={item(actions.primary)}
      end={item(actions.end)}
      disabled={disabled}
      bottom={bottom}
    />
  );
}

/** The ongoing visit's bar: a live "47:12" and "Завершить". */
export function TimerBar({
  startAt,
  bottom,
  disabled,
  onComplete,
}: {
  startAt: string;
  bottom: number;
  disabled: boolean;
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const now = useNow(1000);
  const seconds = Math.max(0, Math.floor((now - new Date(startAt).getTime()) / 1000));
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <View style={[styles.timerWrap, { bottom }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('preview.timerA11y', { minutes: Math.floor(seconds / 60) })}
        disabled={disabled}
        onPress={onComplete}
        style={({ pressed }) => [styles.timer, pressed && styles.primaryPressed]}>
        <View style={styles.inline}>
          <PulseDot color={theme.colors.brand.default} />
          <Text variant="stat" color="onAccent" tabularNums>
            {clock}
          </Text>
        </View>
        <View style={styles.timerAction}>
          <Icon name="stop" size={14} color="accent.onAccent" />
          <Text variant="footnoteStrong" color="onAccent">
            {t('preview.actions.complete')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// ---- "⋯" menu ----

/** The "⋯" menu's icons: SF Symbols on iOS (native menu), kit icons elsewhere. */
export const MENU_SYMBOL: Record<MenuAction, SFSymbol> = {
  book_again: 'arrow.clockwise',
  note: 'pencil',
  send_details: 'paperplane',
  no_show: 'person.crop.circle.badge.xmark',
  cancel: 'xmark.circle',
  delete: 'trash',
};

export const MENU_ICON: Record<MenuAction, IconName> = {
  book_again: 'repeat',
  note: 'pencil',
  send_details: 'send',
  no_show: 'noShow',
  cancel: 'cancelCircle',
  delete: 'trashBin',
};

const styles = StyleSheet.create((theme) => ({
  autoMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.surface,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    paddingTop: theme.space[3.5],
    paddingBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: theme.space[3.5],
    paddingBottom: theme.space[3.5],
  },
  chip: {
    height: 32,
    paddingLeft: theme.space[2],
    paddingRight: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.bg.surface,
  },
  chipPaid: { backgroundColor: theme.colors.tone.success.bg },
  chipPaidText: { color: theme.colors.tone.success.fg },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    height: 28,
    paddingHorizontal: theme.space[3],
    borderRadius: 14,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.elevated,
  },
  pressed: { opacity: 0.7 },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    padding: theme.space[3.5],
  },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  shrink: { flexShrink: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  quick: {
    flexDirection: 'row',
    gap: theme.space[2],
    paddingHorizontal: theme.space[3.5],
    paddingBottom: theme.space[3.5],
  },
  quickButton: {
    flex: 1,
    height: theme.sizing.row.md,
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[1],
  },
  addRow: {
    height: theme.sizing.row.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
  },
  primaryPressed: { backgroundColor: theme.colors.accent.pressed },
  timerWrap: {
    position: 'absolute',
    left: theme.space[4],
    right: theme.space[4],
    alignItems: 'center',
  },
  timer: {
    height: theme.sizing.row.md,
    paddingLeft: theme.space[4.5],
    paddingRight: theme.space[2],
    borderRadius: theme.sizing.row.md / 2,
    backgroundColor: theme.colors.accent.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    boxShadow: theme.shadow.pop,
  },
  timerAction: {
    height: theme.sizing.control.md - 4,
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.interaction.onSolidPressed,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
  },
}));
