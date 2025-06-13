// resources/ts/components/common/Navigation.ts - POPRAWIONE
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@/router/routes'

export class Navigation implements RouteComponent {
    private container: HTMLElement | null = null
    private currentUser: any = null

    async render(): Promise<HTMLElement> {
        this.currentUser = authService.getUser()

        const nav = document.createElement('nav')
        nav.className = 'main-nav'

        nav.innerHTML = this.getNavigationHTML()

        return nav
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.updateActiveLink()
        console.log('✅ Navigation mounted')
    }

    unmount(): void {
        console.log('👋 Navigation unmounted')
    }

    private getNavigationHTML(): string {
        if (!this.currentUser) {
            return this.getGuestNavigation()
        }

        switch (this.currentUser.role) {
            case 'admin':
                return this.getAdminNavigation()
            case 'moderator':
                return this.getModeratorNavigation()
            case 'tutor':
                return this.getTutorNavigation()
            case 'student':
                return this.getStudentNavigation()
            default:
                return this.getGuestNavigation()
        }
    }

    private getGuestNavigation(): string {
        return `
            <div class="nav-links">
                <a href="/" data-navigate class="nav-link">Strona główna</a>
                <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                <button class="nav-link nav-link-disabled" disabled>Lektorzy (Wkrótce)</button>
                <button class="nav-link nav-link-disabled" disabled>Kursy (Wkrótce)</button>
                <button class="nav-link nav-link-disabled" disabled>O nas (Wkrótce)</button>
                <button class="nav-link nav-link-disabled" disabled>Kontakt (Wkrótce)</button>
            </div>
        `
    }

    private getAdminNavigation(): string {
        return `
            <div class="nav-links">
                <a href="/admin/dashboard" data-navigate class="nav-link">
                    <span class="nav-icon">📊</span>
                    Dashboard
                </a>
                <div class="nav-dropdown">
                    <button class="nav-link dropdown-toggle">
                        <span class="nav-icon">👥</span>
                        Użytkownicy
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="dropdown-menu">
                        <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                        <button class="dropdown-item disabled" disabled>Wszyscy użytkownicy (Wkrótce)</button>
                        <button class="dropdown-item disabled" disabled>Studenci (Wkrótce)</button>
                        <button class="dropdown-item disabled" disabled>Lektorzy (Wkrótce)</button>
                        <button class="dropdown-item disabled" disabled>Moderatorzy (Wkrótce)</button>
                    </div>
                </div>
                <div class="nav-dropdown">
                    <button class="nav-link dropdown-toggle">
                        <span class="nav-icon">📚</span>
                        Zawartość
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="dropdown-menu">
                        <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                        <button class="dropdown-item disabled" disabled>Lekcje (Wkrótce)</button>
                        <button class="dropdown-item disabled" disabled>Kursy (Wkrótce)</button>
                        <button class="dropdown-item disabled" disabled>Treści (Wkrótce)</button>
                    </div>
                </div>
                <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📈</span>
                    Analityki (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">⚙️</span>
                    Ustawienia (Wkrótce)
                </button>
            </div>
        `
    }

    private getModeratorNavigation(): string {
        return `
            <div class="nav-links">
                <!-- POPRAWIONE - zakomentowane nieistniejące strony z adnotacjami -->
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📊</span>
                    Dashboard (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📝</span>
                    Moderacja (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">🚨</span>
                    Zgłoszenia (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📚</span>
                    Zawartość (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">👥</span>
                    Użytkownicy (Wkrótce)
                </button>
            </div>
        `
    }

    private getTutorNavigation(): string {
        return `
            <div class="nav-links">
                <!-- POPRAWIONE - zakomentowane nieistniejące strony z adnotacjami -->
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📊</span>
                    Dashboard (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📅</span>
                    Harmonogram (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">🎓</span>
                    Lekcje (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">👨‍🎓</span>
                    Studenci (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📚</span>
                    Materiały (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">💰</span>
                    Zarobki (Wkrótce)
                </button>
            </div>
        `
    }

    private getStudentNavigation(): string {
        return `
            <div class="nav-links">
                <a href="/student/dashboard" data-navigate class="nav-link">
                    <span class="nav-icon">📊</span>
                    Dashboard
                </a>
                <!-- POPRAWIONE - zakomentowane nieistniejące strony z adnotacjami -->
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">🎓</span>
                    Moje lekcje (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">👨‍🏫</span>
                    Lektorzy (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📈</span>
                    Postępy (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📅</span>
                    Harmonogram (Wkrótce)
                </button>
                <button class="nav-link nav-link-disabled" disabled>
                    <span class="nav-icon">📚</span>
                    Materiały (Wkrótce)
                </button>
            </div>
        `
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Handle dropdown toggles - POPRAWIONE
        const dropdownToggles = this.container.querySelectorAll('.dropdown-toggle')
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', this.handleDropdownToggle.bind(this))
        })

        // Handle disabled navigation clicks - POPRAWIONE
        const disabledLinks = this.container.querySelectorAll('.nav-link-disabled, .dropdown-item.disabled')
        disabledLinks.forEach(link => {
            link.addEventListener('click', this.handleDisabledClick.bind(this))
        })

        // Close dropdowns on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this))

        // Update active link on navigation
        document.addEventListener('auth:change', this.handleAuthChange.bind(this) as EventListener)
    }

    private handleDropdownToggle(event: Event): void {
        event.preventDefault()
        const toggle = event.currentTarget as HTMLElement
        const dropdown = toggle.closest('.nav-dropdown')

        if (dropdown) {
            const isOpen = dropdown.classList.contains('open')

            // Close all other dropdowns
            this.container?.querySelectorAll('.nav-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) {
                    openDropdown.classList.remove('open')
                }
            })

            // Toggle current dropdown
            dropdown.classList.toggle('open', !isOpen)
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

        if (!target.closest('.nav-dropdown')) {
            this.container?.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open')
            })
        }
    }

    private handleAuthChange(event: Event): void {
        // Re-render navigation when auth state changes
        if (this.container) {
            this.currentUser = authService.getUser()
            this.container.innerHTML = this.getNavigationHTML()
            this.initEventListeners()
            this.updateActiveLink()
        }
    }

    private updateActiveLink(): void {
        if (!this.container) return

        const currentPath = window.location.pathname
        const links = this.container.querySelectorAll('.nav-link[data-navigate]')

        links.forEach(link => {
            const href = link.getAttribute('href')
            if (href === currentPath || (href !== '/' && currentPath.startsWith(href!))) {
                link.classList.add('active')
            } else {
                link.classList.remove('active')
            }
        })
    }
}