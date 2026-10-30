// Shape-compatible with `supabase gen types typescript`. Hand-written for Phase 1
// because no database was reachable when it was authored. Regenerate with
// `npm run db:types` once a Supabase project (or `supabase start`) is available.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: number;
          metadata: Json;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      languages: {
        Row: {
          code: string;
          is_active: boolean;
          name: string;
          native_name: string | null;
          sort_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profile_preferences: {
        Row: {
          age_max: number;
          age_min: number;
          chronotype: Database["public"]["Enums"]["chronotype"] | null;
          conversation_depth: Database["public"]["Enums"]["conversation_depth"] | null;
          dating_genders: Database["public"]["Enums"]["gender"][];
          group_size: Database["public"]["Enums"]["group_size_pref"] | null;
          intent: Database["public"]["Enums"]["connection_intent"] | null;
          message_frequency: Database["public"]["Enums"]["message_frequency"] | null;
          multilingual_ok: boolean;
          planning_style: Database["public"]["Enums"]["planning_style"] | null;
          social_energy: Database["public"]["Enums"]["social_energy"] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: never;
        Update: {
          age_max?: number;
          age_min?: number;
          chronotype?: Database["public"]["Enums"]["chronotype"] | null;
          conversation_depth?: Database["public"]["Enums"]["conversation_depth"] | null;
          dating_genders?: Database["public"]["Enums"]["gender"][];
          group_size?: Database["public"]["Enums"]["group_size_pref"] | null;
          intent?: Database["public"]["Enums"]["connection_intent"] | null;
          message_frequency?: Database["public"]["Enums"]["message_frequency"] | null;
          multilingual_ok?: boolean;
          planning_style?: Database["public"]["Enums"]["planning_style"] | null;
          social_energy?: Database["public"]["Enums"]["social_energy"] | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          adult_attested_at: string;
          created_at: string;
          date_of_birth: string;
          gender: Database["public"]["Enums"]["gender"] | null;
          gender_self_description: string | null;
          id: string;
          nickname: string | null;
          onboarding_completed_at: string | null;
          onboarding_step: number;
          terms_accepted_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: {
          gender?: Database["public"]["Enums"]["gender"] | null;
          gender_self_description?: string | null;
          nickname?: string | null;
          onboarding_step?: number;
        };
        Relationships: [];
      };
      user_languages: {
        Row: {
          created_at: string;
          language_code: string;
          prefers_chatting: boolean;
          proficiency: Database["public"]["Enums"]["language_proficiency"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          language_code: string;
          prefers_chatting?: boolean;
          proficiency: Database["public"]["Enums"]["language_proficiency"];
          user_id: string;
        };
        Update: {
          language_code?: string;
          prefers_chatting?: boolean;
          proficiency?: Database["public"]["Enums"]["language_proficiency"];
        };
        Relationships: [
          {
            foreignKeyName: "user_languages_language_code_fkey";
            columns: ["language_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      user_privacy_settings: {
        Row: {
          discoverable: boolean;
          discovery_paused: boolean;
          hide_from_local: boolean;
          show_area_label: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: never;
        Update: {
          discoverable?: boolean;
          discovery_paused?: boolean;
          hide_from_local?: boolean;
          show_area_label?: boolean;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      complete_onboarding: { Args: never; Returns: string };
      has_role: { Args: { required: Database["public"]["Enums"]["app_role"] }; Returns: boolean };
      set_my_languages: { Args: { langs: Json; multilingual: boolean }; Returns: undefined };
    };
    Enums: {
      account_status: "active" | "suspended" | "banned";
      app_role: "admin" | "moderator";
      chronotype: "morning" | "night" | "flexible";
      connection_intent: "dating" | "friendship" | "both" | "communities";
      conversation_depth: "deep" | "light" | "both";
      gender: "woman" | "man" | "non_binary" | "other";
      group_size_pref: "one_on_one" | "small_group" | "large_group" | "any";
      language_proficiency: "native" | "fluent" | "conversational" | "learning";
      message_frequency: "often" | "daily" | "relaxed";
      planning_style: "spontaneous" | "organised" | "mix";
      social_energy: "introvert" | "ambivert" | "extrovert";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
