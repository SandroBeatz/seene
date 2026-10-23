---
version: 1.2
date: 2026-08-26
category: design
status: proposed
---

# Liquid Glass on iOS

> Version 1.2 · 2026-08-26 · [Design](./)

> Seene's policy and mechanics for adopting Apple's **Liquid Glass** design (iOS 26) as far as the
> platform allows, while degrading cleanly on iOS < 26 and Android. This doc defines **when glass is
> automatic vs. explicit**, the availability guards we always apply, how glass coexists with our
> Unistyles token system and manual light/dark toggle, and which Expo skills to reach for. It builds
> on [design-system.md](./design-system.md) — glass is a _surface material_, not an escape hatch
> from tokens.

## 1. Policy

**Use Liquid Glass maximally on iOS, but never unconditionally.** Concretely:

1. **Prefer native surfaces.** Anything Apple renders as a system material — the tab bar, navigation
   headers, sheets, search bars, context menus — stays a native component so it gets Liquid Glass
   _for free_ on iOS 26. A Stack header may render the app's tokened brand gradient through the
   supported `headerBackground` slot, but it must not replace the native header implementation,
   Back button, title, gestures, or system controls.
2. **Add explicit glass for floating chrome.** Custom elements that float over content (a FAB, a
   floating toolbar, a mini-player, an overlay pill) use `expo-glass-effect` (`GlassView` /
   `GlassContainer`).
3. **Always guard + fall back.** Glass only exists on iOS 26+. Every explicit use is gated by a
   runtime check and falls back to a tokened opaque/elevated surface (`theme.colors.bg.elevated`)
   on iOS < 26, Android, and web.
4. **Respect accessibility.** Honor _Reduce Transparency_; when enabled, render the opaque fallback.
5. **Stay tokenized.** Glass `tintColor` / `colorScheme` derive from theme tokens, not raw hex. Glass
   changes the _material_, not the color contract from [design-system.md](./design-system.md).

## 2. Two mechanisms

### 2.1 Automatic (system materials)

When we use a **native** navigator/control, iOS 26 applies Liquid Glass itself. No glass API calls.

- **Native tabs** — `NativeTabs` from `expo-router/unstable-native-tabs`. Already live in
  `src/app/(app)/(tabs)/_layout.tsx`. The rule that makes glass work: **do not set `backgroundColor`** on
  `NativeTabs` (any background opts the bar out of the system material). `tintColor` + SF Symbols are
  fine. `minimizeBehavior="onScrollDown"` gives the iOS 26 shrink-on-scroll behavior.
- **Native stack headers / search / sheets** — driven by `react-native-screens` (already a dep) via
  Expo Router's native `Stack`, `Stack.Screen` `headerSearchBarOptions`, and form-sheet
  presentation. Seene's regular Stacks pass `NavigationHeaderBackground` to the supported
  `headerBackground` option. On iOS the header is transparent, so the theme-aware gradient renders
  behind native chrome while the OS still owns the controls and iOS 26 material behavior.

> Rule of thumb: if the surface is chrome the OS owns, keep the native component. Use only its
> supported background slot for app branding; do not add a replacement header or a glass view on
> top of it.

### 2.2 Explicit (`expo-glass-effect`)

For surfaces we render ourselves. Package `expo-glass-effect` (`~57.0.1`, already installed) exposes:

