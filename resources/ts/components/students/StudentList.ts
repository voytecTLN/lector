// resources/ts/components/students/StudentList.ts
import { StudentService, HourPackage } from '@services/StudentService'
import type { StudentFilters, User, PaginatedResponse, StudentProfile } from '@/types/models'

export class StudentList {
    private studentService: StudentService
    private students: (User & { hour_package: HourPackage })[] = []
    private filters: StudentFilters = {
        status: 'active',
        page: 1,
        per_page: 10
    }
    private pagination: PaginatedResponse<(User & { hour_package: HourPackage })[]> | null = null
    private tableElement: HTMLElement | null = null
    private paginationElement: HTMLElement | null = null
    private filterForm: HTMLFormElement | null = null

    constructor() {
        this.studentService = new StudentService()
        this.init()
    }

    private async init(): Promise<void> {
        this.tableElement = document.querySelector('.student-table')
        this.paginationElement = document.querySelector('.pagination-container')
        this.filterForm = document.querySelector('#student-filters')

        if (this.filterForm) {
            this.filterForm.addEventListener('submit', this.handleFilterSubmit.bind(this))

            // Reset filters
            const resetButton = this.filterForm.querySelector('.reset-filters')
            if (resetButton) {
                resetButton.addEventListener('click', this.resetFilters.bind(this))
            }
        }

        // Handle pagination clicks
        if (this.paginationElement) {
            this.paginationElement.addEventListener('click', this.handlePaginationClick.bind(this))
        }

        // Load initial data
        await this.loadStudents()
    }

    private async loadStudents(): Promise<void> {
        try {
            // Show loading state
            if (this.tableElement) {
                this.tableElement.classList.add('loading')
                this.tableElement.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Ładowanie...</span></div></td></tr>'
            }

            this.pagination = await this.studentService.getStudents(this.filters)
            this.students = this.pagination.data

            this.renderStudents()
            this.renderPagination()
        } catch (error) {
            console.error('Failed to load students:', error)
            if (this.tableElement) {
                this.tableElement.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Wystąpił błąd podczas ładowania danych</td></tr>'
            }
        } finally {
            if (this.tableElement) {
                this.tableElement.classList.remove('loading')
            }
        }
    }

    private renderStudents(): void {
        if (!this.tableElement) return

        if (this.students.length === 0) {
            this.tableElement.innerHTML = '<tr><td colspan="6" class="text-center py-4">Brak studentów spełniających kryteria</td></tr>'
            return
        }

        const rows = this.students.map(student => {
            const profileUrl = `/panel/students/${student.id}`
            const packageInfo = student.hour_package
                ? `<span class="badge bg-primary">${student.hour_package.remaining_hours}h / ${student.hour_package.hours}h</span>`
                : '<span class="badge bg-secondary">Brak pakietu</span>'

            return `
                <tr>
                    <td>
                        <a href="${profileUrl}" class="d-flex align-items-center">
                            <div class="avatar avatar-sm me-2">
                                <span class="avatar-text rounded-circle">${this.getInitials(student.name)}</span>
                            </div>
                            <div>
                                <span class="fw-medium">${student.name}</span>
                                <div class="small text-muted">${student.email}</div>
                            </div>
                        </a>
                    </td>
                    <td>${student.phone || '-'}</td>
                    <td>${packageInfo}</td>
                    <td>
                        <span class="badge ${this.getStatusBadgeClass(student.status || 'inactive')}">
                            ${this.getStatusLabel(student.status || 'inactive')}
                        </span>
                    </td>
                    <td>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="${profileUrl}">Profil studenta</a></li>
                                <li><a class="dropdown-item" href="${profileUrl}/schedule">Harmonogram zajęć</a></li>
                                <li><a class="dropdown-item" href="${profileUrl}/payments">Płatności</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `
        }).join('')

        this.tableElement.innerHTML = rows
    }

    private renderPagination(): void {
        if (!this.paginationElement || !this.pagination) return

        const { current_page, last_page } = this.pagination

        if (last_page <= 1) {
            this.paginationElement.innerHTML = ''
            return
        }

        let paginationHtml = `
            <nav>
                <ul class="pagination">
                    <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${current_page - 1}" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
        `

        for (let i = 1; i <= last_page; i++) {
            if (
                i === 1 ||
                i === last_page ||
                (i >= current_page - 1 && i <= current_page + 1)
            ) {
                paginationHtml += `
                    <li class="page-item ${i === current_page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `
            } else if (
                i === current_page - 2 ||
                i === current_page + 2
            ) {
                paginationHtml += `
                    <li class="page-item disabled">
                        <a class="page-link" href="#">...</a>
                    </li>
                `
            }
        }

        paginationHtml += `
                    <li class="page-item ${current_page === last_page ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${current_page + 1}" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        `

        this.paginationElement.innerHTML = paginationHtml
    }

    private handlePaginationClick(event: MouseEvent): void {
        event.preventDefault()
        const target = event.target as HTMLElement
        const pageLink = target.closest('.page-link') as HTMLAnchorElement

        if (!pageLink) return

        const page = pageLink.dataset.page
        if (!page) return

        this.filters.page = parseInt(page, 10)
        this.loadStudents()
    }

    private handleFilterSubmit(event: Event): void {
        event.preventDefault()

        if (!this.filterForm) return

        const formData = new FormData(this.filterForm)

        // Reset pagination to first page when applying filters
        this.filters.page = 1

        // Update filters from form data
        formData.forEach((value, key) => {
            if (typeof value === 'string' && this.isValidFilterKey(key)) {
                // Type-safe way to update the filter
                this.filters = {
                    ...this.filters,
                    [key]: value
                }
            }
        })

        this.loadStudents()
    }

    private resetFilters(event: Event): void {
        event.preventDefault()

        // Reset to default filters
        this.filters = {
            status: 'active',
            page: 1,
            per_page: 10
        }

        // Reset form inputs
        if (this.filterForm) {
            this.filterForm.reset()

            // Set the status select back to 'active'
            const statusSelect = this.filterForm.querySelector('select[name="status"]') as HTMLSelectElement
            if (statusSelect) {
                statusSelect.value = 'active'
            }
        }

        this.loadStudents()
    }

    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2)
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

    // Helper method to check if a key is a valid filter key
    private isValidFilterKey(key: string): key is keyof StudentFilters {
        return ['status', 'city', 'learning_language', 'search', 'per_page', 'page'].includes(key);
    }

    // Add this method for handling UI translations
    private getTranslation(key: string, lang: string): string {
        const translations: Record<string, Record<string, string>> = {
            'status.active': {
                pl: 'Aktywny',
                en: 'Active'
            },
            'status.inactive': {
                pl: 'Nieaktywny',
                en: 'Inactive'
            },
            'status.blocked': {
                pl: 'Zablokowany',
                en: 'Blocked'
            }
        }

        return translations[key]?.[lang] || key
    }
}