{{-- resources/views/dashboards/student.blade.php - Dashboard Studenta --}}
@extends('layouts.app')

@section('title', 'Panel Studenta')

@section('content')
<div class="dashboard-container">
    <div class="container">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
            <div class="dashboard-title">
                <h1><i class="fas fa-graduation-cap text-primary me-2"></i>Panel Studenta</h1>
                <p>Twoja podróż w nauce języków</p>
            </div>
            <div class="dashboard-actions">
                <button class="btn btn-primary" onclick="showNotification('info', 'Rezerwacja lekcji w budowie!')">
                    <i class="fas fa-calendar-plus me-2"></i>Zarezerwuj lekcję
                </button>
                <button class="btn btn-outline-primary" onclick="showNotification('info', 'Znajdź lektora w budowie!')">
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
                <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Szczegółowe statystyki w budowie!')">
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

                <div class="progress-card">
                    <div class="progress-header">
                        <h4><i class="fas fa-flag me-1"></i>Niemiecki</h4>
                        <span class="level-badge">A2</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 45%"></div>
                        </div>
                        <span class="progress-text">45% do poziomu B1</span>
                    </div>
                    <div class="progress-stats">
                        <span><i class="fas fa-clock"></i> 12h nauki</span>
                        <span><i class="fas fa-calendar"></i> 8 lekcji</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upcoming Lessons -->
        <div class="upcoming-lessons">
            <div class="section-header">
                <h3><i class="fas fa-clock me-2"></i>Nadchodzące lekcje</h3>
                <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Wszystkie lekcje w budowie!')">
                    Zobacz wszystkie
                </button>
            </div>
            <div class="lessons-list">
                <div class="lesson-item">
                    <div class="lesson-time">
                        <span class="date">Jutro</span>
                        <span class="time">15:00</span>
                        <span class="duration">60 min</span>
                    </div>
                    <div class="lesson-content">
                        <h4>Business English - Prezentacje</h4>
                        <p><i class="fas fa-chalkboard-teacher me-1"></i>Anna Kowalska</p>
                        <p><i class="fas fa-book me-1"></i>Poziom B2 • Unit 7</p>
                    </div>
                    <div class="lesson-actions">
                        <button class="btn btn-sm btn-success" onclick="showNotification('success', 'Dołączenie do lekcji!')">
                            <i class="fas fa-video"></i> Dołącz
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="showNotification('info', 'Szczegóły w budowie!')">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>

                <div class="lesson-item">
                    <div class="lesson-time">
                        <span class="date">Poniedziałek</span>
                        <span class="time">18:30</span>
                        <span class="duration">45 min</span>
                    </div>
                    <div class="lesson-content">
                        <h4>Konwersacje niemieckie</h4>
                        <p><i class="fas fa-chalkboard-teacher me-1"></i>Piotr Schmidt</p>
                        <p><i class="fas fa-comments me-1"></i>Poziom A2 • Rozmowa o pracy</p>
                    </div>
                    <div class="lesson-actions">
                        <button class="btn btn-sm btn-primary" onclick="showNotification('info', 'Za 3 dni')">
                            <i class="fas fa-clock"></i> Za 3 dni
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="showNotification('info', 'Szczegóły w budowie!')">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Management Sections -->
        <div class="management-grid">
            <!-- Find Tutors -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-search me-2"></i>Znajdź lektorów</h3>
                </div>
                <div class="card-body">
                    <p>Przeglądaj profile lektorów i rezerwuj lekcje</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-primary" onclick="showNotification('info', 'Przeglądanie lektorów w budowie!')">
                            <i class="fas fa-users"></i> Przeglądaj
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Wyszukiwanie w budowie!')">
                            <i class="fas fa-filter"></i> Filtruj
                        </button>
                    </div>
                </div>
            </div>

            <!-- My Lessons -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-calendar-alt me-2"></i>Moje lekcje</h3>
                </div>
                <div class="card-body">
                    <p>Zarządzaj swoimi lekcjami i harmonogramem</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Historia lekcji w budowie!')">
                            <i class="fas fa-history"></i> Historia
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="showNotification('info', 'Rezerwacja w budowie!')">
                            <i class="fas fa-plus"></i> Zarezerwuj
                        </button>
                    </div>
                </div>
            </div>

            <!-- Learning Goals -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-bullseye me-2"></i>Cele nauki</h3>
                </div>
                <div class="card-body">
                    <p>Ustaw i śledź swoje cele językowe</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Cele w budowie!')">
                            <i class="fas fa-target"></i> Moje cele
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showNotification('info', 'Nowy cel w budowie!')">
                            <i class="fas fa-plus"></i> Nowy cel
                        </button>
                    </div>
                </div>
            </div>

            <!-- Learning Materials -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-book-open me-2"></i>Materiały do nauki</h3>
                </div>
                <div class="card-body">
                    <p>Dostęp do materiałów i ćwiczeń</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Biblioteka w budowie!')">
                            <i class="fas fa-folder"></i> Biblioteka
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showNotification('info', 'Ćwiczenia w budowie!')">
                            <i class="fas fa-pencil-alt"></i> Ćwiczenia
                        </button>
                    </div>
                </div>
            </div>

            <!-- Progress Tracking -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-chart-line me-2"></i>Śledzenie postępów</h3>
                </div>
                <div class="card-body">
                    <p>Monitoruj swoje postępy w nauce</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Statystyki w budowie!')">
                            <i class="fas fa-chart-bar"></i> Statystyki
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="showNotification('info', 'Certyfikaty w budowie!')">
                            <i class="fas fa-certificate"></i> Certyfikaty
                        </button>
                    </div>
                </div>
            </div>

            <!-- Reviews & Feedback -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-star me-2"></i>Opinie i oceny</h3>
                </div>
                <div class="card-body">
                    <p>Oceń swoich lektorów i zobacz opinie</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Moje opinie w budowie!')">
                            <i class="fas fa-comments"></i> Moje opinie
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showNotification('info', 'Oceń lekcję w budowie!')">
                            <i class="fas fa-star"></i> Oceń lekcję
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
            <div class="activity-header">
                <h3><i class="fas fa-history me-2"></i>Ostatnia aktywność</h3>
                <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Historia w budowie!')">
                    Zobacz wszystko
                </button>
            </div>
            <div class="activity-list">
                <div class="activity-item">
                    <div class="activity-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Ukończono lekcję</strong> - Business English z Anną Kowalską</p>
                        <span class="activity-time">2 godziny temu</span>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-icon info">
                        <i class="fas fa-calendar-plus"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Zarezerwowano lekcję</strong> - Konwersacje niemieckie na poniedziałek</p>
                        <span class="activity-time">1 dzień temu</span>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-icon warning">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Nowy poziom</strong> - Awansowałeś na poziom B2 w angielskim!</p>
                        <span class="activity-time">3 dni temu</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Dashboard Specific Styles -->
