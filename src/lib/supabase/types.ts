// AUTO-GENERATED — ne pas éditer manuellement en temps normal.
// Exception : colonnes Stripe ajoutées manuellement (migration 20260624140000) car Docker non disponible.
// Régénérer dès que possible : pnpm supabase gen types typescript --local > src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = "couple" | "admin"
export type KycStatus = "not_started" | "pending" | "validated" | "rejected"
export type WeddingSide = "partner1" | "partner2" | "both"
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"
export type RsvpStatus = "pending" | "accepted" | "declined" | "maybe"
export type WithdrawalStatus = "pending" | "processing" | "succeeded" | "failed"

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          display_name: string | null
          role: UserRole
          mangopay_user_id: string | null
          stripe_account_id: string | null
          kyc_status: KycStatus
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email: string
          display_name?: string | null
          role?: UserRole
          mangopay_user_id?: string | null
          stripe_account_id?: string | null
          kyc_status?: KycStatus
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string
          display_name?: string | null
          role?: UserRole
          mangopay_user_id?: string | null
          stripe_account_id?: string | null
          kyc_status?: KycStatus
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      weddings: {
        Row: {
          id: string
          owner_id: string
          partner1_first_name: string
          partner2_first_name: string
          wedding_date: string | null
          slug: string
          cover_image_url: string | null
          theme_id: string
          primary_color: string | null
          story_md: string | null
          is_published: boolean
          rsvp_enabled: boolean
          mangopay_wallet_id: string | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          partner1_first_name: string
          partner2_first_name: string
          wedding_date?: string | null
          slug: string
          cover_image_url?: string | null
          theme_id?: string
          primary_color?: string | null
          story_md?: string | null
          is_published?: boolean
          rsvp_enabled?: boolean
          mangopay_wallet_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          owner_id?: string
          partner1_first_name?: string
          partner2_first_name?: string
          wedding_date?: string | null
          slug?: string
          cover_image_url?: string | null
          theme_id?: string
          primary_color?: string | null
          story_md?: string | null
          is_published?: boolean
          rsvp_enabled?: boolean
          mangopay_wallet_id?: string | null
          stripe_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weddings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_coowners: {
        Row: {
          wedding_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          wedding_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          wedding_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_coowners_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_coowners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          id: string
          wedding_id: string
          title: string
          description: string | null
          image_url: string | null
          target_amount: number
          current_amount: number
          category: string | null
          external_url: string | null
          is_active: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          title: string
          description?: string | null
          image_url?: string | null
          target_amount: number
          current_amount?: number
          category?: string | null
          external_url?: string | null
          is_active?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          wedding_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          target_amount?: number
          current_amount?: number
          category?: string | null
          external_url?: string | null
          is_active?: boolean
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          id: string
          wedding_id: string
          gift_id: string | null
          guest_name: string
          guest_email: string | null
          guest_message: string | null
          gross_amount: number
          fee_amount: number
          net_amount: number
          mangopay_payment_id: string | null
          stripe_payment_intent_id: string | null
          payment_status: PaymentStatus
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          gift_id?: string | null
          guest_name: string
          guest_email?: string | null
          guest_message?: string | null
          gross_amount: number
          fee_amount: number
          net_amount: number
          mangopay_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          payment_status?: PaymentStatus
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          gift_id?: string | null
          guest_name?: string
          guest_email?: string | null
          guest_message?: string | null
          gross_amount?: number
          fee_amount?: number
          net_amount?: number
          mangopay_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          payment_status?: PaymentStatus
          is_anonymous?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_events: {
        Row: {
          id: string
          wedding_id: string
          title: string
          start_at: string | null
          end_at: string | null
          location_name: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          dress_code: string | null
          description: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          title: string
          start_at?: string | null
          end_at?: string | null
          location_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          dress_code?: string | null
          description?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          start_at?: string | null
          end_at?: string | null
          location_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          dress_code?: string | null
          description?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          id: string
          wedding_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          group_name: string | null
          side: WeddingSide
          rsvp_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          group_name?: string | null
          side?: WeddingSide
          rsvp_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          group_name?: string | null
          side?: WeddingSide
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_rsvps: {
        Row: {
          guest_id: string
          event_id: string
          status: RsvpStatus
          guests_count: number
          dietary_restrictions: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          guest_id: string
          event_id: string
          status?: RsvpStatus
          guests_count?: number
          dietary_restrictions?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: RsvpStatus
          guests_count?: number
          dietary_restrictions?: string | null
          responded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          id: string
          wedding_id: string
          amount: number
          iban_last4: string | null
          mangopay_payout_id: string | null
          stripe_payout_id: string | null
          status: WithdrawalStatus
          requested_at: string
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          amount: number
          iban_last4?: string | null
          mangopay_payout_id?: string | null
          stripe_payout_id?: string | null
          status?: WithdrawalStatus
          requested_at?: string
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          iban_last4?: string | null
          mangopay_payout_id?: string | null
          stripe_payout_id?: string | null
          status?: WithdrawalStatus
          processed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook_messages: {
        Row: {
          id: string
          wedding_id: string
          author_name: string
          message: string
          is_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          author_name: string
          message: string
          is_visible?: boolean
          created_at?: string
        }
        Update: {
          author_name?: string
          message?: string
          is_visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_responses: {
        Row: {
          id: string
          wedding_id: string
          first_name: string
          last_name: string
          email: string | null
          attending: boolean
          guest_count: number
          dietary: string | null
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          first_name: string
          last_name: string
          email?: string | null
          attending: boolean
          guest_count?: number
          dietary?: string | null
          message?: string | null
          created_at?: string
        }
        Update: {
          first_name?: string
          last_name?: string
          email?: string | null
          attending?: boolean
          guest_count?: number
          dietary?: string | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          wedding_id: string | null
          action: string
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wedding_id?: string | null
          action: string
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clerk_user_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      current_user_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      is_wedding_coowner: {
        Args: { p_wedding_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      kyc_status: KycStatus
      wedding_side: WeddingSide
      payment_status: PaymentStatus
      rsvp_status: RsvpStatus
      withdrawal_status: WithdrawalStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
