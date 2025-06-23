// resources/ts/main.ts
import '../css/app.css'
import { Router } from '@/router'
import { authService } from '@services/AuthService'

class Application {
    private router: Router

    constructor() {
        this.router = new Router()
    }

    async init(): Promise<void> {
        try {
            console.log('🚀 Initializing Platforma Lektorów SPA...')

            // Initialize CSRF token
            this.initCSRF()

            // Initialize authentication state
            await this.initAuth()

            // Initialize global event listeners
            this.initEventListeners()

            // Initialize notification system
            this.initNotifications()

            // Initialize router
            await this.router.init()

            // Set app as ready - ZMIANA: bezpośrednio na body
            document.body.classList.add('app-ready')

            console.log('✅ Application initialized successfully')

        } catch (error) {
            console.error('❌ Application initialization failed:', error)
            this.showError('Błąd podczas inicjalizacji aplikacji')
        }
    }

    private initCSRF(): void {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        if (token) {
            // Store CSRF token for API requests
            ;(window as any).__CSRF_TOKEN__ = token
        }
    }

    private async initAuth(): Promise<void> {
        try {
            // Try to get current user if token exists
            if (authService.getToken()) {
                await authService.getCurrentUser()
            }
        } catch (error) {
            console.warn('Auth initialization failed, user will need to login')
        }
    }

    private initEventListeners(): void {
        // Global click handler for navigation
        document.addEventListener('click', this.handleGlobalClick.bind(this))

        // Browser back/forward navigation
        window.addEventListener('popstate', this.handlePopState.bind(this))

        // Auth state changes
        document.addEventListener('auth:change', this.handleAuthChange.bind(this) as EventListener)

        // Global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this))

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))

        // Network status
        window.addEventListener('online', () => this.showNotification('Połączenie przywrócone', 'success'))
        window.addEventListener('offline', () => this.showNotification('Brak połączenia internetowego', 'warning'))

        // Logout event
        document.addEventListener('app:logout', async () => {
            await authService.logout()
            this.router.navigate('/login')
        })
    }

    private initNotifications(): void {
        // Create notification container
        const container = document.createElement('div')
        container.id = 'notification-container'
        container.className = 'notification-container'
        document.body.appendChild(container)

        // Listen for notification events
        document.addEventListener('notification:show', this.handleNotification.bind(this) as EventListener)
    }

    private handleGlobalClick(event: Event): void {
        const target = event.target as HTMLElement
        const link = target.closest('a[href]') as HTMLAnchorElement

        if (link && this.shouldHandleInternally(link)) {
            event.preventDefault()
            this.router.navigate(link.pathname + link.search + link.hash)
        }
    }

    private shouldHandleInternally(link: HTMLAnchorElement): boolean {
        // Don't handle external links
        if (link.hostname !== window.location.hostname) return false

        // Don't handle download links
        if (link.hasAttribute('download')) return false

        // Don't handle target="_blank" links
        if (link.target === '_blank') return false

        // Don't handle API or asset links
        if (link.pathname.startsWith('/api/') || link.pathname.startsWith('/storage/')) return false

        return true
    }

    private handlePopState(event: PopStateEvent): void {
        this.router.handlePopState(event)
    }

    private handleAuthChange(event: Event): void {
        const customEvent = event as CustomEvent
        const { type, isAuthenticated } = customEvent.detail || {}

        // Update body classes for CSS targeting
        document.body.classList.toggle('user-authenticated', isAuthenticated)
        document.body.classList.toggle('user-guest', !isAuthenticated)

        console.log(`Auth state changed: ${type}, authenticated: ${isAuthenticated}`)

        // Jeśli użytkownik został wylogowany i jest na chronionej stronie
        if (!isAuthenticated && type === 'logout') {
            const currentPath = window.location.pathname
            const protectedPaths = ['/admin', '/moderator', '/tutor', '/student', '/profile', '/settings']

            if (protectedPaths.some(path => currentPath.startsWith(path))) {
                console.log('🔒 User logged out from protected route, redirecting to home...')
                this.router.navigate('/')
            }
        }

        // Jeśli użytkownik się zalogował, odśwież stronę aby zaktualizować nawigację
        if (isAuthenticated && (type === 'login' || type === 'register')) {
            // Opcjonalnie: możesz przekierować na odpowiedni dashboard
            const user = customEvent.detail.user
            if (user && window.location.pathname === '/') {
                const dashboardRoute = `/${user.role}/dashboard`
                console.log(`🏠 Redirecting to dashboard: ${dashboardRoute}`)
                this.router.navigate(dashboardRoute)
            }
        }
    }

    private handleGlobalError(event: ErrorEvent): void {
        console.error('Global error:', event.error)
        this.showError('Wystąpił nieoczekiwany błąd')
    }

    private handleUnhandledRejection(event: PromiseRejectionEvent): void {
        console.error('Unhandled promise rejection:', event.reason)
        this.showError('Wystąpił błąd podczas wykonywania operacji')
    }

    private handleNotification(event: Event): void {
        const customEvent = event as CustomEvent
        const { type, message, duration = 5000 } = customEvent.detail || {}
        this.showNotification(message, type, duration)
    }

    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000): void {
        const container = document.getElementById('notification-container')
        if (!container) return

        const notification = document.createElement('div')
        notification.className = `notification-toast ${type} fade-in`

        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        }

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${iconMap[type]}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Zamknij">×</button>
            </div>
        `

        // Add to container
        container.appendChild(notification)

        // Auto remove
        const timer = setTimeout(() => {
            this.removeNotification(notification)
        }, duration)

        // Manual close
        const closeBtn = notification.querySelector('.notification-close')
        closeBtn?.addEventListener('click', () => {
            clearTimeout(timer)
            this.removeNotification(notification)
        })
    }

    private removeNotification(notification: HTMLElement): void {
        notification.style.opacity = '0'
        notification.style.transform = 'translateX(100%)'

        setTimeout(() => {
            notification.remove()
        }, 300)
    }

    private showError(message: string): void {
        this.showNotification(message, 'error')
    }
}

// Global type augmentations
declare global {
    interface Window {
        __CSRF_TOKEN__: string
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new Application()
    await app.init()
})

// Hot module replacement for development
if (import.meta.hot) {
    import.meta.hot.accept()
}