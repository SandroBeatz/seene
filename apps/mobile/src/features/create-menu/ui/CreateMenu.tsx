/**
 * The "+" over the tab bar's right end and the card it opens: a time block, a new
 * client, and "Новая запись" as the main button. The card grows out of the button's
 * corner with a spring and folds back into it; a tap outside closes it. Both float
 * over content, so both are Liquid Glass (`GlassSurface`, opaque where glass isn't
 * available): the "+" is ink-tinted glass, the card regular glass.
 *
 * The card's glass is never under an animated opacity — UIKit drops the blur of a
 * visual effect whose ancestor is translucent, leaving a flat see-through layer.
 * Only the scale animates on the card; the material itself materializes natively
 * (`glassEffectStyle` none → regular, animated) and the rows fade inside it.
 */
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Pressable, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, GlassSurface, Icon, Text, useReducedMotion, type IconName } from '@/shared/ui';

export interface CreateMenuProps {
  /** Distance of the button from the screen bottom: above the tab bar. */
  bottom: number;
}

export function CreateMenu({ bottom }: CreateMenuProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  // Stays mounted while the card folds back.
  const [mounted, setMounted] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (open) {
      progress.value = reducedMotion
        ? withTiming(1, { duration: 120 })
        : withSpring(1, { damping: 20, stiffness: 260, mass: 0.8 });
    } else {
      progress.value = withTiming(0, { duration: reducedMotion ? 100 : 170 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [open, progress, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : 0.35 + 0.65 * progress.value }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 1 - 0.25 * progress.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const contentStyle = scrimStyle;

  const show = () => {
    setMounted(true);
    // A frame later, so the card mounts without glass and the material animates in.
    requestAnimationFrame(() => setOpen(true));
  };

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      {mounted ? (
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable
            style={styles.fill}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => setOpen(false)}
          />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[styles.button, { bottom }, buttonStyle]}
        pointerEvents={open ? 'none' : 'auto'}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('createMenu.title')}
          accessibilityState={{ expanded: open }}
          onPress={show}>
          <GlassSurface
            isInteractive
            tintColor={theme.colors.accent.default}
            style={styles.buttonGlass}>
            <Icon name="add" size="lg" color="accent.onAccent" />
          </GlassSurface>
        </Pressable>
      </Animated.View>

      {mounted ? (
        <Animated.View
          style={[styles.card, { bottom }, cardStyle]}
          accessibilityViewIsModal
          pointerEvents={open ? 'auto' : 'none'}>
          <GlassSurface
            glassEffectStyle={{
              style: open ? 'regular' : 'none',
              animate: !reducedMotion,
              animationDuration: open ? 0.3 : 0.17,
            }}
            style={styles.cardGlass}>
            <Animated.View style={[styles.cardContent, contentStyle]}>
              <Row
                icon="coffee"
                title={t('createMenu.block')}
                subtitle={t('createMenu.blockHint')}
                onPress={() =>
                  choose(() => Alert.alert(t('createMenu.block'), t('createMenu.blockSoon')))
                }
              />
              <Row
                icon="userAdd"
                title={t('createMenu.client')}
                subtitle={t('createMenu.clientHint')}
                onPress={() => choose(() => router.push('/client/new'))}
              />
              <Button
                label={t('createMenu.appointment')}
                leftIcon="calendar"
                onPress={() => choose(() => router.push('/quick-create'))}
              />
            </Animated.View>
          </GlassSurface>
        </Animated.View>
      ) : null}
    </>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={subtitle}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size="md" color="content.primary" />
      </View>
      <View style={styles.rowText}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="footnote" color="secondary">
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const BUTTON = 56;

const styles = StyleSheet.create((theme) => ({
  fill: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay.menuScrim },
  button: { position: 'absolute', right: theme.space[5] },
  buttonGlass: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    left: theme.space[4],
    right: theme.space[4],
    // Grows out of the "+" it replaces.
    transformOrigin: 'bottom right',
  },
  // No boxShadow on glass: the material draws its own edge and shadow, and an RN
  // shadow under it shows as a second slab around the card.
  cardGlass: {
    borderRadius: theme.radius.showcase + 4,
    padding: theme.space[3],
  },
  cardContent: { gap: theme.space[1] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    padding: theme.space[2],
    borderRadius: theme.radius.lg,
  },
  pressed: { backgroundColor: theme.colors.interaction.onSurfacePressed },
  rowIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
}));
