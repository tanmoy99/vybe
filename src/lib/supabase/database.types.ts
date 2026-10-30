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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      interest_categories: {
        Row: {
          created_at: string
          description: string | null
          hue: string
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          world_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hue?: string
          id?: number
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          world_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hue?: string
          id?: number
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          world_name?: string
        }
        Relationships: []
      }
      interest_options: {
        Row: {
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          subcategory_id: number
        }
        Insert: {
          id?: number
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          subcategory_id: number
        }
        Update: {
          id?: number
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          subcategory_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "interest_options_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "interest_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_subcategories: {
        Row: {
          category_id: number
          default_visibility: Database["public"]["Enums"]["interest_visibility"]
          id: number
          is_active: boolean
          kind: Database["public"]["Enums"]["subcategory_kind"]
          name: string
          prompt: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: number
          default_visibility?: Database["public"]["Enums"]["interest_visibility"]
          id?: number
          is_active?: boolean
          kind?: Database["public"]["Enums"]["subcategory_kind"]
          name: string
          prompt?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: number
          default_visibility?: Database["public"]["Enums"]["interest_visibility"]
          id?: number
          is_active?: boolean
          kind?: Database["public"]["Enums"]["subcategory_kind"]
          name?: string
          prompt?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "interest_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          is_active: boolean
          name: string
          native_name: string | null
          sort_order: number
        }
        Insert: {
          code: string
          is_active?: boolean
          name: string
          native_name?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          is_active?: boolean
          name?: string
          native_name?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      profile_preferences: {
        Row: {
          age_max: number
          age_min: number
          chronotype: Database["public"]["Enums"]["chronotype"] | null
          conversation_depth:
            | Database["public"]["Enums"]["conversation_depth"]
            | null
          dating_genders: Database["public"]["Enums"]["gender"][]
          group_size: Database["public"]["Enums"]["group_size_pref"] | null
          intent: Database["public"]["Enums"]["connection_intent"] | null
          message_frequency:
            | Database["public"]["Enums"]["message_frequency"]
            | null
          multilingual_ok: boolean
          planning_style: Database["public"]["Enums"]["planning_style"] | null
          social_energy: Database["public"]["Enums"]["social_energy"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_max?: number
          age_min?: number
          chronotype?: Database["public"]["Enums"]["chronotype"] | null
          conversation_depth?:
            | Database["public"]["Enums"]["conversation_depth"]
            | null
          dating_genders?: Database["public"]["Enums"]["gender"][]
          group_size?: Database["public"]["Enums"]["group_size_pref"] | null
          intent?: Database["public"]["Enums"]["connection_intent"] | null
          message_frequency?:
            | Database["public"]["Enums"]["message_frequency"]
            | null
          multilingual_ok?: boolean
          planning_style?: Database["public"]["Enums"]["planning_style"] | null
          social_energy?: Database["public"]["Enums"]["social_energy"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_max?: number
          age_min?: number
          chronotype?: Database["public"]["Enums"]["chronotype"] | null
          conversation_depth?:
            | Database["public"]["Enums"]["conversation_depth"]
            | null
          dating_genders?: Database["public"]["Enums"]["gender"][]
          group_size?: Database["public"]["Enums"]["group_size_pref"] | null
          intent?: Database["public"]["Enums"]["connection_intent"] | null
          message_frequency?:
            | Database["public"]["Enums"]["message_frequency"]
            | null
          multilingual_ok?: boolean
          planning_style?: Database["public"]["Enums"]["planning_style"] | null
          social_energy?: Database["public"]["Enums"]["social_energy"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          adult_attested_at: string
          created_at: string
          date_of_birth: string
          gender: Database["public"]["Enums"]["gender"] | null
          gender_self_description: string | null
          id: string
          nickname: string | null
          onboarding_completed_at: string | null
          onboarding_step: number
          terms_accepted_at: string
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          adult_attested_at: string
          created_at?: string
          date_of_birth: string
          gender?: Database["public"]["Enums"]["gender"] | null
          gender_self_description?: string | null
          id: string
          nickname?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          terms_accepted_at: string
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          adult_attested_at?: string
          created_at?: string
          date_of_birth?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          gender_self_description?: string | null
          id?: string
          nickname?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          terms_accepted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_interest_details: {
        Row: {
          details: string
          subcategory_id: number
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["interest_visibility"]
        }
        Insert: {
          details: string
          subcategory_id: number
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["interest_visibility"]
        }
        Update: {
          details?: string
          subcategory_id?: number
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["interest_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "user_interest_details_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "interest_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interest_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          intensity: number
          option_id: number
          user_id: string
          visibility: Database["public"]["Enums"]["interest_visibility"]
        }
        Insert: {
          created_at?: string
          intensity?: number
          option_id: number
          user_id: string
          visibility?: Database["public"]["Enums"]["interest_visibility"]
        }
        Update: {
          created_at?: string
          intensity?: number
          option_id?: number
          user_id?: string
          visibility?: Database["public"]["Enums"]["interest_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "interest_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_languages: {
        Row: {
          created_at: string
          language_code: string
          prefers_chatting: boolean
          proficiency: Database["public"]["Enums"]["language_proficiency"]
          user_id: string
        }
        Insert: {
          created_at?: string
          language_code: string
          prefers_chatting?: boolean
          proficiency: Database["public"]["Enums"]["language_proficiency"]
          user_id: string
        }
        Update: {
          created_at?: string
          language_code?: string
          prefers_chatting?: boolean
          proficiency?: Database["public"]["Enums"]["language_proficiency"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_languages_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_languages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_privacy_settings: {
        Row: {
          discoverable: boolean
          discovery_paused: boolean
          hide_from_local: boolean
          show_area_label: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          discoverable?: boolean
          discovery_paused?: boolean
          hide_from_local?: boolean
          show_area_label?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          discoverable?: boolean
          discovery_paused?: boolean
          hide_from_local?: boolean
          show_area_label?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      age_in_years: { Args: { dob: string }; Returns: number }
      complete_onboarding: { Args: never; Returns: string }
      has_role: {
        Args: { required: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      set_my_category_interests: {
        Args: {
          choices: Json
          details: Json
          p_category_id: number
          visibility: Json
        }
        Returns: undefined
      }
      set_my_languages: {
        Args: { langs: Json; multilingual: boolean }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "banned"
      app_role: "admin" | "moderator"
      chronotype: "morning" | "night" | "flexible"
      connection_intent: "dating" | "friendship" | "both" | "communities"
      conversation_depth: "deep" | "light" | "both"
      gender: "woman" | "man" | "non_binary" | "other"
      group_size_pref: "one_on_one" | "small_group" | "large_group" | "any"
      interest_visibility: "public" | "matching_only" | "private"
      language_proficiency: "native" | "fluent" | "conversational" | "learning"
      message_frequency: "often" | "daily" | "relaxed"
      planning_style: "spontaneous" | "organised" | "mix"
      social_energy: "introvert" | "ambivert" | "extrovert"
      subcategory_kind: "multi" | "single" | "text"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["active", "suspended", "banned"],
      app_role: ["admin", "moderator"],
      chronotype: ["morning", "night", "flexible"],
      connection_intent: ["dating", "friendship", "both", "communities"],
      conversation_depth: ["deep", "light", "both"],
      gender: ["woman", "man", "non_binary", "other"],
      group_size_pref: ["one_on_one", "small_group", "large_group", "any"],
      interest_visibility: ["public", "matching_only", "private"],
      language_proficiency: ["native", "fluent", "conversational", "learning"],
      message_frequency: ["often", "daily", "relaxed"],
      planning_style: ["spontaneous", "organised", "mix"],
      social_energy: ["introvert", "ambivert", "extrovert"],
      subcategory_kind: ["multi", "single", "text"],
    },
  },
} as const
