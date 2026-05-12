export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string | null
          role: "STUDENT" | "ADMIN"
          subscription_status: "FREE" | "PRO"
          bio: string | null
          avatar_url: string | null
          target_school: string | null
          is_banned: boolean
          aspiring_course: string | null
          student_subject_ids: string[] | null
          whatsapp_number: string | null
          show_whatsapp: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          email?: string | null
          role?: "STUDENT" | "ADMIN"
          subscription_status?: "FREE" | "PRO"
          bio?: string | null
          avatar_url?: string | null
          target_school?: string | null
          is_banned?: boolean
          aspiring_course?: string | null
          student_subject_ids?: string[] | null
          whatsapp_number?: string | null
          show_whatsapp?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          role?: "STUDENT" | "ADMIN"
          subscription_status?: "FREE" | "PRO"
          bio?: string | null
          avatar_url?: string | null
          target_school?: string | null
          is_banned?: boolean
          aspiring_course?: string | null
          student_subject_ids?: string[] | null
          whatsapp_number?: string | null
          show_whatsapp?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      log_attendants: {
        Row: { id: string; user_id: string; granted_by: string | null; created_at: string }
        Insert: { id?: string; user_id: string; granted_by?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; granted_by?: string | null }
        Relationships: []
      }
      brainstorm_sessions: {
        Row: { id: string; session_date: string; title: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; session_date?: string; title?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: string; session_date?: string; title?: string | null; created_by?: string | null }
        Relationships: []
      }
      brainstorm_attendance: {
        Row: { id: string; session_id: string; student_id: string; first_answers: number; logged_by: string | null; created_at: string }
        Insert: { id?: string; session_id: string; student_id: string; first_answers?: number; logged_by?: string | null; created_at?: string }
        Update: { id?: string; session_id?: string; student_id?: string; first_answers?: number; logged_by?: string | null }
        Relationships: []
      }
      school_exam_config: {
        Row: {
          id: string
          school_id: string
          total_questions: number
          subject_question_counts: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          total_questions?: number
          subject_question_counts?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          total_questions?: number
          subject_question_counts?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          id: string
          name: string
          abbreviation: string
          location: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          abbreviation: string
          location?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          abbreviation?: string
          location?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: { id: string; name: string; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          text: string
          image_url: string | null
          explanation: string | null
          year: number | null
          school_id: string
          subject_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          text: string
          image_url?: string | null
          explanation?: string | null
          year?: number | null
          school_id: string
          subject_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          text?: string
          image_url?: string | null
          explanation?: string | null
          year?: number | null
          school_id?: string
          subject_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      options: {
        Row: {
          id: string
          question_id: string
          label: "A" | "B" | "C" | "D"
          text: string
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          label: "A" | "B" | "C" | "D"
          text: string
          is_correct?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          label?: "A" | "B" | "C" | "D"
          text?: string
          is_correct?: boolean
          created_at?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          id: string
          user_id: string
          school_id: string
          score: number
          total_questions: number
          time_taken_secs: number | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          score?: number
          total_questions: number
          time_taken_secs?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          score?: number
          total_questions?: number
          time_taken_secs?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          subject_id: string
          selected_option_id: string | null
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          subject_id: string
          selected_option_id?: string | null
          is_correct?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          subject_id?: string
          selected_option_id?: string | null
          is_correct?: boolean
          created_at?: string
        }
        Relationships: []
      }
      daily_quizzes: {
        Row: {
          id: string
          user_id: string
          date: string
          score: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          score?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          score?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_quiz_questions: {
        Row: {
          id: string
          daily_quiz_id: string
          question_id: string
          selected_option_id: string | null
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          daily_quiz_id: string
          question_id: string
          selected_option_id?: string | null
          is_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          daily_quiz_id?: string
          question_id?: string
          selected_option_id?: string | null
          is_correct?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          question_id: string
          type: "WRONG_ANSWER" | "TYPO" | "SUGGESTION"
          message: string
          status: "PENDING" | "REVIEWED" | "RESOLVED"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          type: "WRONG_ANSWER" | "TYPO" | "SUGGESTION"
          message: string
          status?: "PENDING" | "REVIEWED" | "RESOLVED"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          type?: "WRONG_ANSWER" | "TYPO" | "SUGGESTION"
          message?: string
          status?: "PENDING" | "REVIEWED" | "RESOLVED"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "DAILY_QUIZ_READY" | "STREAK_REMINDER" | "GENERAL"
          title: string
          body: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "DAILY_QUIZ_READY" | "STREAK_REMINDER" | "GENERAL"
          title: string
          body: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "DAILY_QUIZ_READY" | "STREAK_REMINDER" | "GENERAL"
          title?: string
          body?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_requests: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          user_email: string | null
          school_name: string
          message: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          user_email?: string | null
          school_name: string
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          user_email?: string | null
          school_name?: string
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_tips: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          category: string
          type: string
          is_published: boolean
          pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          category?: string
          type?: string
          is_published?: boolean
          pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          category?: string
          type?: string
          is_published?: boolean
          pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_weekly_leaderboard: {
        Args: { p_school_id?: string | null; p_limit?: number }
        Returns: { user_id: string; name: string; total_score: number; attempts: number }[]
      }
      get_subject_accuracy: {
        Args: { p_user_id: string }
        Returns: { subject_id: string; subject_name: string; correct: number; total: number; accuracy: number }[]
      }
    }
  }
}

// Convenience row types
export type Profile        = Database["public"]["Tables"]["profiles"]["Row"]
export type School         = Database["public"]["Tables"]["schools"]["Row"]
export type Subject        = Database["public"]["Tables"]["subjects"]["Row"]
export type Question       = Database["public"]["Tables"]["questions"]["Row"]
export type Option         = Database["public"]["Tables"]["options"]["Row"]
export type ExamAttempt    = Database["public"]["Tables"]["exam_attempts"]["Row"]
export type AttemptAnswer  = Database["public"]["Tables"]["attempt_answers"]["Row"]
export type DailyQuiz      = Database["public"]["Tables"]["daily_quizzes"]["Row"]
export type Streak         = Database["public"]["Tables"]["streaks"]["Row"]
export type Notification      = Database["public"]["Tables"]["notifications"]["Row"]
export type SchoolExamConfig  = Database["public"]["Tables"]["school_exam_config"]["Row"]
export type SchoolRequest     = Database["public"]["Tables"]["school_requests"]["Row"]
export type StudyTip          = Database["public"]["Tables"]["study_tips"]["Row"]

export type AppUser = {
  id: string
  email: string
  name: string
  role: "STUDENT" | "ADMIN"
  subscriptionStatus: "FREE" | "PRO"
  isBanned: boolean
  aspiringCourse: string | null
  studentSubjectIds: string[]
}
