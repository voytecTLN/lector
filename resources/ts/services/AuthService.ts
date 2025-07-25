// resources/ts/services/AuthService.ts - Zgodny z Laravel Backend
import { api } from '@services/ApiService'
import type {
    User,
    LoginCredentials,
    RegisterData,
    AuthResponse,
    PasswordResetData,
    NewPasswordData,
    CurrentUserResponse
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
            console.log('🔐 AuthService: Attempting login')
            console.log('email: credentials.email,password: credentials.password, remember: credentials.remember');
            console.log(credentials.email, credentials.password, credentials.remember);
            const response = await api.post<LaravelAuthResponse>('/auth/login', {
                email: credentials.email,
                password: credentials.password,
                remember: credentials.remember || false
            })

            if (response.success && response.data) {
                console.log('response.data.user, response.data.token, response.data.permissions');
                console.log(response.data.user, response.data.token, response.data.permissions);
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
            console.log('📝 AuthService: Attempting registration')

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

            console.log('response.success && response.data');
            console.log(response.success, response.data);

            if (response.success && response.data) {
                // WAŻNE: NIE logujemy użytkownika jeśli wymaga weryfikacji
                if (response.data.requires_verification) {
                    console.log('✉️ User requires email verification')

                    // Tylko pokazujemy komunikat
                    document.dispatchEvent(new CustomEvent('notification:show', {
                        detail: {
                            type: 'warning',
                            message: response.message || 'Sprawdź swoją skrzynkę email i potwierdź adres aby się zalogować.'
                        }
                    }))
                } else {
                    // Tylko jeśli użytkownik jest już zweryfikowany (edge case)
                    console.log('✅ User already verified, logging in')

                    // Tylko jeśli mamy token
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
            console.log('🚪 AuthService: Logging out')

            // Tylko spróbuj API logout jeśli mamy token
            if (this.token) {
                await api.post<LaravelMessageResponse>('/auth/logout')
            }
        } catch (error) {
            console.warn('⚠️ Logout API error (continuing anyway):', error)
        } finally {
            this.clearAuthData()
            this.notifyAuthChange('logout')

            // NOWE: Zmień komunikat na bardziej przyjazny
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
            console.log('🚫 No token available for getCurrentUser')
            return null
        }

        try {
            console.log('👤 AuthService: Getting current user with token:', this.token?.substring(0, 20) + '...')

            const response = await api.get<LaravelUserResponse>('/auth/me')

            if (response.success && response.data) {
                this.user = response.data.user
                this.permissions = response.data.permissions
                this.saveToStorage()
                console.log('✅ User data updated:', { 
                    name: this.user.name, 
                    role: this.user.role,
                    email: this.user.email,
                    permissions: this.permissions 
                })
                return this.user
            }

            throw new Error('Invalid response format')

        } catch (error: any) {
            console.error('❌ Get current user error:', error)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            })

            // NOWE: Dodaj komunikat jeśli to problem z autoryzacją
            if (error.message?.includes('401')) {
                console.log('🔑 Token expired or invalid, clearing auth data')
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'warning',
                        message: 'Sesja wygasła. Zaloguj się ponownie.',
                        duration: 5000
                    }
                }))
                this.clearAuthData()
            } else {
                console.log('🌐 Network or other error, not clearing auth data')
            }

            throw error
        }
    }

    /**
     * Forgot password - zgodny z Laravel AuthController::forgotPassword
     */
    async forgotPassword(email: string): Promise<void> {
        try {
            console.log('📧 AuthService: Sending password reset')

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
            console.log('🔑 AuthService: Resetting password')

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

    /**
     * Verify email - zgodny z Laravel AuthController::verifyEmail
     */
    async verifyEmail(token: string): Promise<void> {
        try {
            console.log('✅ AuthService: Verifying email')

            const response = await api.post<LaravelMessageResponse>('/auth/verify-email', { token })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Email został zweryfikowany pomyślnie!'
                }
            }))

            // Odśwież dane użytkownika po weryfikacji
            if (this.token) {
                await this.getCurrentUser()
            }

        } catch (error: any) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas weryfikacji emaila'
                }
            }))
            throw error
        }
    }

    /**
     * Resend verification - zgodny z Laravel AuthController::resendVerification
     */
    async resendVerification(): Promise<void> {
        try {
            console.log('📧 AuthService: Resending verification')

            const response = await api.post<LaravelMessageResponse>('/auth/resend-verification')

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Email weryfikacyjny został wysłany ponownie.'
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
     * Change password - zgodny z Laravel AuthController::changePassword
     */
    async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
        try {
            console.log('🔐 AuthService: Changing password')

            const response = await api.post<LaravelMessageResponse>('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword
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
                    message: error.message || 'Błąd podczas zmiany hasła'
                }
            }))
            throw error
        }
    }

    isAuthenticated(): boolean {
        console.log('!!this.token && !!this.user');
        console.log(this.token, this.user);
        return !!this.token && !!this.user
    }

    /*isVerified(): boolean {
        // Używamy tylko email_verified_at zgodnie z Laravel
        return !!this.user?.email_verified_at
    }*/
    isVerified(): boolean {
        // Używamy tylko email_verified_at zgodnie z Laravel
        return !!this.user?.email_verified_at;
    }

    hasRole(role: string): boolean {
        return this.user?.role === role
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