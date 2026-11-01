/**
 * "Запись создана" (design "После создания: тост «Отправить клиенту»"): a dark card
 * at the top of the screen the flow closed to, with who and when, and "Отправить клиенту" — WhatsApp
 * with the details. Closes by its cross, after the send, or by itself.
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { whatsappUrl } from '@/shared/lib/phone';
import { Icon, Text } from '@/shared/ui';
import { useCreatedAppointment } from '../model/created.store';

/** Long enough to reach for "Отправить клиенту". */
const VISIBLE_MS = 10_000;

// A short settle from just above, no spring: the toast confirms, it doesn't bounce.
const ENTERING = FadeInUp.duration(280)
  .easing(Easing.out(Easing.cubic))
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: -12 }],
  });
const EXITING = FadeOutUp.duration(180);

export function CreatedToast() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const created = useCreatedAppointment((s) => s.created);
  const dismiss = useCreatedAppointment((s) => s.dismiss);

  useEffect(() => {
    if (!created) return;
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [created, dismiss]);

  if (!created) return null;

  const phone = created.phone;
  const send = () => {
    dismiss();
    if (!phone) return;
    void Linking.openURL(whatsappUrl(phone, created.message)).catch(() =>
      Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    );
  };

  return (
    <Animated.View
      key={created.appointmentId}
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
              {t('quickCreate.created.title')}
            </Text>
            <Text variant="subhead" color="onDarkMuted" numberOfLines={1}>
              {created.summary}
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
              {t('quickCreate.created.send')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
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
