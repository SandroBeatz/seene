/**
 * Building blocks of the appointment preview (design "Запись · превью"): status
 * pill, client card, info rows, the glass bottom bar and its timer variant, the
 * "⋯" menu and the VIP badge.
 */
import { useEffect, type ReactNode } from 'react';
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
  Avatar,
  GlassSurface,
  Icon,
  Text,
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

// ---- Client card ----

export interface ClientCardProps {
  client: Client | null;
  subtitle: string;
  onOpen: () => void;
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
        accessibilityRole="button"
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
        <Icon name="chevronRight" size="sm" color="content.disabled" />
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

// ---- Info rows ----

export interface InfoRowProps {
  icon: IconName;
  /** Small caption above the title (the note's "Заметка"). */
  caption?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  accessibilityLabel?: string;
  onPress: () => void;
}

export function InfoRow({
  icon,
  caption,
  title,
  subtitle,
  accessibilityLabel,
  onPress,
}: InfoRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.infoRow, pressed && styles.pressed]}>
      <Icon name={icon} size="md" color="content.tertiary" />
      <View style={styles.grow}>
        {caption ? (
          <Text variant="caption" color="tertiary">
            {caption}
          </Text>
        ) : null}
        {title}
        {subtitle}
      </View>
      <Icon name="chevronRight" size="sm" color="content.disabled" />
    </Pressable>
  );
}

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
  const side = (action: AppointmentAction | null) =>
    action ? (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => onAction(action)}
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}>
        <Icon
          name={ACTION_ICON[action]}
          size="md"
          color={DESTRUCTIVE_ACTIONS.has(action) ? 'tone.danger.fg' : 'content.primary'}
        />
        <Text
          variant="caption2Medium"
          style={DESTRUCTIVE_ACTIONS.has(action) ? styles.dangerText : undefined}>
          {t(`preview.actions.${action}`)}
        </Text>
      </Pressable>
    ) : (
      <View style={styles.side} />
    );

  return (
    <View style={[styles.barWrap, { bottom }]} pointerEvents="box-none">
      <GlassSurface style={styles.barGlass} pointerEvents="none" />
      <View style={styles.barRow}>
        {side(actions.start)}
        {actions.primary ? (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => onAction(actions.primary!)}
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
            <Icon name={ACTION_ICON[actions.primary]} size="base" color="accent.onAccent" />
            <Text variant="bodyStrong" color="onAccent">
              {t(`preview.actions.${actions.primary}`)}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.gap} />
        )}
        {side(actions.end)}
      </View>
    </View>
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

const BAR_HEIGHT = 68;

const styles = StyleSheet.create((theme) => ({
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    padding: theme.space[3.5],
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
  barWrap: {
    position: 'absolute',
    left: theme.space[4],
    right: theme.space[4],
    height: BAR_HEIGHT,
  },
  barGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_HEIGHT / 2,
    boxShadow: theme.shadow.tabBar,
  },
  barRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    paddingHorizontal: theme.space[1.5],
  },
  side: {
    flex: 1,
    height: theme.sizing.row.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[1],
  },
  dangerText: { color: theme.colors.tone.danger.fg },
  gap: { width: theme.space[6] },
  primary: {
    height: theme.sizing.row.md,
    paddingHorizontal: theme.space[6.5],
    borderRadius: theme.sizing.row.md / 2,
    backgroundColor: theme.colors.accent.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    boxShadow: theme.shadow.pop,
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
