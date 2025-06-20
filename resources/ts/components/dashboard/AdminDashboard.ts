// resources/ts/components/dashboard/AdminDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'

export class AdminDashboard implements RouteComponent {
    private activeSection: string = 'dashboard'
    private container: HTMLElement | null = null
    private statsInterval: number | null = null
    private isLoadingStats: boolean = false

    async render(): Promise<HTMLElement> {
        const user = authService.getUser()
        const el = document.createElement('div')
        el.className = 'admin-container'
        el.innerHTML = `
            <!-- Sidebar -->
            <nav class="sidebar" id="sidebar">
                <div class="logo">
                    <h2>🎓 Platforma Lektorów</h2>
                    <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">Panel Administratora</p>
                </div>
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link active" data-section="dashboard">
                            <span class="nav-icon">📊</span>
                            Dashboard
                        </a>
                    </li>
                    <li class="nav-section">Zarządzanie Użytkownikami</li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="lektorzy">
                            <span class="nav-icon">👨‍🏫</span>
                            Lektorzy
                            <span class="nav-badge" id="tutors-count">0</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="uczniowie">
                            <span class="nav-icon">👥</span>
                            Uczniowie
                            <span class="nav-badge" id="students-count">0</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="moderatorzy">
                            <span class="nav-icon">👮‍♂️</span>
                            Moderatorzy
                            <span class="nav-badge" id="moderators-count">0</span>
                        </a>
                    </li>
                    <li class="nav-section">Lekcje i Harmonogram</li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="lekcje">
                            <span class="nav-icon">📚</span>
                            Wszystkie lekcje
                            <span class="nav-badge nav-badge-success" id="active-lessons">0</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="harmonogram">
                            <span class="nav-icon">📅</span>
                            Harmonogram
                        </a>
                    </li>
                    <li class="nav-section">Monitoring i Logi</li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="aktywnosc">
                            <span class="nav-icon">👁️</span>
                            Aktywność użytkowników
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="logi">
                            <span class="nav-icon">📝</span>
                            Logi systemowe
                        </a>
                    </li>
                    <li class="nav-section">System</li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="ustawienia">
                            <span class="nav-icon">⚙️</span>
                            Ustawienia systemu
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="pomoc">
                            <span class="nav-icon">❓</span>
                            Pomoc i dokumentacja
                        </a>
                    </li>
                </ul>
            </nav>

            <!-- Main Content -->
            <main class="main-content">
                <header class="header">
                    <div>
                        <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
                        <h1 id="page-title">Dashboard</h1>
                    </div>
                    <div class="user-info">
                        <div class="user-avatar">${user?.name?.charAt(0).toUpperCase() || 'A'}</div>
                        <div>
                            <div style="font-weight: 600;">${user?.name || 'Administrator'}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">${user?.email || ''}</div>
                        </div>
                        <button class="logout-btn" id="logout-btn">Wyloguj</button>
                    </div>
                </header>
                <div id="content-area"></div>
            </main>
        `

        this.addStyles()
        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.setupNavigation()
        this.setupMobileMenu()
        this.setupLogout()

        const params = new URLSearchParams(window.location.search)
        const section = params.get('section') || 'dashboard'

        this.loadContent(section)
        this.startStatsRefresh()
    }

    unmount(): void {
        if (this.statsInterval) clearInterval(this.statsInterval)
    }

