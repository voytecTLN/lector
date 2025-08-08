// resources/ts/components/forms/AdminForm.ts
import type { RouteComponent } from '@router/routes'
import { adminService } from '@services/AdminService'
import type { CreateAdminRequest, UpdateAdminRequest, User } from '@/types/models'
import { navigate } from '@/utils/navigation'
import { FormValidationHandler } from '@/utils/FormValidationHandler'
import { NotificationService } from '@/utils/NotificationService'
import { PasswordValidator } from '@/utils/PasswordValidator'
import { FormDataParser } from '@/utils/FormDataParser'
import { LoadingStateManager } from '@/utils/LoadingStateManager'

export class AdminForm implements RouteComponent {
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private isEditMode: boolean = false
    private adminId: number | null = null
    private admin: User | null = null
    private validationHandler: FormValidationHandler | null = null
    private passwordValidator: PasswordValidator | null = null
    private loadingManager: LoadingStateManager | null = null


    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'admin-form-page'

        // Determine if edit mode from URL params
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section')
        const adminId = urlParams.get('admin_id')

        if (section === 'edytuj-administratora' && adminId) {
            this.isEditMode = true
            this.adminId = parseInt(adminId, 10)
        }

        el.innerHTML = `
            <div class="container mt-4">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <!-- Header -->
                        <div class="mb-4">
                            <a href="/admin/dashboard?section=administratorzy" class="text-muted text-decoration-none mb-2 d-inline-block">
                                <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                            </a>
                            <h1>${this.isEditMode ? 'Edytuj administratora' : 'Dodaj nowego administratora'}</h1>
                        </div>

                        <!-- Loading state -->
                        <div id="form-loading" class="text-center py-5 ${!this.isEditMode ? 'd-none' : ''}">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Ładowanie...</span>
                            </div>
                        </div>

                        <!-- Form -->
                        <form id="admin-form" class="${this.isEditMode ? 'd-none' : ''}">
                            ${this.generateFormHTML()}
                        </form>
                    </div>
                </div>
            </div>
        `

        return el
    }


    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        this.form = container.querySelector('#admin-form')

        // Initialize utilities
        if (this.form) {
            this.validationHandler = new FormValidationHandler(this.form)
            this.passwordValidator = new PasswordValidator(this.form, { isEditMode: this.isEditMode })
        }

        this.loadingManager = LoadingStateManager.simple(container, '#form-loading', '#admin-form')

        if (this.isEditMode && this.adminId) {
            await this.loadAdminData()
        } else {
            this.setupForm()
        }
    }

    unmount(): void {
        this.validationHandler?.destroy()
        this.passwordValidator?.destroy()
        this.container = null
        this.form = null
        this.admin = null
        this.validationHandler = null
        this.passwordValidator = null
        this.loadingManager = null
    }

    private generateFormHTML(): string {
        return `
            <!-- Basic Information -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Dane podstawowe</h5>
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
                        
                        ${!this.isEditMode ? `
                            <div class="col-md-6">
                                <label class="form-label">Hasło <span class="text-danger">*</span></label>
                                <input type="password" name="password" class="form-control" required minlength="8">
                                <div class="form-text">Minimum 8 znaków</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Potwierdź hasło <span class="text-danger">*</span></label>
                                <input type="password" name="password_confirmation" class="form-control" required>
                            </div>
                        ` : `
                            <div class="col-12">
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Zostaw pola hasła puste, jeśli nie chcesz zmieniać hasła
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Nowe hasło</label>
                                <input type="password" name="password" class="form-control" minlength="8">
                                <div class="form-text">Minimum 8 znaków (opcjonalne)</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Potwierdź nowe hasło</label>
                                <input type="password" name="password_confirmation" class="form-control">
                            </div>
                        `}
                        
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

            <!-- Permissions Info -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Uprawnienia</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Administrator</strong> - Pełne uprawnienia do zarządzania systemem, użytkownikami, pakietami i wszystkimi pozostałymi funkcjami platformy.
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Dostępne funkcje:</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Zarządzanie użytkownikami</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Zarządzanie pakietami</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Zarządzanie lektorami</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Zarządzanie moderatorami</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Dodatkowe uprawnienia:</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Ustawienia systemu</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Raporty i analityka</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Logi systemowe</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Zarządzanie administratorami</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-between mb-5">
                <a href="/admin/dashboard?section=administratorzy" class="btn btn-outline-secondary">
                    <i class="bi bi-x-circle me-1"></i> Anuluj
                </a>
                <button type="submit" class="btn btn-primary" id="submit-button">
                    <i class="bi bi-check-circle me-1"></i> 
                    ${this.isEditMode ? 'Zapisz zmiany' : 'Utwórz administratora'}
                </button>
            </div>

            <input type="hidden" name="admin_id" value="${this.adminId || ''}">
        `
    }

    private async loadAdminData(): Promise<void> {
        if (!this.adminId) return

        try {
            this.loadingManager?.showLoading()

            this.admin = await adminService.getAdminById(this.adminId)

            this.loadingManager?.showContent()
            this.fillFormWithAdminData(this.admin)
            this.setupForm()

        } catch (error) {
            console.error('Failed to load admin:', error)
            NotificationService.error('Nie udało się załadować danych administratora')
            await navigate.to('/admin/dashboard?section=administratorzy')
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
    }

    private setupForm(): void {
        if (!this.form) return

        // Form submit
        this.form.addEventListener('submit', this.handleSubmit.bind(this))
        
        // Password validation is already handled by PasswordValidator
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault()

        if (!this.form) return

        const submitButton = this.form.querySelector('#submit-button') as HTMLButtonElement
        const buttonLoader = LoadingStateManager.forButton(submitButton, 'Przetwarzanie...')
        
        buttonLoader.setLoading(true)

        try {
            const formData = new FormData(this.form)
            const adminData = FormDataParser.parseUserForm(formData, this.isEditMode)

            if (this.isEditMode && this.adminId) {
                await adminService.updateAdmin(this.adminId, adminData as UpdateAdminRequest)
                NotificationService.updated('Administrator')
                await navigate.to(`/admin/dashboard?section=admin-details&admin_id=${this.adminId}`)
            } else {
                const admin = await adminService.createAdmin(adminData as CreateAdminRequest)
                NotificationService.created('Administrator')
                await navigate.to(`/admin/dashboard?section=admin-details&admin_id=${admin.id}`)
            }

        } catch (error: any) {
            console.error('Form submission error:', error)

            if (error.name !== 'ValidationError') {
                NotificationService.error('Wystąpił błąd podczas zapisywania danych')
            }
        } finally {
            buttonLoader.setLoading(false)
        }
    }

}