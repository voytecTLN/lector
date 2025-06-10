// resources/ts/components/auth/AuthModal.ts

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

    constructor() {
        this.createModal()
        this.init()
    }

    private createModal(): void {
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
                                    <label for="login-email">Email</label>
                                    <input type="email" id="login-email" name="email" class="form-control" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="login-password">Hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="login-password" name="password" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#login-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-group form-check">
                                    <input type="checkbox" id="login-remember" name="remember" class="form-check-input">
                                    <label for="login-remember" class="form-check-label">Zapamiętaj mnie</label>
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
                                    <label for="register-name">Imię i nazwisko</label>
                                    <input type="text" id="register-name" name="name" class="form-control" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="register-email">Email</label>
                                    <input type="email" id="register-email" name="email" class="form-control" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="register-password">Hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="register-password" name="password" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#register-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="register-password-confirm">Potwierdź hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="register-password-confirm" name="password_confirmation" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#register-password-confirm">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="register-role">Jestem</label>
                                    <select id="register-role" name="role" class="form-control" required>
                                        <option value="">Wybierz...</option>
                                        <option value="student">Uczniem</option>
                                        <option value="tutor">Lektorem</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="register-phone">Telefon (opcjonalnie)</label>
                                    <input type="tel" id="register-phone" name="phone" class="form-control">
                                </div>
                                
                                <div class="form-group">
                                    <label for="register-city">Miasto (opcjonalnie)</label>
                                    <input type="text" id="register-city" name="city" class="form-control">
                                </div>
                                
                                <div class="form-group form-check">
                                    <input type="checkbox" id="register-terms" name="terms_accepted" class="form-check-input" required>
                                    <label for="register-terms" class="form-check-label">
                                        Akceptuję <a href="/regulamin" target="_blank">regulamin</a> i <a href="/polityka-prywatnosci" target="_blank">politykę prywatności</a>
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
                                    <label for="forgot-email">Email</label>
                                    <input type="email" id="forgot-email" name="email" class="form-control" required>
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

        // Add modal styles
        const styles = `
            <style>
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
                }

                .auth-modal-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #1e293b;
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
                }

                .auth-modal-close:hover {
                    background: #f1f5f9;
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
                }

                .form-check-label {
                    margin-bottom: 0;
                    font-size: 0.875rem;
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
                }

                .auth-links a:hover {
                    text-decoration: underline;
                }

                .auth-description {
                    margin-bottom: 1.5rem;
                    color: #64748b;
                    text-align: center;
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
            </style>
        `

        // Add to document
        document.head.insertAdjacentHTML('beforeend', styles)
        document.body.insertAdjacentHTML('beforeend', modalHTML)

        this.modal = document.getElementById('auth-modal')
        this.backdrop = document.getElementById('auth-modal-backdrop')
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
            if (e.key === 'Escape' && this.isVisible()) {
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
    }

    public hide(): void {
        this.backdrop?.classList.remove('show')
        document.body.style.overflow = ''

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

    public isVisible(): boolean {
        return this.backdrop?.classList.contains('show') || false
    }

    public getCurrentView(): string {
        return this.currentView
    }
}

// Create global instance
export const authModal = new AuthModal()