-- Supabase Auth完全移行スクリプト（実際のテーブルに基づく）

-- 1. familiesテーブルにSupabase AuthのユーザーIDカラムを追加
ALTER TABLE families
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);

-- 2. admin_passwordカラムを削除（後で実行）
-- 注意: 移行完了後に実行することを推奨
-- ALTER TABLE families DROP COLUMN IF EXISTS admin_password;

-- 3. 全テーブルでRow Level Security (RLS) を有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE earning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 4. 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own family" ON families;
DROP POLICY IF EXISTS "Users can update their own family" ON families;
DROP POLICY IF EXISTS "Users can insert their own family" ON families;
DROP POLICY IF EXISTS "Users can view their family members" ON members;
DROP POLICY IF EXISTS "Users can manage their family members" ON members;

-- 5. familiesテーブルのRLSポリシー作成
CREATE POLICY "Users can view their own family" ON families
    FOR SELECT USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can update their own family" ON families
    FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can insert their own family" ON families
    FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

-- 6. membersテーブルのRLSポリシー作成
CREATE POLICY "Users can view their family members" ON members
    FOR SELECT USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family members" ON members
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 7. money_balancesテーブルのRLSポリシー作成
CREATE POLICY "Users can manage their family money balances" ON money_balances
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 8. money_transactionsテーブルのRLSポリシー作成
CREATE POLICY "Users can manage their family money transactions" ON money_transactions
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 9. tasksテーブルのRLSポリシー作成
CREATE POLICY "Users can manage their family tasks" ON tasks
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 10. task_completionsテーブルのRLSポリシー作成
CREATE POLICY "Users can manage their family task completions" ON task_completions
    FOR ALL USING (
        task_id IN (
            SELECT id FROM tasks
            WHERE family_id IN (
                SELECT id FROM families WHERE admin_user_id = auth.uid()
            )
        )
    );

-- 11. 残りのテーブルのRLSポリシー作成
CREATE POLICY "Users can manage their family activity logs" ON activity_logs
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family bonus settings" ON bonus_settings
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family earning records" ON earning_records
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family goals" ON goals
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family investments" ON investments
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family money allocations" ON money_allocations
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family settings" ON settings
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 12. 確認クエリ
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 13. ポリシー確認
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;