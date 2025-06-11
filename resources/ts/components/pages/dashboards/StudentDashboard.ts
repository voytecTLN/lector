// resources/ts/components/pages/dashboards/StudentDashboard.ts

import { BaseDashboard } from './BaseDashboard'
import { authService } from '@services/AuthService'

export class StudentDashboard extends BaseDashboard {
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
                            <h1><i class="fas fa-graduation-cap text-primary me-2"></i>Panel Studenta</h1>
                            <p>Twoja podróż w nauce języków</p>
                        </div>
                        <div class="dashboard-actions">
                            <button class="btn btn-primary" data-notification="Rezerwacja lekcji w budowie!">
                                <i class="fas fa-calendar-plus me-2"></i>Zarezerwuj lekcję
                            </button>
                            <button class="btn btn-outline-primary" data-notification="Znajdź lektora w budowie!">
                                <i class="fas fa-search me-2"></i>Znajdź lektora
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
                                <span class="stat-change positive">Następna: jutro</span>
                            </div>
                        </div>

                        <div class="stat-card stat-success">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="completed-lessons">0</h3>
                                <p>Ukończone lekcje</p>
                                <span class="stat-change positive">+3 w tym tygodniu</span>
                            </div>
                        </div>

                        <div class="stat-card stat-warning">
                            <div class="stat-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="learning-progress">0%</h3>
                                <p>Postęp w nauce</p>
                                <span class="stat-change positive">+15% w tym miesiącu</span>
                            </div>
                        </div>

                        <div class="stat-card stat-info">
                            <div class="stat-icon">
                                <i class="fas fa-heart"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="favorite-tutors">0</h3>
                                <p>Ulubieni lektorzy</p>
                                <span class="stat-change neutral">Anna, Piotr</span>
                            </div>
                        </div>
                    </div>

                    <!-- Learning Progress -->
                    <div class="learning-progress-section">
                        <div class="section-header">
                            <h3><i class="fas fa-trophy me-2"></i>Twój postęp w nauce</h3>
                            <button class="btn btn-sm btn-outline-primary" data-notification="Szczegółowe statystyki w budowie!">
                                Zobacz szczegóły
                            </button>
                        </div>
                        <div class="progress-cards">
                            <div class="progress-card">
                                <div class="progress-header">
                                    <h4><i class="fas fa-flag me-1"></i>Angielski</h4>
                                    <span class="level-badge">B2</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 75%"></div>
                                    </div>
                                    <span class="progress-text">75% do poziomu C1</span>
                                </div>
                                <div class="progress-stats">
                                    <span><i class="fas fa-clock"></i> 24h nauki</span>
                                    <span><i class="fas fa-calendar"></i> 18 lekcji</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Management Cards -->
                    <div class="management-grid">
                        <div class="management-card">
                            <div class="card-header">
                                <h3><i class="fas fa-search me-2"></i>Znajdź lektorów</h3>
                            </div>
                            <div class="card-body">
                                <p>Przeglądaj profile lektorów i rezerwuj lekcje</p>
                                <div class="quick-actions">
                                    <button class="btn btn-sm btn-primary" data-notification="Przeglądanie lektorów w budowie!">
                                        <i class="fas fa-users"></i> Przeglądaj
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" data-notification="Wyszukiwanie w budowie!">
                                        <i class="fas fa-filter"></i> Filtruj
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
            const response = await fetch('/api/student/dashboard-stats', {
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
            console.error('Error loading student dashboard stats:', error)
        }
    }

    private updateStatsDisplay(stats: any): void {
        const upcomingLessons = this.container.querySelector('#upcoming-lessons')
        const completedLessons = this.container.querySelector('#completed-lessons')
        const learningProgress = this.container.querySelector('#learning-progress')
        const favoriteTutors = this.container.querySelector('#favorite-tutors')

        if (upcomingLessons) upcomingLessons.textContent = stats.upcoming_lessons || '0'
        if (completedLessons) completedLessons.textContent = stats.completed_lessons || '0'
        if (learningProgress) learningProgress.textContent = `${stats.learning_progress || 0}%`
        if (favoriteTutors) favoriteTutors.textContent = stats.favorite_tutors || '0'
    }
}