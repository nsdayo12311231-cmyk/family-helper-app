// グローバルイベントシステム for Money Updates

export const MoneyEvents = {
  TASK_COMPLETED: 'moneyTaskCompleted',
  TASK_COMPLETION_REMOVED: 'taskCompletionRemoved',
  COMPLETIONS_UPDATED: 'completionsUpdated',
  MONEY_ALLOCATED: 'moneyAllocated',
  GOAL_UPDATED: 'goalUpdated',
  INVESTMENT_UPDATED: 'investmentUpdated',
  BALANCE_UPDATED: 'balanceUpdated',
} as const;

export type MoneyEventType = typeof MoneyEvents[keyof typeof MoneyEvents];

// イベントデータの型定義
export interface MoneyEventData {
  familyId: string;
  memberId: string;
  amount?: number;
  type?: string;
  timestamp: string;
}

// イベント送信ヘルパー
export const emitMoneyEvent = (eventType: MoneyEventType, data: MoneyEventData) => {
  console.log(`🔔 MoneyEvent発火: ${eventType}`, data);
  window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
};

// イベント受信ヘルパー
export const onMoneyEvent = (
  eventType: MoneyEventType,
  handler: (data: MoneyEventData) => void
) => {
  const eventHandler = (event: CustomEvent<MoneyEventData>) => {
    handler(event.detail);
  };

  window.addEventListener(eventType, eventHandler as EventListener);

  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener(eventType, eventHandler as EventListener);
  };
};