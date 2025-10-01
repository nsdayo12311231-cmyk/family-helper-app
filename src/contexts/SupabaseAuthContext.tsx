import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Family, Member } from '../types';
import { useSupabase } from '../hooks/useSupabase';

// State型定義
interface AuthState {
  family: Family | null;
  currentMember: Member | null;
  members: Member[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSupabaseConnected: boolean;
}

// Action型定義
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUPABASE_CONNECTION'; payload: boolean }
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
  isSupabaseConnected: false,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_SUPABASE_CONNECTION':
      return { ...state, isSupabaseConnected: action.payload };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        family: action.payload.family,
        members: action.payload.members,
        currentMember: action.payload.members.find(m => m.role === 'admin') || action.payload.members[0] || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGOUT':
      return {
        ...state,
        family: null,
        currentMember: null,
        members: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'SET_CURRENT_MEMBER':
      return { ...state, currentMember: action.payload };

    case 'UPDATE_MEMBERS':
      return { ...state, members: action.payload };

    case 'ADD_MEMBER':
      return {
        ...state,
        members: [...state.members, action.payload]
      };

    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(m =>
          m.id === action.payload.id ? action.payload : m
        ),
        currentMember: state.currentMember?.id === action.payload.id
          ? action.payload
          : state.currentMember
      };

    case 'DELETE_MEMBER':
      const updatedMembers = state.members.filter(m => m.id !== action.payload);
      return {
        ...state,
        members: updatedMembers,
        currentMember: state.currentMember?.id === action.payload
          ? updatedMembers[0] || null
          : state.currentMember
      };

    default:
      return state;
  }
};

