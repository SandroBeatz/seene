/**
 * Pure client derivations (domain-model.md §3). Kept free of any appointment-entity
 * import: callers pass the already-fetched appointment count. Unit-tested.
 */

/**
 * A client is "new" until they have more than one appointment on record (the current
 * booking counts as the first). Mirrors the web's `countClientAppointments(id) <= 1`.
 */
export function isNewClient(appointmentCount: number): boolean {
  return appointmentCount <= 1;
}
