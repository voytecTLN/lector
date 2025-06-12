// resources/ts/components/common/UserMenu.ts
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@/router/routes'

export class UserMenu implements RouteComponent {
    private container: HTMLElement | null = null
    private currentUser: any = null

    async render(): Promise<HTMLElement> {
        this.currentUser = authService.getUser()

        const userMenu = document.createElement('div')
        userMenu.className = 'user-menu-component'

        if (!this.currentUser) {
            userMenu.innerHTML = this.getGuestMenu()
        } else {
            userMenu.innerHTML = this.getAuthenticatedMenu()
        }

        return userMenu
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        console.log('✅ UserMenu mounted')
    }

    unmount(): void {
        console.log('👋 UserMenu unmounted')
    }

    private getGuestMenu(): string {
        return `
            <div class="guest-menu">
                <a href="/login" data-navigate class="btn btn-outline-primary btn-sm">
                    Zaloguj się
                </a>
                <a href="/register" data-navigate class="btn btn-primary btn-sm">
                    Dołącz do nas
                </a>
            </div>
        `
    }

    private getAuthenticatedMenu(): string {
        const user = this.currentUser
        const initials = this.getInitials(user.name)
        const roleLabel = this.getRoleLabel(user.role)

        return `
            <div class="authenticated-menu">
                <!-- Notifications -->
                <div class="menu-notifications">
                    <button class="notification-btn" id="notification-btn" aria-label="Powiadomienia">
                        <span class="notification-icon">🔔</span>
                        <span class="notification-badge" id="notification-badge">3</span>
                    </button>
                    <div class="notification-dropdown" id="notification-dropdown">
                        <div class="notification-header">
                            <h4>Powiadomienia</h4>
                            <button class="mark-all-read" id="mark-all-read">Oznacz jako przeczytane</button>
                        </div>
                        <div class="notification-list" id="notification-list">
                            <!-- Notifications will be loaded here -->
                            <div class="notification-item">
                                <div class="notification-content">
                                    <p class="notification-text">Przykładowe powiadomienie</p>
                                    <span class="notification-time">5 min temu</span>
                                </div>
                            </div>
                        </div>
                        <div class="notification-footer">
                            <a href="/notifications" data-navigate>Zobacz wszystkie</a>
                        </div>
                    </div>
                </div>

                <!-- User Dropdown -->
                <div class="user-dropdown">
                    <button class="user-menu-btn" id="user-menu-btn" aria-label="Menu użytkownika">
                        <div class="user-avatar">
                            ${user.avatar ?
            `<img src="${user.avatar}" alt="${user.name}" class="avatar-img">` :
            `<span class="avatar-initials">${initials}</span>`
        }
                        </div>
                        <div class="user-info">
                            <span class="user-name">${user.name}</span>
                            <span class="user-role">${roleLabel}</span>
                        </div>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    
                    <div class="user-dropdown-menu" id="user-dropdown-menu">
                        <div class="dropdown-header">
                            <div class="user-details">
                                <div class="user-avatar-large">
                                    ${user.avatar ?
            `<img src="${user.avatar}" alt="${user.name}" class="avatar-img">` :
            `<span class="avatar-initials">${initials}</span>`
        }
                                </div>
                                <div class="user-info-detailed">
                                    <h4>${user.name}</h4>
                                    <p>${user.email}</p>
                                    <span class="role-badge role-${user.role}">${roleLabel}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="dropdown-content">
                            <div class="dropdown-section">
                                <a href="/profile" data-navigate class="dropdown-item">
                                    <span class="item-icon">👤</span>
                                    Mój profil
                                </a>
                                <a href="/settings" data-navigate class="dropdown-item">
                                    <span class="item-icon">⚙️</span>
                                    Ustawienia
                                </a>
                                ${this.getRoleDashboardLink(user.role)}
                            </div>
                            
                            <div class="dropdown-section">
                                <a href="/help" data-navigate class="dropdown-item">
                                    <span class="item-icon">❓</span>
                                    Pomoc
                                </a>
                                <a href="/feedback" data-navigate class="dropdown-item">
                                    <span class="item-icon">💬</span>
                                    Opinie
                                </a>
                            </div>
                        </div>
                        
                        <div class="dropdown-footer">
                            <button class="logout-btn" id="logout-btn">
                                <span class="item-icon">🚪</span>
                                Wyloguj się
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
    }

    private getRoleLabel(role: string): string {
        const roleLabels: Record<string, string> = {
            admin: 'Administrator',
            moderator: 'Moderator',
            tutor: 'Lektor',
            student: 'Student'
        }
        return roleLabels[role] || 'Użytkownik'
    }

    private getRoleDashboardLink(role: string): string {
        const dashboardRoutes: Record<string, string> = {
            admin: '/admin/dashboard',
            moderator: '/moderator/dashboard',
            tutor: '/tutor/dashboard',
            student: '/student/dashboard'
        }

        const route = dashboardRoutes[role]
        if (route) {
            return `
                <a href="${route}" data-navigate class="dropdown-item">
                    <span class="item-icon">📊</span>
                    Dashboard
                </a>
            `
        }
        return ''
    }

    private initEventListeners(): void {
        if (!this.container) return

        // User menu toggle
        const userMenuBtn = this.container.querySelector('#user-menu-btn')
        userMenuBtn?.addEventListener('click', this.toggleUserMenu.bind(this))

        // Notification toggle
        const notificationBtn = this.container.querySelector('#notification-btn')
        notificationBtn?.addEventListener('click', this.toggleNotifications.bind(this))

        // Logout button
        const logoutBtn = this.container.querySelector('#logout-btn')
        logoutBtn?.addEventListener('click', this.handleLogout.bind(this))

        // Mark all notifications as read
        const markAllRead = this.container.querySelector('#mark-all-read')
        markAllRead?.addEventListener('click', this.markAllNotificationsRead.bind(this))

        // Close dropdowns on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this))

        // Listen for auth changes
        document.addEventListener('auth:change', this.handleAuthChange.bind(this) as EventListener)

        // Load notifications
        this.loadNotifications()
    }

    private toggleUserMenu(event: Event): void {
        event.stopPropagation()
        const dropdown = this.container?.querySelector('#user-dropdown-menu')
        const notificationDropdown = this.container?.querySelector('#notification-dropdown')

        // Close notifications dropdown
        notificationDropdown?.classList.remove('open')

        // Toggle user menu
        dropdown?.classList.toggle('open')
    }

    private toggleNotifications(event: Event): void {
        event.stopPropagation()
        const dropdown = this.container?.querySelector('#notification-dropdown')
        const userDropdown = this.container?.querySelector('#user-dropdown-menu')

        // Close user dropdown
        userDropdown?.classList.remove('open')

        // Toggle notifications
        dropdown?.classList.toggle('open')

        // Mark as read when opened
        if (dropdown?.classList.contains('open')) {
            this.markNotificationsAsViewed()
        }
    }

    private async handleLogout(event: Event): Promise<void> {
        event.preventDefault()

        const logoutBtn = event.target as HTMLButtonElement
        logoutBtn.disabled = true
        logoutBtn.textContent = 'Wylogowywanie...'

        try {
            await authService.logout()
            // AuthService will handle the redirect
        } catch (error) {
            console.error('Logout error:', error)
            logoutBtn.disabled = false
            logoutBtn.innerHTML = '<span class="item-icon">🚪</span>Wyloguj się'
        }
    }

    private markAllNotificationsRead(): void {
        // TODO: Implement mark all as read API call
        const badge = this.container?.querySelector('#notification-badge')
        if (badge) {
            badge.textContent = '0'
            badge.classList.add('hidden')
        }

        const notifications = this.container?.querySelectorAll('.notification-item')
        notifications?.forEach(notification => {
            notification.classList.add('read')
        })
    }

    private markNotificationsAsViewed(): void {
        // Remove notification badge when notifications are viewed
        const badge = this.container?.querySelector('#notification-badge')
        if (badge) {
            badge.classList.add('viewed')
        }
    }

    private async loadNotifications(): Promise<void> {
        const badge = this.container?.querySelector('#notification-badge')
        if (badge) {
            // Simulate API call
            setTimeout(() => {
                // Losowa liczba powiadomień dla testów
                const count: number = Math.floor(Math.random() * 6) // 0-5 notifications
                badge.textContent = count.toString()
                badge.classList.toggle('hidden', count === 0)
            }, 1000)
        }
    }

    private handleOutsideClick(event: Event): void {
        const target = event.target as HTMLElement

        if (!target.closest('.user-dropdown') && !target.closest('.menu-notifications')) {
            this.container?.querySelector('#user-dropdown-menu')?.classList.remove('open')
            this.container?.querySelector('#notification-dropdown')?.classList.remove('open')
        }
    }

    private handleAuthChange(event: Event): void {
        // Re-render user menu when auth state changes
        if (this.container) {
            this.currentUser = authService.getUser()

            if (!this.currentUser) {
                this.container.innerHTML = this.getGuestMenu()
            } else {
                this.container.innerHTML = this.getAuthenticatedMenu()
            }

            this.initEventListeners()
        }
    }
}