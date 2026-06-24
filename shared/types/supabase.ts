export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string
          created_at: string
          duration: number
          id: string
          notes: string | null
          price: number | null
          service_ids: string[]
          source: string
          start_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duration: number
          id?: string
          notes?: string | null
          price?: number | null
          service_ids?: string[]
          source?: string
          start_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          price?: number | null
          service_ids?: string[]
          source?: string
          start_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'client'
            referencedColumns: ['id']
          }
        ]
      }
      availability: {
        Row: {
          day_of_week: number | null
          end_time: string
          id: string
          master_id: string
          slot_duration: number
          specific_date: string | null
          start_time: string
        }
        Insert: {
          day_of_week?: number | null
          end_time: string
          id?: string
          master_id: string
          slot_duration?: number
          specific_date?: string | null
          start_time: string
        }
        Update: {
          day_of_week?: number | null
          end_time?: string
          id?: string
          master_id?: string
          slot_duration?: number
          specific_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: 'availability_master_id_fkey'
            columns: ['master_id']
            isOneToOne: false
            referencedRelation: 'master_profile'
            referencedColumns: ['id']
          }
        ]
      }
      bookings: {
        Row: {
          client_name: string | null
          client_phone: string
          created_at: string
          ends_at: string
          id: string
          master_id: string
          note: string | null
          service_ids: string[]
          starts_at: string
          status: string
        }
        Insert: {
          client_name?: string | null
          client_phone: string
          created_at?: string
          ends_at: string
          id?: string
          master_id: string
          note?: string | null
          service_ids: string[]
          starts_at: string
          status?: string
        }
        Update: {
          client_name?: string | null
          client_phone?: string
          created_at?: string
          ends_at?: string
          id?: string
          master_id?: string
          note?: string | null
          service_ids?: string[]
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_master_id_fkey'
            columns: ['master_id']
            isOneToOne: false
            referencedRelation: 'master_profile'
            referencedColumns: ['id']
          }
        ]
      }
      client: {
        Row: {
          birthday: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          notes: string | null
          phone: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      master_profile: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          can_travel: boolean
          city: string | null
          contact_email: string | null
          country: string
          created_at: string
          first_name: string
          house_number: string | null
          id: string
          instagram: string | null
          last_name: string
          phone: string
          place_id: string | null
          schedule: Json
          specializations: string[]
          telegram: string | null
          tiktok: string | null
          user_id: string
          username: string
          whatsapp: string | null
          works_at_place: boolean
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_travel?: boolean
          city?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          first_name: string
          house_number?: string | null
          id?: string
          instagram?: string | null
          last_name: string
          phone: string
          place_id?: string | null
          schedule: Json
          specializations: string[]
          telegram?: string | null
          tiktok?: string | null
          user_id: string
          username: string
          whatsapp?: string | null
          works_at_place?: boolean
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_travel?: boolean
          city?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          first_name?: string
          house_number?: string | null
          id?: string
          instagram?: string | null
          last_name?: string
          phone?: string
          place_id?: string | null
          schedule?: Json
          specializations?: string[]
          telegram?: string | null
          tiktok?: string | null
          user_id?: string
          username?: string
          whatsapp?: string | null
          works_at_place?: boolean
          zip_code?: string | null
        }
        Relationships: []
      }
      master_settings: {
        Row: {
          booking_buffer_minutes: number
          booking_default_status: string
          booking_min_notice_minutes: number
          calendar_first_day: number
          calendar_slot_step_minutes: number
          created_at: string
          currency: string
          date_format: string
          default_calendar_view: string
          id: string
          language: string
          online_booking_enabled: boolean
          theme: string
          time_format: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_buffer_minutes?: number
          booking_default_status?: string
          booking_min_notice_minutes?: number
          calendar_first_day?: number
          calendar_slot_step_minutes?: number
          created_at?: string
          currency?: string
          date_format?: string
          default_calendar_view?: string
          id?: string
          language?: string
          online_booking_enabled?: boolean
          theme?: string
          time_format?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_buffer_minutes?: number
          booking_default_status?: string
          booking_min_notice_minutes?: number
          calendar_first_day?: number
          calendar_slot_step_minutes?: number
          created_at?: string
          currency?: string
          date_format?: string
          default_calendar_view?: string
          id?: string
          language?: string
          online_booking_enabled?: boolean
          theme?: string
          time_format?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used?: boolean
        }
        Relationships: []
      }
      service: {
        Row: {
          category_id: string | null
          color: string
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'service_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'service_category'
            referencedColumns: ['id']
          }
        ]
      }
      service_category: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      time_block: {
        Row: {
          all_day: boolean
          created_at: string
          end_at: string
          id: string
          notes: string | null
          start_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          end_at: string
          id?: string
          notes?: string | null
          start_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          end_at?: string
          id?: string
          notes?: string | null
          start_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      create_appointment_from_booking: {
        Args: {
          p_first_name?: string
          p_last_name?: string
          p_note?: string
          p_phone: string
          p_service_ids: string[]
          p_starts_at: string
          p_username: string
        }
        Returns: Json
      }
      create_booking: {
        Args: {
          p_note?: string
          p_phone: string
          p_service_ids: string[]
          p_starts_at: string
          p_username: string
        }
        Returns: Json
      }
      find_client_name_by_phone: {
        Args: { master_user_id: string; phone: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {}
  }
} as const
