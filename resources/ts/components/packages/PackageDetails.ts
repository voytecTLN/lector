import type { RouteComponent } from '@router/routes'
import { PackageService } from '@services/PackageService'
import type { Package, PackageAssignment } from '@/types/models'
import { navigate } from '@/utils/navigation'

declare global {
    interface Window {
        bootstrap: any
        packageDetails?: PackageDetails
    }
}

export class PackageDetails implements RouteComponent {
    private packageService: PackageService
    private packageId: number = 0
    private package: Package | null = null
    private assignments: PackageAssignment[] = []
    private container: HTMLElement | null = null

    constructor() {
        this.packageService = new PackageService()
    }

    async render(): Promise<HTMLElement> {
        // Get package ID from URL params
        const urlParams = new URLSearchParams(window.location.search)
        this.packageId = parseInt(urlParams.get('package_id') || '0', 10)

        if (!this.packageId) {
            navigate.to('/admin/dashboard?section=pakiety')
            return document.createElement('div')
        }

        const el = document.createElement('div')
        el.className = 'package-details-page'
        el.innerHTML = `
            <div class="container mt-4">
                <div id="loading-state" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie...</span>
                    </div>
                    <p class="mt-2 text-muted">Ładowanie szczegółów pakietu...</p>
                </div>
                
                <div id="package-content" class="d-none">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 id="package-title">Szczegóły pakietu</h1>
                            <p class="text-muted">Informacje o pakiecie i przypisaniach</p>
                        </div>
                        <div class="d-flex gap-2">
                            <button id="edit-btn" class="btn btn-primary">
                                <i class="bi bi-pencil me-1"></i> Edytuj
                            </button>
                            <button id="back-btn" class="btn btn-outline-secondary">
                                <i class="bi bi-arrow-left me-1"></i> Powrót
                            </button>
                        </div>
                    </div>

                    <div class="row">
                        <!-- Package Info -->
                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">Informacje o pakiecie</h5>
                                </div>
                                <div class="card-body">
                                    <div id="package-info">
                                        <!-- Package details will be inserted here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Assignments -->
                        <div class="col-lg-8">
                            <div class="card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="card-title mb-0">Przypisania do studentów</h5>
                                    <button id="assign-btn" class="btn btn-sm btn-primary">
                                        <i class="bi bi-plus me-1"></i> Przypisz do studenta
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div id="assignments-container">
                                        <!-- Assignments will be inserted here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="error-state" class="d-none">
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Nie udało się załadować szczegółów pakietu
                    </div>
                </div>
            </div>
        `

        return el
    }

    private async loadPackageData(): Promise<void> {
        try {
            this.package = await this.packageService.getPackage(this.packageId)
            this.renderPackageInfo()
            this.renderAssignments()
            this.showContent()
        } catch (error) {
            console.error('Error loading package:', error)
            this.showError()
        }
    }

    private renderPackageInfo(): void {
        if (!this.package) return

        const container = this.container?.querySelector('#package-info')
        const title = this.container?.querySelector('#package-title')
        
        if (title) {
            title.textContent = this.package.name
        }

        if (container) {
            const colorIndicator = this.package.color 
                ? `<span class="badge me-2" style="background-color: ${this.package.color}">&nbsp;</span>`
                : ''

            container.innerHTML = `
                <div class="mb-3">
                    <label class="form-label text-muted">Nazwa</label>
                    <div class="d-flex align-items-center">
                        ${colorIndicator}
                        <span class="fw-bold">${this.package.name}</span>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label text-muted">Cena</label>
                    <div class="fs-4 fw-bold text-primary">${this.package.formatted_price || this.formatPrice(this.package.price)}</div>
                </div>
                
                <div class="row">
                    <div class="col-6">
                        <div class="mb-3">
                            <label class="form-label text-muted">Godziny</label>
                            <div class="fw-bold">${this.package.hours_count}h</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="mb-3">
                            <label class="form-label text-muted">Ważność</label>
                            <div class="fw-bold">${this.package.validity_days} dni</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label text-muted">Status</label>
                    <div>
                        <span class="badge ${this.package.is_active ? 'bg-success' : 'bg-secondary'}">
                            ${this.package.is_active ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                    </div>
                </div>
                
                ${this.package.description ? `
                    <div class="mb-3">
                        <label class="form-label text-muted">Opis</label>
                        <p class="mb-0">${this.package.description}</p>
                    </div>
                ` : ''}
                
                <div class="mb-3">
                    <label class="form-label text-muted">Utworzono</label>
                    <div class="small text-muted">
                        ${new Date(this.package.created_at).toLocaleDateString('pl-PL')}
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label text-muted">Ostatnia aktualizacja</label>
                    <div class="small text-muted">
                        ${new Date(this.package.updated_at).toLocaleDateString('pl-PL')}
                    </div>
                </div>
            `
        }
    }

