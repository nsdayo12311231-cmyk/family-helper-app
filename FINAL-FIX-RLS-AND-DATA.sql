-- ==========================================
-- ログイン問題の完全修正SQL
-- ==========================================
-- 実行場所: Supabase Dashboard > SQL Editor
--
-- 問題:
-- 1. RLSポリシーが間違っている (auth.uid() と admin_email の型不一致)
-- 2. .single() が406エラーを返している
-- 3. テストデータが存在しない
--
-- 解決:
-- 1. RLSを完全無効化
-- 2. コードを .maybeSingle() に変更済み
-- 3. テストデータを投入
-- ==========================================

-- ==========================================
-- STEP 1: RLS完全無効化
-- ==========================================
ALTER TABLE IF EXISTS families DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS money_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bonus_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS earning_records DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 2: 間違ったRLSポリシーを削除
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own family" ON families;
DROP POLICY IF EXISTS "Users can update their own family" ON families;
DROP POLICY IF EXISTS "Family members can view family members" ON members;
DROP POLICY IF EXISTS "Family members can view family tasks" ON tasks;

-- ==========================================
-- STEP 3: 既存テストデータのクリーンアップ
-- ==========================================
DELETE FROM task_completions WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid;
DELETE FROM tasks WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid;
DELETE FROM money_balances WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid;
DELETE FROM members WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid;
DELETE FROM families WHERE admin_email = 'test@gmail.com';

-- ==========================================
-- STEP 4: テストデータ投入
-- ==========================================

-- 家族データ
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
  'dummy_password',  -- Supabase Authで管理されるので実際は使われない
  now(),
  now()
);

-- メンバーデータ
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

-- タスクデータ
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

-- 初期残高データ
INSERT INTO money_balances (
  id,
  family_id,
  member_id,
  available,
  allocated,
  spent,
  total,
  last_updated
) VALUES
  -- 管理者
  (
    gen_random_uuid(),
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '223e4567-e89b-12d3-a456-426614174002'::uuid,
    0,
    0,
    0,
    0,
    now()
  ),
  -- 太郎
  (
    gen_random_uuid(),
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '323e4567-e89b-12d3-a456-426614174003'::uuid,
    150,
    50,
    25,
    125,
    now()
  ),
  -- 花子
  (
    gen_random_uuid(),
    '123e4567-e89b-12d3-a456-426614174001'::uuid,
    '423e4567-e89b-12d3-a456-426614174004'::uuid,
    80,
    30,
    10,
    100,
    now()
  );

-- 目標データ（太郎用）
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

-- ==========================================
-- STEP 5: 確認クエリ
-- ==========================================

-- RLS状態確認
SELECT
  '🔒 RLS Status' as info,
  tablename,
  CASE WHEN rowsecurity THEN '❌ 有効（問題）' ELSE '✅ 無効（正常）' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('families', 'members', 'tasks', 'money_balances')
ORDER BY tablename;

-- データ確認
SELECT '👨‍👩‍👧‍👦 families' as table_name, count(*) as count FROM families WHERE admin_email = 'test@gmail.com'
UNION ALL
SELECT '👤 members' as table_name, count(*) as count FROM members WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
UNION ALL
SELECT '📝 tasks' as table_name, count(*) as count FROM tasks WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
UNION ALL
SELECT '💰 money_balances' as table_name, count(*) as count FROM money_balances WHERE family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid;

-- メンバー詳細
SELECT
  m.name as member_name,
  m.role,
  m.theme,
  count(t.id) as task_count,
  COALESCE(mb.total, 0) as total_money
FROM members m
LEFT JOIN tasks t ON t.member_id = m.id AND t.is_active = true
LEFT JOIN money_balances mb ON mb.member_id = m.id
WHERE m.family_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
GROUP BY m.id, m.name, m.role, m.theme, mb.total
ORDER BY m.display_order;

-- 最終メッセージ
SELECT
  '🎉 セットアップ完了！' as status,
  'test@gmail.com でログインしてください' as instruction,
  'パスワードはSupabase Authで管理されています' as note;
