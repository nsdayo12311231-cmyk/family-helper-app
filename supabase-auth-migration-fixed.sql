-- Supabase Auth移行用SQLスクリプト（修正版）

-- 1. 現在のテーブル一覧を確認
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 2. familiesテーブルにSupabase AuthのユーザーIDカラムを追加
ALTER TABLE families
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);

-- 3. admin_passwordカラムを削除（存在する場合）
ALTER TABLE families
DROP COLUMN IF EXISTS admin_password;

-- 4. 基本テーブルのRow Level Security (RLS) を再有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_balances ENABLE ROW LEVEL SECURITY;

-- 5. 存在するテーブルのみRLS有効化（存在しないテーブルはスキップ）
DO $$
BEGIN
    -- tasks
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    END IF;

    -- task_completions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_completions') THEN
        ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- money_transactions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'money_transactions') THEN
        ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- allowances
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'allowances') THEN
        ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;
    END IF;

    -- money_goals
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'money_goals') THEN
        ALTER TABLE money_goals ENABLE ROW LEVEL SECURITY;
    END IF;

    -- money_goal_transactions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'money_goal_transactions') THEN
        ALTER TABLE money_goal_transactions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- points
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'points') THEN
        ALTER TABLE points ENABLE ROW LEVEL SECURITY;
    END IF;

    -- point_transactions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'point_transactions') THEN
        ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- rewards
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rewards') THEN
        ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
    END IF;

    -- reward_claims
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reward_claims') THEN
        ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;