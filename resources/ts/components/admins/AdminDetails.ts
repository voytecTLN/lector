// resources/ts/components/admins/AdminDetails.ts
import type { RouteComponent } from '@router/routes'
import { adminService } from '@services/AdminService'
import type { User } from '@/types/models'
import { navigate } from '@/utils/navigation'

export class AdminDetails implements RouteComponent {
    private container: HTMLElement | null = null
    private admin: User | null = null
    private adminId: number | null = null


    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'admin-details-page'

        // Get admin ID from URL params
        const urlParams = new URLSearchParams(window.location.search)
        const adminId = urlParams.get('admin_id')

        if (adminId) {
            this.adminId = parseInt(adminId, 10)
        }

        el.innerHTML = `
            <div class="container-fluid">
                <!-- Loading state -->
                <div id="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie...</span>
                    </div>
                    <p class="mt-2 text-muted">Ładowanie danych administratora...</p>
                </div>

                <!-- Error state -->
                <div id="error" class="d-none">
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Błąd!</h4>
                        <p class="mb-0">Nie udało się załadować danych administratora.</p>
                    </div>
                    <div class="text-center">
                        <a href="/admin/dashboard?section=administratorzy" class="btn btn-primary">
                            <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                        </a>
                    </div>
                </div>

                <!-- Main content -->
                <div id="content" class="d-none">
                    <!-- Header -->
                    <div class="row mb-4">
                        <div class="col">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <a href="/admin/dashboard?section=administratorzy" 
                                       class="text-muted text-decoration-none mb-2 d-inline-block">
                                        <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                                    </a>
                                    <h2 class="mb-1" id="admin-name">Administrator</h2>
                                    <p class="text-muted mb-0" id="admin-email"></p>
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-outline-primary" id="edit-admin-btn">
                                        <i class="bi bi-pencil me-1"></i> Edytuj
                                    </button>
                                    <div class="dropdown">
                                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" 
                                                data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots me-1"></i> Więcej
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li>
                                                <button class="dropdown-item" type="button" id="deactivate-admin-btn">
                                                    <i class="bi bi-pause-circle me-2"></i> Dezaktywuj
                                                </button>
                                            </li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li>
                                                <button class="dropdown-item text-danger" type="button" id="delete-admin-btn">
                                                    <i class="bi bi-trash me-2"></i> Usuń
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <!-- Main Info -->
                        <div class="col-lg-8">
                            <!-- Basic Information -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0">Informacje podstawowe</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Imię i nazwisko</label>
                                            <div class="fw-semibold" id="display-name"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Email</label>
                                            <div id="display-email"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Telefon</label>
                                            <div id="display-phone"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Data urodzenia</label>
                                            <div id="display-birth-date"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Miasto</label>
                                            <div id="display-city"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Status</label>
                                            <div id="display-status"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Activity Log -->
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Aktywność</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Utworzony</label>
                                            <div id="display-created-at"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Ostatnia aktualizacja</label>
                                            <div id="display-updated-at"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Ostatnie logowanie</label>
                                            <div id="display-last-login"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">IP ostatniego logowania</label>
                                            <div id="display-last-login-ip"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-muted">Email zweryfikowany</label>
                                            <div id="display-email-verified"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sidebar -->
                        <div class="col-lg-4">
                            <!-- Quick Actions -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Szybkie akcje</h6>
                                </div>
                                <div class="card-body">
                                    <div class="d-grid gap-2">
                                        <button type="button" class="btn btn-outline-primary btn-sm" id="quick-edit-btn">
                                            <i class="bi bi-pencil me-1"></i> Edytuj dane
                                        </button>
                                        <!--
                                        <button type="button" class="btn btn-outline-info btn-sm" id="reset-password-btn">
                                            <i class="bi bi-key me-1"></i> Resetuj hasło
                                        </button>
                                        -->
                                        <button type="button" class="btn btn-outline-warning btn-sm" id="quick-deactivate-btn">
                                            <i class="bi bi-pause-circle me-1"></i> Zmień status
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- System Info -->
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Informacje systemowe</h6>
                                </div>
                                <div class="card-body">
                                    <div class="small">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">ID:</span>
                                            <span id="display-id"></span>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">Rola:</span>
                                            <span class="badge bg-info">Administrator</span>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span class="text-muted">Uprawnienia:</span>
                                            <span class="badge bg-success">Pełne</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div class="modal fade" id="deleteAdminModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Usuń administratora</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Ta akcja jest nieodwracalna!
                            </div>
                            <p>Czy na pewno chcesz usunąć administratora <strong id="delete-admin-name"></strong>?</p>
                            <p class="text-muted small mb-0">
                                Administrator zostanie natychmiast usunięty z systemu i straci dostęp do panelu administracyjnego.
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
                            <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                                <i class="bi bi-trash me-1"></i> Usuń administratora
                            </button>
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

        if (this.adminId) {
            this.loadAdminData()
        } else {
            this.showError()
        }
    }

    unmount(): void {
        this.container = null
        this.admin = null
    }

    private setupEventListeners(): void {
        if (!this.container) return

        // Edit button
        const editBtn = this.container.querySelector('#edit-admin-btn')
        editBtn?.addEventListener('click', () => {
            if (this.adminId) {
                navigate.to(`/admin/dashboard?section=edytuj-administratora&admin_id=${this.adminId}`)
            }
        })

        // Quick edit button
        const quickEditBtn = this.container.querySelector('#quick-edit-btn')
        quickEditBtn?.addEventListener('click', () => {
            if (this.adminId) {
                navigate.to(`/admin/dashboard?section=edytuj-administratora&admin_id=${this.adminId}`)
            }
        })

        // Deactivate buttons
        const deactivateBtn = this.container.querySelector('#deactivate-admin-btn')
        const quickDeactivateBtn = this.container.querySelector('#quick-deactivate-btn')
        
        deactivateBtn?.addEventListener('click', () => this.handleDeactivate())
        quickDeactivateBtn?.addEventListener('click', () => this.handleDeactivate())

        // Delete button
        const deleteBtn = this.container.querySelector('#delete-admin-btn')
        deleteBtn?.addEventListener('click', () => this.showDeleteModal())

        // Confirm delete
        const confirmDeleteBtn = this.container.querySelector('#confirm-delete-btn')
        confirmDeleteBtn?.addEventListener('click', () => this.handleDelete())

        // Reset password button
        const resetPasswordBtn = this.container.querySelector('#reset-password-btn')
        resetPasswordBtn?.addEventListener('click', () => this.handleResetPassword())
    }

    private async loadAdminData(): Promise<void> {
        if (!this.adminId) return

        try {
            this.admin = await adminService.getAdminById(this.adminId)
            this.displayAdminData()
            this.showContent()
        } catch (error) {
            console.error('Failed to load admin:', error)
            this.showErrorState()
        }
    }

    private displayAdminData(): void {
        if (!this.admin || !this.container) return

        // Header
        this.setTextContent('#admin-name', this.admin.name)
        this.setTextContent('#admin-email', this.admin.email)

        // Basic info
        this.setTextContent('#display-name', this.admin.name)
        this.setTextContent('#display-email', this.admin.email)
        this.setTextContent('#display-phone', this.admin.phone || '-')
        this.setTextContent('#display-birth-date', this.formatDate(this.admin.birth_date) || '-')
        this.setTextContent('#display-city', this.admin.city || '-')
        this.setTextContent('#display-id', this.admin.id.toString())

        // Status
        const statusElement = this.container.querySelector('#display-status')
        if (statusElement) {
            statusElement.innerHTML = this.getStatusBadge(this.admin.status)
        }

        // Activity
        this.setTextContent('#display-created-at', this.formatDateTime(this.admin.created_at) || '-')
        this.setTextContent('#display-updated-at', this.formatDateTime(this.admin.updated_at) || '-')
        this.setTextContent('#display-last-login', this.formatDateTime(this.admin.last_login_at) || '-')
        this.setTextContent('#display-last-login-ip', this.admin.last_login_ip || '-')
        this.setTextContent('#display-email-verified', this.admin.email_verified_at ? 'Tak' : 'Nie')

        // Update delete modal
        if (this.admin.name) {
            this.setTextContent('#delete-admin-name', this.admin.name)
        }
    }

    private setTextContent(selector: string, content: string): void {
        const element = this.container?.querySelector(selector)
        if (element) {
            element.textContent = content
        }
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

    private formatDate(dateString: string | undefined): string | null {
        if (!dateString) return null
        
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date)
    }

    private formatDateTime(dateString: string | undefined): string | null {
        if (!dateString) return null
        
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    private async handleDeactivate(): Promise<void> {
        if (!this.adminId || !this.admin) return

        const newStatus = this.admin.status === 'active' ? 'inactive' : 'active'
        const action = newStatus === 'active' ? 'aktywować' : 'dezaktywować'

        if (confirm(`Czy na pewno chcesz ${action} tego administratora?`)) {
            try {
                if (newStatus === 'inactive') {
                    await adminService.deactivateAdmin(this.adminId)
                } else {
                    await adminService.updateAdmin(this.adminId, { status: newStatus })
                }

                this.showSuccess(`Administrator został ${newStatus === 'active' ? 'aktywowany' : 'dezaktywowany'}`)
                this.loadAdminData() // Refresh data
            } catch (error) {
                console.error('Failed to update admin status:', error)
                this.showError(`Nie udało się ${action} administratora`)
            }
        }
    }

    private showDeleteModal(): void {
        const modal = this.container?.querySelector('#deleteAdminModal')
        if (modal) {
            // @ts-ignore - Bootstrap modal
            new bootstrap.Modal(modal).show()
        }
    }

    private async handleDelete(): Promise<void> {
        if (!this.adminId) return

        try {
            await adminService.deleteAdmin(this.adminId)
            this.showSuccess('Administrator został usunięty')
            
            // Redirect to admin list
            navigate.to('/admin/dashboard?section=administratorzy')
        } catch (error) {
            console.error('Failed to delete admin:', error)
            this.showError('Nie udało się usunąć administratora')
        }
    }

    private handleResetPassword(): void {
        if (!this.admin) return
        
        // TODO: Implement password reset functionality
        this.showInfo('Funkcja resetowania hasła będzie dostępna wkrótce')
    }

    private showContent(): void {
        const loading = this.container?.querySelector('#loading')
        const error = this.container?.querySelector('#error')
        const content = this.container?.querySelector('#content')

        loading?.classList.add('d-none')
        error?.classList.add('d-none')
        content?.classList.remove('d-none')
    }

    private showErrorState(): void {
        const loading = this.container?.querySelector('#loading')
        const error = this.container?.querySelector('#error')
        const content = this.container?.querySelector('#content')

        loading?.classList.add('d-none')
        error?.classList.remove('d-none')
        content?.classList.add('d-none')
    }

    private showSuccess(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'success',
                message: message
            }
        }))
    }

    private showError(message: string = 'Wystąpił błąd'): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'error',
                message: message
            }
        }))
    }

    private showInfo(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: message
            }
        }))
    }
}