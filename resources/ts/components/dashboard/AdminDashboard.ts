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
            <nav class="admin-sidebar" id="sidebar">
                <div class="admin-logo-dashboard">
                    <h2>🎓 Platforma Lektorów</h2>
                    <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">Panel Administratora</p>
                </div>

                <ul class="admin-nav-menu">
                    <li class="admin-nav-item">
                        <a href="#dashboard" class="admin-nav-link active" data-section="dashboard">
                            <span class="admin-nav-icon">📊</span>
                            Dashboard
                        </a>
                    </li>

                    <div class="admin-nav-section">Zarządzanie Użytkownikami</div>

                    <li class="admin-nav-item">
                        <a href="#lektorzy" class="admin-nav-link" data-section="lektorzy">
                            <span class="admin-nav-icon">👨‍🏫</span>
                            Lektorzy
                            <span class="admin-nav-badge" id="tutors-count">0</span>
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#uczniowie" class="admin-nav-link" data-section="uczniowie">
                            <span class="admin-nav-icon">👥</span>
                            Uczniowie
                            <span class="admin-nav-badge" id="students-count">0</span>
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#moderatorzy" class="admin-nav-link" data-section="moderatorzy">
                            <span class="admin-nav-icon">👮‍♂️</span>
                            Moderatorzy
                            <span class="admin-nav-badge" id="moderators-count">0</span>
                        </a>
                    </li>

                    <div class="admin-nav-section">Lekcje i Harmonogram</div>

                    <li class="admin-nav-item">
                        <a href="#lekcje" class="admin-nav-link" data-section="lekcje">
                            <span class="admin-nav-icon">📚</span>
                            Wszystkie lekcje
                            <span class="admin-nav-badge admin-nav-badge-success" id="active-lessons">0</span>
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#harmonogram" class="admin-nav-link" data-section="harmonogram">
                            <span class="admin-nav-icon">📅</span>
                            Harmonogram
                        </a>
                    </li>

                    <div class="admin-nav-section">Monitoring i Logi</div>

                    <li class="admin-nav-item">
                        <a href="#aktywnosc" class="admin-nav-link" data-section="aktywnosc">
                            <span class="admin-nav-icon">👁️</span>
                            Aktywność użytkowników
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#logi-systemu" class="admin-nav-link" data-section="logi">
                            <span class="admin-nav-icon">📝</span>
                            Logi systemowe
                        </a>
                    </li>

                    <div class="admin-nav-section">System</div>

                    <li class="admin-nav-item">
                        <a href="#ustawienia" class="admin-nav-link" data-section="ustawienia">
                            <span class="admin-nav-icon">⚙️</span>
                            Ustawienia systemu
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#pomoc" class="admin-nav-link" data-section="pomoc">
                            <span class="admin-nav-icon">❓</span>
                            Pomoc i dokumentacja
                        </a>
                    </li>
                </ul>
            </nav>

            <!-- Main Content -->
            <main class="admin-main-content">
                <header class="admin-header">
                    <div>
                        <button class="admin-mobile-menu-btn" id="mobile-menu-btn">☰</button>
                        <h1 id="page-title">Dashboard</h1>
                    </div>
                    <div class="admin-user-info">
                        <div class="admin-user-avatar">${user?.name?.charAt(0).toUpperCase() || 'A'}</div>
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
        const navLinks = this.container?.querySelectorAll('.admin-nav-link')

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
                // contentArea.innerHTML = await this.getDashboardContent()
                // break

                // Ustaw loading state
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()

                // Załaduj prawdziwe dane
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
                break

            case 'lektorzy':
                pageTitle.textContent = 'Zarządzanie Lektorami'
                // contentArea.innerHTML = this.getTutorsContent()
                contentArea.innerHTML = '<div class="admin-loading-container"><div class="admin-loading-spinner"></div><p class="admin-loading-text">Ładowanie listy lektorów...</p></div>'

                // Symulacja ładowania (w przyszłości zastąp prawdziwym API)
                setTimeout(() => {
                    contentArea.innerHTML = this.getTutorsContent()
                }, 1000)
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
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
        }
    }

    private async getDashboardContent(): Promise<string> {

        if (this.isLoadingStats) {
            return `
            <div class="admin-content-area">
                <div class="admin-loading-container">
                    <div class="admin-loading-spinner"></div>
                    <p class="admin-loading-text">Ładowanie statystyk...</p>
                </div>
            </div>
        `
        }

        // Fetch stats
        const stats = await this.fetchDashboardStats()

        return `
            <!-- Quick Actions -->
            <div class="admin-quick-actions">
                <div class="admin-action-card">
                    <div class="admin-action-icon">👨‍🏫</div>
                    <h3>Dodaj Lektora</h3>
                    <p>Dodaj nowego lektora do systemu</p>
                    <a href="/admin/tutors/add" class="admin-action-btn">Dodaj</a>
                </div>

                <div class="admin-action-card">
                    <div class="admin-action-icon">👥</div>
                    <h3>Dodaj Ucznia</h3>
                    <p>Zarejestruj nowego ucznia</p>
                    <a href="/admin/students/add" class="admin-action-btn">Dodaj</a>
                </div>

                <div class="admin-action-card">
                    <div class="admin-action-icon">📥</div>
                    <h3>Import CSV</h3>
                    <p>Importuj dane z pliku CSV</p>
                    <a href="/admin/import" class="admin-action-btn">Import</a>
                </div>

                <div class="admin-action-card">
                    <div class="admin-action-icon">📊</div>
                    <h3>Raporty</h3>
                    <p>Generuj raporty systemu</p>
                    <a href="/admin/reports" class="admin-action-btn">Generuj</a>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="admin-content-area">
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
            <div class="admin-content-area">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Lista Lektorów</h2>
                    <div style="display: flex; gap: 1rem;">
                        <a href="/admin/tutors/add" class="admin-action-btn">+ Dodaj Lektora</a>
                        <a href="/admin/import/tutors" class="admin-action-btn" style="background: #10b981;">📥 Import CSV</a>
                    </div>
                </div>
                <p>Zarządzaj wszystkimi lektorami w systemie, ich statusem i dostępnością.</p>
                
                <!-- Tu będzie tabela z lektorami -->
                <div class="table-container">
                    <p class="admin-text-muted">Ładowanie listy lektorów...</p>
                </div>
            </div>
        `
    }

    private getStudentsContent(): string {
        return `
            <div class="admin-content-area">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Lista Uczniów</h2>
                    <div style="display: flex; gap: 1rem;">
                        <a href="/admin/students/add" class="admin-action-btn">+ Dodaj Ucznia</a>
                        <a href="/admin/import/students" class="admin-action-btn" style="background: #10b981;">📥 Import CSV</a>
                    </div>
                </div>
                <p>Zarządzaj uczniami, ich pakietami godzin i przypisaniami do lektorów.</p>
                
                <!-- Tu będzie tabela z uczniami -->
                <div class="table-container">
                    <p class="admin-text-muted">Ładowanie listy uczniów...</p>
                </div>
            </div>
        `
    }

    private getLessonsContent(): string {
        return `
            <div class="admin-content-area">
                <h2>Historia Lekcji</h2>
                <p>Przeglądaj wszystkie przeprowadzone i zaplanowane lekcje w systemie.</p>
                
                <!-- Tu będzie kalendarz/lista lekcji -->
                <div class="lessons-container">
                    <p class="admin-text-muted">Ładowanie lekcji...</p>
                </div>
            </div>
        `
    }

    private getActivityContent(): string {
        return `
            <div class="admin-content-area">
                <h2>Monitor Aktywności</h2>
                <p>Śledzenie aktywności użytkowników w czasie rzeczywistym.</p>
                
                <!-- Tu będzie lista aktywności -->
                <div class="activity-log">
                    <p class="admin-text-muted">Ładowanie logów aktywności...</p>
                </div>
            </div>
        `
    }

    private getSettingsContent(): string {
        return `
            <div class="admin-content-area">
                <h2>Konfiguracja Platformy</h2>
                <p>Globalne ustawienia systemu, integracje i konfiguracja.</p>
                
                <!-- Tu będą ustawienia -->
                <div class="settings-form">
                    <p class="admin-text-muted">Ładowanie ustawień...</p>
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
}