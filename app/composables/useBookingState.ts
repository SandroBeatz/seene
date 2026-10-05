export interface BookingService {
  id: string
  category_id: string | null
  name: string
  description: string | null
  duration: number
  price: string | number
  color: string
  sort_order: number
}

export interface BookingMaster {
  first_name: string
  last_name: string
}

export interface BookingResult {
  id: string
  startsAt: string
  endsAt: string
  services: BookingService[]
  master: BookingMaster
}

export interface BookingState {
  step: 1 | 2 | 3 | 4
  selectedServiceIds: string[]
  selectedDate: string | null
  selectedSlot: string | null
  note: string
  /**
   * Canonical phone — digits only, no '+' ('996555123456'). Kept across bookings
   * so a returning client does not retype it.
   */
  phone: string
  booking: BookingResult | null
}

export function createBookingState(overrides: Partial<BookingState> = {}): BookingState {
  return {
    step: 1,
    selectedServiceIds: [],
    selectedDate: null,
    selectedSlot: null,
    note: '',
    phone: '',
    booking: null,
    ...overrides
  }
}

export function useBookingState(username: string) {
  const savedPhone = useSavedPhone()
  // Start with the phone remembered on this device (see useSavedPhone).
  return useState<BookingState>(`booking:${username}`, () =>
    createBookingState({ phone: savedPhone.read() })
  )
}
