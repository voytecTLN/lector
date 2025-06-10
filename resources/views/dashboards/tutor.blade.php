{{-- resources/views/dashboards/tutor.blade.php - Dashboard Lektora --}}
@extends('layouts.app')

@section('title', 'Panel Lektora')

@section('content')
<div class="dashboard-container">
    <div class="container">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
            <div class="dashboard-title">
                <h1><i class="fas fa-chalkboard-teacher text-primary me-2"></i>Panel Lektora</h1>
                <p>Zarządzaj swoimi lekcjami i studentami</p>
            </div>
            <div class="dashboard-actions">
                <button class="btn btn-primary" onclick="showNotification('info', 'Dodawanie lekcji w budowie!')">
                    <i class="fas fa-plus me-2"></i>Dodaj lekcję
                </button>
                <button class="btn btn-outline-primary" onclick="showNotification('info', 'Kalendarz w budowie!')">
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
                <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Pełny kalendarz w budowie!')">
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
                        <button class="btn btn-sm btn-success" onclick="showNotification('success', 'Rozpoczęto lekcję!')">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="showNotification('info', 'Szczegóły w budowie!')">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>

                <div class="schedule-item">
                    <div class="schedule-time">
                        <span class="time">14:30</span>
                        <span class="duration">45 min</span>
                    </div>
                    <div class="schedule-content">
                        <h4>Konwersacje niemiecki - poziom A2</h4>
                        <p><i class="fas fa-user me-1"></i>Piotr Nowak</p>
                        <p><i class="fas fa-comments me-1"></i>Rozmowa o hobby</p>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn btn-sm btn-primary" onclick="showNotification('info', 'Za 2 godziny')">
                            <i class="fas fa-clock"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="showNotification('info', 'Szczegóły w budowie!')">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>

                <div class="schedule-item">
                    <div class="schedule-time">
                        <span class="time">18:00</span>
                        <span class="duration">60 min</span>
                    </div>
                    <div class="schedule-content">
                        <h4>Przygotowanie do egzaminu IELTS</h4>
                        <p><i class="fas fa-user me-1"></i>Maria Silva</p>
                        <p><i class="fas fa-graduation-cap me-1"></i>Writing Task 2</p>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn btn-sm btn-primary" onclick="showNotification('info', 'Za 6 godzin')">
                            <i class="fas fa-clock"></i>
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
            <!-- Lesson Management -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-calendar-alt me-2"></i>Zarządzanie lekcjami</h3>
                </div>
                <div class="card-body">
                    <p>Planuj, edytuj i prowadź swoje lekcje</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-primary" onclick="showNotification('info', 'Nowa lekcja w budowie!')">
                            <i class="fas fa-plus"></i> Nowa lekcja
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Lista lekcji w budowie!')">
                            <i class="fas fa-list"></i> Wszystkie lekcje
                        </button>
                    </div>
                </div>
            </div>

            <!-- Student Management -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-users me-2"></i>Moi studenci</h3>
                </div>
                <div class="card-body">
                    <p>Monitoruj postępy i zarządzaj studentami</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Lista studentów w budowie!')">
                            <i class="fas fa-list"></i> Zobacz studentów
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showNotification('info', 'Postępy w budowie!')">
                            <i class="fas fa-chart-line"></i> Postępy
                        </button>
                    </div>
                </div>
            </div>

            <!-- Profile & Availability -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-user-edit me-2"></i>Profil i dostępność</h3>
                </div>
                <div class="card-body">
                    <p>Edytuj swój profil i ustaw dostępność</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Edycja profilu w budowie!')">
                            <i class="fas fa-edit"></i> Edytuj profil
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showNotification('info', 'Harmonogram w budowie!')">
                            <i class="fas fa-calendar"></i> Harmonogram
                        </button>
                    </div>
                </div>
            </div>

            <!-- Materials & Resources -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-book me-2"></i>Materiały i zasoby</h3>
                </div>
                <div class="card-body">
                    <p>Zarządzaj materiałami dydaktycznymi</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Materiały w budowie!')">
                            <i class="fas fa-folder"></i> Moje materiały
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="showNotification('info', 'Upload w budowie!')">
                            <i class="fas fa-upload"></i> Dodaj materiał
                        </button>
                    </div>
                </div>
            </div>

            <!-- Analytics -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-chart-bar me-2"></i>Statystyki</h3>
                </div>
                <div class="card-body">
                    <p>Analizuj swoje wyniki i zarobki</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Raporty w budowie!')">
                            <i class="fas fa-file-alt"></i> Raporty
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showNotification('info', 'Zarobki w budowie!')">
                            <i class="fas fa-money-bill"></i> Zarobki
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
                    <p>Zobacz opinie studentów i oceń swoje lekcje</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Opinie w budowie!')">
                            <i class="fas fa-comments"></i> Opinie
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showNotification('info', 'Oceny w budowie!')">
                            <i class="fas fa-star"></i> Średnia: 4.8
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
                        <p><strong>Nowa rezerwacja</strong> - Piotr Nowak zarezerwował lekcję na jutro</p>
                        <span class="activity-time">4 godziny temu</span>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-icon warning">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Nowa ocena</strong> - Maria Silva oceniła lekcję na 5 gwiazdek</p>
                        <span class="activity-time">1 dzień temu</span>
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

.today-schedule {
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

.schedule-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.schedule-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--radius);
    border-left: 4px solid var(--primary-pink);
    transition: var(--transition);
}

.schedule-item:hover {
    background: #f1f5f9;
    transform: translateX(4px);
}

.schedule-time {
    text-align: center;
    min-width: 80px;
}

.schedule-time .time {
    display: block;
    font-size: 1.2rem;
    font-weight: var(--font-bold);
    color: var(--text-primary);
}

.schedule-time .duration {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.schedule-content {
    flex: 1;
}

.schedule-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1rem;
}

.schedule-content p {
    margin: 0.25rem 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.schedule-actions {
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

    .management-grid {
        grid-template-columns: 1fr;
    }

    .schedule-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .schedule-time {
        min-width: auto;
        text-align: left;
    }

    .schedule-actions {
        width: 100%;
        justify-content: stretch;
    }

    .schedule-actions .btn {
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
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard stats from API
    loadTutorDashboardStats();

    // Refresh stats every 30 seconds
    setInterval(loadTutorDashboardStats, 30000);
});

async function loadTutorDashboardStats() {
    try {
        const response = await fetch('/api/tutor/dashboard-stats', {
            headers: {
                'Authorization': `Bearer ${authService.getToken()}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateTutorStatsDisplay(data.data);
        }
    } catch (error) {
        console.error('Error loading tutor dashboard stats:', error);
    }
}

function updateTutorStatsDisplay(stats) {
    // Update stat cards with real data
    document.getElementById('upcoming-lessons').textContent = stats.upcoming_lessons || 0;
    document.getElementById('completed-lessons').textContent = stats.completed_lessons || 0;
    document.getElementById('total-earnings').textContent = `${stats.total_earnings || 0} zł`;
    document.getElementById('student-count').textContent = stats.student_count || 0;
}
</script>
@endsection