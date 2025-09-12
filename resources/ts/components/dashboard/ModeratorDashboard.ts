// resources/ts/components/dashboard/ModeratorDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { navigate } from '@/utils/navigation'

export class ModeratorDashboard implements RouteComponent {
    private activeSection: string = 'dashboard'
    private container: HTMLElement | null = null

    async render(): Promise<HTMLElement> {
        const user = authService.getUser()
        const el = document.createElement('div')
        el.className = 'moderator-container'
        el.innerHTML = `
            <!-- Sidebar -->
            <nav class="moderator-sidebar">
                <div class="moderator-logo-dashboard">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <img src="/images/favicon-logo.png" alt="Platforma Lektorów" style="max-height: 32px;">
                        <h2 style="margin: 0; font-size: 1.2rem;">Platforma Lektorów</h2>
                    </div>
                    <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">Panel Moderatora</p>
                </div>
                
                <ul class="moderator-nav-menu">
                    <li class="moderator-nav-item">
                        <a href="#dashboard" class="moderator-nav-link active" data-section="dashboard">
                            <span class="moderator-nav-icon">📊</span>
                            Dashboard
                        </a>
                    </li>
                    <li class="moderator-nav-item">
                        <a href="#wykaz-zmian" class="moderator-nav-link" data-section="wykaz-zmian">
                            <span class="moderator-nav-icon">📋</span>
                            Wykaz zmian
                        </a>
                    </li>
                </ul>
            </nav>
            
            <!-- Main Content -->
            <main class="moderator-main-content">
                <header class="moderator-header">
                    <div>
                        <button class="moderator-mobile-menu-btn" id="mobile-menu-btn">☰</button>
                        <h1 id="page-title">Panel Moderatora</h1>
                    </div>
                    <div class="moderator-user-info">
                        <div class="moderator-user-avatar">${user?.name?.charAt(0).toUpperCase() || 'M'}</div>
                        <div>
                            <div style="font-weight: 600;">${user?.name || 'Moderator'}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">${user?.email || ''}</div>
                        </div>
                        <button class="moderator-logout-btn" id="logout-btn">Wyloguj</button>
                    </div>
                </header>

                <div class="moderator-content-area" id="content-area">
                    <!-- Dynamic content will be loaded here -->
                </div>
            </main>
        `

        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        
        // Setup navigation
        this.setupNavigation()
        
        // Setup logout
        const logoutBtn = container.querySelector('#logout-btn')
        logoutBtn?.addEventListener('click', async () => {
            await authService.logout()
            await navigate.to('/')
        })

        // Load initial content
        this.loadContent('dashboard')
    }

    private setupNavigation(): void {
        const navLinks = this.container?.querySelectorAll('.moderator-nav-link')
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                const section = link.getAttribute('data-section') || 'dashboard'
                this.navigateToSection(section)
            })
        })
    }

    private navigateToSection(section: string): void {
        // Update active nav link
        const navLinks = this.container?.querySelectorAll('.moderator-nav-link')
        navLinks?.forEach(link => {
            if (link.getAttribute('data-section') === section) {
                link.classList.add('active')
            } else {
                link.classList.remove('active')
            }
        })
        
        // Load section content
        this.loadContent(section)
    }

    private async loadContent(section: string): Promise<void> {
        const contentArea = this.container?.querySelector('#content-area')
        if (!contentArea) return

        this.activeSection = section

        switch(section) {
            case 'dashboard':
                contentArea.innerHTML = this.getDashboardContent()
                this.loadStats()
                break
            case 'wykaz-zmian':
                contentArea.innerHTML = '<div id="changelog-container"></div>'
                
                // Import and mount ChangelogPage
                import('@/components/changelog/ChangelogPage').then(async (module) => {
                    const changelogPage = new module.ChangelogPage()
                    const container = document.getElementById('changelog-container')
                    if (container) {
                        const changelogEl = await changelogPage.render()
                        container.appendChild(changelogEl)
                        changelogPage.mount(container)
                    }
                }).catch(error => {
                    console.error('Failed to load ChangelogPage:', error)
                    contentArea.innerHTML = '<div class="alert alert-danger">Błąd ładowania wykazu zmian</div>'
                })
                break
            default:
                contentArea.innerHTML = this.getDashboardContent()
                this.loadStats()
        }
    }

    private getDashboardContent(): string {
        return `
            <div class="container-fluid">
                <div class="row mt-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Oczekujące zgłoszenia</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Aktywni użytkownicy</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Zgłoszone treści</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Rozwiązane sprawy</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-5">
                <div class="col-12">
                    <h2>Szybkie akcje</h2>
                    <div class="list-group">
                        <a href="/admin/students" class="list-group-item list-group-item-action">
                            📋 Zarządzaj studentami
                        </a>
                        <a href="/admin/tutors" class="list-group-item list-group-item-action disabled">
                            👩‍🏫 Zarządzaj lektorami
                            <span class="badge bg-secondary float-end">Wkrótce</span>
                        </a>
                        <a href="/reports" class="list-group-item list-group-item-action disabled">
                            📊 Przeglądaj zgłoszenia
                            <span class="badge bg-secondary float-end">Wkrótce</span>
                        </a>
                        <a href="/content/moderation" class="list-group-item list-group-item-action disabled">
                            🛡️ Moderacja treści
                            <span class="badge bg-secondary float-end">Wkrótce</span>
                        </a>
                    </div>
                </div>
                    </div>
            </div>
        `
    }

    private async loadStats(): Promise<void> {
        try {
            const response = await fetch('/api/moderator/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Accept': 'application/json'
                }
            })
            const data = await response.json()
            // Update stats in DOM
        } catch (error) {
            console.error('Failed to load moderator stats:', error)
        }
    }
}