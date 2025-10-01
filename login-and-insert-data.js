// 既存ユーザーでログインしてテストデータを投入するスクリプト
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mmumebytsbxdzloezjbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdW1lYnl0c2J4ZHpsb2V6amJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDc2NzIsImV4cCI6MjA3NDgyMzY3Mn0.H2v7SKC3t5wiq4WHPx-Lzn7KS-p-PTh6zPfgbIbQZwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function loginAndInsertData() {
  console.log('🚀 ログインしてテストデータ投入開始...');

  try {
    // 1. 既存のユーザーでログイン
    console.log('🔐 ユーザーログイン...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@gmail.com',
      password: 'test123456'
    });

    if (loginError) {
      console.error('❌ ログインエラー:', loginError);
      // パスワードが違う場合は別のパスワードを試す
      console.log('🔐 別のパスワードでログイン試行...');
      const { data: loginData2, error: loginError2 } = await supabase.auth.signInWithPassword({
        email: 'test@gmail.com',
        password: 'test123'
      });

      if (loginError2) {
        console.error('❌ ログインエラー2:', loginError2);
        return;
      }
      console.log('✅ ログイン完了（パスワード2）');
    } else {
      console.log('✅ ログイン完了');
    }

    const userId = loginData?.user?.id || supabase.auth.getUser().then(r => r.data.user?.id);
    console.log('👤 ログインユーザーID:', userId);

    // 2. 家族データ投入（認証済みユーザーとして）
    console.log('👨‍👩‍👧‍👦 家族データ投入...');
    const familyId = '123e4567-e89b-12d3-a456-426614174001';
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .upsert({
        id: familyId,
        name: 'テスト家族',
        admin_email: 'test@gmail.com',
        admin_user_id: userId, // 認証ユーザーIDを設定
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (familyError) {
      console.error('❌ 家族データエラー:', familyError);
      return;
    }
    console.log('✅ 家族データ投入完了');

    // 3. メンバーデータ投入
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

    // 4. タスクデータ投入
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

    // 5. 残高データ投入
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

    console.log('🎉 すべてのテストデータ投入完了！');
    console.log('📊 ログイン情報:');
    console.log('  Email: test@gmail.com');
    console.log('  Family ID:', familyId);

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

loginAndInsertData();