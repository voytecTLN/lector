// resources/ts/components/dashboard/StudentDashboard.ts
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'
import type { RouteComponent } from '@/router/routes'

interface StudentStats {
    upcoming_lessons: number
    completed_lessons: number
    learning_progress: number
    favorite_tutors: number
}

export class StudentDashboard implements RouteComponent {
    private container: HTMLElement | null = null
    private stats: StudentStats | null = null
    private isLoading: boolean = true
    private currentUser: any = null

    async render(): Promise<HTMLElement> {
        this.currentUser = authService.getUser()

        const page = document.createElement('div')
        page.className = 'student-dashboard-page'

        page.innerHTML = `
            <div class="dashboard-container">
                <!-- Header -->
                <div class="dashboard-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="dashboard-title">
                                Witaj, ${this.currentUser?.name || 'Studencie'}! 👋
                            </h1>
                            <p class="dashboard-subtitle">Kontynuuj swoją językową przygodę</p>
                        </div>
                        <div class="header-right">
                            <button class="btn btn-primary" id="book-lesson-btn">
                                <span class="btn-icon">📅</span>
                                Zarezerwuj lekcję
                            </button>
                            <button class="btn btn-outline-primary" id="find-tutor-btn">
                                <span class="btn-icon">🔍</span>
                                Znajdź lektora
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="stats-section">
                    <h2 class="section-title">Twoje postępy</h2>
                    <div class="stats-grid" id="stats-grid">
                        ${this.isLoading ? this.getLoadingStats() : this.getStatsHTML()}
                    </div>
                </div>

                <!-- Upcoming Lessons -->
                <div class="upcoming-lessons-section">
                    <div class="section-header">
                        <h2 class="section-title">Nadchodzące lekcje</h2>
                        <a href="/student/lessons" data-navigate class="view-all-link">Zobacz wszystkie</a>
                    </div>
                    <div class="lessons-grid" id="upcoming-lessons">
                        ${this.getUpcomingLessonsHTML()}
                    </div>
                </div>

                <!-- Learning Progress -->
                <div class="progress-section">
                    <div class="section-header">
                        <h2 class="section-title">Postępy w nauce</h2>
                        <a href="/student/progress" data-navigate class="view-all-link">Szczegóły</a>
                    </div>
                    <div class="progress-grid">
                        <div class="progress-card">
                            <div class="progress-header">
                                <div class="language-flag">🇬🇧</div>
                                <div class="language-info">
                                    <h3>Angielski</h3>
                                    <p>Poziom: B2 → C1</p>
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 75%"></div>
                            </div>
                            <div class="progress-stats">
                                <span>15/20 lekcji</span>
                                <span>75% ukończone</span>
                            </div>
                        </div>
                        <div class="progress-card">
                            <div class="progress-header">
                                <div class="language-flag">🇩🇪</div>
                                <div class="language-info">
                                    <h3>Niemiecki</h3>
                                    <p>Poziom: A2 → B1</p>
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 40%"></div>
                            </div>
                            <div class="progress-stats">
                                <span>8/20 lekcji</span>
                                <span>40% ukończone</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recommended Tutors -->
                <div class="tutors-section">
                    <div class="section-header">
                        <h2 class="section-title">Polecani lektorzy</h2>
                        <a href="/tutors" data-navigate class="view-all-link">Zobacz wszystkich</a>
                    </div>
                    <div class="tutors-grid">
                        ${this.getRecommendedTutorsHTML()}
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions-section">
                    <h2 class="section-title">Przydatne linki</h2>
                    <div class="actions-grid">
                        <div class="action-card" data-action="my-lessons">
                            <div class="action-icon">📚</div>
                            <div class="action-content">
                                <h3>Moje lekcje</h3>
                                <p>Historia i nadchodzące zajęcia</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                        <div class="action-card" data-action="materials">
                            <div class="action-icon">📖</div>
                            <div class="action-content">
                                <h3>Materiały</h3>
                                <p>Pobierz materiały do nauki</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                        <div class="action-card" data-action="certificates">
                            <div class="action-icon">🏆</div>
                            <div class="action-content">
                                <h3>Certyfikaty</h3>
                                <p>Twoje osiągnięcia i dyplomy</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                        <div class="action-card" data-action="support">
                            <div class="action-icon">💬</div>
                            <div class="action-content">
                                <h3>Wsparcie</h3>
                                <p>Skontaktuj się z nami</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                    </div>
                </div>
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.loadStats()
        console.log('✅ StudentDashboard mounted')
    }

    unmount(): void {
        console.log('👋 StudentDashboard unmounted')
    }

    private getLoadingStats(): string {
        return `
            <div class="stat-card loading">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Nadchodzące lekcje</div>
                </div>
            </div>
            <div class="stat-card loading">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Ukończone lekcje</div>
                </div>
            </div>
            <div class="stat-card loading">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Postęp nauki</div>
                </div>
            </div>
            <div class="stat-card loading">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Ulubieni lektorzy</div>
                </div>
            </div>
        `
    }

    private getStatsHTML(): string {
        if (!this.stats) return this.getLoadingStats()

        return `
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.upcoming_lessons}</div>
                    <div class="stat-label">Nadchodzące lekcje</div>
                    <div class="stat-description">W tym tygodniu</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.completed_lessons}</div>
                    <div class="stat-label">Ukończone lekcje</div>
                    <div class="stat-description">W tym miesiącu</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.learning_progress}%</div>
                    <div class="stat-label">Postęp nauki</div>
                    <div class="stat-description">Średnio we wszystkich językach</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.favorite_tutors}</div>
                    <div class="stat-label">Ulubieni lektorzy</div>
                    <div class="stat-description">Dodane do ulubionych</div>
                </div>
            </div>
        `
    }

    private getUpcomingLessonsHTML(): string {
        // TODO: Load real data from API
        return `
            <div class="lesson-card">
                <div class="lesson-time">
                    <div class="lesson-date">Jutro</div>
                    <div class="lesson-hour">14:00 - 15:00</div>
                </div>
                <div class="lesson-info">
                    <h3>Angielski - Konwersacje</h3>
                    <p>z Anna Kowalska</p>
                    <div class="lesson-status">Potwierdzona</div>
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-outline-primary">Dołącz</button>
                </div>
            </div>
            <div class="lesson-card">
                <div class="lesson-time">
                    <div class="lesson-date">Piątek</div>
                    <div class="lesson-hour">16:30 - 17:30</div>
                </div>
                <div class="lesson-info">
                    <h3>Niemiecki - Gramatyka</h3>
                    <p>z Piotr Schmidt</p>
                    <div class="lesson-status">Oczekuje</div>
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-outline-primary">Szczegóły</button>
                </div>
            </div>
        `
    }

    private getRecommendedTutorsHTML(): string {
        return `
            <div class="tutor-card">
                <div class="tutor-avatar">AK</div>
                <div class="tutor-info">
                    <h3>Anna Kowalska</h3>
                    <p>Native speaker angielskiego</p>
                    <div class="tutor-rating">⭐ 4.9 (127 opinii)</div>
                    <div class="tutor-price">80 zł/h</div>
                </div>
                <button class="btn btn-sm btn-primary">Zobacz profil</button>
            </div>
            <div class="tutor-card">
                <div class="tutor-avatar">PS</div>
                <div class="tutor-info">
                    <h3>Piotr Schmidt</h3>
                    <p>Certyfikowany lektor niemieckiego</p>
                    <div class="tutor-rating">⭐ 4.8 (89 opinii)</div>
                    <div class="tutor-price">75 zł/h</div>
                </div>
                <button class="btn btn-sm btn-primary">Zobacz profil</button>
            </div>
        `
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Header buttons
        const bookLessonBtn = this.container.querySelector('#book-lesson-btn')
        bookLessonBtn?.addEventListener('click', this.handleBookLesson.bind(this))

        const findTutorBtn = this.container.querySelector('#find-tutor-btn')
        findTutorBtn?.addEventListener('click', this.handleFindTutor.bind(this))

        // Quick action cards
        const actionCards = this.container.querySelectorAll('.action-card')
        actionCards.forEach(card => {
            card.addEventListener('click', this.handleActionCard.bind(this))
        })
    }

    private handleBookLesson(): void {
        window.location.href = '/student/book-lesson'
    }

    private handleFindTutor(): void {
        window.location.href = '/tutors'
    }

    private handleActionCard(event: Event): void {
        const card = event.currentTarget as HTMLElement
        const action = card.getAttribute('data-action')

        switch (action) {
            case 'my-lessons':
                window.location.href = '/student/lessons'
                break
            case 'materials':
                window.location.href = '/student/materials'
                break
            case 'certificates':
                window.location.href = '/student/certificates'
                break
            case 'support':
                window.location.href = '/support'
                break
        }
    }

    private async loadStats(): Promise<void> {
        try {
            console.log('📊 Loading student dashboard stats...')

            const response = await api.get<{success: boolean, data: StudentStats}>('/student/dashboard-stats')

            if (response.success) {
                this.stats = response.data
                this.isLoading = false
                this.updateStatsDisplay()
            }

        } catch (error) {
            console.error('❌ Failed to load student stats:', error)
            this.showError('Błąd podczas ładowania statystyk')
        }
    }

    private updateStatsDisplay(): void {
        if (!this.container) return

        const statsGrid = this.container.querySelector('#stats-grid')
        if (statsGrid) {
            statsGrid.innerHTML = this.getStatsHTML()
        }
    }

    private showError(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: { type: 'error', message }
        }))
    }

    // Lifecycle hooks
    onBeforeEnter(): boolean {
        // Verify student role
        if (!authService.hasAnyRole(['student', 'admin'])) {
            return false
        }
        return true
    }

    onAfterEnter(): void {
        document.title = 'Panel Studenta - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        // Cleanup if needed
    }
}