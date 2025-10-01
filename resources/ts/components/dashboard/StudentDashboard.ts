import { authService } from '@services/AuthService'
import { studentService } from '@services/StudentService'
import { StudentLessons } from './student/StudentLessons'
import { StudentBooking } from './student/StudentBooking'
import { StudentTutors } from './student/StudentTutors'
import { StudentMaterials } from './student/StudentMaterials'
import { LessonDetailsModal } from '../modals/LessonDetailsModal'
import { AvatarHelper } from '@/utils/AvatarHelper'
import type { RouteComponent } from '@router/routes'

export class StudentDashboard implements RouteComponent {
    private dashboardContainer: HTMLElement | null = null
    private isLoadingStats: boolean = false
    private studentLessons: StudentLessons
    private studentBooking: StudentBooking
    private studentTutors: StudentTutors
    private studentMaterials: StudentMaterials

    constructor() {
        this.studentLessons = new StudentLessons()
        this.studentBooking = new StudentBooking()
        this.studentTutors = new StudentTutors()
        this.studentMaterials = new StudentMaterials()
        
        // Make StudentLessons available globally for onclick handlers
        ;(window as any).StudentLessons = StudentLessons
        
        // Make StudentMaterials available globally
        ;(window as any).StudentMaterials = StudentMaterials
        
        // Make LessonDetailsModal available globally
        ;(window as any).LessonDetailsModal = LessonDetailsModal
        
        // Make this dashboard instance available globally
        ;(window as any).studentDashboard = this
    }

    public async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        container.className = 'student-dashboard-container'
        this.dashboardContainer = container
        
        await this.renderContent()
        
