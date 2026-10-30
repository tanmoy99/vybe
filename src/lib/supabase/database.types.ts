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
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          note: string | null
          recipient_id: string
          responded_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["connection_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          recipient_id: string
          responded_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["connection_status"]
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          recipient_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          match_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          match_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_preferences: {
        Row: {
          max_tier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          max_tier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          max_tier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_requests: {
        Row: {
          created_at: string
          id: number
          mode: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          mode: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          mode?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      matches: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          kind: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          kind: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          kind?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          hidden_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          community_activity: boolean
          connection_requests: boolean
          messages: boolean
          new_matches: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          community_activity?: boolean
          connection_requests?: boolean
          messages?: boolean
          new_matches?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          community_activity?: boolean
          connection_requests?: boolean
          messages?: boolean
          new_matches?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      regions: {
        Row: {
          boundary: unknown
          code: string
          name: string
          source: string
        }
        Insert: {
          boundary: unknown
          code: string
          name: string
          source: string
        }
        Update: {
          boundary?: unknown
          code?: string
          name?: string
          source?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          snapshot: Json
          status: Database["public"]["Enums"]["report_status"]
          target_id: string | null
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string | null
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string | null
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suburb_change_log: {
        Row: {
          changed_at: string
          id: number
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: never
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suburb_change_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suburbs: {
        Row: {
          boundary: unknown
          centroid: unknown
          id: number
          name: string
          postcode: string | null
          region_code: string | null
          sal_code: string
          source: string
          state: string
        }
        Insert: {
          boundary?: unknown
          centroid: unknown
          id?: number
          name: string
          postcode?: string | null
          region_code?: string | null
          sal_code: string
          source?: string
          state: string
        }
        Update: {
          boundary?: unknown
          centroid?: unknown
          id?: number
          name?: string
          postcode?: string | null
          region_code?: string | null
          sal_code?: string
          source?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "suburbs_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
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
      user_location_preferences: {
        Row: {
          source: Database["public"]["Enums"]["location_source"]
          suburb_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          source?: Database["public"]["Enums"]["location_source"]
          suburb_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          source?: Database["public"]["Enums"]["location_source"]
          suburb_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_location_preferences_suburb_id_fkey"
            columns: ["suburb_id"]
            isOneToOne: false
            referencedRelation: "suburbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      _accept_request: { Args: { p_request: string }; Returns: string }
      _discovery_pool: {
        Args: { v: string }
        Returns: {
          age: number
          area_label: string
          candidate_id: string
          chronotype: Database["public"]["Enums"]["chronotype"]
          comm_score: number
          connection_kind: string
          conversation_depth: Database["public"]["Enums"]["conversation_depth"]
          highlights: Json
          intent: Database["public"]["Enums"]["connection_intent"]
          interest_score: number
          lang_score: number
          nickname: string
          planning_style: Database["public"]["Enums"]["planning_style"]
          proximity_tier: number
          score: number
          shared: Json
          shared_count: number
          shared_hidden_count: number
          shared_languages: string[]
          social_energy: Database["public"]["Enums"]["social_energy"]
        }[]
      }
      age_in_years: { Args: { dob: string }; Returns: number }
      block_user: { Args: { p_user: string }; Returns: undefined }
      can_i_message: { Args: { conv: string }; Returns: boolean }
      can_message: { Args: { conv: string; uid: string }; Returns: boolean }
      complete_onboarding: { Args: never; Returns: string }
      conversation_peer: {
        Args: { p_conversation: string }
        Returns: {
          can_message: boolean
          match_kind: string
          nickname: string
          person_id: string
        }[]
      }
      discover_candidates: {
        Args: {
          p_category?: string
          p_limit?: number
          p_mode?: string
          p_offset?: number
        }
        Returns: {
          age: number
          area_label: string
          candidate_id: string
          chronotype: Database["public"]["Enums"]["chronotype"]
          connection_kind: string
          conversation_depth: Database["public"]["Enums"]["conversation_depth"]
          highlights: Json
          intent: Database["public"]["Enums"]["connection_intent"]
          nickname: string
          planning_style: Database["public"]["Enums"]["planning_style"]
          proximity_tier: number
          shared: Json
          shared_count: number
          shared_hidden_count: number
          shared_languages: string[]
          social_energy: Database["public"]["Enums"]["social_energy"]
          wavelength: number
        }[]
      }
      has_role: {
        Args: { required: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      import_region: {
        Args: { geometry: Json; p_code: string; p_name: string }
        Returns: undefined
      }
      import_suburbs: {
        Args: { features: Json; p_state: string }
        Returns: number
      }
      is_blocked_pair: { Args: { a: string; b: string }; Returns: boolean }
      is_conversation_member: { Args: { conv: string }; Returns: boolean }
      is_discoverable: { Args: { uid: string }; Returns: boolean }
      my_connections: {
        Args: never
        Returns: {
          connection_type: string
          conversation_id: string
          created_at: string
          kind: string
          last_message: string
          last_message_at: string
          nickname: string
          note: string
          person_id: string
          request_id: string
          unread: number
        }[]
      }
      my_discovery_readiness: {
        Args: never
        Returns: {
          discoverable: boolean
          has_location: boolean
          intent: Database["public"]["Enums"]["connection_intent"]
          interest_count: number
          paused: boolean
        }[]
      }
      notify: {
        Args: {
          p_body: string
          p_kind: string
          p_link: string
          p_title: string
          p_user: string
        }
        Returns: undefined
      }
      report_content: {
        Args: {
          p_details?: string
          p_reason: string
          p_target_id: string
          p_target_type: string
        }
        Returns: string
      }
      respond_connection_request: {
        Args: { p_accept: boolean; p_request: string }
        Returns: string
      }
      send_connection_request: {
        Args: { p_kind?: string; p_note?: string; p_recipient: string }
        Returns: string
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
      suggest_suburb: {
        Args: { lat: number; lon: number }
        Returns: {
          id: number
          name: string
          state: string
        }[]
      }
      unblock_user: { Args: { p_user: string }; Returns: undefined }
      unmatch: { Args: { p_conversation: string }; Returns: undefined }
      withdraw_connection_request: {
        Args: { p_request: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "banned"
      app_role: "admin" | "moderator"
      chronotype: "morning" | "night" | "flexible"
      connection_intent: "dating" | "friendship" | "both" | "communities"
      connection_status: "pending" | "accepted" | "declined" | "withdrawn"
      conversation_depth: "deep" | "light" | "both"
      gender: "woman" | "man" | "non_binary" | "other"
      group_size_pref: "one_on_one" | "small_group" | "large_group" | "any"
      interest_visibility: "public" | "matching_only" | "private"
      language_proficiency: "native" | "fluent" | "conversational" | "learning"
      location_source: "manual" | "browser_suggested"
      message_frequency: "often" | "daily" | "relaxed"
      planning_style: "spontaneous" | "organised" | "mix"
      report_status: "open" | "reviewing" | "actioned" | "dismissed"
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
      connection_status: ["pending", "accepted", "declined", "withdrawn"],
      conversation_depth: ["deep", "light", "both"],
      gender: ["woman", "man", "non_binary", "other"],
      group_size_pref: ["one_on_one", "small_group", "large_group", "any"],
      interest_visibility: ["public", "matching_only", "private"],
      language_proficiency: ["native", "fluent", "conversational", "learning"],
      location_source: ["manual", "browser_suggested"],
      message_frequency: ["often", "daily", "relaxed"],
      planning_style: ["spontaneous", "organised", "mix"],
      report_status: ["open", "reviewing", "actioned", "dismissed"],
      social_energy: ["introvert", "ambivert", "extrovert"],
      subcategory_kind: ["multi", "single", "text"],
    },
  },
} as const
