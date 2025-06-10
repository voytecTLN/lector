{{-- resources/views/dashboards/moderator.blade.php - Dashboard Moderatora --}}
@extends('layouts.app')

@section('title', 'Panel Moderatora')

@section('content')
<div class="dashboard-container">
    <div class="container">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
            <div class="dashboard-title">
                <h1><i class="fas fa-shield-alt text-primary me-2"></i>Panel Moderatora</h1>
                <p>Moderuj treści i zarządzaj społecznością</p>
            </div>
            <div class="dashboard-actions">
                <button class="btn btn-primary" onclick="showNotification('info', 'Moderacja treści w budowie!')">
                    <i class="fas fa-eye me-2"></i>Moderuj treści
                </button>
                <button class="btn btn-outline-primary" onclick="showNotification('info', 'Raporty w budowie!')">
                    <i class="fas fa-flag me-2"></i>Zgłoszenia
                </button>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="stats-grid">
            <div class="stat-card stat-warning">
                <div class="stat-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-content">
                    <h3 id="pending-reviews">0</h3>
                    <p>Oczekujące przeglądy</p>
                    <span class="stat-change neutral">Do sprawdzenia</span>
                </div>
            </div>

            <div class="stat-card stat-danger">
                <div class="stat-icon">
                    <i class="fas fa-flag"></i>
                </div>
                <div class="stat-content">
                    <h3 id="reported-content">0</h3>
                    <p>Zgłoszone treści</p>
                    <span class="stat-change positive">-2 od wczoraj</span>
                </div>
            </div>

            <div class="stat-card stat-success">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-content">
                    <h3 id="resolved-reports">0</h3>
                    <p>Rozwiązane dzisiaj</p>
                    <span class="stat-change positive">+8 dzisiaj</span>
                </div>
            </div>

            <div class="stat-card stat-info">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-content">
                    <h3 id="active-users">0</h3>
                    <p>Aktywni użytkownicy</p>
                    <span class="stat-change positive">+5% w tym tygodniu</span>
                </div>
            </div>
        </div>

        <!-- Pending Tasks -->
        <div class="pending-tasks">
            <div class="section-header">
                <h3><i class="fas fa-tasks me-2"></i>Zadania do wykonania</h3>
                <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Wszystkie zadania w budowie!')">
                    Zobacz wszystkie
                </button>
            </div>
            <div class="tasks-list">
                <div class="task-item priority-high">
                    <div class="task-priority">
                        <span class="priority-badge high">Wysoka</span>
                    </div>
                    <div class="task-content">
                        <h4>Sprawdź zgłoszenie - Nieodpowiedni język</h4>
                        <p><i class="fas fa-user me-1"></i>Zgłoszenie od: Anna Kowalska</p>
                        <p><i class="fas fa-clock me-1"></i>Dotyczy lekcji z 2024-06-09</p>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-success" onclick="showNotification('success', 'Zaakceptowano zgłoszenie!')">
                            <i class="fas fa-check"></i> Zatwierdź
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="showNotification('info', 'Odrzucono zgłoszenie!')">
                            <i class="fas fa-times"></i> Odrzuć
                        </button>
                    </div>
                </div>

                <div class="task-item priority-medium">
                    <div class="task-priority">
                        <span class="priority-badge medium">Średnia</span>
                    </div>
                    <div class="task-content">
                        <h4>Weryfikacja profilu lektora</h4>
                        <p><i class="fas fa-chalkboard-teacher me-1"></i>Nowy lektor: Piotr Schmidt</p>
                        <p><i class="fas fa-certificate me-1"></i>Certyfikaty do sprawdzenia</p>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-success" onclick="showNotification('success', 'Profil zatwierdzony!')">
                            <i class="fas fa-check"></i> Zatwierdź
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="showNotification('warning', 'Wysłano prośbę o poprawki!')">
                            <i class="fas fa-edit"></i> Poprawki
                        </button>
                    </div>
                </div>

                <div class="task-item priority-low">
                    <div class="task-priority">
                        <span class="priority-badge low">Niska</span>
                    </div>
                    <div class="task-content">
                        <h4>Przegląd materiałów dydaktycznych</h4>
                        <p><i class="fas fa-book me-1"></i>10 nowych materiałów do sprawdzenia</p>
                        <p><i class="fas fa-calendar me-1"></i>Termin: do końca tygodnia</p>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-primary" onclick="showNotification('info', 'Przegląd materiałów w budowie!')">
                            <i class="fas fa-eye"></i> Przejrzyj
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="showNotification('info', 'Szczegóły w budowie!')">
                            <i class="fas fa-info"></i> Szczegóły
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Management Sections -->
        <div class="management-grid">
            <!-- Content Moderation -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-eye me-2"></i>Moderacja treści</h3>
                </div>
                <div class="card-body">
                    <p>Sprawdzaj i moderuj treści publikowane na platformie</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-primary" onclick="showNotification('info', 'Kolejka moderacji w budowie!')">
                            <i class="fas fa-list"></i> Kolejka
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showNotification('info', 'Zgłoszenia w budowie!')">
                            <i class="fas fa-flag"></i> Zgłoszenia
                        </button>
                    </div>
                </div>
            </div>

            <!-- User Management -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-users-cog me-2"></i>Zarządzanie użytkownikami</h3>
                </div>
                <div class="card-body">
                    <p>Moderuj zachowania użytkowników i zarządzaj kontami</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Lista użytkowników w budowie!')">
                            <i class="fas fa-users"></i> Użytkownicy
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="showNotification('info', 'Zablokowane konta w budowie!')">
                            <i class="fas fa-ban"></i> Blokady
                        </button>
                    </div>
                </div>
            </div>

            <!-- Quality Control -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-medal me-2"></i>Kontrola jakości</h3>
                </div>
                <div class="card-body">
                    <p>Monitoruj jakość lekcji i materiałów edukacyjnych</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Oceny jakości w budowie!')">
                            <i class="fas fa-star"></i> Oceny
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showNotification('info', 'Audyt w budowie!')">
                            <i class="fas fa-search"></i> Audyt
                        </button>
                    </div>
                </div>
            </div>

            <!-- Community Guidelines -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-gavel me-2"></i>Zasady społeczności</h3>
                </div>
                <div class="card-body">
                    <p>Egzekwuj zasady społeczności i regulamin platformy</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Regulamin w budowie!')">
                            <i class="fas fa-book"></i> Regulamin
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showNotification('info', 'Ostrzeżenia w budowie!')">
                            <i class="fas fa-exclamation"></i> Ostrzeżenia
                        </button>
                    </div>
                </div>
            </div>

            <!-- Analytics -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-chart-pie me-2"></i>Analityka moderacji</h3>
                </div>
                <div class="card-body">
                    <p>Przeglądaj statystyki i trendy moderacji</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Raporty w budowie!')">
                            <i class="fas fa-chart-bar"></i> Raporty
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showNotification('info', 'Trendy w budowie!')">
                            <i class="fas fa-trending-up"></i> Trendy
                        </button>
                    </div>
                </div>
            </div>

            <!-- Support Tickets -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-life-ring me-2"></i>Zgłoszenia pomocy</h3>
                </div>
                <div class="card-body">
                    <p>Odpowiadaj na pytania i rozwiązuj problemy użytkowników</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Tickets w budowie!')">
                            <i class="fas fa-ticket-alt"></i> Tickets
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="showNotification('info', 'FAQ w budowie!')">
                            <i class="fas fa-question"></i> FAQ
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
            <div class="activity-header">
                <h3><i class="fas fa-history me-2"></i>Ostatnia aktywność moderacji</h3>
                <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Historia moderacji w budowie!')">
                    Zobacz wszystko
                </button>
            </div>
            <div class="activity-list">
                <div class="activity-item">
                    <div class="activity-icon success">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Zatwierdzono profil</strong> - Profil lektora Maria Silva został zatwierdzony</p>
                        <span class="activity-time">30 minut temu</span>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-icon warning">
                        <i class="fas fa-flag"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Nowe zgłoszenie</strong> - Zgłoszenie nieodpowiedniego zachowania podczas lekcji</p>
                        <span class="activity-time">1 godzinę temu</span>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-icon info">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Zaktualizowano materiały</strong> - Poprawiono 5 materiałów dydaktycznych</p>
                        <span class="activity-time">2 godziny temu</span>
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

