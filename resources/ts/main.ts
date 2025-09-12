// resources/ts/main.ts
import '../css/app.css'
import { Router } from '@/router'
import { authService } from '@services/AuthService'
import { NavigationUtils } from '@/utils/navigation'
import Logger from '@/utils/logger'

class Application {
    private router: Router

    constructor() {
        this.router = new Router()
    }

    async init(): Promise<void> {
        try {
            Logger.info('Initializing Platforma Lektorów SPA...')

            // Initialize CSRF token
            this.initCSRF()

            // Initialize router but don't handle initial route yet
            await this.router.init(false) // Pass false to skip initial navigation

            // Initialize unified navigation system  
            NavigationUtils.init(this.router)

            // Initialize authentication state first
            await this.initAuth()
            
            // Now handle the initial route after auth is resolved
            await this.router.handleInitialRoute()

            // Initialize global event listeners
            this.initEventListeners()

            // Initialize notification system
            this.initNotifications()

            window.router = this.router

            // Enable debug mode in development
            if (import.meta.env.DEV) {
                this.router.debugRouting(true)
            }

            // Set app as ready - ZMIANA: bezpośrednio na body
            document.body.classList.add('app-ready')

            Logger.info('Application initialized successfully')

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
                Logger.auth('Token found, verifying with server...')
                await authService.getCurrentUser()
                Logger.auth('User authenticated successfully')
            } else {
                Logger.auth('No token found, user is not authenticated')
            }
        } catch (error: any) {
            console.warn('⚠️ Auth initialization failed:', error.message)
            // For 401/403 errors or "Unauthenticated" messages, clear auth data
            if (error.message?.includes('401') || 
                error.message?.includes('403') || 
                error.message?.includes('Unauthenticated')) {
                Logger.warn('Clearing invalid auth data')
                // Don't call logout API, just clear local data
                localStorage.removeItem('auth_token')
                localStorage.removeItem('auth_user')
                localStorage.removeItem('auth_permissions')
            } else {
                Logger.warn('Network error during auth check, keeping existing auth data')
            }
        }
    }

    private initEventListeners(): void {
        // Global click handler for navigation
        document.addEventListener('click', this.handleGlobalClick.bind(this))

        // Browser back/forward navigation
        window.addEventListener('popstate', this.handlePopState.bind(this))

        window.addEventListener('hashchange', (event) => {
            Logger.debug('Hash changed:', {
                oldURL: event.oldURL,
                newURL: event.newURL,
                newHash: window.location.hash
            })
        })

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
        document.addEventListener('app:logout', this.handleLogout.bind(this))
    }

    private async handleLogout(): Promise<void> {
        Logger.debug('Handling logout event')
        await authService.logout()
        Logger.debug('Logout complete, navigating to login')
        this.router.navigate('/login')
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

            // Handle hash links
            if (link.href.includes('#/')) {
                const hashIndex = link.href.indexOf('#/')
                const hashPath = link.href.substring(hashIndex + 1) // Get part after #
                Logger.debug('Navigating to hash path:', hashPath)
                this.router.navigate(hashPath)
            } else {
                this.router.navigate(link.pathname + link.search + link.hash)
            }
        }
    }

    private shouldHandleInternally(link: HTMLAnchorElement): boolean {
        // Zewnętrzne linki
        if (link.hostname !== window.location.hostname) return false

        // Pliki do pobrania
        if (link.hasAttribute('download')) return false

        // Nowe okno
        if (link.target === '_blank') return false

        // API i zasoby
        if (link.pathname.startsWith('/api/') ||
            link.pathname.startsWith('/storage/')) return false

        // Wszystkie wewnętrzne linki powinny być obsługiwane
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

        Logger.debug(`Auth state changed: ${type}, authenticated: ${isAuthenticated}`)

        // Jeśli użytkownik został wylogowany i jest na chronionej stronie
        if (!isAuthenticated && type === 'logout') {
            const currentPath = window.location.pathname
            const protectedPaths = ['/admin', '/moderator', '/tutor', '/student', '/profile', '/settings']

            if (protectedPaths.some(path => currentPath.startsWith(path))) {
                Logger.debug('User logged out from protected route, redirecting to home...')
                this.router.navigate('/')
            }
        }

        // Jeśli użytkownik się zalogował, odśwież stronę aby zaktualizować nawigację
        if (isAuthenticated && (type === 'login' || type === 'register')) {
            // Opcjonalnie: możesz przekierować na odpowiedni dashboard
            const user = customEvent.detail.user
            if (user && window.location.pathname === '/') {
                const dashboardRoute = `/${user.role}/dashboard`
                Logger.debug(`Redirecting to dashboard: ${dashboardRoute}`)
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

declare global {
    interface Window {
        __CSRF_TOKEN__: string
        router?: Router  // NOWE
        __ROUTER_DEBUG__?: boolean  // NOWE
    }
}