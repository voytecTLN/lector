import { reportsService, LessonsReportData } from '@services/ReportsService'
import { NotificationService } from '@utils/NotificationService'
import { BadgeRenderer } from '@utils/BadgeRenderer'

export class TutorLessonsReport {
    private reportData: LessonsReportData | null = null
    private badgeRenderer = new BadgeRenderer()
    private filters = {
        dateFrom: this.getDefaultDateFrom(),
        dateTo: this.getDefaultDateTo(),
        tutorId: undefined as number | undefined,
        status: undefined as string | undefined
    }

    public async render(): Promise<string> {
        return `
            <div class="tutor-lessons-report">
                <div class="report-header mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>📚 Raport: Lekcje Lektorów</h3>
                            <p class="text-muted">Statystyki lekcji - zaplanowane, zakończone, anulowane</p>
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
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filter-status">
                                <option value="">Wszystkie</option>
                                <option value="scheduled">Zaplanowane</option>
                                <option value="confirmed">Potwierdzone</option>
                                <option value="in_progress">W trakcie</option>
                                <option value="completed">Zakończone</option>
                                <option value="cancelled">Anulowane</option>
                                <option value="student_cancelled">Anulowane przez studenta</option>
                                <option value="tutor_cancelled">Anulowane przez lektora</option>
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
            ${this.renderStatusBreakdown()}
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
                        <div class="card bg-primary bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-primary">${summary.totalScheduled}</h2>
                                <p class="mb-0">Zaplanowane</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-success">${summary.totalCompleted}</h2>
                                <p class="mb-0">Zakończone</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-danger">${summary.totalCancelled}</h2>
                                <p class="mb-0">Anulowane</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-info">${summary.completionRate}%</h2>
                                <p class="mb-0">Skuteczność</p>
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
                <h4 class="mb-3">👨‍🏫 Statystyki lektorów</h4>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Lektor</th>
                                <th class="text-center">Zaplanowane</th>
                                <th class="text-center">Zakończone</th>
                                <th class="text-center">Anulowane</th>
                                <th class="text-center">W toku</th>
                                <th class="text-center">Skuteczność</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.reportData.tutors.map(tutor => `
                                <tr>
                                    <td><strong>${tutor.tutorName}</strong></td>
                                    <td class="text-center">
                                        <span class="badge bg-primary">${tutor.scheduled}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-success">${tutor.completed}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-danger">${tutor.cancelled}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-info">${tutor.inProgress}</span>
                                    </td>
                                    <td class="text-center">
                                        ${this.renderCompletionRate(tutor.completionRate)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `
    }

    private renderStatusBreakdown(): string {
        if (!this.reportData || !this.reportData.statusBreakdown) return ''
        
        const breakdown = this.reportData.statusBreakdown
        
        return `
            <div class="status-breakdown mb-4">
                <h4 class="mb-3">📋 Podział według statusów</h4>
                <div class="row g-3">
                    ${this.renderStatusCard('Zaplanowane', breakdown.scheduled, 'secondary')}
                    ${this.renderStatusCard('Potwierdzone', breakdown.confirmed, 'primary')}
                    ${this.renderStatusCard('W trakcie', breakdown.in_progress, 'info')}
                    ${this.renderStatusCard('Zakończone', breakdown.completed, 'success')}
                    ${this.renderStatusCard('Anulowane', breakdown.cancelled, 'danger')}
                    ${this.renderStatusCard('Anulowane (student)', breakdown.student_cancelled, 'warning')}
                    ${this.renderStatusCard('Anulowane (lektor)', breakdown.tutor_cancelled, 'warning')}
                    ${this.renderStatusCard('Przełożone', breakdown.rescheduled, 'secondary')}
                </div>
            </div>
        `
    }

    private renderStatusCard(label: string, count: number, color: string): string {
        return `
            <div class="col-md-3">
                <div class="card border-${color}">
                    <div class="card-body text-center">
                        <h5 class="text-${color}">${count}</h5>
                        <small class="text-muted">${label}</small>
                    </div>
                </div>
            </div>
        `
    }

    private renderCompletionRate(rate: number): string {
        let badgeClass = 'bg-danger'
        if (rate >= 90) badgeClass = 'bg-success'
        else if (rate >= 75) badgeClass = 'bg-warning'
        else if (rate >= 50) badgeClass = 'bg-info'
        
        return `<span class="badge ${badgeClass}">${rate}%</span>`
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

        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value
            this.filters.status = value || undefined
        })

        // Załaduj listę lektorów
        await this.loadTutorsList()
    }

    private async generateReport(): Promise<void> {
        const contentDiv = document.getElementById('report-content')
        if (!contentDiv) return

        try {
            contentDiv.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Generowanie raportu...</p></div>'
            
            this.reportData = await reportsService.getTutorLessonsReport(this.filters)
            
            contentDiv.innerHTML = this.renderReportContent()
            
            // Włącz przycisk eksportu
            const exportBtn = document.getElementById('export-csv') as HTMLButtonElement
            if (exportBtn) exportBtn.disabled = false
            
            // Zapisz raport w cache
            reportsService.saveReportToCache('tutor-lessons', this.reportData)
            
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
            const blob = await reportsService.exportReportToCSV('tutor-lessons', this.filters)
            
            // Utwórz link do pobrania
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `lekcje_lektorow_${new Date().toISOString().split('T')[0]}.csv`
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
            status: undefined
        }
        
        // Reset pól formularza
        ;(document.getElementById('filter-date-from') as HTMLInputElement).value = this.filters.dateFrom
        ;(document.getElementById('filter-date-to') as HTMLInputElement).value = this.filters.dateTo
        ;(document.getElementById('filter-tutor') as HTMLSelectElement).value = ''
        ;(document.getElementById('filter-status') as HTMLSelectElement).value = ''
        
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