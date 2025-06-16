// resources/ts/components/auth/ForgotPasswordPage.ts
import { authService } from '@services/AuthService'
import { ValidationError } from '@/types/models'
import type { RouteComponent } from '@/router/routes'

export class ForgotPasswordPage implements RouteComponent {
    private container: HTMLElement | null = null
    private isSubmitting: boolean = false
    private emailSent: boolean = false

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'forgot-password-page auth-page'

        page.innerHTML = `
            <div class="auth-card">
                <div class="auth-card-header">
                    <h1 class="auth-title">Resetowanie hasła</h1>
                    <p class="auth-subtitle">
                        ${this.emailSent
            ? 'Email został wysłany! Sprawdź swoją skrzynkę pocztową.'
            : 'Podaj swój adres email, a wyślemy Ci link do resetowania hasła.'
        }
                    </p>
                </div>

                <div class="auth-card-body">
                    ${this.emailSent ? this.getSuccessContent() : this.getFormContent()}
                </div>

                <div class="auth-card-footer">
                    <p class="auth-footer-text">
                        Pamiętasz hasło? 
                        <a href="/login" data-navigate class="auth-link">Wróć do logowania</a>
                    </p>
                </div>
            </div>

            <!-- Help Section -->
            <div class="auth-help">
                <h3>Potrzebujesz pomocy?</h3>
                <div class="help-links">
                    <a href="/help/password-reset" data-navigate>Problemy z resetowaniem hasła</a>
                    <a href="/help/account-recovery" data-navigate>Odzyskiwanie konta</a>
                    <a href="/contact" data-navigate>Skontaktuj się z nami</a>
                </div>
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        if (!this.emailSent) {
            this.initEventListeners()
            this.focusEmailField()
        }
        console.log('✅ ForgotPasswordPage mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 ForgotPasswordPage unmounted')
    }

    private getFormContent(): string {
        return `
            <!-- Reset Form -->
            <form class="auth-form" id="forgot-password-form" novalidate>
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
                            aria-describedby="email-error email-help"
                        >
                        <span class="input-icon">📧</span>
                    </div>
                    <div class="field-help" id="email-help">
                        Wpisz adres email, na który zostało zarejestrowane Twoje konto
                    </div>
                    <div class="field-error" id="email-error"></div>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="btn btn-primary btn-full" id="submit-btn">
                    <span class="btn-text">Wyślij link resetujący</span>
                    <span class="btn-loading hidden">
                        <span class="loading-spinner"></span>
                        Wysyłanie...
                    </span>
                </button>

                <!-- Form Errors -->
                <div class="form-errors" id="form-errors"></div>
            </form>

            <!-- Additional Info -->
            <div class="reset-info">
                <div class="info-box">
                    <div class="info-icon">💡</div>
                    <div class="info-content">
                        <h4>Jak to działa?</h4>
                        <ol class="info-steps">
                            <li>Wpisz swój adres email i kliknij "Wyślij link resetujący"</li>
                            <li>Sprawdź swoją skrzynkę pocztową (w tym folder spam)</li>
                            <li>Kliknij link w emailu, aby utworzyć nowe hasło</li>
                            <li>Zaloguj się używając nowego hasła</li>
                        </ol>
                    </div>
                </div>
            </div>
        `
    }

    private getSuccessContent(): string {
        return `
            <!-- Success State -->
            <div class="success-state">
                <div class="success-icon">
                    <div class="icon-container">
                        <span class="main-icon">✅</span>
                        <div class="icon-effects">
                            <div class="success-ring"></div>
                            <div class="success-ring delay-1"></div>
                        </div>
                    </div>
                </div>

                <div class="success-message">
                    <h3>Email został wysłany!</h3>
                    <p>
                        Sprawdź swoją skrzynkę pocztową. Jeśli masz konto w naszym systemie, 
                        otrzymałeś email z linkiem do resetowania hasła.
                    </p>
                </div>

                <div class="success-actions">
                    <button class="btn btn-primary" id="resend-btn">
                        📧 Wyślij ponownie
                    </button>
                    <a href="/login" data-navigate class="btn btn-outline-primary">
                        🔐 Wróć do logowania
                    </a>
                </div>

