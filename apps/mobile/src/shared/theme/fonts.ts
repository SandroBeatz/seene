/**
 * Native builds embed the Inter faces at build time (app.json → expo-font), so they
 * are available before the first frame. The web variant (fonts.web.ts) loads them.
 */
export function useAppFonts(): boolean {
  return true;
}