| Export                        | Purpose                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GlassView`                   | A view with a Liquid Glass material background.                                                                                                 |
| `GlassContainer`              | Groups multiple `GlassView`s so they merge fluidly when near each other (`spacing` prop controls the merge distance).                           |
| `isLiquidGlassAvailable()`    | `true` when the app is actually rendering with Liquid Glass.                                                                                    |
| `isGlassEffectAPIAvailable()` | `true` when the native API is safe to call — **check this before rendering `GlassView`/`GlassContainer`** (some iOS 26 betas crash without it). |

`GlassView` props (iOS): `glassEffectStyle` (`'clear' | 'regular' | 'none'`, or a config object with
`{ style, animate, animationDuration }`, default `'regular'`), `tintColor`, `isInteractive`
(default `false`), `colorScheme` (`'auto' | 'light' | 'dark'`, default `'auto'`).

## 3. Availability & accessibility guards

Two runtime facts decide whether glass renders:

- **API present** — `isGlassEffectAPIAvailable()` (iOS 26+, non-broken build). Guards against crashes.
- **Reduce Transparency** — `AccessibilityInfo.isReduceTransparencyEnabled()`. When on, iOS strips
  transparency; we render the opaque fallback instead of a washed-out glass.

Both are iOS-only concerns; on Android/web the checks are `false`/no-op and we always fall back.

## 4. Coexistence with our theme

Seene has a **manual** light/dark toggle (`src/shared/theme/theme.store.ts`, Unistyles
`adaptiveThemes`). When the user forces a theme that differs from the OS, pass `colorScheme` to
`GlassView` so the glass matches our theme instead of the system appearance:

```tsx
colorScheme={themeMode === 'system' ? 'auto' : themeMode} // 'light' | 'dark'
```

`tintColor` should come from tokens (e.g. `theme.colors.accent.default`) so glass respects the same
color contract as everything else.

## 5. The `GlassSurface` primitive

Per [design-system.md](./design-system.md) §"one way to build a thing", explicit glass lives behind
**one** shared component — `src/shared/ui/GlassSurface/` — rather than scattered `GlassView` + guard
code. Import it from `@/shared/ui`. It:

1. Renders `GlassView` when `isGlassEffectAPIAvailable()` **and** not Reduce-Transparency
   (`useReduceTransparency`).
2. Otherwise renders a plain tokened `View` with `bg.elevated` + `border.subtle` (matching `Card`, so
   glass and non-glass builds read consistently).
3. Derives `colorScheme` from the theme store (`mode` is already `'auto' | 'light' | 'dark'`) and
   takes `tintColor` as a token string.
4. Exposes a minimal API: `glassEffectStyle` (default `'regular'`), `tintColor`, `isInteractive`,
   plus standard `ViewProps` (`style`, children). It stays unopinionated about radius/padding — the
   caller supplies those via `style`.

Call sites use `<GlassSurface>` and never touch the raw package or guards — matching how `Icon` wraps
the icon set.

## 6. Build requirements

Liquid Glass is **build-time gated**, not just runtime:

- Needs a **dev build** (native module) — Expo Go can't render it. We already require a dev build for
  Unistyles, so no new constraint (see [design-system.md](./design-system.md) §2).
- The binary must be **compiled against the iOS 26 SDK (Xcode 26 / current EAS image)**. A build made
  with an older Xcode shows native components _without_ glass.
- iOS opt-out exists: the `UIDesignRequiresCompatibility` Info.plist flag disables system Liquid
  Glass app-wide. We must **not** set it. If ever needed, configure via `app.json` `ios.infoPlist`
  (never edit `ios/` by hand — CNG owns it; see [AGENTS.md](../AGENTS.md)).

## 7. Usage

### 7.1 Native tab bar (automatic — current)

See `src/app/(app)/(tabs)/_layout.tsx`. Key points: `NativeTabs` with `tintColor` + `minimizeBehavior`, no
`backgroundColor`, SF Symbols per tab, labels `hidden` (icon-only).

### 7.2 Floating glass surface (explicit)

Use the `GlassSurface` primitive (§5) — it hides the guard, fallback, `colorScheme`, and Reduce
Transparency handling:

```tsx
import { GlassSurface } from '@/shared/ui';

function FloatingBar() {
  return (
    <GlassSurface isInteractive style={styles.bar}>
      {/* actions */}
    </GlassSurface>
  );
}
```

Only drop to raw `GlassView` + `isGlassEffectAPIAvailable()` for cases `GlassSurface` can't express
(e.g. merging elements via `GlassContainer`, below).

### 7.3 Merging multiple glass elements

```tsx
import { GlassContainer, GlassView } from 'expo-glass-effect';

<GlassContainer spacing={20}>
  <GlassView style={styles.pillA} />
  <GlassView style={styles.pillB} />
</GlassContainer>;
```

## 8. Relevant Expo skills

The Expo plugin ships skills that cover the native surfaces glass rides on — prefer them over
guessing APIs from memory (per [AGENTS.md](../AGENTS.md)):

- **`expo-native-ui`** — HIG styling, semantic colors, SF Symbols, **visual effects / materials**,
  responsive native layout. Primary skill for glass surfaces and picking SF Symbols.
- **`expo-router`** — file-based routing incl. **NativeTabs**, native Stack, headers, header search
  bars, modals/form sheets — the components that get glass automatically.
- **`expo-ui`** — real SwiftUI (`@expo/ui/swift-ui`) when a surface needs native behavior RN can't
  express (native menus, sheets, pickers) and should inherit system materials.
- **`expo-design-system`** — extending our Unistyles theme in its own idiom; use when adding the
  `GlassSurface` token/variant work.

## 9. Cross-references

- [Design System & UI Kit](./design-system.md) — token contract, component governance, dev-build note
- [Mobile Architecture](./mobile-architecture.md) — where `shared/ui` primitives live
- [Skill: Liquid Glass iOS](./skills/liquid-glass-ios.md) — the reusable skill spec for this policy
- [AGENTS.md](../AGENTS.md) — Expo/EAS/CNG rules, "don't trust training data" for Expo APIs

## 10. File structure

| Path                                           | Role                                               |
| ---------------------------------------------- | -------------------------------------------------- |
| `src/app/(app)/(tabs)/_layout.tsx`             | Native tab bar; automatic Liquid Glass on iOS 26   |
| `src/shared/ui/NavigationHeaderBackground/`    | Tokened gradient behind native Stack chrome        |
| `src/shared/ui/GlassSurface/GlassSurface.tsx`  | Shared glass primitive: guard + tokened fallback   |
| `src/shared/ui/hooks/useReduceTransparency.ts` | Tracks the OS Reduce Transparency setting          |
| `src/shared/theme/theme.store.ts`              | Manual light/dark mode → feeds `colorScheme`       |
| `node_modules/expo-glass-effect`               | `GlassView`, `GlassContainer`, availability checks |
