import { authService } from '@services/AuthService'

export class Navigation {
    render(): HTMLElement {
        const user = authService.getUser()
        const isAuthenticated = authService.isAuthenticated()

        const header = document.createElement('header')

        // Pobierz aktualną ścieżkę dla aktywnych stanów
        const currentPath = window.location.hash.replace('#', '') || '/'

        // Funkcja sprawdzająca czy link jest aktywny
        const isActive = (path: string): string => {
            // Dla home sprawdź dokładnie
            if (path === '/' && (currentPath === '/' || currentPath === '')) {
                return 'active'
            }
            // Dla innych sprawdź czy ścieżka zaczyna się od
            if (path !== '/' && currentPath.startsWith(path)) {
                return 'active'
            }
            return ''
        }

        // Dynamiczna zawartość w zależności od stanu autoryzacji
        const navActions = isAuthenticated && user ? `
            <div class="nav-actions">
                <span class="nav-user-name">👤 ${user.name}</span>
                <a href="/${user.role}/dashboard" class="btn btn-primary ${isActive(`/${user.role}/dashboard`)}">Panel</a>
                <a href="/logout" class="btn btn-secondary logout-btn" id="logout-btn">Wyloguj</a>
            </div>
        ` : `
            <div class="nav-actions">
                <a href="/register" class="btn btn-secondary join-btn nowrap ${isActive('/register')}">Dołącz do nas</a>
                <a href="/login" class="btn btn-primary login-btn ${isActive('/login')}">Zaloguj się</a>
            </div>
        `
        header.innerHTML = `
            <nav class="navbar">
                <div class="logo">
                    <a href="/" style="text-decoration: none; color: inherit;">
                        Platforma Lektorów
                    </a>
                </div>
                <ul class="nav-links">
                    <li><a href="/" class="${isActive('/')}">Start</a></li>
                    <li><a href="/#lecturers">Lektorzy</a></li>
                    <li><a href="/#about">O nas</a></li>
                    <li><a href="/#contact">Kontakt</a></li>
                </ul>
                ${navActions}
            </nav>
        `
        return header
    }
}