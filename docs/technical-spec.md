# TODOアプリ拡張機能 技術仕様書

## 1. データベース設計

### 1.1 todosテーブル拡張
```sql
ALTER TABLE todos 
ADD COLUMN task_type VARCHAR(20) DEFAULT 'normal' CHECK (task_type IN ('normal', 'habit', 'deadline')),
ADD COLUMN recurrence_pattern VARCHAR(20) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_days JSONB, -- 曜日指定用 例: [1,3,5] (月水金)
ADD COLUMN last_completed_date DATE,
ADD COLUMN streak_count INT DEFAULT 0,
ADD COLUMN parent_habit_id INT; -- 習慣タスクの親ID
```

### 1.2 habit_templatesテーブル（新規）
```sql
CREATE TABLE habit_templates (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category VARCHAR(50),
  priority INT DEFAULT 2,
  recurrence_pattern VARCHAR(20) NOT NULL,
  recurrence_days JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

## 2. API設計

### 2.1 習慣タスク関連
- `GET /api/habits` - アクティブな習慣テンプレート一覧取得
- `POST /api/habits` - 新規習慣テンプレート作成
- `PUT /api/habits/:id` - 習慣テンプレート更新
- `DELETE /api/habits/:id` - 習慣テンプレート削除（論理削除）

### 2.2 タスク完了処理
- 習慣タスク完了時: `streak_count`を更新、`last_completed_date`を記録
- 通常タスク完了時: 従来通りの処理

## 3. フロントエンド実装

### 3.1 新規関数
```javascript
// 習慣タスクの自動生成
async function generateDailyHabits()

// タスクタイプによるフィルタリング
function filterByTaskType(type)

// 連続達成数の計算
function calculateStreak(habitId)
```

### 3.2 UI コンポーネント
- タブコンポーネント（全て/今日/習慣/納期）
- 習慣作成モーダル
- 連続達成数表示バッジ

## 4. セキュリティ考慮事項
- Row Level Security (RLS) の適用
- ユーザーは自分のタスクのみアクセス可能
- SQLインジェクション対策