import type { RouteComponent } from '@router/routes'
import { PackageService } from '@services/PackageService'
import type { Package, PackageFilters, PaginatedResponse } from '@/types/models'
import { navigate, urlBuilder } from '@/utils/navigation'
import { LinkTemplates } from '@/components/common/Link'

declare global {
    interface Window {
        bootstrap: any
        packageList?: PackageList
    }
}

export class PackageList implements RouteComponent {
    private packageService: PackageService
    private packages: Package[] = []
    private filters: PackageFilters = {
        status: undefined,
        page: 1,
        per_page: 10
    }
    private pagination: PaginatedResponse<Package[]> | null = null
    private container: HTMLElement | null = null

    constructor() {
        this.packageService = new PackageService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'packages-page'
        el.innerHTML = `
            <div class="container mt-4">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1>Zarządzanie Pakietami</h1>
                        <p class="text-muted">Lista wszystkich pakietów w systemie</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button id="add-package-btn" class="btn btn-primary">
                            <i class="bi bi-plus-circle me-1"></i> Dodaj pakiet
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Status</label>
                                <select id="status-filter" class="form-select">
                                    <option value="">Wszystkie</option>
                                    <option value="active">Aktywne</option>
                                    <option value="inactive">Nieaktywne</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Minimalna cena</label>
                                <input type="number" id="min-price-filter" class="form-control" placeholder="0" step="0.01">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Maksymalna cena</label>
                                <input type="number" id="max-price-filter" class="form-control" placeholder="1000" step="0.01">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Wyszukaj</label>
                                <input type="text" id="search-filter" class="form-control" placeholder="Nazwa pakietu...">
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <button id="apply-filters-btn" class="btn btn-primary me-2">
                                    <i class="bi bi-funnel me-1"></i> Zastosuj filtry
                                </button>
                                <button id="reset-filters-btn" class="btn btn-outline-secondary">
                                    <i class="bi bi-arrow-clockwise me-1"></i> Resetuj
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Packages Table -->
                <div class="card">
                    <div class="card-body">
                        <div id="packages-table-container">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Ładowanie...</span>
                                </div>
                                <p class="mt-2 text-muted">Ładowanie pakietów...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div id="pagination-container" class="d-flex justify-content-center mt-4">
                    <!-- Pagination will be inserted here -->
                </div>
            </div>
        `

        return el
    }

    private async loadPackages(): Promise<void> {
        try {
            const response = await this.packageService.getPackages(this.filters)
            this.packages = response.data || []
            this.pagination = response
            this.renderPackagesTable()
            this.renderPagination()
        } catch (error) {
            console.error('Error loading packages:', error)
            this.packages = []
            this.renderError('Nie udało się załadować pakietów')
        }
    }

    private renderPackagesTable(): void {
        const container = this.container?.querySelector('#packages-table-container')
        if (!container) return

        if (this.packages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
                    <h5>Brak pakietów</h5>
                    <p class="text-muted">Nie znaleziono pakietów spełniających kryteria wyszukiwania</p>
                </div>
            `
            return
        }

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nazwa</th>
                            <th>Cena</th>
                            <th>Godziny</th>
                            <th>Ważność (dni)</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.packages.map(pkg => this.renderPackageRow(pkg)).join('')}
                    </tbody>
                </table>
            </div>
        `

        container.innerHTML = tableHTML
    }

    private renderPackageRow(pkg: Package): string {
        const statusBadge = pkg.is_active 
            ? '<span class="badge bg-success">Aktywny</span>'
            : '<span class="badge bg-secondary">Nieaktywny</span>'
        
        const colorIndicator = pkg.color 
            ? `<span class="badge" style="background-color: ${pkg.color}">&nbsp;</span>`
            : ''

        return `
            <tr>
                <td>${pkg.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        ${colorIndicator}
                        <span class="ms-2">${pkg.name}</span>
                    </div>
                </td>
                <td>${pkg.formatted_price || this.formatPrice(pkg.price)}</td>
                <td>${pkg.hours_count}h</td>
                <td>${pkg.validity_days}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="packageList.viewPackage(${pkg.id})" title="Wyświetl">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm" onclick="packageList.editPackage(${pkg.id})" title="Edytuj">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="packageList.deletePackage(${pkg.id})" title="Usuń">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
    }

    private renderPagination(): void {
        const container = this.container?.querySelector('#pagination-container')
        if (!container || !this.pagination) return

        if (this.pagination.last_page <= 1) {
            container.innerHTML = ''
            return
        }

        const currentPage = this.pagination.current_page
        const lastPage = this.pagination.last_page

        let paginationHTML = '<nav><ul class="pagination">'

        // Previous button
        if (currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="packageList.goToPage(${currentPage - 1})">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                </li>
            `
        }

        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(lastPage, currentPage + 2); i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="packageList.goToPage(${i})">${i}</button>
                </li>
            `
        }

        // Next button
        if (currentPage < lastPage) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="packageList.goToPage(${currentPage + 1})">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
            `
        }

