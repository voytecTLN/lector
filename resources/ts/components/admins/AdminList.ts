// resources/ts/components/admins/AdminList.ts
import type { RouteComponent } from '@router/routes'
import { adminService } from '@services/AdminService'
import type { User, PaginatedResponse, AdminFilters } from '@/types/models'
import { navigate } from '@/utils/navigation'

export class AdminList implements RouteComponent {
    private container: HTMLElement | null = null
    private admins: User[] = []
    private currentPage: number = 1
    private totalPages: number = 1
    private isLoading: boolean = false
    private searchTimeout: number | null = null
    private filters: AdminFilters = {
        search: '',
        status: undefined,
        city: '',
        page: 1,
        per_page: 15
    }


    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'admin-list-page'
        el.innerHTML = `
            <div class="container-fluid">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 class="mb-1">Zarządzanie Administratorami</h2>
                        <p class="text-muted mb-0">Lista wszystkich administratorów w systemie</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-primary" id="add-admin-btn">
                            <i class="bi bi-plus-circle me-1"></i> Dodaj Administratora
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <form id="admin-filters" class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="status-filter">
                                    <option value="">Wszystkie</option>
                                    <option value="active">Aktywni</option>
                                    <option value="inactive">Nieaktywni</option>
                                    <option value="blocked">Zablokowani</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Miasto</label>
                                <input type="text" class="form-control" id="city-input" placeholder="np. Warszawa">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Na stronie</label>
                                <select class="form-select" id="per-page-select">
                                    <option value="15">15</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Szukaj</label>
                                <input type="text" class="form-control" id="search-input" 
                                       placeholder="Imię, nazwisko lub email">
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-funnel me-1"></i> Filtruj
                                </button>
                                <button type="button" class="btn btn-outline-secondary reset-filters ms-2" id="clear-filters-btn">
                                    <i class="bi bi-x-circle me-1"></i> Resetuj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="row mb-4" id="stats-cards">
                    <div class="col-md-3">
                        <div class="card border-primary">
                            <div class="card-body text-center">
                                <div class="display-6 text-primary" id="total-admins">0</div>
                                <small class="text-muted">Łącznie administratorów</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-success">
                            <div class="card-body text-center">
                                <div class="display-6 text-success" id="active-admins">0</div>
                                <small class="text-muted">Aktywni</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-warning">
                            <div class="card-body text-center">
                                <div class="display-6 text-warning" id="inactive-admins">0</div>
                                <small class="text-muted">Nieaktywni</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-info">
                            <div class="card-body text-center">
                                <div class="display-6 text-info" id="new-admins">0</div>
                                <small class="text-muted">Nowi (miesiąc)</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div class="card">
                    <div class="card-body">
                        <!-- Loading -->
                        <div id="loading" class="text-center py-4 d-none">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Ładowanie...</span>
                            </div>
                            <p class="mt-2 text-muted">Ładowanie administratorów...</p>
                        </div>

                        <!-- Table -->
                        <div id="admins-table-container">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Imię i nazwisko</th>
                                            <th>Email</th>
                                            <th>Telefon</th>
                                            <th>Status</th>
                                            <th>Utworzony</th>
                                            <th>Ostatnie logowanie</th>
                                            <th class="text-end">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admins-table-body">
                                        <!-- Admins will be populated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Pagination -->
                        <div id="pagination-container" class="d-flex justify-content-between align-items-center mt-4">
                            <div class="text-muted" id="pagination-info">
                                Wyświetlanie 0-0 z 0 administratorów
                            </div>
                            <nav aria-label="Nawigacja administratorów">
                                <ul class="pagination mb-0" id="pagination">
                                    <!-- Pagination will be populated here -->
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        `
        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.setupEventListeners()
        this.loadAdmins()
        this.loadStats()
    }

    unmount(): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout)
        }
        this.container = null
    }

    private setupEventListeners(): void {
        if (!this.container) return

        // Form submission for filters
        const filtersForm = this.container.querySelector('#admin-filters') as HTMLFormElement
        filtersForm?.addEventListener('submit', (e) => {
            e.preventDefault()
            this.applyFilters()
        })

        // Search input with debounce
        const searchInput = this.container.querySelector('#search-input') as HTMLInputElement
        searchInput?.addEventListener('input', (e) => {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout)
            }
            this.searchTimeout = window.setTimeout(() => {
                this.filters.search = (e.target as HTMLInputElement).value
                this.filters.page = 1
                this.loadAdmins()
            }, 500)
        })

        // Clear filters
        const clearFiltersBtn = this.container.querySelector('#clear-filters-btn')
        clearFiltersBtn?.addEventListener('click', () => {
            this.clearFilters()
        })

        // Add admin button
        const addAdminBtn = this.container.querySelector('#add-admin-btn')
        addAdminBtn?.addEventListener('click', () => {
            navigate.to('/admin/dashboard?section=dodaj-administratora')
        })

        // Event delegation for action buttons and pagination
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            const button = target.closest('button')
            
            if (!button) return

            // Handle action buttons
            const action = button.getAttribute('data-action')
            const adminId = button.getAttribute('data-admin-id')
            
            if (action && adminId) {
                e.preventDefault()
                this.handleAction(action, parseInt(adminId))
                return
            }

            // Handle pagination
            const page = button.getAttribute('data-page')
            if (page) {
                e.preventDefault()
                this.goToPage(parseInt(page))
                return
            }
        })
    }

    private async loadAdmins(): Promise<void> {
        if (this.isLoading) return

        this.isLoading = true
        this.showLoading(true)

        try {
            const response = await adminService.getAdmins(this.filters)
            this.admins = response.data
            this.currentPage = response.current_page
            this.totalPages = response.last_page

            this.renderAdminsTable()
            this.renderPagination(response)

        } catch (error) {
            console.error('Failed to load admins:', error)
            this.showError('Nie udało się załadować listy administratorów')
        } finally {
            this.isLoading = false
            this.showLoading(false)
        }
    }

    private async loadStats(): Promise<void> {
        try {
            const stats = await adminService.getAdminStats()
            this.updateStatsCards(stats)
        } catch (error) {
            console.error('Failed to load admin stats:', error)
        }
    }

    private updateStatsCards(stats: any): void {
        const updateStat = (id: string, value: number) => {
            const el = this.container?.querySelector(`#${id}`)
            if (el) el.textContent = value.toString()
        }

        updateStat('total-admins', stats.total || 0)
        updateStat('active-admins', stats.active || 0)
        updateStat('inactive-admins', stats.inactive || 0)
        updateStat('new-admins', stats.new_this_month || 0)
    }

    private renderAdminsTable(): void {
        const tbody = this.container?.querySelector('#admins-table-body')
        if (!tbody) return

        if (this.admins.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-inbox display-4 d-block mb-2"></i>
                        Brak administratorów do wyświetlenia
                    </td>
                </tr>
            `
            return
        }

        tbody.innerHTML = this.admins.map(admin => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="admin-avatar me-2">
                            ${admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-semibold">${admin.name}</div>
                        </div>
                    </div>
                </td>
                <td>${admin.email}</td>
                <td>${admin.phone || '-'}</td>
                <td>${this.getStatusBadge(admin.status)}</td>
                <td>${this.formatDate(admin.created_at)}</td>
                <td>${admin.last_login_at ? this.formatDate(admin.last_login_at) : '-'}</td>
                <td class="text-end">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" 
                                data-action="view" data-admin-id="${admin.id}"
                                title="Zobacz szczegóły">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" 
                                data-action="edit" data-admin-id="${admin.id}"
                                title="Edytuj">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('')
    }

    private getStatusBadge(status: string | undefined): string {
        switch (status) {
            case 'active':
                return '<span class="badge bg-success">Aktywny</span>'
            case 'inactive':
                return '<span class="badge bg-warning">Nieaktywny</span>'
            case 'blocked':
                return '<span class="badge bg-danger">Zablokowany</span>'
            default:
                return '<span class="badge bg-secondary">Nieznany</span>'
        }
    }

    private renderPagination(response: PaginatedResponse<User[]>): void {
        const paginationInfo = this.container?.querySelector('#pagination-info')
        const pagination = this.container?.querySelector('#pagination')

        if (!paginationInfo || !pagination) return

        const start = ((response.current_page - 1) * response.per_page) + 1
        const end = Math.min(start + response.per_page - 1, response.total)

        paginationInfo.textContent = `Wyświetlanie ${start}-${end} z ${response.total} administratorów`

        if (response.last_page <= 1) {
            pagination.innerHTML = ''
            return
        }

        let paginationHTML = ''

        // Previous button
        if (response.current_page > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="${response.current_page - 1}">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                </li>
            `
        }

        // Page numbers
        const startPage = Math.max(1, response.current_page - 2)
        const endPage = Math.min(response.last_page, response.current_page + 2)

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="1">1</button>
                </li>
            `
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>'
            }
        }

        for (let page = startPage; page <= endPage; page++) {
            paginationHTML += `
                <li class="page-item ${page === response.current_page ? 'active' : ''}">
                    <button class="page-link" data-page="${page}">${page}</button>
                </li>
            `
        }

        if (endPage < response.last_page) {
            if (endPage < response.last_page - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>'
            }
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="${response.last_page}">${response.last_page}</button>
                </li>
            `
        }

        // Next button
        if (response.current_page < response.last_page) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="${response.current_page + 1}">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
            `
        }

        pagination.innerHTML = paginationHTML
    }

    private showLoading(show: boolean): void {
        const loading = this.container?.querySelector('#loading')
        const tableContainer = this.container?.querySelector('#admins-table-container')

        if (show) {
            loading?.classList.remove('d-none')
            tableContainer?.classList.add('d-none')
        } else {
            loading?.classList.add('d-none')
            tableContainer?.classList.remove('d-none')
        }
    }

    private showError(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'error',
                message: message
            }
        }))
    }

    private applyFilters(): void {
        const form = this.container?.querySelector('#admin-filters') as HTMLFormElement
        if (!form) return

        const formData = new FormData(form)
        
        // Get values from form
        const statusValue = (this.container?.querySelector('#status-filter') as HTMLSelectElement)?.value
        const cityValue = (this.container?.querySelector('#city-input') as HTMLInputElement)?.value
        const searchValue = (this.container?.querySelector('#search-input') as HTMLInputElement)?.value
        const perPageValue = (this.container?.querySelector('#per-page-select') as HTMLSelectElement)?.value

        // Update filters
        this.filters.status = statusValue === '' ? undefined : statusValue as 'active' | 'inactive' | 'blocked'
        this.filters.city = cityValue || ''
        this.filters.search = searchValue || ''
        this.filters.per_page = parseInt(perPageValue) || 15
        this.filters.page = 1

        this.loadAdmins()
    }

    private clearFilters(): void {
        this.filters = {
            search: '',
            status: undefined,
            city: '',
            page: 1,
            per_page: 15
        }

        // Reset form elements
        const searchInput = this.container?.querySelector('#search-input') as HTMLInputElement
        const statusFilter = this.container?.querySelector('#status-filter') as HTMLSelectElement
        const cityInput = this.container?.querySelector('#city-input') as HTMLInputElement
        const perPageSelect = this.container?.querySelector('#per-page-select') as HTMLSelectElement

        if (searchInput) searchInput.value = ''
        if (statusFilter) statusFilter.value = ''
        if (cityInput) cityInput.value = ''
        if (perPageSelect) perPageSelect.value = '15'

        this.loadAdmins()
    }

    private formatDate(dateString: string | undefined): string {
        if (!dateString) return '-'
        
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    private handleAction(action: string, adminId: number): void {
        switch (action) {
            case 'view':
                navigate.to(`/admin/dashboard?section=admin-details&admin_id=${adminId}`)
                break
            case 'edit':
                navigate.to(`/admin/dashboard?section=edytuj-administratora&admin_id=${adminId}`)
                break
        }
    }

    private goToPage(page: number): void {
        this.filters.page = page
        this.loadAdmins()
    }

    // Static instance for global access (kept for compatibility)
    static instance: AdminList | null = null
}