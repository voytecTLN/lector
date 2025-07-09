// resources/ts/utils/navigation.ts
// Unified navigation system for the entire application

import { ROUTES, RouteUtils, ROUTING_CONFIG } from '@/config/routing'
import type { Router } from '@/router'

// Navigation utilities class
export class NavigationUtils {
    private static router: Router | null = null
    
    /**
     * Initialize navigation with router instance
     */
    static init(router: Router): void {
        NavigationUtils.router = router
        console.log('🧭 Navigation utilities initialized')
    }

    /**
     * Check if navigation is initialized
     */
    static isInitialized(): boolean {
        return NavigationUtils.router !== null
    }
    
    /**
     * Get router instance
     */
    private static getRouter(): Router {
        if (!NavigationUtils.router) {
            // Try to get router from window as fallback
            const windowRouter = (window as any).router
            if (windowRouter) {
                NavigationUtils.router = windowRouter
                return windowRouter
            }
            throw new Error('Router not initialized. Call NavigationUtils.init(router) first.')
        }
        return NavigationUtils.router
    }
    
    /**
     * Navigate to a route
     */
    static async to(path: string, replace: boolean = false): Promise<boolean> {
        try {
            const router = NavigationUtils.getRouter()
            const normalizedPath = RouteUtils.normalize(path)
            
            console.log(`🧭 NavigationUtils.to: ${path} -> ${normalizedPath}`, { replace })
            
            return await router.navigate(normalizedPath, replace)
        } catch (error) {
            console.error('❌ Navigation error:', error)
            NavigationUtils.fallbackNavigation(path)
            return false
        }
    }
    
    /**
     * Replace current route
     */
    static async replace(path: string): Promise<boolean> {
        return NavigationUtils.to(path, true)
    }
    
    /**
     * Go back in history
     */
    static back(): void {
        if (window.history.length > 1) {
            window.history.back()
        } else {
            // Fallback to home if no history
            NavigationUtils.to(ROUTES.HOME)
        }
    }
    
    /**
     * Go forward in history
     */
    static forward(): void {
        window.history.forward()
    }
    
    /**
     * Reload current page
     */
    static reload(): void {
        window.location.reload()
    }
    
    /**
     * Navigate to external URL
     */
    static external(url: string, newTab: boolean = false): void {
        console.log(`🌐 External navigation: ${url}`, { newTab })
        
        if (newTab) {
            const link = document.createElement('a')
            link.href = url
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            link.click()
        } else {
            window.location.href = url
        }
    }
    
    /**
     * Navigate with message notification
     */
    static async withMessage(
        path: string, 
        message: string, 
        type: 'success' | 'error' | 'warning' | 'info' = 'info'
    ): Promise<boolean> {
        const params = { message, type }
        const url = RouteUtils.buildUrlWithQuery(path, params)
        return NavigationUtils.to(url)
    }
    
    /**
     * Navigate with query parameters
     */
    static async withQuery(path: string, params: Record<string, string>): Promise<boolean> {
        const url = RouteUtils.buildUrlWithQuery(path, params)
        return NavigationUtils.to(url)
    }
    
    /**
     * Navigate to dashboard based on user role
     */
    static async toDashboard(role?: string): Promise<boolean> {
        const userRole = role || NavigationUtils.getCurrentUserRole()
        
        const dashboardRoutes: Record<string, string> = {
            admin: ROUTES.ADMIN_DASHBOARD,
            moderator: ROUTES.MODERATOR_DASHBOARD,
            tutor: ROUTES.TUTOR_DASHBOARD,
            student: ROUTES.STUDENT_DASHBOARD
        }
        
        const dashboardPath = dashboardRoutes[userRole] || ROUTES.HOME
        return NavigationUtils.to(dashboardPath)
    }
    
    /**
     * Navigate to previous page or fallback
     */
    static async backOrFallback(fallbackPath: string = ROUTES.HOME): Promise<boolean> {
        if (window.history.length > 1) {
            NavigationUtils.back()
            return true
        } else {
            return NavigationUtils.to(fallbackPath)
        }
    }
    
    /**
     * Check if navigation is allowed
     */
    static async canNavigate(path: string): Promise<boolean> {
        try {
            const router = NavigationUtils.getRouter()
            // This would require extending the router to expose guard checking
            // For now, return true as a placeholder
            return true
        } catch {
            return false
        }
    }
    
    /**
     * Get current user role (helper method)
     */
    private static getCurrentUserRole(): string {
        try {
            const authService = (window as any).authService
            const user = authService?.getUser()
            return user?.role || 'guest'
        } catch {
            return 'guest'
        }
    }
    
