// resources/ts/components/pages/dashboards/AdminDashboard.ts

import { BaseDashboard } from './BaseDashboard'
import { authService } from '@services/AuthService'

export class AdminDashboard extends BaseDashboard {
    protected render(): void {
        this.container.innerHTML = this.getTemplate()
    }

    protected getTemplate(): string {
        return `
            <div class="dashboard-container">
                <div class="container">
                    <!-- Dashboard Header -->
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h1><i class="fas fa-tachometer-alt text-primary me-2"></i>Panel Administratora</h1>
                            <p>Zarządzaj platformą i monitoruj jej działanie</p>
                        </div>
                        <div class="dashboard-actions">
                            <button class="btn btn-primary" data-notification="Funkcja w budowie!">
                                <i class="fas fa-plus me-2"></i>Dodaj użytkownika
                            </button>
                            <button class="btn btn-outline-primary" data-notification="Eksport danych w budowie!">
                                <i class="fas fa-download me-2"></i>Eksportuj dane
                            </button>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="stats-grid">
                        <div class="stat-card stat-primary">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="users-count">0</h3>
                                <p>Użytkownicy</p>
                                <span class="stat-change positive">+12% w tym miesiącu</span>
                            </div>
                        </div>

                        <div class="stat-card stat-success">
                            <div class="stat-icon">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="active-lessons">0</h3>
                                <p>Aktywne lekcje</p>
                                <span class="stat-change positive">+8% w tym tygodniu</span>
                            </div>
                        </div>

                        <div class="stat-card stat-warning">
                            <div class="stat-icon">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="total-revenue">0 zł</h3>
                                <p>Łączny przychód</p>
                                <span class="stat-change positive">+15% w tym miesiącu</span>
                            </div>
                        </div>

                        <div class="stat-card stat-info">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="pending-approvals">0</h3>
                                <p>Oczekujące zatwierdzenia</p>
                                <span class="stat-change neutral">Bez zmian</span>
                            </div>
                        </div>
                    </div>

                    <!-- Management Sections -->
                    <div class="management-grid">
                        <!-- User Management -->
                        <div class="management-card">
                            <div class="card-header">
                                <h3><i class="fas fa-users-cog me-2"></i>Zarządzanie użytkownikami</h3>
                            </div>
                            <div class="card-body">
                                <p>Zarządzaj kontami użytkowników, rolami i uprawnieniami</p>
                                <div class="quick-actions">
                                    <button class="btn btn-sm btn-outline-primary" data-notification="Lista użytkowników w budowie!">
                                        <i class="fas fa-list"></i> Zobacz wszystkich
                                    </button>
                                    <button class="btn btn-sm btn-outline-success" data-notification="Dodawanie użytkownika w budowie!">
                                        <i class="fas fa-user-plus"></i> Dodaj nowego
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Other management cards... -->
                        <div class="management-card">
                            <div class="card-header">
                                <h3><i class="fas fa-chalkboard-teacher me-2"></i>Zarządzanie lektorami</h3>
                            </div>
                            <div class="card-body">
                                <p>Weryfikacja i zarządzanie profilami lektorów</p>
                                <div class="quick-actions">
                                    <button class="btn btn-sm btn-outline-primary" data-notification="Lista lektorów w budowie!">
                                        <i class="fas fa-list"></i> Zobacz lektorów
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" data-notification="Weryfikacja w budowie!">
                                        <i class="fas fa-check-circle"></i> Do weryfikacji
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="management-card">
                            <div class="card-header">
                                <h3><i class="fas fa-graduation-cap me-2"></i>Zarządzanie studentami</h3>
                            </div>
                            <div class="card-body">
                                <p>Monitorowanie aktywności i postępów studentów</p>
                                <div class="quick-actions">
                                    <button class="btn btn-sm btn-outline-primary" data-notification="Lista studentów w budowie!">
                                        <i class="fas fa-list"></i> Zobacz studentów
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" data-notification="Statystyki w budowie!">
                                        <i class="fas fa-chart-bar"></i> Statystyki
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="recent-activity">
                        <div class="activity-header">
                            <h3><i class="fas fa-history me-2"></i>Ostatnia aktywność</h3>
                            <button class="btn btn-sm btn-outline-primary" data-notification="Historia aktywności w budowie!">
                                Zobacz wszystko
                            </button>
                        </div>
                        <div class="activity-list">
                            <div class="activity-item">
                                <div class="activity-icon success">
                                    <i class="fas fa-user-plus"></i>
                                </div>
                                <div class="activity-content">
                                    <p><strong>Nowy użytkownik</strong> - Jan Kowalski dołączył jako student</p>
                                    <span class="activity-time">5 minut temu</span>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon info">
                                    <i class="fas fa-calendar-check"></i>
                                </div>
                                <div class="activity-content">
                                    <p><strong>Zarezerwowano lekcję</strong> - Lekcja angielskiego z Anną Nowak</p>
                                    <span class="activity-time">15 minut temu</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    protected async loadStats(): Promise<void> {
        try {
            const response = await fetch('/api/admin/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Accept': 'application/json'
                }
            })

            if (response.ok) {
                const data = await response.json()
                this.updateStatsDisplay(data.data)
            }
        } catch (error) {
            console.error('Error loading admin dashboard stats:', error)
        }
    }

    private updateStatsDisplay(stats: any): void {
        const usersCount = this.container.querySelector('#users-count')
        const activeLessons = this.container.querySelector('#active-lessons')
        const totalRevenue = this.container.querySelector('#total-revenue')
        const pendingApprovals = this.container.querySelector('#pending-approvals')

        if (usersCount) usersCount.textContent = stats.users_count || '0'
        if (activeLessons) activeLessons.textContent = stats.active_lessons || '0'
        if (totalRevenue) totalRevenue.textContent = `${stats.total_revenue || 0} zł`
        if (pendingApprovals) pendingApprovals.textContent = stats.pending_approvals || '0'
    }
}