import { useState, useEffect } from 'react';
import { useNewSupabaseAuth } from '../../contexts/NewSupabaseAuthContext';
import { useMoneyManager } from '../../hooks/useMoneyManager';
import { useGoalManager } from '../../hooks/useGoalManager';
import { useEarningManager } from '../../hooks/useEarningManager';
import { useInvestmentManager } from '../../hooks/useInvestmentManager';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';
import { emitMoneyEvent, MoneyEvents, onMoneyEvent } from '../../utils/moneyEvents';

const MoneyPage = () => {
  const { currentMember, family } = useNewSupabaseAuth();
  const moneyManager = useMoneyManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const goalManager = useGoalManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const earningManager = useEarningManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const investmentManager = useInvestmentManager(family?.id || 'temp-family', currentMember?.id || 'temp-member');
  const [showHistory, setShowHistory] = useState(false);
  const [showPendingMoney, setShowPendingMoney] = useState(false);
  const [goalAmount, setGoalAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [simulationAmount, setSimulationAmount] = useState(500);
  const { textMode } = useTextDisplay();

  // 振り分け待ちのお小遣いを動的取得
  const [pendingMoney, setPendingMoney] = useState(0);

  // 合計と残額の計算（直接金額ベース）
  const totalAllocated = goalAmount + cashAmount + investmentAmount;
  const remaining = pendingMoney - totalAllocated;
  const [goalTotalAmount, setGoalTotalAmount] = useState(0);
  const [investmentBalance, setInvestmentBalance] = useState(0);
  const [canAllocate, setCanAllocate] = useState(false);
  const [nextAllocationDate, setNextAllocationDate] = useState<Date | null>(null);
  const [allocatableAmount, setAllocatableAmount] = useState(0);

  // リアルタイム更新 - シンプルシステム
  useEffect(() => {
    if (moneyManager && goalManager) {
      // 月ベース制限を適用したペンディングマネーシステムを使用
      const restrictedPendingMoney = moneyManager.getPendingMoneyWithDateRestriction();
      setPendingMoney(restrictedPendingMoney);
      setAllocatableAmount(restrictedPendingMoney);
      const goalsTotal = goalManager.getActiveGoals().reduce((total, goal) => total + goal.currentAmount, 0);
      const goalSavingsBalance = goalManager.getGoalSavingsBalance();
      setGoalTotalAmount(goalsTotal + goalSavingsBalance);
      setInvestmentBalance(moneyManager.getInvestmentBalance());

      // 振り分け可能判定 - 今月分は次月25日以降のルール
      const now = new Date();
      const currentDate = now.getDate();
      const is25thOrLater = currentDate >= 25;

      // 月ベース制限を適用した振り分け可能判定
      const canAllocateRestricted = restrictedPendingMoney > 0;
      setCanAllocate(canAllocateRestricted);

      // 次回振り分け可能日（シンプル）
      setNextAllocationDate(null);
    }
  }, [moneyManager, goalManager]);

  // 5秒ごとに更新（データが変更された場合に反映）
  useEffect(() => {
    // イベントベース更新システムに置き換え
    if (!moneyManager || !goalManager || !currentMember || !family) return;

    // MoneyEventsとonMoneyEventは既にimportされています

    // データ更新ヘルパー
    const refreshAllData = () => {
      const restrictedPendingMoney = moneyManager.getPendingMoneyWithDateRestriction();
      setPendingMoney(restrictedPendingMoney);
      setAllocatableAmount(restrictedPendingMoney);

      const goalsTotal = goalManager.getActiveGoals().reduce((total, goal) => total + goal.currentAmount, 0);
      const goalSavingsBalance = goalManager.getGoalSavingsBalance();
      setGoalTotalAmount(goalsTotal + goalSavingsBalance);

      setInvestmentBalance(moneyManager.getInvestmentBalance());

      const canAllocateRestricted = restrictedPendingMoney > 0;
      setCanAllocate(canAllocateRestricted);
      setNextAllocationDate(null);

      console.log('💫 MoneyPage: データを更新しました');
    };

    // イベントリスナーを設定
    const unsubscribeTaskCompleted = onMoneyEvent(MoneyEvents.TASK_COMPLETED, (data) => {
      if (data.familyId === family.id && data.memberId === currentMember.id) {
        console.log('🎯 タスク完了イベントを受信:', data);
        refreshAllData();
      }
    });

    const unsubscribeMoneyAllocated = onMoneyEvent(MoneyEvents.MONEY_ALLOCATED, (data) => {
      if (data.familyId === family.id && data.memberId === currentMember.id) {
        console.log('💰 振り分け完了イベントを受信:', data);
        refreshAllData();
      }
    });

    const unsubscribeBalanceUpdated = onMoneyEvent(MoneyEvents.BALANCE_UPDATED, (data) => {
      if (data.familyId === family.id && data.memberId === currentMember.id) {
        console.log('⚖️ 残高更新イベントを受信:', data);
        refreshAllData();
      }
    });

    const unsubscribeCompletionsUpdated = onMoneyEvent(MoneyEvents.COMPLETIONS_UPDATED, (data) => {
      // 管理者の場合は全メンバーの更新を受信、それ以外は自分のデータのみ
      const shouldRefresh = data.familyId === family.id && (
        data.memberId === currentMember.id || // 自分のデータ
        currentMember.role === 'admin' // または管理者の場合は全員
      );

      if (shouldRefresh) {
        console.log('📋 完了記録更新イベントを受信:', data);
        console.log(`  管理者権限: ${currentMember.role === 'admin'}`);
        refreshAllData();
      }
    });

    // クリーンアップ
    return () => {
      unsubscribeTaskCompleted();
      unsubscribeMoneyAllocated();
      unsubscribeBalanceUpdated();
      unsubscribeCompletionsUpdated();
    };
  }, [moneyManager, goalManager, currentMember, family]);

  // 振り分け計算（直接金額を返す）
  const allocateAmount = () => {
    return {
      goal: goalAmount,
      cash: cashAmount,
      investment: investmentAmount
    };
  };

  if (!currentMember || !moneyManager || !goalManager) {
    return null;
  }

  const balance = moneyManager.balance;
  const activeGoals = goalManager.getActiveGoals();

  return (
    <div className="p-4 space-y-6">
      {/* 振り分け待ちのお小遣い */}
      <div className={`rounded-3xl p-4 border-4 shadow-lg ${
        pendingMoney > 0
          ? 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300 animate-gentle-pulse'
          : 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300'
      }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">💸</span>
              <div>
                <div className={`font-bold text-lg ${pendingMoney > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  {TEXT_MAPPINGS.pendingAllocation[textMode]}
                </div>
                <div className={`text-sm ${pendingMoney > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {pendingMoney > 0 ? TEXT_MAPPINGS.earnedFromHelp[textMode] : TEXT_MAPPINGS.noPendingMoney[textMode]}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold text-2xl ${pendingMoney > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                {pendingMoney}円
              </div>
              <div className="flex flex-col items-end">
                <button
                  onClick={() => setShowPendingMoney(true)}
                  className={`font-bold py-1 px-3 rounded-xl text-sm transition-all ${
                    pendingMoney > 0 && canAllocate
                      ? 'bg-orange-400 hover:bg-orange-500 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={pendingMoney === 0 || !canAllocate}
                >
                  {pendingMoney > 0
                    ? (canAllocate ? TEXT_MAPPINGS.allocate[textMode] : TEXT_MAPPINGS.pendingAllocation[textMode])
                    : TEXT_MAPPINGS.noPending[textMode]
                  }
                </button>
                {!canAllocate && nextAllocationDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    {nextAllocationDate.getMonth() + 1}月{nextAllocationDate.getDate()}日から可能
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* おかねの ないやく */}
      <div className="card hover-grow">
        <h2 className="text-2xl font-bold text-center mb-6 text-fun">
          💰 {TEXT_MAPPINGS.moneyBreakdown[textMode]} 💰
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-bold text-lg text-blue-600">{TEXT_MAPPINGS.goalSaving[textMode]}</div>
                <div className="text-xs text-blue-500 whitespace-nowrap">
                  {activeGoals.length > 0
                    ? `${activeGoals[0].name} まで ${activeGoals[0].targetAmount - activeGoals[0].currentAmount}${TEXT_MAPPINGS.yen[textMode]}`
                    : TEXT_MAPPINGS.setGoalFirst[textMode]
                  }
                </div>
              </div>
            </div>
            <span className="font-bold text-xl text-blue-600">{goalTotalAmount}{TEXT_MAPPINGS.yen[textMode]}</span>
          </div>

          <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-yellow-50 rounded-2xl p-4 border-2 border-green-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <div className="font-bold text-lg text-green-600">{TEXT_MAPPINGS.cash[textMode]}</div>
                <div className="text-sm text-green-500">{TEXT_MAPPINGS.availableNow[textMode]}</div>
              </div>
            </div>
            <span className="font-bold text-xl text-green-600">{balance.available}{TEXT_MAPPINGS.yen[textMode]}</span>
          </div>

          <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📈</span>
              <div>
                <div className="font-bold text-lg text-blue-600">{TEXT_MAPPINGS.investmentShort[textMode]}</div>
                <div className="text-sm text-blue-500">{TEXT_MAPPINGS.forFuture[textMode]}</div>
              </div>
            </div>
            <span className="font-bold text-xl text-blue-600">{investmentBalance}{TEXT_MAPPINGS.yen[textMode]}</span>
          </div>


          <hr className="my-4 border-2 border-yellow-200" />

          <div className="flex justify-between items-center bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 border-4 border-yellow-300 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">✨</span>
              <span className="font-bold text-2xl text-orange-600">{TEXT_MAPPINGS.total[textMode]}</span>
            </div>
            <span className="font-bold text-2xl text-orange-600">{goalTotalAmount + balance.available + investmentBalance}{TEXT_MAPPINGS.yen[textMode]}</span>
          </div>
        </div>
      </div>

      {/* 投資ポートフォリオ */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4 text-center">
          📈 投資ポートフォリオ
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">💰 投資元本:</span>
            <span className="font-bold">{investmentBalance}円</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">📈 運用益:</span>
            <span className="font-bold text-green-600">+{Math.round(investmentBalance * 0.05)}円</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">💎 現在価値:</span>
            <span className="font-bold text-blue-600">{investmentBalance + Math.round(investmentBalance * 0.05)}円</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">📊 利回り:</span>
            <span className="font-bold">{investmentBalance > 0 ? '+5.0%' : '+0.0%'}</span>
          </div>
        </div>
      </div>

      {/* 投資シミュレーション */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4 text-center">
          🎯 投資シミュレーション
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              シミュレーション額
            </label>
            <input
              type="number"
              value={simulationAmount === 0 ? '' : simulationAmount}
              onChange={(e) => setSimulationAmount(parseInt(e.target.value) || 0)}
              onFocus={() => setSimulationAmount(0)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="500"
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium mb-2">積立投資予想（毎月{simulationAmount}円、年利5%）</div>
            <div className="space-y-1 text-sm">
              {(() => {
                const monthlyRate = 0.05 / 12;
                const calc = (years) => {
                  const months = years * 12;
                  const futureValue = simulationAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
                  const totalInvested = simulationAmount * months;
                  const profit = futureValue - totalInvested;
                  return { futureValue: Math.round(futureValue), totalInvested, profit: Math.round(profit) };
                };

                const year1 = calc(1);
                const year3 = calc(3);
                const year5 = calc(5);
                const year30 = calc(30);

                return (
                  <>
                    <div>予想1年後: {year1.futureValue.toLocaleString()}円 (投資額{year1.totalInvested.toLocaleString()}円 +{year1.profit.toLocaleString()}円)</div>
                    <div>予想3年後: {year3.futureValue.toLocaleString()}円 (投資額{year3.totalInvested.toLocaleString()}円 +{year3.profit.toLocaleString()}円)</div>
                    <div>予想5年後: {year5.futureValue.toLocaleString()}円 (投資額{year5.totalInvested.toLocaleString()}円 +{year5.profit.toLocaleString()}円)</div>
                    <div className="text-orange-600 font-medium">予想30年後: {year30.futureValue.toLocaleString()}円 (投資額{year30.totalInvested.toLocaleString()}円 +{year30.profit.toLocaleString()}円)</div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
            <div className="text-sm text-yellow-700">
              💡 投資は振り分け時のみ可能です
            </div>
          </div>
        </div>
      </div>

      {/* 履歴とツール */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="btn-secondary"
          >
            📊 {TEXT_MAPPINGS.history[textMode]}
          </button>
        </div>

        {/* 投資履歴 */}
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3">📊 投資履歴</h3>
          {investmentManager && investmentManager.getInvestmentHistory().length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {investmentManager.getInvestmentHistory().slice(0, 5).map((record) => (
                <div key={record.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div>
                    <div className="font-medium">{record.amount}円 投資</div>
                    <div className="text-sm text-gray-500">{record.investedDate}</div>
                  </div>
                  <div className="text-sm text-blue-600">振り分け</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-500">まだ投資がありません</p>
              <p className="text-sm text-gray-400 mt-1">振り分け時に投資すると履歴が表示されます</p>
            </div>
          )}
        </div>

        {/* 最近の取引履歴 */}
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3">最近の取引</h3>
          <div className="text-center py-6">
            <div className="text-4xl mb-2">💳</div>
            <p className="text-gray-500">まだ取引がありません</p>
          </div>
        </div>
      </div>



      {/* お小遣い振り分け・設定変更モーダル */}
      {showPendingMoney && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 max-w-md w-full border-4 border-orange-300 shadow-2xl my-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-center mb-4 text-fun">
              💸 お小遣い振り分け 💸
            </h3>

            <div className="space-y-4">
              {/* 稼いだ金額表示 */}
              <div className="text-center">
                <div className="text-3xl mb-1">💰</div>
                <div className="text-lg font-bold text-gray-700 mb-1">稼いだ金額</div>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingMoney}円
                </div>
              </div>

              <hr className="border-1 border-gray-200"/>

              {/* 振り分けかた設定 */}
              <div>
                <div className="text-lg font-bold text-gray-700 text-center mb-2">
                  振り分けかた（実際の金額）
                </div>
                <p className="text-sm text-gray-600 text-center mb-3">
                  {pendingMoney}円を振り分けてね！
                </p>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-bold text-purple-600 mb-1 text-center">
                      🎯 目標
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={pendingMoney}
                      value={goalAmount === 0 ? '' : goalAmount}
                      onChange={(e) => setGoalAmount(Math.max(0, Math.min(pendingMoney, parseInt(e.target.value) || 0)))}
                      onFocus={(e) => {
                        if (goalAmount === 0) {
                          setGoalAmount(0);
                          e.target.value = '';
                        }
                      }}
                      className="w-full p-1.5 border-2 border-purple-200 rounded-xl text-lg text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-green-600 mb-1 text-center">
                      💰 現金
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={pendingMoney}
                      value={cashAmount === 0 ? '' : cashAmount}
                      onChange={(e) => setCashAmount(Math.max(0, Math.min(pendingMoney, parseInt(e.target.value) || 0)))}
                      onFocus={(e) => {
                        if (cashAmount === 0) {
                          setCashAmount(0);
                          e.target.value = '';
                        }
                      }}
                      className="w-full p-1.5 border-2 border-green-200 rounded-xl text-lg text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-600 mb-1 text-center">
                      📈 投資
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={pendingMoney}
                      value={investmentAmount === 0 ? '' : investmentAmount}
                      onChange={(e) => setInvestmentAmount(Math.max(0, Math.min(pendingMoney, parseInt(e.target.value) || 0)))}
                      onFocus={(e) => {
                        if (investmentAmount === 0) {
                          setInvestmentAmount(0);
                          e.target.value = '';
                        }
                      }}
                      className="w-full p-1.5 border-2 border-blue-200 rounded-xl text-lg text-center"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="text-center mb-3">
                  <div className="text-base font-bold text-gray-700">
                    {goalAmount} + {cashAmount} + {investmentAmount} = {totalAllocated}円
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    稼いだ金額: {pendingMoney}円
                  </div>
                  {remaining === 0 ? (
                    <div className="text-green-600 font-bold text-sm">✅ ぴったり！</div>
                  ) : remaining > 0 ? (
                    <div className="text-red-600 font-bold text-sm">⚠️ あと{remaining}円振り分けてください</div>
                  ) : (
                    <div className="text-red-600 font-bold text-sm">⚠️ {Math.abs(remaining)}円多すぎます</div>
                  )}
                </div>
              </div>

              {remaining === 0 && (
                <>
                  <hr className="border-1 border-gray-200"/>

                  {/* 実際の振り分け結果 */}
                  <div>
                    <div className="text-lg font-bold text-gray-700 text-center mb-3">
                      {pendingMoney}円の振り分け結果
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-purple-600">🎯 目標:</span>
                        <span className="text-lg font-bold text-purple-600">
                          {allocateAmount().goal}円
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-green-600">💰 現金:</span>
                        <span className="text-lg font-bold text-green-600">
                          {allocateAmount().cash}円
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-blue-600">📈 投資:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {allocateAmount().investment}円
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => setShowPendingMoney(false)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
              >
                やめる
              </button>
              <button
                onClick={() => {
                  if (remaining === 0 && moneyManager && goalManager) {
                    const allocation = allocateAmount();

                    // 振り分け処理を実行
                    const result = moneyManager.allocatePendingMoney(allocation);

                    if (result) {
                      // 目標貯金は目標管理に追加（目標がなくても目標貯金残高に追加）
                      if (allocation.goal > 0) {
                        goalManager.addToGoalFromAllocation(allocation.goal);
                      }

                      // 状態を即座に更新（実際のデータから再取得）
                      setPendingMoney(0);
                      // 目標貯金: 目標設定分 + 目標貯金残高の合計を取得
                      const goalsTotal = goalManager.getActiveGoals().reduce((total, goal) => total + goal.currentAmount, 0);
                      const goalSavingsBalance = goalManager.getGoalSavingsBalance();
                      const updatedGoalTotal = goalsTotal + goalSavingsBalance;
                      console.log('🎯 目標貯金更新確認:', {
                        目標設定分: goalsTotal,
                        目標貯金残高: goalSavingsBalance,
                        合計: updatedGoalTotal
                      });
                      setGoalTotalAmount(updatedGoalTotal);
                      // 投資残高: moneyManagerから最新の残高を取得
                      const updatedInvestmentBalance = moneyManager.getInvestmentBalance();
                      setInvestmentBalance(updatedInvestmentBalance);

                      // 投資記録を追加（投資額が0より大きい場合）
                      if (allocation.investment > 0 && investmentManager) {
                        investmentManager.addInvestmentRecord(allocation.investment, `allocation-${Date.now()}`);
                      }

                      alert(`振り分け完了！\n🎯目標: ${allocation.goal}円\n💰現金: ${allocation.cash}円\n📈投資: ${allocation.investment}円`);
                      setShowPendingMoney(false);

                      // 振り分け後は入力値をリセット
                      setGoalAmount(0);
                      setCashAmount(0);
                      setInvestmentAmount(0);

                      // バランスをリフレッシュ
                      if (moneyManager) {
                        moneyManager.refreshBalance();
                      }

                      // 振り分け完了イベントを発火
                      if (family && currentMember) {
                        emitMoneyEvent(MoneyEvents.MONEY_ALLOCATED, {
                          familyId: family.id,
                          memberId: currentMember.id,
                          amount: pendingMoney,
                          type: 'allocation',
                          timestamp: new Date().toISOString()
                        });
                      }
                    } else {
                      alert('振り分け処理に失敗しました');
                    }
                  } else {
                    alert('すべての金額を振り分けてください！');
                  }
                }}
                className={`flex-1 font-bold py-3 px-6 rounded-2xl transition-all ${
                  remaining === 0
                    ? 'btn-fun'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={remaining !== 0}
              >
                振り分ける！
              </button>
            </div>
          </div>
        </div>
      )}

      {/* りれき モーダル */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-purple-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-fun">
              📊 おかねの {TEXT_MAPPINGS.history[textMode]} 📊
            </h3>

            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-xl text-gray-600">
                  まだ {TEXT_MAPPINGS.history[textMode]}が ありません
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  お手伝いをして お金をもらうと<br/>
                  ここに履歴が表示されます
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowHistory(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-2xl transition-all"
              >
                とじる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyPage;