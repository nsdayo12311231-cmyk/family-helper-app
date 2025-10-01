import { useState, useCallback } from 'react';
import type { MoneyBalance } from '../types';
import { generateUUID } from '../utils/uuid';

// Simple localStorage wrappers for compatibility
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

export const useMoneyManager = (familyId: string, memberId: string) => {
  const [balance, setBalance] = useState<MoneyBalance>(() => getMoneyBalance(familyId, memberId));

  const refreshBalance = useCallback(() => {
    const currentBalance = getMoneyBalance(familyId, memberId);
    setBalance(currentBalance);
    return currentBalance;
  }, [familyId, memberId]);

  const addMoney = useCallback((amount: number, reason?: string) => {
    const updatedBalance = {
      ...balance,
      available: balance.available + amount,
      total: balance.total + amount,
    };
    setBalance(updatedBalance);
    saveMoneyBalance(familyId, memberId, updatedBalance);
    return updatedBalance;
  }, [balance, familyId, memberId]);

  const spendMoney = useCallback((amount: number, reason?: string) => {
    if (balance.available < amount) {
      return false; // Insufficient funds
    }

    const updatedBalance = {
      ...balance,
      available: balance.available - amount,
      spent: balance.spent + amount,
    };
    setBalance(updatedBalance);
    saveMoneyBalance(familyId, memberId, updatedBalance);
    return updatedBalance;
  }, [balance, familyId, memberId]);

  const allocateMoney = useCallback((amount: number, reason?: string) => {
    if (balance.available < amount) {
      return false; // Insufficient funds
    }

    const updatedBalance = {
      ...balance,
      available: balance.available - amount,
      allocated: balance.allocated + amount,
    };
    setBalance(updatedBalance);
    saveMoneyBalance(familyId, memberId, updatedBalance);
    return updatedBalance;
  }, [balance, familyId, memberId]);

  const deallocateMoney = useCallback((amount: number, reason?: string) => {
    if (balance.allocated < amount) {
      return false; // Insufficient allocated funds
    }

    const updatedBalance = {
      ...balance,
      available: balance.available + amount,
      allocated: balance.allocated - amount,
    };
    setBalance(updatedBalance);
    saveMoneyBalance(familyId, memberId, updatedBalance);
    return updatedBalance;
  }, [balance, familyId, memberId]);

  const moveAllocatedToSpent = useCallback((amount: number, reason?: string) => {
    if (balance.allocated < amount) {
      return false; // Insufficient allocated funds
    }

    const updatedBalance = {
      ...balance,
      allocated: balance.allocated - amount,
      spent: balance.spent + amount,
    };
    setBalance(updatedBalance);
    saveMoneyBalance(familyId, memberId, updatedBalance);
    return updatedBalance;
  }, [balance, familyId, memberId]);

  const resetBalance = useCallback(() => {
    const resetBalance: MoneyBalance = {
      available: 0,
      allocated: 0,
      spent: 0,
      total: 0,
    };
    setBalance(resetBalance);
    saveMoneyBalance(familyId, memberId, resetBalance);
    return resetBalance;
  }, [familyId, memberId]);


  // 月ごとのペンディングマネー取得（補助関数）
  const getMonthlyPendingMoney = useCallback((year: number, month: number) => {
    try {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      const pending = localStorage.getItem(`pendingMoney-${familyId}-${memberId}-${monthKey}`);
      return pending ? parseInt(pending) : 0;
    } catch {
      return 0;
    }
  }, [familyId, memberId]);

  // 振り分け可能日時の判定
  const canAllocateMoney = useCallback(() => {
    const now = new Date();
    const currentDate = now.getDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 25日以降は前月分の振り分けが可能
    if (currentDate >= 25) {
      // 前月分のペンディングマネーがあるかチェック
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthPending = getMonthlyPendingMoney(prevYear, prevMonth);
      return prevMonthPending > 0;
    }

    // 25日前は前々月分までの振り分けのみ可能
    const prevPrevMonth = currentMonth <= 2 ? currentMonth + 10 : currentMonth - 2;
    const prevPrevYear = currentMonth <= 2 ? currentYear - 1 : currentYear;
    const prevPrevMonthPending = getMonthlyPendingMoney(prevPrevYear, prevPrevMonth);
    return prevPrevMonthPending > 0;
  }, [familyId, memberId, getMonthlyPendingMoney]);

  // 振り分け可能日の取得
  const getNextAllocationDate = useCallback(() => {
    const now = new Date();
    const currentDate = now.getDate();

    if (currentDate >= 25) {
      return null; // 既に振り分け可能
    }

    // 今月の25日を返す
    const nextAllocationDate = new Date(now.getFullYear(), now.getMonth(), 25);
    return nextAllocationDate;
  }, []);

  const getAvailableAmount = useCallback(() => balance.available, [balance.available]);
  const getAllocatedAmount = useCallback(() => balance.allocated, [balance.allocated]);
  const getSpentAmount = useCallback(() => balance.spent, [balance.spent]);
  const getTotalEarned = useCallback(() => balance.total, [balance.total]);

  const canAfford = useCallback((amount: number) => balance.available >= amount, [balance.available]);

  const getSavingsRate = useCallback(() => {
    if (balance.total === 0) return 0;
    const saved = balance.available + balance.allocated;
    return (saved / balance.total) * 100;
  }, [balance]);

  const getSpendingRate = useCallback(() => {
    if (balance.total === 0) return 0;
    return (balance.spent / balance.total) * 100;
  }, [balance]);

  // 振り分け可能なペンディングマネー計算（月ベース制限適用）
  const getAllocatablePendingMoney = useCallback(() => {
    const now = new Date();
    const currentDate = now.getDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let totalAllocatable = 0;

    console.log('📅 振り分け可能計算:', {
      現在日付: `${currentYear}-${currentMonth}-${currentDate}`,
      '25日以降か': currentDate >= 25
    });

    // ルール：今月分の振り分けができるのは次月25日以降
    // 9月27日現在 → 8月分まで振り分け可能、9月分は10月25日まで制限

    if (currentDate >= 25) {
      // 25日以降：前月分まで振り分け可能（当月分は来月25日まで制限）

      // 前月分を追加
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthAmount = getMonthlyPendingMoney(prevYear, prevMonth);
      totalAllocatable += prevMonthAmount;
      console.log(`  前月(${prevYear}-${prevMonth}):`, prevMonthAmount);

      // それより古い月も追加（前々月、前々々月...）
      for (let i = 2; i <= 12; i++) {
        const oldMonth = currentMonth - i;
        const oldYear = oldMonth <= 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = oldMonth <= 0 ? oldMonth + 12 : oldMonth;
        const oldMonthAmount = getMonthlyPendingMoney(oldYear, adjustedMonth);
        totalAllocatable += oldMonthAmount;
        if (oldMonthAmount > 0) {
          console.log(`  ${i}ヶ月前(${oldYear}-${adjustedMonth}):`, oldMonthAmount);
        }
      }

      // 当月分は含めない（来月25日まで制限）
      const currentMonthAmount = getMonthlyPendingMoney(currentYear, currentMonth);
      console.log(`  当月(${currentYear}-${currentMonth}): ${currentMonthAmount} (制限中)`);

      // デバッグ: 当月のLocalStorageキーを確認
      const currentMonthKey = `pendingMoney-${familyId}-${memberId}-${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      console.log(`  当月のキー: ${currentMonthKey}`);
      console.log(`  LocalStorageの値: ${localStorage.getItem(currentMonthKey)}`);

    } else {
      // 25日前：前々月分まで振り分け可能（前月分も当月分も制限）

      for (let i = 2; i <= 12; i++) {
        const oldMonth = currentMonth - i;
        const oldYear = oldMonth <= 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = oldMonth <= 0 ? oldMonth + 12 : oldMonth;
        const oldMonthAmount = getMonthlyPendingMoney(oldYear, adjustedMonth);
        totalAllocatable += oldMonthAmount;
        if (oldMonthAmount > 0) {
          console.log(`  ${i}ヶ月前(${oldYear}-${adjustedMonth}):`, oldMonthAmount);
        }
      }

      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthAmount = getMonthlyPendingMoney(prevYear, prevMonth);
      const currentMonthAmount = getMonthlyPendingMoney(currentYear, currentMonth);
      console.log(`  前月(${prevYear}-${prevMonth}): ${prevMonthAmount} (制限中)`);
      console.log(`  当月(${currentYear}-${currentMonth}): ${currentMonthAmount} (制限中)`);
    }

    console.log('  振り分け可能合計:', totalAllocatable);
    return totalAllocatable;
  }, [getMonthlyPendingMoney]);

  // シンプルなペンディングマネー取得（後方互換性維持）
  const getPendingMoney = useCallback(() => {
    try {
      const pending = localStorage.getItem(`pendingMoney-${familyId}-${memberId}`);
      return pending ? parseInt(pending) : 0;
    } catch {
      return 0;
    }
  }, [familyId, memberId]);

  // 月ベース制限を適用したペンディングマネー取得
  const getPendingMoneyWithDateRestriction = useCallback(() => {
    // 月ごとのデータがある場合は月ベース制限を適用
    const monthlyAllocatable = getAllocatablePendingMoney();
    const regularPending = getPendingMoney();

    const updatedMonthlyAllocatable = getAllocatablePendingMoney();

    // 結果ログ
    console.log('🎯 最終結果:');
    console.log('  振り分け可能金額:', updatedMonthlyAllocatable, '円');
    console.log('  8月分(振り分け可能):', getMonthlyPendingMoney(2025, 8), '円');
    console.log('  9月分(制限中):', getMonthlyPendingMoney(2025, 9), '円');

    // 月ベース制限を強制適用（9月分は10月25日まで制限）
    return updatedMonthlyAllocatable;
  }, [getAllocatablePendingMoney, getPendingMoney, getMonthlyPendingMoney]);

  const addPendingMoney = useCallback((amount: number) => {
    const currentPending = getPendingMoney();
    const newPending = currentPending + amount;
    localStorage.setItem(`pendingMoney-${familyId}-${memberId}`, newPending.toString());
    return newPending;
  }, [familyId, memberId, getPendingMoney]);

  const clearPendingMoney = useCallback(() => {
    localStorage.removeItem(`pendingMoney-${familyId}-${memberId}`);
    return 0;
  }, [familyId, memberId]);

  // 月ベース制限に対応した振り分け対象ペンディングマネーをクリア
  const clearAllocatablePendingMoney = useCallback(() => {
    const now = new Date();
    const currentDate = now.getDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log('🧹 振り分け対象ペンディングマネーをクリア中...');

    if (currentDate >= 25) {
      // 25日以降：前月分まで振り分け可能なのでそれらをクリア

      // 前月分をクリア
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthKey = `pendingMoney-${familyId}-${memberId}-${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
      const prevMonthAmount = localStorage.getItem(prevMonthKey);
      if (prevMonthAmount && parseInt(prevMonthAmount) > 0) {
        localStorage.removeItem(prevMonthKey);
        console.log(`  前月(${prevYear}-${prevMonth})をクリア: ${prevMonthAmount}円`);
      }

      // それより古い月も確認してクリア
      for (let i = 2; i <= 12; i++) {
        const oldMonth = currentMonth - i;
        const oldYear = oldMonth <= 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = oldMonth <= 0 ? oldMonth + 12 : oldMonth;
        const oldMonthKey = `pendingMoney-${familyId}-${memberId}-${oldYear}-${adjustedMonth.toString().padStart(2, '0')}`;
        const oldMonthAmount = localStorage.getItem(oldMonthKey);
        if (oldMonthAmount && parseInt(oldMonthAmount) > 0) {
          localStorage.removeItem(oldMonthKey);
          console.log(`  ${i}ヶ月前(${oldYear}-${adjustedMonth})をクリア: ${oldMonthAmount}円`);
        }
      }

    } else {
      // 25日前：前々月分まで振り分け可能なのでそれらをクリア

      for (let i = 2; i <= 12; i++) {
        const oldMonth = currentMonth - i;
        const oldYear = oldMonth <= 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = oldMonth <= 0 ? oldMonth + 12 : oldMonth;
        const oldMonthKey = `pendingMoney-${familyId}-${memberId}-${oldYear}-${adjustedMonth.toString().padStart(2, '0')}`;
        const oldMonthAmount = localStorage.getItem(oldMonthKey);
        if (oldMonthAmount && parseInt(oldMonthAmount) > 0) {
          localStorage.removeItem(oldMonthKey);
          console.log(`  ${i}ヶ月前(${oldYear}-${adjustedMonth})をクリア: ${oldMonthAmount}円`);
        }
      }
    }

    // 従来システムもクリア（後方互換性）
    localStorage.removeItem(`pendingMoney-${familyId}-${memberId}`);
    console.log('✅ ペンディングマネーのクリア完了');

    return 0;
  }, [familyId, memberId]);

  // 投資残高の管理
  const getInvestmentBalance = useCallback(() => {
    try {
      const investment = localStorage.getItem(`investment-${familyId}-${memberId}`);
      return investment ? parseInt(investment) : 0;
    } catch {
      return 0;
    }
  }, [familyId, memberId]);

  // 振り分け処理を実装（月ベース制限対応）
  const allocatePendingMoney = useCallback((allocation: { goal: number; cash: number; investment: number }) => {
    // 月ベース制限を適用したペンディングマネー取得
    const pendingAmount = getPendingMoneyWithDateRestriction();
    if (pendingAmount <= 0) return false;

    console.log('💰 振り分け処理開始:', {
      振り分け金額: pendingAmount,
      目標: allocation.goal,
      現金: allocation.cash,
      投資: allocation.investment
    });

    // 現金を追加
    const updatedBalance = {
      ...balance,
      available: balance.available + allocation.cash,
      total: balance.total + pendingAmount,
    };

    // 目標貯金は別途goalManagerで処理
    // 投資は投資残高に追加
    const currentInvestment = getInvestmentBalance();
    const newInvestment = currentInvestment + allocation.investment;
    localStorage.setItem(`investment-${familyId}-${memberId}`, newInvestment.toString());

    console.log('📈 投資残高更新:', {
      以前: currentInvestment,
      追加: allocation.investment,
      新残高: newInvestment
    });

    setBalance(updatedBalance);
    saveMoneyBalance(familyId, memberId, updatedBalance);

    // 月ベース制限対応のクリア処理を使用
    clearAllocatablePendingMoney();

    console.log('✅ 振り分け処理完了');
    return { allocation, pendingAmount };
  }, [balance, familyId, memberId, getPendingMoneyWithDateRestriction, getInvestmentBalance, clearAllocatablePendingMoney]);


  return {
    balance,
    refreshBalance,
    addMoney,
    spendMoney,
    allocateMoney,
    deallocateMoney,
    moveAllocatedToSpent,
    resetBalance,
    getAvailableAmount,
    getAllocatedAmount,
    getSpentAmount,
    getTotalEarned,
    canAfford,
    getSavingsRate,
    getSpendingRate,
    // 振り分け待ち関連
    getPendingMoney,
    addPendingMoney,
    clearPendingMoney,
    allocatePendingMoney,
    getInvestmentBalance,
    // 振り分けルール関連
    canAllocateMoney,
    getNextAllocationDate,
    getMonthlyPendingMoney,
    // 月ベース制限関連
    getAllocatablePendingMoney,
    getPendingMoneyWithDateRestriction,
    clearAllocatablePendingMoney,
  };
};