/**
 * Single translation point for backend errors. The api layer throws raw Supabase
 * errors; this maps the known ones to typed app errors whose `kind` maps to an i18n
 * key at the UI. See docs/api-layer.md §7.
 */
export type AppError =
  | { kind: 'duplicate_phone' }
  | { kind: 'already_completed' }
  | { kind: 'appointment_not_found' }
  | { kind: 'username_taken' }
  | { kind: 'network' }
  | { kind: 'unauthorized' }
  | { kind: 'unknown'; message: string };

export function normalizeError(e: unknown): AppError {
  const code = (e as { code?: string } | null)?.code;
  const message = (e as { message?: string } | null)?.message ?? '';
  const details = (e as { details?: string } | null)?.details ?? '';

  // 23505 = Postgres unique_violation. Disambiguate by the offending constraint so a
  // taken username is not reported as a duplicate phone (both share this code).
  if (code === '23505') {
    const constraint = `${message} ${details}`.toLowerCase();
    if (constraint.includes('username')) return { kind: 'username_taken' };
    return { kind: 'duplicate_phone' };
  }
  if (message.includes('already_completed')) return { kind: 'already_completed' };
  if (message.includes('appointment_not_found')) return { kind: 'appointment_not_found' };
  if (message.includes('username_taken')) return { kind: 'username_taken' };
  if (code === 'PGRST301' || message.toLowerCase().includes('jwt')) return { kind: 'unauthorized' };
  if (message.toLowerCase().includes('network') || message.includes('Failed to fetch')) {
    return { kind: 'network' };
  }
  return { kind: 'unknown', message };
}

/** i18n key for an AppError kind (namespace `errors`). */
export function errorMessageKey(error: AppError): string {
  return `errors.${error.kind}`;
}
