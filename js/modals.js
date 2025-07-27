// モーダル関連の機能

// ログインモーダル関連
function openLoginModal() {
    const modal = document.getElementById('login-modal')
    modal.classList.remove('hidden')
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal')
    modal.classList.add('hidden')
    // 入力内容をクリア
    document.getElementById('modal-email').value = ''
    document.getElementById('modal-password').value = ''
    document.getElementById('modal-message').textContent = ''
}

// TODO編集モーダル関連
function closeEditTodoModal() {
    document.getElementById('edit-todo-modal').classList.add('hidden')
    editingTodoId = null
    // メッセージをクリア
    document.getElementById('edit-todo-message').textContent = ''
}

// パスワードリセット関連
function openResetModal() {
    const modal = document.getElementById('reset-modal')
    modal.classList.remove('hidden')
    document.getElementById('reset-email').value = ''
    hideResetMessage()
}

function closeResetModal() {
    const modal = document.getElementById('reset-modal')
    modal.classList.add('hidden')
    hideResetMessage()
}

async function sendResetEmail() {
    const email = document.getElementById('reset-email').value
    
    // 入力チェック
    if (!email) {
        showResetMessage('メールアドレスを入力してください', true)
        return
    }
    
    // メールアドレスの形式チェック
    if (!isValidEmail(email)) {
        showResetMessage('正しいメールアドレスの形式で入力してください', true)
        return
    }
    
    // ローディング開始
    const sendButton = document.getElementById('send-reset-button')
    sendButton.disabled = true
    sendButton.textContent = '送信中...'
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/index.html'
        })
        
        if (error) {
            console.error('リセットメール送信エラー:', error)
            showResetMessage('エラー: ' + error.message, true)
        } else {
            showResetMessage('パスワードリセットメールを送信しました。メールをご確認ください。', false)
            // 5秒後にモーダルを閉じる
            setTimeout(() => {
                closeResetModal()
            }, 5000)
        }
    } finally {
        // ローディング終了
        sendButton.disabled = false
        sendButton.textContent = '送信'
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('new-password').value
    const confirmPassword = document.getElementById('confirm-password').value
    
    // 入力チェック
    if (!newPassword || !confirmPassword) {
        showResetMessage('パスワードを入力してください', true)
        return
    }
    
    // パスワードの長さチェック
    if (newPassword.length < 6) {
        showResetMessage('パスワードは6文字以上で入力してください', true)
        return
    }
    
    // パスワード確認チェック
    if (newPassword !== confirmPassword) {
        showResetMessage('パスワードが一致しません', true)
        return
    }
    
    // ローディング開始
    const updateButton = document.getElementById('update-password-button')
    updateButton.disabled = true
    updateButton.textContent = '更新中...'
    
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        
        if (error) {
            console.error('パスワード更新エラー:', error)
            showResetMessage('エラー: ' + error.message, true)
        } else {
            showResetMessage('パスワードが正常に更新されました！', false)
            // 3秒後にモーダルを閉じてメインページを表示
            setTimeout(() => {
                closeResetModal()
                location.reload() // ページをリロードしてログイン状態を反映
            }, 3000)
        }
    } finally {
        // ローディング終了
        updateButton.disabled = false
        updateButton.textContent = 'パスワード更新'
    }
}

// プロフィール編集モーダル関連
function openProfileModal() {
    const modal = document.getElementById('profile-modal')
    modal.classList.remove('hidden')
    loadCurrentProfile()
    hideProfileMessage()
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal')
    modal.classList.add('hidden')
    hideProfileMessage()
}

async function loadCurrentProfile() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.user_metadata) {
            const metadata = user.user_metadata
            
            // フォームに現在の値を設定
            document.getElementById('profile-display-name').value = metadata.display_name || ''
            document.getElementById('profile-bio').value = metadata.bio || ''
            document.getElementById('profile-website').value = metadata.website || ''
            
            // アバタープレビューを更新
            const previewImg = document.getElementById('profile-avatar-preview-img')
            const previewText = document.getElementById('profile-avatar-preview-text')
            
            if (metadata.avatar_type === 'image' && metadata.avatar) {
                previewImg.src = metadata.avatar
                previewImg.classList.remove('hidden')
                previewText.classList.add('hidden')
                window.selectedAvatarData = metadata.avatar
            } else {
                previewText.textContent = metadata.avatar || '👤'
                previewImg.classList.add('hidden')
                previewText.classList.remove('hidden')
                window.selectedAvatarData = null
            }
        }
    } catch (error) {
        console.error('プロフィール読み込みエラー:', error)
    }
}

async function saveProfile() {
    const displayName = document.getElementById('profile-display-name').value.trim()
    const bio = document.getElementById('profile-bio').value.trim()
    const website = document.getElementById('profile-website').value.trim()
    
    // 表示名の入力チェック
    if (!displayName) {
        showProfileMessage('表示名を入力してください', true)
        return
    }
    
    // ウェブサイトURLの形式チェック
    if (website && !isValidUrl(website)) {
        showProfileMessage('正しいURL形式で入力してください', true)
        return
    }
    
    // ローディング開始
    const saveButton = document.getElementById('save-profile-button')
    saveButton.disabled = true
    saveButton.textContent = '保存中...'
    
    try {
        // アバターデータを取得（画像または絵文字）
        const avatarData = window.selectedAvatarData || document.getElementById('profile-avatar-preview-text').textContent
        
        const { error } = await supabase.auth.updateUser({
            data: {
                display_name: displayName,
                bio: bio,
                website: website,
                avatar: avatarData,
                avatar_type: window.selectedAvatarData ? 'image' : 'emoji'
            }
        })
        
        if (error) {
            console.error('プロフィール更新エラー:', error)
            showProfileMessage('エラー: ' + error.message, true)
        } else {
            showProfileMessage('プロフィールが正常に更新されました！', false)
            showNotification('プロフィール更新完了', 'success', '変更が保存されました')
            
            // メイン画面のプロフィール表示を更新
            updateProfileDisplay()
            
            // 2秒後にモーダルを閉じる
            setTimeout(() => {
                closeProfileModal()
            }, 2000)
        }
    } finally {
        // ローディング終了
        saveButton.disabled = false
        saveButton.textContent = '保存'
    }
}

// ユーティリティ関数
function isValidUrl(string) {
    try {
        new URL(string)
        return true
    } catch (_) {
        return false
    }
}