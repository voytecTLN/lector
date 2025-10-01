// resources/ts/components/dashboard/TutorDashboard.ts
import type {RouteComponent} from '@router/routes'
import {authService} from '@services/AuthService'
import {TutorProfileEdit} from '@components/forms/TutorProfileEdit'
import {HourlyAvailabilityCalendar} from '@components/tutor/HourlyAvailabilityCalendar'
import {TutorLessons} from './tutor/TutorLessons'
import {TutorStudents} from './tutor/TutorStudents'
import {TutorLessonHistory} from './tutor/TutorLessonHistory'
import {LessonDetailsModal} from '../modals/LessonDetailsModal'
import {AvatarHelper} from '@/utils/AvatarHelper'
import {ROUTES} from '@/config/routing'

// Global state to prevent router interference
let globalCurrentSection: string = 'dashboard'
let hasEverMounted: boolean = false

export class TutorDashboard implements RouteComponent {
    private currentSection: string = 'dashboard'
    private sidebarOpen: boolean = false
    private container: HTMLElement | null = null
    private refreshInterval: number | null = null
    private profileComponent: TutorProfileEdit | null = null
    private availabilityComponent: HourlyAvailabilityCalendar | null = null
    private lessonHistoryComponent: TutorLessonHistory | null = null
    private isLoadingSection: boolean = false
    private loadingPromise: Promise<void> | null = null
    private lastLoadTime: number = 0
    private loadDebounceMs: number = 100
    private renderedElement: HTMLElement | null = null

    constructor() {
    }

    async render(): Promise<HTMLElement> {
        // Return cached element if already rendered (singleton pattern)
        if (this.renderedElement) {
            return this.renderedElement
        }
        
        const user = authService.getUser()
        const el = document.createElement('div')
        el.className = 'tutor-container'
        
        const avatarHtml = AvatarHelper.render({
            name: user?.name,
            avatar: user?.avatar,
            size: 'lg',
            userId: user?.id
        })
        
        el.innerHTML = `
            <aside class="tutor-sidebar" id="tutorSidebar">
                <div class="tutor-logo-dashboard">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <img src="/images/favicon-logo.png" alt="Platforma Lektorów" style="max-height: 32px;">
                        <h2 style="margin: 0; font-size: 1.2rem;">Platforma Lektorów</h2>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.875rem; margin: 0;">Panel Lektora</p>
                </div>
                
                <nav>
                    <ul class="tutor-nav-menu">
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard" class="tutor-nav-link active" data-section="dashboard">
                                <span class="tutor-nav-icon">🏠</span>
                                <span>Dashboard</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=wykaz-zmian" class="tutor-nav-link" data-section="wykaz-zmian">
                                <span class="tutor-nav-icon">📋</span>
                                <span>Wykaz zmian</span>
                            </a>
                        </li>
                        
                        <li class="tutor-nav-section">ZARZĄDZANIE</li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=availability" class="tutor-nav-link" data-section="availability">
                                <span class="tutor-nav-icon">🕐</span>
                                <span>Dostępność</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=calendar" class="tutor-nav-link" data-section="calendar">
                                <span class="tutor-nav-icon">📅</span>
                                <span>Kalendarz</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=nadchodzace" class="tutor-nav-link" data-section="nadchodzace">
                                <span class="tutor-nav-icon">🎯</span>
                                <span>Nadchodzące lekcje</span>
                            </a>
                        </li>
                        
                        <li class="tutor-nav-section">STUDENCI</li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=students" class="tutor-nav-link" data-section="students">
                                <span class="tutor-nav-icon">👥</span>
                                <span>Moi studenci</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=historia" class="tutor-nav-link" data-section="historia">
                                <span class="tutor-nav-icon">📚</span>
                                <span>Historia lekcji</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=ksiazki" class="tutor-nav-link" data-section="ksiazki">
                                <span class="tutor-nav-icon">📖</span>
                                <span>Książki</span>
                            </a>
                        </li>
                        
                        <li class="tutor-nav-section">KONTO</li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=profile" class="tutor-nav-link" data-section="profile">
                                <span class="tutor-nav-icon">👤</span>
                                <span>Mój profil</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#/tutor/dashboard?section=zgloszenia" class="tutor-nav-link" data-section="zgloszenia">
                                <span class="tutor-nav-icon">🎧</span>
                                <span>Zgłoś sprawę</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>
            
            <main class="tutor-main-content">
                <header class="tutor-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button class="tutor-mobile-menu-btn" id="tutorMobileMenuBtn">☰</button>
                        <h1 id="sectionTitle">Dashboard</h1>
                    </div>
                    <div class="tutor-user-info">
                        ${AvatarHelper.render({
                            name: user?.name || 'Lektor',
                            avatar: user?.avatar,
                            size: 'sm',
                            userId: user?.id
                        })}
                        <div>
                            <div style="font-weight: 600;">${user?.name || 'Lektor'}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">${user?.email || ''}</div>
                        </div>
                        <button class="tutor-logout-btn" id="logoutBtn">Wyloguj</button>
                    </div>
                </header>
                
                <div id="tutorContent" class="tutor-content">
                    <!-- Dynamic content will be loaded here -->
                </div>
            </main>
        `
        
        // Cache the rendered element for singleton pattern
        this.renderedElement = el
        return el
    }

