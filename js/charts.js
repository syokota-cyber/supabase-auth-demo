// グラフ関連の機能

// グラフインスタンスを保持する変数
let categoryChart = null
let priorityChart = null
let statusChart = null

// グラフタイプを管理する変数
let categoryChartType = 'doughnut'  // 初期は円グラフ
let priorityChartType = 'bar'       // 初期は棒グラフ
let statusChartType = 'doughnut'    // 初期は円グラフ

// 統計情報更新関数
function updateStats(todos) {
    const total = todos.length
    const completed = todos.filter(todo => todo.complete).length
    const overdue = todos.filter(todo => 
        todo.due_date && new Date(todo.due_date) < new Date() && !todo.complete
    ).length
    const highPriority = todos.filter(todo => todo.priority === 3).length
    
    document.getElementById('total-todos').textContent = total
    document.getElementById('completed-todos').textContent = completed
    document.getElementById('overdue-todos').textContent = overdue
    document.getElementById('high-priority-todos').textContent = highPriority
    
    // グラフも更新
    updateCharts(todos)
}

// グラフデータ集計関数
function updateCharts(todos) {
    // カテゴリ別集計
    const categoryData = {
        general: todos.filter(t => t.category === 'general').length,
        work: todos.filter(t => t.category === 'work').length,
        private: todos.filter(t => t.category === 'private').length,
        shopping: todos.filter(t => t.category === 'shopping').length
    }
    
    // 優先度別集計
    const priorityData = {
        high: todos.filter(t => t.priority === 3).length,
        medium: todos.filter(t => t.priority === 2).length,
        low: todos.filter(t => t.priority === 1).length
    }
    
    // 進捗状況別集計
    const statusData = {
        completed: todos.filter(t => t.complete).length,
        incomplete: todos.filter(t => !t.complete).length
    }
    
    // グラフを描画
    drawCharts(categoryData, priorityData, statusData)
}

// グラフ描画関数
function drawCharts(categoryData, priorityData, statusData) {
    // 既存のグラフがあれば削除
    if (categoryChart) categoryChart.destroy()
    if (priorityChart) priorityChart.destroy()
    if (statusChart) statusChart.destroy()
    
    // カテゴリ別グラフ
    const categoryCtx = document.getElementById('categoryChart').getContext('2d')
    categoryChart = new Chart(categoryCtx, {
        type: categoryChartType,
        data: {
            labels: ['一般', '仕事', 'プライベート', '買い物'],
            datasets: [{
                data: [categoryData.general, categoryData.work, categoryData.private, categoryData.shopping],
                backgroundColor: ['#9CA3AF', '#3B82F6', '#10B981', '#8B5CF6']
            }]
        },
        options: {
            plugins: { 
                legend: { display: categoryChartType !== 'bar' }
            }
        }
    })
    
    // 優先度別グラフ
    const priorityCtx = document.getElementById('priorityChart').getContext('2d')
    priorityChart = new Chart(priorityCtx, {
        type: priorityChartType,
        data: {
            labels: ['高', '中', '低'],
            datasets: [{
                data: [priorityData.high, priorityData.medium, priorityData.low],
                backgroundColor: ['#EF4444', '#F59E0B', '#10B981']
            }]
        },
        options: {
            plugins: { 
                legend: { display: priorityChartType !== 'bar' } 
            }
        }
    })
    
    // 進捗状況グラフ
    const statusCtx = document.getElementById('statusChart').getContext('2d')
    statusChart = new Chart(statusCtx, {
        type: statusChartType,
        data: {
            labels: ['完了', '未完了'],
            datasets: [{
                data: [statusData.completed, statusData.incomplete],
                backgroundColor: ['#10B981', '#EF4444']
            }]
        },
        options: {
            plugins: { 
                legend: { display: statusChartType !== 'bar' }
            }
        }
    })
}

// カテゴリグラフ切り替え関数
function switchCategoryChart() {
    const types = ['doughnut', 'bar', 'pie', 'line']
    const currentIndex = types.indexOf(categoryChartType)
    categoryChartType = types[(currentIndex + 1) % types.length]
    
    // 現在のデータで再描画
    updateCharts(allTodos)
}

// 優先度グラフ切り替え関数
function switchPriorityChart() {
    const types = ['bar', 'doughnut', 'pie', 'line']
    const currentIndex = types.indexOf(priorityChartType)
    priorityChartType = types[(currentIndex + 1) % types.length]
    
    // 現在のデータで再描画
    updateCharts(allTodos)
}

// 進捗状況グラフ切り替え関数
function switchStatusChart() {
    const types = ['doughnut', 'bar', 'pie', 'line']
    const currentIndex = types.indexOf(statusChartType)
    statusChartType = types[(currentIndex + 1) % types.length]
    
    // 現在のデータで再描画
    updateCharts(allTodos)
}