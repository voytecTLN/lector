// resources/ts/components/auth/LoginPage.ts
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@router/routes'
import { navigate } from '@/utils/navigation'
import { PasswordToggleHelper } from '@/utils/PasswordToggleHelper'

export class LoginPage implements RouteComponent {
    private form: HTMLFormElement | null = null

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')

        // Check for flash messages in URL params
        const params = new URLSearchParams(window.location.search)
        // Support both 'message' and 'error' parameters for backward compatibility
        const message = params.get('message') || params.get('error')
        const type = params.get('type') || 'info'

        container.innerHTML = `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">Platforma Lektorów</div>
                    
                    ${message ? `
                        <div class="notification-banner notification-${type}">
                            <i class="bi ${this.getIconForType(type)}"></i>
                            <span>${decodeURIComponent(message)}</span>
                            <button class="login-notification-close" aria-label="Zamknij">×</button>
                        </div>
                    ` : ''}
                    
                    <h1 class="form-title">Witaj ponownie!</h1>
                    <p class="form-subtitle">Zaloguj się, aby rozpocząć naukę</p>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="email">Adres e-mail</label>
                            <input type="email" id="email" name="email" class="form-control" required>
                            <div class="error-message" id="emailError">Wprowadź poprawny adres e-mail</div>
                        </div>
                        <div class="form-group">
                            <label for="password">Hasło</label>
                            <div class="password-input-container">
                                <input type="password" id="password" name="password" class="form-control" required>
                                <button type="button" class="password-toggle" id="password-toggle" aria-label="Pokaż/ukryj hasło">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                            <div class="error-message" id="passwordError">Hasło jest wymagane</div>
                        </div>
                        <div class="form-options">
                            <div class="remember-me">
                                <input type="checkbox" id="remember" name="remember" hidden="">
<!--                                <label for="remember">Zapamiętaj mnie</label>-->
                            </div>
                            <div class="forgot-password">
                                <a href="/forgot-password" class="forgot-password-link">Zapomniałeś hasła?</a>
                            </div>
                        </div>
                        <button type="submit" class="login-btn" id="loginButton">
                            <span id="buttonText">Zaloguj się</span>
                            <div class="login-loading-spinner" id="loadingSpinner"></div>
                        </button>
                    </form>
                </div>
                <div class="login-info-section">
                    <div>
                        <h2>Rozpocznij naukę już dziś!</h2>
                        <p>Nasza platforma oferuje najlepsze doświadczenie nauki języków obcych online.</p>
                    </div>
                </div>
            </div>
        `
        return container
    }

    mount(container: HTMLElement): void {
        this.form = container.querySelector('#loginForm') as HTMLFormElement
        this.form?.addEventListener('submit', this.handleSubmit)

        // Setup password toggle
        PasswordToggleHelper.setupPasswordToggle('#password', '#password-toggle')

        // Handle notification close
        const closeBtn = container.querySelector('.login-notification-close')
        closeBtn?.addEventListener('click', (e) => {
            const notification = (e.target as HTMLElement).closest('.notification-banner')
            notification?.remove()

            // Clean URL
            const url = new URL(window.location.href)
            url.searchParams.delete('message')
            url.searchParams.delete('error')
            url.searchParams.delete('type')
            window.history.replaceState({}, document.title, url.pathname)
        })

        // Additionally: clear hash if it exists (for SPA with hash routing)
        if (window.location.hash.includes('?')) {
            const hashPath = window.location.hash.split('?')[0]
            window.history.replaceState({}, document.title, window.location.pathname + hashPath)
        }
    }

    unmount(): void {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit)
        }
        document.body.classList.remove('login-page')
    }

    private getIconForType(type: string): string {
        const icons: Record<string, string> = {
            'success': 'bi-check-circle-fill',
            'error': 'bi-exclamation-circle-fill',
            'warning': 'bi-exclamation-triangle-fill',
            'info': 'bi-info-circle-fill'
        }
        return icons[type] || icons.info
    }

    private handleSubmit = async (e: Event) => {
        e.preventDefault()
        if (!this.form) return
        const emailInput = this.form.querySelector('#email') as HTMLInputElement
        const passwordInput = this.form.querySelector('#password') as HTMLInputElement
        const rememberInput = this.form.querySelector('#remember') as HTMLInputElement
        const button = this.form.querySelector('#loginButton') as HTMLButtonElement
        const spinner = this.form.querySelector('#loadingSpinner') as HTMLElement
        const buttonText = this.form.querySelector('#buttonText') as HTMLElement

        button.disabled = true
        spinner.style.display = 'inline-block'
        buttonText.style.display = 'none'

        try {
            await authService.login({
                email: emailInput.value,
                password: passwordInput.value,
                remember: rememberInput.checked
            })

            // Get user data after login
            const user = authService.getUser()

            if (user) {
                const intendedUrl = (window as any).router?.getIntendedUrl()

                if (intendedUrl) {
                    // Redirect to intended URL
                    navigate.to(intendedUrl)
                } else {
                    // Determine dashboard based on role
                    let dashboardUrl = '/'

                    switch (user.role) {
                        case 'admin':
                            dashboardUrl = '/admin/dashboard'
                            break
                        case 'moderator':
                            dashboardUrl = '/moderator/dashboard'
                            break
                        case 'tutor':
                            dashboardUrl = '/tutor/dashboard'
                            break
                        case 'student':
                            dashboardUrl = '/student/dashboard'
                            break
                        default:
                            dashboardUrl = '/'
                    }

                    // Redirect to appropriate dashboard
                    navigate.to(dashboardUrl)
                }
            } else {
                // Fallback - if for some reason there's no user
                navigate.to('/')
            }

        } catch (err: any) {
            const msg = err.message || 'Błąd logowania'

            // Display error to user
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: msg,
                    duration: 5000
                }
            }))

            // Reset button
            button.disabled = false
            spinner.style.display = 'none'
            buttonText.style.display = 'inline'
        }
    }
}