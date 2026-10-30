/**
 * The chrome of a route form sheet: close (or back), the title and an optional
 * trailing action or "⋯" menu. On iOS these are native header items — the sheet's
 * navigation bar, so iOS 26 draws the buttons in Liquid Glass and the menu is a
 * system menu. Android form sheets have no header, so there the same chrome is
 * drawn in content (`SheetHeader`), the menu as an alert.
 *
 * Render it once, first, in the sheet's content column. The route must show the
 * native header on iOS (the app layout's sheet options do). iOS 26 lays the bar
 * over the content, so on iOS the chrome is also a spacer of the bar's height.
 */
import { router, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Alert, View } from 'react-native';
import type { SFSymbol } from 'expo-symbols';
import { useUnistyles } from 'react-native-unistyles';
import { IconButton } from '../IconButton';
import type { IconName } from '../Icon';
import { SheetHeader } from '../SheetHeader';

export interface SheetChromeAction {
  key: string;
  label: string;
  /** iOS: an SF Symbol. */
  sf: SFSymbol;
  /** Android: the kit icon. */
  icon: IconName;
  destructive?: boolean;
  onPress: () => void;
}

export interface SheetChromeProps {
  title: string;
  /** `close` dismisses the sheet; `back` returns to the sheet under it. */
  leading?: 'close' | 'back';
  leadingLabel: string;
  /** Defaults to `router.back()`. */
  onLeadingPress?: () => void;
  /** One trailing button. */
  action?: SheetChromeAction;
  /** A trailing "⋯" with these items; ignored when `action` is set. */
  menu?: { label: string; cancelLabel: string; items: SheetChromeAction[] };
}

export function SheetChrome({
  title,
  leading = 'close',
  leadingLabel,
  onLeadingPress = () => router.back(),
  action,
  menu,
}: SheetChromeProps) {
  const { theme } = useUnistyles();
  const menuAction = (item: SheetChromeAction) => (
    <Stack.Toolbar.MenuAction
      key={item.key}
      icon={item.sf}
      destructive={item.destructive}
      onPress={item.onPress}>
      {item.label}
    </Stack.Toolbar.MenuAction>
  );
  const headerHeight = useHeaderHeight();
  if (process.env.EXPO_OS === 'ios') {
    return (
      <>
        <View style={{ height: headerHeight }} />
        <Stack.Screen options={{ title }} />
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            icon={leading === 'close' ? 'xmark' : 'chevron.backward'}
            accessibilityLabel={leadingLabel}
            onPress={onLeadingPress}
          />
        </Stack.Toolbar>
        {action ? (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon={action.sf}
              accessibilityLabel={action.label}
              tintColor={action.destructive ? theme.colors.tone.danger.fg : undefined}
              onPress={action.onPress}
            />
          </Stack.Toolbar>
        ) : menu ? (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel={menu.label}>
              {menu.items.filter((item) => !item.destructive).map(menuAction)}
              {/* The red actions as a separate group under a divider. */}
              <Stack.Toolbar.Menu inline>
                {menu.items.filter((item) => item.destructive).map(menuAction)}
              </Stack.Toolbar.Menu>
            </Stack.Toolbar.Menu>
          </Stack.Toolbar>
        ) : null}
      </>
    );
  }

  const trailing = action ? (
    <IconButton
      icon={action.icon}
      variant="ghost"
      iconColor={action.destructive ? 'tone.danger.fg' : undefined}
      accessibilityLabel={action.label}
      onPress={action.onPress}
    />
  ) : menu ? (
    <IconButton
      icon="more"
      variant="neutral"
      accessibilityLabel={menu.label}
      onPress={() =>
        Alert.alert(menu.label, undefined, [
          ...menu.items.map((item) => ({
            text: item.label,
            style: item.destructive ? ('destructive' as const) : ('default' as const),
            onPress: item.onPress,
          })),
          { text: menu.cancelLabel, style: 'cancel' as const },
        ])
      }
    />
  ) : undefined;

  return (
    <SheetHeader
      title={title}
      leading={leading}
      leadingLabel={leadingLabel}
      onLeadingPress={onLeadingPress}
      trailing={trailing}
    />
  );
}
