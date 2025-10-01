import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const getCurrentUser = () => supabase.auth.getUser()
export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })
export const signOut = () => supabase.auth.signOut()

// Database helpers
export const getFamilies = () =>
  supabase.from('families').select('*')
export const getMembers = (familyId: string) =>
  supabase.from('members').select('*').eq('family_id', familyId)
export const getTasks = (familyId: string) =>
  supabase.from('tasks').select('*').eq('family_id', familyId)
export const getTaskCompletions = (familyId: string, memberId?: string) => {
  let query = supabase.from('task_completions').select('*').eq('family_id', familyId)
  if (memberId) {
    query = query.eq('member_id', memberId)
  }
  return query
}