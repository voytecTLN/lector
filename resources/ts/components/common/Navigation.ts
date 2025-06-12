// resources/ts/components/common/Navigation.ts
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
                <a href="/tutors" data-navigate class="nav-link">Lektorzy</a>
               <a href="/courses" data-navigate class="nav-link">Kursy</a>
               <a href="/about" data-navigate class="nav-link">O nas</a>
               <a href="/contact" data-navigate class="nav-link">Kontakt</a>
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
                   <a href="#" class="nav-link dropdown-toggle">
                       <span class="nav-icon">👥</span>
                       Użytkownicy
                       <span class="dropdown-arrow">▼</span>
                   </a>
                   <div class="dropdown-menu">
                       <a href="/admin/users" data-navigate class="dropdown-item">Wszyscy użytkownicy</a>
                       <a href="/admin/students" data-navigate class="dropdown-item">Studenci</a>
                       <a href="/admin/tutors" data-navigate class="dropdown-item">Lektorzy</a>
                       <a href="/admin/moderators" data-navigate class="dropdown-item">Moderatorzy</a>
                   </div>
               </div>
               <div class="nav-dropdown">
                   <a href="#" class="nav-link dropdown-toggle">
                       <span class="nav-icon">📚</span>
                       Zawartość
                       <span class="dropdown-arrow">▼</span>
                   </a>
                   <div class="dropdown-menu">
                       <a href="/admin/lessons" data-navigate class="dropdown-item">Lekcje</a>
                       <a href="/admin/courses" data-navigate class="dropdown-item">Kursy</a>
                       <a href="/admin/content" data-navigate class="dropdown-item">Treści</a>
                   </div>
               </div>
               <a href="/admin/analytics" data-navigate class="nav-link">
                   <span class="nav-icon">📈</span>
                   Analityki
               </a>
               <a href="/admin/settings" data-navigate class="nav-link">
                   <span class="nav-icon">⚙️</span>
                   Ustawienia
               </a>
           </div>
       `
    }

    private getModeratorNavigation(): string {
        return `
           <div class="nav-links">
               <a href="/moderator/dashboard" data-navigate class="nav-link">
                   <span class="nav-icon">📊</span>
                   Dashboard
               </a>
               <a href="/moderator/reviews" data-navigate class="nav-link">
                   <span class="nav-icon">📝</span>
                   Moderacja
               </a>
               <a href="/moderator/reports" data-navigate class="nav-link">
                   <span class="nav-icon">🚨</span>
                   Zgłoszenia
               </a>
               <a href="/moderator/content" data-navigate class="nav-link">
                   <span class="nav-icon">📚</span>
                   Zawartość
               </a>
               <a href="/moderator/users" data-navigate class="nav-link">
                   <span class="nav-icon">👥</span>
                   Użytkownicy
               </a>
           </div>
       `
    }

    private getTutorNavigation(): string {
        return `
           <div class="nav-links">
               <a href="/tutor/dashboard" data-navigate class="nav-link">
                   <span class="nav-icon">📊</span>
                   Dashboard
               </a>
               <a href="/tutor/schedule" data-navigate class="nav-link">
                   <span class="nav-icon">📅</span>
                   Harmonogram
               </a>
               <a href="/tutor/lessons" data-navigate class="nav-link">
                   <span class="nav-icon">🎓</span>
                   Lekcje
               </a>
               <a href="/tutor/students" data-navigate class="nav-link">
                   <span class="nav-icon">👨‍🎓</span>
                   Studenci
               </a>
               <a href="/tutor/materials" data-navigate class="nav-link">
                   <span class="nav-icon">📚</span>
                   Materiały
               </a>
               <a href="/tutor/earnings" data-navigate class="nav-link">
                   <span class="nav-icon">💰</span>
                   Zarobki
               </a>
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
               <a href="/student/lessons" data-navigate class="nav-link">
                   <span class="nav-icon">🎓</span>
                   Moje lekcje
               </a>
               <a href="/student/tutors" data-navigate class="nav-link">
                   <span class="nav-icon">👨‍🏫</span>
                   Lektorzy
               </a>
               <a href="/student/progress" data-navigate class="nav-link">
                   <span class="nav-icon">📈</span>
                   Postępy
               </a>
               <a href="/student/schedule" data-navigate class="nav-link">
                   <span class="nav-icon">📅</span>
                   Harmonogram
               </a>
               <a href="/student/materials" data-navigate class="nav-link">
                   <span class="nav-icon">📚</span>
                   Materiały
               </a>
           </div>
       `
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Handle dropdown toggles
        const dropdownToggles = this.container.querySelectorAll('.dropdown-toggle')
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', this.handleDropdownToggle.bind(this))
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