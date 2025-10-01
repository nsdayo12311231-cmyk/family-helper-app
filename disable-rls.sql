-- Supabase RLS完全無効化スクリプト
-- 406エラー対応のため、全テーブルでRow Level Securityを無効化

-- 1. 全テーブルでRLSを無効化
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE money_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE allowances DISABLE ROW LEVEL SECURITY;
ALTER TABLE money_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE money_goal_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE points DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims DISABLE ROW LEVEL SECURITY;

-- 2. 既存のRLSポリシーがあれば削除
-- families テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON families;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON families;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON families;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON families;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON families;

-- members テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON members;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON members;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON members;

-- tasks テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON tasks;

-- task_completions テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON task_completions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON task_completions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON task_completions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON task_completions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON task_completions;

-- money_balances テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON money_balances;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON money_balances;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON money_balances;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON money_balances;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON money_balances;

-- money_transactions テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON money_transactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON money_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON money_transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON money_transactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON money_transactions;

-- allowances テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON allowances;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON allowances;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON allowances;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON allowances;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON allowances;

-- money_goals テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON money_goals;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON money_goals;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON money_goals;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON money_goals;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON money_goals;

-- money_goal_transactions テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON money_goal_transactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON money_goal_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON money_goal_transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON money_goal_transactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON money_goal_transactions;

-- points テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON points;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON points;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON points;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON points;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON points;

-- point_transactions テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON point_transactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON point_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON point_transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON point_transactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON point_transactions;

-- rewards テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON rewards;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rewards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rewards;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON rewards;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON rewards;

-- reward_claims テーブルのポリシー削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON reward_claims;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON reward_claims;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reward_claims;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON reward_claims;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON reward_claims;

-- 3. RLSが無効化されたことを確認するクエリ
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'families', 'members', 'tasks', 'task_completions',
    'money_balances', 'money_transactions', 'allowances',
    'money_goals', 'money_goal_transactions', 'points',
    'point_transactions', 'rewards', 'reward_claims'
)
ORDER BY tablename;

-- 注意事項:
-- - この操作により、全ユーザーが全てのデータにアクセス可能になります
-- - 本番環境では適切なセキュリティ対策を再実装してください
-- - 406エラーが解決した後は、適切なRLSポリシーを再設定することを推奨します

-- 実行完了メッセージ
SELECT 'RLS無効化が完了しました。406エラーの解決を確認してください。' AS message;