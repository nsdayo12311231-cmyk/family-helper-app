import { useState, useCallback } from 'react';

// 投資記録の型定義
export interface InvestmentRecord {
  id: string;
  familyId: string;
  memberId: string;
  amount: number;
  investedDate: string;
  investedMonth: string;
  source: 'allocation'; // 振り分けからの投資のみ
  sourceId: string; // 振り分け処理のID
  createdAt: string;
}

// LocalStorage操作
const getInvestmentRecords = (familyId: string, memberId: string): InvestmentRecord[] => {
  try {
    const records = localStorage.getItem(`investmentRecords-${familyId}-${memberId}`);
    return records ? JSON.parse(records) : [];
  } catch {
    return [];
  }
};

const saveInvestmentRecords = (familyId: string, memberId: string, records: InvestmentRecord[]): void => {
  localStorage.setItem(`investmentRecords-${familyId}-${memberId}`, JSON.stringify(records));
};

export const useInvestmentManager = (familyId: string, memberId: string) => {
  const [investmentRecords, setInvestmentRecords] = useState<InvestmentRecord[]>(() =>
    getInvestmentRecords(familyId, memberId)
  );

  // 投資記録を追加（振り分け時に呼び出し）
  const addInvestmentRecord = useCallback((amount: number, sourceId: string) => {
    if (amount <= 0) return;

    const now = new Date();
    const investedDate = now.toISOString().split('T')[0];
    const investedMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const newRecord: InvestmentRecord = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      familyId,
      memberId,
      amount,
      investedDate,
      investedMonth,
      source: 'allocation',
      sourceId,
      createdAt: now.toISOString(),
    };

    const updatedRecords = [newRecord, ...investmentRecords];
    setInvestmentRecords(updatedRecords);
    saveInvestmentRecords(familyId, memberId, updatedRecords);

    console.log(`📈 投資記録追加: ${amount}円 (${investedDate})`);
    return newRecord;
  }, [familyId, memberId, investmentRecords]);

  // 投資履歴取得
  const getInvestmentHistory = useCallback(() => {
    return investmentRecords.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [investmentRecords]);

  // 月別投資額取得
  const getMonthlyInvestments = useCallback((year: number, month: number) => {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    return investmentRecords
      .filter(record => record.investedMonth === monthKey)
      .reduce((total, record) => total + record.amount, 0);
  }, [investmentRecords]);

  // 投資開始日取得
  const getFirstInvestmentDate = useCallback(() => {
    if (investmentRecords.length === 0) return null;
    const sortedRecords = investmentRecords.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return new Date(sortedRecords[0].investedDate);
  }, [investmentRecords]);

  // 運用期間計算
  const getInvestmentDuration = useCallback(() => {
    const firstDate = getFirstInvestmentDate();
    if (!firstDate) return 0;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [getFirstInvestmentDate]);

  return {
    investmentRecords,
    addInvestmentRecord,
    getInvestmentHistory,
    getMonthlyInvestments,
    getFirstInvestmentDate,
    getInvestmentDuration,
  };
};