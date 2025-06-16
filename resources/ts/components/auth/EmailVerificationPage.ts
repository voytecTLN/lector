import { authService } from '@services/AuthService'
import type { RouteComponent } from '@router/routes'

export class EmailVerificationPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')
        container.innerHTML = `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">Platforma Lektorów</div>
                    <h1 class="form-title">Weryfikacja e-mail</h1>
                    <p>Sprawdź swoją skrzynkę pocztową i kliknij w link weryfikacyjny.</p>
                    <button class="login-btn" id="resendBtn">Wyślij ponownie</button>
                </div>
                <div class="login-info-section">
                    <div>
                        <h2>Dziękujemy za rejestrację!</h2>
                        <p>Potwierdź swój adres e-mail, aby korzystać z platformy.</p>
                    </div>
                </div>
            </div>`
        return container
    }

    mount(container: HTMLElement): void {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        if (token) {
            authService.verifyEmail(token).catch(err => alert(err.message))
        }
        const resendBtn = container.querySelector('#resendBtn') as HTMLButtonElement
        resendBtn.addEventListener('click', () => authService.resendVerification())
    }

    unmount(): void {
        document.body.classList.remove('login-page')
    }
}
