// resources/ts/components/dashboard/ModeratorDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'

export class ModeratorDashboard implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const user = authService.getUser()
        const el = document.createElement('div')
        el.className = 'moderator-dashboard container mt-5'
        el.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h1 class="mb-4">Panel Moderatora</h1>
                    <p class="lead">Witaj, ${user?.name || 'Moderatorze'}!</p>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Oczekujące zgłoszenia</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Aktywni użytkownicy</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Zgłoszone treści</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Rozwiązane sprawy</h5>
                            <p class="card-text display-4">0</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-5">
                <div class="col-12">
                    <h2>Szybkie akcje</h2>
                    <div class="list-group">
                        <a href="/admin/students" class="list-group-item list-group-item-action">
                            📋 Zarządzaj studentami
                        </a>
                        <a href="/admin/tutors" class="list-group-item list-group-item-action disabled">
                            👩‍🏫 Zarządzaj lektorami
                            <span class="badge bg-secondary float-end">Wkrótce</span>
                        </a>
                        <a href="/reports" class="list-group-item list-group-item-action disabled">
                            📊 Przeglądaj zgłoszenia
                            <span class="badge bg-secondary float-end">Wkrótce</span>
                        </a>
                        <a href="/content/moderation" class="list-group-item list-group-item-action disabled">
                            🛡️ Moderacja treści
                            <span class="badge bg-secondary float-end">Wkrótce</span>
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
            const response = await fetch('/api/moderator/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Accept': 'application/json'
                }
            })
            const data = await response.json()
            // Update stats in DOM
            console.log('Moderator stats:', data)
        } catch (error) {
            console.error('Failed to load moderator stats:', error)
        }
    }
}