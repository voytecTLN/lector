// resources/ts/router/routes.ts - IMPROVED VERSION
import type { RouteGuard } from './guards'

export interface RouteComponent {
    render(): Promise<HTMLElement> | HTMLElement
    mount?(container: HTMLElement): void
    unmount?(): void
    onBeforeEnter?(): Promise<boolean> | boolean
    onAfterEnter?(): void
    onBeforeLeave?(): Promise<boolean> | boolean
    onAfterLeave?(): void
}

export interface RouteParams {
    [key: string]: string
}

export interface RouteQuery {
    [key: string]: string
}

export interface RouteDefinition {
    path: string
    name: string
    component: () => Promise<RouteComponent> | RouteComponent
    title?: string
    meta?: {
        requiresAuth?: boolean
        requiresVerification?: boolean
        requiresGuest?: boolean // NEW - for login/register pages
        roles?: string[]
        permissions?: string[]
        layout?: 'app' | 'auth' | 'guest'
        requiresDevelopment?: boolean // NEW - for dev-only routes
        [key: string]: any
    }
    guards?: RouteGuard[]
    children?: RouteDefinition[]
}

export interface MatchedRoute {
    route: RouteDefinition
    params: RouteParams
    query: RouteQuery
    hash: string
    path: string
    component: RouteComponent
}

