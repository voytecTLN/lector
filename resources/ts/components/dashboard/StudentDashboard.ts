// resources/ts/components/dashboard/StudentDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'
import { navigate } from "@utils/navigation";
import { StudentProfileEdit } from '@components/students/StudentProfileEdit'

export class StudentDashboard implements RouteComponent {
    private activeSection: string = 'dashboard'
    private container: HTMLElement | null = null
    private refreshInterval: number | null = null
    private isLoadingStats: boolean = false
    private profileEditComponent: StudentProfileEdit | null = null

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
<!--                            <span class="student-nav-badge student-nav-badge-success" id="upcoming-count">0</span>-->
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

<!--                    <li class="student-nav-item">-->
<!--                        <a href="#postepy" class="student-nav-link" data-section="postepy">-->
<!--                            <span class="student-nav-icon">📊</span>-->
<!--                            Moje postępy-->
<!--                        </a>-->
<!--                    </li>-->

                    <li class="student-nav-item">
                        <a href="#materialy" class="student-nav-link" data-section="materialy">
                            <span class="student-nav-icon">📖</span>
                            Materiały do nauki
                        </a>
                    </li>

<!--                    <li class="student-nav-item">-->
<!--                        <a href="#zadania" class="student-nav-link" data-section="zadania">-->
<!--                            <span class="student-nav-icon">📝</span>-->
<!--                            Zadania domowe-->
<!--                            <span class="student-nav-badge student-nav-badge-warning" id="homework-count">0</span>-->
<!--                        </a>-->
<!--                    </li>-->

<!--                    <div class="student-nav-section">Pakiety i Płatności</div>-->

<!--                    <li class="student-nav-item">-->
<!--                        <a href="#pakiet" class="student-nav-link" data-section="pakiet">-->
<!--                            <span class="student-nav-icon">💳</span>-->
<!--                            Mój pakiet godzin-->
<!--                        </a>-->
<!--                    </li>-->

<!--                    <li class="student-nav-item">-->
<!--                        <a href="#platnosci" class="student-nav-link" data-section="platnosci">-->
<!--                            <span class="student-nav-icon">💰</span>-->
<!--                            Historia płatności-->
<!--                        </a>-->
<!--                    </li>-->

                    <div class="student-nav-section">Konto</div>

                    <li class="student-nav-item">
                        <a href="#profil" class="student-nav-link" data-section="profil">
                            <span class="student-nav-icon">👤</span>
                            Mój profil
                        </a>
                    </li>

<!--                    <li class="student-nav-item">-->
<!--                        <a href="#ustawienia" class="student-nav-link" data-section="ustawienia">-->
<!--                            <span class="student-nav-icon">⚙️</span>-->
<!--                            Ustawienia-->
<!--                        </a>-->
<!--                    </li>-->

<!--                    <li class="student-nav-item">-->
<!--                        <a href="#pomoc" class="student-nav-link" data-section="pomoc">-->
<!--                            <span class="student-nav-icon">❓</span>-->
<!--                            Pomoc-->
<!--                        </a>-->
<!--                    </li>-->
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

        // NOWE: Odczytaj sekcję z URL
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'dashboard'

        // NOWE: Ustaw aktywną klasę na podstawie URL
        this.setActiveNavLink(section)

        // Load initial content
        this.loadContent(section)

        // NOWE: Obsługa przycisku wstecz
        window.addEventListener('popstate', this.handlePopState.bind(this))