.stat-warning .stat-icon { background: var(--warning); }
.stat-danger .stat-icon { background: var(--danger); }
.stat-success .stat-icon { background: var(--success); }
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

.pending-tasks {
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

.tasks-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.task-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--radius);
    transition: var(--transition);
}

.task-item:hover {
    background: #f1f5f9;
    transform: translateX(4px);
}

.task-item.priority-high {
    border-left: 4px solid var(--danger);
}

.task-item.priority-medium {
    border-left: 4px solid var(--warning);
}

.task-item.priority-low {
    border-left: 4px solid var(--info);
}

.task-priority {
    min-width: 80px;
}

.priority-badge {
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: var(--font-semibold);
    text-transform: uppercase;
}

.priority-badge.high {
    background: var(--danger);
    color: white;
}

.priority-badge.medium {
    background: var(--warning);
    color: white;
}

.priority-badge.low {
    background: var(--info);
    color: white;
}

.task-content {
    flex: 1;
}

.task-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1rem;
}

.task-content p {
    margin: 0.25rem 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.task-actions {
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

    .task-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .task-priority {
        min-width: auto;
    }

    .task-actions {
        width: 100%;
        justify-content: stretch;
    }

    .task-actions .btn {
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
    loadModeratorDashboardStats();

    // Refresh stats every 30 seconds
    setInterval(loadModeratorDashboardStats, 30000);
});

async function loadModeratorDashboardStats() {
    try {
        const response = await fetch('/api/moderator/dashboard-stats', {
            headers: {
                'Authorization': `Bearer ${authService.getToken()}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateModeratorStatsDisplay(data.data);
        }
    } catch (error) {
        console.error('Error loading moderator dashboard stats:', error);
    }
}

function updateModeratorStatsDisplay(stats) {
    // Update stat cards with real data
    document.getElementById('pending-reviews').textContent = stats.pending_reviews || 0;
    document.getElementById('reported-content').textContent = stats.reported_content || 0;
    document.getElementById('resolved-reports').textContent = stats.resolved_reports || 0;
    document.getElementById('active-users').textContent = stats.active_users || 0;
}
</script>
@endsection