// Route definitions
export const routes: RouteDefinition[] = [
    // Public routes (guest layout)
    {
        path: '/',
        name: 'home',
        component: () => import('@/components/pages/HomePage').then(m => new m.HomePage()),
        title: 'Platforma Lektorów - Nauka języków online',
        meta: {
            layout: 'guest'
        }
    },

    // Auth routes (for guests only - redirect if logged in)
    {
        path: '/login',
        name: 'login',
        component: () => import('@/components/auth/LoginPage').then(m => new m.LoginPage()),
        title: 'Logowanie - Platforma Lektorów',
        meta: {
            layout: 'auth',
            requiresGuest: true // Redirect to dashboard if already logged in
        }
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/components/auth/RegisterPage').then(m => new m.RegisterPage()),
        title: 'Rejestracja - Platforma Lektorów',
        meta: {
            layout: 'auth',
            requiresGuest: true
        }
    },
    {
        path: '/forgot-password',
        name: 'forgot-password',
        component: () => import('@/components/auth/ForgotPasswordPage').then(m => new m.ForgotPasswordPage()),
        title: 'Resetowanie hasła - Platforma Lektorów',
        meta: {
            layout: 'auth',
            requiresGuest: true
        }
    },
    {
        path: '/reset-password',
        name: 'reset-password',
        component: () => import('@/components/auth/ResetPasswordPage').then(m => new m.ResetPasswordPage()),
        title: 'Nowe hasło - Platforma Lektorów',
        meta: {
            layout: 'auth',
            requiresGuest: true
        }
    },

    // Email verification (requires auth but NOT verification - special case)
    {
        path: '/verify-email',
        name: 'verify-email',
        component: () => import('@/components/auth/EmailVerificationPage').then(m => new m.EmailVerificationPage()),
        title: 'Weryfikacja email - Platforma Lektorów',
        meta: {
            layout: 'auth',
            requiresAuth: true
            // NOTE: NO requiresVerification here - this page is FOR verification
        }
    },

    // Protected dashboard routes - require auth + verification + specific roles
    {
        path: '/admin/dashboard',
        name: 'admin.dashboard',
        component: () => import('@/components/dashboard/AdminDashboard').then(m => new m.AdminDashboard()),
        title: 'Panel Administratora - Platforma Lektorów',
        meta: {
            requiresAuth: true,
            requiresVerification: true,
            roles: ['admin'],
            layout: 'app',
            permissions: ['manage_users', 'view_analytics', 'system_settings']
        }
    },
    // {
    //     path: '/moderator/dashboard',
    //     name: 'moderator.dashboard',
    //     component: () => import('@/components/dashboard/ModeratorDashboard').then(m => new m.ModeratorDashboard()),
    //     title: 'Panel Moderatora - Platforma Lektorów',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['moderator', 'admin'],
    //         layout: 'app',
    //         permissions: ['manage_content']
    //     }
    // },
    // {
    //     path: '/tutor/dashboard',
    //     name: 'tutor.dashboard',
    //     component: () => import('@/components/dashboard/TutorDashboard').then(m => new m.TutorDashboard()),
    //     title: 'Panel Lektora - Platforma Lektorów',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['tutor', 'admin'],
    //         layout: 'app',
    //         permissions: ['can_teach', 'manage_own_lessons']
    //     }
    // },
    {
        path: '/student/dashboard',
        name: 'student.dashboard',
        component: () => import('@/components/dashboard/StudentDashboard').then(m => new m.StudentDashboard()),
        title: 'Panel Studenta - Platforma Lektorów',
        meta: {
            requiresAuth: true,
            requiresVerification: true,
            roles: ['student', 'admin'],
            layout: 'app',
            permissions: ['can_learn', 'book_lessons']
        }
    },

    // // Profile routes - require auth + verification
    // {
    //     path: '/profile',
    //     name: 'profile',
    //     component: () => import('@/components/profile/ProfilePage').then(m => new m.ProfilePage()),
    //     title: 'Mój Profil - Platforma Lektorów',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         layout: 'app'
    //     }
    // },
    // {
    //     path: '/settings',
    //     name: 'settings',
    //     component: () => import('@/components/profile/SettingsPage').then(m => new m.SettingsPage()),
    //     title: 'Ustawienia - Platforma Lektorów',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         layout: 'app'
    //     }
    // },
    //
    // // Public content pages (guest layout, no auth required)
    // {
    //     path: '/tutors',
    //     name: 'tutors',
    //     component: () => import('@/components/pages/TutorsPage').then(m => new m.TutorsPage()),
    //     title: 'Lektorzy - Platforma Lektorów',
    //     meta: {
    //         layout: 'guest'
    //     }
    // },
    // {
    //     path: '/courses',
    //     name: 'courses',
    //     component: () => import('@/components/pages/CoursesPage').then(m => new m.CoursesPage()),
    //     title: 'Kursy - Platforma Lektorów',
    //     meta: {
    //         layout: 'guest'
    //     }
    // },
    // {
    //     path: '/about',
    //     name: 'about',
    //     component: () => import('@/components/pages/AboutPage').then(m => new m.AboutPage()),
    //     title: 'O nas - Platforma Lektorów',
    //     meta: {
    //         layout: 'guest'
    //     }
    // },
    // {
    //     path: '/contact',
    //     name: 'contact',
    //     component: () => import('@/components/pages/ContactPage').then(m => new m.ContactPage()),
    //     title: 'Kontakt - Platforma Lektorów',
    //     meta: {
    //         layout: 'guest'
    //     }
    // },
    // {
    //     path: '/help',
    //     name: 'help',
    //     component: () => import('@/components/pages/HelpPage').then(m => new m.HelpPage()),
    //     title: 'Pomoc - Platforma Lektorów',
    //     meta: {
    //         layout: 'guest'
    //     }
    // },
    //
    // // Admin routes - high security
    // {
    //     path: '/admin/users',
    //     name: 'admin.users',
    //     component: () => import('@/components/admin/UsersPage').then(m => new m.UsersPage()),
    //     title: 'Zarządzanie Użytkownikami - Panel Administratora',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['admin'],
    //         layout: 'app',
    //         permissions: ['manage_users']
    //     }
    // },
    // {
    //     path: '/admin/students',
    //     name: 'admin.students',
    //     component: () => import('@/components/admin/StudentsPage').then(m => new m.StudentsPage()),
    //     title: 'Zarządzanie Studentami - Panel Administratora',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['admin', 'moderator'],
    //         layout: 'app',
    //         permissions: ['manage_users']
    //     }
    // },
    // {
    //     path: '/admin/tutors',
    //     name: 'admin.tutors',
    //     component: () => import('@/components/admin/TutorsPage').then(m => new m.TutorsPage()),
    //     title: 'Zarządzanie Lektorami - Panel Administratora',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['admin', 'moderator'],
    //         layout: 'app',
    //         permissions: ['manage_users']
    //     }
    // },
    //
    // // Development routes (only in dev mode)
    // {
    //     path: '/dev/test',
    //     name: 'dev.test',
    //     component: () => import('@/components/dev/TestPage').then(m => new m.TestPage()),
    //     title: 'Test Page - Development',
    //     meta: {
    //         requiresDevelopment: true,
    //         layout: 'guest'
    //     }
    // },

    // Error routes (no guards needed)
    {
        path: '/unauthorized',
        name: 'unauthorized',
        component: () => import('@/components/pages/UnauthorizedPage').then(m => new m.UnauthorizedPage()),
        title: 'Brak uprawnień - Platforma Lektorów',
        meta: {
            layout: 'guest'
        }
    },

    // 404 - must be LAST (catch-all route)
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/components/pages/NotFoundPage').then(m => new m.NotFoundPage()),
        title: 'Strona nie znaleziona - Platforma Lektorów',
        meta: {
            layout: 'guest'
        }
    }
]

