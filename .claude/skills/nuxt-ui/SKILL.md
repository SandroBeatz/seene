---
name: nuxt-ui
description: >
  Mandatory skill for ANY UI work in this project — markup, layout, components,
  styling, pages, forms, modals, navigation, or any visual element.
  TRIGGER on: "добавь кнопку", "сделай форму", "верстка", "layout", "компонент",
  "страница", "карточка", "модал", "хедер", "футер", "навигация", "стили",
  "секция", "grid", "flex", "UI", "дизайн", "разметка", anything involving
  Vue templates or Tailwind classes.
  Before writing a single line of template code, this skill MUST run.
  It will look up what Nuxt UI already provides so you never build what already exists.
---

# Nuxt UI First

This project uses **Nuxt UI v3** with 125+ production-ready components.
The cardinal rule: **never build a custom component when Nuxt UI already has one.**
This skill exists to make that check automatic, not optional.

## Step 1 — Discover what Nuxt UI has (always do this first)

Before writing any template code, use context7 to look up the relevant components:

```
mcp__context7__query-docs(
  libraryId: "/llmstxt/ui_nuxt_llms_txt",
  query: "<describe what you need — e.g. 'form input validation', 'modal dialog', 'data table'>"
)
```

If that doesn't return enough, also try `/websites/ui_nuxt` (2770 snippets, highest coverage).

**What to look for:** component name (`UButton`, `UModal`, etc.), its props, slots, and variants.
Check https://ui.nuxt.com/docs/components for the full list grouped by category.

### Known component map (quick reference)

| Need                | Use                                  | Never build                     |
| ------------------- | ------------------------------------ | ------------------------------- |
| Button / link / CTA | `UButton`                            | `<button>`, custom `BaseButton` |
| Text input          | `UInput`                             | `<input>` wrapper               |
| Textarea            | `UTextarea`                          | —                               |
| Select / dropdown   | `USelect`, `USelectMenu`             | custom dropdown                 |
| Checkbox / radio    | `UCheckbox`, `URadio`, `URadioGroup` | —                               |
| Form + validation   | `UForm`, `UFormField`                | custom form wrapper             |
| Modal / dialog      | `UModal`, `UDrawer`                  | custom overlay                  |
| Notification toast  | `useToast()` + `UToast`              | alert div                       |
| Tabs                | `UTabs`                              | custom tab switcher             |
| Badge               | `UBadge`                             | `<span class="badge">`          |
| Avatar              | `UAvatar`, `UAvatarGroup`            | `<img>` wrapper                 |
| Table               | `UTable`                             | `<table>` wrapper               |
| Pagination          | `UPagination`                        | custom pager                    |
| Accordion           | `UAccordion`                         | custom collapsible              |
| Tooltip             | `UTooltip`                           | title attribute                 |
| Popover             | `UPopover`                           | —                               |
| Separator           | `USeparator`                         | `<hr>`                          |
| Spinner / loading   | `UButton loading` or skeleton        | custom spinner                  |
| Color mode toggle   | `UColorModeButton`                   | custom toggle                   |
| App root            | `UApp`                               | —                               |
| Page shell          | `UPage`, `UMain`                     | `<main>` wrapper                |
| Header              | `UHeader`                            | custom nav bar                  |
| Footer              | `UFooter`                            | `<footer>` wrapper              |
| Hero section        | `UPageHero`                          | hand-crafted hero               |
| Page section        | `UPageSection`                       | `<section>` wrapper             |
| Card                | `UPageCard`                          | `<div class="card">`            |
| Card grid           | `UPageGrid`                          | manual CSS grid                 |
| CTA block           | `UPageCTA`                           | hand-crafted CTA                |
| Sidebar             | `UPageAside`                         | custom aside                    |
| Content navigation  | `UContentNavigation`                 | —                               |

## Step 2 — Apply the Seene theme correctly

This project uses custom Nuxt UI v3 theme (`app/app.config.ts` + `app/assets/css/main.css`):

- `color="primary"` → gold scale (`#d6b97a` light / `#dfc070` dark)
- `color="neutral"` → warm cream scale
- `color="olive"` → olive accent
- `variant="subtle"`, `variant="outline"`, `variant="ghost"` — prefer these for secondary actions

CSS custom properties available everywhere:

```
--seene-bg, --seene-bg-elevated, --seene-bg-muted
--seene-text, --seene-text-muted, --seene-text-subtle
--seene-primary, --seene-primary-hover
--seene-accent, --seene-accent-hover
--seene-border, --seene-border-muted
```

For Tailwind utility classes, use `bg-gold-*`, `text-warm-*`, `bg-olive-*` (defined in `@theme static`).

## Step 3 — Customization via `ui` prop (not raw CSS)

Nuxt UI components expose a `ui` prop for slot-level overrides. Prefer this over wrapper divs:

```vue
<!-- Correct: override via ui prop -->
<UButton :ui="{ base: 'w-full justify-start' }" />

<!-- Wrong: wrapping div just to apply width -->
<div class="w-full">
  <UButton />
</div>
```

Check context7 docs for the exact slot names per component.

## Step 4 — Icons

Use Iconify icon classes — never `<img>` or `<svg>` for icons:

- Lucide: `i-lucide-<name>` (e.g. `i-lucide-arrow-right`)
- Simple Icons: `i-simple-icons-<name>` (e.g. `i-simple-icons-github`)

Pass to components via `icon`, `leading-icon`, `trailing-icon` props on `UButton`, etc.

## Step 5 — Verify before shipping

After writing the template, scan it once more:

- Any `<div>`, `<button>`, `<input>`, `<select>`, `<form>` that wraps nothing but is doing what a Nuxt UI component could do → replace it.
- Any custom Vue component that mirrors a Nuxt UI component → delete it, use `U*` directly.
- Check that all `UPageHero`, `UPageSection`, `UPageCTA` blocks go inside `UPage > UMain > NuxtPage` flow.

## When something seems missing

If you genuinely can't find a component in Nuxt UI:

1. Query context7 with a more specific term
2. Check https://ui.nuxt.com/docs/components (the full list is long)
3. Only if confirmed absent: build a custom component, keeping it minimal and Tailwind-only (no raw hex colors — use CSS vars or Tailwind scale classes)

**The default answer is always: "Nuxt UI has this — look it up."**
