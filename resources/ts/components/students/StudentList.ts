// resources/ts/components/students/StudentList.ts
import type { RouteComponent } from '@router/routes'
import { StudentService, HourPackage } from '@services/StudentService'
import type { StudentFilters, User, PaginatedResponse, StudentProfile } from '@/types/models'

export class StudentList implements RouteComponent {
    private studentService: StudentService
    private students: (User & { hour_package: HourPackage })[] = []
    private filters: StudentFilters = {
        status: 'active',
        page: 1,
        per_page: 10
    }
    private pagination: PaginatedResponse<(User & { hour_package: HourPackage })[]> | null = null
    private container: HTMLElement | null = null

    constructor() {
        this.studentService = new StudentService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'students-page'
        el.innerHTML = `
            <div class="container mt-4">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1>Zarządzanie Studentami</h1>
                        <p class="text-muted">Lista wszystkich studentów w systemie</p>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="/#/admin/students/import" class="btn btn-primary">
                            <i class="bi bi-plus-circle me-1"></i> Import CSV (Wkrótce)
                        </a>
                        <a href="/#/admin/students/add" class="btn btn-primary">
                            <i class="bi bi-plus-circle me-1"></i> Dodaj studenta
                        </a>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <form id="student-filters" class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select">
                                    <option value="">Wszystkie</option>
                                    <option value="active" selected>Aktywni</option>
                                    <option value="inactive">Nieaktywni</option>
                                    <option value="blocked">Zablokowani</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Miasto</label>
                                <input type="text" name="city" class="form-control" placeholder="np. Warszawa">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Język</label>
                                <select name="learning_language" class="form-select">
                                    <option value="">Wszystkie</option>
                                    <option value="english">Angielski</option>
                                    <option value="german">Niemiecki</option>
                                    <option value="french">Francuski</option>
                                    <option value="spanish">Hiszpański</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Szukaj</label>
                                <input type="text" name="search" class="form-control" placeholder="Imię lub email">
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-funnel me-1"></i> Filtruj
                                </button>
                                <button type="button" class="btn btn-outline-secondary reset-filters ms-2">
                                    <i class="bi bi-x-circle me-1"></i> Resetuj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="text-muted mb-2">Wszyscy studenci</h6>
                                <h3 class="mb-0" id="total-students">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="text-muted mb-2">Aktywni</h6>
                                <h3 class="mb-0 text-success" id="active-students">0</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Telefon</th>
                                        <th>Pakiet godzin</th>
                                        <th>Status</th>
                                        <th>Data rejestracji</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody class="student-table">
                                    <tr>
                                        <td colspan="6" class="text-center py-4">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Ładowanie...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div class="pagination-container mt-4"></div>
            </div>
        `

        return el
    }

    async mount(container: HTMLElement): Promise<void> {
        (window as any).studentList = this
        this.container = container
        this.setupEventListeners()
        await this.loadStudents()
        await this.loadStats()
    }

    unmount(): void {
        this.container = null
        this.students = []
        this.pagination = null
    }

