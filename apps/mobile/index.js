// Custom entry point.
//
// Unistyles requires StyleSheet.configure() to run before the FIRST
// StyleSheet.create(). Expo Router evaluates the route tree via require.context
// inside getRoutes(), which requires route modules (and their styled components)
// before the root _layout side-effect import gets a chance to run. Configuring
// here — before expo-router/entry — guarantees the theme is selected first.
import './src/shared/theme/unistyles';
import 'expo-router/entry';
