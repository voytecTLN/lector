// resources/ts/components/students/StudentList.ts
import type { RouteComponent } from '@router/routes'
import { StudentService, HourPackage } from '@services/StudentService'
import type { StudentFilters, User, PaginatedResponse, StudentProfile } from '@/types/models'
import { navigate, urlBuilder } from '@/utils/navigation'
import { LinkTemplates } from '@/components/common/Link'

declare global {
    interface Window {
        bootstrap: any
        studentList: StudentList
    }
}

export class StudentList implements RouteComponent {
    private studentService: StudentService
    private students: (User & { hour_package: HourPackage })[] = []
    private filters: StudentFilters = {
        status: undefined,
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
                        <button id="import-students-btn" class="btn btn-primary">
                            <i class="bi bi-upload me-1"></i> Import CSV
                        </button>
                        <button id="add-student-btn" class="btn btn-primary">
                            <i class="bi bi-plus-circle me-1"></i> Dodaj studenta
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <form id="student-filters" class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select">
                                    <option value="" selected>Wszystkie</option>
                                    <option value="active">Aktywni</option>
                                    <option value="inactive">Nieaktywni</option>
                                    <option value="blocked">Zablokowani</option>
                                    <option value="unverified">Niezweryfikowani</option>
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
        this.initializeDropdowns()
    }

    unmount(): void {
        this.container = null
        this.students = []
        this.pagination = null
    }

