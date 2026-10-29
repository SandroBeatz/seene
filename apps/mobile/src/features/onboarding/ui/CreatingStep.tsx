/**
 * "Создаём ваш профиль" (design: AppObCreating): the single onboarding write runs
 * while a preview of the master's booking page assembles itself, four status lines
 * tick off and a bar fills. "Дальше →" appears once both the ~5s animation and the
 * write are done; the last status line waits for the write. A failed write swaps
 * the status lines for the error, "Повторить" and a way back to the review.
 *
 * The keyframes are the design's CSS ones, run as Reanimated CSS animations. The
 * preview card is an illustration on fixed white surfaces, like the welcome hero.
 * Reduced motion: everything appears at once.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { type CSSAnimationKeyframes, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { errorMessageKey } from '@/shared/api/errors';
import { SERVICE_COLORS } from '@/shared/config/palettes';
import { timeZoneEntry } from '@/shared/config/time-zones';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { motion } from '@/shared/theme/tokens';
import { Avatar, Button, Icon, Logo, Text } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { formatDurationLabel, formatHoursLabel } from '../model/format';
import { serviceColorKey, serviceName } from '../model/services';
import { useCompleteOnboarding, useEnterApp } from '../model/submit';

/** Seconds at which each status line ticks off (the design's timeline). */
const STEP_DONE_AT = [1.1, 2.3, 3.2, 4.3] as const;
/** When "Дальше →" fades in. */
const NEXT_AT = 4.9;
const PREVIEW_SERVICES = 3;
const CARD_WIDTH = 276;
const STAGE_HEIGHT = 372;
const GLOW_SIZE = 320;

// Illustration colours of the preview's cover (not theme surfaces).
const COVER_GRADIENT = 'linear-gradient(135deg, #F3D9DF 0%, #E9C6CF 45%, #D9B3A8 100%)';

const EASE_OUT = `cubic-bezier(${motion.easing.emphasized.join(', ')})`;

