// resources/ts/components/admin/AdminAuditLogs.ts
import { api } from '@services/ApiService'
import { NotificationService } from '@utils/NotificationService'
import { LoadingStateManager } from '@utils/LoadingStateManager'
import { AuthService } from '@services/AuthService'

export class AdminAuditLogs {
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
            <div class="admin-audit-logs">
                <!-- Header with Stats -->
                <div class="audit-header mb-4">
                    <div class="row">
                        <div class="col-md-8">
                            <h2 class="mb-0">📝 Logi Aktywności Administratorów</h2>
                            <p class="text-muted mb-0">Historia zmian dokonanych przez administratorów</p>
                            <p class="text-muted mb-0">Aktualna wersja: tylko zmiany w Pakiety</p>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="audit-stats-mini" id="audit-stats-mini">
                                <div class="stats-loading">Ładowanie statystyk...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="audit-filters card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Administrator</label>
                                <select class="form-select" id="filter-admin" onchange="auditLogs.applyFilters()">
                                    <option value="">Wszyscy</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Akcja</label>
                                <select class="form-select" id="filter-action" onchange="auditLogs.applyFilters()">
                                    <option value="">Wszystkie</option>
                                    <option value="create">Utworzenie</option>
                                    <option value="update">Aktualizacja</option>
                                    <option value="delete">Usunięcie</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Model</label>
                                <select class="form-select" id="filter-model" onchange="auditLogs.applyFilters()">
                                    <option value="">Wszystkie</option>
                                    <option value="Package">Pakiety</option>
                                    <option value="User">Użytkownicy</option>
                                    <option value="Lesson">Lekcje</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Od daty</label>
                                <input type="date" class="form-control" id="filter-date-from" onchange="auditLogs.applyFilters()">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Szukaj</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="filter-search" 
                                           placeholder="Szukaj w opisach..." onkeyup="auditLogs.searchDelay()">
                                    <button class="btn btn-outline-secondary" type="button" onclick="auditLogs.clearFilters()">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Summary -->
                <div class="audit-stats-cards mb-4" id="audit-stats-cards">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card bg-primary text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-today">-</h3>
                                    <small>Dzisiaj</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-week">-</h3>
                                    <small>Ten tydzień</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-info text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-0" id="stat-month">-</h3>
                                    <small>Ten miesiąc</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-warning text-white">
                                <div class="card-body text-center">
                                    <div class="d-flex justify-content-around">
                                        <div>
                                            <div id="stat-creates">-</div>
                                            <small>Utworzenia</small>
                                        </div>
                                        <div>
                                            <div id="stat-updates">-</div>
                                            <small>Zmiany</small>
                                        </div>
                                        <div>
                                            <div id="stat-deletes">-</div>
                                            <small>Usunięcia</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Logs Table -->
                <div class="audit-logs-table card">
                    <div class="card-body">
                        <div class="loading-state" id="logs-loading">
                            <div class="text-center p-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Ładowanie...</span>
                                </div>
                                <p class="mt-2 text-muted">Ładowanie logów...</p>
                            </div>
                        </div>

                        <div class="table-responsive" id="logs-table-container" style="display: none;">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Czas</th>
                                        <th>Administrator</th>
                                        <th>Akcja</th>
                                        <th>Obiekt</th>
                                        <th>Opis</th>
                                        <th>IP</th>
                                        <th>Akcje</th>
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
                            <i class="bi bi-journal-x" style="font-size: 3rem; color: #ccc;"></i>
                            <p class="mt-2 text-muted">Brak logów do wyświetlenia</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Log Details Modal -->
            <div class="modal fade" id="logDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Szczegóły wpisu loga</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="log-details-content">
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
        
