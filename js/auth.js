// 認証関連の機能

// Supabaseクライアントの初期化
const supabaseUrl = 'https://quxokigryvzksexhbpbm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eG9raWdyeXZ6a3NleGhicGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTY5MTEsImV4cCI6MjA2ODczMjkxMX0.OEVIN34m7pnhrGO9tZ8wBxHNaNL7OCC0REpQOs6JjAQ'

// 完全にクリーンなSupabaseクライアント
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
        flowType: 'implicit'
    },
    global: {
        headers: {
            'x-custom-header': 'local-dev'
        }
    }
})

// サインアップ関数
async function signUp() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    // 入力チェック
    if (!email || !password) {
        showMessage('メールアドレスとパスワードを入力してください', true)
        return
    }
    
    // メールアドレスの形式チェック
    if (!isValidEmail(email)) {
        showMessage('正しいメールアドレスの形式で入力してください', true)
        return
    }
    
    // パスワードの長さチェック
    if (password.length < 6) {
        showMessage('パスワードは6文字以上で入力してください', true)
        return
    }
    
    // メッセージをクリア
    hideMessage()
    
    // ローディング開始
    setLoading(true)
    
    try {
        console.log('現在のURL:', window.location.origin)
        console.log('サインアップリクエスト開始')
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        })
        
        console.log('サインアップレスポンス:', { data, error })
        
        if (error) {
            console.error('サインアップエラー詳細:', error)
            showMessage('エラー: ' + error.message, true)
        } else {
            showMessage('サインアップ成功！メールを確認してください', false)
            // 3秒後にメッセージを消す
            setTimeout(hideMessage, 3000)
        }
    } finally {
        // ローディング終了
        setLoading(false)
    }
}

// ログイン関数
async function signIn() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    // 入力チェック
    if (!email || !password) {
        showMessage('メールアドレスとパスワードを入力してください', true)
        return
    }
    
    // メールアドレスの形式チェック
    if (!isValidEmail(email)) {
        showMessage('正しいメールアドレスの形式で入力してください', true)
        return
    }
    
    // メッセージをクリア
    hideMessage()
    
    // ローディング開始
    setLoading(true)
    
    try {
        console.log('ログイン試行:', email)
        
        // ログインのみを実行
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        console.log('ログイン結果:', { data, error })
        
        if (error) {
            console.error('詳細なエラー情報:', error)
            showMessage('エラー: ' + error.message, true)
        } else {
            showMessage('ログインに成功しました！', false)
            showNotification('ログイン成功', 'success', 'ようこそ！')
            setTimeout(() => {
                showUserInfo(data.user)
            }, 1000)
        }
    } finally {
        // ローディング終了
        setLoading(false)
    }
}

// ログアウト関数
async function signOut() {
    await supabase.auth.signOut()
    hideUserInfo()
}

// モーダルからログイン
async function modalSignIn() {
    const email = document.getElementById('modal-email').value
    const password = document.getElementById('modal-password').value
    
    if (!email || !password) {
        document.getElementById('modal-message').textContent = 'メールアドレスとパスワードを入力してください'
        document.getElementById('modal-message').className = 'text-red-500 text-sm mb-4'
        return
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    
    if (error) {
        document.getElementById('modal-message').textContent = 'エラー: ' + error.message
        document.getElementById('modal-message').className = 'text-red-500 text-sm mb-4'
    } else {
        closeLoginModal()
        showUserInfo(data.user)
    }
}

// モーダルからサインアップ
async function modalSignUp() {
    const email = document.getElementById('modal-email').value
    const password = document.getElementById('modal-password').value
    
    if (!email || !password) {
        document.getElementById('modal-message').textContent = 'メールアドレスとパスワードを入力してください'
        document.getElementById('modal-message').className = 'text-red-500 text-sm mb-4'
        return
    }
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    })
    
    if (error) {
        document.getElementById('modal-message').textContent = 'エラー: ' + error.message
        document.getElementById('modal-message').className = 'text-red-500 text-sm mb-4'
    } else {
        document.getElementById('modal-message').textContent = 'サインアップ成功！メールを確認してください'
        document.getElementById('modal-message').className = 'text-green-500 text-sm mb-4'
    }
}

// ユーザー状態確認関数
async function checkUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log('現在のユーザー:', user)
    console.log('エラー:', error)
    if (user) {
        alert(`ログイン中: ${user.email}\nメール確認: ${user.email_confirmed_at ? '確認済み' : '未確認'}`)
    } else {
        alert('ログインしていません')
    }
}

// ユーティリティ関数
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
}