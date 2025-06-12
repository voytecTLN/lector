// resources/ts/components/layouts/GuestLayout.ts
import type { RouteComponent } from '@/router/routes'

export class GuestLayout implements RouteComponent {
    private container: HTMLElement | null = null
    private navigationComponent: any = null

    async render(): Promise<HTMLElement> {
        const layout = document.createElement('div')
        layout.className = 'guest-layout'

        layout.innerHTML = `
            <div class="guest-layout-wrapper">
                <!-- Header -->
                <header class="guest-header">
                    <div class="container">
                        <div class="header-content">
                            <div class="header-left">
                                <div class="logo">
                                    <a href="/" data-navigate>
                                        <span class="logo-icon">🎓</span>
                                        <span class="logo-text">Platforma Lektorów</span>
                                    </a>
                                </div>
                            </div>
                            
                            <div class="header-center">
                                <nav class="main-navigation" id="main-navigation">
                                    <div class="nav-links">
                                        <a href="/" data-navigate class="nav-link">Strona główna</a>
                                        <a href="/tutors" data-navigate class="nav-link">Lektorzy</a>
                                        <a href="/courses" data-navigate class="nav-link">Kursy</a>
                                        <a href="/about" data-navigate class="nav-link">O nas</a>
                                        <a href="/contact" data-navigate class="nav-link">Kontakt</a>
                                    </div>
                                </nav>
                            </div>
                            
                            <div class="header-right">
                                <div class="auth-buttons">
                                    <a href="/login" data-navigate class="btn btn-outline-primary">
                                        Zaloguj się
                                    </a>
                                    <a href="/register" data-navigate class="btn btn-primary">
                                        Dołącz do nas
                                    </a>
                                </div>
                                <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle menu">
                                    <span class="hamburger"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="guest-main">
                    <div class="main-content" id="main-content">
                        <!-- Page content will be inserted here by router -->
                        <div class="loading-placeholder">
                            <div class="loading-spinner"></div>
                            <p>Ładowanie...</p>
                        </div>
                    </div>
                </main>

                <!-- Footer -->
                <footer class="guest-footer">
                    <div class="container">
                        <div class="footer-content">
                            <div class="footer-section">
                                <div class="footer-logo">
                                    <span class="logo-icon">🎓</span>
                                    <span class="logo-text">Platforma Lektorów</span>
                                </div>
                                <p class="footer-description">
                                    Najlepsza platforma do nauki języków obcych z wykwalifikowanymi lektorami.
                                </p>
                                <div class="social-links">
                                    <a href="#" class="social-link" aria-label="Facebook">📘</a>
                                    <a href="#" class="social-link" aria-label="Twitter">🐦</a>
                                    <a href="#" class="social-link" aria-label="LinkedIn">💼</a>
                                    <a href="#" class="social-link" aria-label="Instagram">📷</a>
                                </div>
                            </div>
                            
                            <div class="footer-section">
                                <h4>Dla Studentów</h4>
                                <ul class="footer-links">
                                    <li><a href="/register?role=student" data-navigate>Rozpocznij naukę</a></li>
                                    <li><a href="/tutors" data-navigate>Znajdź lektora</a></li>
                                    <li><a href="/courses" data-navigate>Przeglądaj kursy</a></li>
                                    <li><a href="/pricing" data-navigate>Cennik</a></li>
                                </ul>
                            </div>
                            
                            <div class="footer-section">
                                <h4>Dla Lektorów</h4>
                                <ul class="footer-links">
                                    <li><a href="/register?role=tutor" data-navigate>Zostań lektorem</a></li>
                                    <li><a href="/tutor-guide" data-navigate>Przewodnik lektora</a></li>
                                    <li><a href="/resources" data-navigate>Zasoby</a></li>
                                    <li><a href="/community" data-navigate>Społeczność</a></li>
                                </ul>
                            </div>
                            
                            <div class="footer-section">
                                <h4>Wsparcie</h4>
                                <ul class="footer-links">
                                    <li><a href="/help" data-navigate>Centrum pomocy</a></li>
                                    <li><a href="/contact" data-navigate>Kontakt</a></li>
                                    <li><a href="/faq" data-navigate>FAQ</a></li>
                                    <li><a href="/privacy" data-navigate>Polityka prywatności</a></li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="footer-bottom">
                            <div class="footer-bottom-left">
                                <p>&copy; 2025 Platforma Lektorów. Wszystkie prawa zastrzeżone.</p>
                            </div>
                            <div class="footer-bottom-right">
                                <div class="footer-bottom-links">
                                    <a href="/terms" data-navigate>Regulamin</a>
                                    <a href="/privacy" data-navigate>Prywatność</a>
                                    <a href="/cookies" data-navigate>Cookies</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>

                <!-- Back to top button -->
                <button class="back-to-top" id="back-to-top" aria-label="Powrót na górę">
                    ↑
                </button>
            </div>
        `

        return layout
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initScrollEffects()
        console.log('✅ GuestLayout mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 GuestLayout unmounted')
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Mobile menu toggle
        const mobileToggle = this.container.querySelector('#mobile-menu-toggle')
        mobileToggle?.addEventListener('click', this.toggleMobileMenu.bind(this))

        // Back to top button
        const backToTop = this.container.querySelector('#back-to-top')
        backToTop?.addEventListener('click', this.scrollToTop.bind(this))

        // Handle navigation clicks
        const navigation = this.container.querySelector('#main-navigation')
        navigation?.addEventListener('click', this.handleNavigationClick.bind(this))

        // Close mobile menu on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this))

        // Handle window resize and scroll
        window.addEventListener('resize', this.handleResize.bind(this))
        window.addEventListener('scroll', this.handleScroll.bind(this))
    }

