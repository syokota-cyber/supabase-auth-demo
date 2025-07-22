// Supabaseクライアントの初期化
const supabaseUrl = 'https://quxokigryvzksexhbpbm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eG9raWdyeXZ6a3NleGhicGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTY5MTEsImV4cCI6MjA2ODczMjkxMX0.OEVIN34m7pnhrGO9tZ8wBxHNaNL7OCC0REpQOs6JjAQ'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// サインアップ関数
async function signUp() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    })
    
    if (error) {
        alert('エラー: ' + error.message)
    } else {
        alert('サインアップ成功！メールを確認してください')
    }
}

// ログイン関数
async function signIn() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    console.log('ログイン試行:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    
    console.log('ログイン結果:', { data, error })
    
    if (error) {
        alert('エラー: ' + error.message)
    } else {
        showUserInfo(data.user)
    }
}

// ログアウト関数
async function signOut() {
    await supabase.auth.signOut()
    hideUserInfo()
}

// ユーザー情報表示
function showUserInfo(user) {
    document.getElementById('auth-form').style.display = 'none'
    document.getElementById('user-info').style.display = 'block'
    document.getElementById('user-email').textContent = 'メール: ' + user.email
}

// ユーザー情報非表示
function hideUserInfo() {
    document.getElementById('auth-form').style.display = 'block'
    document.getElementById('user-info').style.display = 'none'
}

// ページ読み込み時にセッション確認
window.addEventListener('load', async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        showUserInfo(user)
    }
})