        paginationHTML += '</ul></nav>'
        container.innerHTML = paginationHTML
    }

    private renderError(message: string): void {
        const container = this.container?.querySelector('#packages-table-container')
        if (!container) return

        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `
    }

    private setupEventListeners(): void {
        // Add package button
        const addBtn = this.container?.querySelector('#add-package-btn')
        addBtn?.addEventListener('click', () => this.addPackage())

        // Filter buttons
        const applyFiltersBtn = this.container?.querySelector('#apply-filters-btn')
        applyFiltersBtn?.addEventListener('click', () => this.applyFilters())

        const resetFiltersBtn = this.container?.querySelector('#reset-filters-btn')
        resetFiltersBtn?.addEventListener('click', () => this.resetFilters())

        // Search input enter key
        const searchInput = this.container?.querySelector('#search-filter') as HTMLInputElement
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters()
            }
        })

        // Store reference for global access
        window.packageList = this
    }

    private applyFilters(): void {
        const statusFilter = (this.container?.querySelector('#status-filter') as HTMLSelectElement)?.value
        const minPriceFilter = (this.container?.querySelector('#min-price-filter') as HTMLInputElement)?.value
        const maxPriceFilter = (this.container?.querySelector('#max-price-filter') as HTMLInputElement)?.value
        const searchFilter = (this.container?.querySelector('#search-filter') as HTMLInputElement)?.value

        this.filters = {
            status: (statusFilter && (statusFilter === 'active' || statusFilter === 'inactive')) ? statusFilter : undefined,
            min_price: minPriceFilter ? parseFloat(minPriceFilter) : undefined,
            max_price: maxPriceFilter ? parseFloat(maxPriceFilter) : undefined,
            search: searchFilter || undefined,
            page: 1,
            per_page: this.filters.per_page
        }

        this.loadPackages()
    }

    private resetFilters(): void {
        this.filters = {
            status: undefined,
            page: 1,
            per_page: 10
        }

        // Reset form inputs
        const statusFilter = this.container?.querySelector('#status-filter') as HTMLSelectElement
        const minPriceFilter = this.container?.querySelector('#min-price-filter') as HTMLInputElement
        const maxPriceFilter = this.container?.querySelector('#max-price-filter') as HTMLInputElement
        const searchFilter = this.container?.querySelector('#search-filter') as HTMLInputElement

        if (statusFilter) statusFilter.value = ''
        if (minPriceFilter) minPriceFilter.value = ''
        if (maxPriceFilter) maxPriceFilter.value = ''
        if (searchFilter) searchFilter.value = ''

        this.loadPackages()
    }

    // Public methods for button clicks
    public goToPage(page: number): void {
        this.filters.page = page
        this.loadPackages()
    }

    public addPackage(): void {
        navigate.to('/admin/dashboard?section=dodaj-pakiet')
    }

    public viewPackage(id: number): void {
        navigate.to(`/admin/dashboard?section=package-details&package_id=${id}`)
    }

    public editPackage(id: number): void {
        navigate.to(`/admin/dashboard?section=edytuj-pakiet&package_id=${id}`)
    }

    public async deletePackage(id: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz usunąć ten pakiet?')) {
            return
        }

        try {
            await this.packageService.deletePackage(id)
            await this.loadPackages()
        } catch (error) {
            console.error('Error deleting package:', error)
            alert('Nie udało się usunąć pakietu')
        }
    }

    async mount(container: HTMLElement): Promise<void> {
        window.packageList = this
        this.container = container
        this.setupEventListeners()
        await this.loadPackages()
    }

    private formatPrice(priceInCents: number): string {
        const price = priceInCents / 100
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(price)
    }

    destroy(): void {
        if (window.packageList === this) {
            window.packageList = undefined
        }
    }
}