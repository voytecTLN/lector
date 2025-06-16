// resources/ts/components/auth/ResetPasswordPage.ts
import { authService } from '@services/AuthService'
import { ValidationError } from '@/types/models'
import type { RouteComponent } from '@/router/routes'
import type { NewPasswordData } from '@/types/auth'

export class ResetPasswordPage implements RouteComponent {
    private container: HTMLElement | null = null
    private isSubmitting: boolean = false
    private resetToken: string | null = null

    async render(): Promise<HTMLElement> {
        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search)
        this.resetToken = urlParams.get('token')

        const page = document.createElement('div')
        page.className = 'reset-password-page auth-page'

        // If no token, show error state
        if (!this.resetToken) {
            page.innerHTML = this.getNoTokenContent()
            return page
        }

        page.innerHTML = `
            <div class="auth-card">
                <div class="auth-card-header">
                    <h1 class="auth-title">Ustaw nowe hasło</h1>
                    <p class="auth-subtitle">
                        Wpisz nowe hasło dla swojego konta. Upewnij się, że jest bezpieczne.
                    </p>
                </div>

                <div class="auth-card-body">
                    <!-- Reset Password Form -->
                    <form class="auth-form" id="reset-password-form" novalidate>
                        <!-- New Password Field -->
                        <div class="form-group">
                            <label for="password" class="form-label">
                                Nowe hasło
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password"
                                    class="form-control" 
                                    placeholder="Minimum 8 znaków"
                                    autocomplete="new-password"
                                    required
                                    aria-describedby="password-error password-help"
                                >
                                <span class="input-icon">🔒</span>
                                <button type="button" class="password-toggle" id="password-toggle" aria-label="Pokaż/ukryj hasło">
                                    <span class="toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="field-help" id="password-help">
                                Hasło musi mieć minimum 8 znaków
                            </div>
                            <div class="field-error" id="password-error"></div>
                        </div>

                        <!-- Confirm Password Field -->
                        <div class="form-group">
                            <label for="password_confirmation" class="form-label">
                                Powtórz nowe hasło
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="password" 
                                    id="password_confirmation" 
                                    name="password_confirmation"
                                    class="form-control" 
                                    placeholder="Powtórz hasło"
                                    autocomplete="new-password"
                                    required
                                    aria-describedby="password_confirmation-error"
                                >
                                <span class="input-icon">🔒</span>
                                <button type="button" class="password-toggle" id="password-confirmation-toggle" aria-label="Pokaż/ukryj hasło">
                                    <span class="toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="field-error" id="password_confirmation-error"></div>
                        </div>

                        <!-- Password Strength Indicator -->
                        <div class="password-strength" id="password-strength">
                            <div class="strength-bar">
                                <div class="strength-fill" id="strength-fill"></div>
                            </div>
                            <div class="strength-text" id="strength-text">Wpisz hasło</div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="btn btn-primary btn-full" id="submit-btn">
                            <span class="btn-text">🔐 Ustaw nowe hasło</span>
                            <span class="btn-loading hidden">
                                <span class="loading-spinner"></span>
                                Ustawianie...
                            </span>
                        </button>

                        <!-- Form Errors -->
                        <div class="form-errors" id="form-errors"></div>
                    </form>

                    <!-- Password Requirements -->
                    <div class="password-requirements">
                        <h4>Wymagania dla hasła:</h4>
                        <ul class="requirements-list">
                            <li class="requirement" id="req-length">
                                <span class="req-icon">⏳</span>
                                Minimum 8 znaków
                            </li>
                            <li class="requirement" id="req-uppercase">
                                <span class="req-icon">⏳</span>
                                Jedna duża litera
                            </li>
                            <li class="requirement" id="req-lowercase">
                                <span class="req-icon">⏳</span>
                                Jedna mała litera
                            </li>
                            <li class="requirement" id="req-number">
                                <span class="req-icon">⏳</span>
                                Jedna cyfra
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="auth-card-footer">
                    <p class="auth-footer-text">
                        Pamiętasz hasło? 
                        <a href="/login" data-navigate class="auth-link">Wróć do logowania</a>
                    </p>
                </div>
            </div>

            <!-- Security Info -->
            <div class="security-info">
                <h3>🔐 Bezpieczeństwo</h3>
                <div class="security-tips">
                    <div class="tip-item">
                        <span class="tip-icon">💡</span>
                        <span class="tip-text">Użyj unikalnego hasła, którego nie używasz nigdzie indziej</span>
                    </div>
                    <div class="tip-item">
                        <span class="tip-icon">🔤</span>
                        <span class="tip-text">Mieszaj duże i małe litery, cyfry oraz znaki specjalne</span>
                    </div>
                    <div class="tip-item">
                        <span class="tip-icon">🚫</span>
                        <span class="tip-text">Unikaj oczywistych haseł jak daty urodzenia czy imiona</span>
                    </div>
                </div>
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container

        if (this.resetToken) {
            this.initEventListeners()
            this.focusPasswordField()
        }

        console.log('✅ ResetPasswordPage mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 ResetPasswordPage unmounted')
    }

    private getNoTokenContent(): string {
        return `
            <div class="auth-card">
                <div class="auth-card-header">
                    <h1 class="auth-title">Nieprawidłowy link</h1>
                    <p class="auth-subtitle">
                        Link do resetowania hasła jest nieprawidłowy lub wygasł.
                    </p>
                </div>

