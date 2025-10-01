-- Supabase 406エラー完全修正SQL
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

-- ========================================
-- STEP 2: 既存データクリーンアップ
-- ========================================
DELETE FROM task_completions WHERE family_id = '123e4567-e89b-12d3-a456-426614174001';
DELETE FROM tasks WHERE family_id = '123e4567-e89b-12d3-a456-426614174001';
DELETE FROM money_balances WHERE family_id = '123e4567-e89b-12d3-a456-426614174001';
DELETE FROM members WHERE family_id = '123e4567-e89b-12d3-a456-426614174001';
DELETE FROM families WHERE admin_email = 'test@gmail.com';

-- ========================================
-- STEP 3: テストデータ投入
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
  '123e4567-e89b-12d3-a456-426614174001',
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
    '223e4567-e89b-12d3-a456-426614174002',
    '123e4567-e89b-12d3-a456-426614174001',
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
    '323e4567-e89b-12d3-a456-426614174003',
    '123e4567-e89b-12d3-a456-426614174001',
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
    '423e4567-e89b-12d3-a456-426614174004',
    '123e4567-e89b-12d3-a456-426614174001',
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

-- 3. タスクデータ（太郎用）
INSERT INTO tasks (
  id,
  family_id,
  member_id,
  name,
  description,
  icon,
  reward,
  daily_limit,
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES
  -- 太郎のタスク
  (
    'task-taro-001',
    '123e4567-e89b-12d3-a456-426614174001',
    '323e4567-e89b-12d3-a456-426614174003',
    'おさらあらい',
    'しょっきを きれいに あらう',
    '🍽️',
    50,
    3,
    0,
    true,
    now(),
    now()
  ),
  (
    'task-taro-002',
    '123e4567-e89b-12d3-a456-426614174001',
    '323e4567-e89b-12d3-a456-426614174003',
    'そうじき',
    'りびんぐの そうじき',
    '🧹',
    100,
    1,
    1,
    true,
    now(),
    now()
  ),
  (
    'task-taro-003',
    '123e4567-e89b-12d3-a456-426614174001',
    '323e4567-e89b-12d3-a456-426614174003',
    'おふろそうじ',
    'おふろを きれいに する',
    '🛁',
    80,
    1,
    2,
    true,
    now(),
    now()
  ),
  -- 花子のタスク
  (
    'task-hanako-001',
    '123e4567-e89b-12d3-a456-426614174001',
    '423e4567-e89b-12d3-a456-426614174004',
    'ごみすて',
    'ごみを ごみばこに すてる',
    '🗑️',
    30,
    2,
    0,
    true,
    now(),
    now()
  ),
  (
    'task-hanako-002',
    '123e4567-e89b-12d3-a456-426614174001',
    '423e4567-e89b-12d3-a456-426614174004',
    'ふとんあげ',
    'じぶんの ふとんを たたむ',
    '🛏️',
    20,
    1,
    1,
    true,
    now(),
    now()
  );

-- 4. 初期残高データ
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
    '123e4567-e89b-12d3-a456-426614174001',
    '223e4567-e89b-12d3-a456-426614174002',
    0,
    0,
    0,
    0,
    now(),
    now()
  ),
  -- 太郎
  (
    '123e4567-e89b-12d3-a456-426614174001',
    '323e4567-e89b-12d3-a456-426614174003',
    150,
    50,
    25,
    125,
    now(),
    now()
  ),
  -- 花子
  (
    '123e4567-e89b-12d3-a456-426614174001',
    '423e4567-e89b-12d3-a456-426614174004',
    80,
    30,
    10,
    100,
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
  string_agg(name, ', ') as names
FROM families
WHERE admin_email = 'test@gmail.com'
GROUP BY 1;

-- メンバーデータ確認
SELECT
  '👤 members' as table_name,
  count(*) as count,
  string_agg(name, ', ') as names
FROM members
WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'
GROUP BY 1;

-- タスクデータ確認
SELECT
  '📝 tasks' as table_name,
  count(*) as count,
  string_agg(name, ', ') as task_names
FROM tasks
WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'
GROUP BY 1;

-- 残高データ確認
SELECT
  '💰 money_balances' as table_name,
  count(*) as count,
  sum(total) as total_money
FROM money_balances
WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'
GROUP BY 1;

-- RLS状態確認
SELECT
  '🔒 RLS Status' as info,
  tablename,
  CASE WHEN rowsecurity THEN '有効' ELSE '無効' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('families', 'members', 'tasks', 'money_balances')
ORDER BY tablename;

-- 最終確認メッセージ
SELECT
  '✅ セットアップ完了！' as message,
  'test@gmail.com でログインしてください' as next_step;
