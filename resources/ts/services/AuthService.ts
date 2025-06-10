// resources/ts/services/AuthService.ts - Poprawiony

import { api } from '@services/ApiService'
import type {
    User,
    LoginCredentials,
    RegisterData,
    AuthResponse,
    PasswordResetData,
    NewPasswordData,
    ApiResponse,
    CurrentUserResponse
} from '@/types/auth'

export class AuthService {
    private static instance: AuthService
    private user: User | null = null
    private token: string | null = null
    private permissions: string[] = []

    constructor() {
        this.loadFromStorage()
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService()
        }
        return AuthService.instance
    }

    /**
     * Login user with email and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await api.post<AuthResponse>('/auth/login', credentials)

            if (response.success) {
                this.setAuthData(response.data.user, response.data.token, response.data.permissions)
                this.notifyAuthChange('login')

                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Zalogowano pomyślnie!'
                    }
                }))
            }

            return response

        } catch (error: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas logowania'
                }
            }))
            throw error
        }
    }

    /**
     * Register new user
     */
    async register(userData: RegisterData): Promise<AuthResponse> {
        try {
            const response = await api.post<AuthResponse>('/auth/register', userData)

            if (response.success) {
                this.setAuthData(response.data.user, response.data.token, response.data.permissions)
                this.notifyAuthChange('register')

                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Konto zostało utworzone! Sprawdź email w celu weryfikacji.'
                    }
                }))
            }

            return response

        } catch (error: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas rejestracji'
                }
            }))
            throw error
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            // Tylko spróbuj wywołać API logout jeśli mamy token
            if (this.token) {
                await api.post('/auth/logout', {})
            }
        } catch (error) {
            console.error('Logout API error:', error)
            // Kontynuuj logout nawet jeśli API nie odpowie
        } finally {
            this.clearAuthData()
            this.notifyAuthChange('logout')

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'info',
                    message: 'Wylogowano pomyślnie'
                }
            }))
        }
    }

    /**
     * Get current user data
     */
    async getCurrentUser(): Promise<User | null> {
        if (!this.token) {
            return null
        }

        try {
            // Dodaj token do nagłówka
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': this.getCSRFToken()
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.clearAuthData()
                    return null
                }
                throw new Error(`HTTP ${response.status}`)
            }

            const data: CurrentUserResponse = await response.json()

            if (data.success) {
                this.user = data.data.user
                this.permissions = data.data.permissions
                this.saveToStorage()
                return this.user
            }

            throw new Error('Invalid response format')

        } catch (error) {
            console.error('Get current user error:', error)
            this.clearAuthData()
            return null
        }
    }

    /**
     * Get CSRF token from meta tag
     */
    private getCSRFToken(): string {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        return token || ''
    }

    /**
     * Send password reset email
     */
    async forgotPassword(email: string): Promise<void> {
        try {
            await api.post<ApiResponse>('/auth/forgot-password', { email })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Link do resetowania hasła został wysłany na podany adres email.'
                }
            }))

        } catch (error: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas wysyłania emaila'
                }
            }))
            throw error
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(data: NewPasswordData): Promise<void> {
        try {
            await api.post<ApiResponse>('/auth/reset-password', data)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Hasło zostało zmienione pomyślnie.'
                }
            }))

        } catch (error: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas resetowania hasła'
                }
            }))
            throw error
        }
    }

    /**
     * Change password for authenticated user
     */
    async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
        try {
            await api.post<ApiResponse>('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword
            })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Hasło zostało zmienione pomyślnie.'
                }
            }))

        } catch (error: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas zmiany hasła'
                }
            }))
            throw error
        }
    }

    /**
     * Resend email verification
     */
    async resendVerification(): Promise<void> {
        try {
            await api.post<ApiResponse>('/auth/resend-verification', {})

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Email weryfikacyjny został wysłany ponownie.'
                }
            }))

        } catch (error: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas wysyłania emaila weryfikacyjnego'
                }
            }))
            throw error
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.token && !!this.user
    }

    /**
     * Check if user is verified
     */
    isVerified(): boolean {
        return !!this.user?.is_verified
    }

    /**
     * Check if user has specific role
     */
    hasRole(role: string): boolean {
        return this.user?.role === role
    }

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(roles: string[]): boolean {
        return !!this.user?.role && roles.includes(this.user.role)
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission)
    }

    /**
     * Get current user
     */
    getUser(): User | null {
        return this.user
    }

    /**
     * Get current token
     */
    getToken(): string | null {
        return this.token
    }

    /**
     * Get user permissions
     */
    getPermissions(): string[] {
        return this.permissions
    }

    /**
     * Set authentication data
     */
    private setAuthData(user: User, token: string, permissions: string[]): void {
        this.user = user
        this.token = token
        this.permissions = permissions
        this.saveToStorage()
    }

    /**
     * Clear authentication data
     */
    private clearAuthData(): void {
        this.user = null
        this.token = null
        this.permissions = []
        this.clearStorage()
    }

    /**
     * Save auth data to local storage
     */
    private saveToStorage(): void {
        if (this.user && this.token) {
            localStorage.setItem('auth_user', JSON.stringify(this.user))
            localStorage.setItem('auth_token', this.token)
            localStorage.setItem('auth_permissions', JSON.stringify(this.permissions))
        }
    }

    /**
     * Load auth data from local storage
     */
    private loadFromStorage(): void {
        try {
            const user = localStorage.getItem('auth_user')
            const token = localStorage.getItem('auth_token')
            const permissions = localStorage.getItem('auth_permissions')

            if (user && token) {
                this.user = JSON.parse(user)
                this.token = token
                this.permissions = permissions ? JSON.parse(permissions) : []
            }
        } catch (error) {
            console.error('Error loading auth data from storage:', error)
            this.clearStorage()
        }
    }

    /**
     * Clear storage
     */
    private clearStorage(): void {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_permissions')
    }

    /**
     * Notify auth state change
     */
    private notifyAuthChange(type: 'login' | 'logout' | 'register'): void {
        document.dispatchEvent(new CustomEvent('auth:change', {
            detail: {
                type,
                user: this.user,
                isAuthenticated: this.isAuthenticated()
            }
        }))
    }
}

// Create singleton instance
export const authService = AuthService.getInstance()