import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { localStorageManager } from '../utils/localStorage';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminPasscodeModal = ({ isOpen, onClose, onSuccess }: AdminPasscodeModalProps) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const maxAttempts = 3;

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (localStorageManager.verifyAdminPasscode(passcode)) {
      setError('');
      setAttempts(0);
      onSuccess();
      onClose();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= maxAttempts) {
        setError(`間違いが${maxAttempts}回続きました。しばらくお待ちください。`);
        setTimeout(() => {
          setAttempts(0);
          setError('');
        }, 5000); // 5秒間ロック
      } else {
        setError(`パスコードが違います。あと${maxAttempts - newAttempts}回試せます。`);
      }
      setPasscode('');
    }
  };

  const handleNumberClick = (num: string) => {
    if (passcode.length < 4 && attempts < maxAttempts) {
      setPasscode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPasscode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full border-4 border-blue-300 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-600">👨‍💼 管理者認証</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* メッセージ */}
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600 mb-4">
            管理画面にアクセスするには<br />
            パスコードを入力してください
          </p>

          {/* パスコード表示エリア */}
          <div className="flex justify-center space-x-3 mb-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-2xl font-bold ${
                  passcode.length > index
                    ? 'border-blue-400 bg-blue-100 text-blue-600'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                {passcode.length > index ? '●' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-3 mb-4">
            <p className="text-red-600 font-bold text-center text-sm">{error}</p>
          </div>
        )}

        {/* テンキー */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num.toString())}
                disabled={attempts >= maxAttempts}
                className="h-14 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl transition-all transform hover:scale-105 disabled:hover:scale-100"
              >
                {num}
              </button>
            ))}

            {/* ゼロと操作ボタン */}
            <button
              type="button"
              onClick={handleClear}
              disabled={attempts >= maxAttempts}
              className="h-14 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white font-bold rounded-2xl transition-all"
            >
              クリア
            </button>

            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              disabled={attempts >= maxAttempts}
              className="h-14 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl transition-all transform hover:scale-105 disabled:hover:scale-100"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              disabled={attempts >= maxAttempts}
              className="h-14 bg-red-400 hover:bg-red-500 disabled:bg-gray-300 text-white font-bold rounded-2xl transition-all"
            >
              ←
            </button>
          </div>

          {/* 確認ボタン */}
          <button
            type="submit"
            disabled={passcode.length !== 4 || attempts >= maxAttempts}
            className="w-full h-12 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-2xl transition-all transform hover:scale-105 disabled:hover:scale-100"
          >
            {attempts >= maxAttempts ? '一時ロック中...' : '管理画面を開く'}
          </button>
        </form>

        {/* ヒント */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            デフォルトパスコード: {localStorageManager.getAdminPasscode()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPasscodeModal;