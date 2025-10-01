import { ApiService } from '@services/ApiService'
import { availabilityLogsService } from '@services/AvailabilityLogsService'

const api = new ApiService()

export class AdminAvailabilityLogs {
    private container: HTMLElement | null = null
    private currentPage = 1
    private totalPages = 1
    private filters = {
        tutorId: '',
        action: '',
        dateFrom: '',
        dateTo: '',
        search: '',
        detailsDateFrom: '',
        detailsDateTo: ''
    }
    private isLoading = false
    private stats: any = null

    async mount(container: HTMLElement) {
        console.log('🚀 AdminAvailabilityLogs mount called')
        this.container = container
        await this.render()
    }

    unmount(): void {
        // Clean up any intervals, event listeners, etc.
        this.container = null
        this.isLoading = false
    }

    async render() {
        if (!this.container) return

        console.log('🎨 AdminAvailabilityLogs render called')
        this.container.innerHTML = this.getTemplate()
        this.attachEventListeners()
        await this.loadData()
        await this.loadStats()
    }

    private getTemplate(): string {
        return `
            <div class="availability-logs-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Logi Dostępności Lektorów</h2>
                    <div>
                        <button class="btn btn-outline-primary me-2" id="refresh-logs">
                            <i class="bi bi-arrow-clockwise"></i> Odśwież
                        </button>
                        <div class="btn-group me-2" role="group">
                            <select class="form-select" id="month-selector" style="max-width: 200px;">
                                ${this.getMonthOptions()}
                            </select>
                            <button class="btn btn-warning" id="check-availability-alert">
                                <i class="bi bi-search"></i> Sprawdź Dostępność
                            </button>
                        </div>
                        <button class="btn btn-success" id="export-csv">
                            <i class="bi bi-download"></i> Eksport CSV
                        </button>
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="row mb-4" id="stats-container">
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-subtitle mb-2 text-muted">Wszystkie zmiany</h6>
                                <h3 class="card-title mb-0">
                                    <span class="spinner-border spinner-border-sm"></span>
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-subtitle mb-2 text-muted">Dzisiaj</h6>
                                <h3 class="card-title mb-0">
                                    <span class="spinner-border spinner-border-sm"></span>
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-subtitle mb-2 text-muted">Ten tydzień</h6>
                                <h3 class="card-title mb-0">
                                    <span class="spinner-border spinner-border-sm"></span>
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-subtitle mb-2 text-muted">Ten miesiąc</h6>
                                <h3 class="card-title mb-0">
                                    <span class="spinner-border spinner-border-sm"></span>
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Filtry</h5>
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Szukaj (lektor)</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="search-input"
                                    placeholder="Imię lub email..."
                                    value="${this.filters.search}"
                                >
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Akcja</label>
                                <select class="form-select" id="action-filter">
                                    <option value="">Wszystkie</option>
                                    <option value="added">Dodano</option>
                                    <option value="updated">Zaktualizowano</option>
                                    <option value="deleted">Usunięto</option>
                                    <option value="bulk_update">Zbiorcza aktualizacja</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Data od</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    id="date-from"
                                    value="${this.filters.dateFrom}"
                                >
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Data do</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    id="date-to"
                                    value="${this.filters.dateTo}"
                                >
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-primary me-2" id="apply-filters">
                                    <i class="bi bi-funnel"></i> Filtruj
                                </button>
                                <button class="btn btn-outline-secondary" id="clear-filters">
                                    <i class="bi bi-x-circle"></i> Wyczyść
                                </button>
                            </div>
                        </div>

                        <!-- Details Date Filter -->
                        <div class="row g-3 mt-2">
                            <div class="col-12">
                                <h6 class="text-muted">Filtr daty dla kolumny "Szczegóły"</h6>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Data szczegółów od</label>
                                <input
                                    type="date"
                                    class="form-control"
                                    id="details-date-from"
                                    value="${this.filters.detailsDateFrom}"
                                >
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Data szczegółów do</label>
                                <input
                                    type="date"
                                    class="form-control"
                                    id="details-date-to"
                                    value="${this.filters.detailsDateTo}"
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Logs Table -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Data i czas</th>
                                        <th>Lektor</th>
                                        <th>Akcja</th>
                                        <th>Szczegóły</th>
                                        <th>Wykonane przez</th>
                                        <th>IP</th>
                                    </tr>
                                </thead>
                                <tbody id="logs-tbody">
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <div class="spinner-border" role="status">
                                                <span class="visually-hidden">Ładowanie...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <nav aria-label="Nawigacja po stronach" class="mt-4">
                            <ul class="pagination justify-content-center" id="pagination">
                                <!-- Pagination will be rendered here -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `
    }