    mount(container: HTMLElement): void {
        
        // Always read URL section to support Ctrl+R and direct navigation
        let section = 'dashboard'
        const regularParams = new URLSearchParams(window.location.search)
        if (regularParams.has('section')) {
            section = regularParams.get('section') || 'dashboard'
        } else if (window.location.hash && window.location.hash.includes('?')) {
            const hashParts = window.location.hash.split('?')
            if (hashParts.length > 1) {
                const hashParams = new URLSearchParams('?' + hashParts[1])
                section = hashParams.get('section') || 'dashboard'
            }
        }
        
        
        // If already mounted with the same container, only update section if it changed
        if (this.container === container) {
            if (this.currentSection !== section) {
                this.currentSection = section
                globalCurrentSection = section
                this.updateActiveNavLink()
                this.loadSectionContent()
            } else {
            }
            return
        }
        
        this.container = container
        this.setupEventListeners()
        
        // Update current section from URL
        this.currentSection = section
        globalCurrentSection = section
        hasEverMounted = true
        
        this.updateActiveNavLink()
        this.loadSectionContent()
        
        // Make LessonDetailsModal available globally for onclick handlers
        ;(window as any).LessonDetailsModal = LessonDetailsModal
        
        // Set up auto-refresh for dashboard stats (only once)
        if (!this.refreshInterval) {
            this.refreshInterval = window.setInterval(() => {
                if (this.currentSection === 'dashboard') {
                    this.loadDashboardContent()
                }
            }, 60000) // Refresh every minute
        }
    }

    unmount(): void {
        
        // DO NOT unmount anything when using singleton pattern
        // The router should skip calling unmount for the same component instance
        // If this is still being called, it means the router fix isn't working
        return
        
        // Original unmount logic commented out to prevent destruction
        /*
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval)
        }
        
        if (this.profileComponent) {
            this.profileComponent.unmount()
            this.profileComponent = null
        }
        if (this.availabilityComponent) {
            this.availabilityComponent.unmount()
            this.availabilityComponent = null
        }
        */
    }

