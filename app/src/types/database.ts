/**
 * Database type definitions for The New King SIM
 * Auto-generated from Supabase schema
 * DO NOT EDIT MANUALLY - regenerate from schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

export type SimulationStatus = 'setup' | 'ready' | 'in_progress' | 'completed' | 'cancelled'
export type UserRole = 'facilitator' | 'participant'
export type UserStatus = 'registered' | 'role_assigned' | 'active' | 'completed' | 'inactive' | 'banned'
export type ParticipantType = 'human' | 'ai'
export type RoleStatus = 'active' | 'inactive'
export type PhaseStatus = 'pending' | 'active' | 'paused' | 'completed' | 'skipped'
export type MeetingType = 'clan_council' | 'free_consultation'
export type MeetingModality = 'voice' | 'text'
export type MeetingStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'cancelled' | 'expired'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export type DeliveryMethod = 'human_microphone' | 'ai_tts_playback' | 'facilitator_announcement'
export type VoteType = 'clan_nomination' | 'election_round' | 'clan_oath' | 'clan_action' | 'facilitator_proposal'
export type VoteFormat = 'choose_person' | 'yes_no'
export type VoteScope = 'all' | 'clan_only'
export type TransparencyLevel = 'open' | 'anonymous' | 'secret'
export type RevealTiming = 'immediate' | 'after_all_votes' | 'facilitator_manual'
export type AnimationSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type VoteSessionStatus = 'open' | 'closed' | 'announced'
export type YesNoChoice = 'yes' | 'no' | 'abstain'
export type ReflectionType = 'personal' | 'group' | 'ai_generated'
export type PromptType =
  | 'block_1_fixed'
  | 'block_2_identity_update'
  | 'block_3_memory_update'
  | 'block_4_goals_update'
  | 'action_decision'
  | 'public_speech'
  | 'personal_feedback'
  | 'debrief_analysis'
  | 'induction_assistant'
export type ActorType = 'facilitator' | 'human_participant' | 'ai_participant' | 'system'
export type Language = 'ENG' | 'RU'

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface SimRun {
  run_id: string
  run_name: string
  version: string
  config: Json
  config_checksum: string
  total_participants: number
  human_participants: number
  ai_participants: number
  status: SimulationStatus
  created_at: string
  started_at: string | null
  completed_at: string | null
  facilitator_id: string | null
  current_phase_id: string | null
  notes: string | null
  learning_objectives: string[] | null
}

export interface User {
  id: string
  email: string
  display_name: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_facilitator: boolean
  status: UserStatus
  current_event_code: string | null
  created_at: string
  last_login_at: string | null
  preferences: Json
}

export interface AccessToken {
  token_id: string
  user_id: string
  token: string
  device_name: string | null
  created_at: string
  expires_at: string
  used_at: string | null
  used_from_ip: string | null
  is_valid: boolean
  revoked_by: string | null
  revoked_at: string | null
}

export interface Clan {
  clan_id: string
  run_id: string
  name: string
  sequence_number: number
  about: string | null
  key_priorities: string | null
  attitude_to_others: string | null
  if_things_go_wrong: string | null
  emblem_url: string | null
  color_hex: string | null
  created_at: string
}

export interface Role {
  role_id: string
  run_id: string
  clan_id: string
  participant_type: ParticipantType
  assigned_user_id: string | null
  name: string
  age: number | null
  position: string | null
  background: string | null
  character_traits: string | null
  interests: string | null
  ai_config: Json | null
  avatar_url: string | null
  status: RoleStatus
  created_at: string
}

export interface Phase {
  phase_id: string
  run_id: string
  sequence_number: number
  name: string
  description: string | null
  default_duration_minutes: number
  actual_duration_minutes: number | null
  started_at: string | null
  ended_at: string | null
  status: PhaseStatus
}

export interface Meeting {
  meeting_id: string
  run_id: string
  phase_id: string
  meeting_type: MeetingType
  organizer_role_id: string | null
  title: string | null
  participants: Json
  modality: MeetingModality
  transcript: string | null
  transcript_format: string
  elevenlabs_conversation_id: string | null
  scheduled_duration_minutes: number | null
  started_at: string | null
  ended_at: string | null
  actual_duration_seconds: number | null
  status: MeetingStatus
  created_at: string
}

export interface MeetingInvitation {
  invitation_id: string
  meeting_id: string
  invitee_role_id: string
  status: InvitationStatus
  response_text: string | null
  responded_at: string | null
  created_at: string
  expires_at: string | null
}

export interface PublicSpeech {
  speech_id: string
  run_id: string
  phase_id: string
  speaker_role_id: string | null
  is_facilitator: boolean
  is_ai_speaker: boolean
  transcript: string
  audio_url: string | null
  delivery_method: DeliveryMethod | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  created_at: string
}

export interface VoteSession {
  session_id: string
  run_id: string
  phase_id: string
  vote_type: VoteType
  vote_format: VoteFormat
  scope: VoteScope
  scope_clan_id: string | null
  eligible_candidates: Json | null
  proposal_title: string | null
  proposal_description: string | null
  transparency_level: TransparencyLevel
  reveal_timing: RevealTiming
  animation_speed: AnimationSpeed
  allow_skip_animation: boolean
  status: VoteSessionStatus
  created_at: string
  closed_at: string | null
  announced_at: string | null
}

export interface VoteResult {
  result_id: string
  session_id: string
  results_data: Json
  calculated_at: string
  announced_at: string | null
  animation_shown: boolean
  animation_duration_seconds: number | null
  calculated_by: string | null
}

export interface Vote {
  vote_id: string
  session_id: string
  voter_role_id: string
  voter_clan_id: string
  chosen_role_id: string | null
  yes_no_choice: YesNoChoice | null
  cast_at: string
}

export interface AIContext {
  context_id: string
  run_id: string
  role_id: string
  version: number
  is_current: boolean
  block_1_fixed: Json
  block_2_identity: Json
  block_3_memory: Json
  block_4_goals: Json
  updated_trigger: string | null
  updated_reason: string | null
  created_at: string
}

export interface AIPrompt {
  prompt_id: string
  prompt_type: PromptType
  version: string
  is_active: boolean
  system_prompt: string
  user_prompt_template: string | null
  default_llm_model: string
  default_temperature: number
  default_max_tokens: number
  name: string
  description: string | null
  usage_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SimRunPrompt {
  id: string
  run_id: string
  prompt_type: string
  custom_prompt_id: string | null
  llm_model_override: string | null
  temperature_override: number | null
  max_tokens_override: number | null
  notes: string | null
  created_at: string
}

export interface KingDecision {
  decision_id: string
  run_id: string
  king_role_id: string
  taxes: Json
  budget_priorities: Json
  appointments: Json
  international_affairs: Json
  other_decisions: string | null
  final_speech_transcript: string | null
  revealed: boolean
  created_at: string
}

export interface ClanVote {
  vote_id: string
  run_id: string
  clan_id: string
  oath_of_allegiance: boolean | null
  initiate_actions: boolean | null
  voted_at: string | null
  revealed: boolean
  revealed_at: string | null
  created_at: string
}

export interface Reflection {
  reflection_id: string
  run_id: string
  phase_id: string | null
  role_id: string
  reflection_type: ReflectionType
  reflection_text: string
  ai_summary: string | null
  ai_insights: Json | null
  created_at: string
}

export interface EventLog {
  event_id: string
  run_id: string
  event_type: string
  module: string
  actor_type: ActorType
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  payload: Json
  created_at: string
}

export interface FacilitatorAction {
  action_id: string
  run_id: string
  facilitator_id: string
  action_type: string
  target_type: string
  target_id: string
  action_details: Json
  created_at: string
}

export interface SimulationTemplate {
  template_id: string
  name: string
  version: string
  language: Language
  context_text: string
  process_stages: Json
  decisions_framework: Json
  canonical_clans: Json
  canonical_roles: Json
  description: string | null
  author: string | null
  created_at: string
  updated_at: string
  is_active: boolean
}

// ============================================================================
// SUPABASE DATABASE INTERFACE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      sim_runs: {
        Row: SimRun
        Insert: Omit<SimRun, 'run_id' | 'created_at'> & {
          run_id?: string
          created_at?: string
        }
        Update: Partial<Omit<SimRun, 'run_id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'preferences'> & {
          created_at?: string
          preferences?: Json
        }
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      access_tokens: {
        Row: AccessToken
        Insert: Omit<AccessToken, 'token_id' | 'created_at' | 'is_valid'> & {
          token_id?: string
          created_at?: string
          is_valid?: boolean
        }
        Update: Partial<Omit<AccessToken, 'token_id' | 'created_at' | 'user_id' | 'token'>>
      }
      clans: {
        Row: Clan
        Insert: Omit<Clan, 'clan_id' | 'created_at'> & {
          clan_id?: string
          created_at?: string
        }
        Update: Partial<Omit<Clan, 'clan_id' | 'created_at' | 'run_id'>>
      }
      roles: {
        Row: Role
        Insert: Omit<Role, 'role_id' | 'created_at' | 'status'> & {
          role_id?: string
          created_at?: string
          status?: RoleStatus
        }
        Update: Partial<Omit<Role, 'role_id' | 'created_at' | 'run_id'>>
      }
      phases: {
        Row: Phase
        Insert: Omit<Phase, 'phase_id' | 'status'> & {
          phase_id?: string
          status?: PhaseStatus
        }
        Update: Partial<Omit<Phase, 'phase_id' | 'run_id'>>
      }
      meetings: {
        Row: Meeting
        Insert: Omit<Meeting, 'meeting_id' | 'created_at' | 'status' | 'modality' | 'participants' | 'transcript_format'> & {
          meeting_id?: string
          created_at?: string
          status?: MeetingStatus
          modality?: MeetingModality
          participants?: Json
          transcript_format?: string
        }
        Update: Partial<Omit<Meeting, 'meeting_id' | 'created_at' | 'run_id'>>
      }
      meeting_invitations: {
        Row: MeetingInvitation
        Insert: Omit<MeetingInvitation, 'invitation_id' | 'created_at' | 'status'> & {
          invitation_id?: string
          created_at?: string
          status?: InvitationStatus
        }
        Update: Partial<Omit<MeetingInvitation, 'invitation_id' | 'created_at' | 'meeting_id' | 'invitee_role_id'>>
      }
      public_speeches: {
        Row: PublicSpeech
        Insert: Omit<PublicSpeech, 'speech_id' | 'created_at' | 'is_facilitator' | 'is_ai_speaker'> & {
          speech_id?: string
          created_at?: string
          is_facilitator?: boolean
          is_ai_speaker?: boolean
        }
        Update: Partial<Omit<PublicSpeech, 'speech_id' | 'created_at' | 'run_id'>>
      }
      vote_sessions: {
        Row: VoteSession
        Insert: Omit<VoteSession, 'session_id' | 'created_at' | 'status' | 'transparency_level' | 'reveal_timing' | 'animation_speed' | 'allow_skip_animation' | 'scope'> & {
          session_id?: string
          created_at?: string
          status?: VoteSessionStatus
          transparency_level?: TransparencyLevel
          reveal_timing?: RevealTiming
          animation_speed?: AnimationSpeed
          allow_skip_animation?: boolean
          scope?: VoteScope
        }
        Update: Partial<Omit<VoteSession, 'session_id' | 'created_at' | 'run_id'>>
      }
      vote_results: {
        Row: VoteResult
        Insert: Omit<VoteResult, 'result_id' | 'calculated_at' | 'animation_shown'> & {
          result_id?: string
          calculated_at?: string
          animation_shown?: boolean
        }
        Update: Partial<Omit<VoteResult, 'result_id' | 'session_id'>>
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, 'vote_id' | 'cast_at'> & {
          vote_id?: string
          cast_at?: string
        }
        Update: Partial<Omit<Vote, 'vote_id' | 'cast_at' | 'session_id' | 'voter_role_id'>>
      }
      ai_context: {
        Row: AIContext
        Insert: Omit<AIContext, 'context_id' | 'created_at' | 'version' | 'is_current'> & {
          context_id?: string
          created_at?: string
          version?: number
          is_current?: boolean
        }
        Update: Partial<Omit<AIContext, 'context_id' | 'created_at' | 'run_id' | 'role_id'>>
      }
      ai_prompts: {
        Row: AIPrompt
        Insert: Omit<AIPrompt, 'prompt_id' | 'created_at' | 'updated_at' | 'version' | 'is_active' | 'default_llm_model' | 'default_temperature' | 'default_max_tokens'> & {
          prompt_id?: string
          created_at?: string
          updated_at?: string
          version?: string
          is_active?: boolean
          default_llm_model?: string
          default_temperature?: number
          default_max_tokens?: number
        }
        Update: Partial<Omit<AIPrompt, 'prompt_id' | 'created_at'>>
      }
      sim_run_prompts: {
        Row: SimRunPrompt
        Insert: Omit<SimRunPrompt, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<SimRunPrompt, 'id' | 'created_at' | 'run_id' | 'prompt_type'>>
      }
      king_decisions: {
        Row: KingDecision
        Insert: Omit<KingDecision, 'decision_id' | 'created_at'> & {
          decision_id?: string
          created_at?: string
        }
        Update: Partial<Omit<KingDecision, 'decision_id' | 'created_at' | 'run_id'>>
      }
      reflections: {
        Row: Reflection
        Insert: Omit<Reflection, 'reflection_id' | 'created_at'> & {
          reflection_id?: string
          created_at?: string
        }
        Update: Partial<Omit<Reflection, 'reflection_id' | 'created_at' | 'run_id' | 'role_id'>>
      }
      event_log: {
        Row: EventLog
        Insert: Omit<EventLog, 'event_id' | 'created_at' | 'payload'> & {
          event_id?: string
          created_at?: string
          payload?: Json
        }
        Update: Partial<Omit<EventLog, 'event_id' | 'created_at'>>
      }
      facilitator_actions: {
        Row: FacilitatorAction
        Insert: Omit<FacilitatorAction, 'action_id' | 'created_at'> & {
          action_id?: string
          created_at?: string
        }
        Update: Partial<Omit<FacilitatorAction, 'action_id' | 'created_at'>>
      }
      simulation_templates: {
        Row: SimulationTemplate
        Insert: Omit<SimulationTemplate, 'template_id' | 'created_at' | 'updated_at' | 'name' | 'version' | 'language' | 'is_active'> & {
          template_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          version?: string
          language?: Language
          is_active?: boolean
        }
        Update: Partial<Omit<SimulationTemplate, 'template_id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_facilitator: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_current_user_role_id: {
        Args: { p_run_id: string }
        Returns: string
      }
      is_participant_in_run: {
        Args: { p_run_id: string }
        Returns: boolean
      }
      get_participant_count: {
        Args: { p_run_id: string }
        Returns: { total: number; human: number; ai: number }[]
      }
      get_current_phase: {
        Args: { p_run_id: string }
        Returns: { phase_id: string; name: string; sequence_number: number; started_at: string }[]
      }
      all_votes_cast: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      generate_access_token: {
        Args: { p_user_id: string; p_device_name?: string; p_expiry_hours?: number }
        Returns: string
      }
      validate_access_token: {
        Args: { p_token: string }
        Returns: string
      }
      get_simulation_stats: {
        Args: { p_run_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
