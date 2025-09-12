// resources/ts/services/AuthService.ts - Zgodny z Laravel Backend
import { api } from '@services/ApiService'
import type {
    User,
    LoginCredentials,
    RegisterData,
    NewPasswordData,
} from '@/types/auth'

// Dopasowane do Laravel AuthController responses
interface LaravelAuthResponse {
    success: boolean
    message?: string
    data: {
        user: User
        token: string
        permissions: string[]
        requires_verification?: boolean
    }
}

interface LaravelUserResponse {
    success: boolean
    data: {
        user: User
        permissions: string[]
    }
}

interface LaravelMessageResponse {
    success: boolean
    message: string
}

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
     * Login - zgodny z Laravel AuthController::login
     */
    async login(credentials: LoginCredentials): Promise<LaravelAuthResponse> {
        try {
            const response = await api.post<LaravelAuthResponse>('/auth/login', {
                email: credentials.email,
                password: credentials.password,
                remember: credentials.remember || false
            })

            if (response.success && response.data) {
                this.setAuthData(response.data.user, response.data.token, response.data.permissions)
                this.notifyAuthChange('login')

                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: response.message || 'Zalogowano pomyślnie!'
                    }
                }))
            }

            return response

        } catch (error: any) {
            console.error('❌ Login error:', error)

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
     * Register - zgodny z Laravel AuthController::register
     */
    async register(userData: RegisterData): Promise<LaravelAuthResponse> {
        try {
            const response = await api.post<LaravelAuthResponse>('/auth/register', {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                password_confirmation: userData.password_confirmation,
                role: userData.role,
                phone: userData.phone,
                city: userData.city,
                terms_accepted: userData.terms_accepted
            })

            if (response.success && response.data) {
                // IMPORTANT: DON'T log user in if verification is required
                if (response.data.requires_verification) {
                    // Only show message
                    document.dispatchEvent(new CustomEvent('notification:show', {
                        detail: {
                            type: 'warning',
                            message: response.message || 'Sprawdź swoją skrzynkę email i potwierdź adres aby się zalogować.'
                        }
                    }))
                } else {
                    // Only if user is already verified (edge case)
                    // Only if we have a token
                    if (response.data.token) {
                        this.setAuthData(response.data.user, response.data.token, response.data.permissions)
                        this.saveToStorage()
                        this.notifyAuthChange('register')
                    }
                }
            }

            return response

        } catch (error: any) {
            console.error('❌ Registration error:', error)

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
     * Logout - zgodny z Laravel AuthController::logout
     */
    async logout(): Promise<void> {
        try {
            // Only try API logout if we have a token
            if (this.token) {
                await api.post<LaravelMessageResponse>('/auth/logout')
            }
        } catch (error) {
            // Continue with logout even if API call fails
        } finally {
            this.clearAuthData()
            this.notifyAuthChange('logout')

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Zostałeś bezpiecznie wylogowany.',
                    duration: 3000
                }
            }))
        }
    }

    /**
     * Get current user - zgodny z Laravel AuthController::me
     */
    async getCurrentUser(): Promise<User | null> {
        if (!this.token) {
            return null
        }

        try {
            const response = await api.get<LaravelUserResponse>('/auth/me')

            if (response.success && response.data) {
                this.user = response.data.user
                this.permissions = response.data.permissions
                this.saveToStorage()
                return this.user
            }

            throw new Error('Invalid response format')

        } catch (error: any) {

            // Handle authorization error
            if (error.message?.includes('401')) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'warning',
                        message: 'Sesja wygasła. Zaloguj się ponownie.',
                        duration: 5000
                    }
                }))
                this.clearAuthData()
            }

            throw error
        }
    }

    /**
     * Forgot password - zgodny z Laravel AuthController::forgotPassword
     */
    async forgotPassword(email: string): Promise<void> {
        try {
            const response = await api.post<LaravelMessageResponse>('/auth/forgot-password', { email })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Link do resetowania hasła został wysłany.'
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
     * Reset password - zgodny z Laravel AuthController::resetPassword
     */
    async resetPassword(data: NewPasswordData): Promise<void> {
        try {
            const response = await api.post<LaravelMessageResponse>('/auth/reset-password', {
                token: data.token,
                password: data.password,
                password_confirmation: data.password_confirmation
            })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Hasło zostało zmienione pomyślnie.'
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

    isAuthenticated(): boolean {
        return !!this.token && !!this.user
    }

    isVerified(): boolean {
        return !!this.user?.email_verified_at
    }

    hasAnyRole(roles: string[]): boolean {
        return !!this.user?.role && roles.includes(this.user.role)
    }

    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission)
    }

    getUser(): User | null {
        return this.user
    }

    getToken(): string | null {
        return this.token
    }

    getPermissions(): string[] {
        return this.permissions
    }

    private setAuthData(user: User, token: string, permissions: string[]): void {
        this.user = user
        this.token = token
        this.permissions = permissions
        this.saveToStorage()
    }

    private clearAuthData(): void {
        this.user = null
        this.token = null
        this.permissions = []
        this.clearStorage()
    }

    private saveToStorage(): void {
        if (this.user && this.token) {
            localStorage.setItem('auth_user', JSON.stringify(this.user))
            localStorage.setItem('auth_token', this.token)
            localStorage.setItem('auth_permissions', JSON.stringify(this.permissions))
        }
    }

    private loadFromStorage(): void {
        try {
            const userData = localStorage.getItem('auth_user')
            const tokenData = localStorage.getItem('auth_token')
            const permissionsData = localStorage.getItem('auth_permissions')

            // Validate token format first
            if (tokenData && this.isValidToken(tokenData)) {
                this.token = tokenData
            }

            // Validate and parse user data
            if (userData && this.isValidUserData(userData)) {
                this.user = JSON.parse(userData)
            }

            // Validate and parse permissions
            if (permissionsData && this.isValidPermissionsData(permissionsData)) {
                this.permissions = JSON.parse(permissionsData)
            }

            // Clear invalid data if token or user is missing
            if (!this.token || !this.user) {
                this.clearStorage()
            }
        } catch (error) {
            console.warn('Invalid auth data in storage, clearing...', error)
            this.clearStorage()
        }
    }

    private clearStorage(): void {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_permissions')
    }

    private isValidToken(token: string): boolean {
        // Sanctum tokens have format: id|hash
        return token.length > 10 && token.includes('|') && token.split('|').length === 2
    }

    private isValidUserData(userData: string): boolean {
        try {
            const parsed = JSON.parse(userData)
            return parsed && 
                   typeof parsed.id === 'number' && 
                   typeof parsed.email === 'string' && 
                   typeof parsed.role === 'string' &&
                   parsed.email.includes('@')
        } catch {
            return false
        }
    }

    private isValidPermissionsData(permissionsData: string): boolean {
        try {
            const parsed = JSON.parse(permissionsData)
            return Array.isArray(parsed) && 
                   parsed.every(item => typeof item === 'string')
        } catch {
            return false
        }
    }

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