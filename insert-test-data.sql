-- テストデータをSupabaseに投入するSQL
-- test@gmail.com用のデータを作成

-- 1. 一時的にRLS無効化
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 2. 家族データ投入（UUID使用）
INSERT INTO families (id, name, admin_email, admin_password, created_at, updated_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  'テスト家族',
  'test@gmail.com',
  'test123',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  admin_email = EXCLUDED.admin_email,
  updated_at = now();

-- 3. メンバーデータ投入（UUID使用）
INSERT INTO members (id, family_id, name, avatar, role, theme, text_style, display_order, is_active, created_at, updated_at) VALUES
('223e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174001', 'おとうさん', '👨', 'admin', 'boy', 'kanji', 0, true, now(), now()),
('323e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174001', 'たろう', '👦', 'child', 'boy', 'hiragana', 1, true, now(), now()),
('423e4567-e89b-12d3-a456-426614174004', '123e4567-e89b-12d3-a456-426614174001', 'はなこ', '👧', 'child', 'girl', 'hiragana', 2, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  name = EXCLUDED.name,
  updated_at = now();

-- 4. タスクデータ投入
INSERT INTO tasks (id, family_id, member_id, name, description, icon, reward, daily_limit, sort_order, is_active, created_at, updated_at) VALUES
('task-1', 'test-family-1', 'child-1', 'おさらあらい', 'しょっきを きれいに あらう', '🍽️', 50, 3, 0, true, now(), now()),
('task-2', 'test-family-1', 'child-1', 'そうじき', 'りびんぐの そうじき', '🧹', 100, 1, 1, true, now(), now()),
('task-3', 'test-family-1', 'child-2', 'ごみすて', 'ごみを ごみばこに すてる', '🗑️', 30, 2, 0, true, now(), now()),
('task-4', 'test-family-1', 'child-2', 'ふとんあげ', 'じぶんの ふとんを たたむ', '🛏️', 20, 1, 1, true, now(), now()),
('task-5', 'test-family-1', 'child-1', 'おふろそうじ', 'おふろを きれいに する', '🛁', 80, 1, 2, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  name = EXCLUDED.name,
  updated_at = now();

-- 5. 初期残高データ投入
INSERT INTO money_balances (family_id, member_id, available, allocated, spent, total, created_at, updated_at) VALUES
('test-family-1', 'admin-1', 0, 0, 0, 0, now(), now()),
('test-family-1', 'child-1', 150, 50, 25, 125, now(), now()),
('test-family-1', 'child-2', 80, 30, 10, 100, now(), now())
ON CONFLICT (family_id, member_id) DO UPDATE SET
  available = EXCLUDED.available,
  allocated = EXCLUDED.allocated,
  spent = EXCLUDED.spent,
  total = EXCLUDED.total,
  updated_at = now();

-- 6. 確認用クエリ
SELECT 'families' as table_name, count(*) as count FROM families WHERE admin_email = 'test@gmail.com'
UNION ALL
SELECT 'members' as table_name, count(*) as count FROM members WHERE family_id = 'test-family-1'
UNION ALL
SELECT 'tasks' as table_name, count(*) as count FROM tasks WHERE family_id = 'test-family-1';

-- 7. RLS再有効化は手動で行う（動作確認後）
-- ALTER TABLE families ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;