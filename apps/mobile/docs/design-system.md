---
version: 3.0
date: 2026-10-27
category: design
status: implemented
---

# Design System & UI Kit

> Version 3.0 · 2026-10-27 · [Design](./)

> The foundation and rules for Seene's native design system. This document defines **how** the
> system is built and governed — the token contract, component contract, theming, states, and the
> guardrails that prevent stray styles and duplicate components. It does **not** finalize the full
> visual design of every screen; it establishes the base and the rules for growing it deliberately.
> The visual language is created fresh — **not** ported from the web UI.

## 1. Principles

1. **Tokens first.** Every visual value (color, space, radius, type, shadow, motion) is a **named
   token**. Components never hardcode raw values. If a value isn't a token, it doesn't ship.
2. **One way to build a thing.** Each UI need has exactly one component. No parallel buttons, no
   ad-hoc cards. New primitives are added deliberately, reviewed, and documented.
3. **Adaptive theming.** Light and dark are first-class, driven by tokens, switchable at runtime
   with no re-render cost (Unistyles adaptive themes).
4. **Accessible by default.** Minimum touch targets, contrast, dynamic type, reduced motion,
   screen-reader labels — built into primitives, not bolted on.
5. **Agent-legible.** The token names and component props are documented and predictable so an AI
   agent composes screens correctly without inventing styles.
6. **Composable, not configurable-to-death.** Small primitives compose into patterns; avoid mega
   components with dozens of flags.

## 2. Engine — react-native-unistyles 3

- Tokens + themes defined once in `src/shared/theme/`. Components consume tokens via
  `StyleSheet.create` (Unistyles) with `theme` and `variants`.
- Adaptive light/dark via the runtime; the app's `theme` store (`auto`/`light`/`dark`) sets the
  mode; `auto` follows the OS.
- **Dev-build requirement:** the Unistyles Babel plugin makes styled components depend on the
  native module → the app runs as a **development build**, not Expo Go, and Metro is started with
  `--clear` after plugin changes. Accepted (see [tech-stack.md](./tech-stack.md)).

## 3. Token layers

Tokens are two-tiered: **primitive** (raw scales) → **semantic** (role-based, theme-aware).
Components use **semantic** tokens only.

### 3.1 Color

Source of truth: the app boards of the "Seene: дизайн сайта" artboard (onboarding, sheets, tabs).

- **Primitive palette:** a warm neutral ramp `neutral.0–1000` (`#FFFFFF`, `#F6F6F4`, `#F0F0EE`,
  `#E7E7E4`, `#D6D6D2`, `#C9C9C4`, `#8E8E94`, `#5C5C63`, `#3A3A3F`, ink `#0B0B0C`) + the brand
  **Seene Rose** ramp (`#FDEBF0`, `#F4B8C9`, `#CF3767`, `#B92D5A`, `#9E2449`).
- **Overall look:** monochrome. **Ink** (`accent.*`) drives primary actions, selection and focus;
  **rose** (`brand.*`) is for links ("Добавить цену"), the master's initials avatar, badges and
  error emphasis. The earlier Seene Violet accent is retired.
- **Semantic roles (theme-aware):**
  `bg.canvas`, `bg.surface` (grouped rows, secondary buttons, icon buttons), `bg.elevated`,
  `bg.sunken`,
  `content.primary`, `content.secondary`, `content.tertiary`, `content.inverse`, `content.disabled`,
  `content.onDarkMuted`,
  `border.subtle`, `border.default`, `border.strong` (unchecked marks, dashed "add" buttons),
  `border.focus`, `border.dashed`,
  `control.trackOff`, `control.knob`, `control.focusRing`,
  `overlay.scrim`, `overlay.scrimStrong`, `overlay.scrimLight`, `overlay.bar`, `overlay.onImageDim`,
  `overlay.onImageEdge`, `overlay.photoShade`,
  `navigation.headerGradientStart`, `navigation.headerGradientEnd`,
  `accent.default`, `accent.pressed`, `accent.subtle`, `accent.onAccent`,
  `brand.default`, `brand.text`, `brand.strong`, `brand.subtle`, `brand.soft`,
  `feedback.success`, `feedback.warning`, `feedback.danger` (+ `dangerBorder`), `feedback.info`
  (each with a `subtle` pair), `feedback.onColor`,
  plus domain tokens: `status.pending|confirmed|completed|cancelled|no_show|expired` (drive the
  appointment status pills/calendar events) and the fixed **service** & **payment** palettes and the
  8-hue **client-initials** set (see [domain-model.md](./domain-model.md) §4). These fixed palettes
  are tokens too — never inline hex.