        // Start auto-refresh
        this.startAutoRefresh()
    }

    private handlePopState = (event: PopStateEvent): void => {
        // Make sure container is ready
        if (!this.container) {
            console.warn('Dashboard container not ready for popstate event')
            return
        }

        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'dashboard'

        this.setActiveNavLink(section)
        this.loadContent(section)
    }

    private setActiveNavLink(section: string): void {
        const navLinks = this.container?.querySelectorAll('.student-nav-link')
        navLinks?.forEach(link => {
            const linkSection = link.getAttribute('data-section')
            if (linkSection === section) {
                link.classList.add('active')
            } else {
                link.classList.remove('active')
            }
        })
    }

    private updateURL(section: string): void {
        const url = new URL(window.location.href)
        url.searchParams.set('section', section)

        // Używamy pushState zamiast replaceState dla historii
        window.history.pushState({ section }, '', url.toString())
    }

    unmount(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval)
        }

        // Cleanup profile edit component
        if (this.profileEditComponent) {
            this.profileEditComponent.unmount()
            this.profileEditComponent = null
        }

        // NOWE: Cleanup event listener
        window.removeEventListener('popstate', this.handlePopState)
    }

    private setupNavigation(): void {
        const navLinks = this.container?.querySelectorAll('.student-nav-link')

        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()

                const section = link.getAttribute('data-section')
                if (section) {
                    // NOWE: Aktualizuj URL
                    this.updateURL(section)

                    // Update active state
                    navLinks.forEach(l => l.classList.remove('active'))
                    link.classList.add('active')

                    // Load content
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
            navigate.to('/')
        })
    }

    private async loadContent(section: string): Promise<void> {
        if (!this.container) {
            console.warn('Dashboard container not ready for loadContent')
            return
        }

        const contentArea = this.container.querySelector('#content-area')
        const pageTitle = this.container.querySelector('#page-title')

        if (!contentArea || !pageTitle) {
            console.warn('Dashboard content area or page title not found')
            return
        }

        // Cleanup previous components
        if (this.profileEditComponent) {
            this.profileEditComponent.unmount()
            this.profileEditComponent = null
        }

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
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie profilu...</p></div>'
                
                try {
                    // Initialize profile edit component
                    this.profileEditComponent = new StudentProfileEdit()
                    
                    if (!this.profileEditComponent) {
                        throw new Error('Failed to create StudentProfileEdit component')
                    }
                    
                    const profileHTML = await this.profileEditComponent.render()
                    contentArea.innerHTML = `<div class="student-content-area">${profileHTML}</div>`
                    
                    // Mount the component
                    const profileContainer = contentArea.querySelector('.student-profile-edit')
                    if (profileContainer && this.profileEditComponent) {
                        await this.profileEditComponent.mount(profileContainer as HTMLElement)
                    } else {
                        console.error('Profile container not found or component is null')
                        contentArea.innerHTML = '<div class="alert alert-danger">Błąd podczas ładowania profilu</div>'
                    }
                } catch (error) {
                    console.error('Error loading profile component:', error)
                    contentArea.innerHTML = '<div class="alert alert-danger">Błąd podczas ładowania profilu</div>'
                }
                break

            case 'materialy':
                pageTitle.textContent = 'Materiały'
                contentArea.innerHTML = this.getMaterialsContent()
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
        const user = authService.getUser()

        return `
        <!-- Welcome Section - PRAWDZIWE dane -->
        <div class="welcome-card">
            <h2>Witaj z powrotem, ${user?.name || 'Studencie'}! 👋</h2>
            <p>Jesteś z nami już ${stats.days_learning || 0} dni!</p>
            ${!stats.is_verified ? '<p class="verification-notice">⚠️ Pamiętaj o weryfikacji adresu email</p>' : ''}
        </div>

        <!-- Quick Stats - MIX prawdziwych i placeholder -->
        <div class="stats-grid">
            <div class="stat-card ${stats.completed_lessons === null ? 'placeholder' : ''}">
                <div class="stat-icon" style="background: #10b981;">📚</div>
                <div class="stat-content">
                    <div class="stat-number">${stats.completed_lessons ?? '—'}</div>
                    <div class="stat-label">Ukończonych lekcji</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #3b82f6;">📅</div>
                <div class="stat-content">
                    <div class="stat-number">${stats.days_learning || 0}</div>
                    <div class="stat-label">Dni nauki</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #f59e0b;">🌍</div>
                <div class="stat-content">
                    <div class="stat-number">${(stats.learning_languages || []).length}</div>
                    <div class="stat-label">Języków w nauce</div>
                </div>
            </div>
        </div>

        <!-- Next Lesson - placeholder z info -->
        <div class="student-content-area" style="margin-top: 2rem;">
            <h3>Następna lekcja</h3>
            <div class="next-lesson-placeholder">
                <p>🔧 Moduł lekcji będzie dostępny wkrótce</p>
                <p>Na razie możesz zaktualizować swój profil i cele nauki.</p>
            </div>
        </div>

        <!-- Quick Actions - działające + coming soon -->
        <div class="student-quick-actions" style="margin-top: 2rem;">
            <div class="student-action-card">
                <div class="student-action-icon" style="background: #3b82f6;">👤</div>
                <h3>Mój profil</h3>
                <p>Edytuj dane i preferencje</p>
                <a href="/#/student/dashboard?section=profil" class="student-action-btn">Zobacz</a>
            </div>
            
            <div class="student-action-card">
                <div class="student-action-icon" style="background: #f59e0b;">📅</div>
                <h3>Zarezerwuj lekcję</h3>
                <p>Znajdź lektora i ustaw termin</p>
                <button class="student-action-btn coming-soon" onclick="this.showComingSoon('Rezerwacja lekcji')">Wkrótce</button>
<!--                <a href="#" class="student-action-btn coming-soon" onclick="event.preventDefault(); this.showComingSoon('Rezerwacja lekcji')">Wkrótce</a>-->
            </div>

            <div class="student-action-card">
                <div class="student-action-icon" style="background: #10b981;">🎯</div>
                <h3>Historia lekcji</h3>
                <p>Sprawdź odbyte lekcje</p>
                <button class="student-action-btn coming-soon" onclick="this.showComingSoon('Historia lekcji')">Wkrótce</button>
<!--                <a href="#" class="student-action-btn coming-soon" onclick="event.preventDefault(); this.showComingSoon('Historia lekcji')">Wkrótce</a>-->
            </div>

            <div class="student-action-card">
                <div class="student-action-icon" style="background: #e91e63;">📊</div>
                <h3>Materiały</h3>
                <p>Sprawdź materiały do nauki</p>
                <button class="student-action-btn coming-soon" onclick="this.showComingSoon('Materiały')">Wkrótce</button>
<!--                <a href="#" class="student-action-btn coming-soon" onclick="event.preventDefault(); this.showComingSoon('Materiały')">Wkrótce</a>-->
            </div>
        </div>`
    }

    private loadSection(section: string): void {
        this.updateURL(section)
        this.loadContent(section)
    }

    private showComingSoon(feature: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${feature} będzie dostępny w następnej wersji.`,
                duration: 4000
            }
        }))
    }

    private getUpcomingLessonsContent(): string {
        return `
            <div class="student-content-area">
                <h2>Nadchodzące lekcje</h2>
                <p>Twoje zaplanowane lekcje na najbliższe dni.</p>
                
                <div class="lessons-list">
                    <p class="student-text-muted">Wkrótce</p>
                </div>
            </div>
        `
    }

    private getMaterialsContent(): string {
        return `
            <div class="student-content-area">
                <h2>Materiały</h2>
                <p>Twoje materiały do nauki.</p>
                
                <div class="lessons-list">
                    <p class="student-text-muted">Wkrótce</p>
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
            
            // Make a direct fetch call to avoid API service notifications
            const response = await fetch('/api/student/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            
            if (response.ok) {
                const result = await response.json()
                return result.data || {}
            } else {
                // Silently handle errors without showing notifications
                console.log('Student stats endpoint returned:', response.status)
                throw new Error(`HTTP ${response.status}`)
            }
        } catch (error: any) {
            console.log('Student stats not available, using defaults:', error.message)
            
            // Return default stats to prevent dashboard errors
            return {
                days_learning: 0,
                completed_lessons: null,
                learning_languages: [],
                is_verified: authService.isVerified(),
                upcoming_lessons: 0,
                pending_homework: 0
            }
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