---
version: 1.0
date: 2026-08-19
category: design
status: proposed
---

# Design System & UI Kit

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

- **Primitive palette:** a neutral gray ramp (0–1000) + the brand accent.
- **Brand accent — "Seene Violet":** `#7A5AF8` (light) / `#8B6DFF` (dark). One accent, defined once.
- **Overall look:** monochrome/neutral base (Instagram/Threads-like restraint) with the violet
  accent for primary actions, selection, and focus.
- **Semantic roles (theme-aware):**
  `bg.canvas`, `bg.surface`, `bg.elevated`, `bg.sunken`,
  `content.primary`, `content.secondary`, `content.tertiary`, `content.inverse`, `content.disabled`,
  `border.default`, `border.strong`, `border.subtle`,
  `accent.default`, `accent.pressed`, `accent.subtle`, `accent.onAccent`,
  `feedback.success`, `feedback.warning`, `feedback.danger`, `feedback.info` (each with `subtle`/
  `onColor` pairs),
  plus domain tokens: `status.pending|confirmed|completed|cancelled|no_show|expired` (drive the
  appointment status pills/calendar events) and the fixed **service** & **payment** palettes and the
  8-hue **client-initials** set (see [domain-model.md](./domain-model.md) §4). These fixed palettes
  are tokens too — never inline hex.

### 3.2 Typography

- One type family (system default or a chosen brand face via `expo-font`).
- **Type scale (semantic):** `display`, `title1`, `title2`, `title3`, `headline`, `body`,
  `bodyStrong`, `callout`, `subhead`, `footnote`, `caption`. Each token bundles size / line-height /
  weight / letter-spacing.
- **Dynamic Type:** respect OS font scaling; cap extreme scales where layout would break.
- A single `<Text>` primitive exposes `variant` (the scale) + `color` (a content token). No raw
  `fontSize`/`fontWeight` at call sites.

### 3.3 Spacing & sizing

- **Space scale** (4-pt base): `space.0,1(4),2(8),3(12),4(16),5(20),6(24),8(32),10(40),12(48)…`.
- **Sizing tokens** for icons (`size.icon.sm/md/lg`), avatars, control heights
  (`control.height.sm/md/lg`), and **minimum touch target 44×44**.
- Layout uses tokens for padding/gap; no magic numbers.

### 3.4 Radii

- `radius.none/sm(6)/md(10)/lg(14)/xl(20)/full`. Cards `lg`, sheets `xl`, pills `full`, inputs `md`.

### 3.5 Elevation / shadows

- `elevation.0..4` semantic tokens (iOS shadow + Android elevation pairs). Sheets and menus use
  defined levels; surfaces prefer borders over heavy shadows for the neutral aesthetic.

### 3.6 Motion

- `motion.duration.fast(120)/base(200)/slow(320)` and `motion.easing.standard/entrance/exit`.
- Reanimated-driven; **respect Reduce Motion** (fall back to fades/instant).
- Standard interactions: press scale/opacity on `Button`, sheet spring, list item transitions.

### 3.7 Icons

- One icon set (e.g. `expo-symbols` on iOS + a consistent set like Lucide via `@expo/vector-icons`
  cross-platform). Sized via `size.icon.*`, colored via content tokens. A single `<Icon name>`
  facade so the underlying set can change without touching call sites.

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
(incl. `StatusPill`), `Chip`, `Divider`, `Sheet` (bottom sheet wrapper), `Modal`, and the state
components in §6. Add `Select`, `SegmentedControl`, `Stepper`, `Calendar`, `Chart`, `PriceInput`,
`EmojiPicker`, `PhoneInput` as their features arrive.

### 4.2 Patterns (composed, documented)

- **Forms** — labeled field + input + error/help text; consistent spacing; RHF-wired.
- **Bottom sheets** — the primary overlay for previews, pickers, and confirmations
  (`@gorhom/bottom-sheet` wrapped once as `Sheet`), with a standard header (grabber, title, close)
  and scrim.
- **Modals** — for blocking confirmations (delete, sign out) via a `useConfirm`-style helper.
- **Lists** — FlashList-backed; standard `ListItem`, section headers, separators, and the state
  components below.

## 5. Theming rules

- Components read tokens through the theme; **no `Appearance.getColorScheme()` at call sites** — the
  `theme` store + Unistyles own the mode.
- Domain colors (status/service/payment/client-hue) are theme-aware tokens; adjust for contrast in
  dark mode centrally, not per screen.
- Adding a color = adding a **semantic token**, reviewed. Raw hex in a component is a bug.

## 6. Mandatory states (every data surface)

Each list/section/screen defines all of:

| State | Rule |
|---|---|
| **Loading (first)** | Skeletons on `isPending` only — shaped like the content, not a spinner over data |
| **Refreshing** | Subtle indicator on `isFetching`; keep existing content visible |
| **Empty** | Illustration/icon + message + primary action (e.g. "Add your first client") |
| **Error** | Icon + human message (from normalized errors) + retry |
| **Disabled** | Reduced-emphasis tokens; never invisible; explain why when useful |
| **Offline** | Banner + cached content; queued-writes indicator (Phase 1+) |

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
4. **Barrel exports:** import kit components from `@/shared/ui` only.
5. **Snapshot/Storybook (optional, recommended):** a component gallery screen (like the web's
   `ui-guide`) renders every primitive in light/dark and all states, as living documentation and a
   visual-regression surface.
6. **Design tokens are the contract with design:** when Figma/design provides values, they map to
   tokens here; screens consume tokens, so a design change is a token change, not a screen sweep.

## 9. What's decided vs. open

- **Decided:** engine (Unistyles 3), accent (Seene Violet), monochrome base, two-tier tokens,
  seed kit, mandatory states, governance rules, dev-build requirement.
- **Open (for design):** the exact primitive scales' values (final hex ramp, type sizes, spacing
  rhythm), the icon set choice, brand font, and the full component visual specs. These are filled
  in by the dedicated design pass and encoded as tokens. See [open-questions.md](./open-questions.md)
  Q-DS-1.
