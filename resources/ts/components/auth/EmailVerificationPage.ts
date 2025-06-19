// resources/ts/components/auth/EmailVerificationPage.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'

export class EmailVerificationPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'container mt-5'
        el.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6">
                    <div class="card shadow-sm border-0">
                        <div class="card-body text-center py-5">
                            <div class="mb-4">
                                <div class="email-icon-wrapper">
                                    <i class="bi bi-envelope-exclamation"></i>
                                </div>
                            </div>
                            <h1 class="mb-4 fw-bold">Weryfikacja e-mail</h1>
                            
                            <div id="message-container">
                                <!-- Dynamiczna treść będzie tutaj -->
                            </div>
                            
                            <div class="d-flex justify-content-center gap-3 flex-wrap mb-4">
                                <a href="/" class="btn btn-outline-primary btn-lg px-4 py-3 rounded-pill">
                                    <i class="bi bi-house-door me-2"></i>
                                    Przejdź do strony głównej
                                </a>
                                <a href="/login" class="btn btn-primary btn-lg px-4 py-3 rounded-pill shadow-sm">
                                    <i class="bi bi-box-arrow-in-right me-2"></i>
                                    Zaloguj się
                                </a>
                            </div>
                            
                            <hr class="my-4 w-50 mx-auto">
                            
                            <div class="mt-4">
                                <p class="text-muted">
                                    Nie otrzymałeś wiadomości? 
                                    <a href="#" class="text-decoration-none link-primary fw-semibold" id="resend-link">
                                        Wyślij ponownie
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-4">
                        <p class="text-muted small">
                            <i class="bi bi-info-circle me-1"></i>
                            Sprawdź również folder spam, jeśli nie widzisz naszej wiadomości
                        </p>
                    </div>
                </div>
            </div>
        `

        return el
    }

    mount(container: HTMLElement): void {
        const params = new URLSearchParams(window.location.search)
        const error = params.get('error')
        const messageContainer = container.querySelector('#message-container')

        if (!messageContainer) return

        // WAŻNE: NIE próbujemy weryfikować tokenu!
        // Backend już to zrobił i przekierował nas tutaj

        if (error) {
            // Wyświetl błąd jeśli został przekazany z backend
            messageContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    ${decodeURIComponent(error)}
                </div>
                <p class="mb-5 text-muted fs-5">
                    Wystąpił problem z weryfikacją. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.
                </p>
            `
        } else {
            // Domyślna wiadomość informacyjna
            messageContainer.innerHTML = `
                <p class="mb-5 text-muted fs-5">
                    Sprawdź swoją skrzynkę pocztową i kliknij w link aktywacyjny, aby potwierdzić swój adres e-mail.
                </p>
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    Email z linkiem aktywacyjnym został wysłany na adres podany podczas rejestracji.
                </div>
            `
        }

        // Add event listener for resend verification email
        const resendLink = container.querySelector('#resend-link')
        resendLink?.addEventListener('click', async (e) => {
            e.preventDefault()

            // Sprawdź czy użytkownik jest zalogowany
            if (!authService.isAuthenticated()) {
                // Show error message
                const alertDiv = document.createElement('div')
                alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3'
                alertDiv.innerHTML = `
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Musisz być zalogowany aby wysłać email ponownie.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `
                const cardBody = container.querySelector('.card-body')
                cardBody?.appendChild(alertDiv)

                // Auto-dismiss after 5 seconds
                setTimeout(() => alertDiv.remove(), 5000)
                return
            }

            try {
                await authService.resendVerification()

                // Show success message
                const alertDiv = document.createElement('div')
                alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3'
                alertDiv.innerHTML = `
                    <i class="bi bi-check-circle me-2"></i>
                    Email weryfikacyjny został wysłany ponownie.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `

                const cardBody = container.querySelector('.card-body')
                cardBody?.appendChild(alertDiv)

                // Auto-dismiss after 5 seconds
                setTimeout(() => alertDiv.remove(), 5000)
            } catch (error) {
                console.error('Error resending verification email:', error)

                // Show error message
                const alertDiv = document.createElement('div')
                alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3'
                alertDiv.innerHTML = `
                    <i class="bi bi-exclamation-circle me-2"></i>
                    Wystąpił błąd podczas wysyłania emaila.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `
                const cardBody = container.querySelector('.card-body')
                cardBody?.appendChild(alertDiv)

                // Auto-dismiss after 5 seconds
                setTimeout(() => alertDiv.remove(), 5000)
            }
        })
    }

    unmount(): void {
        // Cleanup if needed
    }
}