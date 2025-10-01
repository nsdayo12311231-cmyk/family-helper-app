import type { Family, Member, Task } from '../types';

export const createTestData = () => {
  const testFamily: Family = {
    id: 'test-family-1',
    name: 'テスト家族',
    adminEmail: 'admin@test.com',
    adminPassword: 'test123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testMembers: Member[] = [
    {
      id: 'admin-1',
      familyId: 'test-family-1',
      name: 'おとうさん',
      avatar: '👨',
      role: 'admin',
      theme: 'boy',
      textStyle: 'kanji',
      displayOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'child-1',
      familyId: 'test-family-1',
      name: 'たろう',
      avatar: '👦',
      role: 'child',
      theme: 'boy',
      textStyle: 'hiragana',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'child-2',
      familyId: 'test-family-1',
      name: 'はなこ',
      avatar: '👧',
      role: 'child',
      theme: 'girl',
      textStyle: 'hiragana',
      displayOrder: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const testTasks: Task[] = [
    {
      id: 'task-1',
      familyId: 'test-family-1',
      memberId: 'child-1',
      name: 'おさらあらい',
      description: 'しょっきを きれいに あらう',
      icon: '🍽️',
      reward: 50,
      dailyLimit: 3,
      sortOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      familyId: 'test-family-1',
      memberId: 'child-1',
      name: 'そうじき',
      description: 'りびんぐの そうじき',
      icon: '🧹',
      reward: 100,
      dailyLimit: 1,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      familyId: 'test-family-1',
      memberId: 'child-2',
      name: 'ごみすて',
      description: 'ごみを ごみばこに すてる',
      icon: '🗑️',
      reward: 30,
      dailyLimit: 2,
      sortOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      familyId: 'test-family-1',
      memberId: 'child-2',
      name: 'ふとんあげ',
      description: 'じぶんの ふとんを たたむ',
      icon: '🛏️',
      reward: 20,
      dailyLimit: 1,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      familyId: 'test-family-1',
      memberId: 'child-1',
      name: 'おふろそうじ',
      description: 'おふろを きれいに する',
      icon: '🛁',
      reward: 80,
      dailyLimit: 1,
      sortOrder: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Save test data to localStorage in old format (key-value pairs)
  localStorage.setItem('family', JSON.stringify(testFamily));
  localStorage.setItem(`members-${testFamily.id}`, JSON.stringify(testMembers));
  localStorage.setItem(`tasks-${testFamily.id}`, JSON.stringify(testTasks));
  localStorage.setItem('auth', JSON.stringify({ familyId: testFamily.id, memberId: testMembers[1].id }));

  console.log('テストデータを作成しました:');
  console.log('- 家族:', testFamily.name);
  console.log('- メンバー数:', testMembers.length);
  console.log('- タスク数:', testTasks.length);

  return { family: testFamily, members: testMembers, tasks: testTasks };
};

export const clearTestData = () => {
  localStorage.clear();
  console.log('すべてのテストデータを削除しました');
};