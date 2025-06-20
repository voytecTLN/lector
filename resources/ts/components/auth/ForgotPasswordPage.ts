import { authService } from '@services/AuthService'
import type { RouteComponent } from '@router/routes'

export class ForgotPasswordPage implements RouteComponent {
    private form: HTMLFormElement | null = null

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')
        container.innerHTML = `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">Platforma Lektorów</div>
                    <h1 class="form-title">Resetuj hasło</h1>
                    <form id="forgotForm">
                        <div class="form-group">
                            <label for="email">Adres e-mail</label>
                            <input type="email" id="email" name="email" class="form-control" required>
                        </div>
                        <button type="submit" class="login-btn" id="forgotButton">Wyślij link</button>
                    </form>
                </div>
                <div class="login-info-section">
                    <div>
                        <h2>Zapomniałeś hasła?</h2>
                        <p>Podaj swój adres e-mail, a wyślemy link do resetu.</p>
                    </div>
                </div>
            </div>`
        return container
    }

    mount(container: HTMLElement): void {
        this.form = container.querySelector('#forgotForm') as HTMLFormElement
        this.form?.addEventListener('submit', this.handleSubmit)
    }

    unmount(): void {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit)
        }
        document.body.classList.remove('login-page')
    }

    private handleSubmit = async (e: Event) => {
        e.preventDefault()
        if (!this.form) return
        const button = this.form.querySelector('#forgotButton') as HTMLButtonElement
        button.disabled = true

        try {
            await authService.forgotPassword((this.form.querySelector('#email') as HTMLInputElement).value)

            // Przekieruj na login z komunikatem
            window.location.href = '/#/login?message=' + encodeURIComponent('Link do resetowania hasła został wysłany na podany adres email') + '&type=success'

        } catch (err: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: err.message || 'Błąd podczas wysyłania emaila',
                    duration: 5000
                }
            }))

            button.disabled = false
        }
    }
}
