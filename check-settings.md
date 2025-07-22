# Supabase設定確認手順

## 1. Redirect URLsの確認
- Supabaseダッシュボード → Authentication → URL Configuration
- Site URL と Redirect URLs を確認

## 2. よくある設定ミス
- Site URL: http://localhost:3000 (開発サーバーが必要)
- Site URL: file:///... (動作しない)

## 3. 解決方法
- 開発サーバーを起動する
- または Site URL を変更する