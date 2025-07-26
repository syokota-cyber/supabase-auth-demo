# 本番環境移行ガイド

## 1. Supabaseプロジェクトの設定

### 1.1 新しいプロダクション用プロジェクト作成
```bash
# Supabaseダッシュボードで新規プロジェクト作成
# プロジェクト名: todo-app-production
# リージョン: Tokyo (ap-northeast-1) を推奨
```

### 1.2 データベーススキーマの移行
```sql
-- todos テーブル作成
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority INTEGER DEFAULT 2,
  due_date DATE,
  complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 有効化
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can only see their own todos" 
ON todos FOR ALL 
USING (auth.uid() = user_id);

-- 通知テーブル作成
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own notifications" 
ON notifications FOR ALL 
USING (auth.uid() = user_id);
```

### 1.3 Storageバケット作成
```sql
-- avatars バケット作成
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- アクセスポリシー設定
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 2. アプリケーションの環境設定

### 2.1 環境変数ファイル作成
```javascript
// config/production.js
const PRODUCTION_CONFIG = {
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabaseKey: 'your-anon-key-here',
  environment: 'production',
  debug: false
}
```

### 2.2 本番用ビルド設定
```html
<!-- index.html の本番設定 -->
<script>
  // 本番環境判定
  const isProduction = window.location.hostname !== 'localhost';
  
  const config = isProduction ? {
    supabaseUrl: 'YOUR_PRODUCTION_SUPABASE_URL',
    supabaseKey: 'YOUR_PRODUCTION_SUPABASE_ANON_KEY'
  } : {
    supabaseUrl: 'https://quxokigryvzksexhbpbm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  };
  
  const supabase = window.supabase.createClient(
    config.supabaseUrl, 
    config.supabaseKey
  );
</script>
```

## 3. セキュリティ強化

### 3.1 Authentication設定
```bash
# Supabaseダッシュボード > Authentication > Settings
- Email confirmation: 有効
- Email change confirmation: 有効
- Secure password change: 有効
- Session timeout: 1週間
```

### 3.2 API制限設定
```bash
# Supabaseダッシュボード > Settings > API
- Rate limiting: 有効
- CORS origins: 本番ドメインのみ許可
```

## 4. ホスティング設定

### 4.1 Vercel デプロイ（推奨）
```bash
# Vercel CLI インストール
npm i -g vercel

# プロジェクトルートで実行
vercel

# 環境変数設定
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

### 4.2 Netlify デプロイ
```bash
# Netlify CLI インストール
npm install -g netlify-cli

# デプロイ
netlify deploy --prod --dir=.
```

### 4.3 GitHub Pages（静的サイト）
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

## 5. パフォーマンス最適化

### 5.1 画像最適化
```javascript
// 画像リサイズ関数追加
function resizeImage(file, maxWidth = 300, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}
```

### 5.2 キャッシュ戦略
```javascript
// Service Worker追加
// sw.js
const CACHE_NAME = 'todo-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

## 6. モニタリング設定

### 6.1 エラー追跡
```javascript
// Sentry.io 統合
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});

// エラーハンドリング改善
window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason);
  console.error('Unhandled promise rejection:', event.reason);
});
```

### 6.2 アナリティクス
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 7. チェックリスト

### デプロイ前確認
- [ ] 本番用Supabaseプロジェクト作成
- [ ] データベーススキーマ移行
- [ ] RLSポリシー設定
- [ ] 環境変数設定
- [ ] CORS設定
- [ ] SSL証明書確認

### デプロイ後確認
- [ ] 全機能の動作テスト
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] モバイル対応確認
- [ ] 各ブラウザでの動作確認

## 8. 維持管理

### 8.1 定期的な確認項目
- データベース使用量監視
- API使用量確認
- セキュリティアップデート
- パフォーマンス監視

### 8.2 バックアップ戦略
```bash
# Supabaseダッシュボードで定期バックアップ設定
# または CLI でのダンプ
supabase db dump --local > backup.sql
```

## 費用見積もり（Supabase Pro移行時）

### 無料プランの制限に達した場合
- Supabase Pro: $25/月
- Vercel Pro: $20/月（必要に応じて）
- 独自ドメイン: $12/年

**合計: 月額$25-45程度**