// resources/ts/components/layouts/AppLayout.ts
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@/router/routes'

export class AppLayout implements RouteComponent {
    private container: HTMLElement | null = null
    private navigationComponent: any = null
    private userMenuComponent: any = null
    private footerComponent: any = null

    async render(): Promise<HTMLElement> {
        const layout = document.createElement('div')
        layout.className = 'app-layout'

        layout.innerHTML = `
            <div class="app-layout-wrapper">
                <!-- Header -->
                <header class="app-header">
                    <div class="container">
                        <div class="header-content">
                            <div class="header-left">
                                <div class="logo">
                                    <a href="/" data-navigate>
                                        <span class="logo-text">Platforma Lektorów</span>
                                    </a>
                                </div>
                            </div>
                            
                            <div class="header-center">
                                <nav class="main-navigation" id="main-navigation">
                                    <!-- Navigation will be inserted here -->
                                </nav>
                            </div>
                            
                            <div class="header-right">
                                <div class="user-menu" id="user-menu">
                                    <!-- User menu will be inserted here -->
                                </div>
                                <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle menu">
                                    <span class="hamburger"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="app-main">
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

        // Initialize components
        await this.initializeComponents(layout)

        return layout
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        console.log('✅ AppLayout mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 AppLayout unmounted')
    }

    private async initializeComponents(layout: HTMLElement): Promise<void> {
        try {
            // Initialize Navigation
            const navContainer = layout.querySelector('#main-navigation')
            if (navContainer) {
                const { Navigation } = await import('@/components/common/Navigation')
                this.navigationComponent = new Navigation()
                const navElement = await this.navigationComponent.render()
                navContainer.appendChild(navElement)

                if (this.navigationComponent.mount) {
                    this.navigationComponent.mount(navContainer as HTMLElement)
                }
            }

            // Initialize User Menu
            const userMenuContainer = layout.querySelector('#user-menu')
            if (userMenuContainer) {
                const { UserMenu } = await import('@/components/common/UserMenu')
                this.userMenuComponent = new UserMenu()
                const userMenuElement = await this.userMenuComponent.render()
                userMenuContainer.appendChild(userMenuElement)

                if (this.userMenuComponent.mount) {
                    this.userMenuComponent.mount(userMenuContainer as HTMLElement)
                }
            }

            // Initialize Footer
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
            console.error('Failed to initialize AppLayout components:', error)
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

        // Close mobile menu on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this))

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this))
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

    private closeMobileMenu(): void {
        const navigation = this.container?.querySelector('#main-navigation')
        const toggle = this.container?.querySelector('#mobile-menu-toggle')

        navigation?.classList.remove('mobile-open')
        toggle?.classList.remove('active')
        document.body.classList.remove('mobile-menu-open')
    }

    private cleanup(): void {
        // Cleanup components
        if (this.navigationComponent?.unmount) {
            this.navigationComponent.unmount()
        }
        if (this.userMenuComponent?.unmount) {
            this.userMenuComponent.unmount()
        }
        if (this.footerComponent?.unmount) {
            this.footerComponent.unmount()
        }

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this))
        document.removeEventListener('click', this.handleOutsideClick.bind(this))

        // Remove body classes
        document.body.classList.remove('mobile-menu-open')
    }
}