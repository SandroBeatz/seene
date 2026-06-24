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
}

export interface MasterPageData {
  profile: MasterProfile
  settings: MasterSettings
  categories: ServiceCategory[]
  services: MasterService[]
}

export interface MasterServiceGroup {
  category: ServiceCategory | null
  items: MasterService[]
}
