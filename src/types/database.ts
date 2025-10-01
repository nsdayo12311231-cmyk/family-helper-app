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
      families: {
        Row: {
          id: string
          name: string
          admin_email: string
          admin_password: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          admin_email: string
          admin_password: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          admin_email?: string
          admin_password?: string
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          family_id: string
          name: string
          avatar: string
          role: 'admin' | 'child'
          theme: 'boy' | 'girl'
          text_style: 'kanji' | 'hiragana'
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          avatar: string
          role: 'admin' | 'child'
          theme: 'boy' | 'girl'
          text_style: 'kanji' | 'hiragana'
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          avatar?: string
          role?: 'admin' | 'child'
          theme?: 'boy' | 'girl'
          text_style?: 'kanji' | 'hiragana'
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          family_id: string
          member_id: string
          name: string
          description: string | null
          reward: number
          icon: string
          category: string | null
          daily_limit: number
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          member_id: string
          name: string
          description?: string | null
          reward?: number
          icon: string
          category?: string | null
          daily_limit?: number
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          member_id?: string
          name?: string
          description?: string | null
          reward?: number
          icon?: string
          category?: string | null
          daily_limit?: number
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      task_completions: {
        Row: {
          id: string
          task_id: string
          family_id: string
          member_id: string
          completed_at: string
          reward: number
        }
        Insert: {
          id?: string
          task_id: string
          family_id: string
          member_id: string
          completed_at: string
          reward?: number
        }
        Update: {
          id?: string
          task_id?: string
          family_id?: string
          member_id?: string
          completed_at?: string
          reward?: number
        }
      }
      money_balances: {
        Row: {
          id: string
          family_id: string
          member_id: string
          available: number
          allocated: number
          spent: number
          total: number
          last_updated: string
        }
        Insert: {
          id?: string
          family_id: string
          member_id: string
          available?: number
          allocated?: number
          spent?: number
          total?: number
          last_updated?: string
        }
        Update: {
          id?: string
          family_id?: string
          member_id?: string
          available?: number
          allocated?: number
          spent?: number
          total?: number
          last_updated?: string
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