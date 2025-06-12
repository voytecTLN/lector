// resources/ts/router/index.ts
import { BrowserHistory } from './history'
import { routes, RouteMatcher, type RouteDefinition, type MatchedRoute } from './routes'
import { defaultGuards, type RouteGuard, type GuardResult } from './guards'

export class Router {
    private history: BrowserHistory
    private currentRoute: MatchedRoute | null = null
    private appContainer: HTMLElement | null = null
    private guards: RouteGuard[] = []
    private isNavigating: boolean = false

    constructor() {
        this.history = new BrowserHistory()
        this.guards = [...defaultGuards]
    }

    async init(): Promise<void> {
        console.log('🧭 Initializing Router...')

        // Find app container
        this.appContainer = document.getElementById('app')
        if (!this.appContainer) {
            throw new Error('App container not found. Make sure you have <div id="app"></div> in your HTML.')
        }

        // Listen to history changes
        this.history.addListener(this.handleRouteChange.bind(this))

        // Handle initial route
        await this.handleRouteChange(this.history.getCurrentPath())

        console.log('✅ Router initialized')
    }

    async navigate(path: string, replace: boolean = false): Promise<boolean> {
        if (this.isNavigating) {
            console.warn('Navigation already in progress, ignoring new navigation')
            return false
        }

        console.log(`🧭 Navigating to: ${path}`)

        try {
            this.isNavigating = true

            // Match route
            const matchedRoute = RouteMatcher.match(path, routes)
            if (!matchedRoute) {
                console.error(`Route not found: ${path}`)
                return false
            }

            // Run guards
            const guardResult = await this.runGuards(matchedRoute)
            if (!guardResult.allowed) {
                if (guardResult.redirect) {
                    // Prevent infinite redirects
                    if (guardResult.redirect !== path) {
                        return this.navigate(guardResult.redirect, true)
                    }
                }
                if (guardResult.message) {
                    this.showNotification(guardResult.message, 'warning')
                }
                return false
            }

            // Load component
            try {
                matchedRoute.component = await matchedRoute.route.component()
            } catch (error) {
                console.error('Failed to load route component:', error)
                this.showNotification('Błąd podczas ładowania strony', 'error')
                return false
            }

            // Execute component lifecycle hooks
            if (matchedRoute.component.onBeforeEnter) {
                const canEnter = await matchedRoute.component.onBeforeEnter()
                if (canEnter === false) {
                    return false
                }
            }

            // Update browser history
            if (replace) {
                this.history.replace(path, matchedRoute.route.title)
            } else {
                this.history.push(path, matchedRoute.route.title)
            }

            // Render route
            await this.renderRoute(matchedRoute)

            return true

        } catch (error) {
            console.error('Navigation error:', error)
            this.showNotification('Błąd podczas nawigacji', 'error')
            return false
        } finally {
            this.isNavigating = false
        }
    }

    async handleRouteChange(path: string): Promise<void> {
        if (this.isNavigating) return

        await this.navigate(path, true)
    }

    handlePopState(event: PopStateEvent): void {
        // This is handled by BrowserHistory and will trigger handleRouteChange
    }

    private async runGuards(route: MatchedRoute): Promise<GuardResult> {
        const context = {
            to: route,
            from: this.currentRoute || undefined
        }

        // Run route-specific guards first
        if (route.route.guards) {
            for (const guard of route.route.guards) {
                const result = await guard.execute(context)
                if (!result.allowed) {
                    return result
                }
            }
        }

        // Run default guards
        for (const guard of this.guards) {
            const result = await guard.execute(context)
            if (!result.allowed) {
                return result
            }
        }

        return { allowed: true }
    }

    private async renderRoute(matchedRoute: MatchedRoute): Promise<void> {
        if (!this.appContainer) return

        // Cleanup previous route
        if (this.currentRoute?.component?.onBeforeLeave) {
            const canLeave = await this.currentRoute.component.onBeforeLeave()
            if (canLeave === false) {
                return
            }
        }

        // Unmount previous component
        if (this.currentRoute?.component?.unmount) {
            this.currentRoute.component.unmount()
        }

        // Show loading state
        this.showLoadingState()

        try {
            // Render new component
            const element = await matchedRoute.component.render()

            // Clear container and add new content
            this.appContainer.innerHTML = ''
            this.appContainer.appendChild(element)

            // Mount component
            if (matchedRoute.component.mount) {
                matchedRoute.component.mount(this.appContainer)
            }

            // Update current route
            this.currentRoute = matchedRoute

            // Execute after enter hook
            if (matchedRoute.component.onAfterEnter) {
                matchedRoute.component.onAfterEnter()
            }

            // Update document title
            if (matchedRoute.route.title) {
                document.title = matchedRoute.route.title
            }

            // Update body classes for layout
            this.updateBodyClasses(matchedRoute)

            // Execute after leave hook for previous route
            if (this.currentRoute?.component?.onAfterLeave) {
                this.currentRoute.component.onAfterLeave()
            }

            // Hide loading state
            this.hideLoadingState()

            console.log(`✅ Route rendered: ${matchedRoute.route.name}`)

        } catch (error) {
            console.error('Route rendering error:', error)
            this.hideLoadingState()
            this.showNotification('Błąd podczas renderowania strony', 'error')

            // Try to render error page
            await this.navigate('/not-found', true)
        }
    }

    private updateBodyClasses(route: MatchedRoute): void {
        // Remove old route classes
        document.body.className = document.body.className
            .split(' ')
            .filter(cls => !cls.startsWith('route-'))
            .join(' ')

        // Add new route class
        const routeClass = `route-${route.route.name.replace(/\./g, '-')}`
        document.body.classList.add(routeClass)

        // Add layout class
        const layout = route.route.meta?.layout || 'guest'
        document.body.classList.add(`layout-${layout}`)
    }

    private showLoadingState(): void {
        if (this.appContainer) {
            this.appContainer.classList.add('loading')
        }
    }

    private hideLoadingState(): void {
        if (this.appContainer) {
            this.appContainer.classList.remove('loading')
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: { message, type }
        }))
    }

    // Public API methods
    getCurrentRoute(): MatchedRoute | null {
        return this.currentRoute
    }

    addGuard(guard: RouteGuard): void {
        this.guards.push(guard)
    }

    removeGuard(guardName: string): void {
        this.guards = this.guards.filter(guard => guard.name !== guardName)
    }

    // Helper methods for navigation
    async goBack(): Promise<void> {
        this.history.back()
    }

    async goForward(): Promise<void> {
        this.history.forward()
    }

    async reload(): Promise<void> {
        if (this.currentRoute) {
            await this.navigate(this.history.getCurrentPath(), true)
        }
    }

    // Route building helpers
    buildPath(routeName: string, params?: Record<string, string>, query?: Record<string, string>): string {
        return RouteMatcher.buildPath(routeName, params, query)
    }

    // Check if route is active
    isRouteActive(routeName: string, params?: Record<string, string>): boolean {
        if (!this.currentRoute) return false

        if (this.currentRoute.route.name !== routeName) return false

        if (params) {
            return Object.entries(params).every(([key, value]) =>
                this.currentRoute?.params[key] === value
            )
        }

        return true
    }
}

// Export router instance
export * from './routes'
export * from './guards'
export * from './history'