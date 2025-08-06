// resources/ts/components/forms/AdminProfileEdit.ts
import type { RouteComponent } from '@router/routes'
import { AdminService } from '@services/AdminService'
import type { UpdateAdminRequest, User } from '@/types/models'
import { navigate } from '@/utils/navigation'

export class AdminProfileEdit implements RouteComponent {
    private adminService: AdminService
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private admin: User | null = null
    private adminId: number | null = null

    constructor() {
        this.adminService = new AdminService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'admin-profile-edit-page'

        // Get admin ID from URL params
        const urlParams = new URLSearchParams(window.location.search)
        const adminId = urlParams.get('admin_id')

        if (adminId) {
            this.adminId = parseInt(adminId, 10)
        }

        el.innerHTML = `
            <div class="container mt-4">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <!-- Header -->
                        <div class="mb-4">
                            <a href="/admin/dashboard?section=admin-details&admin_id=${this.adminId}" 
                               class="text-muted text-decoration-none mb-2 d-inline-block">
                                <i class="bi bi-arrow-left me-1"></i> Powrót do profilu
                            </a>
                            <h1>Edytuj profil administratora</h1>
                            <p class="text-muted">Zaktualizuj podstawowe informacje o administratorze</p>
                        </div>

                        <!-- Loading state -->
                        <div id="form-loading" class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Ładowanie...</span>
                            </div>
                        </div>

                        <!-- Form -->
                        <form id="admin-profile-form" class="d-none">
                            ${this.generateFormHTML()}
                        </form>
                    </div>
                </div>
            </div>
        `

        return el
    }

