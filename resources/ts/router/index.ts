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

    constructor() {
        this.history = new BrowserHistory()
        this.guards = [...defaultGuards]
    }

    async init(): Promise<void> {
        Logger.router('Initializing Router...')

        // Find app container
        this.appContainer = document.getElementById('app')
        if (!this.appContainer) {
            throw new Error('App container not found')
        }

        // Listen to history changes
        this.history.addListener(this.handleRouteChange.bind(this))

        // NOWE: Listen to hash changes
        window.addEventListener('hashchange', () => {
            this.handleRouteChange(this.history.getCurrentPath())
        })

        // Handle initial route
        await this.handleRouteChange(this.history.getCurrentPath())

        Logger.router('Router initialized')
    }

    async navigate(path: string, replace: boolean = false): Promise<boolean> {
        // Normalize path using RouteUtils
        const normalizedPath = RouteUtils.normalize(path)
        
        Logger.router(`Router.navigate() called:`, {
            originalPath: path,
            normalizedPath,
            replace,
            currentPath: this.history.getCurrentPath(),
            isNavigating: this.isNavigating,
            queueLength: this.navigationQueue.length
        })

        // Queue navigation if already navigating
        if (this.isNavigating) {
            Logger.warn('Navigation already in progress, queueing new navigation:', normalizedPath)
            return new Promise((resolve) => {
                this.navigationQueue.push(async () => {
                    const result = await this.navigate(normalizedPath, replace)
                    resolve(result)
                })
            })
        }

        Logger.router(`Starting navigation to: ${normalizedPath}`)

        try {
            this.isNavigating = true

            // Match route
            const matchedRoute = RouteMatcher.match(normalizedPath, routes)
            Logger.router(`Route matching result:`, {
                matched: !!matchedRoute,
                routeName: matchedRoute?.route.name,
                routePath: matchedRoute?.route.path
            })

            if (!matchedRoute) {
                Logger.error(`Route not found: ${normalizedPath}`)
                await this.handleNotFound(normalizedPath)
                return false
            }

            Logger.router(`Route matched: ${matchedRoute.route.name}`)
            Logger.router(`Route meta:`, matchedRoute.route.meta)

            // Run guards BEFORE loading component
            const guardResult = await this.runGuards(matchedRoute)
            if (!guardResult.allowed) {
                Logger.debug(`Guard blocked navigation:`, guardResult)

                if (guardResult.redirect) {
                    // Prevent infinite redirects
                    if (guardResult.redirect !== path) {
                        Logger.router(`Redirecting to: ${guardResult.redirect}`)
                        return this.navigate(guardResult.redirect, true)
                    } else {
                        Logger.error(`Infinite redirect detected: ${path}`)
                        await this.handleNotFound(path)
                        return false
                    }
                }

                if (guardResult.message) {
                    this.showNotification(guardResult.message, 'warning')
                }
                return false
            }

            Logger.router(`All guards passed for: ${matchedRoute.route.name}`)

            // Load component
            try {
                Logger.router(`Loading component for: ${matchedRoute.route.name}`)
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

                Logger.router(`Component loaded: ${matchedRoute.route.name}`)
            } catch (error) {
                Logger.error(`Failed to load route component:`, error)
                this.showNotification('Błąd podczas ładowania strony', 'error')
                await this.handleNotFound(path)
                return false
            }

            // Execute component lifecycle hooks
            if (matchedRoute.component.onBeforeEnter) {
                Logger.debug(`Executing onBeforeEnter for: ${matchedRoute.route.name}`)
                try {
                    const canEnter = await matchedRoute.component.onBeforeEnter()
                    if (canEnter === false) {
                        Logger.debug(`Component onBeforeEnter blocked navigation`)
                        return false
                    }
                } catch (error) {
                    Logger.error(`Error in onBeforeEnter:`, error)
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
            Logger.error('Navigation error:', error)
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

        Logger.guard(`Running guards for route: ${route.route.name}`)

        // NOWE: Reset guard execution tracking
        this.guardExecutions.clear()

        // Run route-specific guards first (if any)
        if (route.route.guards && route.route.guards.length > 0) {
            Logger.debug(`Running ${route.route.guards.length} route-specific guards`)
            for (const guard of route.route.guards) {
                // NOWE: Track executions
                const execCount = (this.guardExecutions.get(guard.name) || 0) + 1
                this.guardExecutions.set(guard.name, execCount)

                if (execCount > 1) {
                    Logger.warn(`Guard '${guard.name}' executed ${execCount} times!`)
                }

                Logger.guard(`Executing route guard: ${guard.name} (execution #${execCount})`)
                try {
                    const start = performance.now()
                    const result = await guard.execute(context)
                    const duration = performance.now() - start

                    Logger.debug(`Guard '${guard.name}' took ${duration.toFixed(2)}ms`)

                    if (!result.allowed) {
                        Logger.debug(`Route guard '${guard.name}' blocked navigation:`, result)
                        return result
                    }
                    Logger.debug(`Route guard '${guard.name}' passed`)
                } catch (error) {
                    Logger.error(`Error in route guard '${guard.name}':`, error)
                    return {
                        allowed: false,
                        message: `Błąd w guard: ${guard.name}`
                    }
                }
            }
        }

        // Run global guards
        Logger.debug(`Running ${this.guards.length} global guards`)
        for (const guard of this.guards) {
            // NOWE: Track executions
            const execCount = (this.guardExecutions.get(guard.name) || 0) + 1
            this.guardExecutions.set(guard.name, execCount)

            if (execCount > 1) {
                Logger.warn(`Guard '${guard.name}' executed ${execCount} times!`)
            }

            Logger.guard(`Executing global guard: ${guard.name} (execution #${execCount})`)
            try {
                const start = performance.now()
                const result = await guard.execute(context)
                const duration = performance.now() - start

                Logger.debug(`Guard '${guard.name}' took ${duration.toFixed(2)}ms`)

                if (!result.allowed) {
                    Logger.debug(`Global guard '${guard.name}' blocked navigation:`, result)
                    return result
                }
                Logger.debug(`Global guard '${guard.name}' passed`)
            } catch (error) {
                Logger.error(`Error in global guard '${guard.name}':`, error)
                return {
                    allowed: false,
                    message: `Błąd w guard: ${guard.name}`
                }
            }
        }

        // NOWE: Log summary
        Logger.debug(`All guards passed for: ${route.route.name}`)
        Logger.debug(`Guard execution summary:`, Object.fromEntries(this.guardExecutions))

        return { allowed: true }
    }

    private async renderRoute(matchedRoute: MatchedRoute): Promise<void> {
        if (!this.appContainer) return

        Logger.router(`Rendering route: ${matchedRoute.route.name}`)

        // Cleanup previous route
        if (this.currentRoute?.component?.onBeforeLeave) {
            Logger.debug(`Executing onBeforeLeave for: ${this.currentRoute.route.name}`)
            try {
                const canLeave = await this.currentRoute.component.onBeforeLeave()
                if (canLeave === false) {
                    Logger.debug(`Previous component onBeforeLeave blocked navigation`)
                    return
                }
            } catch (error) {
                Logger.error(`Error in onBeforeLeave:`, error)
            }
        }

        // Unmount previous component
        if (this.currentRoute?.component?.unmount) {
            Logger.debug(`Unmounting previous component: ${this.currentRoute.route.name}`)
            try {
                this.currentRoute.component.unmount()
            } catch (error) {
                Logger.error(`Error unmounting component:`, error)
            }
        }

        // Show loading state
        this.showLoadingState()

        try {
            // Render new component
            Logger.router(`Rendering component: ${matchedRoute.route.name}`)
            const element = await matchedRoute.component.render()

            // Clear container and add new content
            this.appContainer.innerHTML = ''
            this.appContainer.appendChild(element)

            // Mount component
            if (matchedRoute.component.mount) {
                Logger.debug(`Mounting component: ${matchedRoute.route.name}`)
                matchedRoute.component.mount(this.appContainer)
            }

            // Update current route BEFORE executing hooks
            const previousRoute = this.currentRoute
            this.currentRoute = matchedRoute

            // Execute after enter hook
            if (matchedRoute.component.onAfterEnter) {
                Logger.debug(`Executing onAfterEnter for: ${matchedRoute.route.name}`)
                try {
                    matchedRoute.component.onAfterEnter()
                } catch (error) {
                    console.error(`❌ Error in onAfterEnter:`, error)
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
                Logger.debug(`Executing onAfterLeave for: ${previousRoute.route.name}`)
                try {
                    previousRoute.component.onAfterLeave()
                } catch (error) {
                    console.error(`❌ Error in onAfterLeave:`, error)
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

            Logger.router(`Route rendered successfully: ${matchedRoute.route.name}`)

        } catch (error) {
            console.error('❌ Route rendering error:', error)
            this.hideLoadingState()
            this.showNotification('Błąd podczas renderowania strony', 'error')

            // Try to render error page
            await this.handleNotFound(this.history.getCurrentPath())
        }
    }

    private async handleNotFound(attemptedPath: string): Promise<void> {
        Logger.router(`Handling 404 for path: ${attemptedPath}`)

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
            console.error('❌ Error handling 404:', error)
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

        Logger.debug(`Updated body classes: ${routeClass}, layout-${layout}`)
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
            Logger.debug('Router Debug Mode Enabled')
            Logger.debug('Current route:', this.currentRoute)
            Logger.debug('Registered guards:', this.guards.map(g => g.name))
            Logger.debug('Guard execution count:', Object.fromEntries(this.guardExecutions))
            Logger.debug('Navigation queue length:', this.navigationQueue.length)
            Logger.debug('Is navigating:', this.isNavigating)
            Logger.debug('Intended URL:', this.intendedUrl)

            //NOWE: Enable verbose logging
            window.__ROUTER_DEBUG__ = true
        } else {
            (window as any).__ROUTER_DEBUG__ = false
        }
    }

// Save intended URL before redirecting to login
    public setIntendedUrl(url?: string): void {
        this.intendedUrl = url || this.history.getCurrentPath()
        localStorage.setItem('intended_url', this.intendedUrl)
        Logger.debug(`Saved intended URL: ${this.intendedUrl}`)
    }

    // Get and clear intended URL
    public getIntendedUrl(): string | null {
        const url = this.intendedUrl || localStorage.getItem('intended_url')
        if (url) {
            this.intendedUrl = null
            localStorage.removeItem('intended_url')
            Logger.debug(`Retrieved intended URL: ${url}`)
        }
        return url
    }
}