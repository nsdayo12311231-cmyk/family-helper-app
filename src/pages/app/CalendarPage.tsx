import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';
import { onMoneyEvent, MoneyEvents } from '../../utils/moneyEvents';

const CalendarPage = () => {
  const { currentMember, family } = useNewSupabaseAuth();
  const taskManager = useTaskManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { textMode } = useTextDisplay();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  // 完了記録更新イベントを受信して、データを再読み込み
  useEffect(() => {
    if (!currentMember || !family || !taskManager) return;

    console.log('🗓️ カレンダーページ: イベントリスナー設定');
    console.log('🗓️ 現在のメンバーID:', currentMember.id);
    console.log('🗓️ 現在の家族ID:', family.id);

    const cleanup = onMoneyEvent(MoneyEvents.COMPLETIONS_UPDATED, (data) => {
      console.log('🗓️ カレンダーページ: 完了記録更新イベントを受信', data);
      console.log('🗓️ 現在のメンバーID:', currentMember.id);
      console.log('🗓️ 現在の家族ID:', family.id);

      // 管理者の場合は全メンバーの更新を受信、それ以外は自分のデータのみ
      const shouldRefresh = data.familyId === family.id && (
        data.memberId === currentMember.id || // 自分のデータ
        currentMember.role === 'admin' // または管理者の場合は全員
      );

      if (shouldRefresh) {
        console.log('🔄 カレンダーページ: データを再読み込み');
        console.log(`  更新されたメンバー: ${data.memberId}`);
        console.log(`  現在のメンバー: ${currentMember.id}`);
        console.log(`  管理者権限: ${currentMember.role === 'admin'}`);
        taskManager.refreshCompletions();
      } else {
        console.log('🔄 カレンダーページ: 更新対象外 - 再読み込みスキップ');
        console.log(`  更新されたメンバー: ${data.memberId}, 現在のメンバー: ${currentMember.id}`);
        console.log(`  管理者権限: ${currentMember.role === 'admin'}`);
      }
    });

    return cleanup;
  }, [currentMember, family, taskManager]);

  if (!currentMember || !taskManager) {
    return null;
  }

  const completions = taskManager.completions;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日を取得
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // 週の最初の日に調整

  // カレンダーの日付配列を生成
  const calendarDays = [];
  const currentDateForLoop = new Date(startDate);

  for (let i = 0; i < 42; i++) { // 6週間分
    calendarDays.push(new Date(currentDateForLoop));
    currentDateForLoop.setDate(currentDateForLoop.getDate() + 1);
  }

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  // カレンダー用のヘルパー関数
  const getDateCompletions = (date: Date) => {
    // タイムゾーンの問題を避けるため、ローカル日付文字列を使用
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return completions.filter(c => c.completedAt.startsWith(dateStr));
  };

  const hasCompletions = (date: Date) => {
    return getDateCompletions(date).length > 0;
  };

  const getMonthlyStats = () => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    console.log('=== カレンダー統計デバッグ ===');
    console.log('月の範囲:', monthStart, 'から', monthEnd);
    console.log('全completions:', completions.length, completions);

    const monthCompletions = completions.filter(c => {
      const completionDate = new Date(c.completedAt);
      const isInMonth = completionDate >= monthStart && completionDate <= monthEnd;
      console.log('完了記録:', c.completedAt, '月内:', isInMonth, '報酬:', c.reward);
      return isInMonth;
    });

    console.log('月内completions:', monthCompletions.length, monthCompletions);

    const completedDays = new Set(
      monthCompletions.map(c => c.completedAt.split('T')[0])
    ).size;

    const totalCompletions = monthCompletions.length;
    const totalEarnings = monthCompletions.reduce((sum, c) => sum + c.reward, 0);

    console.log('結果 - 実行日数:', completedDays, '完了回数:', totalCompletions, '獲得金額:', totalEarnings);

    return {
      completedDays,
      totalCompletions,
      totalEarnings
    };
  };

  const monthlyStats = getMonthlyStats();

  // 日付クリック時のハンドラー
  const handleDateClick = (date: Date) => {
    if (isCurrentMonth(date) && hasCompletions(date)) {
      setSelectedDate(date);
      setShowDayDetail(true);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h1 className="text-xl font-bold text-gray-800">
          {year}年{monthNames[month]}
        </h1>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* カレンダー */}
      <div className="card">
        {/* 凡例 */}
        <div className="flex items-center justify-center mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span>{TEXT_MAPPINGS.taskCompletion[textMode]}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>{TEXT_MAPPINGS.today[textMode]}</span>
            </div>
          </div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const isCurrentMonthDate = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const dateHasCompletions = hasCompletions(date);
            const dateCompletions = getDateCompletions(date);
            const completionCount = dateCompletions.length;

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  aspect-square flex flex-col items-center justify-center text-sm relative cursor-pointer rounded-lg transition-colors p-1
                  ${isCurrentMonthDate ? 'text-gray-800 hover:bg-gray-50' : 'text-gray-300'}
                  ${isTodayDate ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                  ${dateHasCompletions && isCurrentMonthDate ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md' : ''}
                `}
              >
                <span className="font-medium">{date.getDate()}</span>

                {/* 星とタスク完了数の表示 */}
                {isCurrentMonthDate && dateHasCompletions && (
                  <div className="flex items-center space-x-1 mt-0.5">
                    <Star
                      className={`w-3 h-3 ${isTodayDate ? 'text-yellow-300' : 'text-yellow-500'} fill-current`}
                    />
                    {completionCount > 1 && (
                      <span className={`text-xs font-bold ${isTodayDate ? 'text-yellow-300' : 'text-orange-600'}`}>
                        {completionCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* こんげつの じっせき */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          📊 {TEXT_MAPPINGS.monthlyResults[textMode]}
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">{TEXT_MAPPINGS.executionDays[textMode]}:</span>
            <span className="font-bold">{monthlyStats.completedDays}日</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{TEXT_MAPPINGS.totalCompletions[textMode]}:</span>
            <span className="font-bold">{monthlyStats.totalCompletions}かい</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{TEXT_MAPPINGS.earnedAmount[textMode]}:</span>
            <span className="font-bold text-green-600">{monthlyStats.totalEarnings}えん</span>
          </div>
        </div>
      </div>

      {/* 日別詳細モーダル */}
      {showDayDetail && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-purple-600 mb-2">
                  📅 {selectedDate.getFullYear()}-{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-{selectedDate.getDate().toString().padStart(2, '0')} のお手伝い詳細
                </h2>
                <div className="text-sm text-gray-600">
                  {currentMember.name}さんの記録
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const dayCompletions = getDateCompletions(selectedDate);
                  const taskGroups = dayCompletions.reduce((acc, completion) => {
                    const task = taskManager.tasks.find(t => t.id === completion.taskId);
                    if (task) {
                      if (!acc[task.id]) {
                        acc[task.id] = { task, completions: [] };
                      }
                      acc[task.id].completions.push(completion);
                    }
                    return acc;
                  }, {} as Record<string, { task: any; completions: any[] }>);

                  let totalEarnings = 0;

                  return (
                    <>
                      {Object.values(taskGroups).map(({ task, completions }) => {
                        const earnings = task.reward * completions.length;
                        totalEarnings += earnings;

                        return (
                          <div key={task.id} className="bg-gray-50 rounded-xl p-4 border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{task.icon}</span>
                                <span className="font-bold text-gray-700">{task.name}</span>
                              </div>
                              <span className="text-green-600 font-bold">✅</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>完了回数: {completions.length}回</div>
                              <div>報酬: {task.reward}円 × {completions.length} = {earnings}円</div>
                              <div className="text-xs mt-1">
                                完了時刻: {completions.map(completion =>
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

                      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>📊 この日の合計:</span>
                          <span className="text-blue-600">{totalEarnings}円</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {Object.keys(taskGroups).length}種類のお手伝い、{dayCompletions.length}回完了
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowDayDetail(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-2xl transition-all"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;