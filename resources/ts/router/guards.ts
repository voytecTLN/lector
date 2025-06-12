// resources/ts/router/guards.ts
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

// Role Guard - sprawdza uprawnienia użytkownika
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
                message: 'Nie masz uprawnień do tej strony'
            }
        }

        return { allowed: true }
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
                message: 'Brak wymaganych uprawnień'
            }
        }

        return { allowed: true }
    }
}

// Default guards that will be applied to all routes
export const defaultGuards: RouteGuard[] = [
    new AuthGuard(),
    new RoleGuard(),
    new VerificationGuard(),
    new PermissionGuard()
]