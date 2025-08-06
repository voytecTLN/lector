// resources/ts/components/forms/TutorProfileEdit.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'
import type { AuthUser } from '@/types/auth'

export class TutorProfileEdit implements RouteComponent {
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private tutor: AuthUser | null = null
    private isSaving: boolean = false

    constructor() {
        this.tutor = authService.getUser()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'tutor-profile-edit'
        
        if (!this.tutor) {
            el.innerHTML = '<div class="alert alert-danger">Błąd: Nie można załadować danych profilu.</div>'
            return el
        }

        el.innerHTML = `
            <div class="tutor-content-area">
                <div class="mb-4">
                    <h2>Edytuj profil</h2>
                    <p class="tutor-text-muted">Zaktualizuj swoje dane osobowe i informacje o nauczaniu</p>
                </div>

                <form id="profile-form" class="needs-validation" novalidate>
                    <!-- Dane osobowe -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Dane osobowe</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label for="name" class="form-label">Imię i nazwisko *</label>
                                        <input type="text" 
                                               class="tutor-form-control" 
                                               id="name" 
                                               name="name" 
                                               value="${this.tutor.name || ''}" 
                                               required>
                                        <div class="invalid-feedback">
                                            Proszę podać imię i nazwisko
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label for="email" class="form-label">Email *</label>
                                        <input type="email" 
                                               class="tutor-form-control" 
                                               id="email" 
                                               name="email" 
                                               value="${this.tutor.email || ''}" 
                                               required>
                                        <div class="invalid-feedback">
                                            Proszę podać prawidłowy adres email
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label for="phone" class="form-label">Telefon</label>
                                        <input type="tel" 
                                               class="tutor-form-control" 
                                               id="phone" 
                                               name="phone" 
                                               value="${this.tutor.phone || ''}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label for="city" class="form-label">Miasto</label>
                                        <input type="text" 
                                               class="tutor-form-control" 
                                               id="city" 
                                               name="city" 
                                               value="${this.tutor.city || ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Informacje o nauczaniu -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Informacje o nauczaniu</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-12">
                                    <div class="tutor-form-group">
                                        <label for="description" class="form-label">O mnie / Bio</label>
                                        <textarea class="tutor-form-control" 
                                                  id="description" 
                                                  name="description" 
                                                  rows="4"
                                                  placeholder="Opisz swoje doświadczenie, metody nauczania...">${this.tutor.tutor_profile?.description || ''}</textarea>
                                        <small class="text-muted">Przedstaw się swoim przyszłym studentom</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label for="years_experience" class="form-label">Lata doświadczenia</label>
                                        <input type="number" 
                                               class="tutor-form-control" 
                                               id="years_experience" 
                                               name="years_experience" 
                                               min="0" 
                                               max="50"
                                               value="${this.tutor.tutor_profile?.years_experience || ''}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label class="form-label">Status przyjmowania studentów</label>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" 
                                                   type="checkbox" 
                                                   id="is_accepting_students" 
                                                   name="is_accepting_students"
                                                   ${this.tutor.tutor_profile?.is_accepting_students ? 'checked' : ''}>
                                            <label class="form-check-label" for="is_accepting_students">
                                                Przyjmuję nowych studentów
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Zmiana hasła -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Zmiana hasła</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info mb-3">
                                <i class="bi bi-info-circle me-1"></i>
                                Zostaw puste, jeśli nie chcesz zmieniać hasła
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label for="password" class="form-label">Nowe hasło</label>
                                        <input type="password" 
                                               class="tutor-form-control" 
                                               id="password" 
                                               name="password"
                                               minlength="8">
                                        <small class="text-muted">Minimum 8 znaków</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="tutor-form-group">
                                        <label for="password_confirmation" class="form-label">Potwierdź hasło</label>
                                        <input type="password" 
                                               class="tutor-form-control" 
                                               id="password_confirmation" 
                                               name="password_confirmation">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Przyciski -->
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="tutor-btn-secondary" onclick="window.location.href='?section=dashboard'">
                            Anuluj
                        </button>
                        <button type="submit" class="tutor-btn-primary" id="save-button">
                            <span class="button-text">Zapisz zmiany</span>
                            <span class="button-spinner d-none">
                                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Zapisywanie...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        `

        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.form = container.querySelector('#profile-form')
        
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this))
            
            // Password confirmation validation
            const password = this.form.querySelector('#password') as HTMLInputElement
            const passwordConfirm = this.form.querySelector('#password_confirmation') as HTMLInputElement
            
            passwordConfirm?.addEventListener('input', () => {
                if (password.value !== passwordConfirm.value) {
                    passwordConfirm.setCustomValidity('Hasła nie są identyczne')
                } else {
                    passwordConfirm.setCustomValidity('')
                }
            })
        }
    }

    unmount(): void {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit.bind(this))
        }
        this.form = null
        this.container = null
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()
        event.stopPropagation()

        if (!this.form || this.isSaving) return

        // Bootstrap validation
        if (!this.form.checkValidity()) {
            this.form.classList.add('was-validated')
            return
        }

        this.isSaving = true
        const saveButton = this.form.querySelector('#save-button') as HTMLButtonElement
        const buttonText = saveButton.querySelector('.button-text') as HTMLElement
        const buttonSpinner = saveButton.querySelector('.button-spinner') as HTMLElement

        // Show loading state
        saveButton.disabled = true
        buttonText.classList.add('d-none')
        buttonSpinner.classList.remove('d-none')

        try {
            const formData = new FormData(this.form)
            const data: any = {}

            // Extract form data
            formData.forEach((value, key) => {
                if (key === 'is_accepting_students') {
                    data[key] = (this.form?.querySelector('#is_accepting_students') as HTMLInputElement).checked
                } else if (value && value !== '') {
                    data[key] = value
                }
            })

            // Update profile
            const result = await api.put<any>('/tutor/profile', data)
            
            // Update local tutor data
            this.tutor = result.user || result.data?.user
            
            this.showNotification('success', 'Profil został zaktualizowany')
            
            // Clear password fields
            const passwordField = this.form.querySelector('#password') as HTMLInputElement
            const passwordConfirmField = this.form.querySelector('#password_confirmation') as HTMLInputElement
            if (passwordField) passwordField.value = ''
            if (passwordConfirmField) passwordConfirmField.value = ''
            
            this.form.classList.remove('was-validated')
        } catch (error: any) {
            console.error('Failed to update profile:', error)
            
            if (error.errors) {
                // Show validation errors
                Object.entries(error.errors).forEach(([field, messages]) => {
                    const input = this.form?.querySelector(`[name="${field}"]`)
                    if (input) {
                        input.classList.add('is-invalid')
                        const feedback = input.parentElement?.querySelector('.invalid-feedback')
                        if (feedback && Array.isArray(messages)) {
                            feedback.textContent = messages[0]
                        }
                    }
                })
            } else {
                this.showNotification('error', error.message || 'Wystąpił błąd podczas zapisywania profilu')
            }
        } finally {
            this.isSaving = false
            saveButton.disabled = false
            buttonText.classList.remove('d-none')
            buttonSpinner.classList.add('d-none')
        }
    }

    private showNotification(type: 'success' | 'error', message: string): void {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger'
        const icon = type === 'success' ? '✅' : '❌'
        
        const alert = document.createElement('div')
        alert.className = `alert ${alertClass} d-flex align-items-center`
        alert.style.cssText = 'margin-bottom: 1rem; padding: 1rem; border-radius: 0.5rem; background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
        
        if (type === 'error') {
            alert.style.cssText = 'margin-bottom: 1rem; padding: 1rem; border-radius: 0.5rem; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
        }
        
        alert.innerHTML = `
            <span style="margin-right: 0.5rem;">${icon}</span>
            ${message}
        `
        
        this.container?.insertBefore(alert, this.container.firstChild)
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.remove()
        }, 5000)
    }
}