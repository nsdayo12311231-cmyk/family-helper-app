import type { Family, Member, Task, TaskCompletion, Goal, MoneyAllocation, MoneyBalance, Investment, MoneyTransaction } from '../types';

// LocalStorage キー定数
const STORAGE_KEYS = {
  FAMILY: 'family_helper_family',
  MEMBERS: 'family_helper_members',
  TASKS: 'family_helper_tasks',
  TASK_COMPLETIONS: 'family_helper_task_completions',
  GOALS: 'family_helper_goals',
  MONEY_ALLOCATIONS: 'family_helper_money_allocations',
  MONEY_BALANCES: 'family_helper_money_balances',
  INVESTMENTS: 'family_helper_investments',
  MONEY_TRANSACTIONS: 'family_helper_money_transactions',
  BONUS_SETTINGS: 'family_helper_bonus_settings',
  SETTINGS: 'family_helper_settings',
  CURRENT_FAMILY_ID: 'family_helper_current_family_id',
  CURRENT_MEMBER_ID: 'family_helper_current_member_id',
  ADMIN_PASSCODE: 'family_helper_admin_passcode',
} as const;

// エラーハンドリング付きの基本操作
class LocalStorageManager {
  // データの保存
  private setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('LocalStorage save error:', error);
      throw new Error('データの保存に失敗しました');
    }
  }

  // データの読み込み
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage load error:', error);
      return defaultValue;
    }
  }

  // データの削除
  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  }

  // Family関連
  saveFamily(family: Family): void {
    this.setItem(STORAGE_KEYS.FAMILY, family);
    this.setItem(STORAGE_KEYS.CURRENT_FAMILY_ID, family.id);
  }

  getFamily(): Family | null {
    return this.getItem<Family | null>(STORAGE_KEYS.FAMILY, null);
  }

  getCurrentFamilyId(): string | null {
    return this.getItem<string | null>(STORAGE_KEYS.CURRENT_FAMILY_ID, null);
  }

  // Members関連
  saveMembers(members: Member[]): void {
    this.setItem(STORAGE_KEYS.MEMBERS, members);
  }

  getMembers(): Member[] {
    return this.getItem<Member[]>(STORAGE_KEYS.MEMBERS, []);
  }

  getMembersByFamilyId(familyId: string): Member[] {
    const members = this.getMembers();
    return members.filter(member => member.familyId === familyId);
  }

  addMember(member: Member): void {
    const members = this.getMembers();
    members.push(member);
    this.saveMembers(members);
  }

  updateMember(updatedMember: Member): void {
    const members = this.getMembers();
    const index = members.findIndex(m => m.id === updatedMember.id);
    if (index !== -1) {
      members[index] = updatedMember;
      this.saveMembers(members);
    }
  }

  deleteMember(memberId: string): void {
    const members = this.getMembers();
    const filteredMembers = members.filter(m => m.id !== memberId);
    this.saveMembers(filteredMembers);
  }

  // 現在選択中のメンバー
  setCurrentMemberId(memberId: string): void {
    this.setItem(STORAGE_KEYS.CURRENT_MEMBER_ID, memberId);
  }

  getCurrentMemberId(): string | null {
    return this.getItem<string | null>(STORAGE_KEYS.CURRENT_MEMBER_ID, null);
  }

  // Tasks関連
  saveTasks(tasks: Task[]): void {
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  getTasks(): Task[] {
    return this.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
  }

  getTasksByMemberId(memberId: string): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(task => task.memberId === memberId && task.isActive);
  }

  addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
  }

  updateTask(updatedTask: Task): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.saveTasks(tasks);
    }
  }

  deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    this.saveTasks(filteredTasks);
  }

  // TaskCompletions関連
  saveTaskCompletions(completions: TaskCompletion[]): void {
    this.setItem(STORAGE_KEYS.TASK_COMPLETIONS, completions);
  }

  getTaskCompletions(): TaskCompletion[] {
    return this.getItem<TaskCompletion[]>(STORAGE_KEYS.TASK_COMPLETIONS, []);
  }

  addTaskCompletion(completion: TaskCompletion): void {
    const completions = this.getTaskCompletions();
    completions.push(completion);
    this.saveTaskCompletions(completions);
  }

  getTaskCompletionsByDate(memberId: string, date: string): TaskCompletion[] {
    const completions = this.getTaskCompletions();
    return completions.filter(c => c.memberId === memberId && c.completedAt.startsWith(date));
  }

  getTaskCompletionsByMember(memberId: string): TaskCompletion[] {
    const completions = this.getTaskCompletions();
    return completions.filter(c => c.memberId === memberId);
  }

  // MoneyBalances関連
  saveMoneyBalances(balances: MoneyBalance[]): void {
    this.setItem(STORAGE_KEYS.MONEY_BALANCES, balances);
  }

  getMoneyBalances(): MoneyBalance[] {
    return this.getItem<MoneyBalance[]>(STORAGE_KEYS.MONEY_BALANCES, []);
  }

  getMoneyBalanceByMemberId(memberId: string): MoneyBalance | null {
    const balances = this.getMoneyBalances();
    return balances.find(b => b.memberId === memberId) || null;
  }

  updateMoneyBalance(updatedBalance: MoneyBalance): void {
    const balances = this.getMoneyBalances();
    const index = balances.findIndex(b => b.memberId === updatedBalance.memberId);
    if (index !== -1) {
      balances[index] = updatedBalance;
    } else {
      balances.push(updatedBalance);
    }
    this.saveMoneyBalances(balances);
  }

  // MoneyAllocations関連
  saveMoneyAllocations(allocations: MoneyAllocation[]): void {
    this.setItem(STORAGE_KEYS.MONEY_ALLOCATIONS, allocations);
  }

  getMoneyAllocations(): MoneyAllocation[] {
    return this.getItem<MoneyAllocation[]>(STORAGE_KEYS.MONEY_ALLOCATIONS, []);
  }

  getMoneyAllocationByMemberId(memberId: string): MoneyAllocation | null {
    const allocations = this.getMoneyAllocations();
    return allocations.find(a => a.memberId === memberId) || null;
  }

  updateMoneyAllocation(updatedAllocation: MoneyAllocation): void {
    const allocations = this.getMoneyAllocations();
    const index = allocations.findIndex(a => a.memberId === updatedAllocation.memberId);
    if (index !== -1) {
      allocations[index] = updatedAllocation;
    } else {
      allocations.push(updatedAllocation);
    }
    this.saveMoneyAllocations(allocations);
  }

  // Goals関連
  saveGoals(goals: Goal[]): void {
    this.setItem(STORAGE_KEYS.GOALS, goals);
  }

  getGoals(): Goal[] {
    return this.getItem<Goal[]>(STORAGE_KEYS.GOALS, []);
  }

  getGoalsByMemberId(memberId: string): Goal[] {
    const goals = this.getGoals();
    return goals.filter(g => g.memberId === memberId);
  }

  addGoal(goal: Goal): void {
    const goals = this.getGoals();
    goals.push(goal);
    this.saveGoals(goals);
  }

  updateGoal(updatedGoal: Goal): void {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === updatedGoal.id);
    if (index !== -1) {
      goals[index] = updatedGoal;
      this.saveGoals(goals);
    }
  }

  // Investments関連
  saveInvestments(investments: Investment[]): void {
    this.setItem(STORAGE_KEYS.INVESTMENTS, investments);
  }

  getInvestments(): Investment[] {
    return this.getItem<Investment[]>(STORAGE_KEYS.INVESTMENTS, []);
  }

  getInvestmentsByMemberId(memberId: string): Investment[] {
    const investments = this.getInvestments();
    return investments.filter(i => i.memberId === memberId);
  }

  addInvestment(investment: Investment): void {
    const investments = this.getInvestments();
    investments.push(investment);
    this.saveInvestments(investments);
  }

  // MoneyTransactions関連
  saveMoneyTransactions(transactions: MoneyTransaction[]): void {
    this.setItem(STORAGE_KEYS.MONEY_TRANSACTIONS, transactions);
  }

  getMoneyTransactions(): MoneyTransaction[] {
    return this.getItem<MoneyTransaction[]>(STORAGE_KEYS.MONEY_TRANSACTIONS, []);
  }

  addMoneyTransaction(transaction: MoneyTransaction): void {
    const transactions = this.getMoneyTransactions();
    transactions.push(transaction);
    this.saveMoneyTransactions(transactions);
  }

  getMoneyTransactionsByMemberId(memberId: string): MoneyTransaction[] {
    const transactions = this.getMoneyTransactions();
    return transactions.filter(t => t.memberId === memberId);
  }

  // 全データのクリア
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  // セッションデータのクリア（406エラー対応）
  clearSessionData(): void {
    try {
      // Supabase関連のデータをクリア
      const keysToRemove = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase.auth.token',
        'sb-auth-token',
        'supabase-auth-token'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // アプリ固有のデータもクリア
      this.clearAllData();

      console.log('セッションデータがクリアされました');
    } catch (error) {
      console.error('セッションデータのクリアに失敗しました:', error);
    }
  }

  // 完全なlocalStorageクリア（緊急時用）
  clearCompleteStorage(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('全てのlocalStorageデータがクリアされました');
    } catch (error) {
      console.error('localStorageのクリアに失敗しました:', error);
    }
  }

  // データの存在確認
  hasFamily(): boolean {
    return this.getFamily() !== null;
  }

  // 今日の日付を取得（YYYY-MM-DD形式）
  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // UUIDの生成
  generateId(): string {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // 管理者パスコード関連
  getAdminPasscode(): string {
    return this.getItem<string>(STORAGE_KEYS.ADMIN_PASSCODE, '1234'); // デフォルトは1234
  }

  setAdminPasscode(passcode: string): void {
    this.setItem(STORAGE_KEYS.ADMIN_PASSCODE, passcode);
  }

  verifyAdminPasscode(inputPasscode: string): boolean {
    const storedPasscode = this.getAdminPasscode();
    return inputPasscode === storedPasscode;
  }
}

// シングルトンインスタンス
export const localStorageManager = new LocalStorageManager();

// デフォルトエクスポート
export default localStorageManager;