### 3.2 Typography

- **Faces:** Inter (400/500/600/700) for UI text, Inter Tight (600/700) for headings and figures.
  The static files live in `assets/fonts/` and are embedded at build time by the `expo-font`
  config plugin (`app.json`); web loads the same files at runtime (`shared/theme/fonts.web.ts`).
- **One family per weight.** Each file is named after its PostScript name (`Inter-SemiBold`), which
  becomes the `fontFamily` on both iOS and Android. Tokens carry the family, never `fontWeight`, so
  Android never synthesises bold and both platforms render the same face.
- **Type scale (semantic):** `display` 30, `title1` 28, `title2` 26, `figure` 24, `stat` 20,
  `title3` 19, `tile` 16 (Inter Tight bold, negative tracking); `headline` 17/600, `bodyLarge` 17,
  `callout` 16 (+ `calloutMedium`, `calloutStrong`), `body` 15 (+ `bodyMedium`, `bodyStrong`),
  `subhead` 14 (+ `subheadStrong`), `footnote` 13 (+ `footnoteStrong`), `caption` 12
  (+ `captionStrong`), `overline` 11/600 uppercase, `micro` 10. Letter-spacing is stored in px
  (design em × size).
- **Dynamic Type:** respected, capped at `MAX_FONT_SCALE` (1.3) so fixed-height controls hold.
  `Text` also disables Android font padding.
- A single `<Text>` primitive exposes `variant` (the scale) + `color` (a content token). No raw
  `fontSize`/`fontWeight` at call sites.

### 3.3 Spacing & sizing

- **Space scale** (4-pt base): `space.0,1(4),2(8),3(12),4(16),5(20),6(24),8(32),10(40),12(48)…`,
  plus half steps for the design's off-grid values: `0.25(1)`, `0.5(2)`, `1.5(6)`, `2.5(10)`,
  `3.5(14)`, `4.5(18)`, `5.5(22)`, `6.5(26)`, `7(28)`, `7.5(30)`.
- **Layout:** `layout.gutter` 20 (screen side padding), `layout.topGap` 10 (below the safe area on
  header-less screens), `layout.minBottomGap` 16.
- **Sizing tokens** for icons (`size.icon.sm/md/lg`), avatars, control heights
  (`control.height.sm/md/lg`), and **minimum touch target 44×44**.
- Layout uses tokens for padding/gap; no magic numbers.

### 3.4 Radii

- Scale: `xs 4`, `sm 8` (checkbox), `md 12` (chips), `lg 16` (buttons, inputs), `xl 20` (cards,
  tiles), `xxl 28` (sheets, dialogs, hero photo), `full`.
- Roles for one-off design values: `bar 2`, `segment 10`, `field 14` (code cells, search,
  segmented track), `panel 22` (summary card), `showcase 24`.

### 3.5 Elevation / shadows

- `shadow.*` tokens are CSS `boxShadow` strings (rendered identically on iOS and Android, inset
  supported): `knob`, `segment`, `bar`, `fab`, `bubble`, `pop`, `showcase`, `dialog`.
- `elevation.0..4` (legacy iOS shadow + Android elevation pairs) remain for older screens.
  Surfaces prefer borders over heavy shadows for the neutral aesthetic.

### 3.6 Motion

- `motion.duration.fast(120)/base(200)/fade(300)/slow(320)/sheet(400)/enter(550)` and
  `motion.easing.standard/entrance/exit/emphasized` (`emphasized` = the design's
  `cubic-bezier(0.22, 1, 0.36, 1)` used by every enter animation).
- Reanimated-driven; **respect Reduce Motion** (fall back to fades/instant).
- Standard interactions: press scale/opacity on `Button`, sheet spring, list item transitions.

### 3.7 Icons

- One SVG line-icon set (`react-native-svg`), 24-unit viewBox, round caps/joins; paths for the
  onboarding set are copied from the design (`shared/ui/Icon/glyphs.tsx`). Each glyph has a
  default stroke weight (`iconStroke.light…black`, 1.8–3) that `weight` can override; brand marks
  (Apple, Google) and `verified`/`star` are filled glyphs.
