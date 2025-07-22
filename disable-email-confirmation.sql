-- Supabaseのメール確認を無効化するSQL
-- 注意: 開発環境でのみ使用してください

-- 既存ユーザーのメール確認を強制的に完了させる
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'shin1yokota@gmail.com' 
AND email_confirmed_at IS NULL;