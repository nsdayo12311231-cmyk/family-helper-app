import { useState } from 'react';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';
import AdminPasscodeModal from '../AdminPasscodeModal';

const Header = () => {
  const { currentMember, members, family, switchMember, logout } = useNewSupabaseAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const navigate = useNavigate();
  const { textMode, toggleTextMode } = useTextDisplay();

  const handleMemberSwitch = (memberId: string) => {
    switchMember(memberId);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('ろぐあうとしますか？')) {
      logout();
    }
  };

  const handleAdminAccess = () => {
    // 管理者メンバーを見つける
    const adminMember = members.find(member => member.role === 'admin');

    if (adminMember && currentMember && currentMember.id !== adminMember.id) {
      // 現在のユーザーが管理者でない場合、管理者に切り替え
      switchMember(adminMember.id);
    }

    navigate('/app/admin');
    setIsPasscodeModalOpen(false);
  };

  if (!currentMember || !family) {
    return null;
  }

  const themeClass = currentMember.theme === 'boy' ? 'theme-boy' : 'theme-girl';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${themeClass} shadow-2xl border-b-4 border-white/30`}>
      <div className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* タイトル */}
          <div className="flex items-center bg-white/20 rounded-2xl sm:rounded-3xl px-2 sm:px-4 py-1 sm:py-2 border-2 sm:border-3 border-white/40 flex-shrink-0">
            <span className="text-2xl sm:text-3xl mr-1 sm:mr-3">⭐</span>
            <div className="min-w-0">
              <div className="text-sm sm:text-lg font-bold text-gray-800 leading-tight truncate">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {currentMember.name}
                </span>
                <span className="text-gray-700">の</span>
              </div>
              <div className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent truncate">
                {TEXT_MAPPINGS.helping[textMode]}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* メンバー切り替えドロップダウン */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 sm:space-x-2 bg-white/40 hover:bg-white/70 rounded-2xl sm:rounded-3xl px-2 sm:px-4 py-2 sm:py-3 transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-white/50 backdrop-blur-sm"
              >
                <span className="text-xl sm:text-2xl">{currentMember.avatar}</span>
                <span className="hidden sm:inline text-sm font-bold text-gray-800 max-w-[60px] truncate">
                  {currentMember.name}
                </span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              </button>

              {/* ドロップダウンメニュー */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-yellow-200 py-2 z-50">
                  {members.filter(member => member.role !== 'admin').map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleMemberSwitch(member.id)}
                      className={`w-full text-left px-6 py-4 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 flex items-center space-x-3 transition-all duration-300 rounded-2xl mx-2 my-1 ${
                        member.id === currentMember.id ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 shadow-md' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-2xl">{member.avatar}</span>
                      <span className="font-bold text-lg">{member.name}</span>
                      {member.id === currentMember.id && (
                        <span className="ml-auto text-blue-500 text-xl">✨</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 言語切り替えボタン */}
            <button
              className="px-2 sm:px-3 py-1 sm:py-2 bg-white/40 hover:bg-white/70 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg border-2 border-white/50 backdrop-blur-sm text-xs sm:text-sm font-bold"
              onClick={() => {
                toggleTextMode();
              }}
              title={textMode === 'hiragana' ? '漢字表示に切り替え' : 'ひらがな表示に切り替え'}
            >
              {textMode === 'hiragana' ? '漢' : 'あ'}
            </button>

            {/* 設定ボタン */}
            <button
              className="p-2 sm:p-3 bg-white/40 hover:bg-white/70 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg border-2 border-white/50 backdrop-blur-sm"
              onClick={() => {
                setIsPasscodeModalOpen(true);
              }}
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>

            {/* ログアウトボタン（開発用） */}
            <button
              className="p-3 bg-pink-200/60 hover:bg-pink-300/80 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg border-2 border-pink-300/50 backdrop-blur-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 text-pink-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ドロップダウンが開いている時の背景オーバーレイ */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* パスコード入力モーダル */}
      <AdminPasscodeModal
        isOpen={isPasscodeModalOpen}
        onClose={() => setIsPasscodeModalOpen(false)}
        onSuccess={handleAdminAccess}
      />
    </header>
  );
};

export default Header;