- Sized via `sizing.icon.*` (`xs 12`, `mark 13`, `sm 16`, `base 18`, `md 20`, `lg 24`, `xl 34`),
  colored via theme-color paths. A single `<Icon name>` facade so the set can change without
  touching call sites.

## 4. Component contract (the UI Kit)

Every kit component:

- Lives in `src/shared/ui/<Component>/` with `index.ts`, the component, its Unistyles styles, and
  (later) a usage snippet.
- Consumes **only** semantic tokens.
- Exposes **variants** (not free-form style props): e.g. Button `variant: primary|secondary|ghost|
danger`, `size: sm|md|lg`, `state` handled internally.
- Handles its own **interactive states** (default/hover-n-a/pressed/focused/disabled/loading) and
  **accessibility** (role, label, min target).
- Is theme- and RTL-aware and supports dynamic type.

### 4.1 Start small — the seed kit (Phase 0)

Ship a **minimal, high-confidence** set first and grow deliberately (the earlier prototype was
trimmed to Text/Button/Switch on purpose — resist premature breadth):

`Text`, `Button`, `IconButton`, `Input`, `Switch`, `Card`, `ListItem`, `Avatar`, `Badge/Pill`
(incl. `StatusPill`), `Chip`, `Divider`, `Sheet` (bottom sheet wrapper), `Modal`, the visual
wrappers in §4.3 (`Screen`, `ScreenScrollView`, `FormScreen`, `FormSheetContent`), `Footer`,
`ScrollFade`, `NavigationHeaderBackground`, and the state components in §6.

Added for the onboarding design (v3): `CodeInput` (6 cells over one native input with OS
one-time-code autofill), `SelectionMark` (24pt checkbox/radio, `onImage` tone for photo tiles),
`SegmentedControl`, `StepHeader` (back + segmented progress + counter), `SheetHeader` (grabber,
round close/back, centred title), `SectionLabel`, `GroupedCard` (filled/outlined row groups).
`Input` gained `prefix`/`suffix`/`strong`/`focusRing`/`inactive`/`below`; `Switch` is drawn from
tokens (md 50×30, sm 46×27) so it matches on both platforms; `Button` is 54pt by default with a
dedicated disabled look; `Chip` covers presets, weekdays and the dashed "custom" affordance.

Add `Select`, `Stepper`, `Calendar`, `Chart`, `EmojiPicker`, `PhoneInput` as their features
arrive.

### 4.2 Patterns (composed, documented)

- **Forms** — labeled field + input + error/help text; consistent spacing; RHF-wired.
- **Bottom sheets** — the primary overlay for previews, pickers, and confirmations
  (`@gorhom/bottom-sheet` wrapped once as `Sheet`), with a standard header (grabber, title, close)
  and scrim.
- **Modals** — for blocking confirmations (delete, sign out) via a `useConfirm`-style helper.
- **Lists** — FlashList-backed; standard `ListItem`, section headers, separators, and the state
  components below.

### 4.3 Visual screen wrappers

Screen wrappers provide only the content environment. Expo Router owns navigation hierarchy;
`_layout.tsx` and route-level `Stack.Screen` own native headers, presentation, gestures,
animations, and detents. Import wrappers from `@/shared/ui`.

