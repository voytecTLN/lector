import { authService } from '@services/AuthService'

export class Navigation {
    render(): HTMLElement {
        const user = authService.getUser()
        const isAuthenticated = authService.isAuthenticated()

        const header = document.createElement('header')

        // Dynamiczna zawartość w zależności od stanu autoryzacji
        const navActions = isAuthenticated && user ? `
            <div class="nav-actions">
                <span class="nav-user-name">👤 ${user.name}</span>
                <a href="/${user.role}/dashboard" class="btn btn-primary">Panel</a>
                <a href="/logout" class="btn btn-secondary logout-btn" id="logout-btn">Wyloguj</a>
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
                    <li><a href="/">Start</a></li>
                    <li><a href="/#lecturers">Lektorzy</a></li>
                    <li><a href="/#about">O nas</a></li>
                    <li><a href="/#contact">Kontakt</a></li>
                </ul>
                ${navActions}
            </nav>
        `

        // NIE dodajemy event listenera dla logout - router obsłuży to automatycznie
        // Usunięto poprzedni kod addEventListener dla logout

        return header
    }
}