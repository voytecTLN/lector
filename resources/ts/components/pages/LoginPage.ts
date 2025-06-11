// resources/ts/pages/LoginPage.ts - Strona logowania SPA
export class LoginPage {
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
                                <h1>Zaloguj się</h1>
                                <p>Wprowadź swoje dane, aby uzyskać dostęp do konta</p>
                            </div>

                            <form id="spa-login-form" class="auth-form">
                                <div class="form-group">
                                    <label for="spa-login-email">Email</label>
                                    <input type="email" id="spa-login-email" name="email" class="form-control" required>
                                </div>

                                <div class="form-group">
                                    <label for="spa-login-password">Hasło</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="spa-login-password" name="password" class="form-control" required>
                                        <button type="button" class="password-toggle" data-toggle-password="#spa-login-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="form-group form-check">
                                    <input type="checkbox" id="spa-login-remember" name="remember" class="form-check-input">
                                    <label for="spa-login-remember" class="form-check-label">Zapamiętaj mnie</label>
                                </div>

                                <button type="submit" class="btn btn-primary btn-block">
                                    <span class="btn-text">Zaloguj się</span>
                                </button>
                            </form>

                            <div class="auth-links">
                                <a href="#/forgot-password">Zapomniałeś hasła?</a>
                                <span>•</span>
                                <a href="#/register">Utwórz konto</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    public init(): void {
        // Import and initialize login form
        import('../auth/LoginForm').then(({ LoginForm }) => {
            new LoginForm('#spa-login-form')
        }).catch(error => {
            console.error('Error loading LoginForm:', error)
        })
    }

    public getElement(): HTMLElement {
        return this.element
    }
}

