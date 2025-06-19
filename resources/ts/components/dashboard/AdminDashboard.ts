// resources/ts/components/dashboard/AdminDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'

export class AdminDashboard implements RouteComponent {
    private activeSection: string = 'dashboard'
    private container: HTMLElement | null = null
    private statsInterval: number | null = null

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
                        <a href="#dashboard" class="nav-link active" data-section="dashboard">
                            <span class="nav-icon">📊</span>
                            Dashboard
                        </a>
                    </li>

                    <div class="nav-section">Zarządzanie Użytkownikami</div>

                    <li class="nav-item">
                        <a href="#lektorzy" class="nav-link" data-section="lektorzy">
                            <span class="nav-icon">👨‍🏫</span>
                            Lektorzy
                            <span class="nav-badge" id="tutors-count">0</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="#uczniowie" class="nav-link" data-section="uczniowie">
                            <span class="nav-icon">👥</span>
                            Uczniowie
                            <span class="nav-badge" id="students-count">0</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="#moderatorzy" class="nav-link" data-section="moderatorzy">
                            <span class="nav-icon">👮‍♂️</span>
                            Moderatorzy
                            <span class="nav-badge" id="moderators-count">0</span>
                        </a>
                    </li>

                    <div class="nav-section">Lekcje i Harmonogram</div>

                    <li class="nav-item">
                        <a href="#lekcje" class="nav-link" data-section="lekcje">
                            <span class="nav-icon">📚</span>
                            Wszystkie lekcje
                            <span class="nav-badge nav-badge-success" id="active-lessons">0</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="#harmonogram" class="nav-link" data-section="harmonogram">
                            <span class="nav-icon">📅</span>
                            Harmonogram
                        </a>
                    </li>

                    <div class="nav-section">Monitoring i Logi</div>

                    <li class="nav-item">
                        <a href="#aktywnosc" class="nav-link" data-section="aktywnosc">
                            <span class="nav-icon">👁️</span>
                            Aktywność użytkowników
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="#logi-systemu" class="nav-link" data-section="logi">
                            <span class="nav-icon">📝</span>
                            Logi systemowe
                        </a>
                    </li>

                    <div class="nav-section">System</div>

                    <li class="nav-item">
                        <a href="#ustawienia" class="nav-link" data-section="ustawienia">
                            <span class="nav-icon">⚙️</span>
                            Ustawienia systemu
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="#pomoc" class="nav-link" data-section="pomoc">
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

                <div id="content-area">
                    <!-- Content will be loaded here -->
                </div>
            </main>
        `

        // Add styles
        this.addStyles()

        return el
    }

    mount(container: HTMLElement): void {
        this.container = container

        // Setup navigation
        this.setupNavigation()

        // Setup mobile menu
        this.setupMobileMenu()

        // Setup logout
        this.setupLogout()

        // Load initial content
        this.loadContent('dashboard')

        // Start auto-refresh stats
        this.startStatsRefresh()
    }

    unmount(): void {
        if (this.statsInterval) {
            clearInterval(this.statsInterval)
        }
    }

    private setupNavigation(): void {
        const navLinks = this.container?.querySelectorAll('.nav-link')

        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'))
                link.classList.add('active')

                // Load content
                const section = link.getAttribute('data-section')
                if (section) {
                    this.loadContent(section)
                }
            })
        })
    }

    private setupMobileMenu(): void {
        const menuBtn = this.container?.querySelector('#mobile-menu-btn')
        const sidebar = this.container?.querySelector('#sidebar')

        menuBtn?.addEventListener('click', () => {
            sidebar?.classList.toggle('open')
        })

        // Close sidebar on outside click
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            if (window.innerWidth <= 768 &&
                !sidebar?.contains(target) &&
                !menuBtn?.contains(target)) {
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

        switch(section) {
            case 'dashboard':
                pageTitle.textContent = 'Dashboard'
                contentArea.innerHTML = await this.getDashboardContent()
                break

            case 'lektorzy':
                pageTitle.textContent = 'Zarządzanie Lektorami'
                contentArea.innerHTML = this.getTutorsContent()
                break

            case 'uczniowie':
                pageTitle.textContent = 'Zarządzanie Uczniami'
                contentArea.innerHTML = this.getStudentsContent()
                break

            case 'lekcje':
                pageTitle.textContent = 'Wszystkie Lekcje'
                contentArea.innerHTML = this.getLessonsContent()
                break

            case 'aktywnosc':
                pageTitle.textContent = 'Aktywność Użytkowników'
                contentArea.innerHTML = this.getActivityContent()
                break

            case 'ustawienia':
                pageTitle.textContent = 'Ustawienia Systemu'
                contentArea.innerHTML = this.getSettingsContent()
                break

            default:
                pageTitle.textContent = 'Dashboard'
                contentArea.innerHTML = await this.getDashboardContent()
        }
    }

    private async getDashboardContent(): Promise<string> {
        // Fetch stats
        const stats = await this.fetchDashboardStats()

        return `
            <!-- Quick Actions -->
            <div class="quick-actions">
                <div class="action-card">
                    <div class="action-icon">👨‍🏫</div>
                    <h3>Dodaj Lektora</h3>
                    <p>Dodaj nowego lektora do systemu</p>
                    <a href="/admin/tutors/add" class="action-btn">Dodaj</a>
                </div>

