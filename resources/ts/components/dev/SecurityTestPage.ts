// resources/ts/components/dev/SecurityTestPage.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { Router } from '@/router'

export class SecurityTestPage implements RouteComponent {
    private router: Router | null = null

    async render(): Promise<HTMLElement> {
        const user = authService.getUser()
        const isAuthenticated = authService.isAuthenticated()
        const isVerified = authService.isVerified()
        const permissions = authService.getPermissions()

        const el = document.createElement('div')
        el.className = 'container mt-5'
        el.innerHTML = `
            <h1>🔒 Security Test Page</h1>
            <p class="text-muted">Ta strona jest dostępna tylko w trybie development</p>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Stan autoryzacji</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Zalogowany:</strong> ${isAuthenticated ? '✅ TAK' : '❌ NIE'}</p>
                            <p><strong>Zweryfikowany:</strong> ${isVerified ? '✅ TAK' : '❌ NIE'}</p>
                            ${user ? `
                                <p><strong>ID:</strong> ${user.id}</p>
                                <p><strong>Email:</strong> ${user.email}</p>
                                <p><strong>Rola:</strong> ${user.role}</p>
                                <p><strong>Status:</strong> ${user.status}</p>
                            ` : '<p class="text-muted">Brak danych użytkownika</p>'}
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header">
                            <h5>Uprawnienia</h5>
                        </div>
                        <div class="card-body">
                            ${permissions.length > 0 ? `
                                <ul class="list-unstyled">
                                    ${permissions.map(p => `<li>✓ ${p}</li>`).join('')}
                                </ul>
                            ` : '<p class="text-muted">Brak uprawnień</p>'}
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Testuj zabezpieczenia tras</h5>
                        </div>
                        <div class="card-body">
                            <p>Kliknij aby spróbować przejść na chronione strony:</p>
                            
                            <div class="list-group">
                                <a href="/admin/dashboard" class="list-group-item list-group-item-action">
                                    /admin/dashboard <small>(wymaga: admin)</small>
                                </a>
                                <a href="/moderator/dashboard" class="list-group-item list-group-item-action">
                                    /moderator/dashboard <small>(wymaga: moderator)</small>
                                </a>
                                <a href="/tutor/dashboard" class="list-group-item list-group-item-action">
                                    /tutor/dashboard <small>(wymaga: tutor)</small>
                                </a>
                                <a href="/student/dashboard" class="list-group-item list-group-item-action">
                                    /student/dashboard <small>(wymaga: student)</small>
                                </a>
                                <a href="/profile" class="list-group-item list-group-item-action">
                                    /profile <small>(wymaga: zalogowany + zweryfikowany)</small>
                                </a>
                                <a href="/verify-email" class="list-group-item list-group-item-action">
                                    /verify-email <small>(wymaga: zalogowany, NIE zweryfikowany)</small>
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header">
                            <h5>Akcje testowe</h5>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-danger mb-2 w-100" id="clear-auth">
                                🗑️ Wyczyść dane autoryzacji (symuluj wygasłą sesję)
                            </button>
                            <button class="btn btn-warning mb-2 w-100" id="invalid-token">
                                🔨 Ustaw nieprawidłowy token
                            </button>
                            <button class="btn btn-info mb-2 w-100" id="refresh-page">
                                🔄 Odśwież stronę
                            </button>
                            ${isAuthenticated ? `
                                <button class="btn btn-secondary w-100" id="logout">
                                    🚪 Wyloguj normalnie
                                </button>
                            ` : `
                                <a href="/login" class="btn btn-primary w-100">
                                    🔐 Przejdź do logowania
                                </a>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5>Logi konsoli</h5>
                <p class="text-muted">Otwórz konsolę developerską (F12) aby zobaczyć szczegółowe logi z guards</p>
            </div>
        `

        return el
    }

    mount(container: HTMLElement): void {
        // Clear auth button
        const clearAuthBtn = container.querySelector('#clear-auth')
        clearAuthBtn?.addEventListener('click', () => {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_permissions')
            alert('Dane autoryzacji zostały wyczyszczone. Kliknij na dowolny link aby przetestować.')
        })

        // Invalid token button
        const invalidTokenBtn = container.querySelector('#invalid-token')
        invalidTokenBtn?.addEventListener('click', () => {
            localStorage.setItem('auth_token', 'invalid_token_12345')
            alert('Ustawiono nieprawidłowy token. Kliknij na dowolny link aby przetestować.')
        })

        // Refresh button
        const refreshBtn = container.querySelector('#refresh-page')
        refreshBtn?.addEventListener('click', () => {
            window.location.reload()
        })

        // Logout button
        const logoutBtn = container.querySelector('#logout')
        logoutBtn?.addEventListener('click', async () => {
            await authService.logout()
            window.location.href = '/'
        })
    }
}