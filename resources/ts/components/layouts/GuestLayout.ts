// resources/ts/components/layouts/GuestLayout.ts - POPRAWIONE
import type { RouteComponent } from '@/router/routes'

export class GuestLayout implements RouteComponent {
    private container: HTMLElement | null = null
    private navigationComponent: any = null
    private footerComponent: any = null

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
                                        <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                                        <button class="nav-link nav-link-disabled" disabled>Lektorzy (Wkrótce)</button>
                                        <button class="nav-link nav-link-disabled" disabled>Kursy (Wkrótce)</button>
                                        <button class="nav-link nav-link-disabled" disabled>O nas (Wkrótce)</button>
                                        <button class="nav-link nav-link-disabled" disabled>Kontakt (Wkrótce)</button>
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
                <div id="footer-container"></div>
            </div>
        `
        await this.initializeComponents(layout)

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

    private async initializeComponents(layout: HTMLElement): Promise<void> {
        try {
            const footerContainer = layout.querySelector('#footer-container')
            if (footerContainer) {
                const { Footer } = await import('@/components/common/Footer')
                this.footerComponent = new Footer()
                const footerElement = await this.footerComponent.render()
                footerContainer.appendChild(footerElement)

                if (this.footerComponent.mount) {
                    this.footerComponent.mount(footerElement as HTMLElement)
                }
            }
        } catch (error) {
            console.error('Failed to initialize GuestLayout components:', error)
        }
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Mobile menu toggle
        const mobileToggle = this.container.querySelector('#mobile-menu-toggle')
        mobileToggle?.addEventListener('click', this.toggleMobileMenu.bind(this))

        // Handle navigation clicks
        const navigation = this.container.querySelector('#main-navigation')
        navigation?.addEventListener('click', this.handleNavigationClick.bind(this))

        // POPRAWIONE - obsługa wyłączonych linków
        const disabledLinks = this.container.querySelectorAll('.nav-link-disabled')
        disabledLinks.forEach(link => {
            link.addEventListener('click', this.handleDisabledClick.bind(this))
        })

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

    private handleDisabledClick(event: Event): void {
        event.preventDefault()
        const element = event.currentTarget as HTMLElement
        const text = element.textContent?.trim() || 'Ta funkcja'

        // Show notification about coming soon feature
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${text.replace(' (Wkrótce)', '')} będzie dostępna wkrótce!`,
                duration: 3000
            }
        }))

        // Visual feedback
        element.classList.add('clicked')
        setTimeout(() => {
            element.classList.remove('clicked')
        }, 200)
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

        if (header) {
            // Add scrolled class for styling
            header.classList.toggle('scrolled', window.scrollY > 50)
        }
    }

    private closeMobileMenu(): void {
        const navigation = this.container?.querySelector('#main-navigation')
        const toggle = this.container?.querySelector('#mobile-menu-toggle')

        navigation?.classList.remove('mobile-open')
        toggle?.classList.remove('active')
        document.body.classList.remove('mobile-menu-open')
    }

    private cleanup(): void {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this))
        window.removeEventListener('scroll', this.handleScroll.bind(this))
        document.removeEventListener('click', this.handleOutsideClick.bind(this))

        // Remove body classes
        document.body.classList.remove('mobile-menu-open')

        if (this.footerComponent?.unmount) {
            this.footerComponent.unmount()
        }
    }
}