        // Make auditLogs globally available for onclick handlers
        ;(window as any).auditLogs = this

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
            <div class="admin-audit-logs">
                <div class="alert alert-warning text-center" style="margin: 2rem;">
                    <h4><i class="bi bi-exclamation-triangle"></i> Brak dostępu</h4>
                    <p>Aby wyświetlić logi systemowe, musisz być zalogowany jako administrator.</p>
                    <p class="mb-0">
                        <a href="#/auth/login" class="btn btn-primary">Zaloguj się</a>
                    </p>
                </div>
            </div>
        `
    }

    private async loadStats(): Promise<void> {
        try {
            const response = await api.get('/audit/stats') as any
            
            // Check if we got a proper JSON response
            if (!response.data || typeof response.data !== 'object') {
                console.warn('Invalid response format for audit stats:', response)
                this.displayEmptyStats()
                return
            }

            const stats = response.data

            // Update stats cards
            document.getElementById('stat-today')!.textContent = (stats.today_total || 0).toString()
            document.getElementById('stat-week')!.textContent = (stats.week_total || 0).toString()
            document.getElementById('stat-month')!.textContent = (stats.month_total || 0).toString()
            
            document.getElementById('stat-creates')!.textContent = (stats.today_actions?.create || 0).toString()
            document.getElementById('stat-updates')!.textContent = (stats.today_actions?.update || 0).toString()
            document.getElementById('stat-deletes')!.textContent = (stats.today_actions?.delete || 0).toString()

            // Update mini stats
            const miniStats = document.getElementById('audit-stats-mini')!
            miniStats.innerHTML = `
                <small class="text-muted">
                    <strong>${stats.today_total || 0}</strong> dzisiaj | 
                    <strong>${stats.week_total || 0}</strong> ten tydzień
                </small>
            `

        } catch (error) {
            console.error('Error loading audit stats:', error)
            this.displayEmptyStats()
        }
    }

    private displayEmptyStats(): void {
        // Show default values when stats cannot be loaded
        document.getElementById('stat-today')!.textContent = '0'
        document.getElementById('stat-week')!.textContent = '0'
        document.getElementById('stat-month')!.textContent = '0'
        
        document.getElementById('stat-creates')!.textContent = '0'
        document.getElementById('stat-updates')!.textContent = '0'
        document.getElementById('stat-deletes')!.textContent = '0'

        const miniStats = document.getElementById('audit-stats-mini')!
        miniStats.innerHTML = `
            <small class="text-muted">
                <strong>0</strong> dzisiaj | 
                <strong>0</strong> ten tydzień
            </small>
        `
    }

    private async loadLogs(): Promise<void> {
        try {
            const loadingEl = document.getElementById('logs-loading')
            const tableEl = document.getElementById('logs-table-container')
            const paginationEl = document.getElementById('pagination-container')
            const emptyEl = document.getElementById('empty-state')

            // Check if all required elements exist
            if (!loadingEl || !tableEl || !paginationEl || !emptyEl) {
                console.error('Required DOM elements not found for audit logs')
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

            const response = await api.get(`/audit/logs?${params.toString()}`) as any
            
            // Check if we got a proper JSON response
            if (!response.data || typeof response.data !== 'object') {
                console.warn('Invalid response format for audit logs:', response)
                loadingEl.style.display = 'none'
                emptyEl.style.display = 'block'
                return
            }

            const logs = response.data
            const pagination = response.pagination

            loadingEl.style.display = 'none'

            if (!logs || logs.length === 0) {
                emptyEl.style.display = 'block'
                return
            }

            this.renderLogsTable(logs)
            this.renderPagination(pagination)

            tableEl.style.display = 'block'
            paginationEl.style.display = 'flex'

        } catch (error) {
            console.error('Error loading audit logs:', error)
            
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
                    <small class="text-muted">${log.created_at_human}</small><br>
                    <small>${log.created_at}</small>
                </td>
                <td>
                    <strong>${log.admin_name}</strong><br>
                    <small class="text-muted">${log.admin_email}</small>
                </td>
                <td>
                    ${this.getActionBadge(log.action)}
                </td>
                <td>
                    <strong>${log.model_name || log.model_type}</strong>
                </td>
                <td>
                    <div class="description-cell">
                        ${log.description}
                        ${Object.keys(log.changed_fields || {}).length > 0 ? 
                            '<br><small class="text-info">+ zmiany pól</small>' : ''
                        }
                    </div>
                </td>
                <td>
                    <small class="text-muted">${log.ip_address || '-'}</small>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="auditLogs.showLogDetails(${JSON.stringify(log).replace(/"/g, '&quot;')})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('')
    }

    private getActionBadge(action: string): string {
        const badges = {
            'create': '<span class="badge bg-success">Utworzenie</span>',
            'update': '<span class="badge bg-warning">Aktualizacja</span>',
            'delete': '<span class="badge bg-danger">Usunięcie</span>'
        }
        return badges[action as keyof typeof badges] || `<span class="badge bg-secondary">${action}</span>`
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
                <button class="page-link" onclick="auditLogs.goToPage(${current - 1})">‹</button>
            </li>`)
        }

        // Page numbers
        const start = Math.max(1, current - 2)
        const end = Math.min(total, current + 2)

        for (let i = start; i <= end; i++) {
            pages.push(`<li class="page-item ${i === current ? 'active' : ''}">
                <button class="page-link" onclick="auditLogs.goToPage(${i})">${i}</button>
            </li>`)
        }

        // Next button
        if (current < total) {
            pages.push(`<li class="page-item">
                <button class="page-link" onclick="auditLogs.goToPage(${current + 1})">›</button>
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
        const adminSelect = document.getElementById('filter-admin') as HTMLSelectElement
        const actionSelect = document.getElementById('filter-action') as HTMLSelectElement
        const modelSelect = document.getElementById('filter-model') as HTMLSelectElement
        const dateFrom = document.getElementById('filter-date-from') as HTMLInputElement
        const search = document.getElementById('filter-search') as HTMLInputElement

        this.filters = {}
        if (adminSelect.value) this.filters.admin_id = adminSelect.value
        if (actionSelect.value) this.filters.action = actionSelect.value
        if (modelSelect.value) this.filters.model_type = modelSelect.value
        if (dateFrom.value) this.filters.date_from = dateFrom.value
        if (search.value) this.filters.search = search.value

        this.currentPage = 1
        this.loadLogs()
    }

    clearFilters(): void {
        const inputs = ['filter-admin', 'filter-action', 'filter-model', 'filter-date-from', 'filter-search']
        inputs.forEach(id => {
            const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement
            if (el) el.value = ''
        })
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

    showLogDetails(log: any): void {
        const modal = document.getElementById('logDetailsModal')!
        const content = document.getElementById('log-details-content')!

        content.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <strong>Administrator:</strong><br>
                    ${log.admin_name} (${log.admin_email})
                </div>
                <div class="col-md-6">
                    <strong>Czas:</strong><br>
                    ${log.created_at} (${log.created_at_human})
                </div>
                <div class="col-md-6">
                    <strong>Akcja:</strong><br>
                    ${this.getActionBadge(log.action)}
                </div>
                <div class="col-md-6">
                    <strong>IP Address:</strong><br>
                    ${log.ip_address || '-'}
                </div>
                <div class="col-12">
                    <strong>Opis:</strong><br>
                    ${log.description}
                </div>
                ${Object.keys(log.changed_fields || {}).length > 0 ? `
                <div class="col-12">
                    <strong>Zmienione pola:</strong>
                    <div class="mt-2">
                        ${Object.entries(log.changed_fields).map(([field, change]: [string, any]) => `
                            <div class="border rounded p-2 mb-2 bg-light">
                                <strong>${field}:</strong><br>
                                <span class="text-muted">Z: "${change.from}"</span><br>
                                <span class="text-success">Na: "${change.to}"</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `

        const bootstrapModal = new (window as any).bootstrap.Modal(modal)
        bootstrapModal.show()
    }
}