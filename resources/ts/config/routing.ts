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
    
    // Admin routes - Dashboard sections
    ADMIN_STUDENTS: '/admin/dashboard?section=uczniowie',
    ADMIN_STUDENTS_ADD: '/admin/dashboard?section=dodaj-studenta',
    ADMIN_STUDENTS_IMPORT: '/admin/dashboard?section=import-csv',
    ADMIN_STUDENTS_DETAILS: (id: string | number) => `/admin/dashboard?section=student-details&student_id=${id}`,
    ADMIN_STUDENTS_EDIT: (id: string | number) => `/admin/dashboard?section=edytuj-studenta&student_id=${id}`,
    
    ADMIN_TUTORS: '/admin/dashboard?section=lektorzy',
    ADMIN_TUTORS_ADD: '/admin/dashboard?section=dodaj-lektora',
    ADMIN_TUTORS_DETAILS: (id: string | number) => `/admin/dashboard?section=tutor-details&tutor_id=${id}`,
    ADMIN_TUTORS_EDIT: (id: string | number) => `/admin/dashboard?section=edytuj-lektora&tutor_id=${id}`,
    
    ADMIN_ADMINS: '/admin/dashboard?section=administratorzy',
    ADMIN_ADMINS_ADD: '/admin/dashboard?section=dodaj-administratora',
    ADMIN_ADMINS_DETAILS: (id: string | number) => `/admin/dashboard?section=admin-details&admin_id=${id}`,
    ADMIN_ADMINS_EDIT: (id: string | number) => `/admin/dashboard?section=edytuj-administratora&admin_id=${id}`,
    
    ADMIN_PACKAGES: '/admin/dashboard?section=pakiety',
    ADMIN_PACKAGES_ADD: '/admin/dashboard?section=dodaj-pakiet',
    ADMIN_PACKAGES_DETAILS: (id: string | number) => `/admin/dashboard?section=package-details&package_id=${id}`,
    ADMIN_PACKAGES_EDIT: (id: string | number) => `/admin/dashboard?section=edytuj-pakiet&package_id=${id}`,
    
    ADMIN_REPORTS: '/admin/dashboard?section=raporty',
    ADMIN_SETTINGS: '/admin/dashboard?section=ustawienia',
    ADMIN_MATERIALS: '/admin/dashboard?section=materialy',
    ADMIN_LESSONS: '/admin/dashboard?section=lekcje',
    ADMIN_AUDIT_LOGS: '/admin/dashboard?section=logi-auditowe',
    ADMIN_LOGIN_LOGS: '/admin/dashboard?section=logi-logowania',
    ADMIN_AVAILABILITY_LOGS: '/admin/dashboard?section=logi-dostepnosci',
    
    // Tutor dashboard sections  
    TUTOR_CALENDAR: '/tutor/dashboard?section=calendar',
    TUTOR_AVAILABILITY: '/tutor/dashboard?section=availability',
    TUTOR_STUDENTS: '/tutor/dashboard?section=students',
    TUTOR_PROFILE: '/tutor/dashboard?section=profile',
    TUTOR_UPCOMING: '/tutor/dashboard?section=nadchodzace',
    TUTOR_HISTORY: '/tutor/dashboard?section=historia',
    TUTOR_CHANGELOG: '/tutor/dashboard?section=wykaz-zmian',
    TUTOR_SUPPORT: '/tutor/dashboard?section=zgloszenia',
    
    // Student dashboard sections
    STUDENT_BOOKING: '/student/dashboard?section=rezerwuj',
    STUDENT_TUTORS: '/student/dashboard?section=lektorzy',
    STUDENT_PROFILE: '/student/dashboard?section=profil',
    STUDENT_HISTORY: '/student/dashboard?section=historia',
    STUDENT_UPCOMING: '/student/dashboard?section=nadchodzace',
    STUDENT_MATERIALS: '/student/dashboard?section=materialy',
    STUDENT_TUTOR_PROFILE: (id: string | number) => `/student/dashboard?section=tutor-profile&tutor_id=${id}`,
    STUDENT_TUTOR_BOOKING: (id: string | number) => `/student/dashboard?section=tutor-booking&tutor_id=${id}`,
    
    // Meeting routes
    LESSON_MEETING: (id: string | number) => `/lesson/${id}/meeting`,
    
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