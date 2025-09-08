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

export class TutorDashboard implements RouteComponent {
    private currentSection: string = 'dashboard'
    private sidebarOpen: boolean = false
    private container: HTMLElement | null = null
    private refreshInterval: number | null = null
    private profileComponent: TutorProfileEdit | null = null
    private availabilityComponent: HourlyAvailabilityCalendar | null = null
    private lessonHistoryComponent: TutorLessonHistory | null = null

    async render(): Promise<HTMLElement> {
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
                    <div class="tutor-profile-section" style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1); margin-bottom: 20px;">
                        <div class="tutor-avatar-wrapper" style="margin-bottom: 10px;">
                            ${avatarHtml}
                        </div>
                        <h3 style="margin: 0; font-size: 18px; color: #fff;">${user?.name || 'Lektor'}</h3>
                        <p style="margin: 5px 0; font-size: 14px; color: #94a3b8;">${user?.email || ''}</p>
                    </div>
                    <h2>📚 Platforma Lektorów</h2>
                    <p style="color: #94a3b8; font-size: 0.875rem; margin: 0;">Panel Lektora</p>
                </div>
                
                <nav>
                    <ul class="tutor-nav-menu">
                        <li class="tutor-nav-item">
                            <a href="#" class="tutor-nav-link active" data-section="dashboard">
                                <span class="tutor-nav-icon">🏠</span>
                                <span>Strona główna</span>
                            </a>
                        </li>
                        
                        <li class="tutor-nav-section">ZARZĄDZANIE</li>
                        <li class="tutor-nav-item">
                            <a href="#" class="tutor-nav-link" data-section="availability">
                                <span class="tutor-nav-icon">🕐</span>
                                <span>Dostępność</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#" class="tutor-nav-link" data-section="calendar">
                                <span class="tutor-nav-icon">📅</span>
                                <span>Kalendarz</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#" class="tutor-nav-link" data-section="nadchodzace">
                                <span class="tutor-nav-icon">🎯</span>
                                <span>Nadchodzące lekcje</span>
                            </a>
                        </li>
                        
                        <li class="tutor-nav-section">STUDENCI</li>
                        <li class="tutor-nav-item">
                            <a href="#" class="tutor-nav-link" data-section="students">
                                <span class="tutor-nav-icon">👥</span>
                                <span>Moi studenci</span>
                            </a>
                        </li>
                        <li class="tutor-nav-item">
                            <a href="#" class="tutor-nav-link" data-section="historia">
                                <span class="tutor-nav-icon">📚</span>
                                <span>Historia lekcji</span>
                            </a>
                        </li>
                        
                        <li class="tutor-nav-section">KONTO</li>
                        <li class="tutor-nav-item">
                            <a href="#" class="tutor-nav-link" data-section="profile">
                                <span class="tutor-nav-icon">👤</span>
                                <span>Mój profil</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>
            
            <main class="tutor-main-content">
                <header class="tutor-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button class="tutor-mobile-menu-btn" id="tutorMobileMenuBtn">☰</button>
                        <h1 id="sectionTitle">Strona główna</h1>
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
        
        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.setupEventListeners()
        this.handleUrlChange()
        
        // Make LessonDetailsModal available globally for onclick handlers
        ;(window as any).LessonDetailsModal = LessonDetailsModal
        
        // Set up auto-refresh for dashboard stats
        this.refreshInterval = window.setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardContent()
            }
        }, 60000) // Refresh every minute
        
        // Listen for browser back/forward
        window.addEventListener('popstate', () => this.handleUrlChange())
    }

    unmount(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval)
        }
        window.removeEventListener('popstate', () => this.handleUrlChange())
        
        if (this.profileComponent) {
            this.profileComponent.unmount()
            this.profileComponent = null
        }
        if (this.availabilityComponent) {
            this.availabilityComponent.unmount()
            this.availabilityComponent = null
        }
    }

    private setupEventListeners(): void {
        // Navigation clicks
        const navLinks = this.container?.querySelectorAll('.tutor-nav-link')
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                const section = (link as HTMLElement).dataset.section
                if (section) {
                    this.navigateToSection(section)
                }
            })
        })
        
        // Mobile menu toggle
        const mobileMenuBtn = this.container?.querySelector('#tutorMobileMenuBtn')
        mobileMenuBtn?.addEventListener('click', () => {
            this.toggleSidebar()
        })
        
        // Logout
        const logoutBtn = this.container?.querySelector('#logoutBtn')
        logoutBtn?.addEventListener('click', () => {
            authService.logout()
            window.location.href = '/login'
        })
    }

    private toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen
        const sidebar = this.container?.querySelector('#tutorSidebar')
        if (sidebar) {
            sidebar.classList.toggle('open', this.sidebarOpen)
        }
    }

    private navigateToSection(section: string): void {
        this.currentSection = section
        this.updateActiveNavLink()
        this.loadSectionContent()
        
        // Update URL without page reload
        const url = new URL(window.location.href)
        url.searchParams.set('section', section)
        window.history.pushState({}, '', url.toString())
    }

    private handleUrlChange(): void {
        const urlParams = new URLSearchParams(window.location.search)
        this.currentSection = urlParams.get('section') || 'dashboard'
        this.updateActiveNavLink()
        this.loadSectionContent()
    }

    private updateActiveNavLink(): void {
        const navLinks = this.container?.querySelectorAll('.tutor-nav-link')
        navLinks?.forEach(link => {
            const linkSection = (link as HTMLElement).dataset.section
            link.classList.toggle('active', linkSection === this.currentSection)
        })
    }

    private loadSectionContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        const titleEl = this.container?.querySelector('#sectionTitle')
        
        if (!contentDiv) return
        
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
                if (titleEl) titleEl.textContent = 'Strona główna'
                this.loadDashboardContent()
                break
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
            case 'profile':
                if (titleEl) titleEl.textContent = 'Mój profil'
                this.loadProfileContent()
                break
            default:
                this.navigateToSection('dashboard')
        }
    }

    private async loadDashboardContent(): Promise<void> {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
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
                
                <div class="stats-grid">
                    <div class="stat-card highlight">
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
                                        <small class="text-muted">Limit kontraktowy</small>
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
                                <p class="text-muted mb-0">
                                    Maksymalnie <strong>${profile?.max_students_per_week || 0}</strong> uczniów tygodniowo
                                </p>
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
        
        // TutorLessons already exports itself to global scope with static methods
    }

    private loadUpcomingLessonsContent(): void {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
        const tutorLessons = new TutorLessons()
        contentDiv.innerHTML = tutorLessons.getUpcomingLessonsContent()
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
        contentDiv.innerHTML = this.lessonHistoryComponent.getHistoryContent()
        
        // Set global instance for static methods
        ;(window as any).currentTutorLessonHistoryInstance = this.lessonHistoryComponent
    }

    private async loadProfileContent(): Promise<void> {
        const contentDiv = this.container?.querySelector('#tutorContent')
        if (!contentDiv) return
        
        // Use TutorProfileEdit component
        this.profileComponent = new TutorProfileEdit()
        const profileEl = await this.profileComponent.render()
        
        contentDiv.innerHTML = ''
        contentDiv.appendChild(profileEl)
        
        this.profileComponent.mount(profileEl)
    }
}