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
  price: string
  color: string
  sort_order: number
}

export interface MasterPageData {
  profile: MasterProfile
  categories: ServiceCategory[]
  services: MasterService[]
}

export interface MasterServiceGroup {
  category: ServiceCategory | null
  items: MasterService[]
}
