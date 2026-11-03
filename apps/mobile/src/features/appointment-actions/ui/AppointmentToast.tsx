/**
 * The toast after a visit is created or moved (design "После создания: тост «Отправить
 * клиенту»"): a dark card at the top with what happened, who and when, and "Отправить
 * клиенту" — WhatsApp with the details. Closes by its cross, after the send, or by itself.
 */
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';
import { whatsappUrl } from '@/shared/lib/phone';
import { Icon, Text } from '@/shared/ui';
import { useAppointmentToast } from '../model/appointment-toast.store';

/** Long enough to reach for "Отправить клиенту". */
const VISIBLE_MS = 10_000;
const EXIT_MS = 180;

// A short settle from just above, no spring: the toast confirms, it doesn't bounce.
const ENTERING = FadeInUp.duration(280)
  .easing(Easing.out(Easing.cubic))
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: -12 }],
  });
const EXITING = FadeOutUp.duration(EXIT_MS);

/**
 * A move leaves the visit's form sheet open, and an iOS sheet covers everything in the
 * app's own view tree: the toast takes its own layer above it. Other platforms show the
 * modals in that tree, so the toast is already on top.
 */
const Layer = Platform.OS === 'ios' ? FullWindowOverlay : Fragment;

export function AppointmentToast() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const toast = useAppointmentToast((s) => s.toast);
  const dismiss = useAppointmentToast((s) => s.dismiss);
  // The layer goes on top when it mounts, so each toast gets its own: a sheet opened
  // since the last one would cover it. It outlives the toast a moment for the card to
  // leave.
  const [layerId, setLayerId] = useState<number | null>(null);
  if (toast && layerId !== toast.id) setLayerId(toast.id);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(dismiss, VISIBLE_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setLayerId(null), EXIT_MS);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  if (layerId === null) return null;

  const phone = toast?.phone;
  const send = () => {
    dismiss();
    if (!toast || !phone) return;
    void toast
      .message()
      .then((text) => Linking.openURL(whatsappUrl(phone, text)))
      .catch(() => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')));
  };

  return (
    <Layer key={layerId}>
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={ENTERING}
          exiting={EXITING}
          style={[styles.wrap, { top: insets.top + 8 }]}
          accessibilityLiveRegion="polite">
          <View style={styles.card}>
            <View style={styles.head}>
              <View style={styles.check}>
                <Icon name="check" size="md" color="constant.white" />
              </View>
              <View style={styles.text}>
                <Text variant="headline" color="white">
                  {toast.title}
                </Text>
                <Text variant="subhead" color="onDarkMuted" numberOfLines={1}>
                  {toast.summary}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={10}
                onPress={dismiss}>
                <Icon name="close" size="base" color="content.onDarkMuted" />
              </Pressable>
            </View>
            {/* No number to write to: the card only confirms. */}
            {phone ? (
              <Pressable
                accessibilityRole="button"
                onPress={send}
                style={({ pressed }) => [styles.send, pressed && styles.pressed]}>
                <Icon name="whatsapp" size="md" />
                <Text variant="bodyStrong" color="ink">
                  {t('actions.sendToClient')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </Layer>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { position: 'absolute', left: theme.space[3], right: theme.space[3], zIndex: 10 },
  card: {
    gap: theme.space[3],
    padding: theme.space[3],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.constant.ink,
    boxShadow: theme.shadow.bubble,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.constant.success,
  },
  text: { flex: 1, minWidth: 0, gap: 1 },
  send: {
    height: theme.sizing.control.md,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    backgroundColor: theme.colors.constant.white,
  },
  pressed: { opacity: 0.85 },
}));