    private setupNavigation(): void {
        const navLinks = this.container?.querySelectorAll('.nav-link')
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                navLinks.forEach(l => l.classList.remove('active'))
                link.classList.add('active')
                const section = link.getAttribute('data-section')
                if (section) this.loadContent(section)
            })
        })
    }

    private setupMobileMenu(): void {
        const menuBtn = this.container?.querySelector('#mobile-menu-btn')
        const sidebar = this.container?.querySelector('#sidebar')

        menuBtn?.addEventListener('click', () => {
            sidebar?.classList.toggle('open')
        })

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            if (window.innerWidth <= 768 && !sidebar?.contains(target) && !menuBtn?.contains(target)) {
                sidebar?.classList.remove('open')
            }
        })
    }

    private setupLogout(): void {
        const logoutBtn = this.container?.querySelector('#logout-btn')
        logoutBtn?.addEventListener('click', async () => {
            await authService.logout()
            window.location.href = '/'
        })
    }

    private async loadContent(section: string): Promise<void> {
        const contentArea = this.container?.querySelector('#content-area')
        const pageTitle = this.container?.querySelector('#page-title')
        if (!contentArea || !pageTitle) return
        this.activeSection = section

        switch (section) {
            case 'dashboard':
                pageTitle.textContent = 'Dashboard'
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
                break
            case 'lektorzy':
                pageTitle.textContent = 'Zarządzanie Lektorami'
                contentArea.innerHTML = '<p>Wczytywanie lektorów...</p>'
                break
            case 'uczniowie':
                pageTitle.textContent = 'Zarządzanie Uczniami'
                contentArea.innerHTML = '<p>Wczytywanie uczniów...</p>'
                break
            default:
                pageTitle.textContent = 'Dashboard'
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
        }
    }

    private async getDashboardContent(): Promise<string> {
        if (this.isLoadingStats) {
            return `<div class="content-area"><p>Ładowanie statystyk...</p></div>`
        }

        const stats = await this.fetchDashboardStats()
        return `
            <div class="content-area">
                <h2>Witaj Administratorze</h2>
                <p>Statystyki: Lektorzy: ${stats.tutors || 0}, Uczniowie: ${stats.students || 0}</p>
            </div>
        `
    }

    private async fetchDashboardStats(): Promise<any> {
        try {
            const response = await api.get('/admin/dashboard-stats')
            return (response as any).data || {}
        } catch (error) {
            console.error('Failed to fetch admin stats:', error)
            return {}
        }
    }

    private startStatsRefresh(): void {
        this.statsInterval = window.setInterval(() => {
            if (this.activeSection === 'dashboard') {
                this.fetchDashboardStats().then(stats => this.updateStats(stats))
            }
        }, 30000)
    }

    private updateStats(stats: any): void {
        const updateElement = (id: string, value: any) => {
            const el = this.container?.querySelector(`#${id}`)
            if (el) el.textContent = String(value)
        }

        updateElement('tutors-count', stats.tutors || 0)
        updateElement('students-count', stats.students || 0)
        updateElement('moderators-count', stats.moderators || 0)
        updateElement('active-lessons', stats.active_lessons || 0)
    }

    private addStyles(): void {
        if (document.getElementById('admin-dashboard-styles')) return

        const style = document.createElement('style')
        style.id = 'admin-dashboard-styles'
        style.textContent = `
            /* Podstawowe style zaczerpnięte z panelu studenta */
            .admin-container, .student-container {
                display: flex;
                min-height: 100vh;
            }
            .sidebar {
                width: 280px;
                background: #1e293b;
                color: white;
                padding: 1.5rem 0;
                position: fixed;
                height: 100vh;
                overflow-y: auto;
                transition: transform 0.3s;
            }
            .logo {
                padding: 0 1.5rem 2rem;
                border-bottom: 1px solid #334155;
                margin-bottom: 2rem;
            }
            .logo h2 {
                color: #e91e63;
                font-size: 1.25rem;
            }
            .nav-menu {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .nav-item {
                margin-bottom: 0.5rem;
            }
            .nav-link {
                display: flex;
                align-items: center;
                padding: 0.75rem 1.5rem;
                color: #cbd5e1;
                text-decoration: none;
                transition: all 0.3s;
                gap: 0.75rem;
                position: relative;
                cursor: pointer;
            }
            .nav-link:hover, .nav-link.active {
                background: #334155;
                color: white;
            }
            .nav-link.active::after {
                content: '';
                position: absolute;
                right: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: #e91e63;
            }
            .nav-icon {
                font-size: 1.25rem;
            }
            .nav-badge {
                margin-left: auto;
                background: #475569;
                color: white;
                font-size: 0.75rem;
                padding: 0.125rem 0.5rem;
                border-radius: 10px;
                min-width: 24px;
                text-align: center;
            }
            .nav-badge-success {
                background: #10b981;
            }
            .nav-section {
                padding: 1rem 1.5rem 0.5rem;
                font-size: 0.75rem;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-top: 1rem;
            }
            .main-content {
                flex: 1;
                margin-left: 280px;
                padding: 2rem;
                background: #f8fafc;
                min-height: 100vh;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                background: white;
                padding: 1.5rem;
                border-radius: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .user-avatar {
                width: 40px;
                height: 40px;
                background: #3b82f6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
            }
            .logout-btn {
                background: #ef4444;
                color: white;
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: background 0.3s;
            }
            .logout-btn:hover {
                background: #dc2626;
            }
            .content-area {
                background: white;
                border-radius: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                padding: 2rem;
            }
            @media (min-width: 769px) {
                .mobile-menu-btn {
                    display: none !important;
                }
            }
        `
        document.head.appendChild(style)
    }
}
