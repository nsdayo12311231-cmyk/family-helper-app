import { useState, useEffect } from 'react';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import { useGoalManager } from '../../hooks/useGoalManager';
import { useMoneyManager } from '../../hooks/useMoneyManager';
import { useEarningManager } from '../../hooks/useEarningManager';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';

const GoalsPage = () => {
  const { currentMember, family } = useNewSupabaseAuth();
  // Hooksを常に呼び出す
  const goalManager = useGoalManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const moneyManager = useMoneyManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const earningManager = useEarningManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState({
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    remainingToGoal: 0
  });
  const { textMode } = useTextDisplay();

  // 進捗データを計算（振り分け済み金額ベース）
  useEffect(() => {
    if (!goalManager || !moneyManager) return;

    // 振り分け済み金額を取得
    const activeGoals = goalManager.getActiveGoals();
    const goalsTotal = activeGoals.reduce((total, goal) => total + goal.currentAmount, 0);
    const goalSavingsBalance = goalManager.getGoalSavingsBalance();
    const totalGoalSavings = goalsTotal + goalSavingsBalance;

    // 投資額と現金額を取得
    const investmentBalance = moneyManager.getInvestmentBalance();
    const availableBalance = moneyManager.balance.available;

    // 週次・月次の振り分け金額（簡易版として現在の合計を表示）
    const weeklyAllocated = totalGoalSavings; // 実際には振り分け履歴から計算する必要がある
    const monthlyAllocated = totalGoalSavings + investmentBalance + availableBalance;

    // 目標まで残り金額を計算
    let remainingToGoal = 0;
    if (activeGoals.length > 0) {
      const goal = activeGoals[0]; // 最初のアクティブな目標
      remainingToGoal = Math.max(0, goal.targetAmount - goal.currentAmount);
    }

    setProgressData({
      weeklyEarnings: weeklyAllocated,
      monthlyEarnings: monthlyAllocated,
      remainingToGoal
    });

  }, [goalManager?.goals, moneyManager?.balance]);

  if (!currentMember || !goalManager || !moneyManager) {
    return null;
  }

  const activeGoals = goalManager.getActiveGoals();
  const completedGoals = goalManager.getCompletedGoals();

  return (
    <div className="p-4 space-y-6">
      {/* げんざいの もくひょう */}
      <div className="card hover-grow">
        <h2 className="text-2xl font-bold text-center mb-6 text-fun">
          🎯 {TEXT_MAPPINGS.currentGoal[textMode]} 🎯
        </h2>

        {activeGoals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-purple-600 mb-4 whitespace-nowrap">
              {TEXT_MAPPINGS.setGoal[textMode]}
            </h3>
            <p className="text-xl text-gray-600 mb-6">
              {TEXT_MAPPINGS.saveMoney[textMode]}
            </p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="btn-fun"
            >
              🎯 {TEXT_MAPPINGS.newGoalTitle[textMode]}
            </button>
          </div>
        ) : (
          <div className="space-y-4">


            {/* 個別目標 */}
            {activeGoals.map((goal) => {
                const individualProgress = goalManager.getGoalProgress(goal.id);
                const isSelected = selectedGoalId === goal.id;

                return (
                <div
                  key={goal.id}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-3 border-2 border-purple-200 shadow-md cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedGoalId(isSelected ? null : goal.id)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl">{goal.icon}</span>
                        <span className="text-lg font-bold text-purple-600">{goal.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`${TEXT_MAPPINGS.goal[textMode]}「${goal.name}」を ${TEXT_MAPPINGS.deleteGoalConfirm[textMode]}`)) {
                            goalManager.deleteGoal(goal.id);
                          }
                        }}
                        className="bg-red-400 hover:bg-red-500 text-white text-sm font-bold py-1 px-2 rounded-lg transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-base text-purple-500 mb-2 ml-1">{goal.targetAmount}{TEXT_MAPPINGS.yen[textMode]}</div>

                    {isSelected && (
                      <>
                        <div className="bg-gray-200 rounded-full h-2 mb-1 border border-gray-300">
                          <div
                            className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${individualProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm font-bold text-purple-600 mb-2 ml-1">
                          {Math.round(individualProgress)}% ({goal.currentAmount}/{goal.targetAmount}{TEXT_MAPPINGS.yen[textMode]})
                        </div>
                      </>
                    )}

                    {goal.currentAmount >= goal.targetAmount && (
                      <div className="flex justify-start ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goalManager.completeGoal(goal.id);
                          }}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-bold py-2 px-3 rounded-lg transition-all"
                        >
                          🎉 {TEXT_MAPPINGS.complete[textMode]}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            <button
              onClick={() => setShowAddGoal(true)}
              className="w-full border-4 border-dashed border-purple-300 rounded-3xl py-8 text-purple-500 hover:bg-purple-50 transition-all"
            >
              <div className="text-4xl mb-2">➕</div>
              <div className="text-xl font-bold">{TEXT_MAPPINGS.newGoalButton[textMode]}</div>
            </button>
          </div>
        )}
      </div>

      {/* しんちょく しょうさい */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          📈 {TEXT_MAPPINGS.progressDetails[textMode]}
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">{TEXT_MAPPINGS.goalSavings[textMode]}:</span>
            <span className="font-bold">{progressData.weeklyEarnings}{TEXT_MAPPINGS.yen[textMode]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{TEXT_MAPPINGS.remainingToGoal[textMode]}:</span>
            <span className="font-bold text-blue-600">
              {activeGoals.length > 0 ? `${progressData.remainingToGoal}${TEXT_MAPPINGS.yen[textMode]}` : TEXT_MAPPINGS.setGoalMessage[textMode]}
            </span>
          </div>
        </div>
      </div>

      {/* たっせい りれき */}
      <div className="card hover-grow">
        <h2 className="text-2xl font-bold text-center mb-6 text-fun">
          🏆 {TEXT_MAPPINGS.achievementHistory[textMode]} 🏆
        </h2>
        {completedGoals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-xl text-gray-600">
              {TEXT_MAPPINGS.noAchievements[textMode]}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-6 border-4 border-yellow-300 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{goal.icon}</div>
                    <div>
                      <div className="text-xl font-bold text-orange-600">{goal.name}</div>
                      <div className="text-lg text-orange-500">{goal.targetAmount}{TEXT_MAPPINGS.yen[textMode]}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">🎉</div>
                    <div className="text-sm font-bold text-green-600">{TEXT_MAPPINGS.complete[textMode]}！</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* あたらしい もくひょう ついか もーだる */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-purple-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-fun">
              🎯 {TEXT_MAPPINGS.newGoalTitle[textMode]} 🎯
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              goalManager.addGoal({
                name: formData.get('name') as string,
                targetAmount: parseInt(formData.get('targetAmount') as string),
                icon: formData.get('icon') as string,
              });
              setShowAddGoal(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">
                    {TEXT_MAPPINGS.name[textMode]}
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                    placeholder="Nintendo Switch"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">
                    {TEXT_MAPPINGS.targetAmount[textMode]}
                  </label>
                  <input
                    name="targetAmount"
                    type="number"
                    required
                    min="1"
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-purple-600 mb-2">
                    {TEXT_MAPPINGS.icon[textMode]}
                  </label>
                  <select
                    name="icon"
                    required
                    defaultValue=""
                    className="w-full p-3 border-3 border-purple-200 rounded-2xl text-lg text-center text-3xl"
                    style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji' }}
                  >
                    <option value="" disabled>{TEXT_MAPPINGS.choose[textMode]}</option>
                    <option value="🎮">🎮</option>
                    <option value="🚲">🚲</option>
                    <option value="📚">📚</option>
                    <option value="🧸">🧸</option>
                    <option value="👟">👟</option>
                    <option value="📱">📱</option>
                    <option value="🎧">🎧</option>
                    <option value="⌚">⌚</option>
                    <option value="🎒">🎒</option>
                    <option value="🧩">🧩</option>
                    <option value="🎨">🎨</option>
                    <option value="⚽">⚽</option>
                    <option value="🏀">🏀</option>
                    <option value="🎸">🎸</option>
                    <option value="🐹">🐹</option>
                    <option value="🍎">🍎</option>
                    <option value="✈️">✈️</option>
                    <option value="🎁">🎁</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  {TEXT_MAPPINGS.cancel[textMode]}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-fun"
                >
                  {TEXT_MAPPINGS.makeGoal[textMode]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;