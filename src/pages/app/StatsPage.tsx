import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import { useEarningManager } from '../../hooks/useEarningManager';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';
import { onMoneyEvent, MoneyEvents } from '../../utils/moneyEvents';

const StatsPage = () => {
  const { currentMember, family } = useNewSupabaseAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const earningManager = useEarningManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const taskManager = useTaskManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const { textMode } = useTextDisplay();

  // 統計データ用のstate
  const [stats, setStats] = useState({
    completedTasks: 0,
    totalEarnings: 0,
    activeDays: 0,
    averageDailyEarnings: 0,
    weeklyData: [0, 0, 0, 0],
    taskRanking: [],
    currentStreak: 0,
    maxStreak: 0
  });

  // 完了記録更新イベントを受信して、データを再読み込み
  useEffect(() => {
    if (!currentMember || !family || !taskManager) return;

    const cleanup = onMoneyEvent(MoneyEvents.COMPLETIONS_UPDATED, (data) => {
      console.log('📊 統計ページ: 完了記録更新イベントを受信', data);

      // 管理者の場合は全メンバーの更新を受信、それ以外は自分のデータのみ
      const shouldRefresh = data.familyId === family.id && (
        data.memberId === currentMember.id || // 自分のデータ
        currentMember.role === 'admin' // または管理者の場合は全員
      );

      if (shouldRefresh) {
        console.log('🔄 統計ページ: データを再読み込み');
        console.log(`  更新されたメンバー: ${data.memberId}`);
        console.log(`  現在のメンバー: ${currentMember.id}`);
        console.log(`  管理者権限: ${currentMember.role === 'admin'}`);
        taskManager.refreshCompletions();
      } else {
        console.log('🔄 統計ページ: 更新対象外 - 再読み込みスキップ');
      }
    });

    return cleanup;
  }, [currentMember, family, taskManager]);

  // 統計データを計算
  useEffect(() => {
    if (!earningManager || !taskManager || !currentMember || !family) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 月初と月末の日付を計算（カレンダーページと同じロジック）
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // EarningRecordから月別データを取得
    const earnings = earningManager.earnings;
    const monthlyEarnings = earnings.filter(earning => {
      const earnedDate = new Date(earning.earnedDate);
      return earnedDate >= monthStart && earnedDate <= monthEnd;
    });

    // TaskCompletionから月別データを取得
    const completions = taskManager.completions;
    const monthlyCompletions = completions.filter(completion => {
      const completedDate = new Date(completion.completedAt);
      return completedDate >= monthStart && completedDate <= monthEnd;
    });

    // 統計計算（TaskCompletionのみから計算）
    const totalEarnings = monthlyCompletions.reduce((sum, completion) => sum + completion.reward, 0);
    const completedTasks = monthlyCompletions.length;

    // アクティブ日数を計算（カレンダーページと同じロジック）
    const activeDays = new Set(
      monthlyCompletions.map(c => c.completedAt.split('T')[0])
    ).size;

    // 平均日収
    const averageDailyEarnings = activeDays > 0 ? Math.round(totalEarnings / activeDays) : 0;

    // 週別データを計算（TaskCompletionから）
    const weeklyData = [0, 0, 0, 0];
    const daysInMonth = monthEnd.getDate();
    for (let week = 0; week < 4; week++) {
      const weekStart = week * 7 + 1;
      const weekEnd = Math.min((week + 1) * 7, daysInMonth);

      const weekCompletions = monthlyCompletions.filter(completion => {
        const completedDate = new Date(completion.completedAt);
        const day = completedDate.getDate();
        return day >= weekStart && day <= weekEnd;
      });

      weeklyData[week] = weekCompletions.reduce((sum, completion) => sum + completion.reward, 0);
    }

    // タスク別ランキング（完了回数順）
    const taskStats = {};
    monthlyCompletions.forEach(completion => {
      const tasks = taskManager.tasks;
      const task = tasks.find(t => t.id === completion.taskId);
      if (task) {
        if (!taskStats[task.id]) {
          taskStats[task.id] = {
            name: task.name,
            count: 0,
            earnings: 0
          };
        }
        taskStats[task.id].count++;
        taskStats[task.id].earnings += completion.reward || 0;
      }
    });

    const taskRanking = Object.values(taskStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 連続記録を計算（簡易版）
    let currentStreak = 0;
    let maxStreak = 0;
    const today = new Date();
    const allCompletionDates = completions.map(c => new Date(c.completedAt).toDateString()).sort();
    const uniqueDates = [...new Set(allCompletionDates)];

    // 現在の連続記録を計算
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const date = new Date(uniqueDates[i]);
      const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

      if (diffDays === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    // 最長記録を計算（簡易版）
    let tempStreak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0 ||
          (new Date(uniqueDates[i]) - new Date(uniqueDates[i-1])) <= (2 * 24 * 60 * 60 * 1000)) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    setStats({
      completedTasks,
      totalEarnings,
      activeDays,
      averageDailyEarnings,
      weeklyData,
      taskRanking,
      currentStreak,
      maxStreak
    });

  }, [earningManager?.earnings, taskManager?.completions, taskManager?.tasks, currentDate]);

  if (!currentMember) {
    return null;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="p-4 space-y-6">
      {/* 月選択 */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h1 className="text-xl font-bold text-gray-800">
          📊 {year}年{monthNames[month]}
        </h1>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* こんげつの じっせき */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          {TEXT_MAPPINGS.monthlyResults[textMode]}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.activeDays}日</div>
            <div className="text-sm text-gray-600">{TEXT_MAPPINGS.executionDays[textMode]}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completedTasks}{TEXT_MAPPINGS.times[textMode]}</div>
            <div className="text-sm text-gray-600">{TEXT_MAPPINGS.totalCompletions[textMode]}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalEarnings}{TEXT_MAPPINGS.yen[textMode]}</div>
            <div className="text-sm text-gray-600">{TEXT_MAPPINGS.earnedAmount[textMode]}</div>
          </div>
        </div>
      </div>

      {/* しゅうべつ グラフ */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          📈 {TEXT_MAPPINGS.weeklyGraph[textMode]}
        </h2>
        <div className="flex items-end justify-around h-32 border-b border-gray-200">
          {stats.weeklyData.map((value, index) => {
            const maxValue = Math.max(...stats.weeklyData);
            const height = maxValue > 0 ? (value / maxValue) * 100 : 2;
            return (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-1">{value}円</div>
                <div
                  className="bg-blue-500 w-8 rounded-t"
                  style={{ height: `${height}px`, minHeight: '2px' }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{index + 1}週</span>
              </div>
            );
          })}
        </div>
        {stats.totalEarnings === 0 && (
          <div className="text-center mt-4 text-gray-500">
            <span className="text-sm">データがありません</span>
          </div>
        )}
      </div>

      {/* タスクべつ ランキング */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          🏆 {TEXT_MAPPINGS.taskRanking[textMode]}
        </h2>
        {stats.taskRanking.length > 0 ? (
          <div className="space-y-3">
            {stats.taskRanking.map((task, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                  </div>
                  <div>
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-gray-500">{task.count}{TEXT_MAPPINGS.timesCompleted[textMode]}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{task.earnings}{TEXT_MAPPINGS.yen[textMode]}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-gray-500">
              {TEXT_MAPPINGS.noTasksCompleted[textMode]}
            </p>
          </div>
        )}
      </div>

      {/* れんぞく きろく */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          🔥 {TEXT_MAPPINGS.streakRecord[textMode]}
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{TEXT_MAPPINGS.currentStreak[textMode]}:</span>
            <span className="font-bold text-orange-600">{stats.currentStreak}日</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{TEXT_MAPPINGS.maxStreak[textMode]}:</span>
            <span className="font-bold text-red-600">{stats.maxStreak}日</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;