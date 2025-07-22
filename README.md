# Supabase Auth Demo

## 🎯 プロジェクト概要
SupabaseとVercelを使った認証機能のデモアプリケーション

**公開URL**: https://supabase-auth-demo-three.vercel.app/

## 📅 学習記録（2025年7月22日）

### 学習した内容
1. **Supabaseの基本**
   - BaaS（Backend as a Service）の概念
   - 認証機能の実装
   - APIキーの使い方

2. **Vercelの基本**
   - ホスティングサービスの仕組み
   - GitHubとの連携
   - 自動デプロイ

3. **実装した機能**
   - ユーザー登録（サインアップ）
   - ログイン/ログアウト
   - メール確認フロー
   - セッション管理

### 遭遇した問題と解決方法

#### 1. メール確認リンクの問題
- **問題**: メール確認リンクが`localhost:3000`を指していてアクセスできない
- **原因**: `file://`でHTMLを直接開いていたため
- **解決**: 
  - 開発時は`npm run dev`でローカルサーバーを使用
  - 本番環境（Vercel）では自動的に正しいURLになる

#### 2. APIキーエラー
- **問題**: "No API key found in request"エラー
- **原因**: 外部JavaScriptファイルが正しく読み込まれていない
- **解決**: JavaScriptをHTML内に直接記述

#### 3. Email not confirmedエラー
- **問題**: メール確認済みなのにログインできない
- **原因**: Supabaseのメール確認の仕組みとローカル開発環境の相性
- **解決**: 時間経過で自動解決／ダッシュボードで手動確認

### 技術スタック
- **フロントエンド**: HTML + JavaScript（Vanilla）
- **認証**: Supabase Auth
- **ホスティング**: Vercel
- **バージョン管理**: Git/GitHub

### ファイル構成
```
supabase-auth-demo/
├── index.html          # メインの認証画面
├── auth.js            # 認証ロジック（未使用）
├── package.json       # プロジェクト設定
├── .gitignore         # Git除外設定
└── README.md          # このファイル
```

### 開発コマンド
```bash
# ローカルサーバー起動
npm run dev

# Gitにプッシュ（Vercelが自動デプロイ）
git add .
git commit -m "変更内容"
git push
```

### 今後の学習予定
- [ ] データベース機能の追加（TODOリストなど）
- [ ] デザインの改善（CSS/Tailwind）
- [ ] ソーシャルログイン（Google/GitHub）
- [ ] Next.jsへの移行

### 重要な学習ポイント
1. **開発環境の重要性**: `file://`ではなく適切なローカルサーバーを使用
2. **デバッグスキル**: コンソールログとエラーメッセージの読み方
3. **本番環境との違い**: ローカルと本番環境での動作の違いを理解
4. **段階的な実装**: 小さく始めて徐々に機能を追加

---

## 次回の作業メモ
- Supabaseのデータベース機能を学習
- UIデザインの改善を検討
- より実用的なアプリケーションへ発展させる