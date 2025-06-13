// resources/ts/components/common/UserMenu.ts - POPRAWIONE
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
                        <span class="notification-badge ${this.getNotificationCount() === 0 ? 'hidden' : ''}" id="notification-badge">
                            ${this.getNotificationCount()}
                        </span>
                    </button>
                    <div class="notification-dropdown" id="notification-dropdown">
                        <div class="notification-header">
                            <h4>Powiadomienia</h4>
                            <button class="mark-all-read" id="mark-all-read">Oznacz jako przeczytane</button>
                        </div>
                        <div class="notification-list" id="notification-list">
                            ${this.getNotificationListHTML()}
                        </div>
                        <div class="notification-footer">
                            <div class="notification-info">Wszystkie powiadomienia</div>
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
                                    ${!user.is_verified ? `
                                        <div class="verification-warning">
                                            <span class="status-badge status-unverified">
                                                ⚠️ Email niezweryfikowany
                                            </span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="dropdown-content">
                            <div class="dropdown-section">
                                <div class="dropdown-item disabled">
                                    <span class="item-icon">👤</span>
                                    <span class="item-text">Mój profil</span>
                                    <span class="item-badge">Wkrótce</span>
                                </div>
                                <div class="dropdown-item disabled">
                                    <span class="item-icon">⚙️</span>
                                    <span class="item-text">Ustawienia</span>
                                    <span class="item-badge">Wkrótce</span>
                                </div>
                                ${this.getRoleDashboardLink(user.role)}
                            </div>
                            
                            ${!user.is_verified ? this.getVerificationSection() : ''}
                            
                            <div class="dropdown-section">
                                <div class="dropdown-item disabled">
                                    <span class="item-icon">❓</span>
                                    <span class="item-text">Pomoc</span>
                                    <span class="item-badge">Wkrótce</span>
                                </div>
                                <div class="dropdown-item disabled">
                                    <span class="item-icon">💬</span>
                                    <span class="item-text">Opinie</span>
                                    <span class="item-badge">Wkrótce</span>
                                </div>
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

    private getVerificationSection(): string {
        return `
            <div class="dropdown-section verification-section">
                <div class="verification-info">
                    <div class="verification-icon">⚠️</div>
                    <div class="verification-text">
                        <h5>Zweryfikuj email</h5>
                        <p>Aby uzyskać pełny dostęp</p>
                    </div>
                </div>
                <div class="verification-actions">
                    <a href="/verify-email" data-navigate class="btn btn-sm btn-primary">
                        Weryfikuj teraz
                    </a>
                    <button class="btn btn-sm btn-outline-primary" id="resend-verification-btn">
                        Wyślij ponownie
                    </button>
                </div>
            </div>
        `
    }

    private getNotificationListHTML(): string {
        const notifications = this.getMockNotifications()

        if (notifications.length === 0) {
            return `
                <div class="notification-empty">
                    <div class="empty-icon">🔔</div>
                    <p>Brak nowych powiadomień</p>
                </div>
            `
        }

        return notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                <div class="notification-content">
                    <div class="notification-icon">${notification.icon}</div>
                    <div class="notification-body">
                        <p class="notification-text">${notification.message}</p>
                        <span class="notification-time">${notification.time}</span>
                    </div>
                </div>
            </div>
        `).join('')
    }

    private getMockNotifications(): Array<{
        id: string
        message: string
        icon: string
        time: string
        read: boolean
    }> {
        // POPRAWIONE - symulowane powiadomienia zamiast API call
        return [
            {
                id: '1',
                message: 'Witaj w Platforma Lektorów! Uzupełnij swój profil.',
                icon: '👋',
                time: '2 min temu',
                read: false
            },
            {
                id: '2',
                message: 'Nowe funkcje będą dostępne wkrótce!',
                icon: '🎉',
                time: '1 godzinę temu',
                read: false
            }
        ]
    }

    private getNotificationCount(): number {
        return this.getMockNotifications().filter(n => !n.read).length
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
                    <span class="item-text">Dashboard</span>
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

        // Resend verification email
        const resendBtn = this.container.querySelector('#resend-verification-btn')
        resendBtn?.addEventListener('click', this.handleResendVerification.bind(this))

        // Disabled items info
        const disabledItems = this.container.querySelectorAll('.dropdown-item.disabled')
        disabledItems.forEach(item => {
            item.addEventListener('click', this.handleDisabledItemClick.bind(this))
        })

        // Close dropdowns on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this))

        // Listen for auth changes
        document.addEventListener('auth:change', this.handleAuthChange.bind(this) as EventListener)
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

        // Mark badge as viewed when opened
        if (dropdown?.classList.contains('open')) {
            this.markNotificationsAsViewed()
        }
    }

    private async handleLogout(event: Event): Promise<void> {
        event.preventDefault()

        const logoutBtn = event.target as HTMLButtonElement
        const originalText = logoutBtn.innerHTML

        logoutBtn.disabled = true
        logoutBtn.innerHTML = '<span class="item-icon">⏳</span>Wylogowywanie...'

        try {
            await authService.logout()
            // AuthService will handle the redirect
        } catch (error) {
            console.error('Logout error:', error)
            logoutBtn.disabled = false
            logoutBtn.innerHTML = originalText
        }
    }

    private markAllNotificationsRead(): void {
        const badge = this.container?.querySelector('#notification-badge')
        if (badge) {
            badge.textContent = '0'
            badge.classList.add('hidden')
        }

        const notifications = this.container?.querySelectorAll('.notification-item')
        notifications?.forEach(notification => {
            notification.classList.remove('unread')
            notification.classList.add('read')
        })

        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'success',
                message: 'Wszystkie powiadomienia zostały oznaczone jako przeczytane',
                duration: 2000
            }
        }))
    }

    private markNotificationsAsViewed(): void {
        // Remove notification badge when notifications are viewed
        const badge = this.container?.querySelector('#notification-badge')
        if (badge) {
            badge.classList.add('viewed')
        }
    }

    private async handleResendVerification(): Promise<void> {
        const button = this.container?.querySelector('#resend-verification-btn') as HTMLButtonElement
        if (!button) return

        const originalText = button.textContent
        button.disabled = true
        button.textContent = 'Wysyłanie...'

        try {
            await authService.resendVerification()
            button.textContent = 'Wysłano!'

            setTimeout(() => {
                button.textContent = originalText
                button.disabled = false
            }, 3000)

        } catch (error) {
            console.error('Resend verification error:', error)
            button.textContent = 'Błąd'

            setTimeout(() => {
                button.textContent = originalText
                button.disabled = false
            }, 3000)
        }
    }

    private handleDisabledItemClick(event: Event): void {
        event.preventDefault()

        const item = event.currentTarget as HTMLElement
        const text = item.querySelector('.item-text')?.textContent || 'Ta funkcja'

        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${text} będzie dostępna wkrótce!`,
                duration: 3000
            }
        }))

        // Visual feedback
        item.classList.add('clicked')
        setTimeout(() => {
            item.classList.remove('clicked')
        }, 200)
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