    /**
     * Fallback navigation when router is not available
     */
    private static fallbackNavigation(path: string): void {
        console.warn('🚨 Using fallback navigation for:', path)
        
        const normalizedPath = RouteUtils.normalize(path)
        const hashUrl = RouteUtils.buildHashUrl(normalizedPath)
        
        // Use location.hash for SPA navigation
        window.location.hash = hashUrl.substring(1) // Remove leading #
    }
}

// Convenience functions for common navigation patterns
export const navigate = {
    /**
     * Navigate to a route
     */
    to: (path: string, replace?: boolean) => NavigationUtils.to(path, replace),
    
    /**
     * Replace current route
     */
    replace: (path: string) => NavigationUtils.replace(path),
    
    /**
     * Go back
     */
    back: () => NavigationUtils.back(),
    
    /**
     * Go forward
     */
    forward: () => NavigationUtils.forward(),
    
    /**
     * External navigation
     */
    external: (url: string, newTab?: boolean) => NavigationUtils.external(url, newTab),
    
    /**
     * Navigate with message
     */
    withMessage: (path: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => 
        NavigationUtils.withMessage(path, message, type),
    
    /**
     * Navigate with query parameters
     */
    withQuery: (path: string, params: Record<string, string>) => 
        NavigationUtils.withQuery(path, params),
    
    /**
     * Navigate to dashboard
     */
    toDashboard: (role?: string) => NavigationUtils.toDashboard(role),
    
    /**
     * Navigate back or to fallback
     */
    backOrFallback: (fallbackPath?: string) => NavigationUtils.backOrFallback(fallbackPath)
}

// URL building utilities
export const urlBuilder = {
    /**
     * Build hash URL from path
     */
    hash: (path: string) => RouteUtils.buildHashUrl(path),
    
    /**
     * Build full URL
     */
    full: (path: string) => RouteUtils.buildFullUrl(path),
    
    /**
     * Build URL with query parameters
     */
    withQuery: (path: string, params: Record<string, string>) => 
        RouteUtils.buildUrlWithQuery(path, params),
    
    /**
     * Build dashboard URL for role
     */
    dashboard: (role: string, section?: string) => {
        const basePath = `/${role}/dashboard`
        return section ? urlBuilder.withQuery(basePath, { section }) : urlBuilder.hash(basePath)
    },
    
    /**
     * Build admin student URLs
     */
    adminStudent: {
        list: () => urlBuilder.hash(ROUTES.ADMIN_STUDENTS),
        add: () => urlBuilder.hash(ROUTES.ADMIN_STUDENTS_ADD),
        show: (id: string | number) => urlBuilder.hash(ROUTES.ADMIN_STUDENTS_SHOW(id)),
        edit: (id: string | number) => urlBuilder.hash(ROUTES.ADMIN_STUDENTS_EDIT(id))
    }
}

// Route checking utilities
export const routeChecker = {
    /**
     * Check if current route matches path
     */
    isCurrent: (path: string) => RouteUtils.isCurrentRoute(path),
    
    /**
     * Check if route is external
     */
    isExternal: (path: string) => RouteUtils.isExternal(path),
    
    /**
     * Check if route is hash route
     */
    isHash: (path: string) => RouteUtils.isHashRoute(path),
    
    /**
     * Get current route path
     */
    getCurrentPath: () => RouteUtils.getCurrentPath(),
    
    /**
     * Get current route with query
     */
    getCurrentFullPath: () => RouteUtils.getCurrentFullPath(),
    
    /**
     * Parse current query parameters
     */
    getCurrentQuery: () => RouteUtils.parseQuery(),
    
    /**
     * Check if route matches pattern
     */
    matches: (path: string, pattern: RegExp) => RouteUtils.matches(path, pattern)
}

// Legacy compatibility - to be removed after refactoring
export function navigateTo(path: string): void {
    console.warn('⚠️ navigateTo is deprecated. Use navigate.to() instead.')
    navigate.to(path)
}

export function redirectWithMessage(
    path: string,
    message?: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
): void {
    console.warn('⚠️ redirectWithMessage is deprecated. Use navigate.withMessage() instead.')
    if (message) {
        navigate.withMessage(path, message, type)
    } else {
        navigate.to(path)
    }
}

// Initialize navigation when router is available
declare global {
    interface Window {
        router?: Router
        NavigationUtils?: typeof NavigationUtils
    }
}

// Auto-initialize when router becomes available
if (typeof window !== 'undefined') {
    window.NavigationUtils = NavigationUtils
    
    // Watch for router initialization
    const checkRouter = () => {
        if (window.router && !NavigationUtils.isInitialized()) {
            NavigationUtils.init(window.router)
        }
    }
    
    // Check immediately and set up polling
    checkRouter()
    const intervalId = setInterval(() => {
        checkRouter()
        if (NavigationUtils.isInitialized()) {
            clearInterval(intervalId)
        }
    }, 100)
    
    // Clear interval after reasonable time
    setTimeout(() => clearInterval(intervalId), 5000)
}