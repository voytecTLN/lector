// resources/ts/components/auth/AuthModal.ts - Modal autentykacji dla SPA

import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export class AuthModal {
    private modal: HTMLElement | null = null
    private backdrop: HTMLElement | null = null
    private loginForm: LoginForm | null = null
    private registerForm: RegisterForm | null = null
    private forgotPasswordForm: ForgotPasswordForm | null = null
    private currentView: 'login' | 'register' | 'forgot-password' = 'login'
    private isVisible: boolean = false

    constructor() {
        this.createModal()
        this.init()
    }

    private createModal(): void {
        // Remove existing modal if any
        const existingModal = document.getElementById('auth-modal-backdrop')
        if (existingModal) {
            existingModal.remove()
        }

        // Create modal HTML
        const modalHTML = `
            <div class="auth-modal-backdrop" id="auth-modal-backdrop">
                <div class="auth-modal" id="auth-modal">
                    <div class="auth-modal-header">
                        <h2 id="auth-modal-title">Zaloguj się</h2>
                        <button class="auth-modal-close" id="auth-modal-close" aria-label="Zamknij">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-modal-body">
                        <!-- Login Form -->
                        <div id="login-view" class="auth-view active">
                            <form id="login-form" class="auth-form">
                                <div class="form-group">
                                    <label for="modal-login-email">Email</label>
                                    <input type="email" id="modal-login-email" name="email" class="form-control" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="modal-login-password">Hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="modal-login-password" name="password" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#modal-login-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-group form-check">
                                    <input type="checkbox" id="modal-login-remember" name="remember" class="form-check-input">
                                    <label for="modal-login-remember" class="form-check-label">Zapamiętaj mnie</label>
                                </div>
                                
                                <button type="submit" class="btn btn-primary btn-block">
                                    <span class="btn-text">Zaloguj się</span>
                                </button>
                            </form>
                            
                            <div class="auth-links">
                                <a href="#" id="show-forgot-password">Zapomniałeś hasła?</a>
                                <span>•</span>
                                <a href="#" id="show-register">Utwórz konto</a>
                            </div>
                        </div>

                        <!-- Register Form -->
                        <div id="register-view" class="auth-view">
                            <form id="register-form" class="auth-form">
                                <div class="form-group">
                                    <label for="modal-register-name">Imię i nazwisko</label>
                                    <input type="text" id="modal-register-name" name="name" class="form-control" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="modal-register-email">Email</label>
                                    <input type="email" id="modal-register-email" name="email" class="form-control" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="modal-register-password">Hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="modal-register-password" name="password" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#modal-register-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="modal-register-password-confirm">Potwierdź hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="modal-register-password-confirm" name="password_confirmation" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#modal-register-password-confirm">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="modal-register-role">Jestem</label>
                                    <select id="modal-register-role" name="role" class="form-control" required>
                                        <option value="">Wybierz...</option>
                                        <option value="student">Uczniem</option>
                                        <option value="tutor">Lektorem</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="modal-register-phone">Telefon (opcjonalnie)</label>
                                    <input type="tel" id="modal-register-phone" name="phone" class="form-control">
                                </div>
                                
                                <div class="form-group">
                                    <label for="modal-register-city">Miasto (opcjonalnie)</label>
                                    <input type="text" id="modal-register-city" name="city" class="form-control">
                                </div>
                                
                                <div class="form-group form-check">
                                    <input type="checkbox" id="modal-register-terms" name="terms_accepted" class="form-check-input" required>
                                    <label for="modal-register-terms" class="form-check-label">
                                        Akceptuję <a href="#/terms" target="_blank">regulamin</a> i <a href="#/privacy" target="_blank">politykę prywatności</a>
                                    </label>
                                </div>
                                
                                <button type="submit" class="btn btn-primary btn-block">
                                    <span class="btn-text">Utwórz konto</span>
                                </button>
                            </form>
                            
                            <div class="auth-links">
                                <a href="#" id="show-login">Masz już konto? Zaloguj się</a>
                            </div>
                        </div>

                        <!-- Forgot Password Form -->
                        <div id="forgot-password-view" class="auth-view">
                            <form id="forgot-password-form" class="auth-form">
                                <p class="auth-description">
                                    Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła.
                                </p>
                                
                                <div class="form-group">
                                    <label for="modal-forgot-email">Email</label>
                                    <input type="email" id="modal-forgot-email" name="email" class="form-control" required>
                                </div>
                                
                                <button type="submit" class="btn btn-primary btn-block">
                                    <span class="btn-text">Wyślij link resetujący</span>
                                </button>
                            </form>
                            
                            <div class="auth-links">
                                <a href="#" id="back-to-login">Powrót do logowania</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Add to document
        document.body.insertAdjacentHTML('beforeend', modalHTML)

        this.modal = document.getElementById('auth-modal')
        this.backdrop = document.getElementById('auth-modal-backdrop')

        // Add CSS if not exists
        this.addStyles()
    }

    private addStyles(): void {
        if (document.getElementById('auth-modal-styles')) return

        const styles = document.createElement('style')
        styles.id = 'auth-modal-styles'
        styles.textContent = `
            .auth-modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1050;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
            }

            .auth-modal-backdrop.show {
                opacity: 1;
                visibility: visible;
            }

            .auth-modal {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 480px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
                transform: scale(0.9) translateY(-20px);
                transition: all 0.3s ease;
            }

            .auth-modal-backdrop.show .auth-modal {
                transform: scale(1) translateY(0);
            }

            .auth-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 12px 12px 0 0;
            }

            .auth-modal-header h2 {
                margin: 0;
                font-size: 1.5rem;
                color: #1e293b;
                font-weight: 600;
            }

            .auth-modal-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                color: #64748b;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.2s ease;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .auth-modal-close:hover {
                background: #e2e8f0;
                color: #e91e63;
            }

            .auth-modal-body {
                padding: 1.5rem;
            }

            .auth-view {
                display: none;
            }

            .auth-view.active {
                display: block;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .auth-form .form-group {
                margin-bottom: 1rem;
            }

            .auth-form label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #374151;
                font-size: 0.875rem;
            }

            .auth-form .form-control {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 1rem;
                transition: all 0.2s ease;
                font-family: inherit;
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
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .password-toggle:hover {
                color: #e91e63;
                background: rgba(233, 30, 99, 0.1);
            }

            .form-check {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                margin-bottom: 1rem;
                padding: 0;
                min-height: auto;
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
                vertical-align: top !important;
                margin-top: 2px !important;
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
                font-size: 0.875rem !important;
                line-height: 1.4 !important;
                color: #64748b !important;
                cursor: pointer !important;
                margin: 0 !important;
                flex: 1 !important;
                padding-top: 1px !important;
            }

            .form-check-label a {
                color: #e91e63 !important;
                text-decoration: none !important;
                font-weight: 500 !important;
            }

            .form-check-label a:hover {
                text-decoration: underline !important;
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

            .auth-links a {
                color: #e91e63;
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: 500;
            }

            .auth-links a:hover {
                text-decoration: underline;
            }

            .auth-links span {
                margin: 0 0.5rem;
                color: #94a3b8;
            }

            .auth-description {
                margin-bottom: 1.5rem;
                color: #64748b;
                text-align: center;
                font-size: 0.875rem;
                line-height: 1.5;
            }

            @media (max-width: 640px) {
                .auth-modal {
                    width: 95%;
                    margin: 1rem;
                }
                
                .auth-modal-header,
                .auth-modal-body {
                    padding: 1rem;
                }
            }
        `
        document.head.appendChild(styles)
    }

    private init(): void {
        this.setupEventListeners()
        this.initializeForms()
    }

    private setupEventListeners(): void {
        // Close modal events
        document.getElementById('auth-modal-close')?.addEventListener('click', () => {
            this.hide()
        })

        this.backdrop?.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.hide()
            }
        })

        // View switching
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault()
            this.switchView('register')
        })

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault()
            this.switchView('login')
        })

        document.getElementById('show-forgot-password')?.addEventListener('click', (e) => {
            e.preventDefault()
            this.switchView('forgot-password')
        })

        document.getElementById('back-to-login')?.addEventListener('click', (e) => {
            e.preventDefault()
            this.switchView('login')
        })

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide()
            }
        })
    }

    private initializeForms(): void {
        this.loginForm = new LoginForm('#login-form')
        this.registerForm = new RegisterForm('#register-form')
        this.forgotPasswordForm = new ForgotPasswordForm('#forgot-password-form')
    }

    public show(view: 'login' | 'register' | 'forgot-password' = 'login'): void {
        this.switchView(view)
        this.backdrop?.classList.add('show')
        document.body.style.overflow = 'hidden'
        this.isVisible = true
    }

    public hide(): void {
        this.backdrop?.classList.remove('show')
        document.body.style.overflow = ''
        this.isVisible = false

        // Reset forms after hiding
        setTimeout(() => {
            this.loginForm?.reset()
            this.registerForm?.reset()
            this.forgotPasswordForm?.reset()
        }, 300)
    }

    public switchView(view: 'login' | 'register' | 'forgot-password'): void {
        this.currentView = view

        // Hide all views
        document.querySelectorAll('.auth-view').forEach(view => {
            view.classList.remove('active')
        })

        // Show selected view
        const targetView = document.getElementById(`${view}-view`)
        targetView?.classList.add('active')

        // Update title
        const title = document.getElementById('auth-modal-title')
        if (title) {
            switch (view) {
                case 'login':
                    title.textContent = 'Zaloguj się'
                    break
                case 'register':
                    title.textContent = 'Utwórz konto'
                    break
                case 'forgot-password':
                    title.textContent = 'Resetuj hasło'
                    break
            }
        }

        // Focus first input
        setTimeout(() => {
            const firstInput = targetView?.querySelector('input') as HTMLInputElement
            firstInput?.focus()
        }, 100)
    }

    public isModalVisible(): boolean {
        return this.isVisible
    }

    public getCurrentView(): string {
        return this.currentView
    }
}

// Create global instance
export const authModal = new AuthModal()