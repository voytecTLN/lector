// resources/ts/router/guards.ts - POPRAWIONA WERSJA
import { authService } from '@services/AuthService'
import type { MatchedRoute } from './routes'

export interface GuardContext {
    to: MatchedRoute
    from?: MatchedRoute
}

export interface GuardResult {
    allowed: boolean
    redirect?: string
    message?: string
}

export interface RouteGuard {
    name: string
    execute(context: GuardContext): Promise<GuardResult> | GuardResult
}

// Auth Guard - sprawdza czy użytkownik jest zalogowany
export class AuthGuard implements RouteGuard {
    name = 'auth'

    execute(context: GuardContext): GuardResult {
        const isAuthenticated = authService.isAuthenticated()
        const requiresAuth = context.to.route.meta?.requiresAuth
        const requiresGuest = context.to.route.meta?.requiresGuest

        console.log(`🛡️ AuthGuard: checking route ${context.to.route.name}`, {
            requiresAuth,
            requiresGuest,
            isAuthenticated
        })

        // Route requires authentication but user is not logged in
        if (requiresAuth && !isAuthenticated) {
            return {
                allowed: false,
                redirect: '/login',
                message: 'Musisz się zalogować aby uzyskać dostęp do tej strony'
            }
        }

        // Route requires guest (not logged in) but user is authenticated
        if (requiresGuest && isAuthenticated) {
            const user = authService.getUser()
            const dashboardRoute = this.getDashboardRoute(user?.role || 'student')

            return {
                allowed: false,
                redirect: dashboardRoute,
                message: 'Jesteś już zalogowany'
            }
        }

        return { allowed: true }
    }

    private getDashboardRoute(role: string): string {
        const dashboardMap: Record<string, string> = {
            admin: '/admin/dashboard',
            moderator: '/moderator/dashboard',
            tutor: '/tutor/dashboard',
            student: '/student/dashboard'
        }
        return dashboardMap[role] || '/student/dashboard'
    }
}

// Verification Guard - sprawdza weryfikację email
export class VerificationGuard implements RouteGuard {
    name = 'verification'

    execute(context: GuardContext): GuardResult {
        const requiresVerification = context.to.route.meta?.requiresVerification

        console.log(`✅ VerificationGuard: checking verification for ${context.to.route.name}`, {
            requiresVerification
        })

        if (!requiresVerification) {
            return { allowed: true }
        }

        const user = authService.getUser()

        if (!user) {
            return {
                allowed: false,
                redirect: '/login',
                message: 'Wymagane uwierzytelnienie'
            }
        }

        const isVerified = authService.isVerified()

        console.log(`✅ VerificationGuard: user verification status`, {
            isVerified,
            email_verified_at: user.email_verified_at
        })

        if (!isVerified) {
            return {
                allowed: false,
                redirect: '/verify-email',
                message: 'Wymagana weryfikacja adresu email'
            }
        }

        return { allowed: true }
    }
}

// Role Guard - sprawdza uprawnienia użytkownika (POPRAWIONY - usunięto PHP debug kod)
export class RoleGuard implements RouteGuard {
    name = 'role'

    execute(context: GuardContext): GuardResult {
        const user = authService.getUser()
        const requiredRoles = context.to.route.meta?.roles

        console.log(`🎭 RoleGuard: checking roles for ${context.to.route.name}`, {
            requiredRoles,
            userRole: user?.role
        })

        if (!requiredRoles || requiredRoles.length === 0) {
            return { allowed: true }
        }

        if (!user) {
            return {
                allowed: false,
                redirect: '/login',
                message: 'Wymagane uwierzytelnienie'
            }
        }

        const hasRequiredRole = authService.hasAnyRole(requiredRoles)

        if (!hasRequiredRole) {
            return {
                allowed: false,
                redirect: '/unauthorized',
                message: `Nie masz uprawnień do tej strony. Wymagana rola: ${requiredRoles.join(' lub ')}`
            }
        }

        return { allowed: true }
    }
}

// Permission Guard - sprawdza szczegółowe uprawnienia
export class PermissionGuard implements RouteGuard {
    name = 'permission'

    execute(context: GuardContext): GuardResult {
        const requiredPermissions = context.to.route.meta?.permissions

        console.log(`🔐 PermissionGuard: checking permissions for ${context.to.route.name}`, {
            requiredPermissions
        })

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return { allowed: true }
        }

