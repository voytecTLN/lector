import { reportsService, StudentActivityReportData } from '@services/ReportsService'
import { NotificationService } from '@utils/NotificationService'

export class StudentActivityReport {
    private reportData: StudentActivityReportData | null = null
    private filters = {
        dateFrom: this.getDefaultDateFrom(),
        dateTo: this.getDefaultDateTo(),
        studentId: undefined as number | undefined
    }

    public async render(): Promise<string> {
        return `
            <div class="student-activity-report">
                <div class="report-header mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>👨‍🎓 Raport: Aktywność Studentów</h3>
                            <p class="text-muted">Rezerwacje, uczestnictwo i postępy w nauce</p>
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
                        <div class="col-md-6">
                            <label class="form-label">Student</label>
                            <select class="form-select" id="filter-student">
                                <option value="">Wszyscy</option>
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
            ${this.renderStudentStats()}
            ${this.renderActivityTrends()}
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
                                <h2 class="text-primary">${summary.totalStudents}</h2>
                                <p class="mb-0">Wszystkich studentów</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-success">${summary.activeStudents}</h2>
                                <p class="mb-0">Aktywnych</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-info">${summary.totalLessons}</h2>
                                <p class="mb-0">Lekcji ogółem</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning bg-opacity-10">
                            <div class="card-body text-center">
                                <h2 class="text-warning">${summary.averageLessonsPerStudent}</h2>
                                <p class="mb-0">Średnio lekcji/student</p>
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

    private renderStudentStats(): string {
        if (!this.reportData || !this.reportData.students.length) return ''
        
        return `
            <div class="student-stats mb-4">
                <h4 class="mb-3">📚 Aktywność poszczególnych studentów</h4>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th class="text-center">Zarezerwowane</th>
                                <th class="text-center">Ukończone</th>
                                <th class="text-center">Anulowane</th>
                                <th>Ostatnia aktywność</th>
                                <th>Data rejestracji</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.reportData.students.map(student => `
                                <tr>
                                    <td><strong>${student.studentName}</strong></td>
                                    <td class="text-center">
                                        <span class="badge bg-primary">${student.lessonsBooked}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-success">${student.lessonsCompleted}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-danger">${student.lessonsCancelled}</span>
                                    </td>
                                    <td class="text-muted">${student.lastActivity}</td>
                                    <td class="text-muted">${student.registeredAt}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `
    }

    private renderActivityTrends(): string {
        if (!this.reportData || !this.reportData.activityTrends) return ''
        
        return `
            <div class="activity-trends mb-4">
                <h4 class="mb-3">📈 Trendy aktywności</h4>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Wizualizacja trendów będzie dostępna w kolejnej wersji
                </div>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th class="text-center">Rezerwacje</th>
                                <th class="text-center">Ukończone</th>
                                <th class="text-center">Anulowane</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.reportData.activityTrends.slice(0, 7).map(trend => `
                                <tr>
                                    <td>${this.formatDate(trend.date)}</td>
                                    <td class="text-center">${trend.bookings}</td>
                                    <td class="text-center">${trend.completions}</td>
                                    <td class="text-center">${trend.cancellations}</td>
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

        document.getElementById('filter-student')?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value
            this.filters.studentId = value ? parseInt(value) : undefined
        })

        // Załaduj listę studentów
        await this.loadStudentsList()
    }

    private async generateReport(): Promise<void> {
        const contentDiv = document.getElementById('report-content')
        if (!contentDiv) return

        try {
            contentDiv.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Generowanie raportu...</p></div>'
            
            this.reportData = await reportsService.getStudentActivityReport(this.filters)
            
            contentDiv.innerHTML = this.renderReportContent()
            
            // Włącz przycisk eksportu
            const exportBtn = document.getElementById('export-csv') as HTMLButtonElement
            if (exportBtn) exportBtn.disabled = false
            
            // Zapisz raport w cache
            reportsService.saveReportToCache('student-activity', this.reportData)
            
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
            const blob = await reportsService.exportReportToCSV('student-activity', this.filters)
            
            // Utwórz link do pobrania
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `aktywnosc_studentow_${new Date().toISOString().split('T')[0]}.csv`
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
            studentId: undefined
        }
        
        // Reset pól formularza
        ;(document.getElementById('filter-date-from') as HTMLInputElement).value = this.filters.dateFrom
        ;(document.getElementById('filter-date-to') as HTMLInputElement).value = this.filters.dateTo
        ;(document.getElementById('filter-student') as HTMLSelectElement).value = ''
        
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

    private async loadStudentsList(): Promise<void> {
        try {
            const students = await reportsService.getStudentsList()
            const select = document.getElementById('filter-student') as HTMLSelectElement
            
            if (select && students.length > 0) {
                select.innerHTML = '<option value="">Wszyscy</option>' +
                    students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
            }
        } catch (error) {
            console.error('Error loading students list:', error)
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