<style>
.dashboard-container {
    min-height: calc(100vh - 80px);
    background: var(--bg-secondary);
    padding: 2rem 0;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
}

.dashboard-title h1 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    font-size: 2rem;
}

.dashboard-title p {
    color: var(--text-secondary);
    margin: 0;
}

.dashboard-actions {
    display: flex;
    gap: 1rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: var(--bg-primary);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: var(--transition);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.stat-primary .stat-icon { background: var(--primary-pink); }
.stat-success .stat-icon { background: var(--success); }
.stat-warning .stat-icon { background: var(--warning); }
.stat-info .stat-icon { background: var(--info); }

.stat-content h3 {
    font-size: 1.8rem;
    font-weight: var(--font-bold);
    margin-bottom: 0.25rem;
    color: var(--text-primary);
}

.stat-content p {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.stat-change {
    font-size: 0.8rem;
    font-weight: var(--font-medium);
}

.stat-change.positive { color: var(--success); }
.stat-change.negative { color: var(--danger); }
.stat-change.neutral { color: var(--text-light); }

.learning-progress-section {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.section-header h3 {
    margin: 0;
    color: var(--text-primary);
}

.progress-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.progress-card {
    background: var(--bg-secondary);
    padding: 1.5rem;
    border-radius: var(--radius);
    border-left: 4px solid var(--primary-pink);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.progress-header h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.1rem;
}

.level-badge {
    background: var(--primary-gradient);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    font-weight: var(--font-semibold);
}

.progress-bar-container {
    margin-bottom: 1rem;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: var(--radius-full);
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--primary-gradient);
    border-radius: var(--radius-full);
    transition: width 0.5s ease;
}

.progress-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    display: block;
}

.progress-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-light);
}

