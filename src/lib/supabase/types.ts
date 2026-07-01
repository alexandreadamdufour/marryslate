export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
          wedding_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_amount: number | null
          category: string
          created_at: string | null
          estimated_amount: number | null
          id: string
          name: string
          notes: string | null
          paid_amount: number | null
          vendor: string | null
          wedding_id: string | null
        }
        Insert: {
          actual_amount?: number | null
          category: string
          created_at?: string | null
          estimated_amount?: number | null
          id?: string
          name: string
          notes?: string | null
          paid_amount?: number | null
          vendor?: string | null
          wedding_id?: string | null
        }
        Update: {
          actual_amount?: number | null
          category?: string
          created_at?: string | null
          estimated_amount?: number | null
          id?: string
          name?: string
          notes?: string | null
          paid_amount?: number | null
          vendor?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          title: string
          wedding_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title: string
          wedding_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          contributor_photo_url: string | null
          created_at: string
          fee_amount: number
          gift_id: string | null
          gross_amount: number
          guest_email: string | null
          guest_message: string | null
          guest_name: string
          id: string
          is_anonymous: boolean
          mangopay_payment_id: string | null
          net_amount: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
          wedding_id: string
        }
        Insert: {
          contributor_photo_url?: string | null
          created_at?: string
          fee_amount: number
          gift_id?: string | null
          gross_amount: number
          guest_email?: string | null
          guest_message?: string | null
          guest_name: string
          id?: string
          is_anonymous?: boolean
          mangopay_payment_id?: string | null
          net_amount: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          wedding_id: string
        }
        Update: {
          contributor_photo_url?: string | null
          created_at?: string
          fee_amount?: number
          gift_id?: string | null
          gross_amount?: number
          guest_email?: string | null
          guest_message?: string | null
          guest_name?: string
          id?: string
          is_anonymous?: boolean
          mangopay_payment_id?: string | null
          net_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          category: string | null
          created_at: string
          current_amount: number
          description: string | null
          external_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          position: number
          target_amount: number
          title: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_amount?: number
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          target_amount: number
          title: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_amount?: number
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          target_amount?: number
          title?: string
          updated_at?: string
          wedding_id?: string
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
      guestbook_messages: {
        Row: {
          author_name: string
          created_at: string
          id: string
          is_visible: boolean
          message: string
          wedding_id: string
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          is_visible?: boolean
          message: string
          wedding_id: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          message?: string
          wedding_id?: string
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
      guests: {
        Row: {
          created_at: string
          dietary: string | null
          email: string | null
          first_name: string | null
          group_name: string | null
          id: string
          invitation_sent: boolean | null
          last_name: string | null
          notes: string | null
          phone: string | null
          plus_one: boolean | null
          plus_one_name: string | null
          rsvp_status: string
          rsvp_token: string
          side: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          dietary?: string | null
          email?: string | null
          first_name?: string | null
          group_name?: string | null
          id?: string
          invitation_sent?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          plus_one?: boolean | null
          plus_one_name?: string | null
          rsvp_status?: string
          rsvp_token?: string
          side?: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          dietary?: string | null
          email?: string | null
          first_name?: string | null
          group_name?: string | null
          id?: string
          invitation_sent?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          plus_one?: boolean | null
          plus_one_name?: string | null
          rsvp_status?: string
          rsvp_token?: string
          side?: string
          updated_at?: string
          wedding_id?: string
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
      rsvp_responses: {
        Row: {
          attending: boolean
          conflict_resolved_at: string | null
          created_at: string | null
          dietary: string | null
          email: string | null
          first_name: string
          guest_count: number | null
          guest_id: string | null
          id: string
          last_name: string
          message: string | null
          status: string
          wedding_id: string
        }
        Insert: {
          attending?: boolean
          conflict_resolved_at?: string | null
          created_at?: string | null
          dietary?: string | null
          email?: string | null
          first_name: string
          guest_count?: number | null
          guest_id?: string | null
          id?: string
          last_name: string
          message?: string | null
          status?: string
          wedding_id: string
        }
        Update: {
          attending?: boolean
          conflict_resolved_at?: string | null
          created_at?: string | null
          dietary?: string | null
          email?: string | null
          first_name?: string
          guest_count?: number | null
          guest_id?: string | null
          id?: string
          last_name?: string
          message?: string | null
          status?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_responses_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      seating_assignments: {
        Row: {
          created_at: string | null
          guest_id: string | null
          id: string
          table_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          table_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seating_assignments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_assignments_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "seating_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      seating_tables: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          name: string
          position_x: number | null
          position_y: number | null
          shape: string | null
          wedding_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          name: string
          position_x?: number | null
          position_y?: number | null
          shape?: string | null
          wedding_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          name?: string
          position_x?: number | null
          position_y?: number | null
          shape?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seating_tables_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_user_id: string
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          mangopay_user_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_account_id: string | null
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          mangopay_user_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          mangopay_user_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wedding_coowners: {
        Row: {
          created_at: string
          user_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_coowners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_coowners_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_events: {
        Row: {
          created_at: string
          description: string | null
          dress_code: string | null
          end_at: string | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          position: number
          start_at: string | null
          title: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dress_code?: string | null
          end_at?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          position?: number
          start_at?: string | null
          title: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dress_code?: string | null
          end_at?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          position?: number
          start_at?: string | null
          title?: string
          updated_at?: string
          wedding_id?: string
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
      wedding_timeline: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          position: number | null
          time: string
          title: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          position?: number | null
          time: string
          title: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          position?: number | null
          time?: string
          title?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_timeline_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          access_code: string | null
          access_code_enabled: boolean | null
          cover_image_url: string | null
          created_at: string
          font_family: string | null
          id: string
          is_published: boolean
          notifications_enabled: boolean | null
          owner_id: string
          partner1_first_name: string
          partner2_first_name: string
          practical_info: Json | null
          primary_color: string | null
          rsvp_enabled: boolean | null
          slug: string
          story_images: Json | null
          story_md: string | null
          story_title: string | null
          stripe_account_id: string | null
          theme_id: string
          updated_at: string
          view_count: number | null
          wedding_date: string | null
        }
        Insert: {
          access_code?: string | null
          access_code_enabled?: boolean | null
          cover_image_url?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          is_published?: boolean
          notifications_enabled?: boolean | null
          owner_id: string
          partner1_first_name: string
          partner2_first_name: string
          practical_info?: Json | null
          primary_color?: string | null
          rsvp_enabled?: boolean | null
          slug: string
          story_images?: Json | null
          story_md?: string | null
          story_title?: string | null
          stripe_account_id?: string | null
          theme_id?: string
          updated_at?: string
          view_count?: number | null
          wedding_date?: string | null
        }
        Update: {
          access_code?: string | null
          access_code_enabled?: boolean | null
          cover_image_url?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          is_published?: boolean
          notifications_enabled?: boolean | null
          owner_id?: string
          partner1_first_name?: string
          partner2_first_name?: string
          practical_info?: Json | null
          primary_color?: string | null
          rsvp_enabled?: boolean | null
          slug?: string
          story_images?: Json | null
          story_md?: string | null
          story_title?: string | null
          stripe_account_id?: string | null
          theme_id?: string
          updated_at?: string
          view_count?: number | null
          wedding_date?: string | null
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
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          iban_last4: string | null
          id: string
          mangopay_payout_id: string | null
          processed_at: string | null
          requested_at: string
          status: string
          stripe_payout_id: string | null
          updated_at: string
          wedding_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          iban_last4?: string | null
          id?: string
          mangopay_payout_id?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
          wedding_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          iban_last4?: string | null
          id?: string
          mangopay_payout_id?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
          wedding_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clerk_user_id: { Args: never; Returns: string }
      current_user_id: { Args: never; Returns: string }
      is_wedding_coowner: { Args: { p_wedding_id: string }; Returns: boolean }
    }
    Enums: {
      kyc_status: "not_started" | "pending" | "validated" | "rejected"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      user_role: "couple" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      kyc_status: ["not_started", "pending", "validated", "rejected"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      user_role: ["couple", "admin"],
    },
  },
} as const