                <div class="auth-card-body">
                    <div class="error-state">
                        <div class="error-icon">
                            <span class="main-icon">❌</span>
                        </div>

                        <div class="error-message">
                            <h3>Link jest nieprawidłowy</h3>
                            <p>
                                Ten link może być nieprawidłowy, wygasły lub już został użyty. 
                                Spróbuj ponownie zresetować hasło.
                            </p>
                        </div>

                        <div class="error-actions">
                            <a href="/forgot-password" data-navigate class="btn btn-primary">
                                📧 Wyślij nowy link
                            </a>
                            <a href="/login" data-navigate class="btn btn-outline-primary">
                                🔐 Wróć do logowania
                            </a>
                        </div>

                        <div class="error-help">
                            <h4>Co mogło pójść nie tak?</h4>
                            <ul class="help-list">
                                <li>Link mógł wygasnąć (ważny jest 24 godziny)</li>
                                <li>Link mógł już zostać użyty do zmiany hasła</li>
                                <li>Możliwe, że link został nieprawidłowo skopiowany</li>
                                <li>Wystąpił błąd techniczny - spróbuj ponownie</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Form submission
        const form = this.container.querySelector('#reset-password-form')
        form?.addEventListener('submit', this.handleSubmit.bind(this))

        // Password toggles
        const passwordToggles = this.container.querySelectorAll('.password-toggle')
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', this.togglePassword.bind(this))
        })

        // Real-time validation
        const passwordInput = this.container.querySelector('#password')
        const confirmInput = this.container.querySelector('#password_confirmation')

        passwordInput?.addEventListener('input', this.handlePasswordChange.bind(this))
        passwordInput?.addEventListener('blur', this.validatePassword.bind(this))

        confirmInput?.addEventListener('input', this.validatePasswordConfirmation.bind(this))
        confirmInput?.addEventListener('blur', this.validatePasswordConfirmation.bind(this))
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()

        if (this.isSubmitting || !this.resetToken) return

        const form = event.target as HTMLFormElement
        const formData = new FormData(form)

        const data: NewPasswordData = {
            token: this.resetToken,
            password: formData.get('password') as string,
            password_confirmation: formData.get('password_confirmation') as string
        }

        // Validate form
        const validationErrors = this.validateForm(data)
        if (Object.keys(validationErrors).length > 0) {
            this.showValidationErrors(validationErrors)
            return
        }

        this.setLoadingState(true)
        this.clearErrors()

        try {
            console.log('🔐 Resetting password...')

            await authService.resetPassword(data)

            // Show success and redirect
            this.showSuccess()

            setTimeout(() => {
                window.location.href = '/login'
            }, 3000)

        } catch (error) {
            console.error('❌ Reset password error:', error)

            if (error instanceof ValidationError) {
                this.showValidationErrors(error.errors)
            } else {
                this.showFormError(error instanceof Error ? error.message : 'Błąd podczas resetowania hasła')
            }
        } finally {
            this.setLoadingState(false)
        }
    }

    private validateForm(data: NewPasswordData): Record<string, string[]> {
        const errors: Record<string, string[]> = {}

        // Password validation
        if (!data.password) {
            errors.password = ['Hasło jest wymagane']
        } else if (data.password.length < 8) {
            errors.password = ['Hasło musi mieć minimum 8 znaków']
        }

        // Password confirmation
        if (!data.password_confirmation) {
            errors.password_confirmation = ['Potwierdzenie hasła jest wymagane']
        } else if (data.password !== data.password_confirmation) {
            errors.password_confirmation = ['Hasła muszą być identyczne']
        }

        return errors
    }

    private handlePasswordChange(event: Event): void {
        const input = event.target as HTMLInputElement
        const password = input.value

        this.updatePasswordStrength(password)
        this.updatePasswordRequirements(password)
        this.clearFieldError('password')
    }

    private validatePassword(event: Event): void {
        const input = event.target as HTMLInputElement
        const password = input.value

        let error = ''
        if (!password) {
            error = 'Hasło jest wymagane'
        } else if (password.length < 8) {
            error = 'Hasło musi mieć minimum 8 znaków'
        }

        this.showFieldError('password', error)
    }

    private validatePasswordConfirmation(event: Event): void {
        const confirmInput = event.target as HTMLInputElement
        const passwordInput = this.container?.querySelector('#password') as HTMLInputElement

        const password = passwordInput?.value
        const confirmation = confirmInput.value

        let error = ''
        if (!confirmation) {
            error = 'Potwierdzenie hasła jest wymagane'
        } else if (password !== confirmation) {
            error = 'Hasła muszą być identyczne'
        }

        this.showFieldError('password_confirmation', error)
    }

    private updatePasswordStrength(password: string): void {
        const strengthFill = this.container?.querySelector('#strength-fill') as HTMLElement
        const strengthText = this.container?.querySelector('#strength-text') as HTMLElement

        if (!strengthFill || !strengthText) return

        let strength = 0
        let strengthLabel = 'Bardzo słabe'
        let strengthClass = 'very-weak'

        if (password.length >= 8) strength += 25
        if (/[A-Z]/.test(password)) strength += 25
        if (/[a-z]/.test(password)) strength += 25
        if (/[0-9]/.test(password)) strength += 25

        if (strength === 0) {
            strengthLabel = 'Wpisz hasło'
            strengthClass = 'none'
        } else if (strength <= 25) {
            strengthLabel = 'Bardzo słabe'
            strengthClass = 'very-weak'
        } else if (strength <= 50) {
            strengthLabel = 'Słabe'
            strengthClass = 'weak'
        } else if (strength <= 75) {
            strengthLabel = 'Średnie'
            strengthClass = 'medium'
        } else {
            strengthLabel = 'Silne'
            strengthClass = 'strong'
        }

        strengthFill.style.width = `${strength}%`
        strengthFill.className = `strength-fill ${strengthClass}`
        strengthText.textContent = strengthLabel
    }

    private updatePasswordRequirements(password: string): void {
        const requirements = [
            { id: 'req-length', test: password.length >= 8 },
            { id: 'req-uppercase', test: /[A-Z]/.test(password) },
            { id: 'req-lowercase', test: /[a-z]/.test(password) },
            { id: 'req-number', test: /[0-9]/.test(password) }
        ]

        requirements.forEach(req => {
            const element = this.container?.querySelector(`#${req.id}`)
            const icon = element?.querySelector('.req-icon')

            if (element && icon) {
                if (req.test) {
                    element.classList.add('met')
                    icon.textContent = '✅'
                } else {
                    element.classList.remove('met')
                    icon.textContent = '⏳'
                }
            }
        })
    }

    private togglePassword(event: Event): void {
        const toggle = event.currentTarget as HTMLButtonElement
        const inputWrapper = toggle.closest('.input-wrapper')
        const passwordInput = inputWrapper?.querySelector('input') as HTMLInputElement
        const toggleIcon = toggle.querySelector('.toggle-icon')

        if (passwordInput && toggleIcon) {
            const isPassword = passwordInput.type === 'password'
            passwordInput.type = isPassword ? 'text' : 'password'
            toggleIcon.textContent = isPassword ? '🙈' : '👁️'
        }
    }

    private setLoadingState(loading: boolean): void {
        this.isSubmitting = loading

        const submitBtn = this.container?.querySelector('#submit-btn') as HTMLButtonElement
        const btnText = submitBtn?.querySelector('.btn-text')
        const btnLoading = submitBtn?.querySelector('.btn-loading')

        if (submitBtn && btnText && btnLoading) {
            submitBtn.disabled = loading
            submitBtn.classList.toggle('btn-loading', loading)
            btnText.classList.toggle('hidden', loading)
            btnLoading.classList.toggle('hidden', !loading)
        }

        // Disable form inputs during submission
        const inputs = this.container?.querySelectorAll('.form-control') as NodeListOf<HTMLInputElement>
        inputs?.forEach(input => {
            input.disabled = loading
        })
    }

    private showValidationErrors(errors: Record<string, string[]>): void {
        // Clear previous errors
        this.clearErrors()

        // Show field-specific errors
        Object.entries(errors).forEach(([field, fieldErrors]) => {
            this.showFieldError(field, fieldErrors[0])
        })

        // Focus first error field
        const firstErrorField = Object.keys(errors)[0]
        const firstInput = this.container?.querySelector(`#${firstErrorField}`) as HTMLInputElement
        firstInput?.focus()
    }

    private showFieldError(field: string, error: string): void {
        const errorElement = this.container?.querySelector(`#${field}-error`)
        const inputElement = this.container?.querySelector(`#${field}`)

        if (errorElement) {
            errorElement.textContent = error
            errorElement.classList.toggle('visible', !!error)
        }

        if (inputElement) {
            inputElement.classList.toggle('error', !!error)
        }
    }

    private clearFieldError(field: string): void {
        this.showFieldError(field, '')
    }

    private showFormError(message: string): void {
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = `
                <div class="alert alert-error">
                    <span class="alert-icon">❌</span>
                    <span class="alert-message">${message}</span>
                </div>
            `
            errorsContainer.classList.add('visible')
        }
    }

    private showSuccess(): void {
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = `
                <div class="alert alert-success">
                    <span class="alert-icon">✅</span>
                    <span class="alert-message">
                        Hasło zostało zmienione pomyślnie! Przekierowywanie do logowania...
                    </span>
                </div>
            `
            errorsContainer.classList.add('visible')
        }
    }

    private clearErrors(): void {
        // Clear form errors
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = ''
            errorsContainer.classList.remove('visible')
        }

        // Clear field errors
        const errorElements = this.container?.querySelectorAll('.field-error')
        errorElements?.forEach(element => {
            element.textContent = ''
            element.classList.remove('visible')
        })

        // Clear input error styles
        const inputs = this.container?.querySelectorAll('.form-control')
        inputs?.forEach(input => {
            input.classList.remove('error')
        })
    }

    private focusPasswordField(): void {
        setTimeout(() => {
            const passwordInput = this.container?.querySelector('#password') as HTMLInputElement
            passwordInput?.focus()
        }, 100)
    }

    private cleanup(): void {
        this.isSubmitting = false
        this.resetToken = null
    }

    // Lifecycle hooks
    onBeforeEnter(): boolean {
        // Redirect if already authenticated
        if (authService.isAuthenticated()) {
            const user = authService.getUser()
            if (user) {
                const dashboardRoutes: Record<string, string> = {
                    admin: '/admin/dashboard',
                    moderator: '/moderator/dashboard',
                    tutor: '/tutor/dashboard',
                    student: '/student/dashboard'
                }
                const redirectUrl = dashboardRoutes[user.role] || '/profile'
                window.location.href = redirectUrl
                return false
            }
        }
        return true
    }

    onAfterEnter(): void {
        document.title = 'Nowe hasło - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        this.cleanup()
    }
}