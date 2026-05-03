---
name: nuxt-ui
description: Mandatory Nuxt UI skill for any UI work in this project, including Vue templates, markup, layout, components, styling, pages, forms, modals, navigation, visual elements, Tailwind classes, or Nuxt UI component usage. Trigger on requests to add buttons, forms, cards, modals, headers, footers, sections, grids, flex layouts, pages, components, design, styles, or any user-facing UI. Before writing template code, check what Nuxt UI provides and prefer existing U* components.
---

# Nuxt UI First

This project uses Nuxt 4, Nuxt UI 4, Tailwind CSS 4, and Iconify icon packages. Prefer Nuxt UI
components and project theme tokens over custom HTML controls or raw CSS.

## Step 1 - Check Nuxt UI Components

Before editing Vue templates, inspect relevant Nuxt UI documentation. If MCP tool discovery is
available, use `tool_search` for Nuxt UI docs or components. Otherwise inspect local usage and
package docs references already present in the project.

Look for the component name, props, slots, variants, and `ui` override slots.

## Component Map

| Need | Prefer |
| --- | --- |
| Button or CTA | `UButton` |
| Text input | `UInput` |
| Textarea | `UTextarea` |
| Select or dropdown | `USelect`, `USelectMenu` |
| Checkbox or radio | `UCheckbox`, `URadioGroup` |
| Form and fields | `UForm`, `UFormField` |
| Modal or drawer | `UModal`, `UDrawer` |
| Toast | `useToast()` and Nuxt UI toast components |
| Tabs | `UTabs` |
| Badge | `UBadge` |
| Avatar | `UAvatar`, `UAvatarGroup` |
| Table | `UTable` |
| Pagination | `UPagination` |
| Accordion | `UAccordion` |
| Tooltip or popover | `UTooltip`, `UPopover` |
| Separator | `USeparator` |
| App root | `UApp` |

Use custom markup only when Nuxt UI does not provide the needed behavior or the existing project
pattern is clearly custom.

## Project Theme

Theme configuration lives in `app/app.config.ts`, `app/assets/css/main.css`, and
`app/assets/css/theme.css`. Prefer project tokens and configured color names over raw hex values.

Common CSS variables:

```text
--seene-bg
--seene-bg-elevated
--seene-bg-muted
--seene-text
--seene-text-muted
--seene-text-subtle
--seene-primary
--seene-primary-hover
--seene-accent
--seene-accent-hover
--seene-border
--seene-border-muted
```

Prefer Tailwind utility classes already used in the codebase and Nuxt UI variants such as
`subtle`, `outline`, `ghost`, and `soft` where appropriate.

## Customization

Use Nuxt UI props and the `ui` prop for slot-level styling before adding wrapper elements:

```vue
<UButton :ui="{ base: 'w-full justify-start' }" />
```

Avoid wrapper `<div>` elements that only duplicate width, alignment, spacing, or state styling
already supported by the component.

## Icons

Use Iconify classes from installed icon packages:

- Lucide: `i-lucide-<name>`
- Simple Icons: `i-simple-icons-<name>`

Pass icons through Nuxt UI props such as `icon`, `leading-icon`, or `trailing-icon` when the
component supports them.

## Verification

Before finishing UI work:

- Replace plain controls with Nuxt UI equivalents where practical.
- Confirm visible text is handled through the project i18n flow.
- Check responsive behavior on narrow and desktop widths.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` when the change affects shared UI or pages.
