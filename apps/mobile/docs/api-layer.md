---
version: 1.1
date: 2026-08-26
category: practices
status: proposed
---

# API & Data Layer

> Version 1.1 · 2026-08-26 · [Practices](./)

> The rule that keeps Seene backend-swappable: **components and business logic never touch
> Supabase.** All data access goes through a thin repository/service layer. This is a direct port
> of the web app's `docs/practices/api-service-layer.md`, adapted to React Native + TanStack Query.

## 1. The one rule

> `supabase` may be imported **only** inside `entities/<entity>/api/<entity>.api.ts`.
> Nothing else — no screen, widget, feature, store, or hook — imports `supabase` for data.

Why: when the backend changes (Supabase → custom REST/gRPC), only `api/` files change. Query
hooks, components, cache keys, and invalidation stay identical.

## 2. Three levels

```
┌───────────────────────────────────────────────┐
│ Screens / Widgets / Features                   │
│  – call useXQuery / useXMutation hooks only     │
│  – never import api/ or supabase directly       │
└───────────────┬───────────────────────────────┘
                │
┌───────────────▼───────────────────────────────┐
│ entities/x/model/x.queries.ts                  │
│  – TanStack Query hooks: keys, invalidation,    │
│    optimistic updates, enabled flags            │
│  – never imports supabase                       │
└───────────────┬───────────────────────────────┘
                │
┌───────────────▼───────────────────────────────┐
│ entities/x/api/x.api.ts                        │
│  – the ONLY place supabase.from()/.rpc() lives  │
│  – plain async fns, throw on error, typed out   │
│  – no React, no store writes, no navigation      │
└───────────────────────────────────────────────┘
```

| Layer                | May import                         | Must not import                |
| -------------------- | ---------------------------------- | ------------------------------ |
| `api/*.api.ts`       | `shared/api` (supabase), own types | React, Zustand, other entities |
| `model/*.queries.ts` | own `api/`, own `model/types`      | supabase directly              |
| Components           | own `model` hooks                  | `api/` or supabase directly    |

## 3. Writing an api function

Same contract as web: typed in, typed out, throw on error, no side effects.

```ts
// entities/client/api/clients.api.ts
import { supabase } from '@/shared/api/supabase';
import type { Client, CreateClientDto } from '../model/types';

export async function listClients(userId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('client')
    .select('*')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('first_name');
  if (error) throw error;
  return data as Client[];
}

export async function createClient(userId: string, dto: CreateClientDto): Promise<Client> {
  const { data, error } = await supabase
    .from('client')
    .insert({ ...dto, user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data as Client;
}
```

Rules: signature `(input) => Promise<Output>`; always `{ data, error }` then `throw error`; return
typed data, never the raw response; no toasts, no store writes, no navigation; file path
`entities/<entity>/api/<entity>.api.ts`. RPCs use `supabase.rpc('complete_appointment', {...})`
here too.

## 4. Writing query & mutation hooks (TanStack v5)

```ts
// entities/client/model/client.queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listClients, createClient } from '../api/clients.api';
import type { CreateClientDto } from './types';

export const clientKeys = {
  all: (userId: string) => ['clients', userId] as const,
};

export function useClientsQuery(userId: string) {
  return useQuery({
    queryKey: clientKeys.all(userId),
    queryFn: () => listClients(userId),
    enabled: !!userId,
  });
}

export function useCreateClientMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClientDto) => createClient(userId, dto),
    onSettled: () => qc.invalidateQueries({ queryKey: clientKeys.all(userId) }),
  });
}
```

- **Cache keys:** `[entityName, ...identifiers]` — centralize per entity in a `keys` object so
  queries and invalidations never drift. Mirror the web keys exactly (`['appointments', userId,
from, to]`, `['appointments-actionable', userId]`, `['sale-by-appointment', id]`, …).
- **Invalidate on `onSettled`**, not just `onSuccess`, so a failed mutation still refreshes (this is
  why the web checkout never leaves a stale `pending`).
- **`enabled`** gates dependent queries (e.g. client-appointments only when a `clientId` exists).
- **Loading flags:** `isPending` (no data yet → show skeleton) vs `isFetching` (any fetch → subtle
  "refreshing"). Never replace a populated list with a skeleton on background refetch — the web's
  `isPending`-vs-`isLoading` lesson.
