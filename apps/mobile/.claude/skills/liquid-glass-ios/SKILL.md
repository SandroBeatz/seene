---
name: liquid-glass-ios
description: >-
  Adopt Apple's iOS 26 Liquid Glass design in this Expo app safely and consistently. Use this skill
  whenever the user wants a surface to look "glassy", "frosted", or "like iOS 26" — a glass tab bar,
  navigation header, search bar, sheet, floating toolbar, FAB, mini-player, or overlay pill — or asks
  to "use liquid glass", convert a surface to the native component so it inherits system materials, or
  fix glass that crashes on older iOS / ignores the theme toggle. Trigger even if the user just says
  "make the tab bar translucent like the new iOS" without naming Liquid Glass. Do NOT trigger for plain
  color/typography theming with no material intent, Android-only Material styling, or generic
  expo-blur requests unrelated to the iOS 26 glass material.
---

# Liquid Glass on iOS

Materialize the project policy in [docs/liquid-glass-ios.md](../../../docs/liquid-glass-ios.md) — that
doc is the source of truth. **Read it first**; this file is the operating procedure. The goal: use
Liquid Glass on iOS as far as the platform allows, without crashing older iOS, breaking Android, or
violating the Unistyles token contract from `docs/design-system.md`.

## Core idea: two mechanisms

Glass arrives one of two ways. Picking the wrong one is the most common mistake.

1. **Automatic (native surfaces).** OS-owned chrome — tab bar, nav header, search bar, sheet, context
   menu — gets Liquid Glass *for free* on iOS 26 when rendered by the native component. You don't call
   any glass API. The catch: **any custom `backgroundColor` opts the surface out of the material.** So
   the work is to use the native component and *remove* backgrounds, not add glass on top.
2. **Explicit (`expo-glass-effect`).** Only for surfaces we render ourselves that float over content
   (FAB, floating toolbar, mini-player, overlay pill). Here you render `GlassView` / `GlassContainer`
   — but always guarded and with a fallback, because the material only exists on iOS 26+.

Rule of thumb: *if the OS owns the surface, reach for the native component and delete your background;
if you own the surface and it floats, reach for guarded `GlassView`.*

## Workflow

1. **Confirm capability.** `expo` major ≥ 57 and `expo-glass-effect` installed (check `package.json`).
   Per `AGENTS.md`, don't trust memory for Expo APIs — verify against the `expo-native-ui` /
   `expo-router` skills or versioned docs before writing.
2. **Classify the surface** as native chrome (→ automatic) or custom floating element (→ explicit).
3. **Automatic path.** Use the native component (`NativeTabs` from `expo-router/unstable-native-tabs`,
   native `Stack`/`Stack.Screen`, form sheets). Remove any `backgroundColor` on it. Keep `tintColor`,
   SF Symbols, `minimizeBehavior`. Never stack a `GlassView` on OS chrome. The tab bar in
   `src/app/(tabs)/_layout.tsx` is the reference implementation.
4. **Explicit path.** Render `GlassView` (or `GlassContainer` with `spacing` to merge nearby elements)
   **only** when `isGlassEffectAPIAvailable()` is true and Reduce Transparency is off; otherwise render
   a tokened opaque fallback (`theme.colors.bg.elevated` + `border.subtle`). Route this through a
   single shared `GlassSurface` primitive under `src/shared/ui/GlassSurface/` — create it if missing —
   so the guard + fallback live in one place, the way `Icon` wraps the icon set. Don't scatter raw
   `GlassView` + guard code across screens.
5. **Tokenize appearance.** `tintColor` comes from theme tokens (e.g. `theme.colors.accent.default`),
   never raw hex. Pass `colorScheme` from the manual theme store (`src/shared/theme/theme.store.ts`):
   `'auto'` when the mode is system, else `'light'`/`'dark'`, so glass follows our toggle rather than
   only the OS appearance.
6. **Accessibility.** Treat `AccessibilityInfo.isReduceTransparencyEnabled()` as a reason to render the
   opaque fallback — iOS strips transparency in that mode and glass would look washed out.
7. **Surface build requirements.** Liquid Glass is build-time gated: it needs a dev build compiled
   against the iOS 26 SDK (Xcode 26 / current EAS image); an older Xcode shows native components
   without glass. Never set `UIDesignRequiresCompatibility`. Native config only via `app.json`
   (CNG owns `ios/`). Tell the user this when a build is implied.
8. **Validate.** Run `npx tsc --noEmit` and `npx expo lint`. Confirm no `backgroundColor` was added to a
   glassy native surface and every explicit `GlassView` is guarded with a fallback.

## `expo-glass-effect` API (authoritative: `node_modules/expo-glass-effect/build/*.d.ts`)

- `GlassView` — props: `glassEffectStyle` (`'clear' | 'regular' | 'none'` or `{ style, animate, animationDuration }`, default `'regular'`), `tintColor`, `isInteractive` (default `false`), `colorScheme` (`'auto' | 'light' | 'dark'`), plus `ViewProps`.
- `GlassContainer` — groups `GlassView`s so they merge fluidly; `spacing` controls the merge distance.
- `isGlassEffectAPIAvailable()` — **gate every explicit glass render on this** (some iOS 26 betas crash otherwise).
- `isLiquidGlassAvailable()` — whether the app is actually rendering with Liquid Glass.

## Examples

**Example 1 — "make the tab bar use the iOS 26 glass look"**
Automatic path: native `NativeTabs` with `backgroundColor` removed, `tintColor` from tokens,
`minimizeBehavior="onScrollDown"`, SF Symbols per tab. Note the iOS 26 SDK dev-build requirement.

**Example 2 — "add a floating action button that looks like frosted glass"**
Explicit path: a `GlassSurface`/guarded `GlassView` FAB with `isInteractive`, tokened `tintColor` and
`colorScheme` from the theme store, and a `bg.elevated` fallback for iOS < 26 / Android / Reduce
Transparency.

## Done when

- Every explicit `GlassView`/`GlassContainer` is gated by `isGlassEffectAPIAvailable()` with a tokened fallback.
- No `backgroundColor` on a native surface meant to show system glass.
- `tintColor` uses tokens; `colorScheme` reflects the theme store; Reduce Transparency → opaque fallback.
- `npx tsc --noEmit` and `npx expo lint` pass.
- The user has been told about the iOS 26 SDK dev-build requirement when a build is implied.

## Related Expo skills

Defer to these for exact native APIs (don't guess): `expo-native-ui` (materials, SF Symbols),
`expo-router` (NativeTabs, native Stack/headers/sheets), `expo-ui` (SwiftUI surfaces),
`expo-design-system` (extending the Unistyles theme for `GlassSurface`).