                <div class="action-card">
                    <div class="action-icon">👥</div>
                    <h3>Dodaj Ucznia</h3>
                    <p>Zarejestruj nowego ucznia</p>
                    <a href="/admin/students/add" class="action-btn">Dodaj</a>
                </div>

                <div class="action-card">
                    <div class="action-icon">📥</div>
                    <h3>Import CSV</h3>
                    <p>Importuj dane z pliku CSV</p>
                    <a href="/admin/import" class="action-btn">Import</a>
                </div>

                <div class="action-card">
                    <div class="action-icon">📊</div>
                    <h3>Raporty</h3>
                    <p>Generuj raporty systemu</p>
                    <a href="/admin/reports" class="action-btn">Generuj</a>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="content-area">
                <div class="welcome-section">
                    <h2>Witaj w Panelu Administratora!</h2>
                    <p>Zarządzaj platformą lektorów, dodawaj użytkowników, monitoruj aktywność i generuj raporty.</p>

                    <div class="system-info">
                        <div class="info-item">
                            <span class="info-number" id="stat-tutors">${stats.tutors || 0}</span>
                            <div class="info-label">Aktywni lektorzy</div>
                        </div>
                        <div class="info-item">
                            <span class="info-number" id="stat-students">${stats.students || 0}</span>
                            <div class="info-label">Zarejestrowani uczniowie</div>
                        </div>
                        <div class="info-item">
                            <span class="info-number" id="stat-lessons">${stats.total_lessons || 0}</span>
                            <div class="info-label">Przeprowadzone lekcje</div>
                        </div>
                        <div class="info-item">
                            <span class="info-number" id="stat-revenue">${stats.total_revenue || 0} zł</span>
                            <div class="info-label">Przychody (miesiąc)</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private getTutorsContent(): string {
        return `
            <div class="content-area">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Lista Lektorów</h2>
                    <div style="display: flex; gap: 1rem;">
                        <a href="/admin/tutors/add" class="action-btn">+ Dodaj Lektora</a>
                        <a href="/admin/import/tutors" class="action-btn" style="background: #10b981;">📥 Import CSV</a>
                    </div>
                </div>
                <p>Zarządzaj wszystkimi lektorami w systemie, ich statusem i dostępnością.</p>
                
                <!-- Tu będzie tabela z lektorami -->
                <div class="table-container">
                    <p class="text-muted">Ładowanie listy lektorów...</p>
                </div>
            </div>
        `
    }

    private getStudentsContent(): string {
        return `
            <div class="content-area">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Lista Uczniów</h2>
                    <div style="display: flex; gap: 1rem;">
                        <a href="/admin/students/add" class="action-btn">+ Dodaj Ucznia</a>
                        <a href="/admin/import/students" class="action-btn" style="background: #10b981;">📥 Import CSV</a>
                    </div>
                </div>
                <p>Zarządzaj uczniami, ich pakietami godzin i przypisaniami do lektorów.</p>
                
                <!-- Tu będzie tabela z uczniami -->
                <div class="table-container">
                    <p class="text-muted">Ładowanie listy uczniów...</p>
                </div>
            </div>
        `
    }

    private getLessonsContent(): string {
        return `
            <div class="content-area">
                <h2>Historia Lekcji</h2>
                <p>Przeglądaj wszystkie przeprowadzone i zaplanowane lekcje w systemie.</p>
                
                <!-- Tu będzie kalendarz/lista lekcji -->
                <div class="lessons-container">
                    <p class="text-muted">Ładowanie lekcji...</p>
                </div>
            </div>
        `
    }

    private getActivityContent(): string {
        return `
            <div class="content-area">
                <h2>Monitor Aktywności</h2>
                <p>Śledzenie aktywności użytkowników w czasie rzeczywistym.</p>
                
                <!-- Tu będzie lista aktywności -->
                <div class="activity-log">
                    <p class="text-muted">Ładowanie logów aktywności...</p>
                </div>
            </div>
        `
    }

