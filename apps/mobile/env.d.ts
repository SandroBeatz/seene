/// <reference types="expo/types" />

// Typed, bundled public env vars. Only ever expose the publishable anon key —
// never the service_role key (see docs/api-layer.md §5).
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_SUPABASE_URL: string;
    readonly EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    readonly EXPO_PUBLIC_SENTRY_DSN?: string;
  }
}

// Static asset imports (Metro returns an opaque asset id). expo-image accepts
// these directly as `source`, and SVGs can be recolored via `tintColor`.
declare module '*.svg' {
  const source: number;
  export default source;
}
declare module '*.jpg' {
  const source: number;
  export default source;
}
declare module '*.png' {
  const source: number;
  export default source;
}