const fadeIn: CSSAnimationKeyframes = { from: { opacity: 0 }, to: { opacity: 1 } };
const riseIn: CSSAnimationKeyframes = {
  from: { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.98 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};
const popIn: CSSAnimationKeyframes = {
  '0%': { opacity: 0, transform: [{ scale: 0.4 }] },
  '70%': { opacity: 1, transform: [{ scale: 1.08 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};
const float: CSSAnimationKeyframes = {
  '0%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: -5 }] },
  '100%': { transform: [{ translateY: 0 }] },
};
const glow: CSSAnimationKeyframes = {
  '0%': { opacity: 0.55, transform: [{ scale: 1 }] },
  '50%': { opacity: 0.9, transform: [{ scale: 1.06 }] },
  '100%': { opacity: 0.55, transform: [{ scale: 1 }] },
};
const spin: CSSAnimationKeyframes = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};
const fillBar: CSSAnimationKeyframes = {
  from: { transform: [{ scaleX: 0 }] },
  to: { transform: [{ scaleX: 1 }] },
};

type Entrance = 'fade' | 'rise' | 'pop';

/** A one-shot entrance at `delay` seconds; none under reduced motion. */
function useEntrance() {
  const reduceMotion = useReducedMotion();
  return (kind: Entrance, delay: number) =>
    reduceMotion
      ? null
      : ({
          animationName: kind === 'fade' ? fadeIn : kind === 'rise' ? riseIn : popIn,
          animationDuration: kind === 'fade' ? '400ms' : kind === 'rise' ? '550ms' : '500ms',
          animationTimingFunction: kind === 'fade' ? 'ease' : EASE_OUT,
          animationDelay: `${delay}s`,
          animationFillMode: 'both',
        } as const);
}

/** Seconds since mount, ticking at the timeline's marks (all of them at once under reduced motion). */
function useTimeline(marks: readonly number[]) {
  const reduceMotion = useReducedMotion();
  const [reached, setReached] = useState(reduceMotion ? Infinity : 0);
  useEffect(() => {
    if (reduceMotion) return;
    const timers = marks.map((mark) => setTimeout(() => setReached((r) => Math.max(r, mark)), mark * 1000));
    return () => timers.forEach(clearTimeout);
  }, [marks, reduceMotion]);
  return reached;
}

const MARKS = [...STEP_DONE_AT, NEXT_AT];

export interface CreatingStepProps {
  /** Back to the review after a failed write. */
  onBack: () => void;
}

export function CreatingStep({ onBack }: CreatingStepProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const entrance = useEntrance();
  const reached = useTimeline(MARKS);
  const complete = useCompleteOnboarding();
  const enter = useEnterApp();
  const draft = useOnboardingDraft(
    useShallow((state) => ({
      firstName: state.firstName,
      lastName: state.lastName,
      username: state.username,
      specializations: state.specializations,
      timezone: state.timezone,
      hours: state.hours,
      services: state.services,
      servicesSkipped: state.servicesSkipped,
    })),
  );

  // The write starts with the animation.
  const { mutate } = complete;
  useEffect(() => {
    mutate();
  }, [mutate]);

  const written = complete.isSuccess;
  const failed = complete.isError;
  const name = [draft.firstName.trim(), draft.lastName.trim()].filter(Boolean).join(' ');
  const tagline = [
    ...draft.specializations.map((key, i) => {
      const label = t(`onboarding.specializations.${key}`);
      return i ? label.toLocaleLowerCase(locale) : label;
    }),
    timeZoneEntry(draft.timezone).name[locale],
  ].join(' · ');
  const services = draft.servicesSkipped
    ? []
    : draft.services.filter((s) => s.selected).slice(0, PREVIEW_SERVICES);
  const steps = [
    t('onboarding.creating.stepPage'),
    t('onboarding.creating.stepServices'),
    t('onboarding.creating.stepHours', { hours: formatHoursLabel(draft.hours, t, locale) }),
    t('onboarding.creating.stepReminders'),
  ];
  const canContinue = written && reached >= NEXT_AT;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + theme.layout.topGap, paddingBottom: insets.bottom + theme.space[2] },
      ]}>
      <Animated.View style={[styles.logo, entrance('fade', 0)]}>
        <Logo height={26} />
      </Animated.View>

      <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View
          style={[
            styles.glow,
            !reduceMotion && {
              animationName: glow,
              animationDuration: '3.2s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatAnchor,
            !reduceMotion && {
              animationName: float,
              animationDuration: '5s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            },
          ]}>
          <Animated.View style={[styles.card, entrance('rise', 0.1)]}>
            <Animated.View style={[styles.cover, entrance('fade', 0.25)]} />
            <View style={styles.cardBody}>
              <Animated.View style={[styles.avatarRing, entrance('pop', 0.4)]}>
                <Avatar name={name} size="xl" tone="brand" />
              </Animated.View>
              <Animated.View style={[styles.nameRow, entrance('rise', 0.6)]}>
                <Text variant="headline" color="ink" numberOfLines={1} style={styles.cardName}>
                  {name}
                </Text>
                <Icon name="verified" size="sm" color="constant.ink" />
              </Animated.View>
              <Animated.View style={entrance('rise', 0.75)}>
                <Text variant="caption" color="secondary" align="center" numberOfLines={1}>
                  {tagline}
                </Text>
              </Animated.View>
              <Animated.View style={[styles.link, entrance('rise', 1.1)]}>
                <Icon name="link" size="xs" color="constant.ink" />
                <Text variant="caption2Strong" color="ink" numberOfLines={1}>
                  {`getseene.app/${draft.username}`}
                </Text>
              </Animated.View>
              {services.length ? (
                <View style={styles.services}>
                  {services.map((service, i) => (
                    <Animated.View
                      key={service.id}
                      style={[styles.serviceRow, entrance('rise', 1.5 + i * 0.25)]}>
                      <View style={[styles.dot, { backgroundColor: SERVICE_COLORS[serviceColorKey(service)] }]} />
                      <Text variant="footnote" color="ink" numberOfLines={1} style={styles.serviceName}>
                        {serviceName(service, locale)}
                      </Text>
                      <Text variant="footnote" color="secondary">
                        {formatDurationLabel(service.duration, t)}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              ) : null}
              <Animated.View style={[styles.book, entrance('rise', 2.5)]}>
                <Text variant="footnoteStrong" color="white">
                  {t('onboarding.creating.book')}
                </Text>
              </Animated.View>
            </View>
          </Animated.View>
          <Animated.View style={[styles.bubble, entrance('pop', 3.4)]}>
            <Text variant="caption2Strong" color="inkSuccess">
              {t('onboarding.creating.bubbleTitle')}
            </Text>
            <Text variant="caption" color="ink">
              {t('onboarding.creating.bubbleText')}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.copy}>
        <Text variant="title1" align="center">
          {failed ? t('onboarding.creating.errorTitle') : t('onboarding.creating.title')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {failed && complete.error
            ? t(errorMessageKey(complete.error))
            : t('onboarding.creating.subtitle')}
        </Text>
      </View>

      {failed ? null : (
        <View style={styles.steps} accessibilityRole="summary" accessibilityLiveRegion="polite">
          {steps.map((label, i) => {
            const isLast = i === steps.length - 1;
            const done = reached >= STEP_DONE_AT[i] && (!isLast || written);
            return <StatusLine key={label} label={label} done={done} />;
          })}
        </View>
      )}

      <View style={styles.spacer} />

      {failed ? (
        <View style={styles.actions}>
          <Button label={t('onboarding.creating.retry')} onPress={() => complete.mutate()} />
          <Button
            label={t('onboarding.creating.back')}
            variant="ghost"
            tone="secondary"
            size="md"
            onPress={onBack}
          />
        </View>
      ) : (
        <>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.bar,
                !reduceMotion && {
                  animationName: fillBar,
                  animationDuration: '4.6s',
                  animationTimingFunction: 'cubic-bezier(0.45, 0, 0.2, 1)',
                  animationDelay: '0.2s',
                  animationFillMode: 'both',
                },
              ]}
            />
          </View>
          <View style={styles.footer}>
            {canContinue ? (
              <Animated.View style={entrance('fade', 0)}>
                <Button
                  label={t('onboarding.creating.next')}
                  variant="ghost"
                  size="md"
                  loading={enter.isPending}
                  onPress={() => enter.mutate()}
                />
              </Animated.View>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

function StatusLine({ label, done }: { label: string; done: boolean }) {
  const reduceMotion = useReducedMotion();
  const entrance = useEntrance();
  return (
    <View style={styles.statusLine} accessible accessibilityState={{ busy: !done }}>
      <View style={styles.statusMark}>
        {done ? (
          <Animated.View style={[styles.check, entrance('pop', 0)]}>
            <Icon name="check" size="xs" color="content.inverse" />
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.spinner,
              !reduceMotion && {
                animationName: spin,
                animationDuration: '800ms',
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              },
            ]}
          />
        )}
      </View>
      <Text variant="bodyMedium" color={done ? 'primary' : 'tertiary'} style={styles.statusText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg.canvas,
    paddingHorizontal: theme.layout.gutter,
  },
  logo: { alignSelf: 'center' },
  stage: {
    height: STAGE_HEIGHT,
    marginTop: theme.space[3.5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    experimental_backgroundImage: `radial-gradient(circle, ${theme.colors.brand.subtle} 0%, ${theme.colors.brand.subtle}00 70%)`,
  },
  floatAnchor: { width: CARD_WIDTH },
  card: {
    backgroundColor: theme.colors.constant.white,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.showcase,
    overflow: 'hidden',
    boxShadow: theme.shadow.showcase,
  },
  cover: { height: 74, experimental_backgroundImage: COVER_GRADIENT },
  cardBody: {
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[4],
    alignItems: 'center',
  },
  avatarRing: {
    marginTop: -theme.space[8],
    borderWidth: 3,
    borderColor: theme.colors.constant.white,
    borderRadius: theme.radius.full,
  },
  nameRow: {
    marginTop: theme.space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.25],
    maxWidth: '100%',
  },
  cardName: { flexShrink: 1 },
  link: {
    marginTop: theme.space[2],
    height: 26,
    paddingHorizontal: theme.space[2.5],
    borderRadius: 13,
    backgroundColor: theme.colors.bg.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.25],
  },
  services: {
    alignSelf: 'stretch',
    marginTop: theme.space[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  serviceRow: {
    height: theme.sizing.control.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  serviceName: { flex: 1, minWidth: 0 },
  book: {
    alignSelf: 'stretch',
    marginTop: theme.space[3],
    height: theme.sizing.iconButton,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.constant.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    right: -22,
    top: 22,
    backgroundColor: theme.colors.constant.white,
    borderRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.xs,
    paddingVertical: theme.space[2],
    paddingHorizontal: 11,
    gap: theme.space[0.5],
    boxShadow: theme.shadow.pop,
  },
  copy: { marginTop: theme.space[3], gap: theme.space[1.5], alignItems: 'center' },
  steps: { marginTop: theme.space[4.5], paddingHorizontal: theme.space[2], gap: 11 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  statusMark: { width: 22, height: 22 },
  spinner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    borderTopColor: theme.colors.content.primary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.content.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { flex: 1 },
  spacer: { flex: 1 },
  track: {
    height: theme.sizing.progress,
    borderRadius: theme.radius.bar,
    backgroundColor: theme.colors.bg.sunken,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: theme.radius.bar,
    backgroundColor: theme.colors.content.primary,
    transformOrigin: 'left',
  },
  footer: {
    marginTop: theme.space[3.5],
    height: theme.sizing.minTouch,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actions: { gap: theme.space[1.5] },
}));
