---
spec_version: 1.0
date: 2026-08-19
status: built
skill_slug: liquid-glass-ios
skill_name: Liquid Glass iOS
targets: [claude-code, codex, universal]
---

# Liquid Glass iOS — Skill Specification

> Spec v1.0 · 2026-08-19 · status: built · [Skills index](./README.md)

## 1. Purpose

Give an agent working in this Expo app a consistent, correct way to adopt Apple's **Liquid Glass**
design (iOS 26) as far as the platform allows, without crashing older iOS, breaking Android, or
violating the Unistyles token contract. The skill encodes the project policy from
[../liquid-glass-ios.md](../liquid-glass-ios.md): prefer native surfaces (which get glass for free),
add explicit `expo-glass-effect` only for floating chrome, always guard availability, and always
provide a tokened fallback. It exists so glass work is uniform and safe rather than ad-hoc per screen.

## 2. When to trigger

**Should trigger** when the user asks to:
- "use liquid glass", "add the iOS 26 glass look", "make the tab bar / header / toolbar glassy".
- Build a floating surface (FAB, floating toolbar, mini-player, overlay pill) that should read as glass.
- Convert a native surface (tabs, header, sheet, search bar) to the native component so it inherits
  system materials.
- Review/fix a glass surface that looks wrong, crashes on older iOS, or ignores the theme toggle.

**Should NOT trigger** for:
- General theming, color tokens, or typography with no glass/material intent → design-system work.
- Android-only Material styling.
- Generic blur (`expo-blur`) requests unrelated to Liquid Glass, unless the user explicitly wants the
  iOS 26 glass material.

## 3. Inputs

- The target surface (which screen/component) and whether it's **native chrome** (OS-owned) or a
  **custom floating** element — the key branch in the workflow.
- The repo's current state: `expo` major (must be ≥ 57 for glass), `expo-glass-effect` installed,
  `expo-router/unstable-native-tabs` in use, the Unistyles theme (`src/shared/theme/`) and manual
  light/dark store (`theme.store.ts`).
- Existing policy doc [../liquid-glass-ios.md](../liquid-glass-ios.md) — the source of truth.

## 4. Outputs

- Code changes implementing glass on the requested surface, following the two-mechanism rule (§5).
- For explicit glass: an availability-guarded component with a tokened fallback, ideally routed
  through a shared `GlassSurface` primitive (create it under `src/shared/ui/GlassSurface/` if absent).
- No `backgroundColor` added to native surfaces that should stay glassy.
- A short note to the user on build requirements (iOS 26 SDK dev build) when relevant.

## 5. Workflow

1. **Verify platform capability.** Confirm `expo` major ≥ 57 (glass exists) and `expo-glass-effect`
   is installed. Per project AGENTS.md, do not trust memory for Expo APIs — check `package.json` and
   versioned docs / the `expo-native-ui` and `expo-router` skills.
2. **Classify the surface.**
   - *Native chrome* (tab bar, nav header, search bar, sheet, context menu) → **automatic** path.
   - *Custom floating element* → **explicit** path.
3. **Automatic path.** Use the native component (`NativeTabs`, native `Stack`/`Stack.Screen`, form
   sheets). Critically, **remove any custom `backgroundColor`** on that surface — a background opts it
   out of the system material. Keep `tintColor`, SF Symbols, `minimizeBehavior`. Don't stack a
   `GlassView` on top of OS chrome.
4. **Explicit path.** Render `GlassView` (or `GlassContainer` for merging elements) **only** when
   `isGlassEffectAPIAvailable()` is true and Reduce Transparency is off; otherwise render a tokened
   opaque fallback (`theme.colors.bg.elevated` + `border.subtle`). Prefer creating/using a shared
   `GlassSurface` primitive so the guard + fallback live in one place (mirrors how `Icon` wraps the
   icon set).
