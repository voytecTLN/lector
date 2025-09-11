// resources/ts/config/routing.ts
// Standardized routing configuration for the entire application

export const ROUTING_CONFIG = {
    mode: 'hash' as const,
    base: '#/',
    trailingSlash: false,
    caseSensitive: false,
    
    // Path normalization rules
    normalization: {
        removeTrailingSlash: true,
        lowercaseRoutes: false,
        mergeSlashes: true
    },
    
    // Default route parameters
    defaults: {
        title: 'Platforma Lektorów',
        layout: 'guest' as const
    }
} as const

// Route path constants - centralized route definitions
export const ROUTES = {
    // Public routes
    HOME: '/',
    CONTACT: '/contact',
    FAQ: '/faq',
    CHANGELOG: '/changelog',
    
    // Auth routes
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
    LOGOUT: '/logout',
    
    // Dashboard routes
    ADMIN_DASHBOARD: '/admin/dashboard',
    MODERATOR_DASHBOARD: '/moderator/dashboard',
    TUTOR_DASHBOARD: '/tutor/dashboard',
    STUDENT_DASHBOARD: '/student/dashboard',
    
    // Admin routes
    ADMIN_STUDENTS: '/admin/students',
    ADMIN_STUDENTS_ADD: '/admin/students/add',
    ADMIN_STUDENTS_SHOW: (id: string | number) => `/admin/students/${id}`,
    ADMIN_STUDENTS_EDIT: (id: string | number) => `/admin/students/${id}/edit`,
    
    // Error routes
    UNAUTHORIZED: '/unauthorized',
    NOT_FOUND: '/not-found'
} as const

// Route validation patterns
export const ROUTE_PATTERNS = {
    STUDENT_ID: /^\/admin\/students\/(\d+)$/,
    STUDENT_EDIT: /^\/admin\/students\/(\d+)\/edit$/,
    DASHBOARD_SECTION: /^\/(\w+)\/dashboard$/,
    HASH_ROUTE: /^#\/(.*)$/
} as const

// Route helper functions
export const RouteUtils = {
    /**
     * Normalize any route path to consistent format
     */
    normalize(path: string): string {
        if (!path) return ROUTES.HOME
        
        // Remove hash prefix if present
        if (path.startsWith('#/')) {
            path = path.substring(1)
        } else if (path.startsWith('/#/')) {
            path = path.substring(2)
        }
        
        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path
        }
        
        // Remove trailing slash (except for root)
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1)
        }
        
        // Merge multiple slashes
        if (ROUTING_CONFIG.normalization.mergeSlashes) {
            path = path.replace(/\/+/g, '/')
        }
        
        return path
    },
    
    /**
     * Build full hash URL from path
     */
    buildHashUrl(path: string): string {
        const normalizedPath = this.normalize(path)
        return `${ROUTING_CONFIG.base}${normalizedPath.substring(1)}`
    },
    
    /**
     * Build full URL with domain
     */
    buildFullUrl(path: string): string {
        const hashUrl = this.buildHashUrl(path)
        return `${window.location.origin}/${hashUrl}`
    },
    
    /**
     * Check if path matches pattern
     */
    matches(path: string, pattern: RegExp): boolean {
        return pattern.test(this.normalize(path))
    },
    
    /**
     * Extract parameters from route
     */
    extractParams(path: string, pattern: RegExp): Record<string, string> {
        const normalizedPath = this.normalize(path)
        const match = normalizedPath.match(pattern)
        
        if (!match) return {}
        
        const params: Record<string, string> = {}
        
        // Extract named groups if available
        if (match.groups) {
            return match.groups
        }
        
        // Extract numbered groups
        for (let i = 1; i < match.length; i++) {
            params[`param${i}`] = match[i]
        }
        
        return params
    },
    
    /**
     * Check if route is external
     */
    isExternal(path: string): boolean {
        try {
            const url = new URL(path, window.location.origin)
            return url.origin !== window.location.origin
        } catch {
            return false
        }
    },
    
    /**
     * Check if route is internal hash route
     */
    isHashRoute(path: string): boolean {
        return path.startsWith('#/') || path.startsWith('/#/')
    },
    
    /**
     * Check if current route matches path
     */
    isCurrentRoute(path: string): boolean {
        const currentPath = this.getCurrentPath()
        const targetPath = this.normalize(path)
        return currentPath === targetPath
    },
    
    /**
     * Get current route path
     */
    getCurrentPath(): string {
        if (window.location.hash && window.location.hash.startsWith('#/')) {
            return this.normalize(window.location.hash.substring(1))
        }
        return this.normalize(window.location.pathname)
    },
    
    /**
     * Get current route with query parameters
     */
    getCurrentFullPath(): string {
        const path = this.getCurrentPath()
        const search = window.location.search
        return path + search
    },
    
    /**
     * Parse query parameters
     */
    parseQuery(search?: string): Record<string, string> {
        const params = new URLSearchParams(search || window.location.search)
        const query: Record<string, string> = {}
        
        params.forEach((value, key) => {
            query[key] = value
        })
        
        return query
    },
    
    /**
     * Build query string from object
     */
    buildQuery(params: Record<string, string>): string {
        const searchParams = new URLSearchParams()
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value)
            }
        })
        
        const queryString = searchParams.toString()
        return queryString ? `?${queryString}` : ''
    },
    
    /**
     * Combine path with query parameters
     */
    buildUrlWithQuery(path: string, params: Record<string, string>): string {
        const normalizedPath = this.normalize(path)
        const queryString = this.buildQuery(params)
        return `${ROUTING_CONFIG.base}${normalizedPath.substring(1)}${queryString}`
    }
}

// Type definitions for routes
export type RouteKey = keyof typeof ROUTES
export type RoutePath = typeof ROUTES[RouteKey]

// Export for backwards compatibility
export { ROUTES as Routes, RouteUtils as routeUtils }