-- Supabase 406エラー完全修正SQL (UUID版)
-- このSQLを Supabase Dashboard の SQL Editor で実行してください

-- ========================================
-- STEP 1: RLS無効化
-- ========================================
ALTER TABLE IF EXISTS families DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS allowances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_goal_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS point_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reward_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS earning_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_allocations DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: 既存データクリーンアップ
-- ========================================
-- test@gmail.com の既存データを全削除
DO $$
DECLARE
  test_family_id UUID;
BEGIN
  -- 家族IDを取得
  SELECT id INTO test_family_id FROM families WHERE admin_email = 'test@gmail.com';

  IF test_family_id IS NOT NULL THEN
    -- 関連データを削除
    DELETE FROM task_completions WHERE family_id = test_family_id;
    DELETE FROM earning_records WHERE family_id = test_family_id;
    DELETE FROM goals WHERE family_id = test_family_id;
    DELETE FROM money_allocations WHERE family_id = test_family_id;
    DELETE FROM tasks WHERE family_id = test_family_id;
    DELETE FROM money_balances WHERE family_id = test_family_id;
    DELETE FROM members WHERE family_id = test_family_id;
    DELETE FROM families WHERE id = test_family_id;

    RAISE NOTICE '既存のtest@gmail.comデータを削除しました';
  ELSE
    RAISE NOTICE 'test@gmail.comのデータは存在しません';
  END IF;
END $$;

-- ========================================
-- STEP 3: テストデータ投入（UUID使用）
-- ========================================

-- 1. 家族データ
INSERT INTO families (
  id,
  name,
  admin_email,
  admin_password,
  created_at,
  updated_at
) VALUES (
  '123e4567-e89b-12d3-a456-426614174001'::uuid,
  'テスト家族',
  'test@gmail.com',
  'test123',
  now(),
  now()
);

-- 2. メンバーデータ
INSERT INTO members (
  id,
  family_id,
  name,
  avatar,
  role,
  theme,
  text_style,
  display_order,
  is_active,
  created_at,
  updated_at
) VALUES
  -- 管理者（お父さん）
  (
    '223e4567-e89b-12d3-a456-426614174002'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    'おとうさん',
    '👨',
    'admin',
    'boy',
    'kanji',
    0,
    true,
    now(),
    now()
  ),
  -- 子供1（太郎）
  (
    '323e4567-e89b-12d3-a456-426614174003'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    'たろう',
    '👦',
    'child',
    'boy',
    'hiragana',
    1,
    true,
    now(),
    now()
  ),
  -- 子供2（花子）
  (
    '423e4567-e89b-12d3-a456-426614174004'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    'はなこ',
    '👧',
    'child',
    'girl',
    'hiragana',
    2,
    true,
    now(),
    now()
  );

