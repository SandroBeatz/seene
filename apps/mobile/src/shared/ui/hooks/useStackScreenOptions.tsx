/**
 * Screen options every native Stack in the app shares: a transparent iOS header
 * over the tokened gradient, the minimal back button, the theme's tint, status bar
 * and canvas. One place, so the tab stacks and the app stack can't drift apart.
 */
import type { NativeStackNavigationOptions } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { NavigationHeaderBackground } from '../NavigationHeaderBackground';

export function useStackScreenOptions(): NativeStackNavigationOptions {
  const { theme } = useUnistyles();
  return {
    headerBackButtonDisplayMode: 'minimal',
    headerTransparent: process.env.EXPO_OS === 'ios',
    headerShadowVisible: false,
    headerTintColor: theme.colors.content.primary,
    headerLargeTitleStyle: { color: theme.colors.content.primary },
    headerBackground: () => <NavigationHeaderBackground />,
    statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
    contentStyle: { backgroundColor: theme.colors.bg.canvas },
  };
}
