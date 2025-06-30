import { authService } from '@services/AuthService'
import { redirectWithMessage } from '@/utils/navigation'
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
            console.log('📝 RegisterPage: Starting registration...')

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

            console.log('📝 RegisterPage: Registration response:', response)
            console.log('📝 RegisterPage: requires_verification =', response.data?.requires_verification)

            // Sprawdź czy użytkownik wymaga weryfikacji
            if (response.data?.requires_verification) {
                console.log('📝 RegisterPage: User requires verification, redirecting to /verify-email')
                console.log('📝 RegisterPage: Current URL before redirect:', window.location.href)

                // Przekieruj na stronę weryfikacji emaila
                redirectWithMessage(
                    '/#/verify-email',
                    'Konto zostało utworzone. Sprawdź email w celu weryfikacji.',
                    'success'
                )

                console.log('📝 RegisterPage: redirectWithMessage called, waiting for redirect...')
            } else {
                console.log('📝 RegisterPage: User does not require verification, redirecting to /login')

                // Jeśli nie wymaga weryfikacji (edge case), przekieruj na login
                redirectWithMessage('/#/login', 'Konto utworzone. Możesz się zalogować.', 'success')
            }

        } catch (err: any) {
            console.error('❌ RegisterPage: Registration error:', err)

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
