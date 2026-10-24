# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm lint         # ESLint
pnpm typecheck    # Vue type checking via vue-tsc
```

## Stack

- **Nuxt 4** with `app/` directory layout
- **Nuxt UI v3** — component library (prefix `U`, e.g. `UButton`, `UPageHero`)
- **Tailwind v4** — via `@import "tailwindcss"` in CSS, no config file
- **TypeScript** — strict, checked with `nuxt typecheck`
- **ESLint** via `@nuxt/eslint` (stylistic: no trailing commas, 1tbs braces)

## Architecture

All source lives in `app/`:

- `app/app.vue` — root layout: `UApp > UHeader / UMain / UFooter`
- `app/app.config.ts` — Nuxt UI theme config (colors, component slot overrides)
- `app/pages/` — file-based routing
- `app/components/` — auto-imported Vue components
- `app/assets/css/main.css` — global styles entry point (imported by `nuxt.config.ts`)

## Design System

Theme colors are configured through Nuxt UI semantic tokens:

| Token       | Scale name | Use                                |
| ----------- | ---------- | ---------------------------------- |
| `primary`   | `zinc`     | Main actions and inverted surfaces |
| `secondary` | `sky`      | Instagram-like action accent       |
| `neutral`   | `zinc`     | Text, backgrounds, borders         |

Use Nuxt UI semantic classes such as `text-muted`, `bg-elevated`, `bg-inverted`, and component props like `color="primary"` or `color="secondary"`. The marketing site is light only; semantic `--ui-*` variables are overridden in the `:root` block in `main.css`.

Design tokens from the site design live in `@theme` in `main.css`: `font-sans` (Inter), `font-display` (Inter Tight, headings and large numbers), `font-mono` (JetBrains Mono, prices and times) and the neutrals `ink`, `ink-muted`, `line`, `surface`.

**Master pages are themed per master.** `/[username]` and its booking sheet use the `master` layout, which calls `useMasterThemeRoot()`: it puts the `--ui-*` variables from `useMasterTheme()` as an inline style on `<html>` while the layout is mounted (so modals and drawers teleported to `<body>` follow the theme), and Unhead removes them on leaving. Light or dark theme and the master's accent as `primary`, with button text picked for ≥ 4.5:1 contrast (`shared/utils/masterTheme.ts`); `--seene-accent-soft` and `--seene-accent-text` are the tinted background and the readable link color. Inside those layouts never hard-code `bg-white`, `zinc-*` or other fixed colors — use semantic classes so the dark theme and the accent work.

**Master page** (`app/pages/[username]/index.vue`) is one scroll of `components/Master/*` blocks in the spec's order: `Hero` (poster, avatar, verified badge, stats), `About` (bio with "More"), `Contacts` (≤ 5), `Works`, `Services`, `Footer`, and the sticky `BookBar` with the nearest free slot from `GET /api/master/[username]/nearest`. Empty blocks are not rendered. Times are shown in the master's time zone (`useMasterPageFormat`).

**Booking** opens over the master page as `components/Booking/BookingSheet.vue` (fullscreen `UModal`); the step is in the URL (`?book=services|time|details|done`, `useBookingFlow`), so browser Back walks the steps. Several services per booking. Step 3 has its own screens in `BookingStep3Details`: phone (checked in the background, spinner in the field) → "welcome back" for a trusted device, or code → "welcome back, <name>" / "first visit" (name only for new clients). Name and "known or new" are shown only after the code or to a trusted device. On the details step the slot is held for 10 minutes (`POST/DELETE /api/master/[username]/hold`, table `slot_hold`, browser known by the `seene_holder` cookie); other clients' holds count as busy time in `loadDailySlots`. `create_appointment_from_booking` enforces the hold, the blacklist (`client.blocked`), at most 2 future online bookings per phone, and returns the first booking on a repeated tap. `/[username]/book` only redirects to `?book=services`.

**Booking link** (`app/pages/c/[token].vue`, `/c/<token>`): the personal link from the confirmation message. `GET /api/c/[token]` returns the state (`open`, `late` after the cancel window, `cancelled`, `moved` — the booking was moved and `booking` is the current one, found by `rescheduled_from`, `past`) and the booking, never the client's name or phone; `POST /api/c/[token]/cancel` cancels. "Move" is one screen over the page (`components/Booking/BookingReschedule.vue`: the time step, a close button, "Move · <day, time>"); no phone or code, the link is the proof. `POST /api/c/[token]/reschedule` creates the new booking with the same client and services, the RPC cancels the old one in the same transaction, and the page switches to the new booking's link. The page reads the master page's translations (`routesLocaleLinks: { 'c-token': 'username' }`), keys under `cancel.*`. Shared booking server code (RPC result, errors, confirmation) is in `server/utils/onlineBooking.ts`. Tokens are stored as SHA-256 hashes (`booking_link`, `server/utils/bookingLink.ts`). The link is built in the master's language (`/ru/c/…`).

**Messages to clients** go through `sendMessage()` in `server/utils/messaging.ts` (codes, booking confirmation with the link). No provider is wired yet: the `log` provider writes the full text to the server log in dev or with `NUXT_OTP_EXPOSE_CODE=true`, otherwise only the template and the last 4 digits. A failed confirmation never undoes a booking.

**Marketing pages** (`/`, `/pricing`, `/calculator`) follow the "Главная", "Цены" and "Калькулятор" artboards of the site design. They use the `default` layout: `components/Site/SiteHeader.vue` (sticky `UHeader`, "Download" leads to `/#join` until the app is in the stores) and `SiteFooter.vue` (black, links only to pages that exist). Homepage sections are `components/Home/Home*.vue`, in the design's order: hero, features (`#features`), master page and online booking (`#booking`), specialties, reasons, founders (`#join`), questions, final call. The phones on the homepage are app and booking screens drawn in HTML from the design's artboards (`HomeApp*.vue` in `HomeAppPhone`, `HomeBookingPhone`), pictures for people with the text in their label; the two showcases switch the phone with `HomeShowcaseItem`. The design's reviews (placeholders until founders' real feedback), "See an example page" (no demo master yet) and "Blog" are left out. Type helpers `site-container`, `site-eyebrow`, `site-h2` and colors `brand`, `blush`, `paper`, `wa` are in `main.css`. Motion follows the animation spec: `v-reveal` (`plugins/reveal.ts`) raises a block 12 px when 20% of it is on screen, `v-reveal="i"` staggers cards by 60 ms, `v-reveal:sheet` slides a phone's bottom sheet; the hero uses `site-rise`, `site-arrive`, `site-float`. Nothing is hidden without JavaScript or with reduced motion.

**Pictures** from the image spec go through `<SiteImage name="h-01-hero" id="H-01" sizes="…">`. Import them with `pnpm web images <folder> <name> …` (`scripts/site-images.sh`, needs `cwebp`): it copies `<name>.webp` and the phone crop `<name>-mobile.webp` into `app/assets/images/site/`, adds 640 px copies (`@640`) and rewrites `site-images.json` with every file's size. The page then gets hashed URLs, `srcset`/`sizes`, `width`/`height` and lazy loading (the hero is `priority`: eager, `fetchpriority="high"`). Import only pictures that have a place on the site; until a picture exists, a tinted placeholder shows its ID. The link preview is `public/og-01-share.jpg`; its absolute address comes from `NUXT_PUBLIC_SITE_URL` (on Vercel, the project's address).

**Founders waitlist**: the form in `#join` posts to `POST /api/waitlist` (table `waitlist`, rules in `shared/utils/waitlist.ts`). A hidden `website` field and a fill time under 2.5 s are answered "ok" without saving; more than 5 applications per IP per hour get 429; the same contact again keeps the first row. "What you do" is free text (`specialty`). Store links for the download buttons come from `NUXT_PUBLIC_APP_STORE_URL` and `NUXT_PUBLIC_GOOGLE_PLAY_URL`.

## Phone Numbers — strict format rule

- **Canonical format:** E.164 digits only — country code + national number, **no `+`, no spaces, no punctuation**. Example: `996555123456`.
- This exact string is what the client sends to the API, what the API returns, and what is stored in the database (`client.phone`, `phone_verification.phone`, `otp_codes.phone`).
- Formatting (`+996 555 123 456`) is **display-only**: the input field formats as-you-type per country (`resolvePhoneInput`), read-only UI uses `formatPhone`. Never send or persist a formatted value.
- The server validates with `normalizePhone()` (`server/utils/phoneVerification.ts`) and rejects anything that is not canonical digits (400).
- All helpers live in `shared/utils/phone.ts` — use them, do not hand-roll phone parsing.

## Usernames

A master's page is `/<username>`. Format: lowercase `a–z`, digits, `_`, `-`, 3–30 characters, starting with a letter or digit, no dots, site paths reserved. The rule lives in `shared/utils/username.ts` and must match the `master_profile_username_format` CHECK and the master app. When adding a top-level page, add its path to `RESERVED_USERNAMES` and to the CHECK in a migration.

## Skills

Project-local skills live in `.claude/skills/`. Two skills are mandatory for UI/markup work and must both be invoked:

- **`nuxt-ui`** — enforces Nuxt UI component lookup via context7 MCP before writing any template code
- **`i18n`** — enforces i18n rules: all visible text must be wrapped in `$t()`, keys managed across `locales/en.json`, `locales/fr.json`, `locales/ru.json`. Invoke with `--check` to audit hardcoded strings across the project.

## Project Context

Seene is an online booking platform for beauty professionals (nail techs, brow artists, lash makers, makeup artists) — targeting Russian-speaking market. The homepage (`app/pages/index.vue`) is the primary marketing landing page.
