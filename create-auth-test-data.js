// Supabase Authでユーザーを作成してからテストデータを投入するスクリプト
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mmumebytsbxdzloezjbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdW1lYnl0c2J4ZHpsb2V6amJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDc2NzIsImV4cCI6MjA3NDgyMzY3Mn0.H2v7SKC3t5wiq4WHPx-Lzn7KS-p-PTh6zPfgbIbQZwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAuthTestData() {
  console.log('🚀 認証テストデータ作成開始...');

  try {
    // 1. Supabase Authでテストユーザーを作成
    console.log('👤 認証ユーザー作成...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@gmail.com',
      password: 'test123456', // 6文字以上のパスワード
      options: {
        data: {
          family_name: 'テスト家族',
          admin_name: 'おとうさん'
        }
      }
    });

    if (authError) {
      console.error('❌ 認証ユーザー作成エラー:', authError);
      return;
    }

    console.log('✅ 認証ユーザー作成完了:', authData.user?.id);
    const userId = authData.user?.id;

    if (!userId) {
      console.error('❌ ユーザーIDが取得できませんでした');
      return;
    }

    // 2. 認証されたユーザーでログイン
    console.log('🔐 ユーザーログイン...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@gmail.com',
      password: 'test123456'
    });

    if (loginError) {
      console.error('❌ ログインエラー:', loginError);
      return;
    }

    console.log('✅ ログイン完了');

    // 3. 家族データ投入（認証済みユーザーとして）
    console.log('👨‍👩‍👧‍👦 家族データ投入...');
    const familyId = '123e4567-e89b-12d3-a456-426614174001';
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .upsert({
        id: familyId,
        name: 'テスト家族',
        admin_email: 'test@gmail.com',
        admin_user_id: userId, // 重要: 認証ユーザーIDを設定
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (familyError) {
      console.error('❌ 家族データエラー:', familyError);
      return;
    }
    console.log('✅ 家族データ投入完了');

    // 4. メンバーデータ投入
    console.log('👥 メンバーデータ投入...');
    const members = [
      {
        id: '223e4567-e89b-12d3-a456-426614174002',
        family_id: familyId,
        name: 'おとうさん',
        avatar: '👨',
        role: 'admin',
        theme: 'boy',
        text_style: 'kanji',
        display_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174003',
        family_id: familyId,
        name: 'たろう',
        avatar: '👦',
        role: 'child',
        theme: 'boy',
        text_style: 'hiragana',
        display_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '423e4567-e89b-12d3-a456-426614174004',
        family_id: familyId,
        name: 'はなこ',
        avatar: '👧',
        role: 'child',
        theme: 'girl',
        text_style: 'hiragana',
        display_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .upsert(members);

    if (membersError) {
      console.error('❌ メンバーデータエラー:', membersError);
      return;
    }
    console.log('✅ メンバーデータ投入完了');

    // 5. タスクデータ投入
    console.log('📋 タスクデータ投入...');
    const tasks = [
      {
        id: '523e4567-e89b-12d3-a456-426614174005',
        family_id: familyId,
        member_id: '323e4567-e89b-12d3-a456-426614174003',
        name: 'おさらあらい',
        description: 'しょっきを きれいに あらう',
        icon: '🍽️',
        reward: 50,
        daily_limit: 3,
        sort_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '623e4567-e89b-12d3-a456-426614174006',
        family_id: familyId,
        member_id: '323e4567-e89b-12d3-a456-426614174003',
        name: 'そうじき',
        description: 'りびんぐの そうじき',
        icon: '🧹',
        reward: 100,
        daily_limit: 1,
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '723e4567-e89b-12d3-a456-426614174007',
        family_id: familyId,
        member_id: '423e4567-e89b-12d3-a456-426614174004',
        name: 'ごみすて',
        description: 'ごみを ごみばこに すてる',
        icon: '🗑️',
        reward: 30,
        daily_limit: 2,
        sort_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .upsert(tasks);

    if (tasksError) {
      console.error('❌ タスクデータエラー:', tasksError);
      return;
    }
    console.log('✅ タスクデータ投入完了');

    // 6. 残高データ投入
    console.log('💰 残高データ投入...');
    const balances = [
      {
        family_id: familyId,
        member_id: '223e4567-e89b-12d3-a456-426614174002',
        available: 0,
        allocated: 0,
        spent: 0,
        total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        family_id: familyId,
        member_id: '323e4567-e89b-12d3-a456-426614174003',
        available: 150,
        allocated: 50,
        spent: 25,
        total: 125,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        family_id: familyId,
        member_id: '423e4567-e89b-12d3-a456-426614174004',
        available: 80,
        allocated: 30,
        spent: 10,
        total: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: balancesData, error: balancesError } = await supabase
      .from('money_balances')
      .upsert(balances);

    if (balancesError) {
      console.error('❌ 残高データエラー:', balancesError);
      return;
    }
    console.log('✅ 残高データ投入完了');

    console.log('🎉 すべての認証テストデータ作成完了！');
    console.log('📊 ログイン情報:');
    console.log('  Email: test@gmail.com');
    console.log('  Password: test123456');
    console.log('  User ID:', userId);
    console.log('  Family ID:', familyId);

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

createAuthTestData();