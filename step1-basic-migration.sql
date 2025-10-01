-- Step 1: 基本的なSupabase Auth移行

-- 1. 現在のテーブル一覧を確認
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 2. familiesテーブルにSupabase AuthのユーザーIDカラムを追加
ALTER TABLE families
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);

-- 3. admin_passwordカラムを削除（Supabase Authを使用するため不要）
-- 注意: 既存データがある場合は慎重に実行
-- ALTER TABLE families DROP COLUMN IF EXISTS admin_password;

-- 4. 基本テーブルのみRLS有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_balances ENABLE ROW LEVEL SECURITY;

-- 5. 基本的なRLSポリシー作成
-- familiesテーブル
DROP POLICY IF EXISTS "Users can view their own family" ON families;
CREATE POLICY "Users can view their own family" ON families
    FOR SELECT USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Users can update their own family" ON families;
CREATE POLICY "Users can update their own family" ON families
    FOR UPDATE USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Users can insert their own family" ON families;
CREATE POLICY "Users can insert their own family" ON families
    FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

-- membersテーブル
DROP POLICY IF EXISTS "Users can view their family members" ON members;
CREATE POLICY "Users can view their family members" ON members
    FOR SELECT USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their family members" ON members;
CREATE POLICY "Users can manage their family members" ON members
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- money_balancesテーブル
DROP POLICY IF EXISTS "Users can view their family money balances" ON money_balances;
CREATE POLICY "Users can view their family money balances" ON money_balances
    FOR SELECT USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their family money balances" ON money_balances;
CREATE POLICY "Users can manage their family money balances" ON money_balances
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE admin_user_id = auth.uid()
        )
    );

-- 6. 確認
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('families', 'members', 'money_balances')
ORDER BY tablename;