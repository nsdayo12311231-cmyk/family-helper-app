import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Family, Member } from '../types';
import { localStorageManager } from '../utils/localStorage';

// State型定義
interface AuthState {
  family: Family | null;
  currentMember: Member | null;
  members: Member[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action型定義
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { family: Family; members: Member[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_CURRENT_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBERS'; payload: Member[] }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string };

// 初期状態
const initialState: AuthState = {
  family: null,
  currentMember: null,
  members: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        family: action.payload.family,
        members: action.payload.members,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'SET_CURRENT_MEMBER':
      return {
        ...state,
        currentMember: action.payload,
      };

    case 'UPDATE_MEMBERS':
      return {
        ...state,
        members: action.payload,
      };

    case 'ADD_MEMBER':
      return {
        ...state,
        members: [...state.members, action.payload],
      };

    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(member =>
          member.id === action.payload.id ? action.payload : member
        ),
        currentMember: state.currentMember?.id === action.payload.id ? action.payload : state.currentMember,
      };

    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter(member => member.id !== action.payload),
        currentMember: state.currentMember?.id === action.payload ? null : state.currentMember,
      };

    default:
      return state;
  }
};

// Context型定義
interface AuthContextType extends AuthState {
  signup: (familyName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchMember: (memberId: string) => void;
  addMember: (memberData: Omit<Member, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>) => void;
  updateMember: (memberId: string, memberData: Partial<Member>) => void;
  deleteMember: (memberId: string) => void;
  clearTestData: () => void;
}

// Context作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider Component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初期化時にLocalStorageから認証状態を復元
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const family = localStorageManager.getFamily();
        if (family) {
          const members = localStorageManager.getMembersByFamilyId(family.id);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { family, members } });

