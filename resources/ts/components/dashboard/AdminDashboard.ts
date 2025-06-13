// resources/ts/components/dashboard/AdminDashboard.ts
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'
import type { RouteComponent } from '@/router/routes'

interface AdminStats {
    users_count: number
    active_lessons: number
    total_revenue: number
    pending_approvals: number
}

export class AdminDashboard implements RouteComponent {
    private container: HTMLElement | null = null
    private stats: AdminStats | null = null
    private isLoading: boolean = true

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'admin-dashboard-page'

        page.innerHTML = `
            <div class="dashboard-container">
                <!-- Header -->
                <div class="dashboard-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="dashboard-title">Panel Administratora</h1>
                            <p class="dashboard-subtitle">Zarządzaj całą platformą</p>
                        </div>
                        <div class="header-right">
                            <button class="btn btn-primary" id="add-user-btn">
                                <span class="btn-icon">👤</span>
                                Dodaj użytkownika
                            </button>
                            <button class="btn btn-outline-primary" id="system-settings-btn">
                                <span class="btn-icon">⚙️</span>
                                Ustawienia systemu
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div class="stats-section">
                    <h2 class="section-title">Przegląd statystyk</h2>
                    <div class="stats-grid" id="stats-grid">
                        ${this.isLoading ? this.getLoadingStats() : this.getStatsHTML()}
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions-section">
                    <h2 class="section-title">Szybkie akcje</h2>
                    <div class="actions-grid">
                        <div class="action-card" data-action="manage-users">
                            <div class="action-icon">👥</div>
                            <div class="action-content">
                                <h3>Zarządzaj użytkownikami</h3>
                                <p>Dodawaj, edytuj i usuwaj konta użytkowników</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                        <div class="action-card" data-action="manage-content">
                            <div class="action-icon">📚</div>
                            <div class="action-content">
                                <h3>Zarządzaj treściami</h3>
                                <p>Moderuj kursy, lekcje i materiały</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                        <div class="action-card" data-action="view-analytics">
                            <div class="action-icon">📊</div>
                            <div class="action-content">
                                <h3>Analityki</h3>
                                <p>Przeglądaj raporty i statystyki</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                        <div class="action-card" data-action="system-logs">
                            <div class="action-icon">📋</div>
                            <div class="action-content">
                                <h3>Logi systemu</h3>
                                <p>Monitoruj aktywność i błędy</p>
                            </div>
                            <div class="action-arrow">→</div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity-section">
                    <h2 class="section-title">Ostatnia aktywność</h2>
                    <div class="activity-feed" id="activity-feed">
                        <div class="activity-item">
                            <div class="activity-icon">👤</div>
                            <div class="activity-content">
                                <div class="activity-text">Nowy użytkownik <strong>Jan Kowalski</strong> zarejestrował się jako student</div>
                                <div class="activity-time">5 minut temu</div>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">📚</div>
                            <div class="activity-content">
                                <div class="activity-text">Kurs <strong>Angielski B2</strong> został zaktualizowany</div>
                                <div class="activity-time">15 minut temu</div>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">⚠️</div>
                            <div class="activity-content">
                                <div class="activity-text">Zgłoszenie od użytkownika wymaga uwagi</div>
                                <div class="activity-time">1 godzinę temu</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Health -->
                <div class="system-health-section">
                    <h2 class="section-title">Stan systemu</h2>
                    <div class="health-grid">
                        <div class="health-item health-good">
                            <div class="health-indicator"></div>
                            <div class="health-label">Serwer</div>
                            <div class="health-status">Online</div>
                        </div>
                        <div class="health-item health-good">
                            <div class="health-indicator"></div>
                            <div class="health-label">Baza danych</div>
                            <div class="health-status">Sprawna</div>
                        </div>
                        <div class="health-item health-warning">
                            <div class="health-indicator"></div>
                            <div class="health-label">Cache</div>
                            <div class="health-status">Wysoki % użycia</div>
                        </div>
                        <div class="health-item health-good">
                            <div class="health-indicator"></div>
                            <div class="health-label">Email</div>
                            <div class="health-status">Działa</div>
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
        console.log('✅ AdminDashboard mounted')
    }

    unmount(): void {
        console.log('👋 AdminDashboard unmounted')
    }

    private getLoadingStats(): string {
        return `
            <div class="stat-card loading">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Użytkownicy</div>
                </div>
            </div>
            <div class="stat-card loading">
                <div class="stat-icon">🎓</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Aktywne lekcje</div>
                </div>
            </div>
            <div class="stat-card loading">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Przychody</div>
                </div>
            </div>
            <div class="stat-card loading">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <div class="stat-value">
                        <div class="loading-placeholder"></div>
                    </div>
                    <div class="stat-label">Oczekujące zatwierdzenia</div>
                </div>
            </div>
        `
    }

    private getStatsHTML(): string {
        if (!this.stats) return this.getLoadingStats()

        return `
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.users_count.toLocaleString()}</div>
                    <div class="stat-label">Użytkownicy</div>
                    <div class="stat-change positive">+12% w tym miesiącu</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎓</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.active_lessons.toLocaleString()}</div>
                    <div class="stat-label">Aktywne lekcje</div>
                    <div class="stat-change positive">+8% w tym tygodniu</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.total_revenue.toLocaleString()} zł</div>
                    <div class="stat-label">Przychody</div>
                    <div class="stat-change positive">+15% w tym miesiącu</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <div class="stat-value">${this.stats.pending_approvals}</div>
                    <div class="stat-label">Oczekujące zatwierdzenia</div>
                    <div class="stat-change ${this.stats.pending_approvals > 0 ? 'warning' : 'neutral'}">
                        ${this.stats.pending_approvals > 0 ? 'Wymaga uwagi' : 'Wszystko aktualne'}
                    </div>
                </div>
            </div>
        `
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Quick action cards
        const actionCards = this.container.querySelectorAll('.action-card')
        actionCards.forEach(card => {
            card.addEventListener('click', this.handleActionCard.bind(this))
        })

        // Header buttons
        const addUserBtn = this.container.querySelector('#add-user-btn')
        addUserBtn?.addEventListener('click', this.handleAddUser.bind(this))

        const systemSettingsBtn = this.container.querySelector('#system-settings-btn')
        systemSettingsBtn?.addEventListener('click', this.handleSystemSettings.bind(this))
    }

    private handleActionCard(event: Event): void {
        const card = event.currentTarget as HTMLElement
        const action = card.getAttribute('data-action')

        switch (action) {
            case 'manage-users':
                this.navigateToUsers()
                break
            case 'manage-content':
                this.navigateToContent()
                break
            case 'view-analytics':
                this.navigateToAnalytics()
                break
            case 'system-logs':
                this.navigateToLogs()
                break
        }
    }

    private handleAddUser(): void {
        // TODO: Open add user modal or navigate to user creation
        console.log('Add user clicked')
    }

    private handleSystemSettings(): void {
        // TODO: Navigate to system settings
        console.log('System settings clicked')
    }

    private navigateToUsers(): void {
        window.location.href = '/admin/users'
    }

    private navigateToContent(): void {
        window.location.href = '/admin/content'
    }

    private navigateToAnalytics(): void {
        window.location.href = '/admin/analytics'
    }

    private navigateToLogs(): void {
        window.location.href = '/admin/logs'
    }

    private async loadStats(): Promise<void> {
        try {
            console.log('📊 Loading admin dashboard stats...')

            const response = await api.get<{success: boolean, data: AdminStats}>('/admin/dashboard-stats')

            if (response.success) {
                this.stats = response.data
                this.isLoading = false
                this.updateStatsDisplay()
            }

        } catch (error) {
            console.error('❌ Failed to load admin stats:', error)
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
        // Verify admin role
        if (!authService.hasRole('admin')) {
            return false
        }
        return true
    }

    onAfterEnter(): void {
        document.title = 'Panel Administratora - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        // Cleanup if needed
    }
}