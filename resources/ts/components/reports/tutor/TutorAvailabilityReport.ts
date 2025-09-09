import { reportsService, AvailabilityReportData } from '@services/ReportsService'
import { NotificationService } from '@utils/NotificationService'

export class TutorAvailabilityReport {
    private reportData: AvailabilityReportData | null = null
    private filters = {
        dateFrom: this.getDefaultDateFrom(),
        dateTo: this.getDefaultDateTo(),
        tutorId: undefined as number | undefined,
        action: undefined as string | undefined
    }

    public async render(): Promise<string> {
        return `
            <div class="tutor-availability-report">
                <div class="report-header mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>📊 Raport: Dostępności Lektorów</h3>
                            <p class="text-muted">Analiza zmian w harmonogramach dostępności</p>
                        </div>
                        <button class="btn btn-outline-secondary" id="back-to-hub">
                            ← Powrót do listy
                        </button>
                    </div>
                </div>

                ${this.renderFilters()}
                
                <div id="report-content">
                    <div class="text-center py-5">
                        <p class="text-muted">Wybierz filtry i kliknij "Generuj raport"</p>
                    </div>
                </div>
            </div>
        `
    }

    private renderFilters(): string {
        return `
            <div class="report-filters card mb-4">
                <div class="card-body">
                    <h5 class="card-title mb-3">Filtry raportu</h5>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Data od</label>
                            <input type="date" class="form-control" id="filter-date-from" 
                                   value="${this.filters.dateFrom}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Data do</label>
                            <input type="date" class="form-control" id="filter-date-to" 
                                   value="${this.filters.dateTo}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Lektor</label>
                            <select class="form-select" id="filter-tutor">
                                <option value="">Wszyscy</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Akcja</label>
                            <select class="form-select" id="filter-action">
                                <option value="">Wszystkie</option>
                                <option value="added">Dodane</option>
                                <option value="deleted">Usunięte</option>
                                <option value="updated">Zmodyfikowane</option>
                                <option value="bulk_update">Zbiorcza aktualizacja</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-3 d-flex gap-2">
                        <button class="btn btn-primary" id="generate-report">
                            🔍 Generuj raport
                        </button>
                        <button class="btn btn-outline-success" id="export-csv" disabled>
                            📥 Eksportuj CSV
                        </button>
                        <button class="btn btn-outline-secondary" id="reset-filters">
                            Resetuj filtry
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    private renderReportContent(): string {
        if (!this.reportData) {
            return '<div class="text-center py-5">Brak danych</div>'
        }

        return `
            ${this.renderSummary()}
            ${this.renderTutorStats()}
            ${this.renderDailyActivityChart()}
        `
    }

    private renderSummary(): string {
        if (!this.reportData) return ''
        
        const { summary } = this.reportData
        
        return `
            <div class="report-summary mb-4">
                <h4 class="mb-3">📊 Podsumowanie</h4>
                <div class="row g-3">
                    <div class="col-md-3">
                        <div class="card bg-success bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-success">${summary.totalAdded}</h2>
                                <p class="mb-0">Dodane sloty</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-danger">${summary.totalRemoved}</h2>
                                <p class="mb-0">Usunięte sloty</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-warning">${summary.totalModified}</h2>
                                <p class="mb-0">Zmodyfikowane</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-primary bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-primary">${summary.activeTutors}</h2>
                                <p class="mb-0">Aktywnych lektorów</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-2 text-muted">
                    Okres: ${this.formatDate(summary.dateRange.from)} - ${this.formatDate(summary.dateRange.to)}
                </div>
            </div>
        `
    }

    private renderTutorStats(): string {
        if (!this.reportData || !this.reportData.tutors.length) return ''
        
        return `
            <div class="tutor-stats mb-4">
                <h4 class="mb-3">👨‍🏫 Szczegóły według lektorów</h4>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Lektor</th>
                                <th class="text-center">Dodane</th>
                                <th class="text-center">Usunięte</th>
                                <th class="text-center">Zmienione</th>
                                <th class="text-center">Suma zmian</th>
                                <th>Ostatnia aktywność</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.reportData.tutors.map(tutor => `
                                <tr>
                                    <td><strong>${tutor.tutorName}</strong></td>
                                    <td class="text-center">
                                        <span class="badge bg-success">${tutor.added}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-danger">${tutor.removed}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-warning">${tutor.modified}</span>
                                    </td>
                                    <td class="text-center">
                                        <strong>${tutor.added + tutor.removed + tutor.modified}</strong>
                                    </td>
                                    <td class="text-muted">${tutor.lastActivity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `
    }

    private renderDailyActivityChart(): string {
        if (!this.reportData || !this.reportData.dailyActivity) return ''
        
        return `
            <div class="daily-activity mb-4">
                <h4 class="mb-3">📈 Aktywność dzienna</h4>
                <div class="card">
                    <div class="card-body">
                        <canvas id="daily-activity-chart" width="400" height="150"></canvas>
                    </div>
                </div>
            </div>
        `
    }

    public async attachEventListeners(): Promise<void> {
        // Powrót do hub'a
        document.getElementById('back-to-hub')?.addEventListener('click', () => {
            window.location.href = '/admin/dashboard?section=raporty'
        })

        // Generowanie raportu
        document.getElementById('generate-report')?.addEventListener('click', async () => {
            await this.generateReport()
        })

        // Eksport CSV
        document.getElementById('export-csv')?.addEventListener('click', async () => {
            await this.exportToCSV()
        })

        // Reset filtrów
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetFilters()
        })

