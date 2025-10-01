import type { ReactNode } from 'react';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated, isLoading, currentMember } = useNewSupabaseAuth();

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

  if (!isAuthenticated) {
    return null;
  }

  const themeClass = currentMember?.theme === 'boy' ? 'theme-boy' : 'theme-girl';

  return (
    <div className={`min-h-screen ${themeClass}`}>
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="pt-20 pb-20 min-h-screen px-2 sm:px-4">
        <div className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ボトムナビゲーション */}
      <BottomNavigation />
    </div>
  );
};

export default MainLayout;