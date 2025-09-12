import { authService } from '@services/AuthService'
import { redirectWithMessage } from '@/utils/navigation'
import { PasswordValidator } from '@/utils/PasswordValidator'
import { PasswordToggleHelper } from '@/utils/PasswordToggleHelper'
import type { RouteComponent } from '@router/routes'

export class RegisterPage implements RouteComponent {
    private form: HTMLFormElement | null = null
    private passwordValidator: PasswordValidator | null = null
    private updateRequirements: (password: string) => void = () => {}

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
                            <div class="password-input-container">
                                <input type="password" id="password" name="password" class="form-control" required 
                                    minlength="12"
                                    autocomplete="new-password"
                                    aria-describedby="password-requirements"
                                    title="Hasło musi spełniać wymagania bezpieczeństwa">
                                <button type="button" class="password-toggle" id="password-toggle" aria-label="Pokaż/ukryj hasło">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                            <div class="password-requirements" id="password-requirements">
                                <div class="requirements-header">
                                    <strong>Wymagania dla hasła:</strong>
                                </div>
                                <ul class="requirements-list">
                                    <li id="req-length"><i class="bi bi-x-circle"></i> Co najmniej 12 znaków</li>
                                    <li id="req-lowercase"><i class="bi bi-x-circle"></i> Małą literę (a-z)</li>
                                    <li id="req-uppercase"><i class="bi bi-x-circle"></i> Wielką literę (A-Z)</li>
                                    <li id="req-number"><i class="bi bi-x-circle"></i> Cyfrę (0-9)</li>
                                    <li id="req-special"><i class="bi bi-x-circle"></i> Znak specjalny (!@#$%^&* itp.)</li>
                                </ul>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="password_confirmation">Potwierdź hasło</label>
                            <div class="password-input-container">
                                <input type="password" id="password_confirmation" name="password_confirmation" class="form-control" required>
                                <button type="button" class="password-toggle" id="password-confirmation-toggle" aria-label="Pokaż/ukryj potwierdzenie hasła">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
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
        
        // Initialize password validation with strong password requirements
        if (this.form) {
            this.passwordValidator = new PasswordValidator(this.form, {
                enforceStrength: true,
                minLength: 12
            })
        }

        // Setup password toggles
        PasswordToggleHelper.setupPasswordToggle('#password', '#password-toggle')
        PasswordToggleHelper.setupPasswordToggle('#password_confirmation', '#password-confirmation-toggle')
        
        // Setup password validation
        this.setupPasswordValidation()
    }

    unmount(): void {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit)
        }
        document.body.classList.remove('login-page')
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

        // Add password input event listener
        const passwordInput = this.form?.querySelector('#password') as HTMLInputElement
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.updateRequirements(passwordInput.value)
            })
        }
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

            // Check if user requires verification
            if (response.data?.requires_verification) {
                redirectWithMessage(
                    '/verify-email',
                    'Konto zostało utworzone. Sprawdź email w celu weryfikacji.',
                    'success'
                )
            } else {
                // If no verification required (edge case), redirect to login
                redirectWithMessage('/#/login', 'Konto utworzone. Możesz się zalogować.', 'success')
            }

        } catch (err: any) {
            // Display error as notification
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
