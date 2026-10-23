/**
 * What the personal booking link (/c/<token>) shows:
 * open      the booking, with "Move" and "Cancel"
 * late      the cancel window has closed: only "Message the master"
 * cancelled the booking is cancelled: "Book again"
 * past      the visit has passed or the link has expired
 */
export type BookingLinkState = 'open' | 'late' | 'cancelled' | 'past'

export interface BookingLinkInput {
  status: string
  startAt: string
  linkExpiresAt: string
  cancelWindowHours: number
  now?: number
}

export function bookingLinkState({
  status,
  startAt,
  linkExpiresAt,
  cancelWindowHours,
  now = Date.now()
}: BookingLinkInput): BookingLinkState {
  if (Date.parse(linkExpiresAt) <= now) return 'past'
  if (status === 'cancelled') return 'cancelled'

  const start = Date.parse(startAt)
  if ((status !== 'pending' && status !== 'confirmed') || start <= now) return 'past'

  return now > cancelDeadline(startAt, cancelWindowHours) ? 'late' : 'open'
}

/** Last moment (ms) the client can still cancel or move the booking online. */
export function cancelDeadline(startAt: string, cancelWindowHours: number) {
  return Date.parse(startAt) - cancelWindowHours * 3_600_000
}
