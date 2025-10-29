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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          expires_at: string
          is_valid: boolean
          revoked_at: string | null
          revoked_by: string | null
          token: string
          token_id: string
          used_at: string | null
          used_from_ip: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          expires_at: string
          is_valid?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          token: string
          token_id?: string
          used_at?: string | null
          used_from_ip?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          expires_at?: string
          is_valid?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          token?: string
          token_id?: string
          used_at?: string | null
          used_from_ip?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_tokens_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_context: {
        Row: {
          block_1_fixed: Json
          block_2_identity: Json
          block_3_memory: Json
          block_4_goals: Json
          context_id: string
          created_at: string
          is_current: boolean
          role_id: string
          run_id: string
          updated_reason: string | null
          updated_trigger: string | null
          version: number
        }
        Insert: {
          block_1_fixed: Json
          block_2_identity: Json
          block_3_memory: Json
          block_4_goals: Json
          context_id?: string
          created_at?: string
          is_current?: boolean
          role_id: string
          run_id: string
          updated_reason?: string | null
          updated_trigger?: string | null
          version?: number
        }
        Update: {
          block_1_fixed?: Json
          block_2_identity?: Json
          block_3_memory?: Json
          block_4_goals?: Json
          context_id?: string
          created_at?: string
          is_current?: boolean
          role_id?: string
          run_id?: string
          updated_reason?: string | null
          updated_trigger?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_context_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "ai_context_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          created_at: string
          created_by: string | null
          default_llm_model: string | null
          default_max_tokens: number | null
          default_temperature: number | null
          description: string | null
          is_active: boolean
          name: string
          prompt_id: string
          prompt_type: string
          system_prompt: string
          updated_at: string
          usage_notes: string | null
          user_prompt_template: string | null
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_llm_model?: string | null
          default_max_tokens?: number | null
          default_temperature?: number | null
          description?: string | null
          is_active?: boolean
          name: string
          prompt_id?: string
          prompt_type: string
          system_prompt: string
          updated_at?: string
          usage_notes?: string | null
          user_prompt_template?: string | null
          version?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_llm_model?: string | null
          default_max_tokens?: number | null
          default_temperature?: number | null
          description?: string | null
          is_active?: boolean
          name?: string
          prompt_id?: string
          prompt_type?: string
          system_prompt?: string
          updated_at?: string
          usage_notes?: string | null
          user_prompt_template?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          about: string | null
          attitude_to_others: string | null
          clan_id: string
          color_hex: string | null
          created_at: string
          emblem_url: string | null
          if_things_go_wrong: string | null
          key_priorities: string | null
          logo_url: string | null
          name: string
          run_id: string
          sequence_number: number
        }
        Insert: {
          about?: string | null
          attitude_to_others?: string | null
          clan_id?: string
          color_hex?: string | null
          created_at?: string
          emblem_url?: string | null
          if_things_go_wrong?: string | null
          key_priorities?: string | null
          logo_url?: string | null
          name: string
          run_id: string
          sequence_number: number
        }
        Update: {
          about?: string | null
          attitude_to_others?: string | null
          clan_id?: string
          color_hex?: string | null
          created_at?: string
          emblem_url?: string | null
          if_things_go_wrong?: string | null
          key_priorities?: string | null
          logo_url?: string | null
          name?: string
          run_id?: string
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "clans_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      event_log: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string
          event_id: string
          event_type: string
          module: string
          payload: Json
          run_id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          created_at?: string
          event_id?: string
          event_type: string
          module: string
          payload?: Json
          run_id: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          event_id?: string
          event_type?: string
          module?: string
          payload?: Json
          run_id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_log_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      facilitator_actions: {
        Row: {
          action_details: Json
          action_id: string
          action_type: string
          created_at: string
          facilitator_id: string
          run_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_details: Json
          action_id?: string
          action_type: string
          created_at?: string
          facilitator_id: string
          run_id: string
          target_id: string
          target_type: string
        }
        Update: {
          action_details?: Json
          action_id?: string
          action_type?: string
          created_at?: string
          facilitator_id?: string
          run_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilitator_actions_facilitator_id_fkey"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilitator_actions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      king_decisions: {
        Row: {
          appointments: Json
          budget_priorities: Json
          created_at: string
          decision_id: string
          final_speech_transcript: string | null
          international_affairs: Json
          king_role_id: string
          other_decisions: string | null
          run_id: string
          taxes: Json
        }
        Insert: {
          appointments: Json
          budget_priorities: Json
          created_at?: string
          decision_id?: string
          final_speech_transcript?: string | null
          international_affairs: Json
          king_role_id: string
          other_decisions?: string | null
          run_id: string
          taxes: Json
        }
        Update: {
          appointments?: Json
          budget_priorities?: Json
          created_at?: string
          decision_id?: string
          final_speech_transcript?: string | null
          international_affairs?: Json
          king_role_id?: string
          other_decisions?: string | null
          run_id?: string
          taxes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "king_decisions_king_role_id_fkey"
            columns: ["king_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "king_decisions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: true
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      meeting_invitations: {
        Row: {
          created_at: string
          expires_at: string | null
          invitation_id: string
          invitee_role_id: string
          meeting_id: string
          responded_at: string | null
          response_text: string | null
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          invitation_id?: string
          invitee_role_id: string
          meeting_id: string
          responded_at?: string | null
          response_text?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          invitation_id?: string
          invitee_role_id?: string
          meeting_id?: string
          responded_at?: string | null
          response_text?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_invitations_invitee_role_id_fkey"
            columns: ["invitee_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "meeting_invitations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["meeting_id"]
          },
        ]
      }
      meeting_messages: {
        Row: {
          channel: string
          content: string
          meeting_id: string
          message_id: string
          role_id: string
          sequence_number: number | null
          timestamp: string
        }
        Insert: {
          channel?: string
          content: string
          meeting_id: string
          message_id?: string
          role_id: string
          sequence_number?: number | null
          timestamp?: string
        }
        Update: {
          channel?: string
          content?: string
          meeting_id?: string
          message_id?: string
          role_id?: string
          sequence_number?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["meeting_id"]
          },
          {
            foreignKeyName: "meeting_messages_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      meetings: {
        Row: {
          actual_duration_seconds: number | null
          created_at: string
          elevenlabs_conversation_id: string | null
          ended_at: string | null
          meeting_id: string
          meeting_type: string
          modality: string
          organizer_role_id: string | null
          participants: Json
          phase_id: string
          run_id: string
          scheduled_duration_minutes: number | null
          started_at: string | null
          status: string
          title: string | null
          transcript: string | null
          transcript_format: string | null
        }
        Insert: {
          actual_duration_seconds?: number | null
          created_at?: string
          elevenlabs_conversation_id?: string | null
          ended_at?: string | null
          meeting_id?: string
          meeting_type: string
          modality?: string
          organizer_role_id?: string | null
          participants?: Json
          phase_id: string
          run_id: string
          scheduled_duration_minutes?: number | null
          started_at?: string | null
          status?: string
          title?: string | null
          transcript?: string | null
          transcript_format?: string | null
        }
        Update: {
          actual_duration_seconds?: number | null
          created_at?: string
          elevenlabs_conversation_id?: string | null
          ended_at?: string | null
          meeting_id?: string
          meeting_type?: string
          modality?: string
          organizer_role_id?: string | null
          participants?: Json
          phase_id?: string
          run_id?: string
          scheduled_duration_minutes?: number | null
          started_at?: string | null
          status?: string
          title?: string | null
          transcript?: string | null
          transcript_format?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_organizer_role_id_fkey"
            columns: ["organizer_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "meetings_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["phase_id"]
          },
          {
            foreignKeyName: "meetings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      phases: {
        Row: {
          actual_duration_minutes: number | null
          default_duration_minutes: number
          description: string | null
          ended_at: string | null
          name: string
          phase_id: string
          run_id: string
          sequence_number: number
          started_at: string | null
          status: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          default_duration_minutes: number
          description?: string | null
          ended_at?: string | null
          name: string
          phase_id?: string
          run_id: string
          sequence_number: number
          started_at?: string | null
          status?: string
        }
        Update: {
          actual_duration_minutes?: number | null
          default_duration_minutes?: number
          description?: string | null
          ended_at?: string | null
          name?: string
          phase_id?: string
          run_id?: string
          sequence_number?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      public_speeches: {
        Row: {
          audio_url: string | null
          created_at: string
          delivery_method: string | null
          duration_seconds: number | null
          ended_at: string | null
          is_ai_speaker: boolean
          is_facilitator: boolean
          phase_id: string
          run_id: string
          speaker_role_id: string | null
          speech_id: string
          started_at: string | null
          transcript: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          delivery_method?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          is_ai_speaker?: boolean
          is_facilitator?: boolean
          phase_id: string
          run_id: string
          speaker_role_id?: string | null
          speech_id?: string
          started_at?: string | null
          transcript: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          delivery_method?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          is_ai_speaker?: boolean
          is_facilitator?: boolean
          phase_id?: string
          run_id?: string
          speaker_role_id?: string | null
          speech_id?: string
          started_at?: string | null
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_speeches_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["phase_id"]
          },
          {
            foreignKeyName: "public_speeches_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "public_speeches_speaker_role_id_fkey"
            columns: ["speaker_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      reflections: {
        Row: {
          ai_insights: Json | null
          ai_summary: string | null
          created_at: string
          phase_id: string | null
          reflection_id: string
          reflection_text: string
          reflection_type: string
          role_id: string
          run_id: string
        }
        Insert: {
          ai_insights?: Json | null
          ai_summary?: string | null
          created_at?: string
          phase_id?: string | null
          reflection_id?: string
          reflection_text: string
          reflection_type: string
          role_id: string
          run_id: string
        }
        Update: {
          ai_insights?: Json | null
          ai_summary?: string | null
          created_at?: string
          phase_id?: string | null
          reflection_id?: string
          reflection_text?: string
          reflection_type?: string
          role_id?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["phase_id"]
          },
          {
            foreignKeyName: "reflections_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "reflections_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      roles: {
        Row: {
          age: number | null
          ai_config: Json | null
          assigned_user_id: string | null
          avatar_url: string | null
          background: string | null
          character_traits: string | null
          clan_id: string
          created_at: string
          elevenlabs_agent_id: string | null
          interests: string | null
          name: string
          participant_type: string
          position: string | null
          role_id: string
          run_id: string
          status: string
        }
        Insert: {
          age?: number | null
          ai_config?: Json | null
          assigned_user_id?: string | null
          avatar_url?: string | null
          background?: string | null
          character_traits?: string | null
          clan_id: string
          created_at?: string
          elevenlabs_agent_id?: string | null
          interests?: string | null
          name: string
          participant_type: string
          position?: string | null
          role_id?: string
          run_id: string
          status?: string
        }
        Update: {
          age?: number | null
          ai_config?: Json | null
          assigned_user_id?: string | null
          avatar_url?: string | null
          background?: string | null
          character_traits?: string | null
          clan_id?: string
          created_at?: string
          elevenlabs_agent_id?: string | null
          interests?: string | null
          name?: string
          participant_type?: string
          position?: string | null
          role_id?: string
          run_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["clan_id"]
          },
          {
            foreignKeyName: "roles_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      sim_run_prompts: {
        Row: {
          created_at: string
          custom_prompt_id: string | null
          id: string
          llm_model_override: string | null
          max_tokens_override: number | null
          notes: string | null
          prompt_type: string
          run_id: string
          temperature_override: number | null
        }
        Insert: {
          created_at?: string
          custom_prompt_id?: string | null
          id?: string
          llm_model_override?: string | null
          max_tokens_override?: number | null
          notes?: string | null
          prompt_type: string
          run_id: string
          temperature_override?: number | null
        }
        Update: {
          created_at?: string
          custom_prompt_id?: string | null
          id?: string
          llm_model_override?: string | null
          max_tokens_override?: number | null
          notes?: string | null
          prompt_type?: string
          run_id?: string
          temperature_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sim_run_prompts_custom_prompt_id_fkey"
            columns: ["custom_prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["prompt_id"]
          },
          {
            foreignKeyName: "sim_run_prompts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      sim_runs: {
        Row: {
          ai_participants: number
          completed_at: string | null
          config: Json
          config_checksum: string
          created_at: string
          current_phase_id: string | null
          facilitator_id: string | null
          human_participants: number
          learning_objectives: string[] | null
          notes: string | null
          run_id: string
          run_name: string
          started_at: string | null
          status: string
          total_participants: number
          version: string
          vote_1_threshold: number | null
          vote_2_threshold: number | null
        }
        Insert: {
          ai_participants: number
          completed_at?: string | null
          config: Json
          config_checksum: string
          created_at?: string
          current_phase_id?: string | null
          facilitator_id?: string | null
          human_participants: number
          learning_objectives?: string[] | null
          notes?: string | null
          run_id?: string
          run_name: string
          started_at?: string | null
          status?: string
          total_participants: number
          version: string
          vote_1_threshold?: number | null
          vote_2_threshold?: number | null
        }
        Update: {
          ai_participants?: number
          completed_at?: string | null
          config?: Json
          config_checksum?: string
          created_at?: string
          current_phase_id?: string | null
          facilitator_id?: string | null
          human_participants?: number
          learning_objectives?: string[] | null
          notes?: string | null
          run_id?: string
          run_name?: string
          started_at?: string | null
          status?: string
          total_participants?: number
          version?: string
          vote_1_threshold?: number | null
          vote_2_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sim_runs_facilitator"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sim_runs_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["phase_id"]
          },
        ]
      }
      simulation_templates: {
        Row: {
          author: string | null
          canonical_clans: Json
          canonical_roles: Json
          context_text: string
          created_at: string
          decisions_framework: Json
          description: string | null
          is_active: boolean
          language: string
          name: string
          process_stages: Json
          template_id: string
          updated_at: string
          version: string
        }
        Insert: {
          author?: string | null
          canonical_clans: Json
          canonical_roles: Json
          context_text: string
          created_at?: string
          decisions_framework: Json
          description?: string | null
          is_active?: boolean
          language?: string
          name?: string
          process_stages: Json
          template_id?: string
          updated_at?: string
          version?: string
        }
        Update: {
          author?: string | null
          canonical_clans?: Json
          canonical_roles?: Json
          context_text?: string
          created_at?: string
          decisions_framework?: Json
          description?: string | null
          is_active?: boolean
          language?: string
          name?: string
          process_stages?: Json
          template_id?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_event_code: string | null
          display_name: string
          email: string
          full_name: string | null
          id: string
          is_facilitator: boolean
          last_login_at: string | null
          preferences: Json | null
          role: string
          status: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_event_code?: string | null
          display_name: string
          email: string
          full_name?: string | null
          id: string
          is_facilitator?: boolean
          last_login_at?: string | null
          preferences?: Json | null
          role: string
          status?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_event_code?: string | null
          display_name?: string
          email?: string
          full_name?: string | null
          id?: string
          is_facilitator?: boolean
          last_login_at?: string | null
          preferences?: Json | null
          role?: string
          status?: string
        }
        Relationships: []
      }
      vote_results: {
        Row: {
          animation_duration_seconds: number | null
          animation_shown: boolean
          announced_at: string | null
          calculated_at: string
          calculated_by: string | null
          result_id: string
          results_data: Json
          session_id: string
        }
        Insert: {
          animation_duration_seconds?: number | null
          animation_shown?: boolean
          announced_at?: string | null
          calculated_at?: string
          calculated_by?: string | null
          result_id?: string
          results_data: Json
          session_id: string
        }
        Update: {
          animation_duration_seconds?: number | null
          animation_shown?: boolean
          announced_at?: string | null
          calculated_at?: string
          calculated_by?: string | null
          result_id?: string
          results_data?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_results_calculated_by_fkey"
            columns: ["calculated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "vote_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      vote_sessions: {
        Row: {
          allow_skip_animation: boolean
          animation_speed: string
          announced_at: string | null
          closed_at: string | null
          created_at: string
          eligible_candidates: Json | null
          phase_id: string
          proposal_description: string | null
          proposal_title: string | null
          reveal_timing: string
          run_id: string
          scope: string
          scope_clan_id: string | null
          session_id: string
          status: string
          transparency_level: string
          vote_format: string
          vote_type: string
        }
        Insert: {
          allow_skip_animation?: boolean
          animation_speed?: string
          announced_at?: string | null
          closed_at?: string | null
          created_at?: string
          eligible_candidates?: Json | null
          phase_id: string
          proposal_description?: string | null
          proposal_title?: string | null
          reveal_timing?: string
          run_id: string
          scope?: string
          scope_clan_id?: string | null
          session_id?: string
          status?: string
          transparency_level?: string
          vote_format: string
          vote_type: string
        }
        Update: {
          allow_skip_animation?: boolean
          animation_speed?: string
          announced_at?: string | null
          closed_at?: string | null
          created_at?: string
          eligible_candidates?: Json | null
          phase_id?: string
          proposal_description?: string | null
          proposal_title?: string | null
          reveal_timing?: string
          run_id?: string
          scope?: string
          scope_clan_id?: string | null
          session_id?: string
          status?: string
          transparency_level?: string
          vote_format?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_sessions_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["phase_id"]
          },
          {
            foreignKeyName: "vote_sessions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sim_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "vote_sessions_scope_clan_id_fkey"
            columns: ["scope_clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["clan_id"]
          },
        ]
      }
      votes: {
        Row: {
          cast_at: string
          chosen_role_id: string | null
          session_id: string
          vote_id: string
          voter_clan_id: string
          voter_role_id: string
          yes_no_choice: string | null
        }
        Insert: {
          cast_at?: string
          chosen_role_id?: string | null
          session_id: string
          vote_id?: string
          voter_clan_id: string
          voter_role_id: string
          yes_no_choice?: string | null
        }
        Update: {
          cast_at?: string
          chosen_role_id?: string | null
          session_id?: string
          vote_id?: string
          voter_clan_id?: string
          voter_role_id?: string
          yes_no_choice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_chosen_role_id_fkey"
            columns: ["chosen_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "vote_sessions"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "votes_voter_clan_id_fkey"
            columns: ["voter_clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["clan_id"]
          },
          {
            foreignKeyName: "votes_voter_role_id_fkey"
            columns: ["voter_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      all_votes_cast: { Args: { p_session_id: string }; Returns: boolean }
      generate_access_token:
        | {
            Args: {
              p_device_name?: string
              p_expiry_hours?: number
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_duration_hours?: number
              p_run_id: string
              p_user_id: string
            }
            Returns: string
          }
      get_current_phase: {
        Args: { p_run_id: string }
        Returns: {
          name: string
          phase_id: string
          sequence_number: number
          started_at: string
        }[]
      }
      get_current_user_role_id: { Args: { p_run_id: string }; Returns: string }
      get_participant_count: {
        Args: { p_run_id: string }
        Returns: {
          ai: number
          human: number
          total: number
        }[]
      }
      get_simulation_stats: { Args: { p_run_id: string }; Returns: Json }
      is_facilitator: { Args: never; Returns: boolean }
      is_participant_in_run: { Args: { p_run_id: string }; Returns: boolean }
      validate_access_token: { Args: { p_token: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
