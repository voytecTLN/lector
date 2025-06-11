// resources/ts/components/pages/LoginPage.ts

import { LoginForm } from '@components/auth/LoginForm'
import { authService } from '@services/AuthService'

export class LoginPage {
    private container: HTMLElement
    private loginForm: LoginForm | null = null

    constructor(container: HTMLElement) {
        this.container = container
        this.render()
        this.init()
    }

    private render(): void {
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
            this.redirectToDashboard()
            return
        }

        this.container.innerHTML = this.getTemplate()
    }

    private getTemplate(): string {
        return `
            <div class="auth-page">
                <div class="container">
                    <div class="auth-container">
                        <div class="auth-card">
                            <div class="auth-header">
                                <h1>Zaloguj się</h1>
                                <p>Wprowadź swoje dane, aby uzyskać dostęp do konta</p>
                            </div>

                            <form id="login-form" class="auth-form">
                                <div class="form-group">
                                    <label for="email">Email</label>
                                    <input type="email" id="email" name="email" class="form-control" required>
                                </div>

                                <div class="form-group">
                                    <label for="password">Hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="password" name="password" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="form-group form-check">
                                    <input type="checkbox" id="remember" name="remember" class="form-check-input">
                                    <label for="remember" class="form-check-label">Zapamiętaj mnie</label>
                                </div>

                                <button type="submit" class="btn btn-primary btn-block">
                                    <span class="btn-text">Zaloguj się</span>
                                </button>
                            </form>

                            <div class="auth-links">
                                <button id="forgot-password-link" class="link-button">Zapomniałeś hasła?</button>
                                <span>•</span>
                                <button id="register-link" class="link-button">Utwórz konto</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #ff6b35 0%, #e91e63 100%);
                    padding: 2rem 0;
                }

                .auth-container {
                    width: 100%;
                    max-width: 400px;
                    margin: 0 auto;
                }

                .auth-card {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .auth-header h1 {
                    margin-bottom: 0.5rem;
                    color: #1e293b;
                }

                .auth-header p {
                    color: #64748b;
                    margin: 0;
                }

                .auth-form .form-group {
                    margin-bottom: 1rem;
                }

                .auth-form label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #374151;
                }

                .auth-form .form-control {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                }

                .auth-form .form-control:focus {
                    border-color: #e91e63;
                    box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
                    outline: none;
                }

                .password-input-wrapper {
                    position: relative;
                }

                .password-toggle {
                    position: absolute;
                    right: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 0.25rem;
                }

                .password-toggle:hover {
                    color: #e91e63;
                }

                .form-check {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .form-check-input {
                    width: 18px !important;
                    height: 18px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: 2px solid #d1d5db !important;
                    border-radius: 4px !important;
                    background: white !important;
                    cursor: pointer !important;
                    position: relative !important;
                    flex-shrink: 0 !important;
                    appearance: none !important;
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    transition: all 0.2s ease !important;
                    box-shadow: none !important;
                }

                .form-check-input:checked {
                    background-color: #e91e63 !important;
                    border-color: #e91e63 !important;
                    background-image: none !important;
                }

                .form-check-input:checked::before {
                    content: '✓' !important;
                    position: absolute !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    color: white !important;
                    font-size: 12px !important;
                    font-weight: bold !important;
                    line-height: 1 !important;
                }

                .form-check-input:focus {
                    box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1) !important;
                    outline: none !important;
                    border-color: #e91e63 !important;
                }

                .form-check-label {
                    margin-bottom: 0;
                    font-size: 0.875rem;
                    cursor: pointer;
                }

                .btn-block {
                    width: 100%;
                    margin-top: 1rem;
                }

                .auth-links {
                    text-align: center;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e2e8f0;
                }

                .link-button {
                    background: none;
                    border: none;
                    color: #e91e63;
                    text-decoration: none;
                    font-size: 0.875rem;
                    cursor: pointer;
                    padding: 0;
                    margin: 0 0.5rem;
                }

                .link-button:hover {
                    text-decoration: underline;
                }

                @media (max-width: 640px) {
                    .auth-page {
                        padding: 1rem;
                    }

                    .auth-card {
                        padding: 1.5rem;
                    }
                }
            </style>
        `
    }

    private init(): void {
        this.setupEventListeners()
        this.initializeForm()
    }

    private setupEventListeners(): void {
        // Navigation links
        const registerLink = this.container.querySelector('#register-link')
        const forgotPasswordLink = this.container.querySelector('#forgot-password-link')

        registerLink?.addEventListener('click', () => {
            window.router.navigate('/register')
        })

        forgotPasswordLink?.addEventListener('click', () => {
            window.router.navigate('/forgot-password')
        })

        // Listen for successful login
        document.addEventListener('auth:change', (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail.type === 'login') {
                this.redirectToDashboard()
            }
        })
    }

    private initializeForm(): void {
        const formElement = this.container.querySelector('#login-form')
        if (formElement) {
            this.loginForm = new LoginForm('#login-form')
        }
    }

    private redirectToDashboard(): void {
        const user = authService.getUser()
        if (!user) return

        let redirectUrl = '/'

        switch (user.role) {
            case 'admin':
                redirectUrl = '/admin/dashboard'
                break
            case 'moderator':
                redirectUrl = '/moderator/dashboard'
                break
            case 'tutor':
                redirectUrl = '/tutor/dashboard'
                break
            case 'student':
                redirectUrl = '/student/dashboard'
                break
        }

        // Use router to navigate
        window.router.navigate(redirectUrl)
    }

    public destroy(): void {
        // Cleanup
        this.loginForm?.reset()
        this.loginForm = null
    }
}