// Route matching utilities
export class RouteMatcher {
    static match(path: string, routes: RouteDefinition[]): MatchedRoute | null {
        const url = new URL(path, window.location.origin)
        const pathname = url.pathname
        const query = this.parseQuery(url.search)
        const hash = url.hash

        for (const route of routes) {
            const params = this.matchPath(pathname, route.path)
            if (params !== null) {
                return {
                    route,
                    params,
                    query,
                    hash,
                    path: pathname,
                    component: null as any // Will be loaded later
                }
            }
        }

        return null
    }

    static matchPath(pathname: string, routePath: string): RouteParams | null {
        // Convert route path to regex
        const paramNames: string[] = []

        // Handle exact match first
        if (routePath === pathname) {
            return {}
        }

        // Handle wildcard routes
        if (routePath.includes('*')) {
            const regexPath = routePath
                .replace(/\/:pathMatch\(\.\*\)\*/g, '/(.*)') // Vue-style catch-all
                .replace(/\/\*$/g, '/(.*)')                  // Simple wildcard

            const regex = new RegExp(`^${regexPath}$`)
            const match = pathname.match(regex)

            if (match) {
                return {
                    pathMatch: match[1] || ''
                }
            }
        }

        // Handle parameter routes
        const regexPath = routePath.replace(/:([^/]+)/g, (_, paramName) => {
            paramNames.push(paramName)
            return '([^/]+)'
        })

        const regex = new RegExp(`^${regexPath}$`)
        const match = pathname.match(regex)

        if (match) {
            const params: RouteParams = {}
            paramNames.forEach((name, index) => {
                params[name] = match[index + 1]
            })
            return params
        }

        return null
    }

    static parseQuery(search: string): RouteQuery {
        const params = new URLSearchParams(search)
        const query: RouteQuery = {}

        params.forEach((value, key) => {
            query[key] = value
        })

        return query
    }

    static buildPath(routeName: string, params?: RouteParams, query?: RouteQuery): string {
        const route = this.findRouteByName(routeName, routes)
        if (!route) {
            throw new Error(`Route "${routeName}" not found`)
        }

        let path = route.path

        // Replace parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                path = path.replace(`:${key}`, encodeURIComponent(value))
            })
        }

        // Add query string
        if (query && Object.keys(query).length > 0) {
            const searchParams = new URLSearchParams()
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value))
                }
            })
            path += '?' + searchParams.toString()
        }

        return path
    }

    static findRouteByName(name: string, routes: RouteDefinition[]): RouteDefinition | null {
        for (const route of routes) {
            if (route.name === name) {
                return route
            }
            if (route.children) {
                const childRoute = this.findRouteByName(name, route.children)
                if (childRoute) {
                    return childRoute
                }
            }
        }
        return null
    }

    // Helper methods for route checking
    static getRouteByName(name: string): RouteDefinition | null {
        return this.findRouteByName(name, routes)
    }

    static getAllRoutes(): RouteDefinition[] {
        return routes
    }

    static getRoutesByRole(role: string): RouteDefinition[] {
        return routes.filter(route => {
            const requiredRoles = route.meta?.roles
            return !requiredRoles || requiredRoles.includes(role)
        })
    }

    static getPublicRoutes(): RouteDefinition[] {
        return routes.filter(route => !route.meta?.requiresAuth)
    }

    static getProtectedRoutes(): RouteDefinition[] {
        return routes.filter(route => route.meta?.requiresAuth)
    }
}

// Route helper functions
export const RouteHelpers = {
    // Check if route requires authentication
    requiresAuth(route: RouteDefinition): boolean {
        return !!route.meta?.requiresAuth
    },

    // Check if route requires verification
    requiresVerification(route: RouteDefinition): boolean {
        return !!route.meta?.requiresVerification
    },

    // Check if route is for guests only
    isGuestOnly(route: RouteDefinition): boolean {
        return !!route.meta?.requiresGuest
    },

    // Get route layout
    getLayout(route: RouteDefinition): string {
        return route.meta?.layout || 'guest'
    },

    // Check if route has specific role requirement
    hasRoleRequirement(route: RouteDefinition, role: string): boolean {
        const requiredRoles = route.meta?.roles
        return !!requiredRoles && requiredRoles.includes(role)
    },

    // Get dashboard route for role
    getDashboardRoute(role: string): string {
        const dashboardRoutes: Record<string, string> = {
            admin: '/admin/dashboard',
            moderator: '/moderator/dashboard',
            tutor: '/tutor/dashboard',
            student: '/student/dashboard'
        }
        return dashboardRoutes[role] || '/student/dashboard'
    }
}