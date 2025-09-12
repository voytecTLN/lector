// resources/ts/router/index.ts
import { BrowserHistory } from './history'
import { routes, RouteMatcher, type RouteDefinition, type MatchedRoute } from './routes'
import { defaultGuards, type RouteGuard, type GuardResult } from './guards'
import { RouteUtils } from '@/config/routing'
import Logger from '@/utils/logger'

export class Router {
    private history: BrowserHistory
    private currentRoute: MatchedRoute | null = null
    private appContainer: HTMLElement | null = null
    private guards: RouteGuard[] = []
    private isNavigating: boolean = false
    private navigationQueue: Array<() => Promise<void>> = []
    private intendedUrl: string | null = null
    private guardExecutions: Map<string, number> = new Map()
    private maxNavigationQueue: number = 10

    constructor() {
        this.history = new BrowserHistory()
        this.guards = [...defaultGuards]
    }

    async init(handleInitialRoute: boolean = true): Promise<void> {
        // Find app container
        this.appContainer = document.getElementById('app')
        if (!this.appContainer) {
            throw new Error('App container not found')
        }

        // Listen to history changes
        this.history.addListener((path, state) => {
            this.handleRouteChange(path)
        })

        // Listen to hash changes
        window.addEventListener('hashchange', () => {
            const currentPath = this.history.getCurrentPath()
            this.handleRouteChange(currentPath)
        })

        // Handle initial route only if requested
        if (handleInitialRoute) {
            await this.handleRouteChange(this.history.getCurrentPath())
        }
    }

    async handleInitialRoute(): Promise<void> {
        // Handle the initial route after auth is resolved
        await this.handleRouteChange(this.history.getCurrentPath())
    }

