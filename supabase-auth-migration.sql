-- Supabase Auth移行用SQLスクリプト

-- 1. familiesテーブルにSupabase AuthのユーザーIDカラムを追加
ALTER TABLE families
ADD COLUMN admin_user_id UUID REFERENCES auth.users(id);

-- 2. admin_passwordカラムを削除（Supabase Authを使用するため不要）
ALTER TABLE families
DROP COLUMN admin_password;

-- 3. Row Level Security (RLS) を再有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_goal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシーを作成 - familiesテーブル
CREATE POLICY "Users can view their own family" ON families
    FOR SELECT USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can update their own family" ON families
    FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can insert their own family" ON families
    FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

-- 5. RLSポリシーを作成 - membersテーブル
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

-- 6. RLSポリシーを作成 - money_balancesテーブル
CREATE POLICY "Users can view their family money balances" ON money_balances
    FOR SELECT USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family money balances" ON money_balances
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 7. RLSポリシーを作成 - tasksテーブル
CREATE POLICY "Users can view their family tasks" ON tasks
    FOR SELECT USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family tasks" ON tasks
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 8. RLSポリシーを作成 - task_completionsテーブル
CREATE POLICY "Users can view their family task completions" ON task_completions
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks
            WHERE family_id IN (
                SELECT id FROM families WHERE admin_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage their family task completions" ON task_completions
    FOR ALL USING (
        task_id IN (
            SELECT id FROM tasks
            WHERE family_id IN (
                SELECT id FROM families WHERE admin_user_id = auth.uid()
            )
        )
    );

-- 9. その他のテーブルにも同様のポリシーを適用
-- money_transactions
CREATE POLICY "Users can manage their family money transactions" ON money_transactions
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- allowances
CREATE POLICY "Users can manage their family allowances" ON allowances
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- money_goals
CREATE POLICY "Users can manage their family money goals" ON money_goals
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- money_goal_transactions
CREATE POLICY "Users can manage their family money goal transactions" ON money_goal_transactions
    FOR ALL USING (
        goal_id IN (
            SELECT id FROM money_goals
            WHERE family_id IN (
                SELECT id FROM families WHERE admin_user_id = auth.uid()
            )
        )
    );

-- points
CREATE POLICY "Users can manage their family points" ON points
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- point_transactions
CREATE POLICY "Users can manage their family point transactions" ON point_transactions
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- rewards
CREATE POLICY "Users can manage their family rewards" ON rewards
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- reward_claims
CREATE POLICY "Users can manage their family reward claims" ON reward_claims
    FOR ALL USING (
        reward_id IN (
            SELECT id FROM rewards
            WHERE family_id IN (
                SELECT id FROM families WHERE admin_user_id = auth.uid()
            )
        )
    );

-- 10. 確認クエリ
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 11. ポリシー確認
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;