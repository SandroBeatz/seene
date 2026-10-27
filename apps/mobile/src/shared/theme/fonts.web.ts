/**
 * The expo-font config plugin only embeds fonts in native builds; on web the same
 * files are loaded at runtime under the same family names (see tokens.fontFamily).
 */
import { useFonts } from 'expo-font';
import { fontFamily } from './tokens';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fontFamily.regular]: require('@/assets/fonts/Inter-Regular.ttf'),
    [fontFamily.medium]: require('@/assets/fonts/Inter-Medium.ttf'),
    [fontFamily.semibold]: require('@/assets/fonts/Inter-SemiBold.ttf'),
    [fontFamily.bold]: require('@/assets/fonts/Inter-Bold.ttf'),
    [fontFamily.displaySemibold]: require('@/assets/fonts/InterTight-SemiBold.ttf'),
    [fontFamily.displayBold]: require('@/assets/fonts/InterTight-Bold.ttf'),
  });
  // A failed load falls back to the system face rather than blocking the app.
  return loaded || !!error;
}