    private handleValidationError(event: CustomEvent): void {
        const { errors } = event.detail

        // Reset previous errors
        this.form?.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid')
        })
        this.form?.querySelectorAll('.invalid-feedback').forEach(el => el.remove())

        // Display new errors
        for (const [field, messages] of Object.entries(errors)) {
            const input = this.form?.querySelector(`[name="${field}"]`)
            if (input) {
                input.classList.add('is-invalid')

                const feedback = document.createElement('div')
                feedback.className = 'invalid-feedback'
                feedback.textContent = Array.isArray(messages) ? messages[0] : String(messages)

                input.parentElement?.appendChild(feedback)
            }
        }
    }

    async mount(container: HTMLElement): Promise<void> {
        document.addEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)
        this.container = container
        this.form = container.querySelector('#admin-profile-form')

        if (this.adminId) {
            await this.loadAdminData()
        } else {
            this.showError('Nieprawidłowy identyfikator administratora')
        }
    }

    unmount(): void {
        document.removeEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)
        this.container = null
        this.form = null
        this.admin = null
    }

    private generateFormHTML(): string {
        return `
            <!-- Personal Information -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Dane osobowe</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Imię i nazwisko <span class="text-danger">*</span></label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email <span class="text-danger">*</span></label>
                            <input type="email" name="email" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Telefon</label>
                            <input type="tel" name="phone" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Data urodzenia</label>
                            <input type="date" name="birth_date" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Miasto</label>
                            <input type="text" name="city" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status</label>
                            <select name="status" class="form-select">
                                <option value="active">Aktywny</option>
                                <option value="inactive">Nieaktywny</option>
                                <option value="blocked">Zablokowany</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Security -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Bezpieczeństwo</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-1"></i>
                        Zostaw pola hasła puste, jeśli nie chcesz zmieniać hasła
                    </div>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nowe hasło</label>
                            <input type="password" name="password" class="form-control" minlength="8">
                            <div class="form-text">Minimum 8 znaków (opcjonalne)</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Potwierdź nowe hasło</label>
                            <input type="password" name="password_confirmation" class="form-control">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Account Information -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Informacje o koncie</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label text-muted">ID administratora</label>
                            <div class="form-control-plaintext" id="display-id"></div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-muted">Rola</label>
                            <div class="form-control-plaintext">
                                <span class="badge bg-info">Administrator</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-muted">Utworzony</label>
                            <div class="form-control-plaintext" id="display-created-at"></div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-muted">Ostatnie logowanie</label>
                            <div class="form-control-plaintext" id="display-last-login"></div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-muted">Email zweryfikowany</label>
                            <div class="form-control-plaintext" id="display-email-verified"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Access -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Dostęp do systemu</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-success">
                        <i class="bi bi-shield-check me-2"></i>
                        <strong>Uprawnienia administratora</strong> - Pełny dostęp do wszystkich funkcji systemu
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Zarządzanie:</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Użytkownicy</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Lektorzy</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Moderatorzy</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Pakiety</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>System:</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Ustawienia</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Raporty</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Logi</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Monitoring</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-between mb-5">
                <a href="/admin/dashboard?section=admin-details&admin_id=${this.adminId}" class="btn btn-outline-secondary">
                    <i class="bi bi-x-circle me-1"></i> Anuluj
                </a>
                <button type="submit" class="btn btn-primary" id="submit-button">
                    <i class="bi bi-check-circle me-1"></i> Zapisz zmiany
                </button>
            </div>

            <input type="hidden" name="admin_id" value="${this.adminId || ''}">
        `
    }

    private async loadAdminData(): Promise<void> {
        if (!this.adminId) return

        try {
            const loadingDiv = this.container?.querySelector('#form-loading')
            const form = this.container?.querySelector('#admin-profile-form')

            this.admin = await this.adminService.getAdminById(this.adminId)

            // Hide loading, show form
            loadingDiv?.classList.add('d-none')
            form?.classList.remove('d-none')

            this.fillFormWithAdminData(this.admin)
            this.setupForm()

        } catch (error) {
            console.error('Failed to load admin:', error)
            this.showError('Nie udało się załadować danych administratora')
        }
    }

    private fillFormWithAdminData(admin: User): void {
        if (!this.form) return

        // Basic fields
        const fields = ['name', 'email', 'phone', 'birth_date', 'city', 'status']
        fields.forEach(field => {
            const input = this.form!.querySelector(`[name="${field}"]`) as HTMLInputElement
            if (input && admin[field as keyof User]) {
                input.value = String(admin[field as keyof User])
            }
        })

        // Read-only information
        this.setTextContent('#display-id', admin.id.toString())
        this.setTextContent('#display-created-at', this.formatDateTime(admin.created_at) || '-')
        this.setTextContent('#display-last-login', this.formatDateTime(admin.last_login_at) || 'Nigdy')
        this.setTextContent('#display-email-verified', admin.email_verified_at ? 'Tak' : 'Nie')
    }

    private setTextContent(selector: string, content: string): void {
        const element = this.container?.querySelector(selector)
        if (element) {
            element.textContent = content
        }
    }

    private setupForm(): void {
        if (!this.form) return

        // Form submit
        this.form.addEventListener('submit', this.handleSubmit.bind(this))

        // Password validation
        const passwordInput = this.form.querySelector('[name="password"]') as HTMLInputElement
        const confirmInput = this.form.querySelector('[name="password_confirmation"]') as HTMLInputElement

        const validatePasswords = () => {
            if (passwordInput.value && !confirmInput.value) {
                confirmInput.setCustomValidity('Potwierdź hasło')
            } else if (passwordInput.value !== confirmInput.value) {
                confirmInput.setCustomValidity('Hasła muszą być identyczne')
            } else {
                confirmInput.setCustomValidity('')
            }
        }

        passwordInput?.addEventListener('input', validatePasswords)
        confirmInput?.addEventListener('input', validatePasswords)
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault()

        if (!this.form || !this.adminId) return

        const submitButton = this.form.querySelector('#submit-button') as HTMLButtonElement
        submitButton.disabled = true
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Zapisywanie...'

        try {
            const formData = new FormData(this.form)
            const adminData = this.parseFormData(formData)

            await this.adminService.updateAdmin(this.adminId, adminData as UpdateAdminRequest)
            
            this.showSuccess('Profil administratora został zaktualizowany')
            
            // Redirect back to details
            await navigate.to(`/admin/dashboard?section=admin-details&admin_id=${this.adminId}`)

        } catch (error: any) {
            console.error('Form submission error:', error)

            if (error.name !== 'ValidationError') {
                this.showError('Wystąpił błąd podczas zapisywania danych')
            }
        } finally {
            submitButton.disabled = false
            submitButton.innerHTML = '<i class="bi bi-check-circle me-1"></i> Zapisz zmiany'
        }
    }

    private parseFormData(formData: FormData): UpdateAdminRequest {
        const data: any = {}

        // Basic fields
        const fields = ['name', 'email', 'password', 'phone', 'birth_date', 'city', 'status']
        fields.forEach(field => {
            const value = formData.get(field)
            if (value !== null && value !== '') {
                data[field] = value
            }
        })

        // Handle password properly
        if (!data.password) {
            // If no password, remove both fields
            delete data.password
            delete data.password_confirmation
        } else {
            // If password exists, always add password_confirmation
            data.password_confirmation = formData.get('password_confirmation') || ''
        }

        return data
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

    private showSuccess(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'success',
                message: message
            }
        }))
    }

    private showError(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'error',
                message: message
            }
        }))
        
        // If critical error, redirect back
        navigate.to('/admin/dashboard?section=administratorzy')
    }
}