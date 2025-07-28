// TODO機能関連

// TODOデータを保持する変数
let allTodos = []

// ドラッグ中のTODO IDを保持
let draggedTodoId = null

// 編集中のTODO IDを保持
let editingTodoId = null

// 現在の期間フィルター
let currentPeriod = 'all'

// 現在のタスクタイプフィルター
let currentTaskTypeFilter = 'all'

// TODO追加関数
async function addTodo() {
    const todoInput = document.getElementById('todo-input')
    const typeSelect = document.getElementById('todo-type')
    const categorySelect = document.getElementById('todo-category')
    const prioritySelect = document.getElementById('todo-priority')
    const dueDateInput = document.getElementById('todo-due-date')
    const recurrencePattern = document.getElementById('recurrence-pattern')
    
    const title = todoInput.value.trim()
    const taskType = typeSelect.value
    const category = categorySelect.value
    const priority = parseInt(prioritySelect.value)
    const dueDate = dueDateInput.value || null
    
    if (!title) {
        alert('TODOを入力してください')
        return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    // タスクタイプに応じたデータを準備
    const todoData = {
        user_id: user.id,
        title: title,
        category: category,
        priority: priority,
        task_type: taskType,
        complete: false
    }
    
    // タスクタイプ別の追加処理
    if (taskType === 'deadline') {
        todoData.due_date = dueDate
    } else if (taskType === 'habit') {
        // 習慣タスクの場合、habit_templatesに登録
        const { data: habitData, error: habitError } = await supabase
            .from('habit_templates')
            .insert([{
                user_id: user.id,
                title: title,
                category: category,
                priority: priority,
                recurrence_pattern: recurrencePattern.value,
                is_active: true
            }])
            .select()
            .single()
        
        if (habitError) {
            alert('習慣タスク作成エラー: ' + habitError.message)
            return
        }
        
        // 今日の習慣タスクを作成
        todoData.parent_habit_id = habitData.id
        todoData.recurrence_pattern = recurrencePattern.value
    }
    
    const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
    
    if (error) {
        alert('エラー: ' + error.message)
        showNotification('TODO追加エラー', 'error', error.message)
    } else {
        todoInput.value = ''
        dueDateInput.value = ''
        showNotification('TODO追加完了', 'success', 'TODOが追加されました')
        loadTodos()
    }
}

// TODOリスト取得・表示関数
async function loadTodos() {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('TODOリスト取得エラー:', error)
        return
    }
    
    // データを保存
    allTodos = todos
    
    // 表示を更新
    displayTodos(todos)
}

