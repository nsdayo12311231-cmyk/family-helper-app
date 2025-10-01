import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Family, Member, Task, TaskCompletion, MoneyBalance } from '../types'

export const useSupabase = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Test connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('families').select('count').limit(1)
        if (error) throw error
        setIsConnected(true)
        console.log('✅ Supabase接続成功')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed')
        console.error('❌ Supabase接続エラー:', err)
      }
    }

    testConnection()
  }, [])

  // Family operations
  const createFamily = async (family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert([{
          name: family.name,
          admin_email: family.adminEmail,
          admin_password: family.adminPassword
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('家族作成エラー:', err)
      throw err
    }
  }

  const getFamilyByEmail = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('admin_email', email)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('家族取得エラー:', err)
      return null
    }
  }

  // Member operations
  const createMember = async (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{
          family_id: member.familyId,
          name: member.name,
          avatar: member.avatar,
          role: member.role,
          theme: member.theme,
          text_style: member.textStyle,
          display_order: member.displayOrder,
          is_active: member.isActive
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('メンバー作成エラー:', err)
      throw err
    }
  }

  const getFamilyById = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('家族取得エラー:', err)
      return null
    }
  }

  const getMembersByFamily = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('メンバー取得エラー:', err)
      return []
    }
  }

  // Task operations
  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          family_id: task.familyId,
          member_id: task.memberId,
          name: task.name,
          description: task.description,
          reward: task.reward,
          icon: task.icon,
          category: task.category,
          daily_limit: task.dailyLimit,
          sort_order: task.sortOrder,
          is_active: task.isActive
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('タスク作成エラー:', err)
      throw err
    }
  }

  const getTasksByFamily = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('タスク取得エラー:', err)
      return []
    }
  }

  // Task completion operations
  const createTaskCompletion = async (completion: Omit<TaskCompletion, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('task_completions')
        .insert([{
          task_id: completion.taskId,
          family_id: completion.familyId,
          member_id: completion.memberId,
          completed_at: completion.completedAt,
          reward: completion.reward
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('タスク完了記録エラー:', err)
      throw err
    }
  }

  const getTaskCompletionsByMember = async (familyId: string, memberId: string, startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('task_completions')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', memberId)

      if (startDate) query = query.gte('completed_at', startDate)
      if (endDate) query = query.lte('completed_at', endDate)

      const { data, error } = await query.order('completed_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('タスク完了記録取得エラー:', err)
      return []
    }
  }

  // Money balance operations
  const updateMoneyBalance = async (balance: Omit<MoneyBalance, 'id' | 'lastUpdated'>) => {
    try {
      const { data, error } = await supabase
        .from('money_balances')
        .upsert([{
          family_id: balance.familyId,
          member_id: balance.memberId,
          available: balance.available,
          allocated: balance.allocated,
          spent: balance.spent,
          total: balance.total
        }], {
          onConflict: 'family_id,member_id'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('残高更新エラー:', err)
      throw err
    }
  }

  const getMoneyBalance = async (familyId: string, memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('money_balances')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, return default balance
          return {
            id: '',
            familyId,
            memberId,
            available: 0,
            allocated: 0,
            spent: 0,
            total: 0,
            lastUpdated: new Date().toISOString()
          }
        }
        throw error
      }

      return {
        id: data.id,
        familyId: data.family_id,
        memberId: data.member_id,
        available: data.available,
        allocated: data.allocated,
        spent: data.spent,
        total: data.total,
        lastUpdated: data.last_updated
      }
    } catch (err) {
      console.error('残高取得エラー:', err)
      throw err
    }
  }

  return {
    isConnected,
    error,

    // Family operations
    createFamily,
    getFamilyByEmail,
    getFamilyById,

    // Member operations
    createMember,
    getMembersByFamily,

    // Task operations
    createTask,
    getTasksByFamily,

    // Task completion operations
    createTaskCompletion,
    getTaskCompletionsByMember,

    // Money balance operations
    updateMoneyBalance,
    getMoneyBalance
  }
}