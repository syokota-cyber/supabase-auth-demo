// メイン処理とユーティリティ関数

// ユーザー情報表示
function showUserInfo(user) {
    document.getElementById('auth-form').style.display = 'none'
    document.getElementById('user-info').style.display = 'block'
    
    // プロフィール情報を表示
    updateProfileDisplay(user)
    
    loadTodos()
}

// ユーザー情報非表示
function hideUserInfo() {
    document.getElementById('auth-form').style.display = 'block'
    document.getElementById('user-info').style.display = 'none'
}

// プロフィール表示を更新
async function updateProfileDisplay(user = null) {
    if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        user = currentUser
    }
    
    if (user) {
        const metadata = user.user_metadata || {}
        
        // 基本情報
        document.getElementById('user-email').textContent = user.email
        document.getElementById('user-created').textContent = new Date(user.created_at).toLocaleDateString('ja-JP')
        document.getElementById('user-last-signin').textContent = new Date(user.last_sign_in_at).toLocaleString('ja-JP')
        
        // カスタム情報
        document.getElementById('user-display-name').textContent = metadata.display_name || 'ユーザー名'
        
        // アバター表示（画像または絵文字）
        const avatarImg = document.getElementById('user-avatar-img')
        const avatarText = document.getElementById('user-avatar-text')
        
        if (metadata.avatar_type === 'image' && metadata.avatar) {
            avatarImg.src = metadata.avatar
            avatarImg.classList.remove('hidden')
            avatarText.classList.add('hidden')
        } else {
            avatarText.textContent = metadata.avatar || '👤'
            avatarImg.classList.add('hidden')
            avatarText.classList.remove('hidden')
        }
        
        const bioElement = document.getElementById('user-bio')
        if (metadata.bio) {
            bioElement.textContent = metadata.bio
            bioElement.classList.remove('italic')
        } else {
            bioElement.textContent = '自己紹介がありません'
            bioElement.classList.add('italic')
        }
        
        // ウェブサイトリンクがある場合は表示
        if (metadata.website) {
            bioElement.innerHTML += `<br><a href="${metadata.website}" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs">🌐 ${metadata.website}</a>`
        }
    }
}

// メッセージ表示関数（エラーと成功両方に対応）
function showMessage(message, isError = true) {
    const messageDiv = document.getElementById('message')
    messageDiv.textContent = message
    messageDiv.className = isError ? 'text-red-500 text-sm mb-4' : 'text-green-500 text-sm mb-4'
    messageDiv.style.display = 'block'
}

// メッセージ非表示関数
function hideMessage() {
    const messageDiv = document.getElementById('message')
    messageDiv.textContent = ''
    messageDiv.style.display = 'none'
}

// ローディング状態の管理
function setLoading(isLoading) {
    const signupButton = document.getElementById('signup-button')
    const signinButton = document.getElementById('signin-button')
    
    if (isLoading) {
        signupButton.disabled = true
        signinButton.disabled = true
        signupButton.textContent = '処理中...'
        signinButton.textContent = '処理中...'
    } else {
        signupButton.disabled = false
        signinButton.disabled = false
        signupButton.textContent = 'サインアップ'
        signinButton.textContent = 'ログイン'
    }
}

// リセットメッセージ表示
function showResetMessage(message, isError = true) {
    const messageDiv = document.getElementById('reset-message')
    messageDiv.textContent = message
    messageDiv.className = isError ? 'text-red-500 text-sm mb-4' : 'text-green-500 text-sm mb-4'
    messageDiv.style.display = 'block'
}

// リセットメッセージ非表示
function hideResetMessage() {
    const messageDiv = document.getElementById('reset-message')
    messageDiv.textContent = ''
    messageDiv.style.display = 'none'
}

// プロフィールメッセージ表示
function showProfileMessage(message, isError = true) {
    const messageDiv = document.getElementById('profile-message')
    messageDiv.textContent = message
    messageDiv.className = isError ? 'text-red-500 text-sm mb-4' : 'text-green-500 text-sm mb-4'
    messageDiv.style.display = 'block'
}

// プロフィールメッセージ非表示
function hideProfileMessage() {
    const messageDiv = document.getElementById('profile-message')
    messageDiv.textContent = ''
    messageDiv.style.display = 'none'
}

// パスワードの表示/非表示切り替え
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password')
    const toggleIcon = document.getElementById('password-toggle-icon')
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text'
        toggleIcon.textContent = '🙈'
    } else {
        passwordInput.type = 'password'
        toggleIcon.textContent = '👁️'
    }
}

// ブラウザ通知機能
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }
    return false
}

// 通知を表示
function showNotification(title, type = 'info', body = '') {
    // アプリ内通知
    showInAppNotification(title, type, body)
    
    // ブラウザ通知
    if (Notification.permission === 'granted') {
        const options = {
            body: body,
            icon: '👤', // 簡易アイコン
            badge: '📱',
            tag: 'todo-app-notification'
        }
        
        const iconMap = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }
        
        options.icon = iconMap[type] || '📱'
        
        const notification = new Notification(title, options)
        
        // 5秒後に自動で閉じる
        setTimeout(() => {
            notification.close()
        }, 5000)
    }
}

