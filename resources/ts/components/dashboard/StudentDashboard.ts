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
    private selectedTutorId: string | null = null

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

                    <div class="student-nav-section">Pakiety</div>

                    <li class="student-nav-item">
                        <a href="#pakiety" class="student-nav-link" data-section="pakiety">
                            <span class="student-nav-icon">📦</span>
                            Moje pakiety
                        </a>
                    </li>

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
        
        // Check if we have a tutor ID in the URL for tutor-specific sections
        const tutorId = urlParams.get('tutor_id')
        if (tutorId && (section === 'tutor-profile' || section === 'tutor-booking')) {
            this.selectedTutorId = tutorId
        }

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
        
        // Check if we have a tutor ID for tutor-specific sections
        const tutorId = urlParams.get('tutor_id')
        if (tutorId && (section === 'tutor-profile' || section === 'tutor-booking')) {
            this.selectedTutorId = tutorId
        }

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
        url.hash = section

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
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie dostępnych lektorów...</p></div>'
                setTimeout(async () => {
                    contentArea.innerHTML = await this.getBookLessonContent()
                    this.setupBookingEventListeners()
                }, 100)
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

            case 'pakiety':
                pageTitle.textContent = 'Moje pakiety'
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie pakietów...</p></div>'
                setTimeout(async () => {
                    contentArea.innerHTML = await this.getPackagesContent()
                }, 100)
                break
                
            case 'tutor-profile':
                if (!this.selectedTutorId) {
                    this.loadSection('rezerwuj')
                    return
                }
                pageTitle.textContent = 'Profil lektora'
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie profilu...</p></div>'
                setTimeout(async () => {
                    contentArea.innerHTML = await this.getTutorProfileContent(this.selectedTutorId!)
                    // Attach event listeners for the booking button
                    this.attachTutorButtonListeners()
                }, 100)
                break
                
            case 'tutor-booking':
                if (!this.selectedTutorId) {
                    this.loadSection('rezerwuj')
                    return
                }
                pageTitle.textContent = 'Sprawdź terminy'
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie kalendarza...</p></div>'
                setTimeout(async () => {
                    contentArea.innerHTML = await this.getTutorBookingContent(this.selectedTutorId!)
                }, 100)
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
    
    private loadSectionWithParams(section: string, params: Record<string, string>): void {
        const url = new URL(window.location.href)
        url.searchParams.set('section', section)
        
        // Add additional parameters
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value)
        })
        
        // Add hash
        url.hash = section
        
        // Update URL and load content
        window.history.pushState({ section }, '', url.toString())
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

    private async getPackagesContent(): Promise<string> {
        try {
            // Pobierz pakiety studenta
            const response = await api.get<any>('/student/packages')
            const packages = response.packages || []
            
            if (packages.length === 0) {
                return `
                    <div class="student-content-area">
                        <h2>Moje pakiety</h2>
                        <div class="empty-state">
                            <div class="empty-state-icon">📦</div>
                            <h3>Brak przypisanych pakietów</h3>
                            <p>Nie masz jeszcze żadnych pakietów godzin.</p>
                            <p>Skontaktuj się z administratorem, aby przypisać pakiet.</p>
                        </div>
                    </div>
                `
            }

            const packagesHtml = packages.map((pkg: any) => {
                const totalHours = pkg.package.hours_count
                const usedHours = pkg.hours_used || 0
                const remainingHours = totalHours - usedHours
                const percentage = (usedHours / totalHours) * 100
                const isExpired = pkg.status === 'expired'
                const isActive = pkg.is_active && !isExpired

                return `
                    <div class="col-md-6 mb-3">
                        <div class="card ${isActive ? '' : 'opacity-75'}">
                            <div class="card-header ${isActive ? 'bg-primary text-white' : 'bg-secondary text-white'}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">${pkg.package.name}</h5>
                                    ${isActive 
                                        ? '<span class="badge bg-success">Aktywny</span>' 
                                        : isExpired 
                                            ? '<span class="badge bg-danger">Wygasły</span>'
                                            : '<span class="badge bg-secondary">Nieaktywny</span>'}
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>Wykorzystane godziny</span>
                                        <span><strong>${usedHours}</strong> / ${totalHours} h</span>
                                    </div>
                                    <div class="progress" style="height: 25px;">
                                        <div class="progress-bar ${percentage > 80 ? 'bg-warning' : 'bg-success'}" 
                                             role="progressbar" 
                                             style="width: ${percentage}%"
                                             aria-valuenow="${percentage}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${Math.round(percentage)}%
                                        </div>
                                    </div>
                                    <small class="text-muted">Pozostało: ${remainingHours} godzin</small>
                                </div>
                                
                                <!--            
                                <div class="row text-center">
                                    <div class="col-6">
                                        <div class="text-muted small">Cena za godzinę</div>
                                        <div class="fw-bold">${pkg.package.price_per_hour} zł</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="text-muted small">Wartość pakietu</div>
                                        <div class="fw-bold">${pkg.package.total_price} zł</div>
                                    </div>
                                </div>
                                -->
                                
                                ${pkg.package.description ? `
                                    <hr>
                                    <p class="text-muted small mb-0">${pkg.package.description}</p>
                                ` : ''}
                                
                                <hr>
                                <div class="d-flex justify-content-between">
                                    <small class="text-muted">Przypisany: ${new Date(pkg.assigned_at).toLocaleDateString('pl-PL')}</small>
                                    ${pkg.expires_at ? `
                                        <small class="text-muted">Wygasa: ${new Date(pkg.expires_at).toLocaleDateString('pl-PL')}</small>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `
            }).join('')

            return `
                <div class="student-content-area">
                    <h2>Moje pakiety</h2>
                    <div class="row">
                        ${packagesHtml}
                    </div>
                </div>
            `
            
        } catch (error) {
            console.error('Failed to load packages:', error)
            return `
                <div class="student-content-area">
                    <h2>Moje pakiety</h2>
                    <div class="alert alert-danger">
                        Błąd podczas ładowania pakietów. Spróbuj ponownie później.
                    </div>
                </div>
            `
        }
    }

    private async getBookLessonContent(): Promise<string> {
        try {
            // Pobierz dostępnych lektorów
            const response = await api.get<any>('/student/tutors-available')
            const tutors = response || []
            
            if (tutors.length === 0) {
                return `
                    <div class="student-content-area">
                        <h2>Zarezerwuj lekcję</h2>
                        <div class="empty-state">
                            <div class="empty-state-icon">👨‍🏫</div>
                            <h3>Brak dostępnych lektorów</h3>
                            <p>W tej chwili nie ma dostępnych lektorów.</p>
                            <p>Spróbuj ponownie później.</p>
                        </div>
                    </div>
                `
            }

            const tutorsHtml = tutors.map((tutor: any) => {
                const profile = tutor.tutor_profile || {}
                const languages = profile.languages || []
                const specializations = profile.specializations || []
                const lessonTypes = profile.lesson_types || []
                
                return `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card tutor-card h-100">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="tutor-avatar">
                                        <i class="bi bi-person-circle fs-1"></i>
                                    </div>
                                    <div class="ms-3">
                                        <h5 class="card-title mb-0">${tutor.name}</h5>
                                        <p class="text-muted mb-0">
                                            <i class="bi bi-geo-alt me-1"></i>${tutor.city || 'Brak lokalizacji'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="mb-2">
                                        <small class="text-muted">Języki:</small>
                                        <div>
                                            ${languages.length > 0 
                                                ? languages.map((lang: string) => `<span class="badge bg-primary me-1">${this.getLanguageName(lang)}</span>`).join('')
                                                : '<span class="text-muted">Brak</span>'
                                            }
                                        </div>
                                    </div>
                                    
                                    <div class="mb-2">
                                        <small class="text-muted">Doświadczenie:</small>
                                        <div>
                                            <strong>${profile.years_experience || 0}</strong> ${this.getYearsLabel(profile.years_experience || 0)}
                                        </div>
                                    </div>
                                    
                                    ${profile.hourly_rate ? `
                                        <!--
                                        <div class="mb-2">
                                            <small class="text-muted">Stawka godzinowa:</small>
                                            <div>
                                                <strong>${profile.hourly_rate} zł</strong>
                                            </div>
                                        </div>
                                        -->
                                    ` : ''}
                                    
                                    ${specializations.length > 0 ? `
                                        <div class="mb-2">
                                            <small class="text-muted">Specjalizacje:</small>
                                            <div>
                                                ${specializations.map((spec: string) => `<span class="badge bg-info me-1">${this.getSpecializationName(spec)}</span>`).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <button class="btn btn-sm btn-outline-primary" data-tutor-id="${tutor.id}" data-action="view-profile">
                                        <i class="bi bi-person me-1"></i>Zobacz profil
                                    </button>
                                    <button class="btn btn-sm btn-primary" data-tutor-id="${tutor.id}" data-action="book-lesson">
                                        <i class="bi bi-calendar-check me-1"></i>Sprawdź terminy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            }).join('')

            return `
                <div class="student-content-area">
                    <h2>Zarezerwuj lekcję</h2>
                    <p>Wybierz lektora i umów się na lekcję.</p>
                    
                    <!-- Filtry -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Filtry</h5>
                            <div class="row">
                                <div class="col-md-3">
                                    <label class="form-label">Język</label>
                                    <select class="form-select" id="filter-language">
                                        <option value="">Wszystkie języki</option>
                                        <option value="english">Angielski</option>
                                        <option value="german">Niemiecki</option>
                                        <option value="spanish">Hiszpański</option>
                                        <option value="french">Francuski</option>
                                        <option value="italian">Włoski</option>
                                        <option value="polish">Polski</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Doświadczenie</label>
                                    <select class="form-select" id="filter-experience">
                                        <option value="">Dowolne</option>
                                        <option value="0-2">0-2 lata</option>
                                        <option value="3-5">3-5 lat</option>
                                        <option value="6-10">6-10 lat</option>
                                        <option value="10+">Powyżej 10 lat</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Specjalizacja</label>
                                    <select class="form-select" id="filter-specialization">
                                        <option value="">Wszystkie</option>
                                        <option value="general">Język ogólny</option>
                                        <option value="business">Biznesowy</option>
                                        <option value="exams">Egzaminy</option>
                                        <option value="kids">Dla dzieci</option>
                                        <option value="conversation">Konwersacje</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">&nbsp;</label>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-primary flex-fill" id="filter-tutors-btn">
                                            <i class="bi bi-search me-1"></i>Szukaj
                                        </button>
                                        <button class="btn btn-outline-secondary" id="reset-filters-btn">
                                            <i class="bi bi-arrow-clockwise"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Lista lektorów -->
                    <div class="row" id="tutors-list">
                        ${tutorsHtml}
                    </div>
                </div>
                
                <style>
                    .tutor-card {
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .tutor-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    }
                    .tutor-avatar {
                        width: 60px;
                        height: 60px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #f8f9fa;
                        border-radius: 50%;
                    }
                </style>
            `
            
        } catch (error) {
            console.error('Failed to load tutors:', error)
            return `
                <div class="student-content-area">
                    <h2>Zarezerwuj lekcję</h2>
                    <div class="alert alert-danger">
                        Błąd podczas ładowania lektorów. Spróbuj ponownie później.
                    </div>
                </div>
            `
        }
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

    private getLanguageName(code: string): string {
        const languages: { [key: string]: string } = {
            'english': 'Angielski',
            'german': 'Niemiecki',
            'spanish': 'Hiszpański',
            'french': 'Francuski',
            'italian': 'Włoski',
            'polish': 'Polski',
            'russian': 'Rosyjski',
            'chinese': 'Chiński',
            'japanese': 'Japoński',
            'arabic': 'Arabski'
        }
        return languages[code] || code
    }

    private getSpecializationName(code: string): string {
        const specializations: { [key: string]: string } = {
            'general': 'Język ogólny',
            'business': 'Biznesowy',
            'exams': 'Egzaminy',
            'kids': 'Dla dzieci',
            'conversation': 'Konwersacje',
            'grammar': 'Gramatyka',
            'pronunciation': 'Wymowa',
            'writing': 'Pisanie',
            'reading': 'Czytanie',
            'listening': 'Słuchanie'
        }
        return specializations[code] || code
    }

    private getYearsLabel(years: number): string {
        if (years === 0) return 'lat'
        if (years === 1) return 'rok'
        if (years >= 2 && years <= 4) return 'lata'
        return 'lat'
    }

    private setupBookingEventListeners(): void {
        const filterBtn = document.getElementById('filter-tutors-btn')
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.filterTutors())
        }
        
        const resetBtn = document.getElementById('reset-filters-btn')
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters())
        }
        
        // Attach tutor button listeners
        this.attachTutorButtonListeners()
    }
    
    private attachTutorButtonListeners(): void {
        // Add event listeners for tutor profile and booking buttons
        document.querySelectorAll('[data-action="view-profile"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tutorId = (e.currentTarget as HTMLElement).getAttribute('data-tutor-id')
                if (tutorId) {
                    // Store tutor ID and load tutor profile section
                    this.selectedTutorId = tutorId
                    this.loadSectionWithParams('tutor-profile', { tutor_id: tutorId })
                }
            })
        })
        
        document.querySelectorAll('[data-action="book-lesson"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tutorId = (e.currentTarget as HTMLElement).getAttribute('data-tutor-id')
                if (tutorId) {
                    // Store tutor ID and load booking section
                    this.selectedTutorId = tutorId
                    this.loadSectionWithParams('tutor-booking', { tutor_id: tutorId })
                }
            })
        })
    }

    private async filterTutors(): Promise<void> {
        const languageSelect = document.getElementById('filter-language') as HTMLSelectElement
        const experienceSelect = document.getElementById('filter-experience') as HTMLSelectElement
        const specializationSelect = document.getElementById('filter-specialization') as HTMLSelectElement
        const tutorsList = document.getElementById('tutors-list')

        if (!tutorsList) return

        // Pokaż loader
        tutorsList.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Ładowanie...</span></div></div>'

        try {
            // Przygotuj parametry filtrów
            const params = new URLSearchParams()
            if (languageSelect?.value) params.append('language', languageSelect.value)
            if (specializationSelect?.value) params.append('specialization', specializationSelect.value)
            
            // Obsługa doświadczenia
            if (experienceSelect?.value) {
                const experience = experienceSelect.value
                if (experience === '0-2') {
                    params.append('min_experience', '0')
                    params.append('max_experience', '2')
                } else if (experience === '3-5') {
                    params.append('min_experience', '3')
                    params.append('max_experience', '5')
                } else if (experience === '6-10') {
                    params.append('min_experience', '6')
                    params.append('max_experience', '10')
                } else if (experience === '10+') {
                    params.append('min_experience', '10')
                }
            }

            // Pobierz przefiltrowanych lektorów
            const response = await api.get<any>(`/student/tutors-available?${params.toString()}`)
            const tutors = response || []

            if (tutors.length === 0) {
                tutorsList.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Nie znaleziono lektorów spełniających wybrane kryteria. Spróbuj zmienić filtry.
                        </div>
                    </div>
                `
                return
            }

            // Wyrenderuj lektorów
            const tutorsHtml = tutors.map((tutor: any) => {
                const profile = tutor.tutor_profile || {}
                const languages = profile.languages || []
                const specializations = profile.specializations || []
                
                return `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card tutor-card h-100">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="tutor-avatar">
                                        <i class="bi bi-person-circle fs-1"></i>
                                    </div>
                                    <div class="ms-3">
                                        <h5 class="card-title mb-0">${tutor.name}</h5>
                                        <p class="text-muted mb-0">
                                            <i class="bi bi-geo-alt me-1"></i>${tutor.city || 'Brak lokalizacji'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="mb-2">
                                        <small class="text-muted">Języki:</small>
                                        <div>
                                            ${languages.length > 0 
                                                ? languages.map((lang: string) => `<span class="badge bg-primary me-1">${this.getLanguageName(lang)}</span>`).join('')
                                                : '<span class="text-muted">Brak</span>'
                                            }
                                        </div>
                                    </div>
                                    
                                    <div class="mb-2">
                                        <small class="text-muted">Doświadczenie:</small>
                                        <div>
                                            <strong>${profile.years_experience || 0}</strong> ${this.getYearsLabel(profile.years_experience || 0)}
                                        </div>
                                    </div>
                                    
                                    ${specializations.length > 0 ? `
                                        <div class="mb-2">
                                            <small class="text-muted">Specjalizacje:</small>
                                            <div>
                                                ${specializations.map((spec: string) => `<span class="badge bg-info me-1">${this.getSpecializationName(spec)}</span>`).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <button class="btn btn-sm btn-outline-primary" data-tutor-id="${tutor.id}" data-action="view-profile">
                                        <i class="bi bi-person me-1"></i>Zobacz profil
                                    </button>
                                    <button class="btn btn-sm btn-primary" data-tutor-id="${tutor.id}" data-action="book-lesson">
                                        <i class="bi bi-calendar-check me-1"></i>Sprawdź terminy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            }).join('')

            tutorsList.innerHTML = tutorsHtml
            
            // Re-attach event listeners for the new buttons
            this.attachTutorButtonListeners()

        } catch (error) {
            console.error('Failed to filter tutors:', error)
            tutorsList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Błąd podczas filtrowania lektorów. Spróbuj ponownie później.
                    </div>
                </div>
            `
        }
    }

    private async resetFilters(): Promise<void> {
        // Resetuj wartości filtrów
        const languageSelect = document.getElementById('filter-language') as HTMLSelectElement
        const experienceSelect = document.getElementById('filter-experience') as HTMLSelectElement
        const specializationSelect = document.getElementById('filter-specialization') as HTMLSelectElement
        
        if (languageSelect) languageSelect.value = ''
        if (experienceSelect) experienceSelect.value = ''
        if (specializationSelect) specializationSelect.value = ''
        
        // Załaduj ponownie wszystkich lektorów
        await this.filterTutors()
    }
    
    private async getTutorProfileContent(tutorId: string): Promise<string> {
        try {
            const response = await api.get<any>(`/student/tutor/${tutorId}`)
            const tutor = response
            const profile = tutor.tutorProfile || {}
            
            return `
                <div class="student-content-area">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="#" onclick="document.querySelector('[data-section=rezerwuj]').click(); return false;">Rezerwuj lekcję</a></li>
                            <li class="breadcrumb-item active">Profil lektora</li>
                        </ol>
                    </nav>

                    <div class="row">
                        <div class="col-lg-4 mb-4">
                            <div class="card">
                                <div class="card-body text-center">
                                    <div class="avatar-placeholder mb-3" style="width: 150px; height: 150px; margin: 0 auto; background: #e9ecef; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #6c757d;">
                                        <i class="bi bi-person-circle"></i>
                                    </div>
                                    <h3 class="card-title">${tutor.name}</h3>
                                    <p class="text-muted">${tutor.city || 'Miasto nieznane'}</p>
                                    
                                    <div class="mb-3">
                                        ${profile.is_accepting_students 
                                            ? '<span class="badge bg-success">Przyjmuje studentów</span>'
                                            : '<span class="badge bg-secondary">Nie przyjmuje studentów</span>'
                                        }
                                        ${profile.is_verified 
                                            ? '<span class="badge bg-primary ms-1">Zweryfikowany</span>'
                                            : ''
                                        }
                                    </div>
                                    
                                    <button class="btn btn-primary btn-lg w-100" data-tutor-id="${tutorId}" data-action="book-lesson">
                                        <i class="bi bi-calendar-check me-2"></i>Sprawdź terminy
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-8">
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">O mnie</h4>
                                    <p class="card-text">${profile.description || 'Brak opisu'}</p>
                                </div>
                            </div>
                            
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">Języki nauczania</h4>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${(profile.languages || []).map((lang: string) => 
                                            `<span class="badge bg-primary fs-6">${this.getLanguageName(lang)}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">Specjalizacje</h4>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${(profile.specializations || []).map((spec: string) => 
                                            `<span class="badge bg-info fs-6">${this.getSpecializationName(spec)}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Error loading tutor profile:', error)
            return `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować profilu lektora.</p>
                    <hr>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-section=rezerwuj]').click()">Wróć do listy lektorów</button>
                </div>
            `
        }
    }
    
    private async getTutorBookingContent(tutorId: string): Promise<string> {
        try {
            const response = await api.get<any>(`/student/tutor/${tutorId}`)
            const tutor = response
            
            return `
                <div class="student-content-area">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="#" onclick="document.querySelector('[data-section=rezerwuj]').click(); return false;">Rezerwuj lekcję</a></li>
                            <li class="breadcrumb-item active">Sprawdź terminy</li>
                        </ol>
                    </nav>

                    <div class="row">
                        <div class="col-lg-8">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h4 class="mb-0">Dostępne terminy - ${tutor.name}</h4>
                                </div>
                                <div class="card-body">
                                    <div class="alert alert-info">
                                        <i class="bi bi-info-circle me-2"></i>
                                        Wybierz datę, aby zobaczyć dostępne terminy lekcji.
                                    </div>
                                    
                                    <div class="text-center py-5">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Ładowanie...</span>
                                        </div>
                                        <p class="mt-2">Funkcja rezerwacji jest obecnie w fazie rozwoju.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Podsumowanie</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label class="text-muted small">Lektor</label>
                                        <p class="mb-0 fw-bold">${tutor.name}</p>
                                    </div>
                                    
                                    <div class="alert alert-warning">
                                        <small>
                                            <i class="bi bi-exclamation-triangle me-1"></i>
                                            Funkcja rezerwacji jest obecnie w fazie rozwoju.
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Error loading booking page:', error)
            return `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować strony rezerwacji.</p>
                    <hr>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-section=rezerwuj]').click()">Wróć do listy lektorów</button>
                </div>
            `
        }
    }
}