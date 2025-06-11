// resources/ts/components/pages/dashboards/TutorDashboard.ts

import { BaseDashboard } from './BaseDashboard'
import { authService } from '@services/AuthService'

export class TutorDashboard extends BaseDashboard {
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
                            <h1><i class="fas fa-chalkboard-teacher text-primary me-2"></i>Panel Lektora</h1>
                            <p>Zarządzaj swoimi lekcjami i studentami</p>
                        </div>
                        <div class="dashboard-actions">
                            <button class="btn btn-primary" data-notification="Dodawanie lekcji w budowie!">
                                <i class="fas fa-plus me-2"></i>Dodaj lekcję
                            </button>
                            <button class="btn btn-outline-primary" data-notification="Kalendarz w budowie!">
                                <i class="fas fa-calendar me-2"></i>Kalendarz
                            </button>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="stats-grid">
                        <div class="stat-card stat-primary">
                            <div class="stat-icon">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="upcoming-lessons">0</h3>
                                <p>Nadchodzące lekcje</p>
                                <span class="stat-change positive">Dzisiaj: 3</span>
                            </div>
                        </div>

                        <div class="stat-card stat-success">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="completed-lessons">0</h3>
                                <p>Ukończone lekcje</p>
                                <span class="stat-change positive">+5 w tym tygodniu</span>
                            </div>
                        </div>

                        <div class="stat-card stat-warning">
                            <div class="stat-icon">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="total-earnings">0 zł</h3>
                                <p>Łączne zarobki</p>
                                <span class="stat-change positive">+12% w tym miesiącu</span>
                            </div>
                        </div>

                        <div class="stat-card stat-info">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="student-count">0</h3>
                                <p>Aktywni studenci</p>
                                <span class="stat-change positive">+2 nowych</span>
                            </div>
                        </div>
                    </div>

                    <!-- Today's Schedule -->
                    <div class="today-schedule">
                        <div class="section-header">
                            <h3><i class="fas fa-clock me-2"></i>Dzisiejszy harmonogram</h3>
                            <button class="btn btn-sm btn-outline-primary" data-notification="Pełny kalendarz w budowie!">
                                Zobacz wszystkie
                            </button>
                        </div>
                        <div class="schedule-list">
                            <div class="schedule-item">
                                <div class="schedule-time">
                                    <span class="time">09:00</span>
                                    <span class="duration">60 min</span>
                                </div>
                                <div class="schedule-content">
                                    <h4>Lekcja angielskiego - poziom B2</h4>
                                    <p><i class="fas fa-user me-1"></i>Anna Kowalska</p>
                                    <p><i class="fas fa-book me-1"></i>Business English - Unit 5</p>
                                </div>
                                <div class="schedule-actions">
                                    <button class="btn btn-sm btn-success" data-notification="Rozpoczęto lekcję!">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Management Cards -->
                    <div class="management-grid">
                        <div class="management-card">
                            <div class="card-header">
                                <h3><i class="fas fa-calendar-alt me-2"></i>Zarządzanie lekcjami</h3>
                            </div>
                            <div class="card-body">
                                <p>Planuj, edytuj i prowadź swoje lekcje</p>
                                <div class="quick-actions">
                                    <button class="btn btn-sm btn-primary" data-notification="Nowa lekcja w budowie!">
                                        <i class="fas fa-plus"></i> Nowa lekcja
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" data-notification="Lista lekcji w budowie!">
                                        <i class="fas fa-list"></i> Wszystkie lekcje
                                    </button>
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
            const response = await fetch('/api/tutor/dashboard-stats', {
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
            console.error('Error loading tutor dashboard stats:', error)
        }
    }

    private updateStatsDisplay(stats: any): void {
        const upcomingLessons = this.container.querySelector('#upcoming-lessons')
        const completedLessons = this.container.querySelector('#completed-lessons')
        const totalEarnings = this.container.querySelector('#total-earnings')
        const studentCount = this.container.querySelector('#student-count')

        if (upcomingLessons) upcomingLessons.textContent = stats.upcoming_lessons || '0'
        if (completedLessons) completedLessons.textContent = stats.completed_lessons || '0'
        if (totalEarnings) totalEarnings.textContent = `${stats.total_earnings || 0} zł`
        if (studentCount) studentCount.textContent = stats.student_count || '0'
    }
}