.upcoming-lessons {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.lessons-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.lesson-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--radius);
    border-left: 4px solid var(--success);
    transition: var(--transition);
}

.lesson-item:hover {
    background: #f1f5f9;
    transform: translateX(4px);
}

.lesson-time {
    text-align: center;
    min-width: 90px;
}

.lesson-time .date {
    display: block;
    font-size: 0.9rem;
    font-weight: var(--font-semibold);
    color: var(--text-primary);
}

.lesson-time .time {
    display: block;
    font-size: 1.1rem;
    font-weight: var(--font-bold);
    color: var(--primary-pink);
}

.lesson-time .duration {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.lesson-content {
    flex: 1;
}

.lesson-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1rem;
}

.lesson-content p {
    margin: 0.25rem 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.lesson-actions {
    display: flex;
    gap: 0.5rem;
}

.management-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.management-card {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    overflow: hidden;
    transition: var(--transition);
}

.management-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.management-card .card-header {
    background: var(--bg-secondary);
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.management-card .card-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.1rem;
}

.management-card .card-body {
    padding: 1.5rem;
}

.management-card .card-body p {
    color: var(--text-secondary);
    margin-bottom: 1rem;
    line-height: var(--leading-relaxed);
}

.quick-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.recent-activity {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: 1.5rem;
}

.activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.activity-header h3 {
    margin: 0;
    color: var(--text-primary);
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--radius);
    transition: var(--transition);
}

.activity-item:hover {
    background: #f1f5f9;
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.activity-icon.success { background: var(--success); }
.activity-icon.info { background: var(--info); }
.activity-icon.warning { background: var(--warning); }

.activity-content p {
    margin: 0 0 0.25rem 0;
    color: var(--text-primary);
    font-size: 0.9rem;
}

.activity-time {
    color: var(--text-light);
    font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .dashboard-header {
        flex-direction: column;
        gap: 1rem;
    }

    .dashboard-actions {
        width: 100%;
        justify-content: stretch;
    }

    .dashboard-actions .btn {
        flex: 1;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .progress-cards {
        grid-template-columns: 1fr;
    }

    .management-grid {
        grid-template-columns: 1fr;
    }

    .lesson-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .lesson-time {
        min-width: auto;
        text-align: left;
    }

    .lesson-actions {
        width: 100%;
        justify-content: stretch;
    }

    .lesson-actions .btn {
        flex: 1;
    }

    .quick-actions {
        justify-content: stretch;
    }

    .quick-actions .btn {
        flex: 1;
    }

    .activity-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .progress-stats {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard stats from API
    loadStudentDashboardStats();

    // Refresh stats every 30 seconds
    setInterval(loadStudentDashboardStats, 30000);
});

async function loadStudentDashboardStats() {
    try {
        const response = await fetch('/api/student/dashboard-stats', {
            headers: {
                'Authorization': `Bearer ${authService.getToken()}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateStudentStatsDisplay(data.data);
        }
    } catch (error) {
        console.error('Error loading student dashboard stats:', error);
    }
}

function updateStudentStatsDisplay(stats) {
    // Update stat cards with real data
    document.getElementById('upcoming-lessons').textContent = stats.upcoming_lessons || 0;
    document.getElementById('completed-lessons').textContent = stats.completed_lessons || 0;
    document.getElementById('learning-progress').textContent = `${stats.learning_progress || 0}%`;
    document.getElementById('favorite-tutors').textContent = stats.favorite_tutors || 0;
}
</script>
@endsection