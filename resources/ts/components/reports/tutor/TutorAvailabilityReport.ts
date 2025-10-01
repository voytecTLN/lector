import { reportsService, AvailabilityReportData } from '@services/ReportsService'
import { NotificationService } from '@utils/NotificationService'

export class TutorAvailabilityReport {
    private reportData: AvailabilityReportData | null = null
    private filters = {
        dateFrom: this.getDefaultDateFrom(),
        dateTo: this.getDefaultDateTo(),
        tutorId: undefined as number | undefined,
        mode: 'net-availability' as 'net-availability'
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
                    <h5 class="card-title mb-3">📋 Filtry raportu</h5>
                    <div class="row g-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label fw-semibold">Data od</label>
                            <input type="date" class="form-control" id="filter-date-from"
                                   value="${this.filters.dateFrom}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-semibold">Data do</label>
                            <input type="date" class="form-control" id="filter-date-to"
                                   value="${this.filters.dateTo}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-semibold">Lektor</label>
                            <select class="form-select" id="filter-tutor">
                                <option value="">🧑‍🏫 Wszyscy lektorzy</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-4 d-flex gap-2 flex-wrap">
                        <button class="btn btn-primary btn-lg" id="generate-report">
                            🔍 Generuj raport
                        </button>
                        <button class="btn btn-outline-success" id="export-csv" disabled>
                            📥 Eksportuj CSV
                        </button>
                        <button class="btn btn-outline-secondary" id="reset-filters">
                            🔄 Resetuj filtry
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

        // Zawsze używaj net availability
        return this.renderNetAvailabilityContent()
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
                        <div class="card bg-info bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-info">${summary.totalAdded - summary.totalRemoved}</h2>
                                <p class="mb-0">Dostępność netto</p>
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
                                <th class="text-center">Godziny (netto)</th>
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
                                        <strong class="${(tutor.net || 0) >= 0 ? 'text-success' : 'text-danger'}">
                                            ${tutor.net || 0}h
                                        </strong>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
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
            mode: 'net-availability'
        }
        
        // Reset pól formularza
        ;(document.getElementById('filter-date-from') as HTMLInputElement).value = this.filters.dateFrom
        ;(document.getElementById('filter-date-to') as HTMLInputElement).value = this.filters.dateTo
        ;(document.getElementById('filter-tutor') as HTMLSelectElement).value = ''
        
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

    private renderNetAvailabilityContent(): string {
        if (!this.reportData) {
            return '<div class="text-center py-5">Brak danych</div>'
        }

        const { summary } = this.reportData
        const slots = this.reportData.slots || []

        return `
            <div class="net-availability-report">
                <div class="report-summary mb-4">
                    <h4 class="mb-3">📊 Podsumowanie</h4>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <div class="card bg-primary bg-opacity-10">
                                <div class="card-body text-center">
                                    <h2 class="text-primary">${(this.reportData.tutors?.reduce((sum, t) => sum + t.added + t.removed, 0)) || 0}</h2>
                                    <p class="mb-0">Wszystkie zmiany</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success bg-opacity-10">
                                <div class="card-body text-center">
                                    <h2 class="text-success">${summary.totalSlots || 0}</h2>
                                    <p class="mb-0">Dostępność netto</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-info bg-opacity-10">
                                <div class="card-body text-center">
                                    <h2 class="text-info">${summary.totalTutors || summary.activeTutors || 0}</h2>
                                    <p class="mb-0">Lektorów</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-secondary bg-opacity-10">
                                <div class="card-body text-center">
                                    <small class="text-muted">Okres</small>
                                    <div class="fw-bold">${this.formatDate(summary.dateRange.from)}</div>
                                    <div class="fw-bold">${this.formatDate(summary.dateRange.to)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tutor-stats mb-4">
                    <h4 class="mb-3">👨‍🏫 Szczegóły według lektorów</h4>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Lektor</th>
                                    <th class="text-center">Dodane</th>
                                    <th class="text-center">Usunięte</th>
                                    <th class="text-center">Godziny (netto)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(this.reportData.tutors || []).map(tutor => `
                                    <tr>
                                        <td><strong>${tutor.tutorName}</strong></td>
                                        <td class="text-center">
                                            <span class="badge bg-success">${tutor.added}</span>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge bg-danger">${tutor.removed}</span>
                                        </td>
                                        <td class="text-center">
                                            <strong class="${(tutor.net || 0) >= 0 ? 'text-success' : 'text-danger'}">
                                                ${tutor.net || 0}h
                                            </strong>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="slots-table mb-4">
                    <h4 class="mb-3">📅 Lista dostępnych slotów</h4>
                    <div class="table-responsive">
                        <table class="table table-hover table-sm">
                            <thead>
                                <tr>
                                    <th style="width: 60px">ID</th>
                                    <th>Lektor</th>
                                    <th style="width: 120px">Data</th>
                                    <th style="width: 140px">Godzina</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${slots.map((slot: any) => `
                                    <tr>
                                        <td class="text-muted">${slot.id}</td>
                                        <td><strong>${slot.tutorName}</strong></td>
                                        <td>${this.formatDate(slot.date)}</td>
                                        <td><code class="small">${slot.timeSlot}</code></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${slots.length === 0 ? '<div class="text-center py-4 text-muted">Brak dostępnych slotów w wybranym okresie</div>' : ''}
                </div>
            </div>
        `
    }

}