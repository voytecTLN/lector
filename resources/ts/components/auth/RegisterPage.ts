import { authService } from '@services/AuthService'
import type { RouteComponent } from '@router/routes'

export class RegisterPage implements RouteComponent {
    private form: HTMLFormElement | null = null

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')
        container.innerHTML = `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">Platforma Lektorów</div>
                    <h1 class="form-title">Rejestracja</h1>
                    <form id="registerForm">
                        <div class="form-group">
                            <label for="name">Imię i nazwisko</label>
                            <input type="text" id="name" name="name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Adres e-mail</label>
                            <input type="email" id="email" name="email" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Hasło</label>
                            <input type="password" id="password" name="password" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="password_confirmation">Potwierdź hasło</label>
                            <input type="password" id="password_confirmation" name="password_confirmation" class="form-control" required>
                        </div>
                        <button type="submit" class="login-btn" id="registerButton">Załóż konto</button>
                    </form>
                </div>
                <div class="login-info-section">
                    <div>
                        <h2>Dołącz do nas!</h2>
                        <p>Ucz się języków z najlepszymi lektorami online.</p>
                    </div>
                </div>
            </div>`
        return container
    }

    mount(container: HTMLElement): void {
        this.form = container.querySelector('#registerForm') as HTMLFormElement
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
        const button = this.form.querySelector('#registerButton') as HTMLButtonElement
        button.disabled = true

        try {
            const response = await authService.register({
                name: (this.form.querySelector('#name') as HTMLInputElement).value,
                email: (this.form.querySelector('#email') as HTMLInputElement).value,
                password: (this.form.querySelector('#password') as HTMLInputElement).value,
                password_confirmation: (this.form.querySelector('#password_confirmation') as HTMLInputElement).value,
                role: 'student',
                phone: '',
                city: '',
                terms_accepted: true
            })

            // Sprawdź czy użytkownik wymaga weryfikacji
            if (response.data?.requires_verification) {
                // Przekieruj na stronę weryfikacji emaila
                window.location.href = '/#/verify-email'
            } else {
                // Jeśli nie wymaga weryfikacji (edge case), przekieruj na login
                window.location.href = '/#/login'
            }

        } catch (err: any) {
            // Wyświetl błąd jako notyfikację
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: err.message || 'Błąd podczas rejestracji',
                    duration: 5000
                }
            }))

            button.disabled = false
        }
    }
}
