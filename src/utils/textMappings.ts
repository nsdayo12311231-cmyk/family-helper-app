// テキスト表記の辞書

export const TEXT_MAPPINGS = {
  // ページタイトル
  todaysResults: { hiragana: 'きょうの せいか', kanji: '今日の成果' },
  currentGoal: { hiragana: 'げんざいの もくひょう', kanji: '現在の目標' },
  achievementHistory: { hiragana: 'たっせい りれき', kanji: '達成履歴' },
  moneyBreakdown: { hiragana: 'おかねの ないやく', kanji: 'お金の内訳' },
  todaysHelp: { hiragana: 'きょうの おてつだい', kanji: '今日のお手伝い' },
  adminScreen: { hiragana: 'かんりしゃ がめん', kanji: '管理者画面' },

  // ボタン・アクション
  completed: { hiragana: 'かんりょう', kanji: '完了' },
  earned: { hiragana: 'かくとく', kanji: '獲得' },
  cancel: { hiragana: 'やめる', kanji: 'キャンセル' },
  create: { hiragana: 'つくる！', kanji: '作成！' },
  add: { hiragana: 'ついか！', kanji: '追加！' },
  delete: { hiragana: 'さくじょ', kanji: '削除' },
  edit: { hiragana: 'へんしゅう', kanji: '編集' },
  settings: { hiragana: 'せってい', kanji: '設定' },

  // タブ・カテゴリ
  wallet: { hiragana: 'うぉれっと', kanji: 'ウォレット' },
  investment: { hiragana: 'とうし', kanji: '投資' },
  tasks: { hiragana: 'たすく', kanji: 'タスク' },
  members: { hiragana: 'めんばー', kanji: 'メンバー' },
  history: { hiragana: 'りれき', kanji: '履歴' },
  goal: { hiragana: 'もくひょう', kanji: '目標' },
  calendar: { hiragana: 'かれんだー', kanji: 'カレンダー' },
  statistics: { hiragana: 'とうけい', kanji: '統計' },
  allowance: { hiragana: 'おこづかい', kanji: 'お小遣い' },

  // お金関連
  goalSaving: { hiragana: 'もくひょう ちょきん', kanji: '目標貯金' },
  freeMoney: { hiragana: 'じゆうな おかね', kanji: '自由なお金' },
  spentMoney: { hiragana: 'つかった おかね', kanji: '使ったお金' },
  total: { hiragana: 'ぜんぶで', kanji: '合計' },
  yen: { hiragana: 'えん', kanji: '円' },

  // 目標・タスク関連
  setGoal: { hiragana: 'もくひょうを せっていしよう', kanji: '目標を設定しよう' },
  progressDetails: { hiragana: 'しんちょく しょうさい', kanji: '進捗詳細' },
  noTasksYet: { hiragana: 'まだ おてつだいが ないよ！', kanji: 'まだお手伝いがないよ！' },
  askParents: { hiragana: 'おとうさんや おかあさんに\nおてつだいを ついかして もらおう', kanji: 'お父さんやお母さんに\nお手伝いを追加してもらおう' },

  // フォーム項目
  name: { hiragana: 'なまえ', kanji: '名前' },
  description: { hiragana: 'せつめい', kanji: '説明' },
  icon: { hiragana: 'あいこん', kanji: 'アイコン' },
  reward: { hiragana: 'ほうしゅう', kanji: '報酬' },
  amount: { hiragana: 'きんがく', kanji: '金額' },
  dailyLimit: { hiragana: '1日の かいすう', kanji: '1日の回数' },
  theme: { hiragana: 'てーま', kanji: 'テーマ' },

  // 時間関連
  today: { hiragana: 'きょう', kanji: '今日' },
  thisWeek: { hiragana: 'こんしゅう', kanji: '今週' },
  thisMonth: { hiragana: 'こんげつ', kanji: '今月' },
  times: { hiragana: 'かい', kanji: '回' },

  // メッセージ
  congratulations: { hiragana: '🎉 もくひょう たっせい！', kanji: '🎉 目標達成！' },
  keepSaving: { hiragana: 'がんばって ちょきんしよう！', kanji: '頑張って貯金しよう！' },
  limitReached: { hiragana: 'きょうは もう せいげんかいすう やったよ！', kanji: '今日はもう制限回数やったよ！' },
  accessRestricted: { hiragana: 'あくせすが せいげん されています', kanji: 'アクセスが制限されています' },
  adminOnly: { hiragana: 'このがめんは かんりしゃのみ あくせすできます', kanji: 'この画面は管理者のみアクセスできます' },

  // その他
  boy: { hiragana: 'おとこのこ', kanji: '男の子' },
  girl: { hiragana: 'おんなのこ', kanji: '女の子' },
  admin: { hiragana: 'かんりしゃ', kanji: '管理者' },
  child: { hiragana: 'こども', kanji: '子供' },
  family: { hiragana: 'かぞく', kanji: '家族' },
  familyInfo: { hiragana: 'かぞく じょうほう', kanji: '家族情報' },
  dataOperation: { hiragana: 'でーた そうさ', kanji: 'データ操作' },
  deleteAllData: { hiragana: 'すべてのでーたを さくじょ', kanji: '全てのデータを削除' },
  helping: { hiragana: 'おてつだい', kanji: 'お手伝い' },

  // Goals Page用の追加テキスト
  saveMoney: { hiragana: 'ほしいものを もくひょうにして\nおかねを ためてみよう', kanji: '欲しいものを目標にして\nお金を貯めてみよう' },
  newGoalTitle: { hiragana: 'あたらしい もくひょうを せってい', kanji: '新しい目標を設定' },
  newGoalButton: { hiragana: 'あたらしい もくひょう', kanji: '新しい目標' },
  complete: { hiragana: 'かんせい', kanji: '完成' },
  goalSavings: { hiragana: 'もくひょう ちょきん', kanji: '目標貯金' },
  remainingToGoal: { hiragana: 'もくひょうまで', kanji: '目標まで' },
  setGoalMessage: { hiragana: 'もくひょうを せっていしてね', kanji: '目標を設定してね' },
  targetAmount: { hiragana: 'きんがく', kanji: '金額' },
  choose: { hiragana: 'えらんでください', kanji: '選んでください' },
  makeGoal: { hiragana: 'つくる！', kanji: '作成！' },
  noAchievements: { hiragana: 'まだ たっせいした もくひょうが ありません', kanji: 'まだ達成した目標がありません' },
  deleteGoalConfirm: { hiragana: 'さくじょしますか？ためたおかねは りようかのうきんがくに もどります。', kanji: '削除しますか？貯めたお金は利用可能金額に戻ります。' },

  // Calendar Page用の追加テキスト
  monthlyResults: { hiragana: 'こんげつの じっせき', kanji: '今月の実績' },
  executionDays: { hiragana: 'じっこう にっすう', kanji: '実行日数' },
  totalCompletions: { hiragana: 'そう かんりょう かいすう', kanji: '総完了回数' },
  earnedAmount: { hiragana: 'かくとく きんがく', kanji: '獲得金額' },
  taskCompletion: { hiragana: 'タスク かんりょう', kanji: 'タスク完了' },

  // Stats Page用の追加テキスト
  weeklyGraph: { hiragana: 'しゅうべつ グラフ', kanji: '週別グラフ' },
  taskRanking: { hiragana: 'タスクべつ ランキング', kanji: 'タスク別ランキング' },
  streakRecord: { hiragana: 'れんぞく きろく', kanji: '連続記録' },
  currentStreak: { hiragana: 'げんざいの れんぞく きろく', kanji: '現在の連続記録' },
  maxStreak: { hiragana: 'さいちょう きろく', kanji: '最長記録' },
  noTasksCompleted: { hiragana: 'まだ かんりょうした タスクが ありません', kanji: 'まだ完了したタスクがありません' },
  timesCompleted: { hiragana: 'かい かんりょう', kanji: '回完了' },

  // Money Page用の追加テキスト
  setGoalFirst: { hiragana: 'もくひょうを せっていしよう', kanji: '目標を設定しよう' },
  availableNow: { hiragana: 'いますぐ つかえる', kanji: '今すぐ使える' },
  forFuture: { hiragana: 'みらいのため', kanji: '未来のため' },
  cash: { hiragana: 'げんきん', kanji: '現金' },
  investmentShort: { hiragana: 'とうし', kanji: '投資' },
  pendingAllocation: { hiragana: 'ふりわけ まち', kanji: '振り分け待ち' },
  earnedFromHelp: { hiragana: 'おてつだいで もらった おかね', kanji: 'お手伝いで もらった お金' },
  noPendingMoney: { hiragana: 'げんざい ふりわけまちの おかねは ありません', kanji: '現在 振り分け待ちの お金は ありません' },
  allocate: { hiragana: 'ふりわける', kanji: '振り分ける' },
  noPending: { hiragana: 'ふりわけまち なし', kanji: '振り分け待ち なし' },
} as const;

// ヘルパー関数
export const getText = (key: keyof typeof TEXT_MAPPINGS, mode: 'hiragana' | 'kanji' = 'hiragana'): string => {
  return TEXT_MAPPINGS[key][mode];
};

// よく使われるフレーズの組み合わせ
export const getComplexText = (mode: 'hiragana' | 'kanji' = 'hiragana') => ({
  newGoal: mode === 'hiragana' ? 'あたらしい もくひょうを せってい' : '新しい目標を設定',
  newTask: mode === 'hiragana' ? 'あたらしい たすく' : '新しいタスク',
  newMember: mode === 'hiragana' ? 'あたらしい めんばー' : '新しいメンバー',
  allocation: mode === 'hiragana' ? 'ふりわけ せってい' : '振り分け設定',
  investment: mode === 'hiragana' ? 'とうし ぽーとふぉりお' : '投資ポートフォリオ',
  simulation: mode === 'hiragana' ? 'とうし しみゅれーしょん' : '投資シミュレーション',
  recentTransactions: mode === 'hiragana' ? 'さいきんの とりひき りれき' : '最近の取引履歴',
  progressDetails: mode === 'hiragana' ? 'しんちょく しょうさい' : '進捗詳細'
});