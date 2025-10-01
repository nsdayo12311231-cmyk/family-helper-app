import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';
import { localStorageManager } from '../../utils/localStorage';
import { emitMoneyEvent, MoneyEvents } from '../../utils/moneyEvents';
import { generateUUID } from '../../utils/uuid';
import type { Task, TaskCompletion } from '../../types';

const AdminPage = () => {
  const navigate = useNavigate();
  const { currentMember, family, members, addMember, deleteMember } = useNewSupabaseAuth();
  const taskManager = useTaskManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'settings' | 'calendar'>('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showChangePasscode, setShowChangePasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [showEditRecord, setShowEditRecord] = useState<{type: 'pending' | 'goal' | 'investment', show: boolean}>({type: 'pending', show: false});
  const [selectedCalendarMember, setSelectedCalendarMember] = useState<string>('');
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [showCalendarEdit, setShowCalendarEdit] = useState<{show: boolean, date: string, memberId: string}>({show: false, date: '', memberId: ''});
  const [editingCompletions, setEditingCompletions] = useState<Record<string, number>>({});
  const [calendarRefresh, setCalendarRefresh] = useState(0);
  const { textMode } = useTextDisplay();

  const handlePasscodeChange = () => {
    if (newPasscode.length !== 4) {
      setPasscodeError('パスコードは4桁で入力してください');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setPasscodeError('パスコードが一致しません');
      return;
    }

    localStorageManager.setAdminPasscode(newPasscode);
    setPasscodeError('');
    setNewPasscode('');
    setConfirmPasscode('');
    setShowChangePasscode(false);
    alert('パスコードを変更しました');
  };

  if (!currentMember || currentMember.role !== 'admin' || !taskManager) {
    return (
      <div className="p-4">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {TEXT_MAPPINGS.accessRestricted[textMode]}
          </h2>
          <p className="text-lg text-gray-600">
            {TEXT_MAPPINGS.adminOnly[textMode]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* ヘッダー */}
      <div className="card hover-grow">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/app')}
            className="bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🏠 ホームにもどる
          </button>
          <div className="flex-1"></div>
        </div>
        <h1 className="text-3xl font-bold text-center text-fun">
          👨‍💼 {TEXT_MAPPINGS.adminScreen[textMode]} 👨‍💼
        </h1>
        <p className="text-center text-lg text-gray-600 mt-2">
          かぞくの せっていを かんりしよう
        </p>
      </div>

      {/* タブメニュー */}
      <div className="flex bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl p-2 border-4 border-blue-200 shadow-lg">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg transition-all ${
            activeTab === 'tasks'
              ? 'bg-white text-blue-600 shadow-lg transform scale-105'
              : 'text-blue-500 hover:bg-white/50'
          }`}
        >
          📝 {TEXT_MAPPINGS.tasks[textMode]}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg transition-all ${
            activeTab === 'members'
              ? 'bg-white text-blue-600 shadow-lg transform scale-105'
              : 'text-blue-500 hover:bg-white/50'
          }`}
        >
          👨‍👩‍👧‍👦 {TEXT_MAPPINGS.members[textMode]}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-blue-600 shadow-lg transform scale-105'
              : 'text-blue-500 hover:bg-white/50'
          }`}
        >
          ⚙️ {TEXT_MAPPINGS.settings[textMode]}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg transition-all ${
            activeTab === 'calendar'
              ? 'bg-white text-blue-600 shadow-lg transform scale-105'
              : 'text-blue-500 hover:bg-white/50'
          }`}
        >
          📅 カレンダー
        </button>
      </div>

      {/* タスク管理タブ */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-fun">📝 タスク かんり</h2>
            <button
              onClick={() => setShowAddTask(true)}
              className="btn-fun"
            >
              ➕ あたらしい タスク
            </button>
          </div>

          {/* メンバーフィルタ */}
          <div className="card">
            <div className="flex items-center space-x-4">
              <label className="text-lg font-bold text-purple-600">フィルタ:</label>
              <select
                value={selectedMemberFilter}
                onChange={(e) => setSelectedMemberFilter(e.target.value)}
                className="flex-1 p-2 border-2 border-purple-200 rounded-xl text-lg"
              >
                <option value="all">すべてのメンバー</option>
                {members.filter(member => member.role !== 'admin').map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.avatar} {member.name}のタスク
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {taskManager.tasks
              .filter((task) => selectedMemberFilter === 'all' || task.memberId === selectedMemberFilter)
              .map((task) => {
                const taskOwner = members.find(m => m.id === task.memberId);
                return (
              <div key={task.id} className="card hover-grow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{task.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-bold text-purple-600">{task.name}</h3>
                        {taskOwner && (
                          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-bold">
                            {taskOwner.avatar} {taskOwner.name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{task.description}</p>
                      <div className="flex space-x-4 text-sm text-gray-500 mt-1">
                        <span>💰 {task.reward}えん</span>
                        <span>📅 1日{task.maxCompletionsPerDay}回まで</span>
                        <span className={task.isActive ? 'text-green-600' : 'text-red-600'}>
                          {task.isActive ? '✅ アクティブ' : '❌ 無効'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => taskManager.updateTask(task.id, { isActive: !task.isActive })}
                      className={`px-4 py-2 rounded-2xl font-bold transition-all ${
                        task.isActive
                          ? 'bg-red-400 hover:bg-red-500 text-white'
                          : 'bg-green-400 hover:bg-green-500 text-white'
                      }`}
                    >
                      {task.isActive ? '無効化' : '有効化'}
                    </button>
                    <button
                      onClick={() => taskManager.deleteTask(task.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-2xl font-bold transition-all"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
                );
              })}

            {taskManager.tasks.filter((task) => selectedMemberFilter === 'all' || task.memberId === selectedMemberFilter).length === 0 && (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">
                  {selectedMemberFilter === 'all' ? 'まだタスクがありません' : '選択したメンバーのタスクがありません'}
                </h3>
                <p className="text-lg text-gray-500">
                  新しいタスクを追加して始めましょう
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* メンバー管理タブ */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-fun">👨‍👩‍👧‍👦 メンバー かんり</h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="btn-fun"
            >
              ➕ あたらしい メンバー
            </button>
          </div>

          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="card hover-grow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{member.avatar}</div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-600">{member.name}</h3>
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <span>👤 {member.role === 'admin' ? '管理者' : '子供'}</span>
                        <span>🎨 {member.theme === 'boy' ? '男の子' : '女の子'}テーマ</span>
                      </div>
                    </div>
                  </div>
                  {member.role !== 'admin' && (
                    <button
                      onClick={() => {
                        if (confirm(`${member.name}を削除しますか？この操作は取り消せません。`)) {
                          deleteMember(member.id);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-2xl font-bold transition-all"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 設定タブ */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-fun">⚙️ ぜんたい せってい</h2>

          <div className="card hover-grow">
            <h3 className="text-xl font-bold text-purple-600 mb-4">🏠 かぞく じょうほう</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">家族名:</span>
                <span className="font-bold">{family?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">メンバー数:</span>
                <span className="font-bold">{members.length}人</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">作成日:</span>
                <span className="font-bold">
                  {family?.createdAt ? new Date(family.createdAt).toLocaleDateString('ja-JP') : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="card hover-grow">
            <h3 className="text-xl font-bold text-purple-600 mb-4">🔒 セキュリティ</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">現在のパスコード:</span>
                <span className="font-bold text-lg">****</span>
              </div>
              <button
                onClick={() => setShowChangePasscode(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                🔑 パスコードを変更
              </button>
            </div>
          </div>

          <div className="card hover-grow">
            <h3 className="text-xl font-bold text-red-600 mb-4">🧪 テスト機能</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                テスト用の機能です。本番運用時は削除してください。
              </p>
              <button
                onClick={() => {
                  if (window.confirm('全てのタスク完了履歴をリセットしますか？\nこの操作は取り消せません。')) {
                    // タスク完了履歴をリセット
                    localStorage.removeItem('taskCompletions');
                    alert('タスク完了履歴をリセットしました！\nページを再読み込みして確認してください。');
                    window.location.reload();
                  }
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                🔄 タスク完了履歴をリセット
              </button>
              <button
                onClick={() => {
                  if (window.confirm('テストデータを完全にクリアしますか？\n（獲得記録、振り分け待ち、目標貯金、投資など全てのお金データ）\n\nこの操作は取り消せません。')) {
                    clearTestData();
                  }
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                🧹 テストデータを完全クリア
              </button>
              <button
                onClick={() => {
                  if (window.confirm('全てのデータをリセットしますか？\nこの操作は取り消せません。')) {
                    // 全データをリセット
                    const keysToKeep = ['theme', 'language']; // 保持したいキー
                    const allKeys = Object.keys(localStorage);
                    allKeys.forEach(key => {
                      if (!keysToKeep.includes(key)) {
                        localStorage.removeItem(key);
                      }
                    });
                    alert('全データをリセットしました！\nページを再読み込みしてセットアップから始めてください。');
                    window.location.reload();
                  }
                }}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                💥 全データリセット
              </button>
            </div>
          </div>

          <div className="card hover-grow">
            <h3 className="text-xl font-bold text-purple-600 mb-4">🔧 データ修復</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (confirm('memberIdが設定されていないタスクを修復しますか？')) {
                    // 既存タスクのmemberIdを修復
                    const tasks = taskManager?.tasks || [];
                    let fixedCount = 0;

                    tasks.forEach(task => {
                      if (!task.memberId) {
                        // memberIdが未設定の場合、最初の子供メンバーに割り当て
                        const firstChildMember = members.find(m => m.role !== 'admin');
                        if (firstChildMember) {
                          taskManager?.updateTask(task.id, {
                            memberId: firstChildMember.id
                          });
                          fixedCount++;
                        }
                      }
                    });

                    alert(`${fixedCount}個のタスクを修復しました。ページをリロードしてください。`);
                  }
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                🔧 古いタスクのmemberIdを修復
              </button>
            </div>
          </div>

          <div className="card hover-grow">
            <h3 className="text-xl font-bold text-purple-600 mb-4">📅 カレンダー記録編集</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowEditRecord({type: 'pending', show: true})}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                💰 振り分け待ち金額を編集
              </button>

              <button
                onClick={() => setShowEditRecord({type: 'goal', show: true})}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                🎯 目標貯金残高を編集
              </button>

              <button
                onClick={() => setShowEditRecord({type: 'investment', show: true})}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                📈 投資残高を編集
              </button>

              <div className="mt-4 p-4 bg-gray-100 rounded-2xl">
                <h4 className="font-bold text-gray-700 mb-2">💡 使い方のヒント</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• メンバーを番号で選択してください</p>
                  <p>• 月の形式: 2025-09 (年-月)</p>
                  <p>• 現在のメンバー一覧:</p>
                  {members.map((member, index) => (
                    <p key={member.id} className="ml-4">
                      {index + 1}. {member.avatar} {member.name}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-grow">
            <h3 className="text-xl font-bold text-red-600 mb-4">🚨 トラブルシューティング</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                アプリに問題が発生した場合の緊急対応機能です。
              </p>

              <button
                onClick={() => {
                  if (confirm('Supabaseの406エラーが発生していますか？\n\n古いセッションデータをクリアして問題を解決します。')) {
                    localStorageManager.clearSessionData();
                    alert('セッションデータをクリアしました。\nページを再読み込みしてから再度ログインしてください。');
                    window.location.reload();
                  }
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                🔧 406エラー対応：セッションクリア
              </button>

              <button
                onClick={() => {
                  if (confirm('⚠️ 警告: 全てのlocalStorageを完全にクリアします。\n\nアプリのデータが全て削除され、初期状態に戻ります。\nこの操作は取り消せません。実行しますか？')) {
                    localStorageManager.clearCompleteStorage();
                    alert('全てのデータをクリアしました。\nページを再読み込みして最初から設定してください。');
                    window.location.reload();
                  }
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                💥 緊急時：完全データクリア
              </button>
            </div>
          </div>

          <div className="card hover-grow">
            <h3 className="text-xl font-bold text-purple-600 mb-4">🗑️ データ そうさ</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (confirm('全てのデータを削除しますか？この操作は取り消せません。')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                🗑️ すべてのデータを削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カレンダー管理タブ */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-fun">📅 カレンダー管理</h2>

          {/* コントロール */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-lg font-bold text-purple-600 mb-2">メンバー</label>
                <select
                  value={selectedCalendarMember}
                  onChange={(e) => setSelectedCalendarMember(e.target.value)}
                  className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                >
                  <option value="">選択してください</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.avatar} {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-lg font-bold text-purple-600 mb-2">表示月</label>
                <select
                  value={selectedCalendarMonth}
                  onChange={(e) => setSelectedCalendarMonth(e.target.value)}
                  className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                >
                  <option value="2025-08">2025年8月</option>
                  <option value="2025-09">2025年9月</option>
                  <option value="2025-10">2025年10月</option>
                  <option value="2025-11">2025年11月</option>
                  <option value="2025-12">2025年12月</option>
                </select>
              </div>
            </div>
          </div>

          {/* カレンダー表示 */}
          {selectedCalendarMember && (
            <div className="card">
              <h3 className="text-xl font-bold text-purple-600 mb-4">
                {members.find(m => m.id === selectedCalendarMember)?.avatar} {members.find(m => m.id === selectedCalendarMember)?.name}の記録
              </h3>

              <div className="grid grid-cols-7 gap-2 mb-4">
                <div className="text-center font-bold text-gray-600 p-2">日</div>
                <div className="text-center font-bold text-gray-600 p-2">月</div>
                <div className="text-center font-bold text-gray-600 p-2">火</div>
                <div className="text-center font-bold text-gray-600 p-2">水</div>
                <div className="text-center font-bold text-gray-600 p-2">木</div>
                <div className="text-center font-bold text-gray-600 p-2">金</div>
                <div className="text-center font-bold text-gray-600 p-2">土</div>
              </div>

              <div className="grid grid-cols-7 gap-2" key={`${selectedCalendarMember}-${selectedCalendarMonth}-${calendarRefresh}`}>
                {Array.from({length: 35}, (_, i) => {
                  // カレンダーの開始位置を計算（月の1日が何曜日か）
                  const [year, month] = selectedCalendarMonth.split('-').map(Number);
                  const firstDay = new Date(year, month - 1, 1).getDay();
                  const daysInMonth = new Date(year, month, 0).getDate();

                  const day = i - firstDay + 1;
                  const isValidDay = day >= 1 && day <= daysInMonth;
                  const dateStr = isValidDay ? `${selectedCalendarMonth}-${String(day).padStart(2, '0')}` : '';

                  // データ取得
                  // 振り分け待ち金額はカレンダーに表示しない（専用の場所で表示）
                  const pendingMoney = '0';



                  // その日のお手伝い完了による獲得金額を計算
                  let dailyEarnings = 0;
                  if (isValidDay) {
                    const completionsData = localStorage.getItem(`completions-${family?.id}-${selectedCalendarMember}`);
                    const completions: TaskCompletion[] = completionsData ? JSON.parse(completionsData) : [];
                    const dayCompletions = completions.filter(completion =>
                      completion.completedAt.startsWith(dateStr)
                    );
                    dailyEarnings = dayCompletions.reduce((sum, completion) => sum + completion.reward, 0);

                  }

                  // 目標貯金と投資残高は累積なので全日表示しない（特定日のみ）
                  const goalSavings = '0'; // 日別表示には適さないため非表示
                  const investment = '0';  // 日別表示には適さないため非表示

                  return (
                    <div
                      key={i}
                      className={`aspect-square border-2 rounded-xl p-1 text-center ${
                        isValidDay
                          ? 'border-purple-200 hover:border-purple-400 cursor-pointer bg-white hover:bg-purple-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                      onClick={() => isValidDay && setShowCalendarEdit({show: true, date: dateStr, memberId: selectedCalendarMember})}
                    >
                      {isValidDay && (
                        <>
                          <div className="font-bold text-gray-700">{day}</div>
                          {dailyEarnings > 0 && (
                            <div className="text-xs text-orange-600">✨{dailyEarnings}</div>
                          )}
                          {parseInt(pendingMoney) > 0 && (
                            <div className="text-xs text-blue-600">💰{pendingMoney}</div>
                          )}
                          {parseInt(goalSavings) > 0 && (
                            <div className="text-xs text-green-600">🎯{goalSavings}</div>
                          )}
                          {parseInt(investment) > 0 && (
                            <div className="text-xs text-purple-600">📈{investment}</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 bg-orange-100 rounded"></span>
                  <span>✨ お手伝い獲得</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 bg-green-100 rounded"></span>
                  <span>🎯 目標貯金</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 bg-purple-100 rounded"></span>
                  <span>📈 投資残高</span>
                </span>
              </div>
            </div>
          )}

          {!selectedCalendarMember && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-600 mb-4">メンバーを選択してください</h3>
              <p className="text-lg text-gray-500">編集したいメンバーを選んでカレンダーを表示します</p>
            </div>
          )}
        </div>
      )}

      {/* タスク追加モーダル */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-blue-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-fun">
              📝 あたらしい タスク
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const selectedMemberId = formData.get('memberId') as string;

              taskManager.addTask({
                name: formData.get('name') as string,
                description: formData.get('name') as string, // 説明は名前と同じに設定
                icon: formData.get('icon') as string,
                reward: parseInt(formData.get('reward') as string),
                maxCompletionsPerDay: parseInt(formData.get('maxCompletions') as string),
                isActive: true,
                memberId: selectedMemberId,
                familyId: family!.id,
                updatedAt: new Date().toISOString(),
              });
              setShowAddTask(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">だれの タスク？</label>
                  <select
                    name="memberId"
                    required
                    className="w-full p-3 border-3 border-blue-200 rounded-2xl text-lg"
                  >
                    <option value="">だれの タスクか えらんでください</option>
                    {members.filter(member => member.role !== 'admin').map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.avatar} {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">なまえ</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-3 border-3 border-blue-200 rounded-2xl text-lg"
                    placeholder="おさらあらい"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">アイコン</label>
                  <select
                    name="icon"
                    required
                    defaultValue=""
                    className="w-full p-3 border-3 border-blue-200 rounded-2xl text-lg text-center text-3xl"
                    style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji' }}
                  >
                    <option value="" disabled>えらんでください</option>
                    <option value="🍽️">🍽️</option>
                    <option value="🧹">🧹</option>
                    <option value="🧺">🧺</option>
                    <option value="📚">📚</option>
                    <option value="🗑️">🗑️</option>
                    <option value="🌸">🌸</option>
                    <option value="🐕">🐕</option>
                    <option value="🛏️">🛏️</option>
                    <option value="👟">👟</option>
                    <option value="📖">📖</option>
                    <option value="🎯">🎯</option>
                    <option value="🚿">🚿</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">ほうしゅう (えん)</label>
                  <input
                    name="reward"
                    type="number"
                    required
                    min="1"
                    className="w-full p-3 border-3 border-blue-200 rounded-2xl text-lg"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">1日の かいすう</label>
                  <input
                    name="maxCompletions"
                    type="number"
                    required
                    min="1"
                    max="10"
                    className="w-full p-3 border-3 border-blue-200 rounded-2xl text-lg"
                    placeholder="3"
                  />
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-fun"
                >
                  つくる！
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* メンバー追加モーダル */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-purple-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-fun">
              👨‍👩‍👧‍👦 あたらしい メンバー
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              await addMember(
                formData.get('name') as string,
                formData.get('avatar') as string,
                'child',
                formData.get('theme') as 'boy' | 'girl',
                'hiragana'
              );
              setShowAddMember(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">なまえ</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                    placeholder="たろう"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">アバター</label>
                  <input
                    name="avatar"
                    type="text"
                    required
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                    placeholder="👦"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">テーマ</label>
                  <select
                    name="theme"
                    required
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                  >
                    <option value="boy">男の子</option>
                    <option value="girl">女の子</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-fun"
                >
                  ついか！
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* パスコード変更モーダル */}
      {showChangePasscode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-purple-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-fun">
              🔑 パスコード変更
            </h3>

            {passcodeError && (
              <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-3 mb-4">
                <p className="text-red-600 font-bold text-center text-sm">{passcodeError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-lg font-bold text-purple-600 mb-2">新しいパスコード（4桁）</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newPasscode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewPasscode(value);
                    setPasscodeError('');
                  }}
                  className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg text-center font-bold"
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-purple-600 mb-2">確認用パスコード</label>
                <input
                  type="text"
                  maxLength={4}
                  value={confirmPasscode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setConfirmPasscode(value);
                    setPasscodeError('');
                  }}
                  className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg text-center font-bold"
                  placeholder="1234"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowChangePasscode(false);
                  setNewPasscode('');
                  setConfirmPasscode('');
                  setPasscodeError('');
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={handlePasscodeChange}
                className="flex-1 btn-fun"
              >
                変更する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カレンダー記録編集モーダル */}
      {showEditRecord.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-blue-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-fun">
              {showEditRecord.type === 'pending' && '💰 振り分け待ち金額を編集'}
              {showEditRecord.type === 'goal' && '🎯 目標貯金残高を編集'}
              {showEditRecord.type === 'investment' && '📈 投資残高を編集'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const memberId = formData.get('memberId') as string;
              const member = members.find(m => m.id === memberId);
              if (!member) {
                alert('メンバーが見つかりません');
                return;
              }

              const amount = parseInt(formData.get('amount') as string);
              if (isNaN(amount) || amount < 0) {
                alert('正しい金額を入力してください');
                return;
              }

              if (showEditRecord.type === 'pending') {
                const month = formData.get('month') as string;
                if (!month) {
                  alert('月を入力してください');
                  return;
                }
                localStorage.setItem(`pendingMoney-${family?.id}-${memberId}-${month}`, amount.toString());
                alert(`${member.name}の${month}の振り分け待ち金額を${amount}円に変更しました`);
              } else if (showEditRecord.type === 'goal') {
                localStorage.setItem(`goalSavings-${family?.id}-${memberId}`, amount.toString());
                alert(`${member.name}の目標貯金残高を${amount}円に変更しました`);
              } else if (showEditRecord.type === 'investment') {
                localStorage.setItem(`investment-${family?.id}-${memberId}`, amount.toString());
                alert(`${member.name}の投資残高を${amount}円に変更しました`);
              }

              setShowEditRecord({type: 'pending', show: false});
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">
                    メンバー
                  </label>
                  <select
                    name="memberId"
                    required
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                  >
                    <option value="">選択してください</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.avatar} {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                {showEditRecord.type === 'pending' && (
                  <div>
                    <label className="block text-lg font-bold text-purple-600 mb-2">
                      月 (年-月)
                    </label>
                    <input
                      name="month"
                      type="text"
                      required
                      placeholder="2025-09"
                      className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">
                    金額 (円)
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="0"
                    placeholder="1000"
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditRecord({type: 'pending', show: false})}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-fun"
                >
                  変更する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* カレンダー編集モーダル */}
      {showCalendarEdit.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-purple-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-fun">
              📅 {showCalendarEdit.date} のお手伝い詳細
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const member = members.find(m => m.id === showCalendarEdit.memberId);
              if (!member) {
                alert('メンバーが見つかりません');
                return;
              }

              const pendingAmount = parseInt(formData.get('pendingAmount') as string) || 0;

              // 完了記録の更新処理
              Object.entries(editingCompletions).forEach(([taskId, newCount]) => {
                // 各メンバーのTaskManagerを取得して更新
                const memberTaskManager = taskManager; // 現在のTaskManagerを使用
                if (memberTaskManager && showCalendarEdit.memberId === currentMember.id) {
                  memberTaskManager.adjustCompletions(taskId, showCalendarEdit.date, newCount);
                } else {
                  // 他のメンバーの場合は直接localStorage操作
                  const completions = JSON.parse(localStorage.getItem(`completions-${family?.id}-${showCalendarEdit.memberId}`) || '[]');
                  const dateCompletions = completions.filter((c: any) =>
                    c.taskId === taskId && c.completedAt.startsWith(showCalendarEdit.date)
                  );

                  // 実際の調整処理
                  console.log(`📝 タスク ${taskId} の完了回数を ${dateCompletions.length} から ${newCount} に調整 (メンバー: ${showCalendarEdit.memberId})`);

                  const currentCount = dateCompletions.length;
                  let updatedCompletions = [...completions];

                  if (newCount > currentCount) {
                    // 完了記録を追加
                    const task = taskManager.tasks.find(t => t.id === taskId);
                    if (task) {
                      for (let i = 0; i < (newCount - currentCount); i++) {
                        const adjustedTime = new Date(showCalendarEdit.date + 'T12:00:00');
                        adjustedTime.setMinutes(adjustedTime.getMinutes() + i);

                        const completion = {
                          id: generateUUID(),
                          taskId,
                          familyId: family?.id || '',
                          memberId: showCalendarEdit.memberId,
                          completedAt: adjustedTime.toISOString(),
                          reward: task.reward,
                        };

                        updatedCompletions.push(completion);
                      }
                    }
                  } else if (newCount < currentCount) {
                    // 完了記録を削除
                    const toRemove = currentCount - newCount;
                    const sortedDateCompletions = dateCompletions.sort((a, b) =>
                      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                    );

                    for (let i = 0; i < toRemove; i++) {
                      if (sortedDateCompletions[i]) {
                        updatedCompletions = updatedCompletions.filter(c => c.id !== sortedDateCompletions[i].id);
                      }
                    }
                  }

                  // localStorageに保存
                  localStorage.setItem(`completions-${family?.id}-${showCalendarEdit.memberId}`, JSON.stringify(updatedCompletions));
                }
              });

              // 振り分け待ち金額を保存
              if (pendingAmount > 0) {
                localStorage.setItem(`pendingMoney-${family?.id}-${showCalendarEdit.memberId}-${selectedCalendarMonth}`, pendingAmount.toString());
              } else {
                localStorage.removeItem(`pendingMoney-${family?.id}-${showCalendarEdit.memberId}-${selectedCalendarMonth}`);
              }

              // 編集状態をクリア
              setEditingCompletions({});

              // 完了記録更新イベントを発火
              emitMoneyEvent(MoneyEvents.COMPLETIONS_UPDATED, {
                familyId: family?.id || '',
                memberId: showCalendarEdit.memberId,
                timestamp: new Date().toISOString(),
                type: 'admin_edit'
              });

              alert(`${member.name}の${showCalendarEdit.date}の記録を更新しました`);
              setShowCalendarEdit({show: false, date: '', memberId: ''});
              setCalendarRefresh(prev => prev + 1); // カレンダーを強制更新
            }}>
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-4xl">
                    {members.find(m => m.id === showCalendarEdit.memberId)?.avatar}
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {members.find(m => m.id === showCalendarEdit.memberId)?.name}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">
                    💰 この月の振り分け待ち金額 (円)
                  </label>
                  <input
                    name="pendingAmount"
                    type="number"
                    min="0"
                    placeholder="0"
                    defaultValue={
                      localStorage.getItem(`pendingMoney-${family?.id}-${showCalendarEdit.memberId}-${selectedCalendarMonth}`) || '0'
                    }
                    className="w-full p-3 border-3 border-blue-200 rounded-2xl text-lg"
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    ※ これは月全体の振り分け待ち金額です
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">
                    📝 {showCalendarEdit.date}のお手伝い詳細
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 max-h-48 overflow-y-auto">
                    {(() => {
                      // その日のタスク完了記録を取得
                      const completionsData = localStorage.getItem(`completions-${family?.id}-${showCalendarEdit.memberId}`);
                      const completions: TaskCompletion[] = completionsData ? JSON.parse(completionsData) : [];

                      // 選択された日の完了記録をフィルタ
                      const dateCompletions = completions.filter(completion =>
                        completion.completedAt.startsWith(showCalendarEdit.date)
                      );

                      // タスク一覧を取得
                      const tasksData = localStorage.getItem(`tasks-${family?.id}`);
                      const allTasks: Task[] = tasksData ? JSON.parse(tasksData) : [];
                      const memberTasks = allTasks.filter(task => task.memberId === showCalendarEdit.memberId);

                      if (dateCompletions.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-4">
                            <div className="text-2xl mb-2">📋</div>
                            <p>この日はお手伝いの記録がありません</p>
                          </div>
                        );
                      }

                      // タスクIDごとにグループ化して完了回数をカウント
                      const taskCompletions = dateCompletions.reduce((acc, completion) => {
                        if (!acc[completion.taskId]) {
                          acc[completion.taskId] = [];
                        }
                        acc[completion.taskId].push(completion);
                        return acc;
                      }, {} as Record<string, TaskCompletion[]>);

                      let totalEarnings = 0;

                      return (
                        <div className="space-y-3">
                          {Object.entries(taskCompletions).map(([taskId, completions]) => {
                            const task = memberTasks.find(t => t.id === taskId);
                            if (!task) return null;

                            const earnings = task.reward * completions.length;
                            totalEarnings += earnings;

                            return (
                              <div key={taskId} className="bg-white rounded-xl p-3 border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">{task.icon}</span>
                                    <span className="font-bold text-gray-700">{task.name}</span>
                                  </div>
                                  <span className="text-green-600 font-bold">✅</span>
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                  <div>完了回数:
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={editingCompletions[taskId] !== undefined ? editingCompletions[taskId] : completions.length}
                                      onChange={(e) => {
                                        const newCount = parseInt(e.target.value) || 0;
                                        setEditingCompletions(prev => ({
                                          ...prev,
                                          [taskId]: newCount
                                        }));
                                      }}
                                      className="w-16 ml-1 px-1 border rounded text-center"
                                    />
                                    回
                                  </div>
                                  <div>報酬:
                                    <input
                                      type="number"
                                      min="0"
                                      max="1000"
                                      step="10"
                                      value={task.reward}
                                      onChange={(e) => {
                                        const newReward = parseInt(e.target.value) || 0;
                                        // タスク報酬を変更する処理を実装
                                        console.log(`💰 タスク報酬 ${taskId}: ${task.reward}円 -> ${newReward}円`);
                                      }}
                                      className="w-16 ml-1 px-1 border rounded text-center"
                                    />
                                    円 × {completions.length} = {earnings}円
                                  </div>
                                  <div className="text-xs">
                                    {completions.map((completion, index) =>
                                      new Date(completion.completedAt).toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    ).join(', ')}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between items-center font-bold text-lg">
                              <span>📊 この日の合計:</span>
                              <span className="text-blue-600">{totalEarnings}円</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {Object.keys(taskCompletions).length}種類のお手伝い
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    💡 金額を変更すると、タスク完了記録も調整されます
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCalendarEdit({show: false, date: '', memberId: ''})}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-fun"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;