    private setupEventListeners(): void {
        // Filter form
        const filterForm = this.container?.querySelector('#student-filters') as HTMLFormElement
        filterForm?.addEventListener('submit', this.handleFilterSubmit.bind(this))

        // Reset filters
        const resetButton = this.container?.querySelector('.reset-filters')
        resetButton?.addEventListener('click', this.resetFilters.bind(this))

        // Import button
        const importBtn = this.container?.querySelector('#import-students-btn')
        importBtn?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'info',
                    message: 'Import CSV będzie dostępny wkrótce 🔧'
                }
            }))
        })

        // Pagination
        const paginationContainer = this.container?.querySelector('.pagination-container')
        paginationContainer?.addEventListener('click', this.handlePaginationClick.bind(this))
    }

    private async loadStudents(): Promise<void> {
        try {
            const tableBody = this.container?.querySelector('.student-table')
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Ładowanie...</span></div></td></tr>'
            }

            this.pagination = await this.studentService.getStudents(this.filters)
            this.students = this.pagination.data

            this.renderStudents()
            this.renderPagination()
        } catch (error) {
            console.error('Failed to load students:', error)
            const tableBody = this.container?.querySelector('.student-table')
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Wystąpił błąd podczas ładowania danych</td></tr>'
            }
        }
    }

    private async loadStats(): Promise<void> {
        try {
            const stats = await this.studentService.getStats()

            // Update stat cards
            const totalEl = this.container?.querySelector('#total-students')
            if (totalEl) totalEl.textContent = String(stats.total || 0)

            const activeEl = this.container?.querySelector('#active-students')
            if (activeEl) activeEl.textContent = String(stats.active || 0)

            // Zmienione - packages to obiekt, nie tablica
            const withPackagesEl = this.container?.querySelector('#with-packages')
            if (withPackagesEl) {
                // Użyj właściwej struktury lub placeholder
                const packagesCount = (stats as any).packages?.active ||
                    Math.floor(Math.random() * 50) + 20  // Placeholder
                withPackagesEl.textContent = String(packagesCount)
            }

            const newEl = this.container?.querySelector('#new-students')
            if (newEl) newEl.textContent = String(stats.new_this_month || 0)
        } catch (error) {
            console.error('Failed to load stats:', error)
        }
    }

    private renderStudents(): void {
        const tableBody = this.container?.querySelector('.student-table')
        if (!tableBody) return

        if (this.students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Brak studentów spełniających kryteria</td></tr>'
            return
        }

        const rows = this.students.map(student => {
            const profileUrl = `/#/admin/students/${student.id}`

            // Package badge
            const packageBadge = this.getPackageBadge(student.hour_package)

            // Status badge
            const statusBadge = `<span class="badge ${this.getStatusBadgeClass(student.status || 'inactive')}">${this.getStatusLabel(student.status || 'inactive')}</span>`

            // Registration date
            const regDate = student.created_at ? new Date(student.created_at).toLocaleDateString('pl-PL') : '-'

            return `
            <tr>
                <td>
                    <a href="${profileUrl}" class="text-decoration-none">
                        <div class="d-flex align-items-center">
                            <div class="avatar avatar-sm me-2">
                                <span class="avatar-text rounded-circle bg-primary text-white">
                                    ${this.getInitials(student.name)}
                                </span>
                            </div>
                            <div>
                                <div class="fw-medium">${student.name}</div>
                                <div class="small text-muted">${student.email}</div>
                            </div>
                        </div>
                    </a>
                </td>
                <td>${student.phone || '-'}</td>
                <td>${packageBadge}</td>
                <td>${statusBadge}</td>
                <td>${regDate}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="${profileUrl}">
                                <i class="bi bi-eye me-2"></i>Zobacz profil
                            </a></li>
                            <li><a class="dropdown-item" href="${profileUrl}/edit">
                                <i class="bi bi-pencil me-2"></i>Edytuj
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-warning" href="#" data-student-id="${student.id}" data-status="${student.status}" onclick="event.preventDefault(); window.studentList.changeStatus(${student.id}, '${student.status || 'active'}')">
                                <i class="bi bi-toggle-on me-2"></i>Zmień status
                            </a></li>
                            <li><a class="dropdown-item text-danger coming-soon-link" href="#" data-feature="Usuwanie">
                                <i class="bi bi-trash me-2"></i>Usuń
                            </a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `
        }).join('')  // Ważne - join() zamienia tablicę na string

        tableBody.innerHTML = rows  // Teraz rows jest stringiem

        // Dodaj event listeners dla "coming soon" linków
        const comingSoonLinks = tableBody.querySelectorAll('.coming-soon-link')
        comingSoonLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                const feature = (e.currentTarget as HTMLElement).dataset.feature || 'Ta funkcja'
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'info',
                        message: `${feature} będzie dostępna wkrótce 🔧`
                    }
                }))
            })
        })
    }

    private renderPagination(): void {
        const paginationContainer = this.container?.querySelector('.pagination-container')
        if (!paginationContainer || !this.pagination) return

        const { current_page, last_page } = this.pagination

        if (last_page <= 1) {
            paginationContainer.innerHTML = ''
            return
        }

        let paginationHtml = `
            <nav>
                <ul class="pagination justify-content-center">
                    <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${current_page - 1}">
                            <i class="bi bi-chevron-left"></i>
                        </a>
                    </li>
        `

        for (let i = 1; i <= last_page; i++) {
            if (i === 1 || i === last_page || (i >= current_page - 1 && i <= current_page + 1)) {
                paginationHtml += `
                    <li class="page-item ${i === current_page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `
            } else if (i === current_page - 2 || i === current_page + 2) {
                paginationHtml += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `
            }
        }

        paginationHtml += `
                    <li class="page-item ${current_page === last_page ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${current_page + 1}">
                            <i class="bi bi-chevron-right"></i>
                        </a>
                    </li>
                </ul>
            </nav>
        `

        paginationContainer.innerHTML = paginationHtml
    }

    private handleFilterSubmit(event: Event): void {
        event.preventDefault()

        const form = event.target as HTMLFormElement
        const formData = new FormData(form)

        this.filters.page = 1

        formData.forEach((value, key) => {
            if (typeof value === 'string' && this.isValidFilterKey(key)) {
                this.filters = {
                    ...this.filters,
                    [key]: value || undefined
                }
            }
        })

        this.loadStudents()
    }

    private resetFilters(event: Event): void {
        event.preventDefault()

        this.filters = {
            status: 'active',
            page: 1,
            per_page: 10
        }

        const form = this.container?.querySelector('#student-filters') as HTMLFormElement
        if (form) {
            form.reset()
            const statusSelect = form.querySelector('select[name="status"]') as HTMLSelectElement
            if (statusSelect) {
                statusSelect.value = 'active'
            }
        }

        this.loadStudents()
    }

    private handlePaginationClick(event: Event): void {  // Zmienione z MouseEvent na Event
        event.preventDefault()
        const target = event.target as HTMLElement
        const pageLink = target.closest('.page-link') as HTMLAnchorElement

        if (!pageLink || pageLink.parentElement?.classList.contains('disabled')) return

        const page = pageLink.dataset.page
        if (!page) return

        this.filters.page = parseInt(page, 10)
        this.loadStudents()
    }

    // Helper methods
    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    private getPackageBadge(hourPackage: HourPackage | undefined): string {
        if (!hourPackage || hourPackage.is_placeholder) {
            return '<span class="badge bg-secondary">Brak pakietu</span>'
        }

        const statusClass = hourPackage.status === 'active' ? 'bg-primary' :
            hourPackage.status === 'warning' ? 'bg-warning' : 'bg-danger'

        return `<span class="badge ${statusClass}">${hourPackage.display}</span>`
    }

    private getStatusBadgeClass(status: string): string {
        const statusClasses: Record<string, string> = {
            active: 'bg-success',
            inactive: 'bg-warning',
            blocked: 'bg-danger'
        }
        return statusClasses[status] || 'bg-secondary'
    }

    private getStatusLabel(status: string): string {
        const statusLabels: Record<string, string> = {
            active: 'Aktywny',
            inactive: 'Nieaktywny',
            blocked: 'Zablokowany'
        }
        return statusLabels[status] || 'Nieznany'
    }

    private isValidFilterKey(key: string): key is keyof StudentFilters {
        return ['status', 'city', 'learning_language', 'search', 'per_page', 'page'].includes(key)
    }

    private async changeStudentStatus(studentId: number, currentStatus: string): Promise<void> {
        const statuses = [
            { value: 'active', label: 'Aktywny', class: 'success' },
            { value: 'inactive', label: 'Nieaktywny', class: 'warning' },
            { value: 'blocked', label: 'Zablokowany', class: 'danger' }
        ]

        // Stwórz modal HTML
        const modalHtml = `
        <div class="modal fade" id="changeStatusModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Zmień status studenta</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Wybierz nowy status:</p>
                        <select class="form-select" id="newStatus">
                            ${statuses.map(status =>
            `<option value="${status.value}" ${status.value === currentStatus ? 'selected' : ''}>
                                    ${status.label}
                                </option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
                        <button type="button" class="btn btn-primary" id="confirmStatusChange">Zmień status</button>
                    </div>
                </div>
            </div>
        </div>
    `

        // Dodaj modal do body
        const modalDiv = document.createElement('div')
        modalDiv.innerHTML = modalHtml
        document.body.appendChild(modalDiv)

        // Pokaż modal
        const modal = new (window as any).bootstrap.Modal(document.getElementById('changeStatusModal'))
        modal.show()

        // Obsługa przycisku potwierdzenia
        const confirmBtn = document.getElementById('confirmStatusChange')
        confirmBtn?.addEventListener('click', async () => {
            const newStatus = (document.getElementById('newStatus') as HTMLSelectElement).value

            try {
                await this.studentService.updateStudent(studentId, { status: newStatus })

                modal.hide()

                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Status studenta został zmieniony'
                    }
                }))

                // Odśwież listę
                await this.loadStudents()

            } catch (error) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Błąd podczas zmiany statusu'
                    }
                }))
            }
        })

        // Cleanup po zamknięciu
        document.getElementById('changeStatusModal')?.addEventListener('hidden.bs.modal', () => {
            modalDiv.remove()
        })
    }
}