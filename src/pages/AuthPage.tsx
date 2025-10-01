import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Users, AlertCircle } from 'lucide-react';
import { useNewSupabaseAuth } from '../contexts/NewSupabaseAuthContext';
import { createTestData } from '../utils/testData';

const AuthPage = () => {
  const navigate = useNavigate();
  // 新しいSupabase Auth認証を使用
  const {
    signup,
    login,
    isAuthenticated,
    error,
    isLoading
  } = useNewSupabaseAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    familyName: '',
    adminName: ''
  });

  // 認証成功時の自動リダイレクト
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('✅ 認証完了 - /app にリダイレクト');
      navigate('/app');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 既に処理中の場合は何もしない
    if (isLoading) {
      console.log('⚠️ 既に処理中です');
      return;
    }

    console.log('🚀 Supabase Auth認証開始', {
      isSignup,
      email: formData.email,
      familyName: formData.familyName
    });

    try {
      if (isSignup) {
        console.log('📝 新規登録実行中...');
        await signup(formData.familyName, formData.adminName || '管理者', formData.email, formData.password);
        console.log('✅ 新規登録完了');
      } else {
        console.log('🔐 ログイン実行中...');
        await login(formData.email, formData.password);
        console.log('✅ ログイン完了');
      }

      // 認証成功後に自動でナビゲート（セッション監視により）
      console.log('🎯 認証成功！自動リダイレクト待機中...');

    } catch (error) {
      console.error('❌ 認証エラー:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({
      email: '',
      password: '',
      familyName: '',
      adminName: ''
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isSignup ? '新規登録' : 'ログイン'}
          </h1>
          <p className="text-gray-600">
            {isSignup ? '家族アカウントを作成' : '家族アカウントにログイン'}
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家族名
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="familyName"
                    value={formData.familyName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="田中家"
                    required={isSignup}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  管理者名
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="太郎"
                    required={isSignup}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワード"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? '処理中...' : (isSignup ? '新規登録' : 'ログイン')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            disabled={isLoading}
            className="text-blue-500 hover:text-blue-600 disabled:text-blue-300 text-sm"
          >
            {isSignup
              ? 'すでにアカウントをお持ちの方はこちら'
              : '新規アカウント作成はこちら'
            }
          </button>
        </div>

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={() => navigate('/')}
            disabled={isLoading}
            className="block w-full text-gray-500 hover:text-gray-600 disabled:text-gray-300 text-sm"
          >
            ← トップページに戻る
          </button>

          <button
            onClick={() => {
              createTestData();
              navigate('/app');
            }}
            disabled={isLoading}
            className="block w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            🧪 テストデータで始める
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;