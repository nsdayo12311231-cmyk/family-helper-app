import { useState, useCallback } from 'react';
import type { Goal, MoneyBalance } from '../types';
import { generateUUID } from '../utils/uuid';

// Simple localStorage wrappers for compatibility
const getGoals = (familyId: string, memberId: string): Goal[] => {
  try {
    const goals = localStorage.getItem(`goals-${familyId}-${memberId}`);
    return goals ? JSON.parse(goals) : [];
  } catch {
    return [];
  }
};

const saveGoals = (familyId: string, memberId: string, goals: Goal[]): void => {
  localStorage.setItem(`goals-${familyId}-${memberId}`, JSON.stringify(goals));
};

const getMoneyBalance = (familyId: string, memberId: string): MoneyBalance => {
  try {
    const balance = localStorage.getItem(`balance-${familyId}-${memberId}`);
    return balance ? JSON.parse(balance) : { available: 0, allocated: 0, spent: 0, total: 0 };
  } catch {
    return { available: 0, allocated: 0, spent: 0, total: 0 };
  }
};

const saveMoneyBalance = (familyId: string, memberId: string, balance: MoneyBalance): void => {
  localStorage.setItem(`balance-${familyId}-${memberId}`, JSON.stringify(balance));
};

export const useGoalManager = (familyId: string, memberId: string) => {
  const [goals, setGoals] = useState<Goal[]>(() => getGoals(familyId, memberId));

  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      currentAmount: 0,
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    saveGoals(familyId, memberId, updatedGoals);

    return newGoal;
  }, [goals, familyId, memberId]);

  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    setGoals(updatedGoals);
    saveGoals(familyId, memberId, updatedGoals);
  }, [goals, familyId, memberId]);

  const deleteGoal = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return false;

    // Return allocated money to available balance
    if (goal.currentAmount > 0) {
      const currentBalance = getMoneyBalance(familyId, memberId);
      const updatedBalance = {
        ...currentBalance,
        available: currentBalance.available + goal.currentAmount,
        allocated: currentBalance.allocated - goal.currentAmount,
      };
      saveMoneyBalance(familyId, memberId, updatedBalance);
    }

    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);
    saveGoals(familyId, memberId, updatedGoals);

    return true;
  }, [goals, familyId, memberId]);

  const allocateToGoal = useCallback((goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return false;

    const currentBalance = getMoneyBalance(familyId, memberId);
    if (currentBalance.available < amount) return false;

    const newCurrentAmount = goal.currentAmount + amount;
    if (newCurrentAmount > goal.targetAmount) return false;

    // Update goal
    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, currentAmount: newCurrentAmount } : g
    );
    setGoals(updatedGoals);
    saveGoals(familyId, memberId, updatedGoals);

    // Update balance
    const updatedBalance = {
      ...currentBalance,
      available: currentBalance.available - amount,
      allocated: currentBalance.allocated + amount,
    };
    saveMoneyBalance(familyId, memberId, updatedBalance);

    return true;
  }, [goals, familyId, memberId]);

  // 目標貯金残高の管理（目標設定に依存しない）
  const getGoalSavingsBalance = useCallback(() => {
    try {
      const balance = localStorage.getItem(`goalSavings-${familyId}-${memberId}`);
      if (balance === null) {
        // 初回アクセス時は0で初期化
        localStorage.setItem(`goalSavings-${familyId}-${memberId}`, '0');
        return 0;
      }
      return balance ? parseInt(balance) : 0;
    } catch {
      return 0;
    }
  }, [familyId, memberId]);

  const addToGoalSavings = useCallback((amount: number) => {
    const currentBalance = getGoalSavingsBalance();
    const newBalance = currentBalance + amount;
    localStorage.setItem(`goalSavings-${familyId}-${memberId}`, newBalance.toString());
    return newBalance;
  }, [familyId, memberId, getGoalSavingsBalance]);

  // 振り分け専用：目標があれば目標に、なければ目標貯金残高に追加
  const addToGoalFromAllocation = useCallback((amount: number) => {
    const activeGoals = goals.filter(g => g.isActive !== false);

    if (activeGoals.length > 0) {
      // アクティブな目標がある場合：最初の目標に追加
      const goal = activeGoals[0];
      const newCurrentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
      const updatedGoals = goals.map(g =>
        g.id === goal.id ? { ...g, currentAmount: newCurrentAmount } : g
      );
      setGoals(updatedGoals);
      saveGoals(familyId, memberId, updatedGoals);
      return true;
    } else {
      // 目標がない場合：目標貯金残高に追加
      addToGoalSavings(amount);
      return true;
    }
  }, [goals, familyId, memberId, addToGoalSavings]);

  const withdrawFromGoal = useCallback((goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || goal.currentAmount < amount) return false;

    // Update goal
    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, currentAmount: g.currentAmount - amount } : g
    );
    setGoals(updatedGoals);
    saveGoals(familyId, memberId, updatedGoals);

    // Update balance
    const currentBalance = getMoneyBalance(familyId, memberId);
    const updatedBalance = {
      ...currentBalance,
      available: currentBalance.available + amount,
      allocated: currentBalance.allocated - amount,
    };
    saveMoneyBalance(familyId, memberId, updatedBalance);

    return true;
  }, [goals, familyId, memberId]);

  const completeGoal = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || goal.currentAmount < goal.targetAmount) return false;

    // Mark goal as completed
    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, isCompleted: true, completedAt: new Date().toISOString() } : g
    );
    setGoals(updatedGoals);
    saveGoals(familyId, memberId, updatedGoals);

    // Move allocated money to spent
    const currentBalance = getMoneyBalance(familyId, memberId);
    const updatedBalance = {
      ...currentBalance,
      allocated: currentBalance.allocated - goal.currentAmount,
      spent: currentBalance.spent + goal.currentAmount,
    };
    saveMoneyBalance(familyId, memberId, updatedBalance);

    return true;
  }, [goals, familyId, memberId]);

  const getActiveGoals = useCallback(() => {
    return goals.filter(goal => !goal.isCompleted);
  }, [goals]);

  const getCompletedGoals = useCallback(() => {
    return goals.filter(goal => goal.isCompleted);
  }, [goals]);

  const getGoalProgress = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }, [goals]);

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    allocateToGoal,
    addToGoalFromAllocation,
    withdrawFromGoal,
    completeGoal,
    getActiveGoals,
    getCompletedGoals,
    getGoalProgress,
    getGoalSavingsBalance,
    addToGoalSavings,
  };
};