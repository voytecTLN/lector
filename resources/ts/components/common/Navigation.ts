// resources/ts/components/common/Navigation.ts
import { authService } from '@services/AuthService'
import { navigate, routeChecker, urlBuilder } from '@/utils/navigation'
import { ROUTES } from '@/config/routing'

export class Navigation {
    render(): HTMLElement {
        const user = authService.getUser()
        const isAuthenticated = authService.isAuthenticated()

        const header = document.createElement('header')

        // Helper function to check if link is active
        const isActive = (path: string): string => {
            return routeChecker.isCurrent(path) ? 'active' : ''
        }

        // Create avatar HTML - either image or initials
        const avatarHtml = user?.avatar 
            ? `<img src="/storage/avatars/${user.avatar}" alt="${user.name}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%;">`
            : user?.name 
                ? `<div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #6c757d; color: white; border-radius: 50%; font-weight: bold; font-size: 14px;">${user.name.charAt(0).toUpperCase()}</div>`
                : ''

        // Dynamic content based on authentication state
        const navActions = isAuthenticated && user ? `
            <div class="nav-actions" style="display: flex; align-items: center; gap: 10px;">
                ${avatarHtml}
                <span class="nav-user-name">${user.name}</span>
                <a href="${urlBuilder.dashboard(user.role)}" class="btn btn-primary">Panel</a>
                <button class="btn btn-secondary logout-btn" id="logout-btn">Wyloguj</button>
            </div>
        ` : `
            <div class="nav-actions">
<!--                <a href="${urlBuilder.hash(ROUTES.REGISTER)}" class="btn btn-secondary join-btn nowrap">Dołącz do nas</a>-->
                <a href="${urlBuilder.hash(ROUTES.LOGIN)}" class="btn btn-primary login-btn">Zaloguj się</a>
            </div>
        `

        header.innerHTML = `
            <nav class="navbar">
                <div class="logo">
                    <a href="${urlBuilder.hash(ROUTES.HOME)}" style="text-decoration: none; color: inherit;">
                        Platforma Lektorów
                    </a>
                </div>
                <ul class="nav-links">
                    <li><a href="${urlBuilder.hash(ROUTES.HOME)}" class="${isActive(ROUTES.HOME)}">Start</a></li>
                    <li><a href="${urlBuilder.hash(ROUTES.HOME)}#about" class="${isActive('/#about')}">O nas</a></li>
                    <li><a href="${urlBuilder.hash(ROUTES.FAQ)}" class="${isActive(ROUTES.FAQ)}">FAQ</a></li>
                    <li><a href="${urlBuilder.hash(ROUTES.CONTACT)}" class="${isActive(ROUTES.CONTACT)}">Kontakt</a></li>
                </ul>
                ${navActions}
            </nav>
        `

        // Add event listener for logout
        const logoutBtn = header.querySelector('#logout-btn')
        logoutBtn?.addEventListener('click', async (e) => {
            e.preventDefault()
            await authService.logout()
            navigate.to(ROUTES.HOME)
        })

        return header
    }
}