| Wrapper            | Responsibility                                                  | Main props                                                                |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Screen`           | Static canvas with explicit safe-area edges                     | `padded`, `center`, `edges`, `style`, `contentStyle`                      |
| `ScreenScrollView` | Scroll canvas with automatic native content insets              | `padded`, `contentContainerStyle`, normal `ScrollViewProps`               |
| `FormScreen`       | Fixed header, keyboard-aware scroll, footer riding the keyboard | `header`, `footer`, `footerDivider`, `padded`, `edges`, scroll props      |
| `FormSheetContent` | Cross-platform content header/actions inside native form sheets | `title`, `description`, `headerLeft`, `headerRight`, `footer`             |

`PageLayout`, `ModalLayout`, and `ScreenHeader` were removed after the navigation audit. They mixed
visual layout with Stack configuration, duplicated native headers, and made important route options
hard to discover. A standard modal and a fullscreen modal reuse the same visual wrappers; their
presentation is configured in the parent Stack. `FormSheetContent` is the only presentation-aware
body pattern because Android form sheets require title/actions in content.

`Footer` and `ScrollFade` remain optional visual primitives. `Modal` is for self-contained blocking
confirmations; `Sheet` is for transient previews/pickers; navigable or deep-linkable flows are Expo
Router routes. The complete decision table and examples are in
[Navigation Architecture](./architecture/navigation.md).

`NavigationHeaderBackground` is a visual primitive, not a navigation wrapper. Stack layouts pass it
to `headerBackground`; the component reads only the active theme's semantic navigation gradient
tokens. Header transparency, tint, status-bar style, gestures, and presentation stay visible in the
owning `_layout.tsx` or `Stack.Screen`.

`_layout.tsx` files use the focused `@/shared/ui/NavigationHeaderBackground` entry point. This is a
bootstrap exception: Expo's web route manifest evaluates layouts before Unistyles selects a theme,
and importing the complete UI barrel there would eagerly load unrelated themed stylesheets.

## 5. Theming rules

- Components read tokens through the theme; **no `Appearance.getColorScheme()` at call sites** — the
  `theme` store + Unistyles own the mode.
- Domain colors (status/service/payment/client-hue) are theme-aware tokens; adjust for contrast in
  dark mode centrally, not per screen.
- Adding a color = adding a **semantic token**, reviewed. Raw hex in a component is a bug.

## 6. Mandatory states (every data surface)

Each list/section/screen defines all of:

| State               | Rule                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| **Loading (first)** | Skeletons on `isPending` only — shaped like the content, not a spinner over data |
| **Refreshing**      | Subtle indicator on `isFetching`; keep existing content visible                  |
| **Empty**           | Illustration/icon + message + primary action (e.g. "Add your first client")      |
| **Error**           | Icon + human message (from normalized errors) + retry                            |
| **Disabled**        | Reduced-emphasis tokens; never invisible; explain why when useful                |
| **Offline**         | Banner + cached content; queued-writes indicator (Phase 1+)                      |

These ship as reusable components (`SkeletonList`, `EmptyState`, `ErrorState`) so screens don't
reinvent them.

## 7. Accessibility checklist (baked into primitives)

- Touch targets ≥ 44×44; hit-slop on small controls.
- Color contrast ≥ WCAG AA for text and essential UI; never color-only status (pair with
  icon/label — the status pills already do).
- `accessibilityRole` / `accessibilityLabel` / `accessibilityState` on interactive components.
- Dynamic Type support; test at large sizes.
- Respect Reduce Motion & Reduce Transparency.
- Focus order & screen-reader flow for forms and sheets.

## 8. Governance — preventing stray styles & duplicate components

1. **Lint gate:** forbid raw color/opacity/`fontSize` literals in `features/`, `widgets/`, `app/`
   (allow only in `shared/theme`). An ESLint rule (custom or `no-restricted-syntax`) enforces this.
2. **One-component rule:** before adding a UI element, check `shared/ui` (and this doc). New
   primitives require a short entry here and a reviewer.
3. **Tokens are the API:** components accept token-named props (`color="content.secondary"`), not
   raw values.
4. **Barrel exports:** screens import kit components from `@/shared/ui`. Route-layout bootstrap code
   may use a focused UI entry point when static route discovery must avoid eagerly evaluating the
   full themed barrel; `NavigationHeaderBackground` is the current exception.
5. **UIKit route catalog:** the development-only `/uikit` route renders foundations, primitives,
   mandatory states, wrappers, and real navigation patterns as living documentation. Keep it
   protected by `__DEV__` so it cannot alter production navigation.
6. **Design tokens are the contract with design:** when Figma/design provides values, they map to
   tokens here; screens consume tokens, so a design change is a token change, not a screen sweep.

## 9. What's decided vs. open

- **Decided:** engine (Unistyles 3), ink + Seene Rose on a warm neutral base, Inter / Inter Tight,
  SVG line icons, two-tier tokens, seed kit, mandatory states, governance rules, dev-build
  requirement. Light values come 1:1 from the design.
- **Open:** the dark theme is derived from the same roles and awaits a design review; the fixed
  service/payment/client palettes in `shared/config/palettes.ts` are still the violet-era values and
  move to the design's 8 service swatches with the service form (onboarding phase 5).
