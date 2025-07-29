// resources/ts/components/auth/LogoutPage.ts
import { authService } from '@services/AuthService'
import {navigateTo, redirectWithMessage} from '@/utils/navigation'
import type { RouteComponent } from '@router/routes'

export class LogoutPage implements RouteComponent {
    private mounted: boolean = false

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        document.body.classList.add('login-page')

        container.innerHTML = `
            <div class="login-container">
                <div class="login-form-section">
                    <div class="login-logo">Platforma Lektorów</div>
                    
                    <div class="logout-content">
                        <div class="logout-icon-wrapper">
                            <i class="bi bi-box-arrow-right"></i>
                        </div>
                        
                        <h1 class="form-title">Wylogowywanie...</h1>
                        <p class="form-subtitle">Trwa wylogowywanie z systemu</p>
                        
                        <div class="loading-spinner-container">
                            <div class="logout-loading-spinner"></div>
                        </div>
                        
                        <p class="logout-message">Za chwilę zostaniesz przekierowany na stronę główną</p>
                    </div>
                </div>
                
                <div class="login-info-section">
                    <div>
                        <h2>Dziękujemy za wizytę!</h2>
                        <p>Mamy nadzieję, że wkrótce wrócisz do nauki.</p>
                        <p class="mt-4">Pamiętaj, że regularna nauka to klucz do sukcesu!</p>
                    </div>
                </div>
            </div>
        `

        return container
    }

    async mount(container: HTMLElement): Promise<void> {
        this.mounted = true

        // Wykonaj logout natychmiast
        try {
            await authService.logout()

            // Pokaż komunikat sukcesu
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Wylogowano pomyślnie',
                    duration: 3000
                }
            }))

            // Przekieruj na stronę główną
            navigateTo('/')

        } catch (error) {
            console.error('Logout error:', error)
            // W przypadku błędu też przekieruj (logout po stronie frontu już wykonany)
            navigateTo('/')
        }
    }

    unmount(): void {
        this.mounted = false
        document.body.classList.remove('login-page')

        // Usuń style jeśli istnieją
        const styleEl = document.getElementById('logout-page-styles')
        if (styleEl) {
            styleEl.remove()
        }
    }
}