        // Obsługa zmian filtrów
        document.getElementById('filter-date-from')?.addEventListener('change', (e) => {
            this.filters.dateFrom = (e.target as HTMLInputElement).value
        })

        document.getElementById('filter-date-to')?.addEventListener('change', (e) => {
            this.filters.dateTo = (e.target as HTMLInputElement).value
        })

        document.getElementById('filter-tutor')?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value
            this.filters.tutorId = value ? parseInt(value) : undefined
        })

        document.getElementById('filter-action')?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value
            this.filters.action = value || undefined
        })

        // Załaduj listę lektorów
        await this.loadTutorsList()
    }

    private async generateReport(): Promise<void> {
        const contentDiv = document.getElementById('report-content')
        if (!contentDiv) return

        try {
            contentDiv.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Generowanie raportu...</p></div>'
            
            this.reportData = await reportsService.getTutorAvailabilityReport(this.filters)
            
            contentDiv.innerHTML = this.renderReportContent()
            
            // Włącz przycisk eksportu
            const exportBtn = document.getElementById('export-csv') as HTMLButtonElement
            if (exportBtn) exportBtn.disabled = false
            
            // Zapisz raport w cache
            reportsService.saveReportToCache('tutor-availability', this.reportData)
            
            // Renderuj wykres jeśli są dane
            if (this.reportData.dailyActivity) {
                this.renderChart()
            }
            
        } catch (error) {
            console.error('Error generating report:', error)
            contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    Błąd podczas generowania raportu. Spróbuj ponownie.
                </div>
            `
        }
    }

    private async exportToCSV(): Promise<void> {
        try {
            const blob = await reportsService.exportReportToCSV('tutor-availability', this.filters)
            
            // Utwórz link do pobrania
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `dostepnosci_lektorow_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            
            NotificationService.success('Raport został wyeksportowany')
        } catch (error) {
            console.error('Error exporting report:', error)
            NotificationService.error('Błąd podczas eksportowania raportu')
        }
    }

    private resetFilters(): void {
        this.filters = {
            dateFrom: this.getDefaultDateFrom(),
            dateTo: this.getDefaultDateTo(),
            tutorId: undefined,
            action: undefined
        }
        
        // Reset pól formularza
        ;(document.getElementById('filter-date-from') as HTMLInputElement).value = this.filters.dateFrom
        ;(document.getElementById('filter-date-to') as HTMLInputElement).value = this.filters.dateTo
        ;(document.getElementById('filter-tutor') as HTMLSelectElement).value = ''
        ;(document.getElementById('filter-action') as HTMLSelectElement).value = ''
        
        // Wyczyść raport
        const contentDiv = document.getElementById('report-content')
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="text-center py-5">
                    <p class="text-muted">Wybierz filtry i kliknij "Generuj raport"</p>
                </div>
            `
        }
        
        // Wyłącz przycisk eksportu
        const exportBtn = document.getElementById('export-csv') as HTMLButtonElement
        if (exportBtn) exportBtn.disabled = true
    }

    private async loadTutorsList(): Promise<void> {
        try {
            const tutors = await reportsService.getTutorsList()
            const select = document.getElementById('filter-tutor') as HTMLSelectElement
            
            if (select && tutors.length > 0) {
                select.innerHTML = '<option value="">Wszyscy</option>' +
                    tutors.map(t => `<option value="${t.id}">${t.name}</option>`).join('')
            }
        } catch (error) {
            console.error('Error loading tutors list:', error)
        }
    }

    private renderChart(): void {
        // TODO: Implementacja wykresu Chart.js
        console.log('Chart rendering would go here')
    }

    private getDefaultDateFrom(): string {
        const date = new Date()
        date.setMonth(date.getMonth() - 1)
        return date.toISOString().split('T')[0]
    }

    private getDefaultDateTo(): string {
        return new Date().toISOString().split('T')[0]
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString)
        return date.toLocaleDateString('pl-PL')
    }
}