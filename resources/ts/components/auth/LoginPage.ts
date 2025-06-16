// resources/ts/components/auth/LoginPage.ts
import { authService } from '@services/AuthService'
import { ValidationError } from '@/types/models'
import type { RouteComponent } from '@/router/routes'
import type { LoginFormData } from '@/types/auth'

export class LoginPage implements RouteComponent {
    private container: HTMLElement | null = null
    private isSubmitting: boolean = false

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'login-page auth-page'

        page.innerHTML = `
            <div class="auth-card">
                <div class="auth-card-header">
                    <h1 class="auth-title">Zaloguj się</h1>
                    <p class="auth-subtitle">Witaj ponownie! Zaloguj się do swojego konta</p>
                </div>

                <div class="auth-card-body">
                    <!-- Login Form -->
                    <form class="auth-form" id="login-form" novalidate>
                        <!-- Email Field -->
                        <div class="form-group">
                            <label for="email" class="form-label">
                                Adres email
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email"
                                    class="form-control" 
                                    placeholder="twoj@email.com"
                                    autocomplete="email"
                                    required
                                    aria-describedby="email-error"
                                >
                                <span class="input-icon">📧</span>
                            </div>
                            <div class="field-error" id="email-error"></div>
                        </div>

                        <!-- Password Field -->
                        <div class="form-group">
                            <label for="password" class="form-label">
                                Hasło
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password"
                                    class="form-control" 
                                    placeholder="Twoje hasło"
                                    autocomplete="current-password"
                                    required
                                    aria-describedby="password-error"
                                >
                                <span class="input-icon">🔒</span>
                                <button type="button" class="password-toggle" id="password-toggle" aria-label="Pokaż/ukryj hasło">
                                    <span class="toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="field-error" id="password-error"></div>
                        </div>

                        <!-- Remember Me & Forgot Password -->
                        <div class="form-row">
                            <div class="form-check">
                                <input 
                                    type="checkbox" 
                                    id="remember" 
                                    name="remember"
                                    class="form-checkbox"
                                >
                                <label for="remember" class="form-check-label">
                                    Zapamiętaj mnie
                                </label>
                            </div>
                            <a href="/forgot-password" data-navigate class="forgot-password-link">
                                Zapomniałeś hasła?
                            </a>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="btn btn-primary btn-full" id="submit-btn">
                            <span class="btn-text">Zaloguj się</span>
                            <span class="btn-loading hidden">
                                <span class="loading-spinner"></span>
                                Logowanie...
                            </span>
                        </button>

                        <!-- Form Errors -->
                        <div class="form-errors" id="form-errors"></div>
                    </form>

                    <!-- Social Login (Future) -->
                    <div class="social-login">
                        <div class="divider">
                            <span>lub</span>
                        </div>
                        <div class="social-buttons">
                            <button class="btn btn-social btn-google" disabled>
                                <span class="social-icon">🔍</span>
                                Zaloguj przez Google
                            </button>
                            <button class="btn btn-social btn-facebook" disabled>
                                <span class="social-icon">📘</span>
                                Zaloguj przez Facebook
                            </button>
                        </div>
                        <p class="social-note">Logowanie społecznościowe będzie dostępne wkrótce</p>
                    </div>
                </div>

                <div class="auth-card-footer">
                    <p class="auth-footer-text">
                        Nie masz jeszcze konta? 
                        <a href="/register" data-navigate class="auth-link">Zarejestruj się</a>
                    </p>
                </div>
            </div>

            <!-- Help Section -->
            <div class="auth-help">
                <h3>Potrzebujesz pomocy?</h3>
                <div class="help-links">
                    <a href="/help/login" data-navigate>Problemy z logowaniem</a>
                    <a href="/help/account" data-navigate>Odzyskiwanie konta</a>
                    <a href="/contact" data-navigate>Skontaktuj się z nami</a>
                </div>
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initFormValidation()
        this.focusFirstField()
        console.log('✅ LoginPage mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 LoginPage unmounted')
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Form submission
        const form = this.container.querySelector('#login-form')
        form?.addEventListener('submit', this.handleSubmit.bind(this))

        // Password toggle
        const passwordToggle = this.container.querySelector('#password-toggle')
        passwordToggle?.addEventListener('click', this.togglePassword.bind(this))

        // Real-time validation
        const inputs = this.container.querySelectorAll('.form-control')
        inputs.forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this))
            input.addEventListener('input', this.clearFieldError.bind(this))
        })
    }

    private initFormValidation(): void {
        // Auto-fill form if we have saved data (demo purposes)
        const emailInput = this.container?.querySelector('#email') as HTMLInputElement
        const passwordInput = this.container?.querySelector('#password') as HTMLInputElement

        // Pre-fill for development (remove in production)
        if (window.location.hostname === 'localhost') {
            const urlParams = new URLSearchParams(window.location.search)
            const demo = urlParams.get('demo')

            if (demo === 'admin') {
                emailInput.value = 'admin@test.com'
                passwordInput.value = 'password'
            } else if (demo === 'student') {
                emailInput.value = 'jan.nowak@test.com'
                passwordInput.value = 'password'
            } else if (demo === 'tutor') {
                emailInput.value = 'anna.kowalska@test.com'
                passwordInput.value = 'password'
            }
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()

        if (this.isSubmitting) return

        const form = event.target as HTMLFormElement
        const formData = new FormData(form)

        const data: LoginFormData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            remember: formData.has('remember')
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
            console.log('🔐 Attempting login...')

            const response = await authService.login({
                email: data.email,
                password: data.password,
                remember: data.remember
            })

            if (response.success) {
                console.log('✅ Login successful')

                // Show success message briefly
                this.showSuccess('Zalogowano pomyślnie! Przekierowywanie...')

                // Redirect based on user role
                setTimeout(() => {
                    this.redirectAfterLogin(response.data.user.role)
                }, 1500)
            }

        } catch (error: any) {
            console.error('❌ Login error:', error)

            if (error instanceof ValidationError) {
                this.showValidationErrors(error.errors)
            } else {
                this.showFormError(error instanceof Error ? error.message : 'Błąd podczas logowania')
            }
        } finally {
            this.setLoadingState(false)
        }
    }

    private validateForm(data: LoginFormData): Record<string, string[]> {
        const errors: Record<string, string[]> = {}

        // Email validation
        if (!data.email) {
            errors.email = ['Email jest wymagany']
        } else if (!this.isValidEmail(data.email)) {
            errors.email = ['Podaj poprawny adres email']
        }

        // Password validation
        if (!data.password) {
            errors.password = ['Hasło jest wymagane']
        } else if (data.password.length < 1) {
            errors.password = ['Hasło jest wymagane']
        }

        return errors
    }

    private validateField(event: Event): void {
        const input = event.target as HTMLInputElement
        const field = input.name
        const value = input.value

        let error = ''

        switch (field) {
            case 'email':
                if (!value) {
                    error = 'Email jest wymagany'
                } else if (!this.isValidEmail(value)) {
                    error = 'Podaj poprawny adres email'
                }
                break

            case 'password':
                if (!value) {
                    error = 'Hasło jest wymagane'
                }
                break
        }

        this.showFieldError(field, error)
    }

    private clearFieldError(event: Event): void {
        const input = event.target as HTMLInputElement
        this.showFieldError(input.name, '')
    }

    private togglePassword(): void {
        const passwordInput = this.container?.querySelector('#password') as HTMLInputElement
        const toggleIcon = this.container?.querySelector('.toggle-icon')

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

    private showSuccess(message: string): void {
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = `
                <div class="alert alert-success">
                    <span class="alert-icon">✅</span>
                    <span class="alert-message">${message}</span>
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

    private focusFirstField(): void {
        const emailInput = this.container?.querySelector('#email') as HTMLInputElement
        emailInput?.focus()
    }

    private redirectAfterLogin(role: string): void {
        const dashboardRoutes: Record<string, string> = {
            admin: '/admin/dashboard',
            moderator: '/moderator/dashboard',
            tutor: '/tutor/dashboard',
            student: '/student/dashboard'
        }

        const redirectUrl = dashboardRoutes[role] || '/profile'
        window.location.href = redirectUrl
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    private cleanup(): void {
        this.isSubmitting = false
    }

    // Lifecycle hooks
    onBeforeEnter(): boolean {
        // Redirect if already authenticated
        if (authService.isAuthenticated()) {
            const user = authService.getUser()
            if (user) {
                this.redirectAfterLogin(user.role)
                return false
            }
        }
        return true
    }

    onAfterEnter(): void {
        document.title = 'Logowanie - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        this.cleanup()
    }
}