        return container
    }
    
    public mount(container: HTMLElement): void {
        this.dashboardContainer = container
        this.setupEventListeners()
        
        // Read section from URL like Admin/Tutor do
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'dashboard'
        
        // Set active nav link based on URL
        this.setActiveNavLink(section)
        
        // Load initial content
        this.loadContent(section)
        
        // Handle browser back/forward like Admin/Tutor do
        window.addEventListener('popstate', this.handlePopState.bind(this))
    }

    private async renderContent(): Promise<void> {
        if (!this.dashboardContainer) return
        
        const user = authService.getUser()
        
        const avatarHtml = AvatarHelper.render({
            name: user?.name,
            avatar: user?.avatar,
            size: 'lg',
            userId: user?.id
        })
        
        this.dashboardContainer.innerHTML = `
            <div class="student-container">
                <div class="student-sidebar">
                    <div class="student-logo-dashboard">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <img src="/images/favicon-logo.png" alt="Platforma Lektorów" style="max-height: 32px;">
                            <h2 style="margin: 0; font-size: 1.2rem;">Platforma Lektorów</h2>
                        </div>
                        <p style="color: #666; font-size: 0.875rem; margin: 0;">Panel studenta</p>
                    </div>
                    <nav class="student-nav">
                        <ul class="student-nav-menu">
                            <li class="student-nav-item">
                                <a href="?section=dashboard" class="student-nav-link active" data-section="dashboard">
                                    <span class="student-nav-icon">📊</span>
                                    Dashboard
                                </a>
                            </li>
                            <li class="student-nav-item">
                                <a href="?section=wykaz-zmian" class="student-nav-link" data-section="wykaz-zmian">
                                    <span class="student-nav-icon">📋</span>
                                    Wykaz zmian
                                </a>
                            </li>
                        </ul>
                        <div class="student-nav-section">Moje Lekcje</div>
                        <ul class="student-nav-menu">
                            <li class="student-nav-item">
                                <a href="?section=nadchodzace" class="student-nav-link" data-section="nadchodzace">
                                    <span class="student-nav-icon">📅</span>
                                    Nadchodzące lekcje
                                </a>
                            </li>
                            <li class="student-nav-item">
                                <a href="?section=rezerwuj" class="student-nav-link" data-section="rezerwuj">
                                    <span class="student-nav-icon">➕</span>
                                    Zarezerwuj lekcję
                                </a>
                            </li>
                            <li class="student-nav-item">
                                <a href="?section=materialy" class="student-nav-link" data-section="materialy">
                                    <span class="student-nav-icon">📚</span>
                                    Materiały
                                </a>
                            </li>
                            <li class="student-nav-item">
                                <a href="?section=ksiazki" class="student-nav-link" data-section="ksiazki">
                                    <span class="student-nav-icon">📖</span>
                                    Książki
                                </a>
                            </li>
                            <li class="student-nav-item">
                                <a href="?section=historia" class="student-nav-link" data-section="historia">
                                    <span class="student-nav-icon">🕐</span>
                                    Historia lekcji
                                </a>
                            </li>
                        </ul>
                        <div class="student-nav-section">Mój Profil</div>
                        <ul class="student-nav-menu">
                            <li class="student-nav-item">
                                <a href="?section=pakiet" class="student-nav-link" data-section="pakiet">
                                    <span class="student-nav-icon">📦</span>
                                    Mój pakiet godzin
                                </a>
                            </li>
                            <li class="student-nav-item">
                                <a href="?section=profil" class="student-nav-link" data-section="profil">
                                    <span class="student-nav-icon">👤</span>
                                    Mój profil
                                </a>
                            </li>
                            <li class="student-nav-item">
                                <a href="?section=zgloszenia" class="student-nav-link" data-section="zgloszenia">
                                    <span class="student-nav-icon">🎧</span>
                                    Zgłoś sprawę
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
                
                <div class="student-main-content">
                    <div class="student-header">
                        <div>
                            <button class="student-mobile-menu-btn" id="mobile-menu-btn">☰</button>
                            <h1 class="student-page-title">Dashboard</h1>
                        </div>
                        <div class="student-user-info">
                            ${AvatarHelper.render({
                                name: user?.name || 'Student',
                                avatar: user?.avatar,
                                size: 'sm',
                                userId: user?.id
                            })}
                            <div>
                                <div style="font-weight: 600;">${user?.name || 'Student'}</div>
                                <div style="font-size: 0.75rem; color: #64748b;">${user?.email || ''}</div>
                            </div>
                            <button class="student-logout-btn" id="logoutBtn">Wyloguj</button>
                        </div>
                    </div>
                    
                    <div class="student-content-container">
                        <div class="student-content-area" id="student-content-area">
                            ${await this.getDashboardContent()}
                        </div>
                    </div>
                </div>
            </div>
        `
        
        await this.loadUserInfo()
    }

    private setupEventListeners(): void {
        // Navigation event listeners like Admin/Tutor
        const navLinks = this.dashboardContainer?.querySelectorAll('.student-nav-link')
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                // Let browser handle navigation naturally - no preventDefault()
                const section = link.getAttribute('data-section')
                if (section) {
                    // Browser will navigate to href, which will trigger URL change and proper loading
                }
            })
        })

        // Quick book lesson button
        const quickBookBtn = document.getElementById('quick-book-lesson-btn')
        if (quickBookBtn) {
            quickBookBtn.addEventListener('click', () => {
                this.navigateToSection('rezerwuj')
            })
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn')
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('app:logout'))
            })
        }

        // Handle action buttons in content area using event delegation
        const contentArea = document.getElementById('student-content-area')
        if (contentArea) {
            contentArea.addEventListener('click', (e) => {
                const target = e.target as HTMLElement
                const actionBtn = target.closest('[data-action]')
                if (actionBtn) {
                    const action = actionBtn.getAttribute('data-action')
                    if (action === 'goto-rezerwuj') {
                        this.navigateToSection('rezerwuj')
                    } else if (action === 'goto-profil') {
                        this.navigateToSection('profil')
                    } else if (action === 'goto-materialy') {
                        this.navigateToSection('materialy')
                    } else if (action === 'goto-historia') {
                        this.navigateToSection('historia')
                    } else if (action === 'goto-nadchodzace') {
                        this.navigateToSection('nadchodzace')
                    } else if (action === 'book-lesson') {
                        // Get tutor ID from button and navigate to booking
                        const tutorId = actionBtn.getAttribute('data-tutor-id')
                        if (tutorId) {
                            this.updateURL(`tutor-booking&tutor_id=${tutorId}`)
                            this.setActiveNavLink('rezerwuj')
                            this.loadContent('tutor-booking')
                        }
                    }
                }
            })
        }
    }

    private handlePopState = (event: PopStateEvent): void => {
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'dashboard'
        
        this.setActiveNavLink(section)
        this.loadContent(section)
    }

    private setActiveNavLink(section: string): void {
        const navLinks = this.dashboardContainer?.querySelectorAll('.student-nav-link')
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
        
        // Use pushState instead of replaceState for history like Admin/Tutor
        window.history.pushState({ section }, '', url.toString())
    }

    private navigateToSection(section: string): void {
        this.updateURL(section)
        this.setActiveNavLink(section)
        this.loadContent(section)
    }

    private async loadContent(section: string): Promise<void> {
        const pageTitle = document.querySelector('.student-page-title') as HTMLElement
        const contentArea = document.getElementById('student-content-area') as HTMLElement
        
        if (!contentArea || !pageTitle) return

        switch (section) {
            case 'dashboard':
                pageTitle.textContent = 'Dashboard'
                this.isLoadingStats = true
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie statystyk...</p></div>'
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
                
                // Load upcoming lessons preview after dashboard content is set
                this.loadUpcomingLessonsPreview()
                break
            case 'nadchodzace':
                pageTitle.textContent = 'Nadchodzące lekcje'
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie nadchodzących lekcji...</p></div>'
                contentArea.innerHTML = this.studentLessons.getUpcomingLessonsContent()
                break
            case 'rezerwuj':
                pageTitle.textContent = 'Zarezerwuj lekcję'
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie dostępnych lektorów...</p></div>'
                contentArea.innerHTML = await this.studentTutors.getBookLessonContent()
                this.studentTutors.setupBookingEventListeners()
                break
            case 'historia':
                pageTitle.textContent = 'Historia lekcji'
                contentArea.innerHTML = '<div class="student-loading-container"><div class="student-loading-spinner"></div><p class="student-loading-text">Ładowanie historii lekcji...</p></div>'
                contentArea.innerHTML = this.studentLessons.getLessonHistoryContent()
                break
            case 'profil':
                pageTitle.textContent = 'Mój profil'
                contentArea.innerHTML = '<div id="student-profile-edit-container"></div>'
                
                // Mount StudentProfileEdit component
                import('@/components/forms/StudentProfileEdit').then(async (module) => {
                    const profileEdit = new module.StudentProfileEdit()
                    const container = contentArea.querySelector('#student-profile-edit-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await profileEdit.render()
                        container.appendChild(element)
                        profileEdit.mount(container)
                    } else {
                        console.error('Student profile edit container not found or not HTMLElement')
                    }
                }).catch(error => {
                    console.error('Failed to load StudentProfileEdit:', error)
                    contentArea.innerHTML = '<div class="alert alert-danger">Błąd ładowania formularza profilu</div>'
                })
                break
            case 'pakiet':
                pageTitle.textContent = 'Mój pakiet godzin'
                contentArea.innerHTML = await this.getPackageContent()
                break
            case 'postepy':
                pageTitle.textContent = 'Moje postępy'
                contentArea.innerHTML = this.getProgressContent()
                break
            case 'materialy':
                pageTitle.textContent = 'Materiały'
                contentArea.innerHTML = this.getMaterialsContent()
                break
            case 'ksiazki':
                pageTitle.textContent = 'Książki'
                contentArea.innerHTML = this.getBooksContent()
                break
            case 'tutor-profile':
                pageTitle.textContent = 'Profil lektora'
                const tutorId = new URLSearchParams(window.location.search).get('tutor_id')
                if (tutorId) {
                    contentArea.innerHTML = await this.studentTutors.getTutorProfileContent(tutorId)
                }
                break
            case 'tutor-booking':
                pageTitle.textContent = 'Sprawdź terminy'
                const bookingTutorId = new URLSearchParams(window.location.search).get('tutor_id')
                if (bookingTutorId) {
                    contentArea.innerHTML = await this.studentBooking.getTutorBookingContent(bookingTutorId)
                    this.studentBooking.setupLessonBookingEvents()
                }
                break
            case 'zgloszenia':
                pageTitle.textContent = 'Zgłoś sprawę'
                contentArea.innerHTML = '<div id="issue-report-container"></div>'
                
                // Import and mount IssueReportForm
                import('@/components/support/IssueReportForm').then((module) => {
                    const issueForm = new module.IssueReportForm()
                    const container = document.getElementById('issue-report-container')
                    if (container) {
                        issueForm.mount(container)
                    }
                })
                break
            case 'wykaz-zmian':
                pageTitle.textContent = 'Wykaz zmian'
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
        }
    }

    public unmount(): void {
        window.removeEventListener('popstate', this.handlePopState)
    }

    private setupProfileForm(): void {
        const profileForm = document.getElementById('profile-form')
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                
                // Get checkbox values for learning goals
                const learningGoalsCheckboxes = document.querySelectorAll('input[id^="goal_"]:checked') as NodeListOf<HTMLInputElement>
                const learningGoals = Array.from(learningGoalsCheckboxes).map(checkbox => checkbox.value)
                
                // Get checkbox values for learning languages
                const learningLanguagesCheckboxes = document.querySelectorAll('input[id^="lang_"]:checked') as NodeListOf<HTMLInputElement>
                const learningLanguages = Array.from(learningLanguagesCheckboxes).map(checkbox => checkbox.value)
                
                const formData = {
                    name: (document.getElementById('name') as HTMLInputElement).value,
                    phone: (document.getElementById('phone') as HTMLInputElement).value,
                    city: (document.getElementById('city') as HTMLInputElement).value,
                    birth_date: (document.getElementById('birth_date') as HTMLInputElement).value,
                    country: (document.getElementById('country') as HTMLInputElement).value,
                    learning_goals: learningGoals,
                    learning_languages: learningLanguages
                }
                
                try {
                    const response = await studentService.updateProfile(formData)
                    
                    if (response.success) {
                        document.dispatchEvent(new CustomEvent('notification:show', {
                            detail: {
                                type: 'success',
                                message: 'Profil został zaktualizowany pomyślnie!',
                                duration: 3000
                            }
                        }))
                        // Odśwież dane profilu
                        this.loadContent('profil')
                    } else {
                        throw new Error(response.message || 'Błąd podczas aktualizacji profilu')
                    }
                } catch (error: any) {
                    console.error('Error updating profile:', error)
                    document.dispatchEvent(new CustomEvent('notification:show', {
                        detail: {
                            type: 'error',
                            message: error.message || 'Wystąpił błąd podczas aktualizacji profilu',
                            duration: 5000
                        }
                    }))
                }
            })
        }
    }

    private async loadUserInfo(): Promise<void> {
        try {
            const user = await studentService.getProfile()
            if (user) {
                const usernameElement = document.querySelector('.student-username') as HTMLElement
                if (usernameElement) {
                    usernameElement.textContent = user.name
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error)
        }
    }

    private getLanguageName(code: string): string {
        const languages: { [key: string]: string } = {
            'english': 'Angielski',
            'german': 'Niemiecki', 
            'french': 'Francuski',
            'spanish': 'Hiszpański',
        }
        return languages[code] || code
    }

    private async getDashboardContent(): Promise<string> {
        try {
            const stats = await studentService.getDashboardStats() || {}
            const user = authService.getUser()
            
            return `
                <div class="student-content-area">
                    <!-- Welcome Card -->
                    <div class="welcome-card">
                        <div class="welcome-content">
                            <div class="welcome-text">
                                <h2>Witaj, ${user?.name || 'Student'}! 👋</h2>
                                <p>Cieszymy się, że jesteś z nami w nauce języków. Sprawdź swoje nadchodzące lekcje i zarządzaj swoim pakietem godzin.</p>
                            </div>
                            <div class="welcome-stats">
                                <div class="stat-item">
                                    <span class="stat-number">${stats.remainingHours || 0}</span>
                                    <span class="stat-label">Pozostałe godziny</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">${stats.upcomingLessons || 0}</span>
                                    <span class="stat-label">Nadchodzące lekcje</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Student Information Section -->
                    <div class="student-info-section">
                        <h3><i class="bi bi-info-circle"></i> Ważne informacje dla studentów</h3>
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-header">
                                    <i class="bi bi-clock-history text-primary"></i>
                                    <h4>Dostępne godziny</h4>
                                </div>
                                <p>Wszystkie informacje o dostępnych do wykorzystania godzinach w ramach pakietu znajdziesz w zakładce <strong>"Mój pakiet godzin"</strong>. Sprawdzaj regularnie swój stan godzin i daty ważności pakietów.</p>
                            </div>
                            
                            <div class="info-card">
                                <div class="info-header">
                                    <i class="bi bi-calendar-plus text-success"></i>
                                    <h4>Rezerwacja lekcji</h4>
                                </div>
                                <p>W celu rezerwacji lekcji wejdź w sekcję <strong>"Zarezerwuj lekcję"</strong>, tutaj możesz przeglądać profile lektorów, możesz zapisać się na lekcję do więcej niż jednego lektora. Kiedy wybierzesz lektora kliknij <strong>"Sprawdź terminy"</strong>, otworzy się kalendarz. Klikając w kolejne dni, pod kalendarzem pokazują się godziny w których wybrany lektor jest dostępny, wybierz pasującą Ci godzinę i kliknij <strong>"Zarezerwuj lekcję"</strong>. Lekcja zostanie dodana do sekcji <strong>"Nadchodzące lekcje"</strong>.</p>
                            </div>
                            
                            <div class="info-card">
                                <div class="info-header">
                                    <i class="bi bi-camera-video text-warning"></i>
                                    <h4>Dołączenie do lekcji</h4>
                                </div>
                                <p>Na 10 minut przed planowaną lekcją, lektor otrzyma możliwość utworzenia "pokoju", kiedy tylko to zrobi zostaniesz poinformowany o tym emailem, w treści wiadomości jest przycisk z linkiem do lekcji (otwórz w przeglądarce w której jesteś zalogowany/a do platformy). Jeśli link nie działa, możesz dołączyć do lekcji wchodząc w <strong>"Nadchodzące lekcje → Akcje → Szczegóły → Dołącz do lekcji"</strong>.</p>
                            </div>
                            
                            <div class="info-card">
                                <div class="info-header">
                                    <i class="bi bi-book text-info"></i>
                                    <h4>Materiały</h4>
                                </div>
                                <p>Każdy lektor z którym masz lekcje, ma możliwość dodania materiałów do nauki. W sekcji <strong>"Materiały"</strong> znajdziesz wszystko co lektorzy dla Ciebie dodali z niezbędnymi informacjami kto i kiedy dodał materiał. Materiały mogą zawierać zadania domowe, dodatkowe ćwiczenia oraz przydatne zasoby.</p>
                            </div>
                            
                            <div class="info-card">
                                <div class="info-header">
                                    <i class="bi bi-journal-text text-secondary"></i>
                                    <h4>Nowości i aktualizacje</h4>
                                </div>
                                <p>Zachęcamy do zaglądania w zakładkę <strong>"Wykaz zmian"</strong> gdzie możecie się dowiedzieć o nowych funkcjonalnościach platformy jak i o naprawionych błędach. Regularnie dodajemy nowe funkcje które ułatwią Ci naukę języka.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Stats Grid -->
                    <div class="dashboard-section">
                        <h3>Statystyki</h3>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon" style="background: #3b82f6;">📅</div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.upcomingLessons || 0}</div>
                                <div class="stat-label">Nadchodzące lekcje</div>
                                <div class="stat-sublabel">Zaplanowane na najbliższy czas</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon" style="background: #10b981;">✅</div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.completedLessons || 0}</div>
                                <div class="stat-label">Zakończone lekcje</div>
                                <div class="stat-sublabel">Łącznie od początku</div>
                            </div>
                        </div>
                        
                        <!--
                        <div class="stat-card">
                            <div class="stat-icon" style="background: #e91e63;">📦</div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.remainingHours || 0}</div>
                                <div class="stat-label">Pozostałe godziny</div>
                                <div class="stat-sublabel">W aktywnych pakietach</div>
                            </div>
                        </div>
                        -->
                        
                        <div class="stat-card">
                            <div class="stat-icon" style="background: #f59e0b;">👨‍🏫</div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.activeTutors || 0}</div>
                                <div class="stat-label">Aktywni lektorzy</div>
                                <div class="stat-sublabel">Z którymi masz lekcje</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h3>Zarządzanie</h3>
                    </div>
                    <div class="row mt-4">
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h5>Nadchodzące lekcje</h5>
                                </div>
                                <div class="card-body">
                                    <div id="upcoming-lessons-preview">
                                        <div class="text-center py-3">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Ładowanie...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5>Szybkie akcje</h5>
                                </div>
                                <div class="card-body">
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-primary" data-action="goto-rezerwuj">
                                            <i class="bi bi-plus-circle me-2"></i>Zarezerwuj lekcję
                                        </button>
                                        <button class="btn btn-outline-primary" data-action="goto-profil">
                                            <i class="bi bi-person me-2"></i>Edytuj profil
                                        </button>
                                        <button class="btn btn-outline-secondary" data-action="goto-materialy">
                                            <i class="bi bi-book me-2"></i>Materiały
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Error loading dashboard stats:', error)
            return this.getDashboardErrorContent()
        }
    }

    private getDashboardErrorContent(): string {
        return `
            <div class="student-content-area">
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować statystyk panelu głównego.</p>
                    <hr>
                    <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
                </div>
            </div>
        `
    }

    private async getProfileContent(): Promise<string> {
        try {
            const user = await studentService.getProfile()
            const profile = user?.student_profile || {}
            
            return `
                <div class="student-content-area">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-body text-center">
                                    <div class="avatar-placeholder mb-3" style="width: 120px; height: 120px; margin: 0 auto; background: #e9ecef; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #6c757d;">
                                        <i class="bi bi-person-circle"></i>
                                    </div>
                                    <h4>${user?.name || 'Użytkownik'}</h4>
                                    <p class="text-muted">${user?.email || ''}</p>
                                    <p class="text-muted">${user?.city || 'Miasto nieznane'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h5>Informacje podstawowe</h5>
                                </div>
                                <div class="card-body">
                                    <form id="profile-form">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="name" class="form-label">Imię i nazwisko</label>
                                                    <input type="text" class="form-control" id="name" value="${user?.name || ''}">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="email" class="form-label">Email</label>
                                                    <input type="email" class="form-control" id="email" value="${user?.email || ''}" readonly>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="phone" class="form-label">Telefon</label>
                                                    <input type="tel" class="form-control" id="phone" value="${user?.phone || ''}">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="city" class="form-label">Miasto</label>
                                                    <input type="text" class="form-control" id="city" value="${user?.city || ''}">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="birth_date" class="form-label">Data urodzenia</label>
                                                    <input type="date" class="form-control" id="birth_date" value="${user?.birth_date || ''}">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="country" class="form-label">Kraj</label>
                                                    <input type="text" class="form-control" id="country" value="${user?.country || ''}">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="mb-4">
                                                    <h5>Preferencje nauki</h5>
                                                    <div class="row">
                                                        <div class="col-md-6">
                                                            <div class="card">
                                                                <div class="card-header">
                                                                    <h6 class="mb-0">Języki do nauki</h6>
                                                                </div>
                                                                <div class="card-body">
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="english" id="lang_english" ${profile?.learning_languages?.includes('english') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="lang_english">Angielski</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="german" id="lang_german" ${profile?.learning_languages?.includes('german') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="lang_german">Niemiecki</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="french" id="lang_french" ${profile?.learning_languages?.includes('french') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="lang_french">Francuski</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="spanish" id="lang_spanish" ${profile?.learning_languages?.includes('spanish') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="lang_spanish">Hiszpański</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="card">
                                                                <div class="card-header">
                                                                    <h6 class="mb-0">Cele nauki</h6>
                                                                </div>
                                                                <div class="card-body">
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="conversation" id="goal_conversation" ${profile?.learning_goals?.includes('conversation') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_conversation">Konwersacje</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="business" id="goal_business" ${profile?.learning_goals?.includes('business') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_business">Język biznesowy</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="exam" id="goal_exam" ${profile?.learning_goals?.includes('exam') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_exam">Przygotowanie do egzaminów</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="travel" id="goal_travel" ${profile?.learning_goals?.includes('travel') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_travel">Podróże</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="academic" id="goal_academic" ${profile?.learning_goals?.includes('academic') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_academic">Język akademicki</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="hobby" id="goal_hobby" ${profile?.learning_goals?.includes('hobby') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_hobby">Hobby</label>
                                                                    </div>
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="culture" id="goal_culture" ${profile?.learning_goals?.includes('culture') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_culture">Kultura</label>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" value="career" id="goal_career" ${profile?.learning_goals?.includes('career') ? 'checked' : ''}>
                                                                        <label class="form-check-label" for="goal_career">Rozwój kariery</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Current Language Levels 
                                        ${profile?.current_levels && Object.keys(profile.current_levels).length > 0 ? `
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <div class="card">
                                                        <div class="card-header">
                                                            <h6 class="mb-0">Obecne poziomy</h6>
                                                        </div>
                                                        <div class="card-body">
                                                            <div class="row">
                                                                ${Object.entries(profile.current_levels).map(([lang, level]) => `
                                                                    <div class="col-md-4 mb-2">
                                                                        <div class="d-flex justify-content-between align-items-center">
                                                                            <span class="fw-bold">${this.getLanguageName(lang)}:</span>
                                                                            <span class="badge bg-primary">${level}</span>
                                                                        </div>
                                                                    </div>
                                                                `).join('')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        ` : ''}
                                        -->
                                        
                                        <button type="submit" class="btn btn-primary">Zapisz zmiany</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Error loading profile:', error)
            return `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować profilu.</p>
                </div>
            `
        }
    }

    private async getPackageContent(): Promise<string> {
        try {
            const profile = await studentService.getProfile()
            const packages = (profile as any)?.active_package_assignments || []
            
            if (packages.length === 0) {
                return `
                    <div class="student-content-area">
                        <div class="text-center py-5">
                            <div class="mb-3">
                                <i class="bi bi-box" style="font-size: 3rem; color: #6c757d;"></i>
                            </div>
                            <h5>Brak aktywnych pakietów</h5>
                            <p class="text-muted">Nie masz obecnie żadnych aktywnych pakietów godzin.</p>
                        </div>
                    </div>
                `
            }
            
            const packagesHtml = packages.map((pkg: any) => `
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${pkg.package.name}</h5>
                            <p class="card-text">${pkg.package.description || ''}</p>
                            <div class="row">
                                <div class="col-6">
                                    <div class="text-center">
                                        <h4 class="text-primary">${pkg.hours_remaining}</h4>
                                        <small class="text-muted">Pozostałe godziny</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center">
                                        <h4 class="text-info">${pkg.package.hours_count}</h4>
                                        <small class="text-muted">Łączne godziny</small>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: ${(pkg.hours_remaining / pkg.package.hours_count) * 100}%"></div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <small class="text-muted">Ważny do: ${new Date(pkg.expires_at).toLocaleDateString('pl-PL')}</small>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted">Przypisany: ${new Date(pkg.assigned_at).toLocaleDateString('pl-PL')}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')
            
            return `
                <div class="student-content-area">
                    <div class="row">
                        ${packagesHtml}
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Error loading packages:', error)
            return `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować pakietów.</p>
                </div>
            `
        }
    }

    private getProgressContent(): string {
        return `
            <div class="student-content-area">
                <h2>Moje postępy</h2>
                <p>Twoje postępy w nauce będą dostępne wkrótce.</p>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Statystyki nauki</h5>
                                <p class="card-text">Funkcja w przygotowaniu...</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Cele nauki</h5>
                                <p class="card-text">Funkcja w przygotowaniu...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private getMaterialsContent(): string {
        return this.studentMaterials.getMaterialsContent()
    }

    private getBooksContent(): string {
        return `
            <div class="student-content-area">
                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2>Książki do nauki języków</h2>
                            <small class="text-muted">Materiały w formacie PDF do pobrania</small>
                        </div>
                    </div>
                </div>

                <!-- English Section -->
                <div class="row mb-5">
                    <div class="col-12">
                        <h3 class="mb-3">🇬🇧 Angielski</h3>
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom A1</h5>
                                        <p class="card-text">Podstawy języka angielskiego</p>
                                        <a href="/books/angielski_a1.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom A2</h5>
                                        <p class="card-text">Podstawowy angielski</p>
                                        <a href="/books/angielski_a2.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom B1</h5>
                                        <p class="card-text">Średniozaawansowany angielski</p>
                                        <a href="/books/angielski_b1.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom B2</h5>
                                        <p class="card-text">Zaawansowany angielski</p>
                                        <a href="/books/angielski_b2.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Spanish Section -->
                <div class="row mb-5">
                    <div class="col-12">
                        <h3 class="mb-3">🇪🇸 Hiszpański</h3>
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom A1</h5>
                                        <p class="card-text">Podstawy języka hiszpańskiego</p>
                                        <a href="/books/hiszpanski_a1.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom A2</h5>
                                        <p class="card-text">Podstawowy hiszpański</p>
                                        <a href="/books/hiszpanski_a2.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom A3</h5>
                                        <p class="card-text">Rozszerzony podstawowy hiszpański</p>
                                        <a href="/books/hiszpanski_a3.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom B1</h5>
                                        <p class="card-text">Średniozaawansowany hiszpański</p>
                                        <a href="/books/hiszpanski_b1.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- German Section -->
                <div class="row mb-5">
                    <div class="col-12">
                        <h3 class="mb-3">🇩🇪 Niemiecki</h3>
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom A1</h5>
                                        <p class="card-text">Podstawy języka niemieckiego</p>
                                        <a href="/books/niemiecki_a1.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom A2</h5>
                                        <p class="card-text">Podstawowy niemiecki</p>
                                        <a href="/books/niemiecki_a2.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom B1</h5>
                                        <p class="card-text">Średniozaawansowany niemiecki</p>
                                        <a href="/books/niemiecki_b1.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="mb-3">
                                            <i class="bi bi-file-pdf" style="font-size: 3rem; color: #dc3545;"></i>
                                        </div>
                                        <h5 class="card-title">Poziom B2</h5>
                                        <p class="card-text">Zaawansowany niemiecki</p>
                                        <a href="/books/niemiecki_b2.pdf" class="btn btn-primary" download>
                                            <i class="bi bi-download me-2"></i>Pobierz PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Informacja:</strong> Te materiały są dostępne do pobrania i używania w celach edukacyjnych.
                            Każdy plik zawiera program nauki dla danego poziomu językowego.
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private async loadUpcomingLessonsPreview(): Promise<void> {
        const previewContainer = document.getElementById('upcoming-lessons-preview')
        if (!previewContainer) return

        try {
            // Use studentLessons component to get preview content
            const previewContent = await this.studentLessons.getUpcomingLessonsPreview()
            previewContainer.innerHTML = previewContent
        } catch (error) {
            console.error('Error loading upcoming lessons preview:', error)
            previewContainer.innerHTML = `
                <div class="text-center py-3 text-muted">
                    <p>Nie udało się załadować nadchodzących lekcji</p>
                </div>
            `
        }
    }

}