// アプリ内通知（画面内のトースト通知）
function showInAppNotification(title, type = 'info', body = '') {
    // 通知コンテナが存在しない場合は作成
    let container = document.getElementById('notification-container')
    if (!container) {
        container = document.createElement('div')
        container.id = 'notification-container'
        container.className = 'fixed top-4 right-4 z-50 space-y-2'
        document.body.appendChild(container)
    }
    
    // 通知要素を作成
    const notification = document.createElement('div')
    notification.className = `p-4 rounded-lg shadow-lg max-w-sm ${getNotificationStyle(type)} transform transition-all duration-300 ease-in-out opacity-0 translate-x-full`
    
    const iconMap = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    }
    
    notification.innerHTML = `
        <div class="flex items-start">
            <span class="text-lg mr-3">${iconMap[type] || 'ℹ️'}</span>
            <div class="flex-1">
                <div class="font-medium">${title}</div>
                ${body ? `<div class="text-sm mt-1">${body}</div>` : ''}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-gray-400 hover:text-gray-600">×</button>
        </div>
    `
    
    container.appendChild(notification)
    
    // アニメーション表示
    setTimeout(() => {
        notification.classList.remove('opacity-0', 'translate-x-full')
    }, 100)
    
    // 5秒後に自動削除
    setTimeout(() => {
        notification.classList.add('opacity-0', 'translate-x-full')
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove()
            }
        }, 300)
    }, 5000)
}

// 通知スタイルを取得
function getNotificationStyle(type) {
    const styles = {
        'success': 'bg-green-100 border-green-500 text-green-700',
        'error': 'bg-red-100 border-red-500 text-red-700',
        'warning': 'bg-yellow-100 border-yellow-500 text-yellow-700',
        'info': 'bg-blue-100 border-blue-500 text-blue-700'
    }
    return styles[type] || styles.info
}

// アバター画像選択処理
function handleAvatarSelection(event) {
    const file = event.target.files[0]
    if (!file) return
    
    // ファイルサイズチェック（2MB）
    if (file.size > 2 * 1024 * 1024) {
        showProfileMessage('ファイルサイズは2MB以下にしてください', true)
        return
    }
    
    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
        showProfileMessage('画像ファイルを選択してください', true)
        return
    }
    
    // FileReaderでプレビュー表示
    const reader = new FileReader()
    reader.onload = function(e) {
        const previewImg = document.getElementById('profile-avatar-preview-img')
        const previewText = document.getElementById('profile-avatar-preview-text')
        
        previewImg.src = e.target.result
        previewImg.classList.remove('hidden')
        previewText.classList.add('hidden')
        
        // Base64データを保存（実際のプロダクションではSupabase Storageを使用）
        window.selectedAvatarData = e.target.result
        
        showProfileMessage('画像を選択しました！保存ボタンを押してください。', false)
        showNotification('アバター画像が選択されました', 'success')
    }
    reader.readAsDataURL(file)
}

// ページ読み込み時の初期化
window.addEventListener('load', async () => {
    // URLパラメータをチェック（パスワードリセットリンクから来たかどうか）
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    const type = urlParams.get('type')
    
    // パスワードリセットの場合
    if (type === 'recovery' && accessToken && refreshToken) {
        try {
            // セッションを設定
            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            })
            
            if (!error) {
                // パスワード更新フォームを表示
                document.getElementById('reset-email-form').style.display = 'none'
                document.getElementById('update-password-form').style.display = 'block'
                openResetModal()
            }
        } catch (err) {
            console.error('セッション設定エラー:', err)
        }
    } else {
        // 通常のセッション確認
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            showUserInfo(user)
        }
    }
    
    // 検索ボックスにイベントリスナーを追加
    document.getElementById('search-input').addEventListener('input', filterTodos)
    document.getElementById('filter-category').addEventListener('change', filterTodos)
    document.getElementById('filter-priority').addEventListener('change', filterTodos)
    
    // Enterキーでログイン
    const emailInput = document.getElementById('email')
    const passwordInput = document.getElementById('password')
    
    const handleEnterKey = (event) => {
        if (event.key === 'Enter') {
            signIn()
        }
    }
    
    if (emailInput) emailInput.addEventListener('keypress', handleEnterKey)
    if (passwordInput) passwordInput.addEventListener('keypress', handleEnterKey)
    
    // アバター選択のイベントリスナー
    const avatarInput = document.getElementById('avatar-input')
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarSelection)
    }
    
    // 通知権限を要求
    requestNotificationPermission()
    
    // 初期表示で全期間ボタンをアクティブにする
    filterByPeriod('all')
})