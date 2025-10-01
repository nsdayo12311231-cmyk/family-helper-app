// 基本型定義

export interface Family {
  id: string;
  name: string;
  adminEmail: string;
  adminPassword: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  familyId: string;
  name: string;
  avatar: string;
  role: 'admin' | 'child';
  theme: 'boy' | 'girl';
  textStyle: 'kanji' | 'hiragana';
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  familyId: string;
  memberId: string;
  name: string;
  description?: string;
  reward: number;
  icon: string;
  category?: string;
  dailyLimit: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  familyId: string;
  memberId: string;
  completedAt: string;
  reward: number;
}

// お小遣い獲得記録（振り分け状態管理）
export interface EarningRecord {
  id: string;
  familyId: string;
  memberId: string;
  amount: number;
  earnedDate: string; // YYYY-MM-DD
  earnedMonth: string; // YYYY-MM（振り分け判定用）
  source: 'task_completion' | 'bonus' | 'manual';
  sourceId?: string; // タスク完了の場合はcompletionId
  status: 'pending' | 'allocated' | 'expired';
  allocatedAt?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  familyId: string;
  memberId: string;
  title: string;
  description?: string;
  targetAmount: number;
  icon: string;
  status: 'active' | 'achieved' | 'paused';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoneyAllocation {
  id: string;
  familyId: string;
  memberId: string;
  goalSavingRate: number; // 0-100
  freeMoneyRate: number; // 0-100
  longSavingRate: number; // 0-100
  investmentRate: number; // 0-100
  donationRate: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface MoneyBalance {
  id: string;
  familyId: string;
  memberId: string;
  available: number;
  allocated: number;
  spent: number;
  total: number;
  lastUpdated: string;
}

export interface Investment {
  id: string;
  familyId: string;
  memberId: string;
  principalAmount: number;
  currentValue: number;
  profitLoss: number;
  investmentDate: string;
  investmentType: string;
  notes?: string;
  createdAt: string;
}

export interface MoneyTransaction {
  id: string;
  familyId: string;
  memberId: string;
  transactionType: 'task_reward' | 'manual_transfer' | 'investment' | 'spending';
  fromCategory?: string;
  toCategory?: string;
  amount: number;
  description: string;
  transactionDate: string;
  notes?: string;
  createdAt: string;
}

export interface BonusSetting {
  id: string;
  familyId: string;
  memberId?: string; // null = 全員対象
  bonusType: 'consecutive_days' | 'monthly_target' | 'special_achievement';
  conditionValue: number;
  rewardAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  familyId: string;
  memberId?: string; // null = 家族全体設定
  category: string;
  settingKey: string;
  settingValue: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  familyId: string;
  memberId: string;
  activityType: string;
  activityData: string; // JSON string
  createdAt: string;
}

// UI用の型
export interface NavigationTab {
  id: string;
  icon: string;
  label: string;
  path: string;
}

export interface CompletionResult {
  success: boolean;
  message: string;
  reward: number;
  allocation: {
    goalSaving: number;
    freeMoney: number;
    longSaving: number;
    investment: number;
    donation: number;
  };
}

export interface DailyStats {
  completedTasks: number;
  earnedMoney: number;
  activeTasks: number;
}

export interface MonthlyStats {
  completedDays: number;
  totalCompletions: number;
  totalEarnings: number;
  averageDailyEarnings: number;
}

// 振り分け用のカテゴリ
export type MoneyCategory = 'goalSaving' | 'freeMoney' | 'longSaving' | 'investment' | 'donation';

// テーマ関連
export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

// エラー型
export interface AppError {
  code: string;
  message: string;
  details?: any;
}