    async navigate(path: string, replace: boolean = false): Promise<boolean> {
        // Normalize path using RouteUtils
        const normalizedPath = RouteUtils.normalize(path)

        // Queue navigation if already navigating (with queue size limit)
        if (this.isNavigating) {
            if (this.navigationQueue.length >= this.maxNavigationQueue) {
                this.navigationQueue.shift()
            }
            
            return new Promise((resolve) => {
                this.navigationQueue.push(async () => {
                    const result = await this.navigate(normalizedPath, replace)
                    resolve(result)
                })
            })
        }

        try {
            this.isNavigating = true

            // Match route
            const matchedRoute = RouteMatcher.match(normalizedPath, routes)

            if (!matchedRoute) {
                await this.handleNotFound(normalizedPath)
                return false
            }

            // Run guards BEFORE loading component
            const guardResult = await this.runGuards(matchedRoute)
            if (!guardResult.allowed) {
                if (guardResult.redirect) {
                    // Prevent infinite redirects
                    if (guardResult.redirect !== path) {
                        return this.navigate(guardResult.redirect, true)
                    } else {
                        await this.handleNotFound(path)
                        return false
                    }
                }

                if (guardResult.message) {
                    this.showNotification(guardResult.message, 'warning')
                }
                return false
            }

            // Load component
            try {
                const ComponentClass = await matchedRoute.route.component()

                // Check if ComponentClass is already an instance (has render method)
                if (typeof ComponentClass.render === 'function') {
                    // Already an instance
                    matchedRoute.component = ComponentClass
                } else if (matchedRoute.params && Object.keys(matchedRoute.params).length > 0) {
                    // Pass params to component constructor if it has params
                    matchedRoute.component = new (ComponentClass as any)(matchedRoute.params)
                } else {
                    // No params, instantiate normally
                    matchedRoute.component = new (ComponentClass as any)()
                }
            } catch (error) {
                console.error('Failed to load route component:', error)
                this.showNotification('Błąd podczas ładowania strony', 'error')
                await this.handleNotFound(path)
                return false
            }

            // Execute component lifecycle hooks
            if (matchedRoute.component.onBeforeEnter) {
                try {
                    const canEnter = await matchedRoute.component.onBeforeEnter()
                    if (canEnter === false) {
                        return false
                    }
                } catch (error) {
                    console.error('Error in onBeforeEnter:', error)
                    return false
                }
            }

            // Update browser history
            if (replace) {
                this.history.replace(normalizedPath, matchedRoute.route.title)
            } else {
                this.history.push(normalizedPath, matchedRoute.route.title)
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
            // Process queue
            if (this.navigationQueue.length > 0) {
                const nextNavigation = this.navigationQueue.shift()
                if (nextNavigation) {
                    setTimeout(nextNavigation, 0)
                }
            }
        }
    }

    async handleRouteChange(path: string): Promise<void> {
        if (this.isNavigating) return

        let routePath = path
        if (window.location.hash && window.location.hash.startsWith('#/')) {
            routePath = window.location.hash.substring(1)
        }

        await this.navigate(routePath, true)
    }

    handlePopState(event: PopStateEvent): void {
        // This is handled by BrowserHistory and will trigger handleRouteChange
    }

    private async runGuards(route: MatchedRoute): Promise<GuardResult> {
        const context = {
            to: route,
            from: this.currentRoute || undefined
        }

        // Reset guard execution tracking (clear old executions to prevent memory leak)
        if (this.guardExecutions.size > 50) {
            this.guardExecutions.clear()
        }

        // Run route-specific guards first (if any)
        if (route.route.guards && route.route.guards.length > 0) {
            for (const guard of route.route.guards) {
                try {
                    const result = await guard.execute(context)
                    if (!result.allowed) {
                        return result
                    }
                } catch (error) {
                    console.error(`Error in route guard '${guard.name}':`, error)
                    return {
                        allowed: false,
                        message: `Błąd w guard: ${guard.name}`
                    }
                }
            }
        }

        // Run global guards
        for (const guard of this.guards) {
            try {
                const result = await guard.execute(context)
                if (!result.allowed) {
                    return result
                }
            } catch (error) {
                console.error(`Error in global guard '${guard.name}':`, error)
                return {
                    allowed: false,
                    message: `Błąd w guard: ${guard.name}`
                }
            }
        }

        return { allowed: true }
    }

    private async renderRoute(matchedRoute: MatchedRoute): Promise<void> {
        if (!this.appContainer) return

        // Cleanup previous route
        if (this.currentRoute?.component?.onBeforeLeave) {
            try {
                const canLeave = await this.currentRoute.component.onBeforeLeave()
                if (canLeave === false) {
                    return
                }
            } catch (error) {
                console.error('Error in onBeforeLeave:', error)
            }
        }

        // Unmount previous component (skip if it's the same component instance - singleton pattern)
        if (this.currentRoute?.component?.unmount && this.currentRoute.component !== matchedRoute.component) {
            try {
                this.currentRoute.component.unmount()
            } catch (error) {
                console.error('Error unmounting component:', error)
            }
        } else if (this.currentRoute?.component === matchedRoute.component) {
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

            // Update current route BEFORE executing hooks
            const previousRoute = this.currentRoute
            this.currentRoute = matchedRoute

            // Execute after enter hook
            if (matchedRoute.component.onAfterEnter) {
                try {
                    matchedRoute.component.onAfterEnter()
                } catch (error) {
                    console.error('Error in onAfterEnter:', error)
                }
            }

            // Update document title
            if (matchedRoute.route.title) {
                document.title = matchedRoute.route.title
            }

            // Update body classes for layout
            this.updateBodyClasses(matchedRoute)

            // Execute after leave hook for previous route
            if (previousRoute?.component?.onAfterLeave) {
                try {
                    previousRoute.component.onAfterLeave()
                } catch (error) {
                    console.error('Error in onAfterLeave:', error)
                }
            }

            // Hide loading state
            this.hideLoadingState()

            // Scroll to hash target if present
            if (location.hash) {
                const id = location.hash.substring(1)
                setTimeout(() => {
                    const el = document.getElementById(id)
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                }, 100)
            }

        } catch (error) {
            console.error('Route rendering error:', error)
            this.hideLoadingState()
            this.showNotification('Błąd podczas renderowania strony', 'error')

            // Try to render error page
            await this.handleNotFound(this.history.getCurrentPath())
        }
    }

    private async handleNotFound(attemptedPath: string): Promise<void> {
        try {
            // Try to navigate to 404 page, but avoid infinite loop
            if (!attemptedPath.includes('/not-found')) {
                await this.navigate('/not-found', true)
            } else {
                // If we're already on not-found and it's still failing, show basic error
                if (this.appContainer) {
                    this.appContainer.innerHTML = `
                        <div style="padding: 50px; text-align: center;">
                            <h1>404 - Strona nie znaleziona</h1>
                            <p>Przepraszamy, wystąpił błąd podczas ładowania strony.</p>
                            <a href="/" style="color: #e91e63;">Wróć do strony głównej</a>
                        </div>
                    `
                }
            }
        } catch (error) {
            console.error('Error handling 404:', error)
        }
    }

    private updateBodyClasses(route: MatchedRoute): void {
        // Remove old route classes
        document.body.className = document.body.className
            .split(' ')
            .filter(cls => !cls.startsWith('route-') && !cls.startsWith('layout-'))
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

    // Debug method
    debugRouting(enabled: boolean = true): void {
        if (enabled) {
            window.__ROUTER_DEBUG__ = true
        } else {
            (window as any).__ROUTER_DEBUG__ = false
        }
    }

    // Save intended URL before redirecting to login
    public setIntendedUrl(url?: string): void {
        this.intendedUrl = url || this.history.getCurrentPath()
        localStorage.setItem('intended_url', this.intendedUrl)
    }

    // Get and clear intended URL
    public getIntendedUrl(): string | null {
        const url = this.intendedUrl || localStorage.getItem('intended_url')
        if (url) {
            this.intendedUrl = null
            localStorage.removeItem('intended_url')
        }
        return url
    }
}