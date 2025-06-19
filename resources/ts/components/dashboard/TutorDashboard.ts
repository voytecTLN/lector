// resources/ts/components/dashboard/TutorDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'

export class TutorDashboard implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const user = authService.getUser()
        const el = document.createElement('div')
        el.className = 'tutor-dashboard container mt-5'
        el.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h1 class="mb-4">Panel Lektora</h1>
                    <p class="lead">Witaj, ${user?.name || 'Lektorze'}!</p>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Nadchodzące lekcje</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Ukończone lekcje</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Aktywni studenci</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Zarobki (miesiąc)</h5>
                            <p class="card-text display-4">0 zł</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-5">
                <div class="col-md-8">
                    <h2>Dzisiejszy harmonogram</h2>
                    <div class="alert alert-info">
                        Brak zaplanowanych lekcji na dziś.
                    </div>
                </div>
                <div class="col-md-4">
                    <h2>Szybkie akcje</h2>
                    <div class="list-group">
                        <a href="/lessons/calendar" class="list-group-item list-group-item-action">
                            📅 Mój kalendarz
                        </a>
                        <a href="/students/my" class="list-group-item list-group-item-action">
                            👥 Moi studenci
                        </a>
                        <a href="/profile" class="list-group-item list-group-item-action">
                            ⚙️ Edytuj profil
                        </a>
                        <a href="/availability" class="list-group-item list-group-item-action">
                            🕐 Ustaw dostępność
                        </a>
                    </div>
                </div>
            </div>
        `
        return el
    }

    mount(container: HTMLElement): void {
        // Load dashboard stats
        this.loadStats()
    }

    private async loadStats(): Promise<void> {
        try {
            const response = await fetch('/api/tutor/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Accept': 'application/json'
                }
            })
            const data = await response.json()
            // Update stats in DOM
            console.log('Tutor stats:', data)
        } catch (error) {
            console.error('Failed to load tutor stats:', error)
        }
    }
}