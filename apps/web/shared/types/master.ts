import type { MasterPageTheme } from '../utils/masterTheme'

export interface MasterProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  username: string
  specializations: string[]
  city: string | null
  address: string | null
  house_number: string | null
  zip_code: string | null
  country: string
  works_at_place: boolean
  can_travel: boolean
  avatar_url: string | null
  bio: string | null
  whatsapp: string | null
  telegram: string | null
  instagram: string | null
  tiktok: string | null
  contact_email: string | null
  /** Page poster (public URL), shown above the avatar */
  cover_url: string | null
  experience_years: number | null
  show_visits_count: boolean
  /** Link for the "Map" button */
  map_url: string | null
  /** "Verified master" badge, set by Seene */
  is_verified: boolean
}

export type MasterLanguage = 'en' | 'fr' | 'ru'
export type MasterTimeFormat = 12 | 24
export type BookingDefaultStatus = 'pending' | 'confirmed'

/**
 * Master preferences configured in the dashboard (master.seene) and consumed
 * by the public site. Sourced from the `master_settings` table, always resolved
 * to safe defaults by the API so consumers never deal with a missing row.
 */
export interface MasterSettings {
  language: MasterLanguage
  currency: string
  time_format: MasterTimeFormat
  date_format: string
  online_booking_enabled: boolean
  booking_default_status: BookingDefaultStatus
  booking_buffer_minutes: number
  booking_min_notice_minutes: number
  calendar_slot_step_minutes: number
  /** Theme of the public page */
  page_theme: MasterPageTheme
  /** Accent preset key or '#RRGGBB' (see `shared/utils/masterTheme.ts`) */
  page_accent: string
  /** How many days ahead clients can book */
  booking_horizon_days: number
  /** Up to how many hours before the visit a client can cancel by link */
  cancel_window_hours: number
  /** Vacation dates (YYYY-MM-DD), inclusive; online booking is paused */
  vacation_from: string | null
  vacation_until: string | null
}

export interface ServiceCategory {
  id: string
  name: string
  sort_order: number
}

export interface MasterService {
  id: string
  category_id: string | null
  name: string
  description: string | null
  duration: number
  price: string | number
  color: string
  sort_order: number
  photo_url: string | null
  /** Show the price as "from <price>" */
  price_from: boolean
  /** false: listed on the page but not bookable online */
  show_online: boolean
}

/** A photo in the "Works" block, optionally captioned by a service. */
export interface PortfolioItem {
  id: string
  photo_url: string
  service_id: string | null
  sort_order: number
}

export type PaymentTypeKind = 'cash' | 'card' | 'custom'

/**
 * A payment method the master accepts, configured in the dashboard
 * (`payment_type` table). System methods (cash/card) are labeled via i18n on
 * the client; custom methods display their own `name`.
 */
export interface MasterPaymentType {
  id: string
  kind: PaymentTypeKind
  name: string
  color: string
}

export interface MasterPageData {
  profile: MasterProfile
  settings: MasterSettings
  categories: ServiceCategory[]
  services: MasterService[]
  payment_types: MasterPaymentType[]
  portfolio: PortfolioItem[]
}

export interface MasterServiceGroup {
  category: ServiceCategory | null
  items: MasterService[]
}