5. **Tokenize appearance.** Derive `tintColor` from theme tokens and pass `colorScheme` from the
   manual theme store (`'auto'` when mode is system, else `'light'`/`'dark'`) so glass matches our
   toggle, not just the OS.
6. **Handle accessibility.** Treat `AccessibilityInfo.isReduceTransparencyEnabled()` as a reason to
   fall back to opaque.
7. **State build requirements.** Remind the user that Liquid Glass needs a dev build compiled against
   the iOS 26 SDK (Xcode 26 / current EAS image), and that `UIDesignRequiresCompatibility` must not be
   set. Native config only via `app.json` (CNG owns `ios/`).
8. **Validate.** Run `npx tsc --noEmit` and `npx expo lint`. Confirm no `backgroundColor` was added to
   a glassy native surface and that every explicit `GlassView` is guarded.

## 6. Resources

- [../liquid-glass-ios.md](../liquid-glass-ios.md) — canonical policy/mechanics (read first).
- Expo skills: `expo-native-ui` (materials, SF Symbols), `expo-router` (NativeTabs, native Stack),
  `expo-ui` (SwiftUI surfaces), `expo-design-system` (extending the theme for `GlassSurface`).
- `expo-glass-effect` type defs in `node_modules/expo-glass-effect/build/*.d.ts` — authoritative API.
- No bundled scripts required.

## 7. Examples

- **Input:** "make the tab bar use the iOS 26 glass look."
  **Output:** Native `NativeTabs` with `backgroundColor` removed, `tintColor` from tokens,
  `minimizeBehavior="onScrollDown"`; note about needing an iOS 26 SDK dev build.
- **Input:** "add a floating action button that looks like frosted glass."
  **Output:** A `GlassSurface`/guarded `GlassView` FAB with `isInteractive`, tokened tint and
  `colorScheme`, and a `bg.elevated` fallback for iOS < 26 / Android / Reduce Transparency.

## 8. Acceptance criteria

- Every explicit `GlassView`/`GlassContainer` render is gated by `isGlassEffectAPIAvailable()` and has
  a non-glass tokened fallback path.
- No `backgroundColor` is set on a native surface intended to show system Liquid Glass.
- `tintColor` uses theme tokens (no raw hex); `colorScheme` reflects the manual theme store.
- Reduce Transparency results in the opaque fallback.
- `npx tsc --noEmit` and `npx expo lint` pass after the change.
- The user is told about the iOS 26 SDK dev-build requirement when a build is implied.

## 9. Target adaptation

### 9.1 Claude Code
Build `.claude/skills/liquid-glass-ios/SKILL.md` (project-level). `description` must encode §2
triggers (liquid glass, iOS 26 material, glassy tab bar/header/toolbar/FAB). Body = §5 workflow +
§8 criteria. Reference `docs/liquid-glass-ios.md` and instruct deferring to the `expo-native-ui` /
`expo-router` skills for exact APIs. No scripts needed.

### 9.2 Codex / AGENTS.md
Add a "Liquid Glass (iOS)" section to `AGENTS.md` (or a linked instruction file) summarizing the
policy: prefer native surfaces (no background), guard explicit glass with a tokened fallback,
tokenize tint/colorScheme, require an iOS 26 SDK dev build. Point to `docs/liquid-glass-ios.md` for
detail.

### 9.3 Universal
Given only this spec + `docs/liquid-glass-ios.md`, any agent should: classify surface → native vs
explicit; for native remove backgrounds; for explicit guard + fallback + tokenize; validate with
tsc/lint; and surface the build requirement. No host-specific tooling assumed.

## 10. Materialization log

| Tool        | Location                              | Built from spec v | Date |
|-------------|---------------------------------------|-------------------|------|
| claude-code | .claude/skills/liquid-glass-ios/      | 1.0               | 2026-08-19 |
| codex       | AGENTS.md#liquid-glass-ios            | —                 | —    |

## 11. Changelog

- v1.0 — Initial spec: policy, two-mechanism workflow, guards, tokenization, build requirements.
