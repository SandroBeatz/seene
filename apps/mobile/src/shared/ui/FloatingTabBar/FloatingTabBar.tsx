/**
 * The app's floating tab bar (design "Таб · Сегодня"): a glass capsule with tab
 * items and a raised round action in the middle. Presentational only — the tabs
 * layout wires items to routes with `TabTrigger asChild`, which injects
 * `isFocused` + `onPress`.
 *
 * Same on iOS and Android: the capsule is a `GlassSurface` (Liquid Glass on iOS 26,
 * a tokened elevated surface elsewhere). Screens keep their content clear of it via
 * `useFloatingTabBarInset` (ScreenScrollView applies it automatically).
 */
import { createContext, forwardRef, useContext, type ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { sizing, space } from '@/shared/theme/tokens';
import { GlassSurface } from '../GlassSurface';
import { Icon, type IconName } from '../Icon';
import { Text } from '../Text';

const BAR = sizing.tabBar;

/** Distance of the capsule from the screen bottom: just above the home indicator. */
function barBottom(safeBottom: number): number {
  return Math.max(safeBottom - BAR.safeAreaOverlap, BAR.inset);
}

/** Whether the bar is shown on the current route; set by the tabs layout. */
const FloatingTabBarVisibleContext = createContext(false);

export const FloatingTabBarVisibility = FloatingTabBarVisibleContext.Provider;

/**
 * Bottom space a scrolling screen must leave so its last row clears the bar
 * (0 where the bar is hidden, e.g. on pushed screens).
 */
export function useFloatingTabBarInset(): number {
  const visible = useContext(FloatingTabBarVisibleContext);
  const insets = useSafeAreaInsets();
  return visible ? barBottom(insets.bottom) + BAR.height + space[4] : 0;
}

export interface FloatingTabBarProps {
  visible: boolean;
  children: ReactNode;
}

export function FloatingTabBar({ visible, children }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View style={[styles.wrap, { bottom: barBottom(insets.bottom) }]} pointerEvents="box-none">
      {/* The glass is a sibling under the row, so the raised action isn't clipped by it. */}
      <GlassSurface style={styles.capsule} pointerEvents="none" />
      <View accessibilityRole="tablist" style={styles.row} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

export interface FloatingTabBarItemProps extends Omit<PressableProps, 'children'> {
  icon: IconName;
  label: string;
  /** Injected by `TabTrigger asChild`. */
  isFocused?: boolean;
}

export const FloatingTabBarItem = forwardRef<View, FloatingTabBarItemProps>(
  function FloatingTabBarItem({ icon, label, isFocused = false, style, ...rest }, ref) {
    // `TabTrigger asChild` injects its own row layout as `style`; ours goes last so
    // the item stays a centred icon-over-label column.
    return (
      <Pressable
        ref={ref}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: isFocused }}
        style={[typeof style === 'function' ? undefined : style, styles.item]}
        {...rest}>
        <Icon name={icon} size="md" color={isFocused ? 'content.primary' : 'content.tertiary'} />
        <Text
          variant={isFocused ? 'micro' : 'microMedium'}
          color={isFocused ? 'primary' : 'tertiary'}>
          {label}
        </Text>
      </Pressable>
    );
  },
);

export interface FloatingTabBarActionProps extends Omit<PressableProps, 'children'> {
  icon: IconName;
  accessibilityLabel: string;
}

/** The raised round button in the middle of the bar (new appointment). */
export function FloatingTabBarAction({ icon, style, ...rest }: FloatingTabBarActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.action,
        state.pressed && styles.actionPressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Icon name={icon} size="lg" color="accent.onAccent" />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    position: 'absolute',
    left: BAR.inset,
    right: BAR.inset,
    height: BAR.height,
  },
  capsule: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR.height / 2,
    boxShadow: theme.shadow.tabBar,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space[2],
  },
  item: {
    flex: 1,
    flexDirection: 'column',
    height: BAR.item,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  action: {
    width: BAR.action,
    height: BAR.action,
    marginHorizontal: 2,
    borderRadius: BAR.action / 2,
    backgroundColor: theme.colors.accent.default,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -BAR.actionLift }],
    boxShadow: theme.shadow.tabAction,
  },
  actionPressed: { backgroundColor: theme.colors.accent.pressed },
}));
