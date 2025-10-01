import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Context Providers
import { NewSupabaseAuthProvider } from './contexts/NewSupabaseAuthContext';
import { TextDisplayProvider } from './contexts/TextDisplayContext';

// ページコンポーネント
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import MainApp from './pages/MainApp';

function App() {
  return (
    <Router>
      <TextDisplayProvider>
        <NewSupabaseAuthProvider>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* ランディングページ */}
            <Route path="/" element={<LandingPage />} />

            {/* 認証ページ */}
            <Route path="/auth" element={<AuthPage />} />

            {/* メインアプリ */}
            <Route path="/app/*" element={<MainApp />} />

            {/* 404 */}
            <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><h1 className="text-2xl">ページが見つかりません</h1></div>} />
          </Routes>
          </div>
        </NewSupabaseAuthProvider>
      </TextDisplayProvider>
    </Router>
  );
}

export default App;