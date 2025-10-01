import { useState, useCallback } from 'react';
import type { EarningRecord } from '../types';
import { generateUUID } from '../utils/uuid';

// localStorage wrappers
const getEarningRecords = (familyId: string, memberId: string): EarningRecord[] => {
  try {
    const records = localStorage.getItem(`earnings-${familyId}-${memberId}`);
    return records ? JSON.parse(records) : [];
  } catch {
    return [];
  }
};

const saveEarningRecords = (familyId: string, memberId: string, records: EarningRecord[]): void => {
  localStorage.setItem(`earnings-${familyId}-${memberId}`, JSON.stringify(records));
};

export const useEarningManager = (familyId: string, memberId: string) => {
  const [earnings, setEarnings] = useState<EarningRecord[]>(() =>
    getEarningRecords(familyId, memberId)
  );

  // 新しい獲得記録を追加
  const addEarning = useCallback((amount: number, source: 'task_completion' | 'bonus' | 'manual', sourceId?: string) => {
    const now = new Date();
    const earnedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const earnedMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM

    const newEarning: EarningRecord = {
      id: generateUUID(),
      familyId,
      memberId,
      amount,
      earnedDate,
      earnedMonth,
      source,
      sourceId,
      status: 'pending',
      createdAt: now.toISOString(),
    };

    const updatedEarnings = [...earnings, newEarning];
    setEarnings(updatedEarnings);
    saveEarningRecords(familyId, memberId, updatedEarnings);

    return newEarning;
  }, [earnings, familyId, memberId]);

  // 指定月の振り分け可能な獲得記録を取得
  const getAllocatableEarnings = useCallback((targetMonth: string) => {
    return earnings.filter(earning =>
      earning.earnedMonth === targetMonth && earning.status === 'pending'
    );
  }, [earnings]);

  // 振り分け可能な合計金額を取得
  const getAllocatableAmount = useCallback((targetMonth: string) => {
    return getAllocatableEarnings(targetMonth).reduce((total, earning) => total + earning.amount, 0);
  }, [getAllocatableEarnings]);

  // 振り分け実行（指定月の記録をallocatedに変更）
  const allocateEarnings = useCallback((targetMonth: string, allocatedAmount: number) => {
    const allocatableEarnings = getAllocatableEarnings(targetMonth);
    const totalAllocatable = allocatableEarnings.reduce((total, earning) => total + earning.amount, 0);

    if (allocatedAmount > totalAllocatable) {
      return false; // 振り分け可能額を超えている
    }

    let remainingAmount = allocatedAmount;
    const updatedEarnings = earnings.map(earning => {
      if (earning.earnedMonth === targetMonth && earning.status === 'pending' && remainingAmount > 0) {
        if (earning.amount <= remainingAmount) {
          remainingAmount -= earning.amount;
          return { ...earning, status: 'allocated' as const, allocatedAt: new Date().toISOString() };
        }
      }
      return earning;
    });

    setEarnings(updatedEarnings);
    saveEarningRecords(familyId, memberId, updatedEarnings);

    return true;
  }, [earnings, familyId, memberId, getAllocatableEarnings]);

  // 振り分け可能な月のリストを取得
  const getAllocatableMonths = useCallback(() => {
    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // 振り分け可能な月を判定
    const availableMonths: string[] = [];

    if (currentDate >= 25) {
      // 25日以降は前月分まで振り分け可能
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonthStr = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}`;
      availableMonths.push(prevMonthStr);
    } else {
      // 25日前は前々月分まで振り分け可能
      const prevPrevMonth = now.getMonth() <= 1 ? now.getMonth() + 10 : now.getMonth() - 2;
      const prevPrevYear = now.getMonth() <= 1 ? now.getFullYear() - 1 : now.getFullYear();
      const prevPrevMonthStr = `${prevPrevYear}-${(prevPrevMonth + 1).toString().padStart(2, '0')}`;
      availableMonths.push(prevPrevMonthStr);
    }

    // 実際にpendingデータがある古い月も追加
    const pendingMonths = [...new Set(earnings
      .filter(e => e.status === 'pending')
      .map(e => e.earnedMonth)
      .filter(month => month < currentMonth)
    )];

    // 全ての振り分け可能月を結合
    const allAvailableMonths = [...new Set([...availableMonths, ...pendingMonths])].sort();

    console.log('🔍 getAllocatableMonths debug:');
    console.log('  現在日付:', currentDate);
    console.log('  現在月:', currentMonth);
    console.log('  計算された振り分け可能月:', availableMonths);
    console.log('  pendingデータがある月:', pendingMonths);
    console.log('  最終結果:', allAvailableMonths);

    return allAvailableMonths;
  }, [earnings]);

  // 現在振り分け可能かどうか
  const canAllocateNow = useCallback(() => {
    const allocatableMonths = getAllocatableMonths();
    return allocatableMonths.some(month => getAllocatableAmount(month) > 0);
  }, [getAllocatableMonths, getAllocatableAmount]);

  // 次回振り分け可能日を取得
  const getNextAllocationDate = useCallback(() => {
    const now = new Date();
    const currentDate = now.getDate();

    if (currentDate >= 25) {
      return null; // 既に振り分け可能期間
    }

    return new Date(now.getFullYear(), now.getMonth(), 25);
  }, []);

  return {
    earnings,
    addEarning,
    getAllocatableEarnings,
    getAllocatableAmount,
    allocateEarnings,
    getAllocatableMonths,
    canAllocateNow,
    getNextAllocationDate,
  };
};