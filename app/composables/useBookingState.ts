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
  phone: string
  otpToken: string
  booking: BookingResult | null
}

export function useBookingState(username: string) {
  return useState<BookingState>(`booking:${username}`, () => ({
    step: 1,
    selectedServiceIds: [],
    selectedDate: null,
    selectedSlot: null,
    note: '',
    phone: '',
    otpToken: '',
    booking: null
  }))
}
