// resources/ts/components/App.ts
import { AppState } from '@/utils/appState'
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@/router/routes'

export class App implements RouteComponent {
    private appState: AppState
    private currentLayout: string = 'guest'
    private container: HTMLElement | null = null
    private layoutComponents: Map<string, any> = new Map()

    constructor() {
        this.appState = new AppState()
        this.initEventListeners()
    }

    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        container.id = 'app-root'
        container.className = 'app-container'

        // Initial layout based on auth state
        const layout = this.determineLayout()
        await this.renderLayout(container, layout)

        this.container = container
        return container
    }

    mount(container: HTMLElement): void {
        this.container = container
        console.log('✅ App component mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 App component unmounted')
    }

    onBeforeEnter(): boolean {
        console.log('🔄 App: Before enter')
        return true
    }

    onAfterEnter(): void {
        console.log('✅ App: After enter')
        this.updateLayoutBasedOnRoute()
    }

    onBeforeLeave(): boolean {
        console.log('🔄 App: Before leave')
        return true
    }

    onAfterLeave(): void {
        console.log('👋 App: After leave')
        this.cleanup()
    }

    private initEventListeners(): void {
        // Listen for auth changes
        this.appState.onAuthChange(({ isAuthenticated, user }) => {
            this.handleAuthChange(isAuthenticated, user)
        })

        // Listen for route changes
        this.appState.onRouteChange((route) => {
            this.handleRouteChange(route)
        })

        // Listen for theme changes
        this.appState.onThemeChange((theme) => {
            this.handleThemeChange(theme)
        })
    }

    private determineLayout(): string {
        const currentPath = window.location.pathname
        const isAuthenticated = authService.isAuthenticated()

        // Auth pages (login, register, etc.)
        if (this.isAuthRoute(currentPath)) {
            return 'auth'
        }

        // Protected pages
        if (isAuthenticated && this.isProtectedRoute(currentPath)) {
            return 'app'
        }

        // Public pages
        return 'guest'
    }

    private isAuthRoute(path: string): boolean {
        const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
        return authRoutes.some(route => path.startsWith(route))
    }

    private isProtectedRoute(path: string): boolean {
        const protectedRoutes = ['/admin', '/moderator', '/tutor', '/student', '/profile']
        return protectedRoutes.some(route => path.startsWith(route))
    }

    private async renderLayout(container: HTMLElement, layoutType: string): Promise<void> {
        // Clear container
        container.innerHTML = ''
        container.className = `app-container layout-${layoutType}`

        try {
            let layoutComponent

            switch (layoutType) {
                case 'app':
                    const { AppLayout } = await import('@/components/layouts/AppLayout')
                    layoutComponent = new AppLayout()
                    break

                case 'auth':
                    const { AuthLayout } = await import('@/components/layouts/AuthLayout')
                    layoutComponent = new AuthLayout()
                    break

                case 'guest':
                default:
                    const { GuestLayout } = await import('@/components/layouts/GuestLayout')
                    layoutComponent = new GuestLayout()
                    break
            }

            // Store reference to current layout
            this.layoutComponents.set(layoutType, layoutComponent)

            // Render layout
            const layoutElement = await layoutComponent.render()
            container.appendChild(layoutElement)

            // Mount layout
            if (layoutComponent.mount) {
                layoutComponent.mount(container)
            }

            this.currentLayout = layoutType

            console.log(`✅ Layout rendered: ${layoutType}`)

        } catch (error) {
            console.error(`❌ Failed to render layout: ${layoutType}`, error)
            this.renderErrorLayout(container)
        }
    }

    private renderErrorLayout(container: HTMLElement): void {
        container.innerHTML = `
            <div class="error-layout">
                <div class="error-container">
                    <h1>Błąd aplikacji</h1>
                    <p>Wystąpił błąd podczas ładowania interfejsu.</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Odśwież stronę
                    </button>
                </div>
            </div>
        `
    }

    private async handleAuthChange(isAuthenticated: boolean, user: any): Promise<void> {
        console.log('🔄 App: Auth state changed', { isAuthenticated, user })

        // Update body classes
        document.body.classList.toggle('user-authenticated', isAuthenticated)
        document.body.classList.toggle('user-guest', !isAuthenticated)

        // Update layout if needed
        const newLayout = this.determineLayout()
        if (newLayout !== this.currentLayout && this.container) {
            await this.renderLayout(this.container, newLayout)
        }
    }

    private async handleRouteChange(route: string): Promise<void> {
        console.log('🔄 App: Route changed', route)

        // Update layout if needed
        const newLayout = this.determineLayout()
        if (newLayout !== this.currentLayout && this.container) {
            await this.renderLayout(this.container, newLayout)
        }

        // Update active route classes
        this.updateRouteClasses(route)
    }

    private handleThemeChange(theme: 'light' | 'dark'): void {
        console.log('🎨 App: Theme changed', theme)
        document.body.classList.toggle('dark-theme', theme === 'dark')
    }

    private updateLayoutBasedOnRoute(): void {
        const newLayout = this.determineLayout()
        if (newLayout !== this.currentLayout && this.container) {
            this.renderLayout(this.container, newLayout)
        }
    }

    private updateRouteClasses(route: string): void {
        // Remove old route classes
        document.body.className = document.body.className
            .split(' ')
            .filter(cls => !cls.startsWith('route-'))
            .join(' ')

        // Add new route class
        const routeClass = route
            .replace(/^\//, '')
            .replace(/\//g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '') || 'home'

        document.body.classList.add(`route-${routeClass}`)
    }

    private cleanup(): void {
        // Cleanup layout components
        this.layoutComponents.forEach((component, layout) => {
            if (component.unmount) {
                component.unmount()
            }
        })
        this.layoutComponents.clear()
    }
}