        const user = authService.getUser()

        if (!user) {
            return {
                allowed: false,
                redirect: '/login',
                message: 'Wymagane uwierzytelnienie'
            }
        }

        const hasPermission = requiredPermissions.some(permission =>
            authService.hasPermission(permission)
        )

        console.log(`🔐 PermissionGuard: permission check result`, {
            hasPermission,
            userPermissions: authService.getPermissions()
        })

        if (!hasPermission) {
            return {
                allowed: false,
                redirect: '/unauthorized',
                message: `Brak wymaganych uprawnień: ${requiredPermissions.join(', ')}`
            }
        }

        return { allowed: true }
    }
}

// Account Status Guard - sprawdza status konta (active/blocked)
export class AccountStatusGuard implements RouteGuard {
    name = 'accountStatus'

    execute(context: GuardContext): GuardResult {
        const user = authService.getUser()

        if (!user) {
            return { allowed: true } // Other guards will handle auth
        }

        console.log(`📊 AccountStatusGuard: checking account status`, {
            userStatus: user.status,
            route: context.to.route.name
        })

        if (user.status === 'blocked') {
            return {
                allowed: false,
                redirect: '/unauthorized',
                message: 'Twoje konto zostało zablokowane. Skontaktuj się z administratorem.'
            }
        }

        if (user.status === 'inactive') {
            return {
                allowed: false,
                redirect: '/unauthorized',
                message: 'Twoje konto jest nieaktywne.'
            }
        }

        return { allowed: true }
    }
}

// Development Guard - blokuje dostęp w trybie production
export class DevelopmentGuard implements RouteGuard {
    name = 'development'

    execute(context: GuardContext): GuardResult {
        const isDevelopment = import.meta.env.DEV
        const requiresDevelopment = context.to.route.meta?.requiresDevelopment

        if (requiresDevelopment && !isDevelopment) {
            return {
                allowed: false,
                redirect: '/',
                message: 'Ta strona jest dostępna tylko w trybie deweloperskim'
            }
        }

        return { allowed: true }
    }
}

export class SessionGuard implements RouteGuard {
    name = 'session'

    async execute(context: GuardContext): Promise<GuardResult> {
        const token = authService.getToken()
        const user = authService.getUser()

        // Jeśli mamy token ale nie mamy użytkownika, spróbuj pobrać dane
        if (token && !user) {
            console.log('🔄 SessionGuard: Token exists but no user data, fetching...')

            try {
                await authService.getCurrentUser()
                return { allowed: true }
            } catch (error) {
                console.log('❌ SessionGuard: Failed to fetch user, session expired')

                // Wyczyść nieważne dane
                authService.logout()

                // Przekieruj na login tylko jeśli trasa wymaga autoryzacji
                if (context.to.route.meta?.requiresAuth) {
                    return {
                        allowed: false,
                        redirect: '/login',
                        message: 'Sesja wygasła. Zaloguj się ponownie.'
                    }
                }
            }
        }

        return { allowed: true }
    }
}

// Default guards that will be applied to all routes
export const defaultGuards: RouteGuard[] = [
    new SessionGuard(),
    new AuthGuard(),
    new AccountStatusGuard(),
    new VerificationGuard(),
    new RoleGuard(),
    new PermissionGuard(),
    new DevelopmentGuard()
]

// Helper function to create custom guard
export function createCustomGuard(
    name: string,
    guardFunction: (context: GuardContext) => GuardResult | Promise<GuardResult>
): RouteGuard {
    return {
        name,
        execute: guardFunction
    }
}

// Guard result helpers
export const GuardResults = {
    allow(): GuardResult {
        return { allowed: true }
    },

    deny(message: string, redirect?: string): GuardResult {
        return {
            allowed: false,
            message,
            redirect
        }
    },

    redirectToLogin(message: string = 'Wymagane uwierzytelnienie'): GuardResult {
        return {
            allowed: false,
            redirect: '/login',
            message
        }
    },

    redirectToUnauthorized(message: string = 'Brak uprawnień'): GuardResult {
        return {
            allowed: false,
            redirect: '/unauthorized',
            message
        }
    },

    redirectToVerification(message: string = 'Wymagana weryfikacja email'): GuardResult {
        return {
            allowed: false,
            redirect: '/verify-email',
            message
        }
    }
}