    private attachEventListeners() {
        // Refresh button
        document.getElementById('refresh-logs')?.addEventListener('click', () => {
            this.loadData()
            this.loadStats()
        })

        // Apply filters
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            this.applyFilters()
        })

        // Clear filters
        document.getElementById('clear-filters')?.addEventListener('click', () => {
            this.clearFilters()
        })

        // Export CSV
        document.getElementById('export-csv')?.addEventListener('click', () => {
            this.exportToCSV()
        })

        // Check availability alert
        document.getElementById('check-availability-alert')?.addEventListener('click', () => {
            this.checkAvailabilityAlert()
        })

        // Enter key in search
        document.getElementById('search-input')?.addEventListener('keypress', (e) => {
            if ((e as KeyboardEvent).key === 'Enter') {
                this.applyFilters()
            }
        })
    }

    private applyFilters() {
        this.filters = {
            tutorId: '',
            action: (document.getElementById('action-filter') as HTMLSelectElement)?.value || '',
            dateFrom: (document.getElementById('date-from') as HTMLInputElement)?.value || '',
            dateTo: (document.getElementById('date-to') as HTMLInputElement)?.value || '',
            search: (document.getElementById('search-input') as HTMLInputElement)?.value || '',
            detailsDateFrom: (document.getElementById('details-date-from') as HTMLInputElement)?.value || '',
            detailsDateTo: (document.getElementById('details-date-to') as HTMLInputElement)?.value || ''
        }
        this.currentPage = 1
        this.loadData()
    }

    private clearFilters() {
        this.filters = {
            tutorId: '',
            action: '',
            dateFrom: '',
            dateTo: '',
            search: '',
            detailsDateFrom: '',
            detailsDateTo: ''
        }

        // Clear form inputs
        if (document.getElementById('search-input')) {
            (document.getElementById('search-input') as HTMLInputElement).value = ''
        }
        if (document.getElementById('action-filter')) {
            (document.getElementById('action-filter') as HTMLSelectElement).value = ''
        }
        if (document.getElementById('date-from')) {
            (document.getElementById('date-from') as HTMLInputElement).value = ''
        }
        if (document.getElementById('date-to')) {
            (document.getElementById('date-to') as HTMLInputElement).value = ''
        }
        if (document.getElementById('details-date-from')) {
            (document.getElementById('details-date-from') as HTMLInputElement).value = ''
        }
        if (document.getElementById('details-date-to')) {
            (document.getElementById('details-date-to') as HTMLInputElement).value = ''
        }

        this.currentPage = 1
        this.loadData()
    }

    private async loadData() {
        if (this.isLoading) {
            console.log('⏳ Already loading, skipping...')
            return
        }
        this.isLoading = true
        
        console.log('📊 Loading data:', { 
            page: this.currentPage, 
            filters: this.filters 
        })

        try {
            const params = new URLSearchParams({
                page: this.currentPage.toString(),
                per_page: '20'
            })

            // Add all filters to params
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value)
                }
            })

            const response = await api.get<any>(`/availability-logs?${params}`)
            
            console.log('📥 Response received:', { 
                success: (response as any)?.success,
                dataLength: (response as any)?.data?.length,
                meta: (response as any)?.meta
            })
            
            if (response && (response as any).success) {
                this.renderLogs((response as any).data)
                this.renderPagination((response as any).meta)
            }
        } catch (error) {
            console.error('Error loading availability logs:', error)
            this.showError('Nie udało się załadować logów dostępności')
        } finally {
            this.isLoading = false
        }
    }

    private async loadStats() {
        try {
            const response = await api.get<any>('/availability-logs/stats')
            
            if (response && (response as any).success && (response as any).data) {
                this.stats = (response as any).data
                this.renderStats()
            }
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

    private renderStats() {
        if (!this.stats) return

        const statsContainer = document.getElementById('stats-container')
        if (!statsContainer) return

        statsContainer.innerHTML = `
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">Wszystkie zmiany</h6>
                        <h3 class="card-title mb-0">${this.stats.total_changes || 0}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">Dzisiaj</h6>
                        <h3 class="card-title mb-0">${this.stats.changes_today || 0}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">Ten tydzień</h6>
                        <h3 class="card-title mb-0">${this.stats.changes_this_week || 0}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">Ten miesiąc</h6>
                        <h3 class="card-title mb-0">${this.stats.changes_this_month || 0}</h3>
                    </div>
                </div>
            </div>
        `

        // Render most active tutors if available
        if (this.stats.most_active_tutors && this.stats.most_active_tutors.length > 0) {
            const activeSection = document.createElement('div')
            activeSection.className = 'col-12 mt-3'
            activeSection.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-3">Najbardziej aktywni lektorzy</h6>
                        <div class="list-group list-group-flush">
                            ${this.stats.most_active_tutors.map((tutor: any) => `
                                <div class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span>${tutor.name}</span>
                                    <span class="badge bg-primary rounded-pill">${tutor.changes_count} zmian</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `
            statsContainer.appendChild(activeSection)
        }
    }

    private renderLogs(logs: any[]) {
        const tbody = document.getElementById('logs-tbody')
        if (!tbody) return

        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Brak logów do wyświetlenia
                    </td>
                </tr>
            `
            return
        }

        tbody.innerHTML = logs.map(log => {
            const actionBadgeClass = this.getActionBadgeClass(log.action)
            const slotsInfo = this.formatSlotsInfo(log)
            
            return `
                <tr>
                    <td>
                        <small>${log.created_at_formatted}</small>
                    </td>
                    <td>
                        <div>
                            <strong>${log.tutor.name}</strong><br>
                            <small class="text-muted">${log.tutor.email}</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${actionBadgeClass}">${log.action_label}</span>
                    </td>
                    <td>
                        <div>
                            ${log.description || ''}
                            ${log.date ? `<br><small class="text-muted">Data: ${log.date}</small>` : ''}
                            ${slotsInfo ? `<br><small class="text-muted">${slotsInfo}</small>` : ''}
                        </div>
                    </td>
                    <td>
                        ${log.changed_by ? `
                            <small>${log.changed_by.name}</small>
                        ` : '<small class="text-muted">Sam lektor</small>'}
                    </td>
                    <td>
                        <small class="text-muted">${log.ip_address || '-'}</small>
                    </td>
                </tr>
            `
        }).join('')
    }

    private formatSlotsInfo(log: any): string {
        const parts = []
        
        if (log.old_slots && log.old_slots.length > 0) {
            const slots = log.old_slots.map((s: any) => `${s.start_time}-${s.end_time}`).join(', ')
            parts.push(`Poprzednie: ${slots}`)
        }
        
        if (log.new_slots && log.new_slots.length > 0) {
            const slots = log.new_slots.map((s: any) => `${s.start_time}-${s.end_time}`).join(', ')
            parts.push(`Nowe: ${slots}`)
        }
        
        return parts.join(' → ')
    }

    private getActionBadgeClass(action: string): string {
        const classes: { [key: string]: string } = {
            'added': 'bg-success',
            'updated': 'bg-primary',
            'deleted': 'bg-danger',
            'bulk_update': 'bg-warning'
        }
        return classes[action] || 'bg-secondary'
    }

    private renderPagination(meta: any) {
        const pagination = document.getElementById('pagination')
        if (!pagination || !meta) return

        console.log('📄 Rendering pagination:', { 
            currentPage: meta.current_page, 
            totalPages: meta.last_page,
            thisCurrentPage: this.currentPage 
        })

        this.totalPages = meta.last_page || 1
        this.currentPage = meta.current_page || 1

        let pages = []
        const maxVisible = 5
        const halfVisible = Math.floor(maxVisible / 2)
        
        let startPage = Math.max(1, this.currentPage - halfVisible)
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1)
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1)
        }

        // Previous button
        pages.push(`
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" data-page="${this.currentPage - 1}">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `)

        // First page + ellipsis
        if (startPage > 1) {
            pages.push(`
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0)" data-page="1">1</a>
                </li>
            `)
            if (startPage > 2) {
                pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>')
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" data-page="${i}">${i}</a>
                </li>
            `)
        }

        // Last page + ellipsis
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>')
            }
            pages.push(`
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0)" data-page="${this.totalPages}">${this.totalPages}</a>
                </li>
            `)
        }

        // Next button
        pages.push(`
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" data-page="${this.currentPage + 1}">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `)

        pagination.innerHTML = pages.join('')

        // Attach page click handlers
        pagination.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                const page = parseInt((e.target as HTMLElement).closest('a')?.dataset.page || '1')
                console.log('🔍 Page clicked:', { 
                    page, 
                    currentPage: this.currentPage, 
                    totalPages: this.totalPages,
                    currentHash: window.location.hash,
                    currentSearch: window.location.search
                })
                if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
                    console.log('📍 Changing page from', this.currentPage, 'to', page)
                    this.currentPage = page
                    this.loadData()
                } else {
                    console.log('⚠️ Page click ignored:', { page, reason: 'invalid or same page' })
                }
            })
        })
    }

    private showError(message: string) {
        const tbody = document.getElementById('logs-tbody')
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="alert alert-danger mb-0">
                            <i class="bi bi-exclamation-triangle"></i> ${message}
                        </div>
                    </td>
                </tr>
            `
        }
    }

    private getMonthOptions(): string {
        const options = []
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() // 0-based

        // Generate months from January of current year to previous month
        for (let month = 0; month < currentMonth; month++) {
            const date = new Date(currentYear, month, 1)
            const value = `${currentYear}-${String(month + 1).padStart(2, '0')}`
            const label = date.toLocaleDateString('pl-PL', {
                month: 'long',
                year: 'numeric'
            })
            options.push(`<option value="${value}">${label}</option>`)
        }

        // Add months from previous year if current month is January
        if (currentMonth === 0) {
            for (let month = 0; month < 12; month++) {
                const date = new Date(currentYear - 1, month, 1)
                const value = `${currentYear - 1}-${String(month + 1).padStart(2, '0')}`
                const label = date.toLocaleDateString('pl-PL', {
                    month: 'long',
                    year: 'numeric'
                })
                options.unshift(`<option value="${value}">${label}</option>`)
            }
        }

        // Default to previous month
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        const defaultValue = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`

        // Mark default as selected
        return options.map(option =>
            option.includes(`value="${defaultValue}"`)
                ? option.replace('>', ' selected>')
                : option
        ).join('')
    }

    private async checkAvailabilityAlert() {
        const button = document.getElementById('check-availability-alert') as HTMLButtonElement
        const monthSelector = document.getElementById('month-selector') as HTMLSelectElement

        if (!button || !monthSelector) return

        const selectedMonth = monthSelector.value
        if (!selectedMonth) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Wybierz miesiąc do sprawdzenia'
                }
            }))
            return
        }

        // Show loading state
        const originalText = button.innerHTML
        button.innerHTML = '<i class="bi bi-hourglass-split"></i> Sprawdzanie...'
        button.disabled = true

        try {
            const response = await api.post('/admin/check-availability-alert', {
                month: selectedMonth
            })

            if (response && (response as any).success) {
                const data = (response as any).data
                const tutorCount = data?.tutorCount || 0

                if (tutorCount > 0) {
                    document.dispatchEvent(new CustomEvent('notification:show', {
                        detail: {
                            type: 'warning',
                            message: `Znaleziono ${tutorCount} lektorów z niewystarczającą dostępnością. Email został wysłany.`
                        }
                    }))
                } else {
                    document.dispatchEvent(new CustomEvent('notification:show', {
                        detail: {
                            type: 'success',
                            message: 'Wszyscy lektorzy mają wystarczającą dostępność w tym miesiącu.'
                        }
                    }))
                }
            } else {
                throw new Error('Niepowodzenie sprawdzania')
            }
        } catch (error) {
            console.error('Error checking availability alert:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się sprawdzić dostępności lektorów'
                }
            }))
        } finally {
            // Restore button state
            button.innerHTML = originalText
            button.disabled = false
        }
    }


    private async exportToCSV() {
        try {
            // Get current filter values from form inputs
            const currentFilters = {
                tutorId: '',
                action: (document.getElementById('action-filter') as HTMLSelectElement)?.value || '',
                dateFrom: (document.getElementById('date-from') as HTMLInputElement)?.value || '',
                dateTo: (document.getElementById('date-to') as HTMLInputElement)?.value || '',
                search: (document.getElementById('search-input') as HTMLInputElement)?.value || '',
                detailsDateFrom: (document.getElementById('details-date-from') as HTMLInputElement)?.value || '',
                detailsDateTo: (document.getElementById('details-date-to') as HTMLInputElement)?.value || ''
            }
            
            
            // Use service to export CSV with current filters
            const blob = await availabilityLogsService.exportToCSV(currentFilters)
            
            // Create download link
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `logi_dostepnosci_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            
            // Cleanup
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Eksport CSV został zakończony'
                }
            }))
        } catch (error) {
            console.error('Error exporting CSV:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się wyeksportować danych'
                }
            }))
        }
    }
}