// Context型定義
interface AuthContextType {
  // State
  family: Family | null;
  currentMember: Member | null;
  members: Member[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSupabaseConnected: boolean;

  // Actions
  signup: (familyName: string, adminName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchMember: (memberId: string) => void;
  addMember: (name: string, avatar: string, role: 'admin' | 'child', theme: 'boy' | 'girl', textStyle: 'kanji' | 'hiragana') => Promise<void>;
  updateMember: (memberId: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
}

// Context作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props型定義
interface AuthProviderProps {
  children: ReactNode;
}

// Provider実装
export const SupabaseAuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const supabase = useSupabase();

  // Supabase接続状態を監視
  useEffect(() => {
    dispatch({ type: 'SET_SUPABASE_CONNECTION', payload: supabase.isConnected });
    if (supabase.error) {
      dispatch({ type: 'SET_ERROR', payload: `Supabase接続エラー: ${supabase.error}` });
    }
  }, [supabase.isConnected, supabase.error]);

  // 初期化時の自動ログイン確認
  useEffect(() => {
    const initializeAuth = async () => {
      if (!supabase.isConnected) {
        console.log('Supabase接続待ち...');
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        // セッション復元を安全に実行
        const savedAuth = localStorage.getItem('supabase_auth');
        if (savedAuth) {
          const { familyId, memberId } = JSON.parse(savedAuth);
          console.log('保存されたセッションを復元中...', { familyId, memberId });

          // 家族情報を取得
          const familyData = await supabase.getFamilyById(familyId);
          if (familyData) {
            const family = {
              id: familyData.id,
              name: familyData.name,
              adminEmail: familyData.admin_email,
              adminPassword: familyData.admin_password,
              createdAt: familyData.created_at,
              updatedAt: familyData.updated_at
            };

            // メンバー一覧を取得
            const membersData = await supabase.getMembersByFamily(familyId);
            const members = membersData.map(memberData => ({
              id: memberData.id,
              familyId: memberData.family_id,
              name: memberData.name,
              avatar: memberData.avatar,
              role: memberData.role,
              theme: memberData.theme,
              textStyle: memberData.text_style,
              displayOrder: memberData.display_order,
              isActive: memberData.is_active,
              createdAt: memberData.created_at,
              updatedAt: memberData.updated_at
            }));

            dispatch({ type: 'LOGIN_SUCCESS', payload: { family, members } });

            // 現在のメンバーを設定
            const currentMember = members.find(m => m.id === memberId);
            if (currentMember) {
              dispatch({ type: 'SET_CURRENT_MEMBER', payload: currentMember });
            }

            console.log('✅ セッション復元完了');
          } else {
            // 無効なセッションをクリア
            localStorage.removeItem('supabase_auth');
            console.log('無効なセッションをクリア');
          }
        } else {
          console.log('保存されたセッションなし');
        }
      } catch (error) {
        console.error('セッション復元エラー:', error);
        localStorage.removeItem('supabase_auth');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, [supabase.isConnected]);

  // サインアップ
  const signup = async (familyName: string, adminName: string, email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // 1. 家族を作成
      console.log('🏠 家族作成中...', { familyName, email });
      const familyData = await supabase.createFamily({
        name: familyName,
        adminEmail: email,
        adminPassword: password
      });

      const family: Family = {
        id: familyData.id,
        name: familyData.name,
        adminEmail: familyData.admin_email,
        adminPassword: familyData.admin_password,
        createdAt: familyData.created_at,
        updatedAt: familyData.updated_at
      };

      // 2. 管理者メンバーを作成
      console.log('👨‍💼 管理者メンバー作成中...', { adminName });
      const adminMemberData = await supabase.createMember({
        familyId: family.id,
        name: adminName,
        avatar: '👨‍💼',
        role: 'admin',
        theme: 'boy',
        textStyle: 'kanji',
        displayOrder: 0,
        isActive: true
      });

      const adminMember: Member = {
        id: adminMemberData.id,
        familyId: adminMemberData.family_id,
        name: adminMemberData.name,
        avatar: adminMemberData.avatar,
        role: adminMemberData.role,
        theme: adminMemberData.theme,
        textStyle: adminMemberData.text_style,
        displayOrder: adminMemberData.display_order,
        isActive: adminMemberData.is_active,
        createdAt: adminMemberData.created_at,
        updatedAt: adminMemberData.updated_at
      };

      // 3. 初期残高設定
      console.log('💰 初期残高設定中...');
      await supabase.updateMoneyBalance({
        familyId: family.id,
        memberId: adminMember.id,
        available: 0,
        allocated: 0,
        spent: 0,
        total: 0
      });

      // 4. セッション保存
      localStorage.setItem('supabase_auth', JSON.stringify({
        familyId: family.id,
        memberId: adminMember.id
      }));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { family, members: [adminMember] } });
      console.log('✅ サインアップ完了');

    } catch (error) {
      console.error('❌ サインアップエラー:', error);
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
      console.log('🔐 ログイン中...', { email });

      // 1. 家族情報を取得
      const familyData = await supabase.getFamilyByEmail(email);
      if (!familyData) {
        throw new Error('家族が見つかりません');
      }

      // パスワード確認（実際の本番環境では適切なハッシュ化が必要）
      if (familyData.admin_password !== password) {
        throw new Error('パスワードが正しくありません');
      }

      const family: Family = {
        id: familyData.id,
        name: familyData.name,
        adminEmail: familyData.admin_email,
        adminPassword: familyData.admin_password,
        createdAt: familyData.created_at,
        updatedAt: familyData.updated_at
      };

      // 2. メンバー一覧を取得
      const membersData = await supabase.getMembersByFamily(family.id);
      const members: Member[] = membersData.map(memberData => ({
        id: memberData.id,
        familyId: memberData.family_id,
        name: memberData.name,
        avatar: memberData.avatar,
        role: memberData.role,
        theme: memberData.theme,
        textStyle: memberData.text_style,
        displayOrder: memberData.display_order,
        isActive: memberData.is_active,
        createdAt: memberData.created_at,
        updatedAt: memberData.updated_at
      }));

      // 3. セッション保存
      const adminMember = members.find(m => m.role === 'admin');
      if (adminMember) {
        localStorage.setItem('supabase_auth', JSON.stringify({
          familyId: family.id,
          memberId: adminMember.id
        }));
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: { family, members } });
      console.log('✅ ログイン完了');

    } catch (error) {
      console.error('❌ ログインエラー:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'ログインに失敗しました' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ログアウト
  const logout = () => {
    localStorage.removeItem('supabase_auth');
    dispatch({ type: 'LOGOUT' });
    console.log('👋 ログアウト完了');
  };

  // メンバー切り替え
  const switchMember = (memberId: string) => {
    const member = state.members.find(m => m.id === memberId);
    if (member) {
      dispatch({ type: 'SET_CURRENT_MEMBER', payload: member });

      // セッション更新
      if (state.family) {
        localStorage.setItem('supabase_auth', JSON.stringify({
          familyId: state.family.id,
          memberId: member.id
        }));
      }
    }
  };

  // メンバー追加
  const addMember = async (name: string, avatar: string, role: 'admin' | 'child', theme: 'boy' | 'girl', textStyle: 'kanji' | 'hiragana'): Promise<void> => {
    if (!state.family) throw new Error('家族情報がありません');

    try {
      const memberData = await supabase.createMember({
        familyId: state.family.id,
        name,
        avatar,
        role,
        theme,
        textStyle,
        displayOrder: state.members.length,
        isActive: true
      });

      const newMember: Member = {
        id: memberData.id,
        familyId: memberData.family_id,
        name: memberData.name,
        avatar: memberData.avatar,
        role: memberData.role,
        theme: memberData.theme,
        textStyle: memberData.text_style,
        displayOrder: memberData.display_order,
        isActive: memberData.is_active,
        createdAt: memberData.created_at,
        updatedAt: memberData.updated_at
      };

      // 初期残高設定
      await supabase.updateMoneyBalance({
        familyId: state.family.id,
        memberId: newMember.id,
        available: 0,
        allocated: 0,
        spent: 0,
        total: 0
      });

      dispatch({ type: 'ADD_MEMBER', payload: newMember });

    } catch (error) {
      console.error('メンバー追加エラー:', error);
      throw error;
    }
  };

  // メンバー更新
  const updateMember = async (memberId: string, updates: Partial<Member>): Promise<void> => {
    // TODO: Supabaseでのメンバー更新実装
    console.log('メンバー更新:', { memberId, updates });
  };

  // メンバー削除
  const deleteMember = async (memberId: string): Promise<void> => {
    // TODO: Supabaseでのメンバー削除実装
    console.log('メンバー削除:', { memberId });
  };

  const value: AuthContextType = {
    // State
    family: state.family,
    currentMember: state.currentMember,
    members: state.members,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    isSupabaseConnected: state.isSupabaseConnected,

    // Actions
    signup,
    login,
    logout,
    switchMember,
    addMember,
    updateMember,
    deleteMember,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};