                <div class="success-help">
                    <h4>Nie otrzymałeś emaila?</h4>
                    <ul class="help-list">
                        <li>Sprawdź folder spam/wiadomości niechciane</li>
                        <li>Upewnij się, że podałeś poprawny adres email</li>
                        <li>Odczekaj kilka minut - dostarczenie może potrwać</li>
                        <li>Sprawdź czy konto istnieje w naszym systemie</li>
                    </ul>
                </div>
            </div>
        `
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Form submission
        const form = this.container.querySelector('#forgot-password-form')
        form?.addEventListener('submit', this.handleSubmit.bind(this))

        // Real-time validation
        const emailInput = this.container.querySelector('#email')
        emailInput?.addEventListener('blur', this.validateEmail.bind(this))
        emailInput?.addEventListener('input', this.clearEmailError.bind(this))

        // Resend button (if in success state)
        const resendBtn = this.container.querySelector('#resend-btn')
        resendBtn?.addEventListener('click', this.handleResend.bind(this))
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()

        if (this.isSubmitting) return

        const form = event.target as HTMLFormElement
        const formData = new FormData(form)
        const email = formData.get('email') as string

        // Validate email
        const emailError = this.validateEmailValue(email)
        if (emailError) {
            this.showEmailError(emailError)
            return
        }

        this.setLoadingState(true)
        this.clearErrors()

        try {
            console.log('📧 Sending password reset email...')

            await authService.forgotPassword(email)

            // Show success state
            this.emailSent = true
            this.updatePageContent()

            console.log('✅ Password reset email sent')

        } catch (error) {
            console.error('❌ Forgot password error:', error)

            if (error instanceof ValidationError) {
                this.showValidationErrors(error.errors)
            } else {
                this.showFormError(error instanceof Error ? error.message : 'Błąd podczas wysyłania emaila')
            }
        } finally {
            this.setLoadingState(false)
        }
    }

    private async handleResend(): Promise<void> {
        // Get email from previous form or show form again
        this.emailSent = false
        this.updatePageContent()

        // Re-initialize after content update
        setTimeout(() => {
            this.initEventListeners()
            this.focusEmailField()
        }, 100)
    }

    private updatePageContent(): void {
        if (!this.container) return

        const cardBody = this.container.querySelector('.auth-card-body')
        const subtitle = this.container.querySelector('.auth-subtitle')

        if (cardBody) {
            cardBody.innerHTML = this.emailSent ? this.getSuccessContent() : this.getFormContent()
        }

        if (subtitle) {
            subtitle.textContent = this.emailSent
                ? 'Email został wysłany! Sprawdź swoją skrzynkę pocztową.'
                : 'Podaj swój adres email, a wyślemy Ci link do resetowania hasła.'
        }

        // Re-initialize event listeners
        if (!this.emailSent) {
            this.initEventListeners()
        } else {
            // Initialize resend button
            const resendBtn = this.container?.querySelector('#resend-btn')
            resendBtn?.addEventListener('click', this.handleResend.bind(this))
        }
    }

    private validateEmail(event: Event): void {
        const input = event.target as HTMLInputElement
        const error = this.validateEmailValue(input.value)
        this.showEmailError(error)
    }

    private validateEmailValue(email: string): string {
        if (!email) {
            return 'Email jest wymagany'
        }

        if (!this.isValidEmail(email)) {
            return 'Podaj poprawny adres email'
        }

        return ''
    }

    private clearEmailError(): void {
        this.showEmailError('')
    }

    private showEmailError(error: string): void {
        const errorElement = this.container?.querySelector('#email-error')
        const inputElement = this.container?.querySelector('#email')

        if (errorElement) {
            errorElement.textContent = error
            errorElement.classList.toggle('visible', !!error)
        }

        if (inputElement) {
            inputElement.classList.toggle('error', !!error)
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
            if (field === 'email') {
                this.showEmailError(fieldErrors[0])
            }
        })

        // Focus first error field
        const emailInput = this.container?.querySelector('#email') as HTMLInputElement
        emailInput?.focus()
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

    private clearErrors(): void {
        // Clear form errors
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = ''
            errorsContainer.classList.remove('visible')
        }

        // Clear field errors
        this.showEmailError('')
    }

    private focusEmailField(): void {
        setTimeout(() => {
            const emailInput = this.container?.querySelector('#email') as HTMLInputElement
            emailInput?.focus()
        }, 100)
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    private cleanup(): void {
        this.isSubmitting = false
        this.emailSent = false
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
        document.title = 'Resetowanie hasła - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        this.cleanup()
    }
}