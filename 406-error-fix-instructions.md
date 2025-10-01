# Supabase 406エラー対応手順

## 概要
Supabaseデータベースで406エラーが発生している場合の対応手順です。

## 1. localStorageの完全クリア

アプリ内で以下の手順を実行してください：

### 方法A: アプリ内での実行（推奨）
1. 管理者でログイン
2. 管理画面 → 設定タブ
3. 「🚨 トラブルシューティング」セクション
4. 「🔧 406エラー対応：セッションクリア」ボタンをクリック
5. 確認ダイアログで「OK」を選択
6. ページが自動的に再読み込みされます

### 方法B: ブラウザの開発者ツールでの実行
1. ブラウザの開発者ツール（F12）を開く
2. Consoleタブを選択
3. 以下のコードを実行：

```javascript
// セッションデータのクリア
const keysToRemove = [
  'sb-access-token',
  'sb-refresh-token',
  'supabase.auth.token',
  'sb-auth-token',
  'supabase-auth-token'
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
});

// アプリ固有のデータもクリア
localStorage.clear();
sessionStorage.clear();

console.log('全てのセッションデータがクリアされました');
```

4. ページを再読み込み（F5）

## 2. Supabase RLSの無効化

`disable-rls.sql` ファイルを使用してSupabaseでSQLを実行してください。

### Supabase Dashboard での実行手順：

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 「New query」をクリック
5. `disable-rls.sql` ファイルの内容をコピー＆ペースト
6. 「Run」ボタンをクリックして実行

### SQL実行内容の概要：

```sql
-- 全テーブルでRLSを無効化
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- ... (他のテーブルも同様)

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON families;
-- ... (他のポリシーも同様)

-- 確認クエリ
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN (...);
```

## 3. 動作確認

1. ブラウザのキャッシュをクリア
2. アプリにアクセス
3. 新規ログインまたは新規登録を試行
4. 406エラーが解消されていることを確認

## 4. セキュリティ注意事項

⚠️ **重要**: RLSを無効化すると、全ユーザーが全てのデータにアクセス可能になります。

### 本番環境での対応：
- 406エラーが解決した後は、適切なRLSポリシーを再設定してください
- 必要に応じて、より細かいアクセス制御を実装してください

### 開発環境での対応：
- 開発段階であれば、RLS無効化のままでも問題ありません
- 本番リリース前に適切なセキュリティ設定を行ってください

## 5. トラブルシューティング

### エラーが継続する場合：
1. ブラウザの完全なキャッシュクリア
2. 異なるブラウザでのテスト
3. プライベートブラウジングモードでのテスト
4. Supabaseプロジェクトの再起動（必要に応じて）

### 緊急時の完全リセット：
アプリ内で「💥 緊急時：完全データクリア」ボタンを使用すると、全てのlocalStorageデータが削除されます。

## 実行結果の確認

正常に実行された場合：
- [ ] localStorageが完全にクリアされた
- [ ] Supabase RLSが全テーブルで無効化された
- [ ] 406エラーが解消された
- [ ] アプリが正常に動作している

実行日時: _______________
実行者: _______________
結果: _______________