    private setupEventListeners(): void {
        // Mobile menu toggle
        const mobileMenuBtn = this.container?.querySelector('#tutorMobileMenuBtn')
        mobileMenuBtn?.addEventListener('click', () => {
            this.toggleSidebar()
        })
        
        // Logout
        const logoutBtn = this.container?.querySelector('#logoutBtn')
        logoutBtn?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('app:logout'))
        })
    }


    private toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen
        const sidebar = this.container?.querySelector('#tutorSidebar')
        if (sidebar) {
            sidebar.classList.toggle('open', this.sidebarOpen)
        }
    }


    private updateActiveNavLink(): void {
        const navLinks = this.container?.querySelectorAll('.tutor-nav-link')
        navLinks?.forEach(link => {
            const linkSection = (link as HTMLElement).dataset.section
            link.classList.toggle('active', linkSection === this.currentSection)
        })
    }

    private loadSectionContent(): void {
        // Debounce rapid calls
        const now = Date.now()
        if (now - this.lastLoadTime < this.loadDebounceMs) {
            return
        }
        this.lastLoadTime = now
        
        // Prevent concurrent loads
        if (this.isLoadingSection) {
            return
        }
        
        const contentDiv = this.container?.querySelector('#tutorContent')
        const titleEl = this.container?.querySelector('#sectionTitle')
        
        if (!contentDiv) return
        
        this.isLoadingSection = true
        
        // Clean up previous components
        if (this.profileComponent) {
            this.profileComponent.unmount()
            this.profileComponent = null
        }
        if (this.availabilityComponent) {
            this.availabilityComponent.unmount()
            this.availabilityComponent = null
        }
        if (this.lessonHistoryComponent) {
            this.lessonHistoryComponent = null
        }
        
        switch (this.currentSection) {
            case 'dashboard':
                if (titleEl) titleEl.textContent = 'Dashboard'
                this.loadingPromise = this.loadDashboardContent().finally(() => {
                    this.isLoadingSection = false
                    this.loadingPromise = null
                })
                return
            case 'availability':
                if (titleEl) titleEl.textContent = 'Dostępność'
                this.loadAvailabilityContent()
                break
            case 'calendar':
                if (titleEl) titleEl.textContent = 'Kalendarz'
                this.loadCalendarContent()
                break
            case 'nadchodzace':
                if (titleEl) titleEl.textContent = 'Nadchodzące lekcje'
                this.loadUpcomingLessonsContent()
                break
            case 'students':
                if (titleEl) titleEl.textContent = 'Moi studenci'
                this.loadStudentsContent()
                break
            case 'historia':
                if (titleEl) titleEl.textContent = 'Historia lekcji'
                this.loadLessonHistoryContent()
                break
            case 'ksiazki':
                if (titleEl) titleEl.textContent = 'Książki'
                this.loadBooksContent()
                break
            case 'profile':
                if (titleEl) titleEl.textContent = 'Mój profil'
                this.loadingPromise = this.loadProfileContent().finally(() => {
                    this.isLoadingSection = false
                    this.loadingPromise = null
                })
                return // Don't reset flag here, wait for async completion
            case 'zgloszenia':
                if (titleEl) titleEl.textContent = 'Zgłoś sprawę'
                this.loadingPromise = this.loadIssueReportContent().finally(() => {
                    this.isLoadingSection = false
                    this.loadingPromise = null
                })
                return
            case 'wykaz-zmian':
                if (titleEl) titleEl.textContent = 'Wykaz zmian'
                this.loadingPromise = this.loadChangelogContent().finally(() => {
                    this.isLoadingSection = false
                    this.loadingPromise = null
                })
                return
            default:
                // Load dashboard content for unknown sections
                if (titleEl) titleEl.textContent = 'Dashboard'
                this.loadingPromise = this.loadDashboardContent().finally(() => {
                    this.isLoadingSection = false
                    this.loadingPromise = null
                })
                return
        }
        
        // Reset loading flag for synchronous sections (async sections return early)
        this.isLoadingSection = false
    }

    private async loadDashboardContent(): Promise<void> {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) {
            console.error('❌ No content div found for dashboard')
            return
        }
        
        const user = authService.getUser()
        
        // Show loading state
        contentDiv.innerHTML = `
            <div class="tutor-loading-container">
                <div class="tutor-loading-spinner"></div>
                <div class="tutor-loading-text">Ładowanie danych...</div>
            </div>
        `
        
        try {
            // Fetch dashboard stats
            const response = await fetch('/api/tutor/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Accept': 'application/json'
                }
            })
            
            const stats = await response.json()
            
            contentDiv.innerHTML = `
                <div class="welcome-card">
                    <h2>Witaj, ${user?.name || 'Lektorze'}! 👋</h2>
                    <p>Miło Cię znowu widzieć. Oto przegląd Twojej aktywności.</p>
                    <div class="refresh-info">
                        <small class="text-muted">
                            <i class="bi bi-arrow-clockwise"></i> 
                            Dane aktualizowane automatycznie co minutę
                        </small>
                    </div>
                </div>
                
                <div class="tutor-info-section">
                    <h3><i class="bi bi-info-circle"></i> Ważne informacje dla lektorów</h3>
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-header">
                                <i class="bi bi-eye text-primary"></i>
                                <h4>Podgląd profilu</h4>
                            </div>
                            <p>Na stronie <strong>"Mój profil"</strong> obok przycisku "Zapisz zmiany" jest nowy przycisk <strong>"Podgląd profilu"</strong> dzięki któremu możesz zweryfikować jak widzą Cię uczniowie.</p>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-header">
                                <i class="bi bi-calendar-check text-success"></i>
                                <h4>Powiadomienia o rezerwacjach</h4>
                            </div>
                            <p>Kiedy student zarezerwuje u Ciebie lekcję zostaniesz o tym poinformowany <strong>emailem</strong>. Lekcja zostanie dodana w sekcji <strong>"Kalendarz"</strong> kliknięcie w <i class="bi bi-eye"></i> otwiera szczegóły lekcji oraz <strong>"Nadchodzące lekcje"</strong> kliknięcie w lekcję otwiera szczegóły lekcji.</p>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-header">
                                <i class="bi bi-camera-video text-warning"></i>
                                <h4>Rozpoczynanie lekcji</h4>
                            </div>
                            <p><strong>10 minut przed lekcją w szczegółach lekcji</strong> pojawi się przycisk "Rozpocznij spotkanie". Po kliknięciu sprawdź mikrofon/kamerę, kliknij "Dołącz" i czekaj na ucznia. Dostępny jest chat. Jeśli przypadkiem opuścisz lekcję, możesz do niej wrócić. "Zakończ spotkanie" definitywnie zamyka pokój i zmienia status lekcji na "Zakończona".</p>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-header">
                                <i class="bi bi-people text-info"></i>
                                <h4>Moi studenci</h4>
                            </div>
                            <p>Każdy student który zarezerwuje u Ciebie lekcję pojawi się w zakładce <strong>"Moi studenci"</strong>. Możesz zobaczyć profil ucznia, historię lekcji oraz przesyłać materiały do nauki <strong>"Akcje → Materiały → Wybierz plik"</strong>.</p>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-header">
                                <i class="bi bi-journal-text text-secondary"></i>
                                <h4>Wykaz zmian</h4>
                            </div>
                            <p>Zachęcamy do zaglądania w zakładkę <strong>"Wykaz zmian"</strong> gdzie możesz się dowiedzieć o nowych funkcjonalnościach platformy oraz naprawionych błędach.</p>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <h3>Statystyki</h3>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #3b82f6;">📚</div>
                        <div class="stat-content">
                            <div class="stat-number" id="upcomingLessons">${stats.data?.upcomingLessons || 0}</div>
                            <div class="stat-label">Nadchodzące lekcje</div>
                            <div class="stat-sublabel">Zaplanowane na najbliższy czas</div>
                        </div>
                        <div class="stat-trend">
                            <span class="trend-text">W tym tygodniu: ${stats.data?.thisWeekLessons || 0}</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #10b981;">✅</div>
                        <div class="stat-content">
                            <div class="stat-number" id="completedLessons">${stats.data?.completedLessons || 0}</div>
                            <div class="stat-label">Ukończone lekcje</div>
                            <div class="stat-sublabel">Łącznie od początku</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #e91e63;">👥</div>
                        <div class="stat-content">
                            <div class="stat-number" id="activeStudents">${stats.data?.activeStudents || 0}</div>
                            <div class="stat-label">Aktywni studenci</div>
                            <div class="stat-sublabel">Uczniowie z lekcjami</div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-row">
                    <div class="dashboard-section">
                        <h3>Szybkie akcje</h3>
                        <div class="tutor-quick-actions">
                            <div class="tutor-action-card">
                                <div class="tutor-action-icon" style="background: #3b82f6;">🕐</div>
                                <h4>Ustaw dostępność</h4>
                                <p>Zarządzaj swoim kalendarzem</p>
                                <button class="tutor-action-btn" onclick="window.location.href='?section=availability'">Przejdź</button>
                            </div>
                            <div class="tutor-action-card">
                                <div class="tutor-action-icon" style="background: #10b981;">📅</div>
                                <h4>Zobacz kalendarz</h4>
                                <p>Sprawdź zaplanowane lekcje</p>
                                <button class="tutor-action-btn" onclick="window.location.href='?section=calendar'">Przejdź</button>
                            </div>
                            <div class="tutor-action-card">
                                <div class="tutor-action-icon" style="background: #e91e63;">👥</div>
                                <h4>Moi studenci</h4>
                                <p>Zobacz listę studentów</p>
                                <button class="tutor-action-btn" onclick="window.location.href='?section=students'">Przejdź</button>
                            </div>
                        </div>
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Failed to load dashboard stats:', error)
            contentDiv.innerHTML = `
                <div class="tutor-content-area">
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <h3>Błąd ładowania danych</h3>
                        <p>Nie udało się załadować statystyk. Spróbuj odświeżyć stronę.</p>
                    </div>
                </div>
            `
        }
    }

    private loadAvailabilityContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
        const user = authService.getUser()
        const profile = user?.tutor_profile
        const weeklyLimit = profile?.weekly_contract_limit || 40
        
        contentDiv.innerHTML = `
            <div class="tutor-content-area">
                <div class="row mb-4">
                    <!--
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-clock me-2"></i>
                                    Limit godzin tygodniowo
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="display-4 text-primary me-3">${weeklyLimit}</div>
                                    <div>
                                        <div class="text-muted">godzin tygodniowo</div>
                                    </div>
                                </div>
                                <hr>
                                <small class="text-muted">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Ten limit określa maksymalną liczbę godzin pracy w tygodniu
                                </small>
                            </div>
                        </div>
                    </div>
                    -->
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-calendar-check me-2"></i>
                                    Status przyjmowania uczniów
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    ${profile?.is_accepting_students 
                                        ? '<span class="badge bg-success fs-6">Przyjmuję nowych uczniów</span>' 
                                        : '<span class="badge bg-secondary fs-6">Nie przyjmuję nowych uczniów</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="availability-calendar-container"></div>
            </div>
        `
        
        // Initialize the hourly availability calendar component
        const calendarContainer = contentDiv.querySelector('#availability-calendar-container')
        if (calendarContainer) {
            this.availabilityComponent = new HourlyAvailabilityCalendar()
            this.availabilityComponent.mount(calendarContainer as HTMLElement)
        }
    }

    private loadCalendarContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
        const tutorLessons = new TutorLessons()
        contentDiv.innerHTML = tutorLessons.getCalendarContent()
        
        // Set global instance for static methods
        ;(window as any).currentTutorLessonsInstance = tutorLessons
    }

    private loadUpcomingLessonsContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
        const tutorLessons = new TutorLessons()
        contentDiv.innerHTML = tutorLessons.getUpcomingLessonsContent()
        
        // Set global instance for static methods
        ;(window as any).currentTutorLessonsInstance = tutorLessons
    }

    private loadStudentsContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
        const tutorStudents = new TutorStudents()
        contentDiv.innerHTML = tutorStudents.getStudentsContent()
    }

    private loadLessonHistoryContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
        // Clean up if exists
        if (this.lessonHistoryComponent) {
            this.lessonHistoryComponent = null
        }
        
        this.lessonHistoryComponent = new TutorLessonHistory()
        
        // Check for student_filter parameter from URL
        const urlParams = new URLSearchParams(window.location.search)
        const studentFilter = urlParams.get('student_filter')
        
        contentDiv.innerHTML = this.lessonHistoryComponent.getHistoryContent()
        
        // Apply student filter if provided
        if (studentFilter) {
            // Wait a bit for the component to render, then apply the filter
            setTimeout(() => {
                this.lessonHistoryComponent?.applyStudentFilter(studentFilter)
            }, 100)
        }
        
        // Set global instance for static methods
        ;(window as any).currentTutorLessonHistoryInstance = this.lessonHistoryComponent
    }

    private loadBooksContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return

        contentDiv.innerHTML = `
            <div class="tutor-content-area">
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

    private async loadProfileContent(): Promise<void> {
        
        // Double-check we're still on profile section
        if (this.currentSection !== 'profile') {
            return
        }
        
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) {
            return
        }
        
        // Clean up previous profile component if exists
        if (this.profileComponent) {
            this.profileComponent.unmount()
            this.profileComponent = null
        }
        
        // Use TutorProfileEdit component
        const component = new TutorProfileEdit()
        const profileEl = await component.render()
        
        contentDiv.innerHTML = ''
        contentDiv.appendChild(profileEl)
        
        // Store reference before mounting
        this.profileComponent = component
        
        await component.mount(profileEl)
    }

    private async loadIssueReportContent(): Promise<void> {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return

        contentDiv.innerHTML = '<div id="issue-report-container"></div>'
        
        // Import and mount IssueReportForm
        import('@/components/support/IssueReportForm').then((module) => {
            const issueForm = new module.IssueReportForm()
            const container = document.getElementById('issue-report-container')
            if (container) {
                issueForm.mount(container)
            }
        })
    }

    private async loadChangelogContent(): Promise<void> {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return

        contentDiv.innerHTML = '<div id="changelog-container"></div>'
        
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
            if (contentDiv) {
                contentDiv.innerHTML = '<div class="alert alert-danger">Błąd ładowania wykazu zmian</div>'
            }
        })
    }
}