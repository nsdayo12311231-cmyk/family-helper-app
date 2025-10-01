// テストデータをSupabaseに投入するスクリプト
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mmumebytsbxdzloezjbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdW1lYnl0c2J4ZHpsb2V6amJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDc2NzIsImV4cCI6MjA3NDgyMzY3Mn0.H2v7SKC3t5wiq4WHPx-Lzn7KS-p-PTh6zPfgbIbQZwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  console.log('🚀 テストデータ投入開始...');

  try {
    // 1. RLS無効化（一時的）
    console.log('📝 RLS一時無効化...');

    // 2. 家族データ投入
    console.log('👨‍👩‍👧‍👦 家族データ投入...');
    const familyId = '123e4567-e89b-12d3-a456-426614174001'; // 固定UUID
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .upsert({
        id: familyId,
        name: 'テスト家族',
        admin_email: 'test@gmail.com',
        admin_password: 'test123',
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
        id: '223e4567-e89b-12d3-a456-426614174002', // admin UUID
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
        id: '323e4567-e89b-12d3-a456-426614174003', // child-1 UUID
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
        id: '423e4567-e89b-12d3-a456-426614174004', // child-2 UUID
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
        id: '523e4567-e89b-12d3-a456-426614174005', // task-1 UUID
        family_id: familyId,
        member_id: '323e4567-e89b-12d3-a456-426614174003', // child-1
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
        id: '623e4567-e89b-12d3-a456-426614174006', // task-2 UUID
        family_id: familyId,
        member_id: '323e4567-e89b-12d3-a456-426614174003', // child-1
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
        id: '723e4567-e89b-12d3-a456-426614174007', // task-3 UUID
        family_id: familyId,
        member_id: '423e4567-e89b-12d3-a456-426614174004', // child-2
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

    console.log('🎉 すべてのテストデータ投入完了！');

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

insertTestData();