    private getSettingsContent(): string {
        return `
            <div class="content-area">
                <h2>Konfiguracja Platformy</h2>
                <p>Globalne ustawienia systemu, integracje i konfiguracja.</p>
                
                <!-- Tu będą ustawienia -->
                <div class="settings-form">
                    <p class="text-muted">Ładowanie ustawień...</p>
                </div>
            </div>
        `
    }

    private async fetchDashboardStats(): Promise<any> {
        try {
            /*
            * Dodać typy np.:
            * type DashboardStats = {
            * users: number
            * revenue: number
            * activeSessions: number
            // dodaj inne pola według API
            *}
             */
            const response = await api.get('/admin/dashboard-stats')
            // return response.data || {}
            return (response as any).data || {}
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error)
            return {}
        }
    }

    private startStatsRefresh(): void {
        // Refresh stats every 30 seconds
        this.statsInterval = window.setInterval(() => {
            if (this.activeSection === 'dashboard') {
                this.fetchDashboardStats().then(stats => {
                    this.updateStats(stats)
                })
            }
        }, 30000)
    }

    private updateStats(stats: any): void {
        // Update dashboard numbers
        const updateElement = (id: string, value: any) => {
            const el = this.container?.querySelector(`#${id}`)
            if (el) el.textContent = String(value)
        }

        updateElement('stat-tutors', stats.tutors || 0)
        updateElement('stat-students', stats.students || 0)
        updateElement('stat-lessons', stats.total_lessons || 0)
        updateElement('stat-revenue', `${stats.total_revenue || 0} zł`)

        // Update badges
        updateElement('tutors-count', stats.tutors || 0)
        updateElement('students-count', stats.students || 0)
        updateElement('moderators-count', stats.moderators || 0)
        updateElement('active-lessons', stats.active_lessons || 0)
    }

    private addStyles(): void {
        // Check if styles already exist
        if (document.getElementById('admin-dashboard-styles')) return

        const style = document.createElement('style')
        style.id = 'admin-dashboard-styles'
        style.textContent = `
            .admin-container {
                display: flex;
                min-height: 100vh;
            }

            /* Sidebar */
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

            .nav-badge-warning {
                background: #f59e0b;
            }

            .nav-badge-error {
                background: #ef4444;
            }

            .nav-badge-info {
                background: #3b82f6;
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

            /* Main Content */
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

            .header h1 {
                font-size: 1.875rem;
                font-weight: 700;
                color: #1e293b;
                margin: 0;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .user-avatar {
                width: 40px;
                height: 40px;
                background: #e91e63;
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

            /* Quick Actions */
            .quick-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .action-card {
                background: white;
                padding: 1.5rem;
                border-radius: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                text-align: center;
                transition: transform 0.2s;
            }

            .action-card:hover {
                transform: translateY(-2px);
            }

            .action-icon {
                width: 60px;
                height: 60px;
                background: #e91e63;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                font-size: 24px;
                color: white;
            }

            .action-card h3 {
                margin-bottom: 0.5rem;
                color: #1e293b;
            }

            .action-card p {
                color: #64748b;
                font-size: 0.875rem;
                margin-bottom: 1rem;
            }

            .action-btn {
                background: #e91e63;
                color: white;
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                font-size: 0.875rem;
                transition: background 0.3s;
            }

            .action-btn:hover {
                background: #c2185b;
            }

            /* Content Area */
            .content-area {
                background: white;
                border-radius: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                padding: 2rem;
            }

            .welcome-section {
                text-align: center;
                padding: 3rem 2rem;
            }

            .welcome-section h2 {
                font-size: 2rem;
                margin-bottom: 1rem;
                color: #1e293b;
            }

            .welcome-section p {
                color: #64748b;
                margin-bottom: 2rem;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            }

            .system-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-top: 2rem;
            }

            .info-item {
                text-align: center;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
            }

            .info-number {
                font-size: 2rem;
                font-weight: bold;
                color: #e91e63;
                display: block;
            }

            .info-label {
                font-size: 0.875rem;
                color: #64748b;
                margin-top: 0.25rem;
            }

            /* Mobile */
            .mobile-menu-btn {
                display: none;
                background: #3b82f6;
                color: white;
                border: none;
                padding: 0.5rem;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1.25rem;
            }

            @media (max-width: 768px) {
                .sidebar {
                    transform: translateX(-100%);
                }

                .sidebar.open {
                    transform: translateX(0);
                    z-index: 1000;
                }

                .main-content {
                    margin-left: 0;
                    padding: 1rem;
                }

                .header {
                    padding: 1rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .mobile-menu-btn {
                    display: block;
                }

                .quick-actions {
                    grid-template-columns: 1fr;
                }
            }

            .text-muted {
                color: #64748b;
            }
        `
        document.head.appendChild(style)
    }
}