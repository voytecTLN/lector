// resources/ts/router/Router.ts

import { authService } from '@services/AuthService'
import type { User } from '@/types/auth'

export interface Route {
    path: string
    component: string
    requiresAuth?: boolean
    requiresVerification?: boolean
    roles?: string[]
    title?: string
}

export class Router {
    private routes: Route[] = []
    private currentRoute: Route | null = null
    private appContainer: HTMLElement | null = null

    constructor() {
        this.appContainer = document.getElementById('app')
        this.initializeRoutes()
        this.setupEventListeners()
    }

    private initializeRoutes(): void {
        this.routes = [
            // Public routes
            {
                path: '/',
                component: 'HomePage',
                title: 'Platforma Lektorów'
            },
            {
                path: '/login',
                component: 'LoginPage',
                title: 'Zaloguj się'
            },
            {
                path: '/register',
                component: 'RegisterPage',
                title: 'Zarejestruj się'
            },
            {
                path: '/forgot-password',
                component: 'ForgotPasswordPage',
                title: 'Resetuj hasło'
            },

            // Protected routes
            {
                path: '/dashboard',
                component: 'DashboardPage',
                requiresAuth: true,
                requiresVerification: true,
                title: 'Dashboard'
            },
            {
                path: '/admin',
                component: 'AdminDashboard',
                requiresAuth: true,
                requiresVerification: true,
                roles: ['admin'],
                title: 'Panel Administratora'
            },
            {
                path: '/admin/users',
                component: 'AdminUsersPage',
                requiresAuth: true,
                requiresVerification: true,
                roles: ['admin'],
                title: 'Zarządzanie użytkownikami'
            },
            {
                path: '/moderator',
                component: 'ModeratorDashboard',
                requiresAuth: true,
                requiresVerification: true,
                roles: ['moderator', 'admin'],
                title: 'Panel Moderatora'
            },
            {
                path: '/tutor',
                component: 'TutorDashboard',
                requiresAuth: true,
                requiresVerification: true,
                roles: ['tutor', 'admin'],
                title: 'Panel Lektora'
            },
            {
                path: '/tutor/lessons',
                component: 'TutorLessonsPage',
                requiresAuth: true,
                requiresVerification: true,
                roles: ['tutor', 'admin'],
                title: 'Moje lekcje'
            },
            {
                path: '/student',
                component: 'StudentDashboard',
                requiresAuth: true,
                requiresVerification: true,
                roles: ['student', 'admin'],
                title: 'Panel Studenta'
            },
            {
                path: '/student/lessons',
                component: 'StudentLessonsPage',
                requiresAuth: true,
                requiresVerification: true,
                roles: ['student', 'admin'],
                title: 'Moje lekcje'
            },
            {
                path: '/profile',
                component: 'ProfilePage',
                requiresAuth: true,
                requiresVerification: true,
                title: 'Profil'
            }
        ]
    }

