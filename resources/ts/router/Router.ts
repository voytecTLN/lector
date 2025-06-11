// resources/ts/Router.ts

import { routeGuard } from '@/components/RouteGuard'
import type { RouteGuardConfig } from '@/types/auth'

interface Route {
    path: string
    component: () => Promise<any>
    guard?: RouteGuardConfig
    title?: string
}

interface RouterOptions {
    mode?: 'hash' | 'history'
    base?: string
}

export class Router {
    private routes: Map<string, Route> = new Map()
    private currentRoute: string = ''
    private container: HTMLElement | null = null
    private mode: 'hash' | 'history' = 'hash'
    private base: string = ''

    constructor(options: RouterOptions = {}) {
        this.mode = options.mode || 'hash'
        this.base = options.base || ''
        this.init()
    }

    private init(): void {
        // Set up container
        this.container = document.getElementById('app')
        if (!this.container) {
            this.container = document.createElement('div')
            this.container.id = 'app'
            document.body.appendChild(this.container)
        }

        // Set up event listeners
        if (this.mode === 'history') {
            window.addEventListener('popstate', () => this.handleRoute())
            document.addEventListener('click', (e) => this.handleClick(e))
        } else {
            window.addEventListener('hashchange', () => this.handleRoute())
        }
    }

    public start(): void {
        // Navigate to initial route
        const initialPath = this.getCurrentPath()
        this.navigate(initialPath || '/')
    }

    public addRoute(path: string, component: () => Promise<any>, guard?: RouteGuardConfig, title?: string): void {
        this.routes.set(path, { path, component, guard, title })
    }

    public navigate(path: string): void {
        // Update URL
        if (this.mode === 'history') {
            window.history.pushState({}, '', this.base + path)
        } else {
            window.location.hash = path
        }

        // Handle the route
        this.handleRoute()
    }

    private getCurrentPath(): string {
        if (this.mode === 'history') {
            let path = window.location.pathname
            if (this.base) {
                path = path.replace(this.base, '')
            }
            return path || '/'
        } else {
            return window.location.hash.slice(1) || '/'
        }
    }

    private async handleRoute(): Promise<void> {
        const path = this.getCurrentPath()
        const route = this.findRoute(path)

        if (!route) {
            this.renderNotFound()
            return
        }

        // Check route guards
        if (route.guard) {
            const hasAccess = await routeGuard.checkAccess(route.guard)
            if (!hasAccess) {
                return // routeGuard handles redirects
            }
        }

        // Set page title
        if (route.title) {
            document.title = route.title
        }

        try {
            // Load and render component
            await this.loadComponent(route)
            this.currentRoute = path
        } catch (error) {
            console.error('Error loading route:', error)
            this.renderError()
        }
    }

    private findRoute(path: string): Route | null {
        // Exact match first
        if (this.routes.has(path)) {
            return this.routes.get(path)!
        }

        // Pattern matching for dynamic routes
        for (const [pattern, route] of this.routes) {
            if (this.matchPattern(pattern, path)) {
                return route
            }
        }

        return null
    }

    private matchPattern(pattern: string, path: string): boolean {
        const patternParts = pattern.split('/')
        const pathParts = path.split('/')

        if (patternParts.length !== pathParts.length) {
            return false
        }

        return patternParts.every((part, i) => {
            return part.startsWith(':') || part === pathParts[i]
        })
    }

    private async loadComponent(route: Route): Promise<void> {
        try {
            const moduleExports = await route.component()

            // Handle different export patterns
            let ComponentClass
            if (moduleExports.default) {
                ComponentClass = moduleExports.default
            } else if (typeof moduleExports === 'function') {
                ComponentClass = moduleExports
            } else {
                throw new Error('Invalid component export')
            }

            // Create and render component
            const componentInstance = new ComponentClass()

            if (this.container) {
                this.container.innerHTML = ''

                if (componentInstance.render && typeof componentInstance.render === 'function') {
                    const content = componentInstance.render()
                    if (typeof content === 'string') {
                        this.container.innerHTML = content
                    } else {
                        this.container.appendChild(content)
                    }
                } else if (componentInstance.element) {
                    this.container.appendChild(componentInstance.element)
                } else {
                    // Fallback - try to call it directly
                    const content = ComponentClass()
                    if (typeof content === 'string') {
                        this.container.innerHTML = content
                    } else {
                        this.container.appendChild(content)
                    }
                }

                // Initialize component if it has init method
                if (componentInstance.init && typeof componentInstance.init === 'function') {
                    componentInstance.init()
                }
            }
        } catch (error) {
            console.error('Error loading component:', error)
            throw error
        }
    }

    private handleClick(e: Event): void {
        if (this.mode !== 'history') return

        const target = e.target as HTMLElement
        const link = target.closest('a[href]') as HTMLAnchorElement

        if (!link) return

        const href = link.getAttribute('href')
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return
        }

        e.preventDefault()
        this.navigate(href)
    }

    private renderNotFound(): void {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-page">
                    <h1>404 - Strona nie znaleziona</h1>
                    <p>Przepraszamy, ale strona której szukasz nie istnieje.</p>
                    <a href="#/">Powrót do strony głównej</a>
                </div>
            `
        }
    }

    private renderError(): void {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-page">
                    <h1>Błąd ładowania</h1>
                    <p>Wystąpił błąd podczas ładowania strony.</p>
                    <button onclick="location.reload()">Odśwież stronę</button>
                </div>
            `
        }
    }

    public getCurrentRoute(): string {
        return this.currentRoute
    }

    public getRoutes(): Map<string, Route> {
        return this.routes
    }
}

// Singleton router instance
export const router = new Router({ mode: 'hash' })

// Make router globally available
declare global {
    interface Window {
        router: Router
    }
}

window.router = router