// resources/ts/components/dashboard/StudentDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'

export class StudentDashboard implements RouteComponent {
    private activeSection: string = 'dashboard'
    private container: HTMLElement | null = null
    private refreshInterval: number | null = null
    private isLoadingStats: boolean = false

    async render(): Promise<HTMLElement> {
        const user = authService.getUser()
        const el = document.createElement('div')
        el.className = 'student-container'
        el.innerHTML = `
            <!-- Sidebar -->
            <nav class="sidebar" id="sidebar">
                <div class="logo">
                    <h2>🎓 Platforma Lektorów</h2>
                    <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">Panel Studenta</p>
                </div>

                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link active" data-section="dashboard">
                            <span class="nav-icon">🏠</span>
                            Strona główna
                        </a>
                    </li>

                    <div class="nav-section">Moje Lekcje</div>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="nadchodzace">
                            <span class="nav-icon">📅</span>
                            Nadchodzące lekcje
                            <span class="nav-badge nav-badge-success" id="upcoming-count">0</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="rezerwuj">
                            <span class="nav-icon">➕</span>
                            Zarezerwuj lekcję
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="historia">
                            <span class="nav-icon">📚</span>
                            Historia lekcji
                        </a>
                    </li>

                    <div class="nav-section">Moja Nauka</div>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="postepy">
                            <span class="nav-icon">📊</span>
                            Moje postępy
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="materialy">
                            <span class="nav-icon">📖</span>
                            Materiały do nauki
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="zadania">
                            <span class="nav-icon">📝</span>
                            Zadania domowe
                            <span class="nav-badge nav-badge-warning" id="homework-count">0</span>
                        </a>
                    </li>

                    <div class="nav-section">Pakiety i Płatności</div>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="pakiet">
                            <span class="nav-icon">💳</span>
                            Mój pakiet godzin
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="platnosci">
                            <span class="nav-icon">💰</span>
                            Historia płatności
                        </a>
                    </li>

                    <div class="nav-section">Konto</div>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="profil">
                            <span class="nav-icon">👤</span>
                            Mój profil
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="ustawienia">
                            <span class="nav-icon">⚙️</span>
                            Ustawienia
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="pomoc">
                            <span class="nav-icon">❓</span>
                            Pomoc
                        </a>
                    </li>
                </ul>
            </nav>

            <!-- Main Content -->
            <main class="main-content">
                <header class="header">
                    <div>
                        <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
                        <h1 id="page-title">Strona główna</h1>
                    </div>
                    <div class="user-info">
                        <div class="package-info">
                            <span class="hours-badge">
                                <span class="hours-number" id="remaining-hours">0</span>
                                <span class="hours-label">godzin pozostało</span>
                            </span>
                        </div>
                        <div class="user-avatar">${user?.name?.charAt(0).toUpperCase() || 'S'}</div>
                        <div>
                            <div style="font-weight: 600;">${user?.name || 'Student'}</div>
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

        // Check for section in URL (optional deep linking)
        const params = new URLSearchParams(window.location.search)
        const section = params.get('section') || 'dashboard'

        // Load initial content
        this.loadContent(section)

        // Start auto-refresh
        this.startAutoRefresh()
    }

    unmount(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval)
        }
    }

    private setupNavigation(): void {
        const navLinks = this.container?.querySelectorAll('.nav-link')

        console.log('Setting up navigation, found links:', navLinks?.length)

        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation() // Zatrzymaj propagację

                const target = e.currentTarget as HTMLElement
                const section = target.getAttribute('data-section')

                console.log('Nav link clicked:', section)

                if (!section) return

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'))
                target.classList.add('active')

                // Load content
                this.loadContent(section)
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
                pageTitle.textContent = 'Strona główna'

                // Ustaw loading state
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()

                // Załaduj prawdziwe dane
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
                break

            case 'nadchodzace':
                pageTitle.textContent = 'Nadchodzące lekcje'
                contentArea.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p class="loading-text">Ładowanie nadchodzących lekcji...</p></div>'

                setTimeout(() => {
                    contentArea.innerHTML = this.getUpcomingLessonsContent()
                }, 800)
                break

            case 'rezerwuj':
                pageTitle.textContent = 'Zarezerwuj lekcję'
                contentArea.innerHTML = this.getBookLessonContent()
                break

            case 'historia':
                pageTitle.textContent = 'Historia lekcji'
                contentArea.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p class="loading-text">Ładowanie historii lekcji...</p></div>'

                setTimeout(() => {
                    contentArea.innerHTML = this.getLessonHistoryContent()
                }, 800)
                break

            case 'postepy':
                pageTitle.textContent = 'Moje postępy'
                contentArea.innerHTML = this.getProgressContent()
                break

            case 'pakiet':
                pageTitle.textContent = 'Mój pakiet godzin'
                contentArea.innerHTML = this.getPackageContent()
                break

            case 'profil':
                pageTitle.textContent = 'Mój profil'
                contentArea.innerHTML = this.getProfileContent()
                break

            default:
                pageTitle.textContent = 'Strona główna'
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
        }
    }

    private async getDashboardContent(): Promise<string> {
        // Pokaż loading state
        if (this.isLoadingStats) {
            return `
                <div class="content-area">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Ładowanie Twoich statystyk...</p>
                    </div>
                </div>
            `
        }

        // Fetch stats
        const stats = await this.fetchStudentStats()

        return `
            <!-- Welcome Section -->
            <div class="welcome-card">
                <h2>Witaj z powrotem, ${authService.getUser()?.name || 'Studencie'}! 👋</h2>
                <p>Twoja przygoda z nauką języków trwa już ${stats.days_learning || 0} dni!</p>
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: #10b981;">📚</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.completed_lessons || 0}</div>
                        <div class="stat-label">Ukończonych lekcji</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: #3b82f6;">⏱️</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total_hours || 0}h</div>
                        <div class="stat-label">Godzin nauki</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: #f59e0b;">🔥</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.streak_days || 0}</div>
                        <div class="stat-label">Dni z rzędu</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: #e91e63;">⭐</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.average_rating || 0}/5</div>
                        <div class="stat-label">Średnia ocena</div>
                    </div>
                </div>
            </div>

            <!-- Next Lesson -->
            <div class="content-area" style="margin-top: 2rem;">
                <h3>Następna lekcja</h3>
                ${stats.next_lesson ? `
                    <div class="next-lesson-card">
                        <div class="lesson-time">
                            <div class="lesson-date">📅 ${stats.next_lesson.date}</div>
                            <div class="lesson-hour">🕐 ${stats.next_lesson.time}</div>
                        </div>
                        <div class="lesson-details">
                            <div class="lesson-teacher">👨‍🏫 ${stats.next_lesson.tutor}</div>
                            <div class="lesson-subject">📖 ${stats.next_lesson.subject}</div>
                        </div>
                        <div class="lesson-actions">
                            <button class="btn-primary">Dołącz do lekcji</button>
                            <button class="btn-secondary">Zobacz szczegóły</button>
                        </div>
                    </div>
                ` : `
                    <p class="no-lessons">Nie masz zaplanowanych lekcji. <a href="javascript:void(0)" onclick="document.querySelector('[data-section=rezerwuj]').click()">Zarezerwuj lekcję</a></p>
                `}
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions" style="margin-top: 2rem;">
                <div class="action-card">
                    <div class="action-icon" style="background: #10b981;">📅</div>
                    <h3>Zarezerwuj lekcję</h3>
                    <p>Wybierz termin i lektora</p>
                    <a href="javascript:void(0)" class="action-btn" onclick="document.querySelector('[data-section=rezerwuj]').click()">Rezerwuj</a>
                </div>

                <div class="action-card">
                    <div class="action-icon" style="background: #3b82f6;">📊</div>
                    <h3>Sprawdź postępy</h3>
                    <p>Zobacz swoje osiągnięcia</p>
                    <a href="javascript:void(0)" class="action-btn" onclick="document.querySelector('[data-section=postepy]').click()">Zobacz</a>
                </div>

                <div class="action-card">
                    <div class="action-icon" style="background: #f59e0b;">📖</div>
                    <h3>Materiały</h3>
                    <p>Pobierz materiały do nauki</p>
                    <a href="javascript:void(0)" class="action-btn" onclick="document.querySelector('[data-section=materialy]').click()">Przeglądaj</a>
                </div>

                <div class="action-card">
                    <div class="action-icon" style="background: #e91e63;">💳</div>
                    <h3>Dokup godziny</h3>
                    <p>Przedłuż swój pakiet</p>
                    <a href="javascript:void(0)" class="action-btn" onclick="document.querySelector('[data-section=pakiet]').click()">Kup</a>
                </div>
            </div>
        `
    }

    private getUpcomingLessonsContent(): string {
        return `
            <div class="content-area">
                <h2>Nadchodzące lekcje</h2>
                <p>Twoje zaplanowane lekcje na najbliższe dni.</p>
                
                <div class="lessons-list">
                    <p class="text-muted">Ładowanie lekcji...</p>
                </div>
            </div>
        `
    }

    private getBookLessonContent(): string {
        return `
            <div class="content-area">
                <h2>Zarezerwuj lekcję</h2>
                <p>Wybierz lektora i termin, który Ci odpowiada.</p>
                
                <div class="booking-container">
                    <div class="booking-steps">
                        <div class="step active">1. Wybierz język</div>
                        <div class="step">2. Wybierz lektora</div>
                        <div class="step">3. Wybierz termin</div>
                        <div class="step">4. Potwierdź</div>
                    </div>
                    
                    <div class="booking-content">
                        <p class="text-muted">Wybierz język, którego chcesz się uczyć...</p>
                    </div>
                </div>
            </div>
        `
    }

    private getLessonHistoryContent(): string {
        return `
            <div class="content-area">
                <h2>Historia lekcji</h2>
                <p>Przeglądaj wszystkie swoje dotychczasowe lekcje.</p>
                
                <div class="history-filters">
                    <select class="filter-select">
                        <option>Wszystkie języki</option>
                        <option>Angielski</option>
                        <option>Niemiecki</option>
                        <option>Francuski</option>
                    </select>
                    
                    <select class="filter-select">
                        <option>Ostatnie 30 dni</option>
                        <option>Ostatnie 3 miesiące</option>
                        <option>Ostatni rok</option>
                    </select>
                </div>
                
                <div class="history-list">
                    <p class="text-muted">Ładowanie historii...</p>
                </div>
            </div>
        `
    }

    private getProgressContent(): string {
        return `
            <div class="content-area">
                <h2>Moje postępy w nauce</h2>
                <p>Śledź swoje osiągnięcia i rozwój umiejętności językowych.</p>
                
                <div class="progress-charts">
                    <div class="progress-card">
                        <h3>Poziom znajomości języka</h3>
                        <div class="language-progress">
                            <div class="language-item">
                                <span>Angielski</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 75%;">B2</div>
                                </div>
                            </div>
                            <div class="language-item">
                                <span>Niemiecki</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 40%;">A2</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress-card">
                        <h3>Statystyki miesięczne</h3>
                        <canvas id="monthly-stats"></canvas>
                    </div>
                </div>
            </div>
        `
    }

    private getPackageContent(): string {
        return `
            <div class="content-area">
                <h2>Mój pakiet godzin</h2>
                
                <div class="package-overview">
                    <div class="current-package">
                        <h3>Aktualny pakiet</h3>
                        <div class="package-details">
                            <div class="package-stat">
                                <span class="label">Pozostało godzin:</span>
                                <span class="value">12</span>
                            </div>
                            <div class="package-stat">
                                <span class="label">Ważny do:</span>
                                <span class="value">31.12.2025</span>
                            </div>
                            <div class="package-stat">
                                <span class="label">Wykorzystano:</span>
                                <span class="value">8 z 20 godzin</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="buy-more">
                        <h3>Dokup godziny</h3>
                        <div class="package-options">
                            <div class="package-option">
                                <h4>Pakiet 10h</h4>
                                <p class="price">450 zł</p>
                                <button class="btn-primary">Wybierz</button>
                            </div>
                            <div class="package-option recommended">
                                <span class="badge">Polecany</span>
                                <h4>Pakiet 20h</h4>
                                <p class="price">800 zł</p>
                                <button class="btn-primary">Wybierz</button>
                            </div>
                            <div class="package-option">
                                <h4>Pakiet 30h</h4>
                                <p class="price">1050 zł</p>
                                <button class="btn-primary">Wybierz</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private getProfileContent(): string {
        const user = authService.getUser()
        return `
            <div class="content-area">
                <h2>Mój profil</h2>
                
                <div class="profile-form">
                    <div class="form-group">
                        <label>Imię i nazwisko</label>
                        <input type="text" value="${user?.name || ''}" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" value="${user?.email || ''}" class="form-control" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>Telefon</label>
                        <input type="tel" value="${user?.phone || ''}" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label>Miasto</label>
                        <input type="text" value="${user?.city || ''}" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label>Języki, których się uczę</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" checked> Angielski</label>
                            <label><input type="checkbox" checked> Niemiecki</label>
                            <label><input type="checkbox"> Francuski</label>
                            <label><input type="checkbox"> Hiszpański</label>
                        </div>
                    </div>
                    
                    <button class="btn-primary">Zapisz zmiany</button>
                </div>
            </div>
        `
    }

    private async fetchStudentStats(): Promise<any> {
        try {
            const response = await api.get('/student/dashboard-stats')
            return (response as any).data || {}
        } catch (error) {
            console.error('Failed to fetch student stats:', error)
            return {}
        }
    }

    private startAutoRefresh(): void {
        // Update remaining hours
        this.updateRemainingHours()

        // Refresh every minute
        this.refreshInterval = window.setInterval(() => {
            this.updateRemainingHours()

            // Refresh dashboard stats if on dashboard
            if (this.activeSection === 'dashboard') {
                this.fetchStudentStats().then(stats => {
                    // Update counters
                    const upcomingEl = this.container?.querySelector('#upcoming-count')
                    if (upcomingEl) upcomingEl.textContent = String(stats.upcoming_lessons || 0)

                    const homeworkEl = this.container?.querySelector('#homework-count')
                    if (homeworkEl) homeworkEl.textContent = String(stats.pending_homework || 0)
                })
            }
        }, 60000)
    }

    private updateRemainingHours(): void {
        // This would fetch from API in real app
        const hoursEl = this.container?.querySelector('#remaining-hours')
        if (hoursEl) hoursEl.textContent = '12' // Mock data
    }

    private addStyles(): void {
        // Check if styles already exist
        if (document.getElementById('student-dashboard-styles')) return

        const style = document.createElement('style')
        style.id = 'student-dashboard-styles'
        style.textContent = `
            .student-container {
                display: flex;
                min-height: 100vh;
            }

            /* Reuse admin styles */
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

            .nav-badge-warning {
                background: #f59e0b;
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

            .package-info {
                background: #e91e63;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.875rem;
            }

            .hours-badge {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .hours-number {
                font-weight: bold;
                font-size: 1.125rem;
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

            /* Welcome Card */
            .welcome-card {
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                color: white;
                padding: 2rem;
                border-radius: 10px;
                margin-bottom: 2rem;
            }

            .welcome-card h2 {
                margin: 0 0 0.5rem 0;
                font-size: 1.75rem;
            }

            .welcome-card p {
                margin: 0;
                opacity: 0.9;
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .stat-card {
                background: white;
                padding: 1.5rem;
                border-radius: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .stat-icon {
                width: 50px;
                height: 50px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
            }

            .stat-content {
                flex: 1;
            }

            .stat-number {
                font-size: 1.5rem;
                font-weight: bold;
                color: #1e293b;
            }

            .stat-label {
                font-size: 0.875rem;
                color: #64748b;
            }

            /* Quick Actions */
            .quick-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
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

            /* Next Lesson Card */
            .next-lesson-card {
                background: #f8fafc;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                padding: 1.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .lesson-time {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .lesson-date {
                font-weight: 600;
                color: #1e293b;
            }

            .lesson-hour {
                color: #64748b;
            }

            .lesson-details {
                flex: 1;
            }

            .lesson-teacher {
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 0.25rem;
            }

            .lesson-subject {
                color: #64748b;
            }

            .lesson-actions {
                display: flex;
                gap: 0.5rem;
            }

            .btn-primary {
                background: #3b82f6;
                color: white;
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: background 0.3s;
            }

            .btn-primary:hover {
                background: #2563eb;
            }

            .btn-secondary {
                background: transparent;
                color: #3b82f6;
                padding: 0.5rem 1rem;
                border: 1px solid #3b82f6;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.3s;
            }

            .btn-secondary:hover {
                background: #3b82f6;
                color: white;
            }

            .no-lessons {
                padding: 2rem;
                text-align: center;
                color: #64748b;
            }

            .no-lessons a {
                color: #3b82f6;
                text-decoration: none;
                cursor: pointer;
            }

            .no-lessons a:hover {
                text-decoration: underline;
            }

            /* Loading States */
            .loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4rem 2rem;
                min-height: 300px;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }

            .loading-text {
                color: #64748b;
                font-size: 0.95rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Forms */
            .form-group {
                margin-bottom: 1.5rem;
            }

            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #374151;
            }

            .form-control {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #e5e7eb;
                border-radius: 5px;
                font-size: 1rem;
            }

            .form-control:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .form-control:disabled {
                background: #f3f4f6;
                cursor: not-allowed;
            }

            .checkbox-group {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
            }

            .checkbox-group label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: normal;
            }

            /* Progress */
            .progress-bar {
                background: #e5e7eb;
                height: 24px;
                border-radius: 12px;
                overflow: hidden;
                margin-top: 0.5rem;
            }

            .progress-fill {
                background: #3b82f6;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.75rem;
                font-weight: 600;
                transition: width 0.3s;
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

                .stats-grid {
                    grid-template-columns: 1fr 1fr;
                }

                .quick-actions {
                    grid-template-columns: 1fr;
                }

                .next-lesson-card {
                    flex-direction: column;
                    text-align: center;
                }

                .lesson-actions {
                    width: 100%;
                }

                .lesson-actions button {
                    flex: 1;
                }
            }

            .text-muted {
                color: #64748b;
            }

            /* Package Options */
            .package-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .package-option {
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                padding: 1.5rem;
                text-align: center;
                position: relative;
                transition: all 0.3s;
            }

            .package-option:hover {
                border-color: #3b82f6;
                transform: translateY(-2px);
            }

            .package-option.recommended {
                border-color: #e91e63;
            }

            .package-option .badge {
                position: absolute;
                top: -10px;
                right: 10px;
                background: #e91e63;
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 10px;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .package-option h4 {
                margin-bottom: 0.5rem;
            }

            .package-option .price {
                font-size: 1.5rem;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 1rem;
            }
        `
        document.head.appendChild(style)
    }
}