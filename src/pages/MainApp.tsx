import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useNewSupabaseAuth } from '../contexts/NewSupabaseAuthContext';
import MainLayout from '../components/Layout/MainLayout';

// ページコンポーネント
import CompletePage from './app/CompletePage';
import GoalsPage from './app/GoalsPage';
import CalendarPage from './app/CalendarPage';
import StatsPage from './app/StatsPage';
import MoneyPage from './app/MoneyPage';
import AdminPage from './app/AdminPage';

const MainApp = () => {
  const { isAuthenticated, isLoading } = useNewSupabaseAuth();
  const navigate = useNavigate();

  // 認証チェック（シンプル化）
  useEffect(() => {
    console.log('🔍 MainApp認証チェック:', {
      isLoading,
      isAuthenticated
    });

    if (!isLoading) {
      if (isAuthenticated) {
        console.log('✅ 認証済み - MainApp表示継続');
      } else {
        console.log('❌ 未認証のため /auth にリダイレクト');
        navigate('/auth');
      }
    } else {
      console.log('⏳ 認証システム初期化中...');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合は何も表示しない（useEffectでリダイレクトされる）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<CompletePage />} />
        <Route path="/complete" element={<CompletePage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </MainLayout>
  );
};

export default MainApp;