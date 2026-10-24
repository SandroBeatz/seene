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
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          created_at: string
          duration: number
          id: string
          notes: string | null
          price: number | null
          rescheduled_from: string | null
          service_ids: string[]
          source: string
          start_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id: string
          created_at?: string
          duration: number
          id?: string
          notes?: string | null
          price?: number | null
          rescheduled_from?: string | null
          service_ids?: string[]
          source?: string
          start_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          price?: number | null
          rescheduled_from?: string | null
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
          },
          {
            foreignKeyName: 'appointments_rescheduled_from_fkey'
            columns: ['rescheduled_from']
            isOneToOne: false
            referencedRelation: 'appointments'
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
      booking_link: {
        Row: {
          appointment_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_link_appointment_id_fkey'
            columns: ['appointment_id']
            isOneToOne: false
            referencedRelation: 'appointments'
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
          blocked: boolean
          created_at: string
          email: string | null
          emoji: string | null
          first_name: string
          id: string
          is_favorite: boolean
          last_name: string | null
          marketing_consent: boolean
          notes: string | null
          phone: string
          reminders_consent: boolean
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          blocked?: boolean
          created_at?: string
          email?: string | null
          emoji?: string | null
          first_name: string
          id?: string
          is_favorite?: boolean
          last_name?: string | null
          marketing_consent?: boolean
          notes?: string | null
          phone: string
          reminders_consent?: boolean
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          blocked?: boolean
          created_at?: string
          email?: string | null
          emoji?: string | null
          first_name?: string
          id?: string
          is_favorite?: boolean
          last_name?: string | null
          marketing_consent?: boolean
          notes?: string | null
          phone?: string
          reminders_consent?: boolean
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_device_token: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          master_user_id: string
          phone: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          master_user_id: string
          phone: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          master_user_id?: string
          phone?: string
          revoked_at?: string | null
          token_hash?: string
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
          cover_url: string | null
          created_at: string
          deactivated_at: string | null
          experience_years: number | null
          first_name: string
          house_number: string | null
          id: string
          instagram: string | null
          is_verified: boolean
          last_name: string
          map_url: string | null
          phone: string
          place_id: string | null
          schedule: Json
          show_visits_count: boolean
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
          cover_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          experience_years?: number | null
          first_name: string
          house_number?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean
          last_name: string
          map_url?: string | null
          phone: string
          place_id?: string | null
          schedule: Json
          show_visits_count?: boolean
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
          cover_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          experience_years?: number | null
          first_name?: string
          house_number?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean
          last_name?: string
          map_url?: string | null
          phone?: string
          place_id?: string | null
          schedule?: Json
          show_visits_count?: boolean
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
          alert_awaiting_confirmation_enabled: boolean
          alert_cancellation_enabled: boolean
          alert_new_booking_enabled: boolean
          alert_upcoming_appointment_enabled: boolean
          alert_upcoming_offset_minutes: number
          booking_buffer_minutes: number
          booking_default_status: string
          booking_horizon_days: number
          booking_min_notice_minutes: number
          calendar_first_day: number
          calendar_slot_step_minutes: number
          cancel_window_hours: number
          client_reminder_offsets_minutes: number[]
          client_reminder_whatsapp_enabled: boolean
          created_at: string
          currency: string
          date_format: string
          default_calendar_view: string
          id: string
          language: string
          online_booking_enabled: boolean
          page_accent: string
          page_theme: string
          theme: string
          time_format: number
          updated_at: string
          user_id: string
          vacation_from: string | null
          vacation_until: string | null
        }
        Insert: {
          alert_awaiting_confirmation_enabled?: boolean
          alert_cancellation_enabled?: boolean
          alert_new_booking_enabled?: boolean
          alert_upcoming_appointment_enabled?: boolean
          alert_upcoming_offset_minutes?: number
          booking_buffer_minutes?: number
          booking_default_status?: string
          booking_horizon_days?: number
          booking_min_notice_minutes?: number
          calendar_first_day?: number
          calendar_slot_step_minutes?: number
          cancel_window_hours?: number
          client_reminder_offsets_minutes?: number[]
          client_reminder_whatsapp_enabled?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          default_calendar_view?: string
          id?: string
          language?: string
          online_booking_enabled?: boolean
          page_accent?: string
          page_theme?: string
          theme?: string
          time_format?: number
          updated_at?: string
          user_id: string
          vacation_from?: string | null
          vacation_until?: string | null
        }
        Update: {
          alert_awaiting_confirmation_enabled?: boolean
          alert_cancellation_enabled?: boolean
          alert_new_booking_enabled?: boolean
          alert_upcoming_appointment_enabled?: boolean
          alert_upcoming_offset_minutes?: number
          booking_buffer_minutes?: number
          booking_default_status?: string
          booking_horizon_days?: number
          booking_min_notice_minutes?: number
          calendar_first_day?: number
          calendar_slot_step_minutes?: number
          cancel_window_hours?: number
          client_reminder_offsets_minutes?: number[]
          client_reminder_whatsapp_enabled?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          default_calendar_view?: string
          id?: string
          language?: string
          online_booking_enabled?: boolean
          page_accent?: string
          page_theme?: string
          theme?: string
          time_format?: number
          updated_at?: string
          user_id?: string
          vacation_from?: string | null
          vacation_until?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          channel: string | null
          code: string
          created_at: string
          expires_at: string
          id: string
          ip_hash: string | null
          phone: string
          used: boolean
        }
        Insert: {
          attempts?: number
          channel?: string | null
          code: string
          created_at?: string
          expires_at: string
          id?: string
          ip_hash?: string | null
          phone: string
          used?: boolean
        }
        Update: {
          attempts?: number
          channel?: string | null
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_hash?: string | null
          phone?: string
          used?: boolean
        }
        Relationships: []
      }
      payment_type: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          kind: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_verification: {
        Row: {
          phone: string
          verified_at: string
        }
        Insert: {
          phone: string
          verified_at?: string
        }
        Update: {
          phone?: string
          verified_at?: string
        }
        Relationships: []
      }
      portfolio_item: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          service_id: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          service_id?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          service_id?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'portfolio_item_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'service'
            referencedColumns: ['id']
          }
        ]
      }
      sale: {
        Row: {
          amount: number
          appointment_id: string
          client_id: string
          created_at: string
          id: string
          paid_at: string
          payment_type_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id: string
          client_id: string
          created_at?: string
          id?: string
          paid_at?: string
          payment_type_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          client_id?: string
          created_at?: string
          id?: string
          paid_at?: string
          payment_type_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sale_appointment_id_fkey'
            columns: ['appointment_id']
            isOneToOne: true
            referencedRelation: 'appointments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'client'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_payment_type_id_fkey'
            columns: ['payment_type_id']
            isOneToOne: false
            referencedRelation: 'payment_type'
            referencedColumns: ['id']
          }
        ]
      }
      sale_item: {
        Row: {
          id: string
          name_snapshot: string
          price_snapshot: number
          sale_id: string
          service_id: string | null
        }
        Insert: {
          id?: string
          name_snapshot: string
          price_snapshot: number
          sale_id: string
          service_id?: string | null
        }
        Update: {
          id?: string
          name_snapshot?: string
          price_snapshot?: number
          sale_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sale_item_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: false
            referencedRelation: 'sale'
            referencedColumns: ['id']
          }
        ]
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
          photo_url: string | null
          price: number
          price_from: boolean
          show_online: boolean
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
          photo_url?: string | null
          price: number
          price_from?: boolean
          show_online?: boolean
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
          photo_url?: string | null
          price?: number
          price_from?: boolean
          show_online?: boolean
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
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      slot_hold: {
        Row: {
          created_at: string
          end_at: string
          expires_at: string
          holder_hash: string
          id: string
          master_user_id: string
          start_at: string
        }
        Insert: {
          created_at?: string
          end_at: string
          expires_at: string
          holder_hash: string
          id?: string
          master_user_id: string
          start_at: string
        }
        Update: {
          created_at?: string
          end_at?: string
          expires_at?: string
          holder_hash?: string
          id?: string
          master_user_id?: string
          start_at?: string
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
      waitlist: {
        Row: {
          city: string | null
          contact: string
          country: string
          created_at: string
          id: string
          ip_country: string | null
          ip_hash: string | null
          locale: string
          name: string
          place: string | null
          specialty: string
        }
        Insert: {
          city?: string | null
          contact: string
          country: string
          created_at?: string
          id?: string
          ip_country?: string | null
          ip_hash?: string | null
          locale?: string
          name: string
          place?: string | null
          specialty: string
        }
        Update: {
          city?: string | null
          contact?: string
          country?: string
          created_at?: string
          id?: string
          ip_country?: string | null
          ip_hash?: string | null
          locale?: string
          name?: string
          place?: string | null
          specialty?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_period_metrics: {
        Args: { p_from: string; p_to: string; p_uid: string }
        Returns: Json
      }
      appointment_day_counts: {
        Args: { p_from: string; p_to: string; p_tz: string }
        Returns: {
          cnt: number
          day: string
        }[]
      }
      cancel_appointment_by_link: {
        Args: { p_reason?: string; p_token_hash: string }
        Returns: Json
      }
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      complete_appointment: {
        Args: {
          p_amount: number
          p_appointment_id: string
          p_items: Json
          p_payment_type_id: string
        }
        Returns: string
      }
      create_appointment_from_booking: {
        Args: {
          p_first_name?: string
          p_future_limit?: number
          p_holder_hash?: string
          p_last_name?: string
          p_link_hash?: string
          p_marketing_consent?: boolean
          p_note?: string
          p_phone: string
          p_reminders_consent?: boolean
          p_replaces_hash?: string
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
      get_analytics_v2: {
        Args: {
          p_from: string
          p_granularity?: string
          p_prev_from: string
          p_prev_to: string
          p_to: string
          p_tz?: string
        }
        Returns: Json
      }
      get_analytics_widgets_v2: {
        Args: {
          p_days_from: string
          p_days_to: string
          p_mix_from: string
          p_mix_to: string
          p_top_from: string
          p_top_to: string
          p_tz?: string
        }
        Returns: Json
      }
      hold_booking_slot: {
        Args: {
          p_duration: number
          p_holder_hash: string
          p_starts_at: string
          p_ttl_minutes?: number
          p_username: string
        }
        Returns: string
      }
      update_sale_details: {
        Args: { p_amount: number; p_items: Json; p_sale_id: string }
        Returns: undefined
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