    private initScrollEffects(): void {
        // Initial scroll state
        this.handleScroll()
    }

    private toggleMobileMenu(): void {
        const navigation = this.container?.querySelector('#main-navigation')
        const toggle = this.container?.querySelector('#mobile-menu-toggle')

        if (navigation && toggle) {
            const isOpen = navigation.classList.contains('mobile-open')
            navigation.classList.toggle('mobile-open', !isOpen)
            toggle.classList.toggle('active', !isOpen)

            // Prevent body scroll when menu is open
            document.body.classList.toggle('mobile-menu-open', !isOpen)
        }
    }

    private handleNavigationClick(event: Event): void {
        const target = event.target as HTMLElement
        const link = target.closest('a[data-navigate]')

        if (link) {
            // Close mobile menu after navigation
            this.closeMobileMenu()
        }
    }

    private handleOutsideClick(event: Event): void {
        const target = event.target as HTMLElement
        const navigation = this.container?.querySelector('#main-navigation')
        const toggle = this.container?.querySelector('#mobile-menu-toggle')

        if (navigation?.classList.contains('mobile-open') &&
            !navigation.contains(target) &&
            !toggle?.contains(target)) {
            this.closeMobileMenu()
        }
    }

    private handleResize(): void {
        // Close mobile menu on desktop
        if (window.innerWidth >= 768) {
            this.closeMobileMenu()
        }
    }

    private handleScroll(): void {
        const header = this.container?.querySelector('.guest-header')
        const backToTop = this.container?.querySelector('#back-to-top')

        if (header) {
            // Add scrolled class for styling
            header.classList.toggle('scrolled', window.scrollY > 50)
        }

        if (backToTop) {
            // Show/hide back to top button
            backToTop.classList.toggle('visible', window.scrollY > 300)
        }
    }

    private closeMobileMenu(): void {
        const navigation = this.container?.querySelector('#main-navigation')
        const toggle = this.container?.querySelector('#mobile-menu-toggle')

        navigation?.classList.remove('mobile-open')
        toggle?.classList.remove('active')
        document.body.classList.remove('mobile-menu-open')
    }

    private scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    private cleanup(): void {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this))
        window.removeEventListener('scroll', this.handleScroll.bind(this))
        document.removeEventListener('click', this.handleOutsideClick.bind(this))

        // Remove body classes
        document.body.classList.remove('mobile-menu-open')
    }
}