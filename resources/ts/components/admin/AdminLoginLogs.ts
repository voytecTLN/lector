// resources/ts/components/admin/AdminLoginLogs.ts
import { api } from '@services/ApiService'
import { NotificationService } from '@utils/NotificationService'
import { LoadingStateManager } from '@utils/LoadingStateManager'
import { AuthService } from '@services/AuthService'

export class AdminLoginLogs {
    private container: HTMLElement | null = null
    private loadingManager: LoadingStateManager
    private currentPage: number = 1
    private totalPages: number = 1
    private filters: any = {}
    private authService: AuthService

    constructor() {
        // LoadingStateManager will be initialized when we have a proper container
        this.loadingManager = null as any
        this.authService = AuthService.getInstance()
    }

    render(): string {
        return `
            <div class="admin-login-logs">
                <!-- Header with Stats -->
                <div class="login-logs-header mb-4">
                    <div class="row">
                        <div class="col-md-8">
                            <h2 class="mb-0">🔑 Logi Logowań Użytkowników</h2>
                            <p class="text-muted mb-0">Historia logowań administratorów, lektorów, moderatorów i studentów</p>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="login-stats-mini" id="login-stats-mini">
                                <div class="stats-loading">Ładowanie statystyk...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Summary -->
                <div class="login-stats-cards mb-4" id="login-stats-cards">
                    <div class="row">
                        <div class="col-md-2">
                            <div class="card bg-primary text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-24h">-</h3>
                                    <small>24h</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="card bg-success text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-7days">-</h3>
                                    <small>7 dni</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="card bg-info text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-30days">-</h3>
                                    <small>30 dni</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="card bg-warning text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-total">-</h3>
                                    <small>Wszyscy</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="card bg-secondary text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-active">-</h3>
                                    <small>Aktywni</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="card bg-danger text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-never">-</h3>
                                    <small>Nigdy</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="login-filters card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-2">
                                <label class="form-label">Rola</label>
                                <select class="form-select" id="filter-role" onchange="loginLogs.applyFilters()">
                                    <option value="">Wszystkie</option>
                                    <option value="admin">Administrator</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="tutor">Lektor</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="filter-status" onchange="loginLogs.applyFilters()">
                                    <option value="">Wszystkie</option>
                                    <option value="active">Aktywny</option>
                                    <option value="inactive">Nieaktywny</option>
                                    <option value="suspended">Zawieszony</option>
                                    <option value="banned">Zablokowany</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Od daty</label>
                                <input type="date" class="form-control" id="filter-date-from" onchange="loginLogs.applyFilters()">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Do daty</label>
                                <input type="date" class="form-control" id="filter-date-to" onchange="loginLogs.applyFilters()">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Szukaj</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="filter-search" 
                                           placeholder="Nazwa lub email..." onkeyup="loginLogs.searchDelay()">
                                    <button class="btn btn-outline-secondary" type="button" onclick="loginLogs.clearFilters()">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-1">
                                <label class="form-label">&nbsp;</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="filter-logged-in-only" onchange="loginLogs.applyFilters()">
                                    <label class="form-check-label" for="filter-logged-in-only">
                                        Tylko zalogowani
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Logs Table -->
                <div class="login-logs-table card">
                    <div class="card-body">
                        <div class="loading-state" id="logs-loading">
                            <div class="text-center p-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Ładowanie...</span>
                                </div>
                                <p class="mt-2 text-muted">Ładowanie logów logowań...</p>
                            </div>
                        </div>

                        <div class="table-responsive" id="logs-table-container" style="display: none;">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Użytkownik</th>
                                        <th>Rola</th>
                                        <th>Status</th>
                                        <th>Ostatnie logowanie</th>
                                        <th>IP</th>
                                        <th>Dni od logowania</th>
                                        <th>Data utworzenia</th>
                                    </tr>
                                </thead>
                                <tbody id="logs-table-body">
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div class="d-flex justify-content-between align-items-center mt-3" id="pagination-container" style="display: none;">
                            <div class="text-muted" id="pagination-info">
                            </div>
                            <nav>
                                <ul class="pagination pagination-sm mb-0" id="pagination">
                                </ul>
                            </nav>
                        </div>

                        <!-- Empty State -->
                        <div class="text-center p-4" id="empty-state" style="display: none;">
                            <i class="bi bi-person-x" style="font-size: 3rem; color: #ccc;"></i>
                            <p class="mt-2 text-muted">Brak użytkowników do wyświetlenia</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        
        // Show authentication notice if not properly authenticated
        if (!this.checkAuthentication()) {
            this.showAuthenticationError()
            return
        }

        // Render HTML first
        container.innerHTML = this.render()
        
        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 0))
        
        // Initialize LoadingStateManager now that DOM is rendered
        this.loadingManager = new LoadingStateManager(container, {
            loading: '#logs-loading',
            content: '#logs-table-container', 
            error: '#empty-state'
        })
        
        // Make loginLogs globally available for onclick handlers
        ;(window as any).loginLogs = this

        // Load data after DOM is ready
        await Promise.all([
            this.loadStats(),
            this.loadLogs()
        ])
    }

    private checkAuthentication(): boolean {
        const user = this.authService.getUser()
        return !!(user && user.role === 'admin')
    }

    private showAuthenticationError(): void {
        const contentArea = this.container!
        contentArea.innerHTML = `
            <div class="admin-login-logs">
                <div class="alert alert-warning text-center" style="margin: 2rem;">
                    <h4><i class="bi bi-exclamation-triangle"></i> Brak dostępu</h4>
                    <p>Aby wyświetlić logi logowań, musisz być zalogowany jako administrator.</p>
                    <p class="mb-0">
                        <a href="#/auth/login" class="btn btn-primary">Zaloguj się</a>
                    </p>
                </div>
            </div>
        `
    }

    private async loadStats(): Promise<void> {
        try {
            console.log('Loading login stats...')
            const response = await api.get('/login-logs/stats') as any
            console.log('Stats response:', response)
            
            // Check if we got a proper JSON response
            if (!response.data || typeof response.data !== 'object') {
                console.warn('Invalid response format for login stats:', response)
                this.displayEmptyStats()
                return
            }

            const stats = response.data
            console.log('Parsed stats:', stats)

            // Update stats cards
            const statsMapping = [
                ['stat-24h', stats.logged_in_24h || 0],
                ['stat-7days', stats.logged_in_7days || 0],
                ['stat-30days', stats.logged_in_30days || 0],
                ['stat-total', stats.total_users || 0],
                ['stat-active', stats.active_users || 0],
                ['stat-never', stats.never_logged_in || 0]
            ]
            
            statsMapping.forEach(([id, value]) => {
                const element = document.getElementById(id as string)
                if (element) {
                    element.textContent = value.toString()
                }
            })

            // Update mini stats
            const miniStats = document.getElementById('login-stats-mini')
            if (miniStats) {
                miniStats.innerHTML = `
                    <small class="text-muted">
                        <strong>${stats.logged_in_24h || 0}</strong> dzisiaj | 
                        <strong>${stats.logged_in_7days || 0}</strong> ten tydzień
                    </small>
                `
            }

        } catch (error) {
            console.error('Error loading login stats:', error)
            
            // Only show user notification for API errors, not DOM manipulation errors
            if (error instanceof Error && !error.message.includes('DOM')) {
                console.warn('API error loading stats:', error.message)
            }
            
            this.displayEmptyStats()
        }
    }

    private displayEmptyStats(): void {
        // Show default values when stats cannot be loaded
        const statsElements = [
            'stat-24h', 'stat-7days', 'stat-30days', 
            'stat-total', 'stat-active', 'stat-never'
        ]
        
        statsElements.forEach(id => {
            const element = document.getElementById(id)
            if (element) {
                element.textContent = '0'
            }
        })

        const miniStats = document.getElementById('login-stats-mini')
        if (miniStats) {
            miniStats.innerHTML = `
                <small class="text-muted">
                    <strong>0</strong> dzisiaj | 
                    <strong>0</strong> ten tydzień
                </small>
            `
        }
    }

    private async loadLogs(): Promise<void> {
        try {
            const loadingEl = document.getElementById('logs-loading')
            const tableEl = document.getElementById('logs-table-container')
            const paginationEl = document.getElementById('pagination-container')
            const emptyEl = document.getElementById('empty-state')

            // Check if all required elements exist
            if (!loadingEl || !tableEl || !paginationEl || !emptyEl) {
                console.error('Required DOM elements not found for login logs')
                return
            }

            loadingEl.style.display = 'block'
            tableEl.style.display = 'none'
            paginationEl.style.display = 'none'
            emptyEl.style.display = 'none'

            const params = new URLSearchParams({
                per_page: '25',
                page: this.currentPage.toString(),
                ...this.filters
            })

            console.log('Loading login logs with params:', params.toString())
            const response = await api.get(`/login-logs/logs?${params.toString()}`) as any
            console.log('Logs response:', response)
            
            // Check if we got a proper JSON response
            if (!response.data || typeof response.data !== 'object' || !response.pagination) {
                console.warn('Invalid response format for login logs:', response)
                loadingEl.style.display = 'none'
                emptyEl.style.display = 'block'
                return
            }

            const logs = response.data
            const pagination = response.pagination
            console.log('Parsed logs:', logs, 'Pagination:', pagination)

            loadingEl.style.display = 'none'

            if (!logs || logs.length === 0) {
                emptyEl.style.display = 'block'
                return
            }

            try {
                this.renderLogsTable(logs)
                this.renderPagination(pagination)
            } catch (renderError) {
                console.error('Error rendering logs table or pagination:', renderError)
                throw renderError
            }

            tableEl.style.display = 'block'
            paginationEl.style.display = 'flex'

        } catch (error) {
            console.error('Error loading login logs:', error)
            
            const loadingEl = document.getElementById('logs-loading')
            const emptyEl = document.getElementById('empty-state')
            
            if (loadingEl) loadingEl.style.display = 'none'
            if (emptyEl) emptyEl.style.display = 'block'
        }
    }

    private renderLogsTable(logs: any[]): void {
        const tbody = document.getElementById('logs-table-body')
        if (!tbody) {
            console.error('Table body element not found')
            return
        }
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>
                    <strong>${log.name}</strong><br>
                    <small class="text-muted">${log.email}</small>
                </td>
                <td>
                    ${this.getRoleBadge(log.role, log.role_display)}
                </td>
                <td>
                    ${this.getStatusBadge(log.status, log.status_display)}
                </td>
                <td>
                    ${log.last_login_at_human}<br>
                    ${log.last_login_at ? `<small class="text-muted">${log.last_login_at}</small>` : ''}
                </td>
                <td>
                    <small class="text-muted">${log.last_login_ip || '-'}</small>
                </td>
                <td>
                    ${log.days_since_login !== null ? 
                        (log.days_since_login === 0 ? 
                            '<span class="badge bg-success">Dzisiaj</span>' : 
                            `<span class="badge bg-${log.days_since_login <= 7 ? 'primary' : log.days_since_login <= 30 ? 'warning' : 'danger'}">${log.days_since_login} dni</span>`) 
                        : '<span class="badge bg-secondary">Nigdy</span>'
                    }
                </td>
                <td>
                    <small class="text-muted">${log.created_at_human}</small><br>
                    <small>${log.created_at}</small>
                </td>
            </tr>
        `).join('')
    }

    private getRoleBadge(role: string, roleDisplay: string): string {
        const badges = {
            'admin': '<span class="badge bg-danger">👑 Administrator</span>',
            'moderator': '<span class="badge bg-warning">🛡️ Moderator</span>',
            'tutor': '<span class="badge bg-success">👨‍🏫 Lektor</span>',
            'student': '<span class="badge bg-primary">📚 Student</span>'
        }
        return badges[role as keyof typeof badges] || `<span class="badge bg-secondary">${roleDisplay}</span>`
    }

    private getStatusBadge(status: string, statusDisplay: string): string {
        const badges = {
            'active': '<span class="badge bg-success">Aktywny</span>',
            'inactive': '<span class="badge bg-secondary">Nieaktywny</span>',
            'suspended': '<span class="badge bg-warning">Zawieszony</span>',
            'banned': '<span class="badge bg-danger">Zablokowany</span>'
        }
        return badges[status as keyof typeof badges] || `<span class="badge bg-secondary">${statusDisplay}</span>`
    }

    private renderPagination(pagination: any): void {
        const info = document.getElementById('pagination-info')
        const paginationEl = document.getElementById('pagination')
        
        if (!info || !paginationEl) {
            console.error('Pagination elements not found')
            return
        }

        info.innerHTML = `Wyświetlane ${pagination.from}-${pagination.to} z ${pagination.total}`

        this.currentPage = pagination.current_page
        this.totalPages = pagination.last_page

        const pages = []
        const current = this.currentPage
        const total = this.totalPages

        // Previous button
        if (current > 1) {
            pages.push(`<li class="page-item">
                <button class="page-link" onclick="loginLogs.goToPage(${current - 1})">‹</button>
            </li>`)
        }

        // Page numbers
        const start = Math.max(1, current - 2)
        const end = Math.min(total, current + 2)

        for (let i = start; i <= end; i++) {
            pages.push(`<li class="page-item ${i === current ? 'active' : ''}">
                <button class="page-link" onclick="loginLogs.goToPage(${i})">${i}</button>
            </li>`)
        }

        // Next button
        if (current < total) {
            pages.push(`<li class="page-item">
                <button class="page-link" onclick="loginLogs.goToPage(${current + 1})">›</button>
            </li>`)
        }

        paginationEl.innerHTML = pages.join('')
    }

    // Public methods for UI interactions
    goToPage(page: number): void {
        this.currentPage = page
        this.loadLogs()
    }

    applyFilters(): void {
        const roleSelect = document.getElementById('filter-role') as HTMLSelectElement
        const statusSelect = document.getElementById('filter-status') as HTMLSelectElement
        const dateFrom = document.getElementById('filter-date-from') as HTMLInputElement
        const dateTo = document.getElementById('filter-date-to') as HTMLInputElement
        const search = document.getElementById('filter-search') as HTMLInputElement
        const loggedInOnly = document.getElementById('filter-logged-in-only') as HTMLInputElement

        this.filters = {}
        if (roleSelect.value) this.filters.role = roleSelect.value
        if (statusSelect.value) this.filters.status = statusSelect.value
        if (dateFrom.value) this.filters.date_from = dateFrom.value
        if (dateTo.value) this.filters.date_to = dateTo.value
        if (search.value) this.filters.search = search.value
        if (loggedInOnly.checked) this.filters.logged_in_only = '1'

        this.currentPage = 1
        this.loadLogs()
    }

    clearFilters(): void {
        const inputs = ['filter-role', 'filter-status', 'filter-date-from', 'filter-date-to', 'filter-search']
        inputs.forEach(id => {
            const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement
            if (el) el.value = ''
        })
        
        const checkbox = document.getElementById('filter-logged-in-only') as HTMLInputElement
        if (checkbox) checkbox.checked = false

        this.filters = {}
        this.currentPage = 1
        this.loadLogs()
    }

    private searchTimeout: number | null = null
    searchDelay(): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout)
        }
        this.searchTimeout = setTimeout(() => {
            this.applyFilters()
        }, 500) as unknown as number
    }
}