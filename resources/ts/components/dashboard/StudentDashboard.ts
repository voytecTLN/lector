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
            <nav class="student-sidebar" id="sidebar">
                <div class="student-logo-dashboard">
                    <h2>🎓 Platforma Lektorów</h2>
                    <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">Panel Studenta</p>
                </div>

                <ul class="student-nav-menu">
                    <li class="student-nav-item">
                        <a href="#dashboard" class="student-nav-link active" data-section="dashboard">
                            <span class="student-nav-icon">🏠</span>
                            Strona główna
                        </a>
                    </li>

                    <div class="student-nav-section">Moje Lekcje</div>

                    <li class="student-nav-item">
                        <a href="#nadchodzace" class="student-nav-link" data-section="nadchodzace">
                            <span class="student-nav-icon">📅</span>
                            Nadchodzące lekcje
                            <span class="student-nav-badge student-nav-badge-success" id="upcoming-count">0</span>
                        </a>
                    </li>

                    <li class="student-nav-item">
                        <a href="#rezerwuj" class="student-nav-link" data-section="rezerwuj">
                            <span class="student-nav-icon">➕</span>
                            Zarezerwuj lekcję
                        </a>
                    </li>

                    <li class="student-nav-item">
                        <a href="#historia" class="student-nav-link" data-section="historia">
                            <span class="student-nav-icon">📚</span>
                            Historia lekcji
                        </a>
                    </li>

                    <div class="student-nav-section">Moja Nauka</div>

                    <li class="student-nav-item">
                        <a href="#postepy" class="student-nav-link" data-section="postepy">
                            <span class="student-nav-icon">📊</span>
                            Moje postępy
                        </a>
                    </li>

                    <li class="student-nav-item">
                        <a href="#materialy" class="student-nav-link" data-section="materialy">
                            <span class="student-nav-icon">📖</span>
                            Materiały do nauki
                        </a>
                    </li>

                    <li class="student-nav-item">
                        <a href="#zadania" class="student-nav-link" data-section="zadania">
                            <span class="student-nav-icon">📝</span>
                            Zadania domowe
                            <span class="student-nav-badge student-nav-badge-warning" id="homework-count">0</span>
                        </a>
                    </li>

                    <div class="student-nav-section">Pakiety i Płatności</div>

                    <li class="student-nav-item">
                        <a href="#pakiet" class="student-nav-link" data-section="pakiet">
                            <span class="student-nav-icon">💳</span>
                            Mój pakiet godzin
                        </a>
                    </li>

                    <li class="student-nav-item">
                        <a href="#platnosci" class="student-nav-link" data-section="platnosci">
                            <span class="student-nav-icon">💰</span>
                            Historia płatności
                        </a>
                    </li>

                    <div class="student-nav-section">Konto</div>

                    <li class="student-nav-item">
                        <a href="#profil" class="student-nav-link" data-section="profil">
                            <span class="student-nav-icon">👤</span>
                            Mój profil
                        </a>
                    </li>

                    <li class="student-nav-item">
                        <a href="#ustawienia" class="student-nav-link" data-section="ustawienia">
                            <span class="student-nav-icon">⚙️</span>
                            Ustawienia
                        </a>
                    </li>

                    <li class="student-nav-item">
                        <a href="#pomoc" class="student-nav-link" data-section="pomoc">
                            <span class="student-nav-icon">❓</span>
                            Pomoc
                        </a>
                    </li>
                </ul>
            </nav>

            <!-- Main Content -->
            <main class="student-main-content">
                <header class="student-header">
                    <div>
                        <button class="student-mobile-menu-btn" id="mobile-menu-btn">☰</button>
                        <h1 id="page-title">Strona główna</h1>
                    </div>
                    <div class="student-user-info">
                        <div class="package-info">
                            <span class="hours-badge">
                                <span class="hours-number" id="remaining-hours">0</span>
                                <span class="hours-label">godzin pozostało</span>
                            </span>
                        </div>
                        <div class="student-user-avatar">${user?.name?.charAt(0).toUpperCase() || 'S'}</div>
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

        // Load initial content
        this.loadContent('dashboard')

        // Start auto-refresh
        this.startAutoRefresh()
    }

    unmount(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval)
        }
    }

    private setupNavigation(): void {
        const navLinks = this.container?.querySelectorAll('.student-nav-link')

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
                pageTitle.textContent = 'Strona główna'
                // contentArea.innerHTML = await this.getDashboardContent()
                // Ustaw loading state
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()

                // Załaduj prawdziwe dane
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
                break

            case 'nadchodzace':
                pageTitle.textContent = 'Nadchodzące lekcje'
                // contentArea.innerHTML = this.getUpcomingLessonsContent()
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie nadchodzących lekcji...</p></div>'

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
                // contentArea.innerHTML = this.getLessonHistoryContent()
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie historii lekcji...</p></div>'

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
                // contentArea.innerHTML = await this.getDashboardContent()
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
        }
    }

    private async getDashboardContent(): Promise<string> {
        if (this.isLoadingStats) {
            return `
            <div class="student-content-area">
                <div class="student-loading-container">
                    <div class="student-loading-spinner"></div>
                    <p class="student-loading-text">Ładowanie Twoich statystyk...</p>
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
            <div class="student-content-area" style="margin-top: 2rem;">
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
                            <button class="student-btn-primary">Dołącz do lekcji</button>
                            <button class="student-btn-secondary">Zobacz szczegóły</button>
                        </div>
                    </div>
                ` : `
                    <p class="no-lessons">Nie masz zaplanowanych lekcji. <a href="#rezerwuj">Zarezerwuj lekcję</a></p>
                `}
            </div>

            <!-- Quick Actions -->
            <div class="student-quick-actions" style="margin-top: 2rem;">
                <div class="student-action-card">
                    <div class="student-action-icon" style="background: #10b981;">📅</div>
                    <h3>Zarezerwuj lekcję</h3>
                    <p>Wybierz termin i lektora</p>
                    <a href="#rezerwuj" class="student-action-btn">Rezerwuj</a>
                </div>

                <div class="student-action-card">
                    <div class="student-action-icon" style="background: #3b82f6;">📊</div>
                    <h3>Sprawdź postępy</h3>
                    <p>Zobacz swoje osiągnięcia</p>
                    <a href="#postepy" class="student-action-btn">Zobacz</a>
                </div>

                <div class="student-action-card">
                    <div class="student-action-icon" style="background: #f59e0b;">📖</div>
                    <h3>Materiały</h3>
                    <p>Pobierz materiały do nauki</p>
                    <a href="#materialy" class="student-action-btn">Przeglądaj</a>
                </div>

                <div class="student-action-card">
                    <div class="student-action-icon" style="background: #e91e63;">💳</div>
                    <h3>Dokup godziny</h3>
                    <p>Przedłuż swój pakiet</p>
                    <a href="#pakiet" class="student-action-btn">Kup</a>
                </div>
            </div>
        `
    }

    private getUpcomingLessonsContent(): string {
        return `
            <div class="student-content-area">
                <h2>Nadchodzące lekcje</h2>
                <p>Twoje zaplanowane lekcje na najbliższe dni.</p>
                
                <div class="lessons-list">
                    <p class="student-text-muted">Ładowanie lekcji...</p>
                </div>
            </div>
        `
    }

    private getBookLessonContent(): string {
        return `
            <div class="student-content-area">
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
                        <p class="student-text-muted">Wybierz język, którego chcesz się uczyć...</p>
                    </div>
                </div>
            </div>
        `
    }

    private getLessonHistoryContent(): string {
        return `
            <div class="student-content-area">
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
                    <p class="student-text-muted">Ładowanie historii...</p>
                </div>
            </div>
        `
    }

    private getProgressContent(): string {
        return `
            <div class="student-content-area">
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
            <div class="student-content-area">
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
                                <button class="student-btn-primary">Wybierz</button>
                            </div>
                            <div class="package-option recommended">
                                <span class="badge">Polecany</span>
                                <h4>Pakiet 20h</h4>
                                <p class="price">800 zł</p>
                                <button class="student-btn-primary">Wybierz</button>
                            </div>
                            <div class="package-option">
                                <h4>Pakiet 30h</h4>
                                <p class="price">1050 zł</p>
                                <button class="student-btn-primary">Wybierz</button>
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
            <div class="student-content-area">
                <h2>Mój profil</h2>
                
                <div class="profile-form">
                    <div class="student-form-group">
                        <label>Imię i nazwisko</label>
                        <input type="text" value="${user?.name || ''}" class="student-form-control">
                    </div>
                    
                    <div class="student-form-group">
                        <label>Email</label>
                        <input type="email" value="${user?.email || ''}" class="student-form-control" disabled>
                    </div>
                    
                    <div class="student-form-group">
                        <label>Telefon</label>
                        <input type="tel" value="${user?.phone || ''}" class="student-form-control">
                    </div>
                    
                    <div class="student-form-group">
                        <label>Miasto</label>
                        <input type="text" value="${user?.city || ''}" class="student-form-control">
                    </div>
                    
                    <div class="student-form-group">
                        <label>Języki, których się uczę</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" checked> Angielski</label>
                            <label><input type="checkbox" checked> Niemiecki</label>
                            <label><input type="checkbox"> Francuski</label>
                            <label><input type="checkbox"> Hiszpański</label>
                        </div>
                    </div>
                    
                    <button class="student-btn-primary">Zapisz zmiany</button>
                </div>
            </div>
        `
    }

    private async fetchStudentStats(): Promise<any> {
        try {
            /*
            * Dodać typy np.:
            * type StudentStats = {
            * users: number
            * revenue: number
            * activeSessions: number
            // dodaj inne pola według API
            *}
             */
            const response = await api.get('/student/dashboard-stats')
            // return response.data || {}
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
            
        `
        document.head.appendChild(style)
    }
}