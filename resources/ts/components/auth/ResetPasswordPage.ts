import { authService } from '@services/AuthService'
import { redirectWithMessage } from '@/utils/navigation'
import { PasswordValidator } from '@/utils/PasswordValidator'
import { LoadingStateManager } from '@/utils/LoadingStateManager'
import Logger from '@/utils/logger'
import type { RouteComponent } from '@router/routes'

export class ResetPasswordPage implements RouteComponent {
    private form: HTMLFormElement | null = null
    private token: string = ''
    private email: string = ''
    private passwordValidator: PasswordValidator | null = null
    private loadingManager: LoadingStateManager | null = null
    private submitButton: HTMLButtonElement | null = null

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')
        
        // Get token and email from URL params
        const params = new URLSearchParams(window.location.search)
        this.token = params.get('token') || ''
        this.email = params.get('email') || ''

        // Validate token presence
        if (!this.token) {
            this.showInvalidTokenPage(container)
            return container
        }

        container.innerHTML = this.renderForm()
        return container
    }

    private renderForm(): string {
        return `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">
                        <a href="/" style="text-decoration: none; color: inherit;">
                            Platforma Lektorów
                        </a>
                    </div>
                    <h1 class="form-title">Ustaw nowe hasło</h1>
                    
                    ${this.email ? `<p class="email-info">Resetowanie hasła dla: <strong>${this.email}</strong></p>` : ''}
                    
                    <form id="resetForm" novalidate>
                        <div class="form-group">
                            <label for="password" class="form-label required">
                                Nowe hasło
                                <span class="text-danger">*</span>
                            </label>
                            <div class="password-input-container">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="form-control" 
                                    required 
                                    minlength="12"
                                    autocomplete="new-password"
                                    aria-describedby="password-requirements password-error"
                                    title="Hasło musi spełniać wymagania bezpieczeństwa">
                                <button type="button" class="password-toggle" id="passwordToggle" aria-label="Pokaż/ukryj hasło">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                            <div id="password-error" class="invalid-feedback" role="alert"></div>
                            <div id="password-requirements" class="password-requirements">
                                <div class="requirements-header">
                                    <i class="bi bi-shield-check"></i>
                                    <strong>Wymagania dla hasła:</strong>
                                </div>
                                <ul class="requirements-list">
                                    <li id="req-length"><i class="bi bi-x-circle"></i> Co najmniej 12 znaków</li>
                                    <li id="req-lowercase"><i class="bi bi-x-circle"></i> Małą literę (a-z)</li>
                                    <li id="req-uppercase"><i class="bi bi-x-circle"></i> Wielką literę (A-Z)</li>
                                    <li id="req-number"><i class="bi bi-x-circle"></i> Cyfrę (0-9)</li>
                                    <li id="req-special"><i class="bi bi-x-circle"></i> Znak specjalny (!@#$%^&*...)</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="password_confirmation" class="form-label required">
                                Potwierdź hasło
                                <span class="text-danger">*</span>
                            </label>
                            <div class="password-input-container">
                                <input 
                                    type="password" 
                                    id="password_confirmation" 
                                    name="password_confirmation" 
                                    class="form-control" 
                                    required
                                    autocomplete="new-password"
                                    aria-describedby="password-confirmation-error"
                                    title="Powtórz nowe hasło">
                                <button type="button" class="password-toggle" id="passwordConfirmationToggle" aria-label="Pokaż/ukryj potwierdzenie hasła">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                            <div id="password-confirmation-error" class="invalid-feedback" role="alert"></div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-lg w-100" id="resetButton">
                                <span class="button-text">Zmień hasło</span>
                                <span class="button-loading d-none">
                                    <i class="bi bi-arrow-clockwise spin"></i>
                                    Zmienianie...
                                </span>
                            </button>
                        </div>

                        <div class="form-footer">
                            <p class="text-center">
                                <a href="/#/login" class="link-secondary">
                                    <i class="bi bi-arrow-left"></i>
                                    Wróć do logowania
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
                
                <div class="login-info-section">
                    <div class="info-content">
                        <h2><i class="bi bi-shield-lock"></i> Bezpieczne resetowanie</h2>
                        <div class="info-text">
                            <p>Tworzysz nowe, bezpieczne hasło do swojego konta na Platformie Lektorów.</p>
                            
                            <div class="security-tips">
                                <h4><i class="bi bi-check-circle"></i> Wymagania bezpieczeństwa:</h4>
                                <ul>
                                    <li>Minimum 12 znaków długości</li>
                                    <li>Kombinacja małych i wielkich liter</li>
                                    <li>Co najmniej jedna cyfra</li>
                                    <li>Znak specjalny (!@#$%^&* itp.)</li>
                                </ul>
                                <p></p>
                                <h4><i class="bi bi-lightbulb"></i> Zalecenia ekspertów:</h4>
                                <ul>
                                    <li>Użyj unikalnego hasła, którego nigdzie indziej nie stosowałeś</li>
                                    <li>Nie udostępniaj hasła żadnej osobie trzeciej</li>
                                    <li>Rozważ użycie menedżera haseł (np. Bitwarden, 1Password)</li>
                                    <li>Unikaj osobistych informacji w haśle</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private showInvalidTokenPage(container: HTMLElement): void {
        container.innerHTML = `
            <div class="login-container">
                <div class="error-page">
                    <div class="error-content">
                        <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 4rem;"></i>
                        <h1>Nieprawidłowy lub wygasły link</h1>
                        <p>Link do resetowania hasła jest nieprawidłowy lub wygasł.</p>
                        <div class="error-actions">
                            <a href="/#/forgot-password" class="btn btn-primary">
                                <i class="bi bi-arrow-clockwise"></i>
                                Wyślij nowy link
                            </a>
                            <a href="/#/login" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i>
                                Wróć do logowania
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    mount(container: HTMLElement): void {
        this.form = container.querySelector('#resetForm') as HTMLFormElement
        this.submitButton = container.querySelector('#resetButton') as HTMLButtonElement
        
        if (!this.form || !this.submitButton) return

        // Initialize components
        this.loadingManager = new LoadingStateManager(this.submitButton, {
            loading: '.button-loading',
            content: '.button-text'
        })
        this.passwordValidator = new PasswordValidator(this.form, {
            enforceStrength: true,
            minLength: 12
        })

        // Setup event listeners
        this.setupEventListeners()
        this.setupPasswordToggles()
        this.setupPasswordValidation()
    }

    unmount(): void {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit)
        }
        
        // Cleanup components
        this.passwordValidator?.destroy()
        this.loadingManager = null
        this.passwordValidator = null
        this.form = null
        this.submitButton = null
        
        // Cleanup DOM
        document.body.classList.remove('login-page')
    }

    private setupEventListeners(): void {
        if (!this.form) return

        this.form.addEventListener('submit', this.handleSubmit)

        // Real-time validation
        const passwordInput = this.form.querySelector('#password') as HTMLInputElement
        const confirmInput = this.form.querySelector('#password_confirmation') as HTMLInputElement

        if (passwordInput) {
            passwordInput.addEventListener('input', this.handlePasswordInput.bind(this))
            passwordInput.addEventListener('blur', this.validatePassword.bind(this))
        }

        if (confirmInput) {
            confirmInput.addEventListener('input', this.validatePasswordConfirmation.bind(this))
            confirmInput.addEventListener('blur', this.validatePasswordConfirmation.bind(this))
        }
    }

    private setupPasswordToggles(): void {
        const setupToggle = (toggleId: string, inputId: string) => {
            const toggle = document.getElementById(toggleId) as HTMLButtonElement
            const input = document.getElementById(inputId) as HTMLInputElement
            
            if (toggle && input) {
                toggle.addEventListener('click', () => {
                    const isPassword = input.type === 'password'
                    input.type = isPassword ? 'text' : 'password'
                    const icon = toggle.querySelector('i')
                    if (icon) {
                        icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye'
                    }
                })
            }
        }

        setupToggle('passwordToggle', 'password')
        setupToggle('passwordConfirmationToggle', 'password_confirmation')
    }

    private setupPasswordValidation(): void {
        const requirements = {
            'req-length': (password: string) => password.length >= 12,
            'req-lowercase': (password: string) => /[a-z]/.test(password),
            'req-uppercase': (password: string) => /[A-Z]/.test(password),
            'req-number': (password: string) => /[0-9]/.test(password),
            'req-special': (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
        }

        this.updateRequirements = (password: string) => {
            Object.entries(requirements).forEach(([id, test]) => {
                const element = document.getElementById(id)
                if (element) {
                    const icon = element.querySelector('i')
                    const isValid = test(password)
                    
                    element.classList.toggle('valid', isValid)
                    element.classList.toggle('invalid', !isValid)
                    
                    if (icon) {
                        icon.className = isValid ? 'bi bi-check-circle-fill' : 'bi bi-x-circle'
                    }
                }
            })
        }
    }

    private updateRequirements: (password: string) => void = () => {}

    private handlePasswordInput(): void {
        const passwordInput = this.form?.querySelector('#password') as HTMLInputElement
        if (passwordInput) {
            this.updateRequirements(passwordInput.value)
        }
    }

    private validatePassword(): void {
        const passwordInput = this.form?.querySelector('#password') as HTMLInputElement
        const errorDiv = document.getElementById('password-error')
        
        if (!passwordInput || !errorDiv) return

        const password = passwordInput.value
        const error = this.getPasswordError(password)
        
        if (error) {
            passwordInput.classList.add('is-invalid')
            errorDiv.textContent = error
        } else {
            passwordInput.classList.remove('is-invalid')
            errorDiv.textContent = ''
        }
    }

    private validatePasswordConfirmation(): void {
        const passwordInput = this.form?.querySelector('#password') as HTMLInputElement
        const confirmInput = this.form?.querySelector('#password_confirmation') as HTMLInputElement
        const errorDiv = document.getElementById('password-confirmation-error')
        
        if (!passwordInput || !confirmInput || !errorDiv) return

        const password = passwordInput.value
        const confirmation = confirmInput.value
        
        if (confirmation && password !== confirmation) {
            confirmInput.classList.add('is-invalid')
            errorDiv.textContent = 'Hasła muszą być identyczne'
        } else {
            confirmInput.classList.remove('is-invalid')
            errorDiv.textContent = ''
        }
    }

    private getPasswordError(password: string): string | null {
        if (!password) return 'Hasło jest wymagane'
        if (password.length < 12) return 'Hasło musi mieć co najmniej 12 znaków'
        if (!/[a-z]/.test(password)) return 'Hasło musi zawierać małą literę'
        if (!/[A-Z]/.test(password)) return 'Hasło musi zawierać wielką literę'
        if (!/[0-9]/.test(password)) return 'Hasło musi zawierać cyfrę'
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) return 'Hasło musi zawierać znak specjalny'
        return null
    }

    private handleSubmit = async (e: Event): Promise<void> => {
        e.preventDefault()
        
        if (!this.form || !this.passwordValidator || !this.loadingManager) {
            Logger.error('ResetPasswordPage: Missing required components')
            return
        }

        // Validate form
        if (!this.validateForm()) {
            return
        }

        const formData = new FormData(this.form)
        const password = formData.get('password') as string
        const passwordConfirmation = formData.get('password_confirmation') as string

        try {
            this.loadingManager?.showLoading()
            
            await authService.resetPassword({
                token: this.token,
                password: password,
                password_confirmation: passwordConfirmation
            })

            // Success - redirect to login
            this.showSuccessMessage()
            
            setTimeout(() => {
                redirectWithMessage(
                    '/#/login',
                    'Hasło zostało zmienione pomyślnie. Możesz się teraz zalogować.',
                    'success'
                )
            }, 1500)

        } catch (err: any) {
            Logger.error('Password reset error:', err)
            this.handleError(err)
        } finally {
            this.loadingManager?.showContent()
        }
    }

    private validateForm(): boolean {
        if (!this.form || !this.passwordValidator) return false

        const passwordInput = this.form.querySelector('#password') as HTMLInputElement
        const confirmInput = this.form.querySelector('#password_confirmation') as HTMLInputElement
        
        let isValid = true

        // Validate password
        const passwordError = this.getPasswordError(passwordInput.value)
        if (passwordError) {
            this.showFieldError('password', passwordError)
            isValid = false
        }

        // Validate password confirmation
        if (passwordInput.value !== confirmInput.value) {
            this.showFieldError('password_confirmation', 'Hasła muszą być identyczne')
            isValid = false
        }

        // Use PasswordValidator for additional checks
        if (!this.passwordValidator.isValid()) {
            isValid = false
        }

        if (!isValid) {
            this.showNotification('Proszę poprawić błędy w formularzu', 'error')
        }

        return isValid
    }

    private showFieldError(fieldName: string, message: string): void {
        const input = this.form?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
        const errorDiv = document.getElementById(`${fieldName}-error`)
        
        if (input && errorDiv) {
            input.classList.add('is-invalid')
            errorDiv.textContent = message
        }
    }

    private clearFieldError(fieldName: string): void {
        const input = this.form?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
        const errorDiv = document.getElementById(`${fieldName}-error`)
        
        if (input && errorDiv) {
            input.classList.remove('is-invalid')
            errorDiv.textContent = ''
        }
    }

    private handleError(err: any): void {
        // Handle validation errors from backend
        if (err.errors && typeof err.errors === 'object') {
            Object.entries(err.errors).forEach(([field, messages]: [string, any]) => {
                const message = Array.isArray(messages) ? messages[0] : messages
                this.showFieldError(field, message)
            })
            this.showNotification('Proszę poprawić błędy w formularzu', 'error')
        } else {
            // Handle general errors
            const message = err.message || 'Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.'
            this.showNotification(message, 'error')
        }
    }

    private showSuccessMessage(): void {
        const form = this.form?.querySelector('.form-actions')
        if (form) {
            form.innerHTML = `
                <div class="success-message text-center">
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                    <h3 class="mt-3">Hasło zmienione!</h3>
                    <p>Za chwilę zostaniesz przekierowany do logowania...</p>
                </div>
            `
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'warning' = 'error'): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type,
                message,
                duration: 5000
            }
        }))
    }
}