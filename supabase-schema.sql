-- Family Helper App - Supabase Database Schema
-- ファミリーヘルパーアプリ用のデータベーススキーマ

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 家族管理テーブル
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL UNIQUE,
  admin_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. メンバー管理テーブル
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NOT NULL,
  role VARCHAR(10) CHECK (role IN ('admin', 'child')) NOT NULL,
  theme VARCHAR(10) CHECK (theme IN ('boy', 'girl')) NOT NULL,
  text_style VARCHAR(10) CHECK (text_style IN ('kanji', 'hiragana')) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. タスク管理テーブル
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reward INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  daily_limit INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. タスク完了記録テーブル
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL,
  reward INTEGER NOT NULL DEFAULT 0
);

-- 5. お小遣い獲得記録テーブル
CREATE TABLE earning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  earned_date DATE NOT NULL,
  earned_month VARCHAR(7) NOT NULL, -- YYYY-MM format
  source VARCHAR(20) CHECK (source IN ('task_completion', 'bonus', 'manual')) NOT NULL,
  source_id UUID,
  status VARCHAR(20) CHECK (status IN ('pending', 'allocated', 'expired')) DEFAULT 'pending',
  allocated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 目標管理テーブル
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount INTEGER NOT NULL,
  icon VARCHAR(255) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'achieved', 'paused')) DEFAULT 'active',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. お金振り分け設定テーブル
CREATE TABLE money_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  goal_saving_rate INTEGER CHECK (goal_saving_rate >= 0 AND goal_saving_rate <= 100) DEFAULT 0,
  free_money_rate INTEGER CHECK (free_money_rate >= 0 AND free_money_rate <= 100) DEFAULT 0,
  long_saving_rate INTEGER CHECK (long_saving_rate >= 0 AND long_saving_rate <= 100) DEFAULT 0,
  investment_rate INTEGER CHECK (investment_rate >= 0 AND investment_rate <= 100) DEFAULT 0,
  donation_rate INTEGER CHECK (donation_rate >= 0 AND donation_rate <= 100) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_allocation_total CHECK (
    goal_saving_rate + free_money_rate + long_saving_rate + investment_rate + donation_rate = 100
  )
);

-- 8. お金残高管理テーブル
CREATE TABLE money_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  available INTEGER DEFAULT 0,
  allocated INTEGER DEFAULT 0,
  spent INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, member_id)
);

-- 9. 投資記録テーブル
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  principal_amount INTEGER NOT NULL,
  current_value INTEGER NOT NULL,
  profit_loss INTEGER NOT NULL,
  investment_date DATE NOT NULL,
  investment_type VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. お金取引記録テーブル
CREATE TABLE money_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  transaction_type VARCHAR(30) CHECK (transaction_type IN ('task_reward', 'manual_transfer', 'investment', 'spending')) NOT NULL,
  from_category VARCHAR(50),
  to_category VARCHAR(50),
  amount INTEGER NOT NULL,
  description VARCHAR(500) NOT NULL,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ボーナス設定テーブル
CREATE TABLE bonus_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE, -- null = 全員対象
  bonus_type VARCHAR(30) CHECK (bonus_type IN ('consecutive_days', 'monthly_target', 'special_achievement')) NOT NULL,
  condition_value INTEGER NOT NULL,
  reward_amount INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 設定テーブル
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE, -- null = 家族全体設定
  category VARCHAR(100) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, member_id, category, setting_key)
);

-- 13. アクティビティログテーブル
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_data TEXT NOT NULL, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
-- 家族関連のインデックス
CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_members_family_active ON members(family_id, is_active);

-- タスク関連のインデックス
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_member_id ON tasks(member_id);
CREATE INDEX idx_tasks_family_member_active ON tasks(family_id, member_id, is_active);

-- タスク完了関連のインデックス
CREATE INDEX idx_task_completions_family_id ON task_completions(family_id);
CREATE INDEX idx_task_completions_member_id ON task_completions(member_id);
CREATE INDEX idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX idx_task_completions_family_member_date ON task_completions(family_id, member_id, completed_at);

-- 収益記録関連のインデックス
CREATE INDEX idx_earning_records_family_id ON earning_records(family_id);
CREATE INDEX idx_earning_records_member_id ON earning_records(member_id);
CREATE INDEX idx_earning_records_earned_date ON earning_records(earned_date);
CREATE INDEX idx_earning_records_earned_month ON earning_records(earned_month);
CREATE INDEX idx_earning_records_status ON earning_records(status);

-- その他のインデックス
CREATE INDEX idx_goals_family_member ON goals(family_id, member_id);
CREATE INDEX idx_money_allocations_family_member ON money_allocations(family_id, member_id);
CREATE INDEX idx_investments_family_member ON investments(family_id, member_id);
CREATE INDEX idx_money_transactions_family_member ON money_transactions(family_id, member_id);
CREATE INDEX idx_activity_logs_family_member ON activity_logs(family_id, member_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Row Level Security (RLS) の有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー（基本的な家族単位のアクセス制御）
-- 注意: 認証システムの実装に応じて調整が必要

-- 家族テーブルのポリシー
CREATE POLICY "Users can view their own family" ON families
  FOR SELECT USING (auth.uid()::text = admin_email);

CREATE POLICY "Users can update their own family" ON families
  FOR UPDATE USING (auth.uid()::text = admin_email);

-- メンバーテーブルのポリシー
CREATE POLICY "Family members can view family members" ON members
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM families WHERE auth.uid()::text = admin_email
    )
  );

-- タスクテーブルのポリシー
CREATE POLICY "Family members can view family tasks" ON tasks
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM families WHERE auth.uid()::text = admin_email
    )
  );

-- 他のテーブルにも同様のポリシーを適用
-- （詳細な権限制御は認証システムの実装に応じて調整）

-- 更新日時自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時自動更新トリガー
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_money_allocations_updated_at BEFORE UPDATE ON money_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonus_settings_updated_at BEFORE UPDATE ON bonus_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- お金残高更新の自動更新トリガー
CREATE OR REPLACE FUNCTION update_money_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_money_balances_timestamp BEFORE UPDATE ON money_balances
  FOR EACH ROW EXECUTE FUNCTION update_money_balance_timestamp();

-- 制約とチェック関数
-- 合計振り分け率が100%になることを確認
CREATE OR REPLACE FUNCTION check_allocation_total()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.goal_saving_rate + NEW.free_money_rate + NEW.long_saving_rate + NEW.investment_rate + NEW.donation_rate) != 100 THEN
    RAISE EXCEPTION 'Total allocation rates must equal 100%%';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_allocation_total BEFORE INSERT OR UPDATE ON money_allocations
  FOR EACH ROW EXECUTE FUNCTION check_allocation_total();