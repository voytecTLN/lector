// resources/ts/components/common/Navigation.ts
import { authService } from '@services/AuthService'

export class Navigation {
    render(): HTMLElement {
        const user = authService.getUser()
        const isAuthenticated = authService.isAuthenticated()

        const header = document.createElement('header')

        // NOWE: Pobierz aktualną ścieżkę
        const currentPath = window.location.pathname
        const currentHash = window.location.hash

        // NOWE: Funkcja pomocnicza do sprawdzania aktywnego linku
        const isActive = (href: string): string => {
            // Dla hash linków
            if (href.includes('#')) {
                return currentHash === href.substring(href.indexOf('#')) ? 'active' : ''
            }
            // Dla normalnych linków
            return currentPath === href ? 'active' : ''
        }

        // Dynamiczna zawartość w zależności od stanu autoryzacji
        const navActions = isAuthenticated && user ? `
            <div class="nav-actions">
                <span class="nav-user-name">👤 ${user.name}</span>
                <a href="/${user.role}/dashboard" class="btn btn-primary">Panel</a>
                <button class="btn btn-secondary logout-btn" id="logout-btn">Wyloguj</button>
            </div>
        ` : `
            <div class="nav-actions">
                <a href="/register" class="btn btn-secondary join-btn nowrap">Dołącz do nas</a>
                <a href="/login" class="btn btn-primary login-btn">Zaloguj się</a>
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
                    <li><a href="/#lecturers" class="${isActive('/#lecturers')}">Lektorzy</a></li>
                    <li><a href="/#about" class="${isActive('/#about')}">O nas</a></li>
                    <li><a href="/contact" class="${isActive('/contact')}">Kontakt</a></li>
                </ul>
                ${navActions}
            </nav>
        `

        // NOWE: Dodaj event listener dla logout
        setTimeout(() => {
            const logoutBtn = header.querySelector('#logout-btn')
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault()

                    // Dispatch custom event zamiast bezpośredniego router.navigate
                    document.dispatchEvent(new CustomEvent('app:logout'))
                })
            }
        }, 0)

        return header
    }
}