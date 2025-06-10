{{-- resources/views/dashboards/admin.blade.php - Dashboard Administratora --}}
@extends('layouts.app')

@section('title', 'Panel Administratora')

@section('content')
<div class="dashboard-container">
    <div class="container">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
            <div class="dashboard-title">
                <h1><i class="fas fa-tachometer-alt text-primary me-2"></i>Panel Administratora</h1>
                <p>Zarządzaj platformą i monitoruj jej działanie</p>
            </div>
            <div class="dashboard-actions">
                <button class="btn btn-primary" onclick="showNotification('info', 'Funkcja w budowie!')">
                    <i class="fas fa-plus me-2"></i>Dodaj użytkownika
                </button>
                <button class="btn btn-outline-primary" onclick="showNotification('info', 'Eksport danych w budowie!')">
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
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Lista użytkowników w budowie!')">
                            <i class="fas fa-list"></i> Zobacz wszystkich
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="showNotification('info', 'Dodawanie użytkownika w budowie!')">
                            <i class="fas fa-user-plus"></i> Dodaj nowego
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tutor Management -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-chalkboard-teacher me-2"></i>Zarządzanie lektorami</h3>
                </div>
                <div class="card-body">
                    <p>Weryfikacja i zarządzanie profilami lektorów</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Lista lektorów w budowie!')">
                            <i class="fas fa-list"></i> Zobacz lektorów
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showNotification('info', 'Weryfikacja w budowie!')">
                            <i class="fas fa-check-circle"></i> Do weryfikacji
                        </button>
                    </div>
                </div>
            </div>

            <!-- Student Management -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-graduation-cap me-2"></i>Zarządzanie studentami</h3>
                </div>
                <div class="card-body">
                    <p>Monitorowanie aktywności i postępów studentów</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Lista studentów w budowie!')">
                            <i class="fas fa-list"></i> Zobacz studentów
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showNotification('info', 'Statystyki w budowie!')">
                            <i class="fas fa-chart-bar"></i> Statystyki
                        </button>
                    </div>
                </div>
            </div>

            <!-- System Settings -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-cogs me-2"></i>Ustawienia systemu</h3>
                </div>
                <div class="card-body">
                    <p>Konfiguracja platformy i ustawienia globalne</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Ustawienia w budowie!')">
                            <i class="fas fa-cog"></i> Konfiguracja
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="showNotification('info', 'Backup w budowie!')">
                            <i class="fas fa-database"></i> Backup
                        </button>
                    </div>
                </div>
            </div>

            <!-- Analytics -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-chart-line me-2"></i>Analityka</h3>
                </div>
                <div class="card-body">
                    <p>Raporty i statystyki działania platformy</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Raporty w budowie!')">
                            <i class="fas fa-file-alt"></i> Raporty
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showNotification('info', 'Wykresy w budowie!')">
                            <i class="fas fa-chart-pie"></i> Wykresy
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content Management -->
            <div class="management-card">
                <div class="card-header">
                    <h3><i class="fas fa-edit me-2"></i>Zarządzanie treścią</h3>
                </div>
                <div class="card-body">
                    <p>Edycja materiałów edukacyjnych i zawartości strony</p>
                    <div class="quick-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Materiały w budowie!')">
                            <i class="fas fa-book"></i> Materiały
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="showNotification('info', 'CMS w budowie!')">
                            <i class="fas fa-plus"></i> Dodaj treść
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
            <div class="activity-header">
                <h3><i class="fas fa-history me-2"></i>Ostatnia aktywność</h3>
                <button class="btn btn-sm btn-outline-primary" onclick="showNotification('info', 'Historia aktywności w budowie!')">
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
                <div class="activity-item">
                    <div class="activity-icon warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Profil do weryfikacji</strong> - Nowy lektor oczekuje na zatwierdzenie</p>
                        <span class="activity-time">1 godzinę temu</span>
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
    loadDashboardStats();

    // Refresh stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
});

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard-stats', {
            headers: {
                'Authorization': `Bearer ${authService.getToken()}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateStatsDisplay(data.data);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function updateStatsDisplay(stats) {
    // Update stat cards with real data
    document.getElementById('users-count').textContent = stats.users_count || 0;
    document.getElementById('active-lessons').textContent = stats.active_lessons || 0;
    document.getElementById('total-revenue').textContent = `${stats.total_revenue || 0} zł`;
    document.getElementById('pending-approvals').textContent = stats.pending_approvals || 0;
}
</script>
@endsection