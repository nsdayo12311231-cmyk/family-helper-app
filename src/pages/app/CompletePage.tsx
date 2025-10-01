import { useNavigate } from 'react-router-dom';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';

const CompletePage = () => {
  const navigate = useNavigate();
  const { currentMember, family, members, switchMember } = useNewSupabaseAuth();
  const { textMode } = useTextDisplay();

  // Hooksを常に呼び出す（条件分岐の外）
  const taskManager = useTaskManager(
    family?.id || 'temp-family',
    currentMember?.id || 'temp-member'
  );

  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // 管理者の場合は専用画面を表示
  if (currentMember.role === 'admin') {
    const childMembers = members.filter(m => m.role === 'child');

    return (
      <div className="p-4 space-y-6">
        <div className="card hover-grow">
          <div className="text-center">
            <div className="text-6xl mb-4">👨‍💼</div>
            <h2 className="text-3xl font-bold text-fun mb-4">
              おつかれさまです！
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              管理者の方は管理画面をご利用ください
            </p>

            <button
              onClick={() => navigate('/app/admin')}
              className="btn-fun text-xl py-4 px-8 mb-6"
            >
              📊 管理画面を開く
            </button>
          </div>
        </div>

        {childMembers.length > 0 && (
          <div className="card hover-grow">
            <h3 className="text-2xl font-bold text-center text-fun mb-4">
              👦👧 子供の画面を見る
            </h3>
            <div className="grid gap-4">
              {childMembers.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    switchMember(child.id);
                  }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl border-3 border-blue-200 hover:from-blue-200 hover:to-purple-200 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{child.avatar}</span>
                    <span className="text-xl font-bold text-blue-600">
                      {child.name}の画面
                    </span>
                  </div>
                  <span className="text-2xl">👀</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 子供の場合は通常のタスク画面
  if (!taskManager) {
    return null;
  }

  const todayCompletions = taskManager.getTodayCompletionsCount();
  const todayEarnings = taskManager.getTodayEarnings();
  const availableTasks = taskManager.getAvailableTasks();

  return (
    <div className="p-4 space-y-6">
      {/* 今日の成果 */}
      <div className="card hover-grow">
        <h2 className="text-2xl font-bold text-center mb-6 text-fun">
          🌟 {TEXT_MAPPINGS.todaysResults[textMode]} 🌟
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-6 text-center border-4 border-blue-200 shadow-lg">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-blue-600 mb-2 whitespace-nowrap">
              {todayCompletions}{TEXT_MAPPINGS.times[textMode]}
            </div>
            <div className="text-lg font-bold text-blue-500 whitespace-nowrap">
              {TEXT_MAPPINGS.completed[textMode]}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-yellow-100 rounded-3xl p-6 text-center border-4 border-green-200 shadow-lg">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-green-600 mb-2 whitespace-nowrap">
              {todayEarnings}{TEXT_MAPPINGS.yen[textMode]}
            </div>
            <div className="text-lg font-bold text-green-500 whitespace-nowrap">
              {TEXT_MAPPINGS.earned[textMode]}
            </div>
          </div>
        </div>
      </div>


      {/* タスク一覧 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-fun text-center">
          🧹 {TEXT_MAPPINGS.todaysHelp[textMode]} 🧹
        </h2>

        {availableTasks.length === 0 ? (
          <div className="card hover-grow text-center py-12">
            <div className="text-6xl mb-6">📝✨</div>
            <h3 className="text-lg font-bold text-purple-600 mb-4 leading-relaxed">
              {TEXT_MAPPINGS.noTasksYet[textMode]}
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed px-2 max-w-sm mx-auto whitespace-pre-line">
              {TEXT_MAPPINGS.askParents[textMode]}
            </p>
            <div className="flex justify-center space-x-4 text-3xl">
              <span className="bg-yellow-100 rounded-full p-3 border-2 border-yellow-300">💫</span>
              <span className="bg-pink-100 rounded-full p-3 border-2 border-pink-300">🌈</span>
              <span className="bg-blue-100 rounded-full p-3 border-2 border-blue-300">⭐</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {availableTasks.map((task) => {
              const todayCompletions = taskManager.getTodayCompletions(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => {
                    const success = taskManager.completeTask(task.id);
                    if (success) {
                      // Task completed successfully
                    } else {
                      alert(TEXT_MAPPINGS.limitReached[textMode]);
                    }
                  }}
                  className="w-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-200 shadow-md cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <span className="text-3xl">{task.icon}</span>
                      <span className="text-lg font-bold text-purple-600">{task.name}</span>
                    </div>
                    <div className="text-base text-purple-500 mb-2">{task.reward}{TEXT_MAPPINGS.yen[textMode]}</div>

                    <div className="text-sm text-gray-600 mb-2">
                      {TEXT_MAPPINGS.today[textMode]}: {todayCompletions}/{task.maxCompletionsPerDay}{TEXT_MAPPINGS.times[textMode]}
                    </div>

                    <div className="bg-green-400 hover:bg-green-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all inline-block">
                      おてつだい する
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletePage;