// resources/ts/router/routes.ts
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
        roles?: string[]
        permissions?: string[]
        layout?: 'app' | 'auth' | 'guest'
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
    // Public routes
    {
        path: '/',
        name: 'home',
        component: () => import('@/components/pages/HomePage').then(m => new m.HomePage()),
        title: 'Platforma Lektorów - Nauka języków online',
        meta: {
            layout: 'guest'
        }
    },

    // Auth routes (for guests only)
    {
        path: '/login',
        name: 'login',
        component: () => import('@/components/auth/LoginPage').then(m => new m.LoginPage()),
        title: 'Logowanie - Platforma Lektorów',
        meta: {
            layout: 'auth',
            requiresGuest: true
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
    // {
    //     path: '/forgot-password',
    //     name: 'forgot-password',
    //     component: () => import('@/components/auth/ForgotPasswordPage').then(m => new m.ForgotPasswordPage()),
    //     title: 'Resetowanie hasła - Platforma Lektorów',
    //     meta: {
    //         layout: 'auth',
    //         requiresGuest: true
    //     }
    // },
    // {
    //     path: '/reset-password',
    //     name: 'reset-password',
    //     component: () => import('@/components/auth/ResetPasswordPage').then(m => new m.ResetPasswordPage()),
    //     title: 'Nowe hasło - Platforma Lektorów',
    //     meta: {
    //         layout: 'auth',
    //         requiresGuest: true
    //     }
    // },
    // {
    //     path: '/verify-email',
    //     name: 'verify-email',
    //     component: () => import('@/components/auth/EmailVerificationPage').then(m => new m.EmailVerificationPage()),
    //     title: 'Weryfikacja email - Platforma Lektorów',
    //     meta: {
    //         layout: 'auth',
    //         requiresAuth: true
    //     }
    // },
    //
    // // Protected dashboard routes
    // {
    //     path: '/admin/dashboard',
    //     name: 'admin.dashboard',
    //     component: () => import('@/components/dashboard/AdminDashboard').then(m => new m.AdminDashboard()),
    //     title: 'Panel Administratora',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['admin'],
    //         layout: 'app'
    //     }
    // },
    // {
    //     path: '/moderator/dashboard',
    //     name: 'moderator.dashboard',
    //     component: () => import('@/components/dashboard/ModeratorDashboard').then(m => new m.ModeratorDashboard()),
    //     title: 'Panel Moderatora',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['moderator', 'admin'],
    //         layout: 'app'
    //     }
    // },
    // {
    //     path: '/tutor/dashboard',
    //     name: 'tutor.dashboard',
    //     component: () => import('@/components/dashboard/TutorDashboard').then(m => new m.TutorDashboard()),
    //     title: 'Panel Lektora',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['tutor', 'admin'],
    //         layout: 'app'
    //     }
    // },
    // {
    //     path: '/student/dashboard',
    //     name: 'student.dashboard',
    //     component: () => import('@/components/dashboard/StudentDashboard').then(m => new m.StudentDashboard()),
    //     title: 'Panel Studenta',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         roles: ['student', 'admin'],
    //         layout: 'app'
    //     }
    // },
    //
    // // Profile routes
    // {
    //     path: '/profile',
    //     name: 'profile',
    //     component: () => import('@/components/profile/ProfilePage').then(m => new m.ProfilePage()),
    //     title: 'Mój Profil',
    //     meta: {
    //         requiresAuth: true,
    //         requiresVerification: true,
    //         layout: 'app'
    //     }
    // },

    // Error routes
    {
        path: '/unauthorized',
        name: 'unauthorized',
        component: () => import('@/components/pages/UnauthorizedPage').then(m => new m.UnauthorizedPage()),
        title: 'Brak uprawnień - Platforma Lektorów',
        meta: {
            layout: 'guest'
        }
    },

    // 404 - must be last
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
}