- **Optimistic updates:** use `onMutate` (snapshot + patch cache) / `onError` (rollback) for the
  favourite toggle, payment-active toggle, and checkout status flip.

## 5. Supabase in React Native (critical init differences)

The web does `createClient(url, key)` with no options and browser `localStorage`. **RN needs
more:**

```ts
// shared/api/supabase.ts
import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { sessionStorageAdapter } from './session-storage'; // SecureStore/encrypted-MMKV (see below)

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: sessionStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // no browser URL to parse in RN
      flowType: 'pkce', // for native OAuth
    },
  },
);

// Refresh the session only while the app is foregrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

- **Env:** use `EXPO_PUBLIC_*` vars (bundled, publishable key only — never the `service_role` key).
- **Session storage adapter (Q-ARCH-2, implemented):** native stores the potentially large session
  blob in a dedicated encrypted MMKV instance and stores only its random 32-byte encryption key in
  SecureStore. `session-storage.web.ts` uses browser `localStorage`; during Expo static rendering it
  falls back to isolated in-memory storage. The same `.web.ts` split prevents the non-secret query,
  theme, and locale stores from importing native MMKV during web rendering.
- **URL polyfill** is required for supabase-js in RN.

## 6. Auth in the api layer

Auth calls (`signInWithPassword`, `signUp`, `signInWithOAuth`/native, `signOut`, `updateUser`,
`onAuthStateChange`, `getSession`) live in `entities/session/api/session.api.ts`. The session
**store** (Zustand) subscribes to `onAuthStateChange` — see [state-management.md](./state-management.md)
for the synchronous-callback / deferred-fetch rule (the auth-lock deadlock is real and ported).

Native OAuth (Google/Apple) uses `expo-auth-session` / `expo-apple-authentication` +
`supabase.auth.signInWithIdToken({ provider, token, nonce })` — **not** the web redirect flow.

## 7. Error normalization

```ts
// shared/api/errors.ts
export type AppError =
  | { kind: 'duplicate_phone' }
  | { kind: 'already_completed' }
  | { kind: 'appointment_not_found' }
  | { kind: 'unknown'; message: string };

export function normalizeError(e: unknown): AppError {
  const code = (e as any)?.code;
  const msg = (e as any)?.message ?? '';
  if (code === '23505') return { kind: 'duplicate_phone' };
  if (msg.includes('already_completed')) return { kind: 'already_completed' };
  if (msg.includes('appointment_not_found')) return { kind: 'appointment_not_found' };
  return { kind: 'unknown', message: msg };
}
```

Each `kind` maps to an i18n key at the UI. Keep this the single translation point for backend
errors.

## 8. Migrating off Supabase (the payoff)

Only `api/*.api.ts` changes; hooks and components don't:

```ts
// Before (Supabase)
export async function listClients(userId: string): Promise<Client[]> {
  const { data, error } = await supabase.from('client').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as Client[];
}
// After (custom REST)
export async function listClients(userId: string): Promise<Client[]> {
  const res = await fetch(`${API}/clients?userId=${userId}`, { headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Client[]>;
}
```

## 9. Type safety with the DB (recommendation)

Generate Supabase types (`supabase gen types typescript --project-id foxqkomqtpbxyeqqwzpm`) into
`shared/api/database.types.ts` and type the client with them, so `from('client').select()` is
schema-checked and drift is caught at compile time — the web app lacks this and casts blindly.
Domain types can still be hand-authored (or Zod-inferred) and derived from the generated Row types.
See [domain-model.md](./domain-model.md) §5 (Q-ARCH-1).

## 10. Checklist for adding a new data operation

1. Add the typed function to `entities/<x>/api/<x>.api.ts` (throw on error).
2. Add/extend types (or Zod schema) in `model/types.ts`.
3. Wrap it in a hook in `model/<x>.queries.ts` with a centralized key + invalidation.
4. Export via the slice `index.ts`.
5. Consume the hook in the widget/feature — never the api function.
6. Add unit tests for any pure mapping/derivation; add optimistic handlers if it's a hot toggle.
