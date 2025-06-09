// resources/ts/components/RouteGuard.ts

import { authService } from '@services/AuthService'
import type { RouteGuardConfig } from '@/types/auth'

export class RouteGuard {
    private static instance: RouteGuard

    public static getInstance(): RouteGuard {
        if (!RouteGuard.instance) {
            RouteGuard.instance = new RouteGuard()
        }
        return RouteGuard.instance
    }

    public async checkAccess(guard: RouteGuardConfig): Promise<boolean> {
        // Check authentication
        if (guard.requiresAuth && !authService.isAuthenticated()) {
            this.redirectToLogin()
            return false
        }

        // Check email verification
        if (guard.requiresVerification && !authService.isVerified()) {
            this.redirectToVerification()
            return false
        }

        // Check roles
        if (guard.roles && !authService.hasAnyRole(guard.roles)) {
            this.redirectToUnauthorized()
            return false
        }

        // Check permissions
        if (guard.permissions) {
            const hasPermission = guard.permissions.some(permission =>
                authService.hasPermission(permission)
            )

            if (!hasPermission) {
                this.redirectToUnauthorized()
                return false
            }
        }

        return true
    }

    private redirectToLogin(): void {
        const currentPath = window.location.pathname
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
    }

    private redirectToVerification(): void {
        window.location.href = '/email/verify'
    }

    private redirectToUnauthorized(): void {
        window.location.href = '/unauthorized'
    }
}

export const routeGuard = RouteGuard.getInstance()