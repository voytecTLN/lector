// resources/ts/components/auth/LoginPage.ts
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@router/routes'

export class LoginPage implements RouteComponent {
    private form: HTMLFormElement | null = null

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')

        // Check for flash messages in URL params
        const params = new URLSearchParams(window.location.search)
        const message = params.get('message')
        const type = params.get('type') || 'info'

        container.innerHTML = `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">Platforma Lektorów</div>
                    
                    ${message ? `
                        <div class="notification-banner notification-${type}">
                            <i class="bi ${this.getIconForType(type)}"></i>
                            <span>${decodeURIComponent(message)}</span>
                            <button class="notification-close" aria-label="Zamknij">×</button>
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
                            <input type="password" id="password" name="password" class="form-control" required>
                            <div class="error-message" id="passwordError">Hasło jest wymagane</div>
                        </div>
                        <div class="form-options">
                            <div class="remember-me">
                                <input type="checkbox" id="remember" name="remember">
                                <label for="remember">Zapamiętaj mnie</label>
                            </div>
                        </div>
                        <button type="submit" class="login-btn" id="loginButton">
                            <span id="buttonText">Zaloguj się</span>
                            <div class="loading-spinner" id="loadingSpinner"></div>
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

        // Handle notification close
        const closeBtn = container.querySelector('.notification-close')
        closeBtn?.addEventListener('click', (e) => {
            const notification = (e.target as HTMLElement).closest('.notification-banner')
            notification?.remove()

            // Clean URL
            const url = new URL(window.location.href)
            url.searchParams.delete('message')
            url.searchParams.delete('type')
            window.history.replaceState({}, document.title, url.pathname)
        })
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
            window.location.href = '/'
        } catch (err: any) {
            const msg = err.message || 'Błąd logowania'
            alert(msg)
        } finally {
            button.disabled = false
            spinner.style.display = 'none'
            buttonText.style.display = 'inline'
        }
    }
}