-- 3. タスクデータ（UUID生成関数使用）
INSERT INTO tasks (
  id,
  family_id,
  member_id,
  name,
  description,
  reward,
  icon,
  category,
  daily_limit,
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES
  -- 太郎のタスク
  (
    '523e4567-e89b-12d3-a456-426614174005'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '323e4567-e89b-12d3-a456-426614174003'::uuid,
    'おさらあらい',
    'しょっきを きれいに あらう',
    50,
    '🍽️',
    'キッチン',
    3,
    0,
    true,
    now(),
    now()
  ),
  (
    '623e4567-e89b-12d3-a456-426614174006'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '323e4567-e89b-12d3-a456-426614174003'::uuid,
    'そうじき',
    'りびんぐの そうじき',
    100,
    '🧹',
    'リビング',
    1,
    1,
    true,
    now(),
    now()
  ),
  (
    '723e4567-e89b-12d3-a456-426614174007'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '323e4567-e89b-12d3-a456-426614174003'::uuid,
    'おふろそうじ',
    'おふろを きれいに する',
    80,
    '🛁',
    'お風呂',
    1,
    2,
    true,
    now(),
    now()
  ),
  -- 花子のタスク
  (
    '823e4567-e89b-12d3-a456-426614174008'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '423e4567-e89b-12d3-a456-426614174004'::uuid,
    'ごみすて',
    'ごみを ごみばこに すてる',
    30,
    '🗑️',
    'リビング',
    2,
    0,
    true,
    now(),
    now()
  ),
  (
    '923e4567-e89b-12d3-a456-426614174009'::uuid,
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '423e4567-e89b-12d3-a456-426614174004'::uuid,
    'ふとんあげ',
    'じぶんの ふとんを たたむ',
    20,
    '🛏️',
    '自分の部屋',
    1,
    1,
    true,
    now(),
    now()
  );

-- 4. 初期残高データ（money_balancesテーブルが存在する場合）
INSERT INTO money_balances (
  family_id,
  member_id,
  available,
  allocated,
  spent,
  total,
  created_at,
  updated_at
) VALUES
  -- 管理者
  (
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '223e4567-e89b-12d3-a456-426614174002'::uuid,
    0,
    0,
    0,
    0,
    now(),
    now()
  ),
  -- 太郎（既に150円稼いでいる設定）
  (
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '323e4567-e89b-12d3-a456-426614174003'::uuid,
    150,
    50,
    25,
    125,
    now(),
    now()
  ),
  -- 花子（既に80円稼いでいる設定）
  (
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '423e4567-e89b-12d3-a456-426614174004'::uuid,
    80,
    30,
    10,
    100,
    now(),
    now()
  )
ON CONFLICT (family_id, member_id) DO UPDATE SET
  available = EXCLUDED.available,
  allocated = EXCLUDED.allocated,
  spent = EXCLUDED.spent,
  total = EXCLUDED.total,
  updated_at = now();

-- 5. サンプル目標データ（太郎用）
INSERT INTO goals (
  id,
  family_id,
  member_id,
  title,
  description,
  target_amount,
  icon,
  status,
  created_at,
  updated_at
) VALUES (
  'a23e4567-e89b-12d3-a456-42661417400a'::uuid,
  '123e4567-e89b-12d3-a456-426614174001'::uuid,
  '323e4567-e89b-12d3-a456-426614174003'::uuid,
  'Nintendo Switch',
  'あたらしい げーむきが ほしい！',
  30000,
  '🎮',
  'active',
  now(),
  now()
);

-- ========================================
-- STEP 4: 確認クエリ
-- ========================================
SELECT '✅ データ投入完了' as status;

-- 家族データ確認
SELECT
  '👨‍👩‍👧‍👦 families' as table_name,
  count(*) as count,
  string_agg(name, ', ') as names,
  string_agg(admin_email, ', ') as emails
FROM families
WHERE admin_email = 'test@gmail.com'
GROUP BY 1;

-- メンバーデータ確認
SELECT
  '👤 members' as table_name,
  count(*) as count,
  string_agg(name || ' (' || role || ')', ', ') as members
FROM members
WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
GROUP BY 1;

-- タスクデータ確認
SELECT
  '📝 tasks' as table_name,
  m.name as member_name,
  count(t.*) as task_count,
  string_agg(t.name, ', ') as task_names
FROM tasks t
JOIN members m ON t.member_id = m.id
WHERE t.family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
GROUP BY 1, 2
ORDER BY 2;

-- 残高データ確認
SELECT
  '💰 money_balances' as table_name,
  m.name as member_name,
  mb.total as balance
FROM money_balances mb
JOIN members m ON mb.member_id = m.id
WHERE mb.family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
ORDER BY m.display_order;

-- 目標データ確認
SELECT
  '🎯 goals' as table_name,
  count(*) as count,
  string_agg(title, ', ') as goals
FROM goals
WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
GROUP BY 1;

-- RLS状態確認
SELECT
  '🔒 RLS Status' as info,
  tablename,
  CASE WHEN rowsecurity THEN '有効 ⚠️' ELSE '無効 ✅' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('families', 'members', 'tasks', 'money_balances', 'goals')
ORDER BY tablename;

-- ========================================
-- 最終確認メッセージ
-- ========================================
SELECT
  '🎉 セットアップ完了！' as message,
  'test@gmail.com でログインしてください' as next_step,
  'パスワードは任意（Supabase Authで管理）' as note;
