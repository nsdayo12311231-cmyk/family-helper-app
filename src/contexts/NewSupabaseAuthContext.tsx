import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Family, Member } from '../types';
import { supabase } from '../lib/supabase';

// State型定義
interface AuthState {
  user: User | null;
  session: Session | null;
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
  | { type: 'SET_SESSION'; payload: { user: User | null; session: Session | null } }
  | { type: 'SET_FAMILY_DATA'; payload: { family: Family; members: Member[] } }
  | { type: 'SET_CURRENT_MEMBER'; payload: Member }
  | { type: 'LOGOUT' }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string };

// 初期状態
const initialState: AuthState = {
  user: null,
  session: null,
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

    case 'SET_SESSION':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: !!action.payload.user,
      };

    case 'SET_FAMILY_DATA':
      return {
        ...state,
        family: action.payload.family,
        members: action.payload.members,
        currentMember: action.payload.members.find(m => m.role === 'admin') || action.payload.members[0] || null,
        isLoading: false,
        error: null,
      };

    case 'SET_CURRENT_MEMBER':
      return { ...state, currentMember: action.payload };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

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
  user: User | null;
  session: Session | null;
  family: Family | null;
  currentMember: Member | null;
  members: Member[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signup: (familyName: string, adminName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
export const NewSupabaseAuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isSigningUpRef = useRef(false); // サインアップ中フラグ

  // 家族データの読み込み（auth_user_idベース）
  const loadFamilyData = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔍 家族データ読み込み開始 (auth_user_id):', userId);
      // 家族情報を取得（auth_user_idで検索）
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (familyError) {
        console.error('❌ 家族データ取得エラー:', familyError);
        dispatch({ type: 'SET_ERROR', payload: 'データベースエラーが発生しました' });
        dispatch({ type: 'SET_LOADING', payload: false });
        return false;
      }

      if (!familyData) {
        console.log('ℹ️ 家族データが見つかりません');
        dispatch({ type: 'SET_ERROR', payload: 'このアカウントには家族データがありません。新規登録してください。' });
        await supabase.auth.signOut();
        dispatch({ type: 'SET_LOADING', payload: false });
        return false;
      }

      const family: Family = {
        id: familyData.id,
        name: familyData.name,
        adminEmail: familyData.admin_email,
        adminPassword: '',
        createdAt: familyData.created_at,
        updatedAt: familyData.updated_at
      };

      // メンバー一覧を取得
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('display_order');

      if (membersError) throw membersError;

      const members: Member[] = (membersData || []).map(memberData => ({
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

      dispatch({ type: 'SET_FAMILY_DATA', payload: { family, members } });

      // ⚡️ PERFORMANCE FIX: キャッシュに保存
      try {
        localStorage.setItem(`family_data_${userId}`, JSON.stringify({
          family,
          members,
          timestamp: Date.now()
        }));
        console.log('✅ 家族データ読み込み完了（キャッシュ保存）');
      } catch (e) {
        console.warn('キャッシュ保存エラー:', e);
        console.log('✅ 家族データ読み込み完了');
      }

      return true;

    } catch (error) {
      console.error('家族データ読み込みエラー:', error);
      dispatch({ type: 'SET_ERROR', payload: '家族データの読み込みに失敗しました' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  // セッション監視・復元
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('セッション取得エラー:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        if (session?.user) {
          console.log('✅ セッション復元:', session.user.email);
          dispatch({ type: 'SET_SESSION', payload: { user: session.user, session } });

          // ⚡️ PERFORMANCE FIX: キャッシュから家族データを復元
          const cachedData = localStorage.getItem(`family_data_${session.user.id}`);
          if (cachedData) {
            try {
              const { family, members, timestamp } = JSON.parse(cachedData);
              const age = Date.now() - timestamp;

              // キャッシュが24時間以内なら使用
              if (age < 24 * 60 * 60 * 1000) {
                console.log('✅ キャッシュから家族データを復元 (age:', Math.floor(age / 1000), '秒)');
                dispatch({ type: 'SET_FAMILY_DATA', payload: { family, members } });
                dispatch({ type: 'SET_LOADING', payload: false });

                // バックグラウンドで最新データを取得して更新
                loadFamilyData(session.user.id).then(success => {
                  if (success) console.log('✅ バックグラウンドでデータ更新完了');
                });
                return;
              } else {
                console.log('ℹ️ キャッシュが古いため破棄');
                localStorage.removeItem(`family_data_${session.user.id}`);
              }
            } catch (e) {
              console.warn('キャッシュ読み込みエラー:', e);
              localStorage.removeItem(`family_data_${session.user.id}`);
            }
          }

          // キャッシュがない場合のみSupabaseから取得
          await loadFamilyData(session.user.id);
        } else {
          console.log('ℹ️ セッションなし');
        }
      } catch (error) {
        console.error('認証初期化エラー:', error);
        dispatch({ type: 'SET_ERROR', payload: '認証の初期化に失敗しました' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();

    // 認証状態変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 認証状態変更:', event, session?.user?.email);

        // サインアップ中のSIGNED_INイベントは無視
        if (event === 'SIGNED_IN' && isSigningUpRef.current) {
          console.log('ℹ️ サインアップ中のためonAuthStateChangeをスキップ');
          return;
        }

        // SIGNED_OUTは常に処理
        if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' });
          return;
        }

        // ログイン時のSIGNED_INのみ処理
        if (event === 'SIGNED_IN' && session?.user) {
          dispatch({ type: 'SET_SESSION', payload: { user: session.user, session } });
          await loadFamilyData(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // サインアップ
  const signup = async (familyName: string, adminName: string, email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // サインアップ中フラグを立てる
    isSigningUpRef.current = true;

    try {
      console.log('🔐 Supabase Auth サインアップ開始:', { email, familyName, adminName });

      // 1. Supabase Authでユーザー作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            family_name: familyName,
            admin_name: adminName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('ユーザー作成に失敗しました');

      console.log('✅ Supabase Auth ユーザー作成完了:', authData.user.email);

      // 2. 家族レコード作成
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert([{
          name: familyName,
          admin_email: email,
          auth_user_id: authData.user.id
        }])
        .select()
        .single();

      if (familyError) throw familyError;
      console.log('✅ 家族レコード作成完了:', familyData.id);

      // 3. 管理者メンバー作成
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert([{
          family_id: familyData.id,
          name: adminName,
          avatar: '👨‍💼',
          role: 'admin',
          theme: 'boy',
          text_style: 'kanji',
          display_order: 0,
          is_active: true
        }])
        .select()
        .single();

      if (memberError) throw memberError;
      console.log('✅ 管理者メンバー作成完了:', memberData.id);

      // 4. 初期残高設定
      const { error: balanceError } = await supabase
        .from('money_balances')
        .insert([{
          family_id: familyData.id,
          member_id: memberData.id,
          available: 0,
          allocated: 0,
          spent: 0,
          total: 0
        }]);

      if (balanceError) throw balanceError;
      console.log('✅ サインアップ完了');

      // 5. セッション設定と家族データを手動でセット
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        dispatch({ type: 'SET_SESSION', payload: { user: session.user, session } });

        const family: Family = {
          id: familyData.id,
          name: familyData.name,
          adminEmail: email,
          adminPassword: '',
          createdAt: familyData.created_at,
          updatedAt: familyData.updated_at
        };

        const member: Member = {
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

        dispatch({ type: 'SET_FAMILY_DATA', payload: { family, members: [member] } });

        // キャッシュに保存
        try {
          localStorage.setItem(`family_data_${session.user.id}`, JSON.stringify({
            family,
            members: [member],
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('キャッシュ保存エラー:', e);
        }
      }

    } catch (error) {
      console.error('❌ サインアップエラー:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'サインアップに失敗しました' });
      throw error;
    } finally {
      // サインアップ完了後フラグを戻す
      isSigningUpRef.current = false;
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ログイン
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('🔐 Supabase Auth ログイン開始:', { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('ログインに失敗しました');

      console.log('✅ Supabase Auth ログイン完了:', data.user.email);
      // onAuthStateChangeで自動的に家族データが読み込まれる

    } catch (error) {
      console.error('❌ ログインエラー:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'ログインに失敗しました' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ログアウト
  const logout = async (): Promise<void> => {
    try {
      console.log('👋 ログアウト中...');

      // キャッシュクリア
      if (state.user?.id) {
        localStorage.removeItem(`family_data_${state.user.id}`);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ ログアウト完了');
    } catch (error) {
      console.error('❌ ログアウトエラー:', error);
      dispatch({ type: 'SET_ERROR', payload: 'ログアウトに失敗しました' });
    }
  };

  // メンバー切り替え
  const switchMember = (memberId: string) => {
    const member = state.members.find(m => m.id === memberId);
    if (member) {
      dispatch({ type: 'SET_CURRENT_MEMBER', payload: member });
    }
  };

  // メンバー追加
  const addMember = async (name: string, avatar: string, role: 'admin' | 'child', theme: 'boy' | 'girl', textStyle: 'kanji' | 'hiragana'): Promise<void> => {
    if (!state.family) throw new Error('家族情報がありません');

    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{
          family_id: state.family.id,
          name,
          avatar,
          role,
          theme,
          text_style: textStyle,
          display_order: state.members.length,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      const newMember: Member = {
        id: data.id,
        familyId: data.family_id,
        name: data.name,
        avatar: data.avatar,
        role: data.role,
        theme: data.theme,
        textStyle: data.text_style,
        displayOrder: data.display_order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // 初期残高設定
      await supabase
        .from('money_balances')
        .insert([{
          family_id: state.family.id,
          member_id: newMember.id,
          available: 0,
          allocated: 0,
          spent: 0,
          total: 0
        }]);

      dispatch({ type: 'ADD_MEMBER', payload: newMember });

      // キャッシュ更新
      if (state.user?.id) {
        try {
          const updatedMembers = [...state.members, newMember];
          localStorage.setItem(`family_data_${state.user.id}`, JSON.stringify({
            family: state.family,
            members: updatedMembers,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('キャッシュ更新エラー:', e);
        }
      }

    } catch (error) {
      console.error('メンバー追加エラー:', error);
      throw error;
    }
  };

  // メンバー更新
  const updateMember = async (memberId: string, updates: Partial<Member>): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update({
          name: updates.name,
          avatar: updates.avatar,
          theme: updates.theme,
          text_style: updates.textStyle,
          display_order: updates.displayOrder,
          is_active: updates.isActive
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      const updatedMember: Member = {
        id: data.id,
        familyId: data.family_id,
        name: data.name,
        avatar: data.avatar,
        role: data.role,
        theme: data.theme,
        textStyle: data.text_style,
        displayOrder: data.display_order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      dispatch({ type: 'UPDATE_MEMBER', payload: updatedMember });

      // キャッシュ更新
      if (state.user?.id && state.family) {
        try {
          const updatedMembers = state.members.map(m =>
            m.id === updatedMember.id ? updatedMember : m
          );
          localStorage.setItem(`family_data_${state.user.id}`, JSON.stringify({
            family: state.family,
            members: updatedMembers,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('キャッシュ更新エラー:', e);
        }
      }

    } catch (error) {
      console.error('メンバー更新エラー:', error);
      throw error;
    }
  };

  // メンバー削除
  const deleteMember = async (memberId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      dispatch({ type: 'DELETE_MEMBER', payload: memberId });

      // キャッシュ更新
      if (state.user?.id && state.family) {
        try {
          const updatedMembers = state.members.filter(m => m.id !== memberId);
          localStorage.setItem(`family_data_${state.user.id}`, JSON.stringify({
            family: state.family,
            members: updatedMembers,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('キャッシュ更新エラー:', e);
        }
      }

    } catch (error) {
      console.error('メンバー削除エラー:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    // State
    user: state.user,
    session: state.session,
    family: state.family,
    currentMember: state.currentMember,
    members: state.members,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

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
export const useNewSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useNewSupabaseAuth must be used within a NewSupabaseAuthProvider');
  }
  return context;
};