    private setupEventListeners(): void {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname, false)
        })

        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = (e.target as HTMLElement).closest('a[data-link]')
            if (link) {
                e.preventDefault()
                const href = link.getAttribute('href')
                if (href) {
                    this.navigate(href)
                }
            }
        })
    }

    public async navigate(path: string, pushState: boolean = true): Promise<void> {
        const route = this.findRoute(path)

        if (!route) {
            console.warn(`Route not found: ${path}`)
            this.navigate('/404', false)
            return
        }

        // Check authentication and authorization
        const canAccess = await this.checkAccess(route)
        if (!canAccess) {
            return // checkAccess handles redirects
        }

        // Update browser history
        if (pushState) {
            window.history.pushState({}, '', path)
        }

        // Update page title
        document.title = route.title || 'Platforma Lektorów'

        // Store current route
        this.currentRoute = route

        // Render component
        await this.renderComponent(route.component)

        // Dispatch route change event
        this.dispatchRouteChange(route, path)
    }

    private findRoute(path: string): Route | null {
        // Exact match first
        let route = this.routes.find(r => r.path === path)

        if (!route) {
            // Try partial matches for dynamic routes
            route = this.routes.find(r => {
                if (r.path.includes('{') || path.startsWith(r.path.replace('/{any?}', ''))) {
                    return true
                }
                return false
            })
        }

        return route || null
    }

    private async checkAccess(route: Route): Promise<boolean> {
        const user = authService.getUser()
        const isAuthenticated = authService.isAuthenticated()

        // Check authentication
        if (route.requiresAuth && !isAuthenticated) {
            this.navigate('/login', false)
            return false
        }

        // Check verification
        if (route.requiresVerification && (!user || !authService.isVerified())) {
            this.showNotification('warning', 'Wymagana weryfikacja adresu email')
            return false
        }

        // Check roles
        if (route.roles && user && !authService.hasAnyRole(route.roles)) {
            this.navigate('/unauthorized', false)
            return false
        }

        // Redirect authenticated users away from auth pages
        if (!route.requiresAuth && isAuthenticated && ['LoginPage', 'RegisterPage'].includes(route.component)) {
            this.redirectToDashboard(user)
            return false
        }

        return true
    }

    private redirectToDashboard(user: User | null): void {
        if (!user) return

        const dashboardRoutes = {
            'admin': '/admin',
            'moderator': '/moderator',
            'tutor': '/tutor',
            'student': '/student'
        }

        const redirectPath = dashboardRoutes[user.role as keyof typeof dashboardRoutes] || '/dashboard'
        this.navigate(redirectPath, false)
    }

    private async renderComponent(componentName: string): Promise<void> {
        if (!this.appContainer) return

        // Show loading state
        this.showLoading()

        try {
            // Dynamic import of component
            const component = await this.loadComponent(componentName)

            if (component) {
                // Clear app container
                this.appContainer.innerHTML = ''

                // Render component
                component.render(this.appContainer)

                // Hide loading state
                this.hideLoading()
            } else {
                throw new Error(`Component ${componentName} not found`)
            }

        } catch (error) {
            console.error('Error rendering component:', error)
            this.showError('Błąd podczas ładowania strony')
        }
    }

    private async loadComponent(componentName: string): Promise<any> {
        try {
            // Dynamic imports for components
            switch (componentName) {
                case 'HomePage':
                    const { HomePage } = await import('@/pages/HomePage')
                    return new HomePage()

                case 'LoginPage':
                    const { LoginPage } = await import('@/pages/LoginPage')
                    return new LoginPage()

                case 'RegisterPage':
                    const { RegisterPage } = await import('@/pages/RegisterPage')
                    return new RegisterPage()

                case 'DashboardPage':
                    const { DashboardPage } = await import('@/pages/DashboardPage')
                    return new DashboardPage()

                case 'AdminDashboard':
                    const { AdminDashboard } = await import('@/pages/AdminDashboard')
                    return new AdminDashboard()

                case 'StudentDashboard':
                    const { StudentDashboard } = await import('@/pages/StudentDashboard')
                    return new StudentDashboard()

                case 'TutorDashboard':
                    const { TutorDashboard } = await import('@/pages/TutorDashboard')
                    return new TutorDashboard()

                case 'ModeratorDashboard':
                    const { ModeratorDashboard } = await import('@/pages/ModeratorDashboard')
                    return new ModeratorDashboard()

                default:
                    return null
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error)
            return null
        }
    }

    private showLoading(): void {
        document.body.classList.remove('app-ready')
        const loading = document.getElementById('app-loading')
        if (loading) {
            loading.style.display = 'flex'
        }
    }

    private hideLoading(): void {
        document.body.classList.add('app-ready')
        const loading = document.getElementById('app-loading')
        if (loading) {
            loading.style.display = 'none'
        }
    }

    private showError(message: string): void {
        this.hideLoading()
        if (this.appContainer) {
            this.appContainer.innerHTML = `
                <div class="error-page">
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Ups! Coś poszło nie tak</h2>
                        <p>${message}</p>
                        <button onclick="window.location.reload()" class="btn btn-primary">
                            Odśwież stronę
                        </button>
                    </div>
                </div>
            `
        }
    }

    private showNotification(type: string, message: string): void {
        // Create notification
        const notification = document.createElement('div')
        notification.className = `notification-toast ${type}`
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `

        // Add to container
        const container = document.getElementById('notification-container')
        if (container) {
            container.appendChild(notification)

            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.remove()
            }, 5000)
        }
    }

    private getNotificationIcon(type: string): string {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        }
        return icons[type as keyof typeof icons] || 'info-circle'
    }

    private dispatchRouteChange(route: Route, path: string): void {
        window.dispatchEvent(new CustomEvent('route:change', {
            detail: { route, path }
        }))
    }

    // Public methods
    public getCurrentRoute(): Route | null {
        return this.currentRoute
    }

    public init(): void {
        // Initialize router with current path
        this.navigate(window.location.pathname, false)
    }
}

// Create global router instance
export const router = new Router()