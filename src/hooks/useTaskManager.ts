import { useState, useCallback, useEffect } from 'react';
import type { Task, TaskCompletion, MoneyBalance, EarningRecord } from '../types';
import { emitMoneyEvent, MoneyEvents } from '../utils/moneyEvents';
import { generateUUID } from '../utils/uuid';

// Simple localStorage wrappers for compatibility
const getTasks = (familyId: string): Task[] => {
  try {
    const tasks = localStorage.getItem(`tasks-${familyId}`);
    return tasks ? JSON.parse(tasks) : [];
  } catch {
    return [];
  }
};

const saveTasks = (familyId: string, tasks: Task[]): void => {
  localStorage.setItem(`tasks-${familyId}`, JSON.stringify(tasks));
};

const getTaskCompletions = (familyId: string, memberId: string): TaskCompletion[] => {
  try {
    const completions = localStorage.getItem(`completions-${familyId}-${memberId}`);
    return completions ? JSON.parse(completions) : [];
  } catch {
    return [];
  }
};

const saveTaskCompletions = (familyId: string, memberId: string, completions: TaskCompletion[]): void => {
  localStorage.setItem(`completions-${familyId}-${memberId}`, JSON.stringify(completions));
};

const getMoneyBalance = (familyId: string, memberId: string): MoneyBalance => {
  try {
    const balance = localStorage.getItem(`balance-${familyId}-${memberId}`);
    if (balance) {
      const parsed = JSON.parse(balance);
      // 古いフォーマットの場合は新しいフォーマットに変換
      if (!parsed.id) {
        return {
          id: generateUUID(),
          familyId,
          memberId,
          available: parsed.available || 0,
          allocated: parsed.allocated || 0,
          spent: parsed.spent || 0,
          total: parsed.total || 0,
          lastUpdated: new Date().toISOString()
        };
      }
      return parsed;
    }
    return {
      id: generateUUID(),
      familyId,
      memberId,
      available: 0,
      allocated: 0,
      spent: 0,
      total: 0,
      lastUpdated: new Date().toISOString()
    };
  } catch {
    return {
      id: generateUUID(),
      familyId,
      memberId,
      available: 0,
      allocated: 0,
      spent: 0,
      total: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};

const saveMoneyBalance = (familyId: string, memberId: string, balance: MoneyBalance): void => {
  localStorage.setItem(`balance-${familyId}-${memberId}`, JSON.stringify(balance));
};

// EarningRecord管理用ヘルパー
const addEarningRecord = (familyId: string, memberId: string, amount: number, completionId: string): void => {
  try {
    const records = localStorage.getItem(`earnings-${familyId}-${memberId}`);
    const earnings: EarningRecord[] = records ? JSON.parse(records) : [];

    const now = new Date();
    const earnedDate = now.toISOString().split('T')[0];
    const earnedMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const newEarning: EarningRecord = {
      id: generateUUID(),
      familyId,
      memberId,
      amount,
      earnedDate,
      earnedMonth,
      source: 'task_completion',
      sourceId: completionId,
      status: 'pending',
      createdAt: now.toISOString(),
    };

    const updatedEarnings = [...earnings, newEarning];
    localStorage.setItem(`earnings-${familyId}-${memberId}`, JSON.stringify(updatedEarnings));
  } catch (error) {
    console.error('Failed to add earning record:', error);
  }
};

export const useTaskManager = (familyId: string, memberId: string) => {
  const [tasks, setTasks] = useState<Task[]>(() => getTasks(familyId));
  const [completions, setCompletions] = useState<TaskCompletion[]>(() =>
    getTaskCompletions(familyId, memberId)
  );
  const [isCompleting, setIsCompleting] = useState(false);

  // memberIdが変わった時にcompletionsを再取得
  useEffect(() => {
    if (familyId && memberId) {
      const newCompletions = getTaskCompletions(familyId, memberId);
      setCompletions(newCompletions);
    }
  }, [familyId, memberId]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      // memberIdが指定されていない場合は現在のmemberIdを使用（後方互換性）
      memberId: taskData.memberId || memberId,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(familyId, updatedTasks);

    return newTask;
  }, [tasks, familyId, memberId]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    saveTasks(familyId, updatedTasks);
  }, [tasks, familyId]);

  const deleteTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(familyId, updatedTasks);
  }, [tasks, familyId]);

  const completeTask = useCallback((taskId: string) => {
    // 重複防止: 既に処理中の場合は無視
    if (isCompleting) {
      console.log('タスク完了処理中のため、重複リクエストを無視します');
      return false;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    // 重複防止フラグを設定
    setIsCompleting(true);

    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = completions.filter(c =>
      c.taskId === taskId && c.completedAt.startsWith(today)
    ).length;

    if (todayCompletions >= task.maxCompletionsPerDay) {
      setIsCompleting(false); // フラグをリセット
      return false; // Already completed maximum times today
    }

    // Create completion record
    const completion: TaskCompletion = {
      id: generateUUID(),
      taskId,
      familyId,
      memberId,
      completedAt: new Date().toISOString(),
      reward: task.reward,
    };

    const updatedCompletions = [...completions, completion];
    setCompletions(updatedCompletions);
    saveTaskCompletions(familyId, memberId, updatedCompletions);

    // EarningRecordに記録（新システム）
    addEarningRecord(familyId, memberId, task.reward, completion.id);

    // 月ごとのペンディングマネーに記録
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyPendingKey = `pendingMoney-${familyId}-${memberId}-${currentMonth}`;

    const currentMonthlyPending = localStorage.getItem(monthlyPendingKey);
    const monthlyPendingAmount = currentMonthlyPending ? parseInt(currentMonthlyPending) : 0;
    const newMonthlyPendingAmount = monthlyPendingAmount + task.reward;
    localStorage.setItem(monthlyPendingKey, newMonthlyPendingAmount.toString());

    // 従来のペンディングマネーも更新（表示用だが、今後は月ごとから計算）
    const currentPending = localStorage.getItem(`pendingMoney-${familyId}-${memberId}`);
    const pendingAmount = currentPending ? parseInt(currentPending) : 0;
    const newPendingAmount = pendingAmount + task.reward;
    localStorage.setItem(`pendingMoney-${familyId}-${memberId}`, newPendingAmount.toString());

    // 重複防止フラグをリセット
    setIsCompleting(false);

    return true;
  }, [tasks, completions, familyId, memberId, isCompleting]);

  const getTodayCompletions = useCallback((taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return completions.filter(c =>
      c.taskId === taskId && c.completedAt.startsWith(today)
    ).length;
  }, [completions]);

  const getTodayEarnings = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return completions
      .filter(c => c.completedAt.startsWith(today))
      .reduce((total, c) => total + c.reward, 0);
  }, [completions]);

  const getTodayCompletionsCount = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return completions.filter(c => c.completedAt.startsWith(today)).length;
  }, [completions]);

  const getAvailableTasks = useCallback(() => {
    return tasks.filter(task => {
      if (!task.isActive) return false;
      // memberIdが現在のメンバーと一致するかチェック
      if (task.memberId !== memberId) return false;
      const todayCompletions = getTodayCompletions(task.id);
      return todayCompletions < task.maxCompletionsPerDay;
    });
  }, [tasks, getTodayCompletions, memberId]);

  // 完了記録を削除する
  const removeCompletion = useCallback((completionId: string) => {
    const completionToRemove = completions.find(c => c.id === completionId);
    if (!completionToRemove) return;

    const updatedCompletions = completions.filter(c => c.id !== completionId);
    setCompletions(updatedCompletions);
    saveTaskCompletions(familyId, memberId, updatedCompletions);

    // ペンディングマネーから減額
    const completionDate = new Date(completionToRemove.completedAt);
    const earnedMonth = `${completionDate.getFullYear()}-${(completionDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyPendingKey = `pendingMoney-${familyId}-${memberId}-${earnedMonth}`;

    const currentMonthlyPending = localStorage.getItem(monthlyPendingKey);
    const monthlyPendingAmount = currentMonthlyPending ? parseInt(currentMonthlyPending) : 0;
    const newMonthlyPendingAmount = Math.max(0, monthlyPendingAmount - completionToRemove.reward);
    localStorage.setItem(monthlyPendingKey, newMonthlyPendingAmount.toString());

    // 従来のペンディングマネーも更新
    const currentPending = localStorage.getItem(`pendingMoney-${familyId}-${memberId}`);
    const pendingAmount = currentPending ? parseInt(currentPending) : 0;
    const newPendingAmount = Math.max(0, pendingAmount - completionToRemove.reward);
    localStorage.setItem(`pendingMoney-${familyId}-${memberId}`, newPendingAmount.toString());

    // お金イベントを発火
    emitMoneyEvent(MoneyEvents.TASK_COMPLETION_REMOVED, {
      familyId,
      memberId,
      completionId
    });
  }, [completions, familyId, memberId]);

  // 特定の日付・タスクの完了記録を調整する（管理者用）
  const adjustCompletions = useCallback((taskId: string, targetDate: string, targetCount: number) => {
    const dateCompletions = completions.filter(c =>
      c.taskId === taskId && c.completedAt.startsWith(targetDate)
    );
    const currentCount = dateCompletions.length;

    if (targetCount > currentCount) {
      // 完了記録を追加
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newCompletions = [...completions];

        for (let i = 0; i < (targetCount - currentCount); i++) {
          const adjustedTime = new Date(targetDate + 'T12:00:00');
          adjustedTime.setMinutes(adjustedTime.getMinutes() + i); // 時間を少しずらす

          const completion: TaskCompletion = {
            id: generateUUID(),
            taskId,
            familyId,
            memberId,
            completedAt: adjustedTime.toISOString(),
            reward: task.reward,
          };

          newCompletions.push(completion);

          // EarningRecordに記録
          addEarningRecord(familyId, memberId, task.reward, completion.id);

          // 月ごとのペンディングマネーに記録
          const earnedMonth = `${adjustedTime.getFullYear()}-${(adjustedTime.getMonth() + 1).toString().padStart(2, '0')}`;
          const monthlyPendingKey = `pendingMoney-${familyId}-${memberId}-${earnedMonth}`;

          const currentMonthlyPending = localStorage.getItem(monthlyPendingKey);
          const monthlyPendingAmount = currentMonthlyPending ? parseInt(currentMonthlyPending) : 0;
          const newMonthlyPendingAmount = monthlyPendingAmount + task.reward;
          localStorage.setItem(monthlyPendingKey, newMonthlyPendingAmount.toString());

          // 従来のペンディングマネーも更新
          const currentPending = localStorage.getItem(`pendingMoney-${familyId}-${memberId}`);
          const pendingAmount = currentPending ? parseInt(currentPending) : 0;
          const newPendingAmount = pendingAmount + task.reward;
          localStorage.setItem(`pendingMoney-${familyId}-${memberId}`, newPendingAmount.toString());
        }

        setCompletions(newCompletions);
        saveTaskCompletions(familyId, memberId, newCompletions);
      }
    } else if (targetCount < currentCount) {
      // 完了記録を削除
      const toRemove = currentCount - targetCount;
      const sortedCompletions = dateCompletions.sort((a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      for (let i = 0; i < toRemove; i++) {
        if (sortedCompletions[i]) {
          removeCompletion(sortedCompletions[i].id);
        }
      }
    }
  }, [completions, tasks, removeCompletion, familyId, memberId]);

  // 強制的にcompletionsを再読み込みする関数
  const refreshCompletions = useCallback(() => {
    console.log(`🔍 refreshCompletions実行開始:`);
    console.log(`  familyId: ${familyId}`);
    console.log(`  memberId: ${memberId}`);
    console.log(`  localStorageキー: completions-${familyId}-${memberId}`);

    const newCompletions = getTaskCompletions(familyId, memberId);
    console.log(`  取得したcompletions:`, newCompletions);

    setCompletions(newCompletions);
    console.log(`🔄 ${memberId}の完了記録を再読み込み: ${newCompletions.length}件`);
  }, [familyId, memberId]);

  return {
    tasks,
    completions,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    removeCompletion,
    adjustCompletions,
    getTodayCompletions,
    getTodayEarnings,
    getTodayCompletionsCount,
    getAvailableTasks,
    refreshCompletions, // 強制再読み込み機能を公開
    isCompleting, // 重複防止フラグを公開
  };
};