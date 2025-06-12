// resources/ts/components/layouts/AuthLayout.ts
import type { RouteComponent } from '@/router/routes'

export class AuthLayout implements RouteComponent {
    private container: HTMLElement | null = null

    async render(): Promise<HTMLElement> {
        const layout = document.createElement('div')
        layout.className = 'auth-layout'

        layout.innerHTML = `
            <div class="auth-layout-wrapper">
                <!-- Background Elements -->
                <div class="auth-background">
                    <div class="auth-background-gradient"></div>
                    <div class="auth-background-pattern"></div>
                </div>

                <!-- Header (minimal) -->
                <header class="auth-header">
                    <div class="container">
                        <div class="auth-header-content">
                            <div class="logo">
                                <a href="/" data-navigate>
                                    <span class="logo-text">Platforma Lektorów</span>
                                </a>
                            </div>
                            <div class="auth-header-links">
                                <a href="/" data-navigate class="btn btn-secondary btn-sm">
                                    ← Powrót do strony głównej
                                </a>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="auth-main">
                    <div class="auth-container">
                        <div class="auth-content" id="auth-content">
                            <!-- Auth page content will be inserted here by router -->
                            <div class="loading-placeholder">
                                <div class="loading-spinner"></div>
                                <p>Ładowanie...</p>
                            </div>
                        </div>
                    </div>
                </main>

                <!-- Footer (minimal) -->
                <footer class="auth-footer">
                    <div class="container">
                        <div class="auth-footer-content">
                            <div class="auth-footer-links">
                                <a href="/privacy" data-navigate>Polityka prywatności</a>
                                <a href="/terms" data-navigate>Regulamin</a>
                                <a href="/help" data-navigate>Pomoc</a>
                            </div>
                            <div class="auth-footer-text">
                                <p>&copy; 2025 Platforma Lektorów</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        `

        return layout
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initAnimations()
        console.log('✅ AuthLayout mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 AuthLayout unmounted')
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Handle form submissions with loading states
        const forms = this.container.querySelectorAll('form')
        forms.forEach(form => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this))
        })
    }

    private initAnimations(): void {
        if (!this.container) return

        // Add entrance animations
        const authContent = this.container.querySelector('.auth-content')
        if (authContent) {
            authContent.classList.add('fade-in-up')
        }

        // Background pattern animation
        const pattern = this.container.querySelector('.auth-background-pattern')
        if (pattern) {
            pattern.classList.add('animate-float')
        }
    }

    private handleFormSubmit(event: Event): void {
        const form = event.target as HTMLFormElement
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement

        if (submitBtn) {
            // Add loading state
            submitBtn.classList.add('loading')
            submitBtn.disabled = true

            // Remove loading state after a delay (actual API call will handle this)
            setTimeout(() => {
                submitBtn.classList.remove('loading')
                submitBtn.disabled = false
            }, 3000)
        }
    }

    private cleanup(): void {
        // Remove any global effects
        document.body.classList.remove('auth-page-active')
    }
}