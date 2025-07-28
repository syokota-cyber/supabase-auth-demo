// アカウント管理関連の機能

// アカウント削除確認モーダルを開く
function confirmDeleteAccount() {
    document.getElementById('delete-account-modal').classList.remove('hidden')
    document.getElementById('delete-confirmation-input').value = ''
    document.getElementById('delete-account-button').disabled = true
    
    // 入力監視
    document.getElementById('delete-confirmation-input').addEventListener('input', function(e) {
        const deleteButton = document.getElementById('delete-account-button')
        if (e.target.value === '削除') {
            deleteButton.disabled = false
        } else {
            deleteButton.disabled = true
        }
    })
}

// アカウント削除確認モーダルを閉じる
function closeDeleteAccountModal() {
    document.getElementById('delete-account-modal').classList.add('hidden')
}

// アカウント削除実行
async function deleteAccount() {
    const confirmText = document.getElementById('delete-confirmation-input').value
    
    if (confirmText !== '削除') {
        showNotification('エラー', 'error', '確認テキストが正しくありません')
        return
    }
    
    try {
        // 現在のユーザーを取得
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            showNotification('エラー', 'error', 'ユーザー情報が取得できません')
            return
        }
        
        // Supabaseのアカウント削除は管理者権限が必要なため、
        // ここでは関連データの削除とログアウトを行います
        
        // 1. TODOを削除
        const { error: todoError } = await supabase
            .from('todos')
            .delete()
            .eq('user_id', user.id)
        
        if (todoError) {
            console.error('TODO削除エラー:', todoError)
        }
        
        // 2. 習慣テンプレートを削除
        const { error: habitError } = await supabase
            .from('habit_templates')
            .delete()
            .eq('user_id', user.id)
        
        if (habitError) {
            console.error('習慣テンプレート削除エラー:', habitError)
        }
        
        // 3. ログアウト
        await supabase.auth.signOut()
        
        // モーダルを閉じる
        closeDeleteAccountModal()
        
        // 成功メッセージを表示
        showNotification('データ削除完了', 'success', 'アカウントデータが削除されました')
        
        // 画面をリロード
        setTimeout(() => {
            window.location.reload()
        }, 2000)
        
    } catch (error) {
        console.error('アカウント削除エラー:', error)
        showNotification('エラー', 'error', 'アカウント削除中にエラーが発生しました')
    }
}

// 注意: 完全なアカウント削除を実装する場合は、以下の方法があります：
// 1. Supabase Edge Functions を使用して管理者権限でユーザーを削除
// 2. データベーストリガーを使用して関連データを自動削除
// 3. バックエンドAPIを作成してユーザー削除を処理