    private async renderAssignments(): Promise<void> {
        if (!this.package) return

        const container = this.container?.querySelector('#assignments-container')
        if (!container) return

        try {
            // Load package assignments
            const response = await this.packageService.getPackage(this.packageId)
            const assignments = response.assignments || []

            if (assignments.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
                        <h6>Brak przypisań</h6>
                        <p class="text-muted mb-0">
                            Ten pakiet nie został jeszcze przypisany do żadnego studenta
                        </p>
                    </div>
                `
                return
            }

            const assignmentsHTML = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Przypisano</th>
                                <th>Wygasa</th>
                                <th>Pozostałe godziny</th>
                                <th>Status</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignments.map(assignment => this.renderAssignmentRow(assignment)).join('')}
                        </tbody>
                    </table>
                </div>
            `

            container.innerHTML = assignmentsHTML

        } catch (error) {
            console.error('Error loading assignments:', error)
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Nie udało się załadować przypisań pakietu
                </div>
            `
        }
    }

    private renderAssignmentRow(assignment: PackageAssignment): string {
        const assignedDate = new Date(assignment.assigned_at).toLocaleDateString('pl-PL')
        const expiresDate = new Date(assignment.expires_at).toLocaleDateString('pl-PL')
        
        let statusBadge = ''
        let statusClass = ''
        
        switch (assignment.status) {
            case 'active':
                statusBadge = 'Aktywny'
                statusClass = 'bg-success'
                break
            case 'expired':
                statusBadge = 'Wygasł'
                statusClass = 'bg-danger'
                break
            case 'exhausted':
                statusBadge = 'Wykorzystany'
                statusClass = 'bg-warning'
                break
            case 'inactive':
                statusBadge = 'Nieaktywny'
                statusClass = 'bg-secondary'
                break
            default:
                statusBadge = 'Nieznany'
                statusClass = 'bg-secondary'
        }

        return `
            <tr>
                <td>
                    <div>
                        <strong>${assignment.student?.name || 'Nieznany'}</strong>
                        <br>
                        <small class="text-muted">${assignment.student?.email || ''}</small>
                    </div>
                </td>
                <td>${assignedDate}</td>
                <td>${expiresDate}</td>
                <td>
                    <span class="fw-bold">${assignment.hours_remaining}h</span>
                    <small class="text-muted">/ ${this.package?.hours_count}h</small>
                </td>
                <td>
                    <span class="badge ${statusClass}">${statusBadge}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="packageDetails.viewStudentAssignment(${assignment.id})"
                            title="Zobacz szczegóły">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `
    }

    public async viewStudentAssignment(assignmentId: number): Promise<void> {
        try {
            // Get assignment details from the loaded package data
            const assignment = this.package?.assignments?.find(a => a.id === assignmentId)
            
            if (!assignment) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Nie znaleziono szczegółów przypisania'
                    }
                }))
                return
            }

            await this.showAssignmentDetails(assignment)
        } catch (error) {
            console.error('Error viewing assignment:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas ładowania szczegółów przypisania'
                }
            }))
        }
    }

    private async showAssignmentDetails(assignment: PackageAssignment): Promise<void> {
        const assignedDate = new Date(assignment.assigned_at).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        const expiresDate = new Date(assignment.expires_at).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const statusInfo = this.getAssignmentStatusInfo(assignment.status)
        const progressPercentage = this.calculateHoursProgress(assignment)

        const modalHTML = `
            <div class="modal fade" id="assignmentDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Szczegóły przypisania pakietu</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Informacje o studencie</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-2">
                                                <div class="avatar avatar-md me-3">
                                                    <span class="avatar-text rounded-circle bg-primary text-white">
                                                        ${this.getInitials(assignment.student?.name || 'N/A')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div class="fw-bold">${assignment.student?.name || 'N/A'}</div>
                                                    <div class="text-muted small">${assignment.student?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div class="row text-center">
                                                <div class="col-6">
                                                    <div class="text-muted small">Telefon</div>
                                                    <div class="fw-medium">${assignment.student?.phone || 'Brak'}</div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="text-muted small">Miasto</div>
                                                    <div class="fw-medium">${assignment.student?.city || 'Brak'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Informacje o pakiecie</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong>Nazwa:</strong> ${this.package?.name || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong>Całkowita liczba godzin:</strong> ${this.package?.hours_count || 0}h
                                            </div>
                                            <div class="mb-2">
                                                <strong>Ważność:</strong> ${this.package?.validity_days || 0} dni
                                            </div>
                                            <div class="mb-2">
                                                <strong>Cena:</strong> ${this.package?.formatted_price || this.formatPrice(this.package?.price || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Status przypisania</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-3">
                                            <div class="text-center">
                                                <span class="badge ${statusInfo.class} fs-6">${statusInfo.label}</span>
                                                <div class="text-muted small mt-1">Status</div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="text-center">
                                                <div class="h5 mb-0">${assignment.hours_remaining || 0}h</div>
                                                <div class="text-muted small">Pozostało godzin</div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="text-center">
                                                <div class="h5 mb-0">${assignment.days_remaining || 0}</div>
                                                <div class="text-muted small">Dni do wygaśnięcia</div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="text-center">
                                                <div class="h5 mb-0">${progressPercentage}%</div>
                                                <div class="text-muted small">Wykorzystano</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <label class="form-label">Postęp wykorzystania godzin</label>
                                        <div class="progress" style="height: 8px;">
                                            <div class="progress-bar ${progressPercentage >= 80 ? 'bg-warning' : 'bg-primary'}" 
                                                 role="progressbar" 
                                                 style="width: ${progressPercentage}%"
                                                 aria-valuenow="${progressPercentage}" 
                                                 aria-valuemin="0" 
                                                 aria-valuemax="100">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Szczegóły przypisania</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-2">
                                                <strong>Data przypisania:</strong> ${assignedDate}
                                            </div>
                                            <div class="mb-2">
                                                <strong>Data wygaśnięcia:</strong> ${expiresDate}
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-2">
                                                <strong>ID przypisania:</strong> #${assignment.id}
                                            </div>
                                            <div class="mb-2">
                                                <strong>Aktywne:</strong> ${assignment.is_active ? 'Tak' : 'Nie'}
                                            </div>
                                        </div>
                                    </div>
                                    ${assignment.notes ? `
                                        <div class="mt-3">
                                            <strong>Notatki:</strong>
                                            <div class="bg-light p-2 rounded mt-1">
                                                ${assignment.notes}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
                            <button type="button" class="btn btn-primary" id="viewStudentProfile">
                                <i class="bi bi-person me-1"></i> Zobacz profil studenta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Remove existing modal if present
        const existingModal = document.getElementById('assignmentDetailsModal')
        if (existingModal) {
            existingModal.remove()
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML)

        // Setup event listeners
        const viewProfileBtn = document.getElementById('viewStudentProfile')
        viewProfileBtn?.addEventListener('click', () => {
            const modal = window.bootstrap.Modal.getInstance(document.getElementById('assignmentDetailsModal'))
            modal?.hide()
            navigate.to(`/admin/dashboard?section=student-details&student_id=${assignment.student_id}`)
        })

        // Show modal
        const modal = new window.bootstrap.Modal(document.getElementById('assignmentDetailsModal'))
        modal.show()

        // Cleanup on modal close
        document.getElementById('assignmentDetailsModal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('assignmentDetailsModal')?.remove()
        })
    }

    private getAssignmentStatusInfo(status: string): { label: string; class: string } {
        switch (status) {
            case 'active':
                return { label: 'Aktywny', class: 'bg-success' }
            case 'expired':
                return { label: 'Wygasł', class: 'bg-danger' }
            case 'exhausted':
                return { label: 'Wykorzystany', class: 'bg-warning' }
            case 'inactive':
                return { label: 'Nieaktywny', class: 'bg-secondary' }
            default:
                return { label: 'Nieznany', class: 'bg-secondary' }
        }
    }

    private calculateHoursProgress(assignment: PackageAssignment): number {
        if (!this.package?.hours_count || !assignment.hours_remaining) {
            return 0
        }
        
        const usedHours = this.package.hours_count - assignment.hours_remaining
        const percentage = Math.round((usedHours / this.package.hours_count) * 100)
        return Math.max(0, Math.min(100, percentage))
    }

    private setupEventListeners(): void {
        const editBtn = this.container?.querySelector('#edit-btn')
        const backBtn = this.container?.querySelector('#back-btn')
        const assignBtn = this.container?.querySelector('#assign-btn')

        editBtn?.addEventListener('click', () => this.editPackage())
        backBtn?.addEventListener('click', () => navigate.to('/admin/dashboard?section=pakiety'))
        assignBtn?.addEventListener('click', () => this.assignToStudent())
    }

    private showContent(): void {
        const loadingState = this.container?.querySelector('#loading-state')
        const content = this.container?.querySelector('#package-content')
        const errorState = this.container?.querySelector('#error-state')

        loadingState?.classList.add('d-none')
        content?.classList.remove('d-none')
        errorState?.classList.add('d-none')
    }

    private showError(): void {
        const loadingState = this.container?.querySelector('#loading-state')
        const content = this.container?.querySelector('#package-content')
        const errorState = this.container?.querySelector('#error-state')

        loadingState?.classList.add('d-none')
        content?.classList.add('d-none')
        errorState?.classList.remove('d-none')
    }

    private editPackage(): void {
        navigate.to(`/admin/dashboard?section=edytuj-pakiet&package_id=${this.packageId}`)
    }

    private async assignToStudent(): Promise<void> {
        // Create and show modal for assigning package to student
        const modalHTML = `
            <div class="modal fade" id="assignPackageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Przypisz pakiet do studenta</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="assignPackageForm">
                                <div class="mb-3">
                                    <label for="studentSearch" class="form-label">Znajdź studenta *</label>
                                    <input type="text" class="form-control" id="studentSearch" 
                                           placeholder="Wpisz imię lub email studenta..." 
                                           autocomplete="off" required>
                                    <input type="hidden" id="selectedStudentId" name="student_id" value="">
                                    <div id="studentSearchResults" class="list-group mt-2 position-absolute w-100" style="z-index: 1050; max-height: 200px; overflow-y: auto;"></div>
                                    <div class="invalid-feedback" id="student_id-error"></div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="assignmentNotes" class="form-label">Notatki (opcjonalne)</label>
                                    <textarea class="form-control" id="assignmentNotes" name="notes" rows="3" 
                                        placeholder="Dodatkowe informacje o przypisaniu pakietu..."></textarea>
                                </div>
                                
                                <div class="alert alert-info">
                                    <strong>Pakiet:</strong> ${this.package?.name}<br>
                                    <strong>Godziny:</strong> ${this.package?.hours_count}h<br>
                                    <strong>Ważność:</strong> ${this.package?.validity_days} dni<br>
                                    <strong>Cena:</strong> ${this.package?.formatted_price || this.formatPrice(this.package?.price || 0)}
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
                            <button type="submit" form="assignPackageForm" class="btn btn-primary" id="assignBtn">
                                <span class="spinner-border spinner-border-sm me-2 d-none" id="assignSpinner"></span>
                                Przypisz pakiet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Add modal to page
        const modalDiv = document.createElement('div')
        modalDiv.innerHTML = modalHTML
        document.body.appendChild(modalDiv)

        // Setup search functionality
        this.setupStudentSearch()

        // Setup form submission
        const form = document.getElementById('assignPackageForm') as HTMLFormElement
        form?.addEventListener('submit', (e) => this.handlePackageAssignment(e))

        // Show modal
        const modal = new window.bootstrap.Modal(document.getElementById('assignPackageModal'))
        modal.show()

        // Cleanup modal on hide
        document.getElementById('assignPackageModal')?.addEventListener('hidden.bs.modal', () => {
            modalDiv.remove()
        })
    }

    private setupStudentSearch(): void {
        const searchInput = document.getElementById('studentSearch') as HTMLInputElement
        const resultsContainer = document.getElementById('studentSearchResults') as HTMLElement
        const selectedStudentId = document.getElementById('selectedStudentId') as HTMLInputElement
        
        let searchTimeout: number
        
        if (!searchInput || !resultsContainer || !selectedStudentId) return
        
        searchInput.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.trim()
            
            // Clear previous timeout
            if (searchTimeout) {
                window.clearTimeout(searchTimeout)
            }
            
            // Clear selection when typing
            selectedStudentId.value = ''
            
            if (query.length < 3) {
                resultsContainer.innerHTML = ''
                return
            }
            
            // Debounce search
            searchTimeout = window.setTimeout(() => {
                this.searchStudents(query)
            }, 300)
        })
        
        // Clear results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target as Node) && !resultsContainer.contains(e.target as Node)) {
                resultsContainer.innerHTML = ''
            }
        })
    }
    
    private async searchStudents(query: string): Promise<void> {
        const resultsContainer = document.getElementById('studentSearchResults') as HTMLElement
        
        if (!resultsContainer) return
        
        try {
            resultsContainer.innerHTML = '<div class="list-group-item text-muted">Wyszukiwanie...</div>'
            
            // Import StudentService dynamically
            const { StudentService } = await import('@services/StudentService')
            const studentService = new StudentService()
            
            const response = await studentService.getStudents({ 
                status: 'active', 
                search: query, 
                per_page: 10 
            })
            const students = response.data
            
            if (students.length === 0) {
                resultsContainer.innerHTML = '<div class="list-group-item text-muted">Brak wyników</div>'
                return
            }
            
            resultsContainer.innerHTML = students.map(student => `
                <button type="button" class="list-group-item list-group-item-action" 
                        data-student-id="${student.id}" 
                        data-student-name="${student.name}"
                        data-student-email="${student.email}">
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
                </button>
            `).join('')
            
            // Add click handlers to results
            resultsContainer.querySelectorAll('.list-group-item-action').forEach(item => {
                item.addEventListener('click', () => {
                    const studentId = item.getAttribute('data-student-id')
                    const studentName = item.getAttribute('data-student-name')
                    const studentEmail = item.getAttribute('data-student-email')
                    
                    if (studentId && studentName && studentEmail) {
                        this.selectStudent(studentId, studentName, studentEmail)
                    }
                })
            })
            
        } catch (error) {
            console.error('Error searching students:', error)
            resultsContainer.innerHTML = '<div class="list-group-item text-danger">Błąd wyszukiwania</div>'
        }
    }
    
    private selectStudent(studentId: string, studentName: string, studentEmail: string): void {
        const searchInput = document.getElementById('studentSearch') as HTMLInputElement
        const selectedStudentId = document.getElementById('selectedStudentId') as HTMLInputElement
        const resultsContainer = document.getElementById('studentSearchResults') as HTMLElement
        
        if (searchInput && selectedStudentId && resultsContainer) {
            searchInput.value = `${studentName} (${studentEmail})`
            selectedStudentId.value = studentId
            resultsContainer.innerHTML = ''
        }
    }
    
    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    private async handlePackageAssignment(e: Event): Promise<void> {
        e.preventDefault()
        
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)
        const assignBtn = document.getElementById('assignBtn') as HTMLButtonElement
        const spinner = document.getElementById('assignSpinner')

        // Clear previous errors
        this.clearAssignmentErrors()

        try {
            assignBtn.disabled = true
            spinner?.classList.remove('d-none')

            const studentId = formData.get('student_id') as string
            if (!studentId) {
                this.showAssignmentErrors({ 'student_id': ['Proszę wybrać studenta'] })
                assignBtn.disabled = false
                spinner?.classList.add('d-none')
                return
            }

            const assignmentData = {
                student_id: parseInt(studentId),
                package_id: this.packageId,
                notes: formData.get('notes') as string || undefined
            }

            await this.packageService.assignPackageToStudent(assignmentData)

            // Hide modal
            const modal = window.bootstrap.Modal.getInstance(document.getElementById('assignPackageModal'))
            modal?.hide()

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Pakiet został pomyślnie przypisany do studenta'
                }
            }))

            // Reload package data to show new assignment
            await this.loadPackageData()

        } catch (error: any) {
            console.error('Error assigning package:', error)
            
            if (error?.errors) {
                this.showAssignmentErrors(error.errors)
            } else {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Nie udało się przypisać pakietu. Spróbuj ponownie.'
                    }
                }))
            }
        } finally {
            assignBtn.disabled = false
            spinner?.classList.add('d-none')
        }
    }

    private clearAssignmentErrors(): void {
        const errorElements = document.querySelectorAll('.modal .invalid-feedback')
        errorElements.forEach(el => el.textContent = '')
        
        const inputElements = document.querySelectorAll('.modal .form-control, .modal .form-select')
        inputElements.forEach(el => el.classList.remove('is-invalid'))
    }

    private showAssignmentErrors(errors: Record<string, string[]>): void {
        for (const [field, messages] of Object.entries(errors)) {
            const input = document.querySelector(`.modal [name="${field}"]`) as HTMLElement
            const errorDiv = document.getElementById(`${field}-error`)
            
            if (input && errorDiv) {
                input.classList.add('is-invalid')
                errorDiv.textContent = messages[0]
            }
        }
    }

    async mount(container: HTMLElement): Promise<void> {
        window.packageDetails = this
        this.container = container
        await this.loadPackageData()
        this.setupEventListeners()
    }

    private formatPrice(priceInCents: number): string {
        const price = priceInCents / 100
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(price)
    }

    destroy(): void {
        // Cleanup if needed
    }
}