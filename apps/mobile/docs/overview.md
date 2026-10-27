---
version: 1.0
date: 2026-08-19
category: overview
status: draft
---

# Seene Mobile — Project Overview

> The foundation document for the native React Native rebuild of Seene. Read this first.

## What Seene is

Seene is a **booking / CRM app for solo beauty & wellness masters** — makeup artists,
hairstylists, nail techs, barbers, massage therapists, cosmetologists, brow/lash artists,
tattoo & piercing artists, and depilation specialists. One master = one account. The app is
the master's daily operating tool: it holds their **calendar**, **client address book**,
**service catalog**, **appointments**, **checkout / sales**, **payment methods**,
**working hours**, and **business analytics**.

The product is **single-role**: every authenticated user is a master. There is no "client"
login inside this app — clients are records in the master's address book, not users. (A
separate public website lets end-clients self-book; see [Two apps, one backend](#two-apps-one-backend).)

## Why this repo exists

There is a mature, production **web app** (Vue 3 SPA, `master.seene`) that already implements
the full master experience and is wrapped with Capacitor for a stop-gap mobile presence. This
repo (`app.master.seene`) is a **ground-up native rebuild on Expo / React Native**. It will
become the **primary client** of the product; the web app becomes the secondary surface.

The rebuild's goals, in priority order:

1. **Native feel & performance** — real native navigation, gestures, lists, and 60fps.
2. **A purpose-built mobile design system** — not a port of the web UI.
3. **Same business logic & data model** — nothing about the domain changes.
4. **A backend-swappable data layer** — Supabase today, custom API tomorrow, without a rewrite.
5. **AI-agent-friendly architecture** — predictable structure, documented rules, testable core.

> **Important:** the mobile app reuses the web app only as a **source of truth for business
> logic, user scenarios, data models, and rules** — never as a UI reference. The visual design
> and design system are created fresh (see [design-system.md](./design-system.md)).

## Two apps, one backend

Three repositories sit under `Seene/`, sharing a single Supabase project
(`foxqkomqtpbxyeqqwzpm`, region `ap-southeast-1` / Singapore):

| Repo | Stack | Role | Auth actor |
|---|---|---|---|
| `app.master.seene` | Expo / React Native (**this repo**) | Native master app — **primary** | Master (`auth.users`) |
| `master.seene` | Vue 3 SPA + Capacitor | Web master app — logic source of truth | Master (`auth.users`) |
| `seene` | Nuxt 4 (SSR) | Public marketing site **+ client self-booking** | Anonymous clients (phone OTP) |

The Supabase database therefore serves **two different audiences**:

- The **master app** tables (`master_profile`, `master_settings`, `service`, `service_category`,
  `client`, `appointments`, `time_block`, `payment_type`, `sale`, `sale_item`) — accessed by the
  authenticated master, scoped by `auth.uid()`.
- The **public booking** tables (`bookings`, `availability`, `otp_codes`) — accessed by the Nuxt
  site on behalf of anonymous clients, via `SECURITY DEFINER` RPCs and service-role server routes.

**This mobile app only owns the master-app tables.** It must, however, understand the public
booking flow because online bookings surface inside the master app as `appointments` with
`source = 'online_booking'`. See [database.md](./database.md) and
[open-questions.md](./open-questions.md).

## Core user (persona)

A single, non-technical beauty professional running their own micro-business from a phone. They
need to, in a few taps: see today's schedule, add/confirm/complete an appointment, take payment,
add a client, glance at how the week is going. **Speed of the daily create/checkout loop is the
product's core value.**

## Primary scenarios (at a glance)

1. **Auth & onboarding** — sign in with an emailed code (no password), Google, Apple planned, then a
   mandatory 5-step onboarding wizard that creates the `master_profile`.
2. **Calendar** — week/day/month views of appointments + time blocks.
3. **Quick create** — a guided, availability-aware wizard to book an appointment (or block time)
   in ~20–30 seconds from the home screen.
4. **Appointment lifecycle** — `pending → confirmed → completed / cancelled / no_show`, with
   `expired` auto-set for stale requests.
5. **Checkout** — complete a confirmed appointment, record a sale (atomic RPC).
6. **Clients** — address book with favourites, emoji avatars, history, "last visit".
7. **Services** — catalog with categories, duration, price, colour.
8. **Settings** — profile, contacts, working hours, booking, payment methods, service categories,
   notifications, system & region, account.
9. **Analytics / Home** — business metrics over flexible periods.

Each is documented in [features.md](./features.md) and [business-logic.md](./business-logic.md).

## Document map

| Doc | Purpose |
|---|---|
| [business-logic.md](./business-logic.md) | Domain rules, invariants, state machines |
| [features.md](./features.md) | Feature-by-feature user scenarios |
| [domain-model.md](./domain-model.md) | Entities, relationships, DTOs, mappers |
| [database.md](./database.md) | Live Supabase schema, RLS, RPCs, storage — **verified against the DB** |
| [tech-stack.md](./tech-stack.md) | Recommended stack + rationale + alternatives |
| [mobile-architecture.md](./mobile-architecture.md) | Layers, boundaries, data flow |
| [api-layer.md](./api-layer.md) | Repository/service layer, backend-swappable design |
| [state-management.md](./state-management.md) | Server state vs client state |
| [design-system.md](./design-system.md) | UI Kit & design tokens rules |
| [project-structure.md](./project-structure.md) | Directory tree & placement rules |
| [roadmap.md](./roadmap.md) | Phased implementation plan |
| [open-questions.md](./open-questions.md) | Risks, assumptions, decisions needed |

## Status

This documentation set is the **foundation phase** output. No feature screens are built yet; the
repo currently holds the stock Expo Router template. The immediate next step is **Phase 0**
(foundation) in [roadmap.md](./roadmap.md).
