export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          is_active: boolean
          last_login: string | null
          preferences: Json
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          is_active?: boolean
          last_login?: string | null
          preferences?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          is_active?: boolean
          last_login?: string | null
          preferences?: Json
        }
      }
      courts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          base_price: number
          price_multiplier: number
          features: string[]
          is_active: boolean
          operating_hours: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          base_price: number
          price_multiplier?: number
          features?: string[]
          is_active?: boolean
          operating_hours?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          base_price?: number
          price_multiplier?: number
          features?: string[]
          is_active?: boolean
          operating_hours?: Json
        }
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          court_id: string
          user_id: string
          booking_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          total_price: number
          deposit_amount: number
          status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
          payment_status: 'pending' | 'deposit_paid' | 'fully_paid'
          payment_method: 'cash' | 'bank_transfer' | 'card' | null
          notes: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          court_id: string
          user_id: string
          booking_date: string
          start_time: string
          end_time: string
          duration_minutes?: number
          total_price: number
          deposit_amount?: number
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'deposit_paid' | 'fully_paid'
          payment_method?: 'cash' | 'bank_transfer' | 'card' | null
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          court_id?: string
          user_id?: string
          booking_date?: string
          start_time?: string
          end_time?: string
          duration_minutes?: number
          total_price?: number
          deposit_amount?: number
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'deposit_paid' | 'fully_paid'
          payment_method?: 'cash' | 'bank_transfer' | 'card' | null
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
      }
      booking_players: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          booking_id: string
          player_name: string
          player_phone: string | null
          player_email: string | null
          has_paid: boolean
          paid_amount: number
          paid_at: string | null
          payment_method: 'cash' | 'bank_transfer' | 'card' | null
          position: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          booking_id: string
          player_name: string
          player_phone?: string | null
          player_email?: string | null
          has_paid?: boolean
          paid_amount?: number
          paid_at?: string | null
          payment_method?: 'cash' | 'bank_transfer' | 'card' | null
          position?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          booking_id?: string
          player_name?: string
          player_phone?: string | null
          player_email?: string | null
          has_paid?: boolean
          paid_amount?: number
          paid_at?: string | null
          payment_method?: 'cash' | 'bank_transfer' | 'card' | null
          position?: number | null
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
