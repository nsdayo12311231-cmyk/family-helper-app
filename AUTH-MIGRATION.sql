-- ==========================================
-- Supabase Auth統合マイグレーション
-- ==========================================
-- 目的: admin_emailベースからauth_user_idベースの認証に変更
-- 実行場所: Supabase Dashboard > SQL Editor
-- ==========================================

-- ==========================================
-- STEP 1: auth_user_id カラムを追加
-- ==========================================
ALTER TABLE families
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- auth_user_id にインデックスを作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_families_auth_user_id ON families(auth_user_id);

-- ==========================================
-- STEP 2: admin_password を削除
-- ==========================================
-- Supabase Authで管理するため不要
ALTER TABLE families
DROP COLUMN IF EXISTS admin_password;

-- ==========================================
-- STEP 3: 既存データのクリーンアップ
-- ==========================================
-- テスト用の古いデータを削除
DELETE FROM task_completions WHERE family_id IN (SELECT id FROM families WHERE auth_user_id IS NULL);
DELETE FROM tasks WHERE family_id IN (SELECT id FROM families WHERE auth_user_id IS NULL);
DELETE FROM money_balances WHERE family_id IN (SELECT id FROM families WHERE auth_user_id IS NULL);
DELETE FROM goals WHERE family_id IN (SELECT id FROM families WHERE auth_user_id IS NULL);
DELETE FROM members WHERE family_id IN (SELECT id FROM families WHERE auth_user_id IS NULL);
DELETE FROM families WHERE auth_user_id IS NULL;

-- ==========================================
-- STEP 4: 確認クエリ
-- ==========================================

-- テーブル構造確認
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'families'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 既存データ確認
SELECT
    '📊 families' as table_name,
    count(*) as total_count,
    count(auth_user_id) as with_auth_user_id,
    count(*) - count(auth_user_id) as without_auth_user_id
FROM families;

-- auth.usersテーブルのユーザー確認
SELECT
    id as user_id,
    email,
    created_at,
    confirmed_at IS NOT NULL as is_confirmed
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 最終メッセージ
SELECT
  '✅ マイグレーション完了！' as status,
  'これで auth_user_id で認証できるようになりました' as message,
  '次: コードを修正して signup/login を実装' as next_step;
