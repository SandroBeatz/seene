/** Theme-aware visual background for native Stack headers. */
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUnistyles } from 'react-native-unistyles';

export function NavigationHeaderBackground() {
  const { theme } = useUnistyles();

  return (
    <LinearGradient
      colors={[
        theme.colors.navigation.headerGradientStart,
        theme.colors.navigation.headerGradientEnd,
      ]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
