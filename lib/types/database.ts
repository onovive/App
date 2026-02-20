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
          email: string
          username: string | null
          avatar_url: string | null
          explorer_type: 'Urban' | 'Trail' | 'Mystery' | 'Geo' | 'Riddle' | 'Digital' | null
          onboarding_completed: boolean
          user_role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          explorer_type?: 'Urban' | 'Trail' | 'Mystery' | 'Geo' | 'Riddle' | 'Digital' | null
          onboarding_completed?: boolean
          user_role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          explorer_type?: 'Urban' | 'Trail' | 'Mystery' | 'Geo' | 'Riddle' | 'Digital' | null
          onboarding_completed?: boolean
          user_role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      hunts: {
        Row: {
          id: string
          title: string
          description: string | null
          start_time: string
          duration_minutes: number
          cover_image_url: string | null
          clues_count: number
          prizes: Json | null
          status: 'upcoming' | 'active' | 'completed' | 'cancelled'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_time: string
          duration_minutes: number
          cover_image_url?: string | null
          clues_count: number
          prizes?: Json | null
          status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_time?: string
          duration_minutes?: number
          cover_image_url?: string | null
          clues_count?: number
          prizes?: Json | null
          status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hunt_participants: {
        Row: {
          id: string
          user_id: string
          hunt_id: string
          subscribed_at: string
          started_at: string | null
          completed_at: string | null
          total_time_seconds: number | null
          correct_clues: number
          current_clue_number: number
        }
        Insert: {
          id?: string
          user_id: string
          hunt_id: string
          subscribed_at?: string
          started_at?: string | null
          completed_at?: string | null
          total_time_seconds?: number | null
          correct_clues?: number
          current_clue_number?: number
        }
        Update: {
          id?: string
          user_id?: string
          hunt_id?: string
          subscribed_at?: string
          started_at?: string | null
          completed_at?: string | null
          total_time_seconds?: number | null
          correct_clues?: number
          current_clue_number?: number
        }
      }
      clues: {
        Row: {
          id: string
          hunt_id: string
          clue_number: number
          clue_text: string
          hint_text: string | null
          correct_answer_criteria: Json
          location_hint: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hunt_id: string
          clue_number: number
          clue_text: string
          hint_text?: string | null
          correct_answer_criteria: Json
          location_hint?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          hunt_id?: string
          clue_number?: number
          clue_text?: string
          hint_text?: string | null
          correct_answer_criteria?: Json
          location_hint?: string | null
          created_at?: string
        }
      }
      user_clue_submissions: {
        Row: {
          id: string
          user_id: string
          hunt_id: string
          clue_id: string
          photo_url: string
          is_correct: boolean | null
          ai_validation_result: Json | null
          submitted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hunt_id: string
          clue_id: string
          photo_url: string
          is_correct?: boolean | null
          ai_validation_result?: Json | null
          submitted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hunt_id?: string
          clue_id?: string
          photo_url?: string
          is_correct?: boolean | null
          ai_validation_result?: Json | null
          submitted_at?: string
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