// TODOを表示する関数
function displayTodos(todos) {
    const todoList = document.getElementById('todo-list')
    todoList.innerHTML = ''
    
    // 統計情報を更新
    updateStats(todos)
    
    todos.forEach(todo => {
        const categoryColors = {
            'general': 'bg-gray-100 text-gray-700',
            'work': 'bg-blue-100 text-blue-700',
            'private': 'bg-green-100 text-green-700',
            'shopping': 'bg-purple-100 text-purple-700'
        }
        const categoryNames = {
            'general': '一般',
            'work': '仕事',
            'private': 'プライベート',
            'shopping': '買い物'
        }
        const priorityColors = {
            3: 'bg-red-100 text-red-700',
            2: 'bg-yellow-100 text-yellow-700', 
            1: 'bg-green-100 text-green-700'
        }
        const priorityNames = { 3: '高', 2: '中', 1: '低' }
        
        // タスクタイプアイコン
        const taskTypeIcons = {
            'habit': '🔄',
            'deadline': '📅',
            'normal': ''
        }
        
        // 期限判定
        const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.complete
        const dueDateStr = todo.due_date ? new Date(todo.due_date).toLocaleDateString('ja-JP') : ''
        
        const todoItem = document.createElement('div')
        todoItem.className = `flex items-center p-3 rounded-md ${isOverdue ? 'bg-red-50 border-l-4 border-red-400' : 'bg-gray-50'} cursor-move`
        todoItem.draggable = true
        todoItem.dataset.todoId = todo.id
        
        // ドラッグイベントを追加
        todoItem.addEventListener('dragstart', handleDragStart)
        todoItem.addEventListener('dragover', handleDragOver)
        todoItem.addEventListener('drop', handleDrop)
        todoItem.addEventListener('dragend', handleDragEnd)
        // 習慣タスクの場合、過去7日間の達成状況を表示
        let habitStreak = ''
        if (todo.task_type === 'habit') {
            habitStreak = generateHabitStreak(todo)
        }
        
        todoItem.innerHTML = `
            ${taskTypeIcons[todo.task_type] ? `<span class="text-lg mr-2">${taskTypeIcons[todo.task_type]}</span>` : ''}
            ${todo.task_type === 'habit' && todo.streak_count > 0 ? `<span class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 mr-2">🔥${todo.streak_count}日</span>` : ''}
            ${habitStreak}
            <span class="px-2 py-1 text-xs rounded-full ${priorityColors[todo.priority] || priorityColors[2]} mr-2">
                ${priorityNames[todo.priority] || '中'}
            </span>
            <span class="px-2 py-1 text-xs rounded-full ${categoryColors[todo.category] || categoryColors.general} mr-2">
                ${categoryNames[todo.category] || 'その他'}
            </span>
            ${dueDateStr && todo.task_type === 'deadline' ? `<span class="px-2 py-1 text-xs rounded ${isOverdue ? 'bg-red-200 text-red-800' : 'bg-blue-100 text-blue-700'} mr-2">期限:${dueDateStr}</span>` : ''}
            <span class="flex-1 ${todo.complete ? 'line-through text-gray-500' : 'text-gray-800'}">${todo.title}</span>
            <button onclick="editTodo(${todo.id})" 
                    class="ml-2 px-3 py-1 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white"
                    draggable="false">
                編集
            </button>
            <button onclick="toggleTodo(${todo.id}, ${!todo.complete})" 
                    class="ml-2 px-3 py-1 text-sm rounded ${todo.complete ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white"
                    draggable="false">
                ${todo.complete ? '未完了' : '完了'}
            </button>
            <button onclick="deleteTodo(${todo.id})" 
                    class="ml-2 px-3 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white"
                    draggable="false">
                削除
            </button>
        `
        todoList.appendChild(todoItem)
    })
}

// TODO完了/未完了切り替え関数
async function toggleTodo(id, completed) {
    const todo = allTodos.find(t => t.id === id)
    
    if (todo && todo.task_type === 'habit' && completed) {
        // 習慣タスクの完了処理
        const { data, error } = await supabase
            .from('todos')
            .update({ 
                complete: completed,
                streak_count: (todo.streak_count || 0) + 1,
                last_completed_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', id)
        
        if (error) {
            alert('エラー: ' + error.message)
        } else {
            showNotification('習慣達成！', 'success', `連続${(todo.streak_count || 0) + 1}日達成しました！`)
            loadTodos()
        }
    } else {
        // 通常タスクの完了処理
        const { data, error } = await supabase
            .from('todos')
            .update({ complete: completed })
            .eq('id', id)
        
        if (error) {
            alert('エラー: ' + error.message)
        } else {
            loadTodos()
        }
    }
}

// TODO削除関数
async function deleteTodo(id) {
    if (!confirm('このTODOを削除しますか？')) {
        return
    }
    
    const { data, error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
    
    if (error) {
        alert('エラー: ' + error.message)
    } else {
        loadTodos()
    }
}

// TODO編集モーダルを開く
function editTodo(id) {
    const todo = allTodos.find(t => t.id === id)
    if (!todo) return
    
    editingTodoId = id
    
    // 現在の値をフォームに設定
    document.getElementById('edit-todo-title').value = todo.title
    document.getElementById('edit-todo-category').value = todo.category
    document.getElementById('edit-todo-priority').value = todo.priority
    document.getElementById('edit-todo-due-date').value = todo.due_date || ''
    
    // モーダルを表示
    document.getElementById('edit-todo-modal').classList.remove('hidden')
}

// TODO更新関数
async function updateTodo() {
    if (!editingTodoId) return
    
    const title = document.getElementById('edit-todo-title').value.trim()
    const category = document.getElementById('edit-todo-category').value
    const priority = parseInt(document.getElementById('edit-todo-priority').value)
    const dueDate = document.getElementById('edit-todo-due-date').value || null
    
    if (!title) {
        document.getElementById('edit-todo-message').textContent = 'タイトルを入力してください'
        document.getElementById('edit-todo-message').className = 'text-red-500 text-sm mb-4'
        return
    }
    
    const { data, error } = await supabase
        .from('todos')
        .update({
            title: title,
            category: category,
            priority: priority,
            due_date: dueDate
        })
        .eq('id', editingTodoId)
    
    if (error) {
        document.getElementById('edit-todo-message').textContent = 'エラー: ' + error.message
        document.getElementById('edit-todo-message').className = 'text-red-500 text-sm mb-4'
    } else {
        showNotification('TODO更新完了', 'success', 'TODOが更新されました')
        closeEditTodoModal()
        loadTodos()
    }
}

// 期間フィルター関数
function filterByPeriod(period) {
    currentPeriod = period
    
    // ボタンのスタイルを更新
    document.querySelectorAll('.period-btn').forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.add('bg-blue-100', 'border-blue-500')
            btn.classList.remove('border-gray-300')
        } else {
            btn.classList.remove('bg-blue-100', 'border-blue-500')
            btn.classList.add('border-gray-300')
        }
    })
    
    // フィルターを適用
    filterTodos()
}

// 検索機能
function filterTodos() {
    const searchText = document.getElementById('search-input').value.toLowerCase()
    const filterCategory = document.getElementById('filter-category').value
    const filterPriority = document.getElementById('filter-priority').value
    
    const filteredTodos = allTodos.filter(todo => {
        // テキスト検索
        const matchesSearch = todo.title.toLowerCase().includes(searchText)
        
        // カテゴリフィルタ
        const matchesCategory = !filterCategory || todo.category === filterCategory
        
        // 優先度フィルタ
        const matchesPriority = !filterPriority || todo.priority === parseInt(filterPriority)
        
        // タスクタイプフィルタ
        let matchesTaskType = true
        if (currentTaskTypeFilter !== 'all') {
            switch (currentTaskTypeFilter) {
                case 'today':
                    // 今日のタスク（通常タスク + 今日の習慣タスク + 今日が期限の納期タスク）
                    const today = new Date().toISOString().split('T')[0]
                    matchesTaskType = (
                        todo.task_type === 'normal' ||
                        (todo.task_type === 'habit' && !todo.complete) ||
                        (todo.task_type === 'deadline' && todo.due_date === today)
                    )
                    break
                case 'habit':
                    matchesTaskType = todo.task_type === 'habit'
                    break
                case 'deadline':
                    matchesTaskType = todo.task_type === 'deadline'
                    break
            }
        }
        
        // 期間フィルタ
        let matchesPeriod = true
        if (currentPeriod !== 'all') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todoDate = new Date(todo.created_at)
            
            switch (currentPeriod) {
                case 'today':
                    matchesPeriod = todoDate >= today
                    break
                case 'week':
                    const weekAgo = new Date(today)
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    matchesPeriod = todoDate >= weekAgo
                    break
                case 'month':
                    const monthAgo = new Date(today)
                    monthAgo.setMonth(monthAgo.getMonth() - 1)
                    matchesPeriod = todoDate >= monthAgo
                    break
            }
        }
        
        // すべての条件を満たすものだけを返す
        return matchesSearch && matchesCategory && matchesPriority && matchesTaskType && matchesPeriod
    })
    
    displayTodos(filteredTodos)
}

// ドラッグ処理
function handleDragStart(event) {
    draggedTodoId = event.target.dataset.todoId
    event.target.style.opacity = '0.5'
}

function handleDragOver(event) {
    event.preventDefault()
}

function handleDrop(event) {
    event.preventDefault()
    const dropTargetId = event.target.closest('[data-todo-id]').dataset.todoId
    
    if (draggedTodoId && dropTargetId && draggedTodoId !== dropTargetId) {
        swapTodoPositions(parseInt(draggedTodoId), parseInt(dropTargetId))
    }
}

function swapTodoPositions(draggedId, targetId) {
    const draggedIndex = allTodos.findIndex(todo => todo.id === draggedId)
    const targetIndex = allTodos.findIndex(todo => todo.id === targetId)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
        [allTodos[draggedIndex], allTodos[targetIndex]] = [allTodos[targetIndex], allTodos[draggedIndex]]
        displayTodos(allTodos)
    }
}

function handleDragEnd(event) {
    event.target.style.opacity = '1'
    draggedTodoId = null
}

// 習慣タスクの自動生成
async function generateDailyHabits() {
    const { data: { user } } = await supabase.auth.getUser()
    
    // アクティブな習慣テンプレートを取得
    const { data: templates, error: templatesError } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
    
    if (templatesError) {
        console.error('習慣テンプレート取得エラー:', templatesError)
        return
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    for (const template of templates) {
        // 今日の習慣タスクが既に存在するか確認
        const { data: existingTodos, error: checkError } = await supabase
            .from('todos')
            .select('*')
            .eq('parent_habit_id', template.id)
            .gte('created_at', today + 'T00:00:00')
            .lte('created_at', today + 'T23:59:59')
        
        if (checkError) {
            console.error('既存タスクチェックエラー:', checkError)
            continue
        }
        
        // 今日のタスクがまだ作成されていない場合は作成
        if (!existingTodos || existingTodos.length === 0) {
            const { error: createError } = await supabase
                .from('todos')
                .insert([{
                    user_id: user.id,
                    title: template.title,
                    category: template.category,
                    priority: template.priority,
                    task_type: 'habit',
                    parent_habit_id: template.id,
                    recurrence_pattern: template.recurrence_pattern,
                    complete: false,
                    streak_count: 0
                }])
            
            if (createError) {
                console.error('習慣タスク作成エラー:', createError)
            }
        }
    }
    
    // TODOリストを再読み込み
    loadTodos()
}

// タスクタイプフィルター関数
function filterByTaskType(taskType) {
    currentTaskTypeFilter = taskType
    
    // ボタンのスタイルを更新
    document.querySelectorAll('.task-type-btn').forEach(btn => {
        if (btn.dataset.taskType === taskType) {
            btn.classList.add('bg-blue-100', 'border-blue-500')
            btn.classList.remove('border-gray-300')
        } else {
            btn.classList.remove('bg-blue-100', 'border-blue-500')
            btn.classList.add('border-gray-300')
        }
    })
    
    // フィルターを適用
    filterTodos()
}

// 習慣タスクの連続達成状況を視覚的に表示
function generateHabitStreak(todo) {
    if (!todo.parent_habit_id) return ''
    
    // 過去7日間の達成状況を表示（仮実装）
    // 実際には過去の完了履歴をデータベースから取得する必要があります
    const today = new Date()
    let streakHTML = '<div class="inline-flex items-center gap-0.5 mr-3 px-2 py-1 bg-gray-50 rounded-lg">'
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const isToday = i === 0
        
        // 仮の達成状況（実際にはデータベースから取得）
        const isCompleted = todo.complete && isToday ? true : (i > 0 && Math.random() > 0.3) // デモ用
        const isPending = isToday && !todo.complete
        
        let dotClass = 'w-2 h-2 rounded-full '
        if (isCompleted) {
            dotClass += 'bg-green-500'
        } else if (isPending) {
            dotClass += 'bg-yellow-400 animate-pulse'
        } else {
            dotClass += 'bg-gray-300'
        }
        
        streakHTML += `<div class="${dotClass}" title="${date.toLocaleDateString('ja-JP')}"></div>`
    }
    
    streakHTML += '</div>'
    return streakHTML
}

// タスクタイプ選択時の表示切り替え
function toggleTaskTypeOptions() {
    const taskType = document.getElementById('todo-type').value
    const habitOptions = document.getElementById('habit-options')
    const dueDateInput = document.getElementById('todo-due-date')
    
    if (taskType === 'habit') {
        habitOptions.classList.remove('hidden')
        dueDateInput.disabled = true
        dueDateInput.value = ''
        dueDateInput.style.display = 'none'
    } else {
        habitOptions.classList.add('hidden')
        dueDateInput.disabled = false
        dueDateInput.style.display = 'block'
    }
}