# Supabase セットアップ手順

## 前提条件
- Supabaseプロジェクトにログイン済み
- SQL Editorへのアクセス権限あり

## 手順

### 1. Supabaseダッシュボードにログイン
1. https://app.supabase.com にアクセス
2. プロジェクトを選択

### 2. SQL Editorを開く
1. 左側のメニューから「SQL Editor」をクリック
2. 「New query」をクリック

### 3. todosテーブルの拡張
以下のSQLを実行:
```sql
-- todosテーブルに新しいカラムを追加
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(20),
ADD COLUMN IF NOT EXISTS recurrence_days JSONB,
ADD COLUMN IF NOT EXISTS last_completed_date DATE,
ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_habit_id INT;

-- task_typeの制約を追加
ALTER TABLE todos 
ADD CONSTRAINT task_type_check 
CHECK (task_type IN ('normal', 'habit', 'deadline'));

-- recurrence_patternの制約を追加
ALTER TABLE todos 
ADD CONSTRAINT recurrence_pattern_check 
CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'monthly'));
```

### 4. habit_templatesテーブルの作成
```sql
-- 習慣テンプレートテーブルを作成
CREATE TABLE IF NOT EXISTS habit_templates (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category VARCHAR(50),
  priority INT DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  recurrence_pattern VARCHAR(20) NOT NULL CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  recurrence_days JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS（Row Level Security）を有効化
ALTER TABLE habit_templates ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のデータのみアクセスできるポリシーを作成
CREATE POLICY "Users can view own habit templates" ON habit_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit templates" ON habit_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit templates" ON habit_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit templates" ON habit_templates
  FOR DELETE USING (auth.uid() = user_id);
```

### 5. インデックスの作成（パフォーマンス向上）
```sql
-- task_typeでの検索を高速化
CREATE INDEX IF NOT EXISTS idx_todos_task_type ON todos(task_type);

-- user_idとtask_typeの複合インデックス
CREATE INDEX IF NOT EXISTS idx_todos_user_task ON todos(user_id, task_type);

-- habit_templatesのuser_idインデックス
CREATE INDEX IF NOT EXISTS idx_habit_templates_user ON habit_templates(user_id);
```

### 6. 実行確認
1. 各SQLクエリを実行後、「Success」メッセージが表示されることを確認
2. 「Table Editor」から各テーブルの構造を確認
3. 新しいカラムが追加されていることを確認

## トラブルシューティング

### エラー: "column already exists"
- すでにカラムが存在する場合は無視して次へ進む

### エラー: "permission denied"
- プロジェクトの管理者権限があることを確認
- RLSポリシーが正しく設定されているか確認

### データ移行が必要な場合
```sql
-- 既存のTODOをすべて'normal'タイプに設定
UPDATE todos SET task_type = 'normal' WHERE task_type IS NULL;
```