    private initializeDropdowns(): void {
        // Inicjalizuj wszystkie dropdowns na stronie
        const dropdownElementList = this.container?.querySelectorAll('[data-bs-toggle="dropdown"]')
        if (dropdownElementList && window.bootstrap) {
            dropdownElementList.forEach(dropdownEl => {
                new window.bootstrap.Dropdown(dropdownEl)
            })
        }
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
            navigate.to('/admin/dashboard?section=import-csv')
        })

        // Add student button
        const addBtn = this.container?.querySelector('#add-student-btn')
        addBtn?.addEventListener('click', () => {
            navigate.to('/admin/dashboard?section=dodaj-studenta')
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
        } catch (error: any) {
            console.error('Failed to load students:', error)
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            })
            
            const tableBody = this.container?.querySelector('.student-table')
            if (tableBody) {
                let errorMessage = 'Wystąpił błąd podczas ładowania danych'
                
                // Provide more specific error messages
                if (error.message?.includes('403')) {
                    errorMessage = 'Brak uprawnień do przeglądania listy studentów'
                } else if (error.message?.includes('404')) {
                    errorMessage = 'Endpoint nie został znaleziony'
                } else if (error.message?.includes('500')) {
                    errorMessage = 'Błąd serwera - spróbuj ponownie później'
                }
                
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${errorMessage}</td></tr>`
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
            const profileUrl = `/admin/dashboard?section=student-details&student_id=${student.id}`

            // Package badge - use activePackageAssignments instead of hour_package
            const packageBadge = this.getPackageBadgeFromAssignments(student.active_package_assignments || [])

            // Status badge
            const actualStatus = this.getActualStatus(student)
            const statusBadge = `<span class="badge ${this.getStatusBadgeClass(actualStatus)}">${this.getStatusLabel(actualStatus)}</span>`

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
                        <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="dropdown-item" href="${profileUrl}">
                                    <i class="bi bi-eye me-2"></i>Zobacz profil
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="/admin/dashboard?section=edytuj-studenta&student_id=${student.id}">
                                    <i class="bi bi-pencil me-2"></i>Edytuj
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-warning" href="#" onclick="event.preventDefault(); window.studentList.changeStatus(${student.id}, '${student.status || 'active'}')">
                                    <i class="bi bi-toggle-on me-2"></i>Zmień status
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="event.preventDefault(); window.studentList.deleteStudent(${student.id}, '${student.name}')">
                                    <i class="bi bi-trash me-2"></i>Usuń
                                </a>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>
        `
        }).join('')  // Ważne - join() zamienia tablicę na string

        tableBody.innerHTML = rows  // Teraz rows jest stringiem

        this.initializeDropdowns()
        this.setupActionListeners()

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

    private setupActionListeners(): void {
        const statusButtons = this.container?.querySelectorAll('[data-action="change-status"]')
        statusButtons?.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault()
                const studentId = parseInt(button.getAttribute('data-student-id') || '0')

                if (studentId) {
                    // Znajdź aktualny status z tablicy students
                    const student = this.students.find(s => s.id === studentId)
                    const currentStatus = student?.status || 'active'

                    console.log('Found student:', student)
                    console.log('Current status from data:', currentStatus)

                    await this.changeStudentStatus(studentId, currentStatus)
                }
            })
        })


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
            status: undefined,
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

    private handlePaginationClick(event: Event): void {
        const target = event.target as HTMLElement
        const pageLink = target.closest('.page-link') as HTMLAnchorElement

        if (!pageLink) return

        event.preventDefault()
        event.stopPropagation()

        const pageItem = pageLink.closest('.page-item')
        if (pageItem?.classList.contains('disabled')) return

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

    private getPackageBadgeFromAssignments(assignments: any[]): string {
        if (!assignments || assignments.length === 0) {
            return '<span class="badge bg-secondary">Brak pakietu</span>'
        }

        // Find the most relevant active assignment
        const activeAssignment = assignments.find(a => a.status === 'active') || assignments[0]
        
        if (!activeAssignment) {
            return '<span class="badge bg-secondary">Brak pakietu</span>'
        }

        const statusClass = this.getPackageStatusClass(activeAssignment.status)
        const packageName = activeAssignment.package?.name || 'Nieznany pakiet'
        const hoursRemaining = activeAssignment.hours_remaining || 0
        
        return `<span class="badge ${statusClass}" title="${hoursRemaining}h pozostało">${packageName}</span>`
    }

    private getPackageStatusClass(status: string): string {
        switch (status) {
            case 'active':
                return 'bg-success'
            case 'expired':
                return 'bg-danger'
            case 'exhausted':
                return 'bg-warning'
            case 'inactive':
                return 'bg-secondary'
            default:
                return 'bg-secondary'
        }
    }

    // Keep old method for backward compatibility if needed
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
            blocked: 'bg-danger',
            unverified: 'bg-info'
        }
        return statusClasses[status] || 'bg-secondary'
    }

    private getStatusLabel(status: string): string {
        const statusLabels: Record<string, string> = {
            active: 'Aktywny',
            inactive: 'Nieaktywny',
            blocked: 'Zablokowany',
            unverified: 'Niezweryfikowany'
        }
        return statusLabels[status] || 'Nieznany'
    }

    private getActualStatus(student: User & { hour_package: HourPackage }): string {
        // Status inactive/blocked is more important than unverified
        // todo - zalogować statusy do konsoli i debug
        if (student.status === 'inactive' || student.status === 'blocked') {
            return student.status
        }
        if (!student.email_verified_at) {
            return 'unverified'
        }
        return student.status || 'active'
    }

    private isValidFilterKey(key: string): key is keyof StudentFilters {
        return ['status', 'city', 'learning_language', 'search', 'per_page', 'page'].includes(key)
    }

    private async changeStudentStatus(studentId: number, currentStatus: string): Promise<void> {
        const statuses = [
            { value: 'active', label: 'Aktywny', class: 'success' },
            { value: 'inactive', label: 'Nieaktywny', class: 'warning' },
            { value: 'blocked', label: 'Zablokowany', class: 'danger' },
            { value: 'unverified', label: 'Niezweryfikowany', class: 'info' }
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
                if (this.isValidStatus(newStatus)) {
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
                }

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

    public async deleteStudent(studentId: number, studentName: string): Promise<void> {
        // Modal potwierdzenia - aktualnie deaktywacja
        const modalHtml = `
        <div class="modal fade" id="deactivateStudentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Dezaktywacja studenta</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Czy na pewno chcesz dezaktywować studenta?</p>
                        <p class="fw-bold">${studentName}</p>
                        <p class="text-muted small">Student zostanie oznaczony jako nieaktywny, ale jego dane pozostaną w systemie.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
                        <button type="button" class="btn btn-warning" id="confirmDeactivate">
                            <i class="bi bi-person-slash me-1"></i> Dezaktywuj
                        </button>
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
        const modal = new (window as any).bootstrap.Modal(document.getElementById('deleteStudentModal'))
        modal.show()

        // Obsługa przycisku potwierdzenia
        const confirmBtn = document.getElementById('confirmDelete')
        confirmBtn?.addEventListener('click', async () => {
            try {
                // Zablokuj przycisk podczas usuwania
                confirmBtn.setAttribute('disabled', 'true')
                confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Usuwanie...'

                // Wywołaj API
                await this.studentService.deleteStudent(studentId)

                // Zamknij modal
                modal.hide()

                // Pokaż sukces
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: `Student ${studentName} został usunięty`
                    }
                }))

                // Odśwież listę
                await this.loadStudents()
                await this.loadStats() // Odśwież też statystyki

            } catch (error) {
                console.error('Failed to delete student:', error)

                // Pokaż błąd
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Nie udało się usunąć studenta. Spróbuj ponownie.'
                    }
                }))

                // Odblokuj przycisk
                confirmBtn.removeAttribute('disabled')
                confirmBtn.innerHTML = '<i class="bi bi-trash me-1"></i> Usuń studenta'
            }
        })

        // Cleanup po zamknięciu modala
        document.getElementById('deleteStudentModal')?.addEventListener('hidden.bs.modal', () => {
            modalDiv.remove()
        })
    }

    private isValidStatus(status: string): status is 'active' | 'inactive' | 'blocked' | 'unverified' {
        return ['active', 'inactive', 'blocked', 'unverified'].includes(status);
    }


    public changeStatus(studentId: number, currentStatus: string): void {
        console.log('=== changeStatus Debug ===')
        console.log('studentId:', studentId)
        console.log('currentStatus:', currentStatus)
        console.log('window.bootstrap exists:', !!window.bootstrap)
        console.log('this.studentService exists:', !!this.studentService)
        this.changeStudentStatus(studentId, currentStatus)
    }
}