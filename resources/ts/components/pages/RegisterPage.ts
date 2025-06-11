// resources/ts/pages/RegisterPage.ts - Strona rejestracji SPA
export class RegisterPage {
    private element: HTMLElement

    constructor() {
        this.element = this.createElement()
        this.init()
    }

    private createElement(): HTMLElement {
        const div = document.createElement('div')
        div.innerHTML = this.render()
        return div
    }

    public render(): string {
        return `
            <div class="auth-page">
                <div class="container">
                    <div class="auth-container">
                        <div class="auth-card">
                            <div class="auth-header">
                                <h1>Utwórz konto</h1>
                                <p>Dołącz do naszej społeczności uczących się języków</p>
                            </div>

                            <form id="spa-register-form" class="auth-form">
                                <div class="form-group">
                                    <label for="spa-register-name">Imię i nazwisko</label>
                                    <input type="text" id="spa-register-name" name="name" class="form-control" required>
                                </div>

                                <div class="form-group">
                                    <label for="spa-register-email">Email</label>
                                    <input type="email" id="spa-register-email" name="email" class="form-control" required>
                                </div>

                                <div class="form-group">
                                    <label for="spa-register-password">Hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="spa-register-password" name="password" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#spa-register-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="spa-register-password-confirm">Potwierdź hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="spa-register-password-confirm" name="password_confirmation" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#spa-register-password-confirm">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="spa-register-role">Jestem</label>
                                    <select id="spa-register-role" name="role" class="form-control" required>
                                        <option value="">Wybierz...</option>
                                        <option value="student">Uczniem</option>
                                        <option value="tutor">Lektorem</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="spa-register-phone">Telefon (opcjonalnie)</label>
                                    <input type="tel" id="spa-register-phone" name="phone" class="form-control">
                                </div>

                                <div class="form-group">
                                    <label for="spa-register-city">Miasto (opcjonalnie)</label>
                                    <input type="text" id="spa-register-city" name="city" class="form-control">
                                </div>

                                <div class="form-group form-check">
                                    <input type="checkbox" id="spa-register-terms" name="terms_accepted" class="form-check-input" required>
                                    <label for="spa-register-terms" class="form-check-label">
                                        Akceptuję <a href="#/terms" target="_blank">regulamin</a> i <a href="#/privacy" target="_blank">politykę prywatności</a>
                                    </label>
                                </div>

                                <button type="submit" class="btn btn-primary btn-block">
                                    <span class="btn-text">Utwórz konto</span>
                                </button>
                            </form>

                            <div class="auth-links">
                                <a href="#/login">Masz już konto? Zaloguj się</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    public init(): void {
        // Import and initialize register form
        import('../auth/RegisterForm').then(({ RegisterForm }) => {
            new RegisterForm('#spa-register-form')
        }).catch(error => {
            console.error('Error loading RegisterForm:', error)
        })
    }

    public getElement(): HTMLElement {
        return this.element
    }
}