          // 現在のメンバーを設定
          const currentMemberId = localStorageManager.getCurrentMemberId();
          if (currentMemberId) {
            const currentMember = members.find(m => m.id === currentMemberId);
            if (currentMember) {
              dispatch({ type: 'SET_CURRENT_MEMBER', payload: currentMember });
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_ERROR', payload: '認証の初期化に失敗しました' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // サインアップ
  const signup = async (familyName: string, email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // 家族アカウント作成
      const family: Family = {
        id: localStorageManager.generateId(),
        name: familyName,
        adminEmail: email,
        adminPassword: password, // 実際の実装では暗号化が必要
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 管理者メンバー作成
      const adminMember: Member = {
        id: localStorageManager.generateId(),
        familyId: family.id,
        name: 'お父さん',
        avatar: '👨',
        role: 'admin',
        theme: 'boy',
        textStyle: 'kanji',
        displayOrder: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // LocalStorageに保存
      localStorageManager.saveFamily(family);
      localStorageManager.addMember(adminMember);
      localStorageManager.setCurrentMemberId(adminMember.id);

      // 状態更新
      dispatch({ type: 'LOGIN_SUCCESS', payload: { family, members: [adminMember] } });
      dispatch({ type: 'SET_CURRENT_MEMBER', payload: adminMember });

      // デフォルトのお金の振り分け設定を作成
      const defaultAllocation = {
        id: localStorageManager.generateId(),
        familyId: family.id,
        memberId: adminMember.id,
        goalSavingRate: 50,
        freeMoneyRate: 30,
        longSavingRate: 15,
        investmentRate: 5,
        donationRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorageManager.updateMoneyAllocation(defaultAllocation);

      // 初期残高設定
      const initialBalance = {
        id: localStorageManager.generateId(),
        familyId: family.id,
        memberId: adminMember.id,
        available: 0,
        allocated: 0,
        spent: 0,
        total: 0,
        lastUpdated: new Date().toISOString(),
      };

      localStorageManager.updateMoneyBalance(initialBalance);

    } catch (error) {
      console.error('Signup error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'アカウントの作成に失敗しました' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ログイン
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const family = localStorageManager.getFamily();

      if (!family || family.adminEmail !== email || family.adminPassword !== password) {
        throw new Error('メールアドレスまたはパスワードが間違っています');
      }

      const members = localStorageManager.getMembersByFamilyId(family.id);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { family, members } });

      // 最後に選択したメンバーを復元
      const currentMemberId = localStorageManager.getCurrentMemberId();
      if (currentMemberId) {
        const currentMember = members.find(m => m.id === currentMemberId);
        if (currentMember) {
          dispatch({ type: 'SET_CURRENT_MEMBER', payload: currentMember });
        }
      }

    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'ログインに失敗しました' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ログアウト
  const logout = () => {
    localStorageManager.clearAllData();
    dispatch({ type: 'LOGOUT' });
  };

  // テストデータクリア（開発用）
  const clearTestData = () => {
    if (!state.family) return;

    console.log('🧹 テストデータクリア開始...');

    state.members.forEach(member => {
      console.log(`🔍 ${member.name}のデータをクリア中...`);

      // EarningRecordをクリア
      localStorage.removeItem(`earnings-${state.family!.id}-${member.id}`);
      // TaskCompletionをクリア
      localStorage.removeItem(`completions-${state.family!.id}-${member.id}`);
      // PendingMoneyをクリア
      localStorage.removeItem(`pendingMoney-${state.family!.id}-${member.id}`);

      // より広範囲の月別PendingMoneyをクリア（2024年から2026年まで）
      for (let year = 2024; year <= 2026; year++) {
        for (let month = 1; month <= 12; month++) {
          const monthStr = `${year}-${String(month).padStart(2, '0')}`;
          const key = `pendingMoney-${state.family!.id}-${member.id}-${monthStr}`;
          localStorage.removeItem(key);
        }
      }

      // その他関連データもクリア
      localStorage.removeItem(`balance-${state.family!.id}-${member.id}`);
      localStorage.removeItem(`investment-${state.family!.id}-${member.id}`);
      localStorage.removeItem(`goalSavings-${state.family!.id}-${member.id}`);
      localStorage.removeItem(`investmentRecords-${state.family!.id}-${member.id}`);

      // 初期化し直し
      localStorage.setItem(`earnings-${state.family!.id}-${member.id}`, JSON.stringify([]));
      localStorage.setItem(`completions-${state.family!.id}-${member.id}`, JSON.stringify([]));
      localStorage.setItem(`pendingMoney-${state.family!.id}-${member.id}`, '0');
      localStorage.setItem(`balance-${state.family!.id}-${member.id}`, JSON.stringify({ available: 0, allocated: 0, spent: 0, total: 0 }));
      localStorage.setItem(`investment-${state.family!.id}-${member.id}`, '0');
      localStorage.setItem(`goalSavings-${state.family!.id}-${member.id}`, '0');
      localStorage.setItem(`investmentRecords-${state.family!.id}-${member.id}`, JSON.stringify([]));

      console.log(`✅ ${member.name}のデータクリア完了`);
    });

    console.log('🧹 全メンバーのテストデータをクリアしました');

    // ページをリロードして変更を反映
    window.location.reload();
  };

  // メンバー切り替え
  const switchMember = (memberId: string) => {
    const member = state.members.find(m => m.id === memberId);
    if (member) {
      localStorageManager.setCurrentMemberId(memberId);
      dispatch({ type: 'SET_CURRENT_MEMBER', payload: member });
    }
  };

  // メンバー追加
  const addMember = (memberData: Omit<Member, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>) => {
    if (!state.family) return;

    const newMember: Member = {
      ...memberData,
      id: localStorageManager.generateId(),
      familyId: state.family!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorageManager.addMember(newMember);
    dispatch({ type: 'ADD_MEMBER', payload: newMember });

    // デフォルトのお金の振り分け設定を作成
    const defaultAllocation = {
      id: localStorageManager.generateId(),
      familyId: state.family!.id,
      memberId: newMember.id,
      goalSavingRate: 50,
      freeMoneyRate: 30,
      longSavingRate: 15,
      investmentRate: 5,
      donationRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorageManager.updateMoneyAllocation(defaultAllocation);

    // 初期残高設定
    const initialBalance = {
      id: localStorageManager.generateId(),
      familyId: state.family!.id,
      memberId: newMember.id,
      available: 0,
      allocated: 0,
      spent: 0,
      total: 0,
      lastUpdated: new Date().toISOString(),
    };

    localStorageManager.updateMoneyBalance(initialBalance);

    // 新メンバー用のテーブル初期化
    const initializeMemberTables = (familyId: string, memberId: string) => {
      // EarningRecord初期化
      localStorage.setItem(`earnings-${familyId}-${memberId}`, JSON.stringify([]));

      // MoneyBalance初期化（新システム用）
      localStorage.setItem(`balance-${familyId}-${memberId}`, JSON.stringify({
        available: 0,
        allocated: 0,
        spent: 0,
        total: 0
      }));

      // ペンディングマネー初期化
      localStorage.setItem(`pendingMoney-${familyId}-${memberId}`, '0');

      // 投資残高初期化
      localStorage.setItem(`investment-${familyId}-${memberId}`, '0');

      // タスク完了記録初期化
      localStorage.setItem(`completions-${familyId}-${memberId}`, JSON.stringify([]));

      // 目標初期化
      localStorage.setItem(`goals-${familyId}-${memberId}`, JSON.stringify([]));

      // 目標貯金残高初期化
      localStorage.setItem(`goalSavings-${familyId}-${memberId}`, '0');

      // 投資履歴初期化
      localStorage.setItem(`investmentRecords-${familyId}-${memberId}`, JSON.stringify([]));
    };

    initializeMemberTables(state.family!.id, newMember.id);

  };


  // メンバー更新
  const updateMember = (memberId: string, memberData: Partial<Member>) => {
    const existingMember = state.members.find(m => m.id === memberId);
    if (!existingMember) return;

    const updatedMember: Member = {
      ...existingMember,
      ...memberData,
      updatedAt: new Date().toISOString(),
    };

    localStorageManager.updateMember(updatedMember);
    dispatch({ type: 'UPDATE_MEMBER', payload: updatedMember });
  };

  // メンバー削除
  const deleteMember = (memberId: string) => {
    localStorageManager.deleteMember(memberId);
    dispatch({ type: 'DELETE_MEMBER', payload: memberId });
  };

  const contextValue: AuthContextType = {
    ...state,
    signup,
    login,
    logout,
    switchMember,
    addMember,
    updateMember,
    deleteMember,
    clearTestData,
  };

  // デバッグ用：ブラウザから呼び出せるようにする
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearTestData = clearTestData;
    }
  }, [clearTestData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;