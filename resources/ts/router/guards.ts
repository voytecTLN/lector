// resources/ts/router/guards.ts - POPRAWIONA WERSJA
import { authService } from '@services/AuthService'
import Logger from '@/utils/logger'
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
        // Special handling for verification routes
        const verificationRoutes = ['verify-email', 'resend-verification']
        if (verificationRoutes.includes(context.to.route.name)) {
            return { allowed: true }
        }

        const isAuthenticated = authService.isAuthenticated()
        const requiresAuth = context.to.route.meta?.requiresAuth
        const requiresGuest = context.to.route.meta?.requiresGuest

        // Route requires authentication but user is not logged in
        if (requiresAuth && !isAuthenticated) {
            if (window.router) {
                window.router.setIntendedUrl(context.to.path)
            }

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
        // Return role-based dashboard route
        return `/${role}/dashboard`
    }
}

// Verification Guard - sprawdza weryfikację email
export class VerificationGuard implements RouteGuard {
    name = 'verification'

    execute(context: GuardContext): GuardResult {
        const requiresVerification = context.to.route.meta?.requiresVerification

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
        // Special handling for verify-email
        if (context.to.route.name === 'verify-email') {
            return { allowed: true }
        }

        // Sprawdź czy trasa wymaga autoryzacji
        const requiresAuth = context.to.route.meta?.requiresAuth
        const requiresVerification = context.to.route.meta?.requiresVerification

        // Jeśli trasa nie wymaga autoryzacji, pozwól przejść
        if (!requiresAuth && !requiresVerification) {
            return { allowed: true }
        }

        // Teraz sprawdzamy sesję tylko dla chronionych tras
        const token = authService.getToken()
        const user = authService.getUser()

        // Jeśli nie ma tokenu dla chronionej trasy, zablokuj dostęp
        if (!token) {
            // Store intended URL for later redirect after login
            if (window.router && requiresAuth) {
                window.router.setIntendedUrl(context.to.path)
            }
            return {
                allowed: false,
                redirect: '/login',
                message: 'Wymagane logowanie.'
            }
        }

        // If we have token but no user data, try to fetch user
        if (token && !user) {
            try {
                await authService.getCurrentUser()
                return { allowed: true }
            } catch (error) {
                // Don't clear data for certain routes
                const safeRoutes = ['verify-email', 'login', 'register', 'forgot-password', 'reset-password']
                if (!safeRoutes.includes(context.to.route.name)) {
                    authService.logout()
                }

                return {
                    allowed: false,
                    redirect: '/login',
                    message: 'Sesja wygasła. Zaloguj się ponownie.'
                }
            }
        }

        return { allowed: true }
    }
}

// Default guards that will be applied to all routes
export const defaultGuards: RouteGuard[] = [
    new DevelopmentGuard(),    // Najpierw sprawdź tryb dev
    new SessionGuard(),        // Potem sesję (tylko dla chronionych tras)
    new AuthGuard(),          // Potem autoryzację
    new AccountStatusGuard(), // Status konta
    new VerificationGuard(),  // Weryfikację
    new RoleGuard(),          // Role
    new PermissionGuard()     // Na końcu uprawnienia
]
