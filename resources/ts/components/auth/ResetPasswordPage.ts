import { authService } from '@services/AuthService'
import type { RouteComponent } from '@router/routes'

export class ResetPasswordPage implements RouteComponent {
    private form: HTMLFormElement | null = null
    private token: string = ''

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')
        const params = new URLSearchParams(window.location.search)
        this.token = params.get('token') || ''
        container.innerHTML = `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">Platforma Lektorów</div>
                    <h1 class="form-title">Ustaw nowe hasło</h1>
                    <form id="resetForm">
                        <div class="form-group">
                            <label for="password">Nowe hasło</label>
                            <input type="password" id="password" name="password" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="password_confirmation">Potwierdź hasło</label>
                            <input type="password" id="password_confirmation" name="password_confirmation" class="form-control" required>
                        </div>
                        <button type="submit" class="login-btn" id="resetButton">Zmień hasło</button>
                    </form>
                </div>
                <div class="login-info-section">
                    <div>
                        <h2>Przywracanie dostępu</h2>
                        <p>Wprowadź nowe hasło do swojego konta.</p>
                    </div>
                </div>
            </div>`
        return container
    }

    mount(container: HTMLElement): void {
        this.form = container.querySelector('#resetForm') as HTMLFormElement
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
        const button = this.form.querySelector('#resetButton') as HTMLButtonElement
        button.disabled = true
        try {
            await authService.resetPassword({
                token: this.token,
                password: (this.form.querySelector('#password') as HTMLInputElement).value,
                password_confirmation: (this.form.querySelector('#password_confirmation') as HTMLInputElement).value
            })
            window.location.href = '/login'
        } catch (err: any) {
            alert(err.message || 'Błąd resetowania hasła')
        } finally {
            button.disabled = false
        }
    }
}
