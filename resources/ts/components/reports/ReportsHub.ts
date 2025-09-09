export interface ReportCard {
    id: string
    title: string
    icon: string
    description: string
    category: 'tutor' | 'student' | 'system'
    route: string
    badge?: string
}

export class ReportsHub {
    private reports: ReportCard[] = [
        {
            id: 'tutor-availability',
            title: 'Dostępności lektorów',
            icon: '📅',
            description: 'Analiza zmian w harmonogramach dostępności lektorów',
            category: 'tutor',
            route: '&report=tutor-availability'
        },
        {
            id: 'tutor-lessons',
            title: 'Lekcje lektorów',
            icon: '📚',
            description: 'Statystyki lekcji - zaplanowane, zakończone, anulowane',
            category: 'tutor',
            route: '&report=tutor-lessons'
        },
        {
            id: 'student-activity',
            title: 'Aktywność studentów',
            icon: '👨‍🎓',
            description: 'Rezerwacje, uczestnictwo, anulowania',
            category: 'student',
            route: '&report=student-activity'
        },
        {
            id: 'student-progress',
            title: 'Postępy studentów',
            icon: '📈',
            description: 'Analiza postępów w nauce',
            category: 'student',
            route: '&report=student-progress',
            badge: 'Wkrótce'
        },
        {
            id: 'system-overview',
            title: 'Przegląd systemu',
            icon: '⚙️',
            description: 'Ogólne statystyki platformy',
            category: 'system',
            route: '&report=system-overview',
            badge: 'Wkrótce'
        }
    ]

    public render(): string {
        const recentReports = this.getRecentReports()
        
        return `
            <div class="reports-hub">
                <div class="reports-header mb-4">
                    <h2 class="mb-3">📊 Raporty Systemu</h2>
                    <p class="text-muted">Wybierz raport do wygenerowania i analizy danych</p>
                </div>

                <div class="reports-categories">
                    ${this.renderCategory('tutor', '👨‍🏫 Lektorzy', 'primary')}
                    ${this.renderCategory('student', '👨‍🎓 Studenci', 'success')}
                    ${this.renderCategory('system', '⚙️ System', 'secondary')}
                </div>

                ${recentReports.length > 0 ? this.renderRecentReports(recentReports) : ''}
            </div>
        `
    }

    private renderCategory(category: 'tutor' | 'student' | 'system', title: string, colorClass: string): string {
        const categoryReports = this.reports.filter(r => r.category === category)
        
        return `
            <div class="report-category mb-4">
                <h4 class="mb-3 text-${colorClass}">${title}</h4>
                <div class="row">
                    ${categoryReports.map(report => this.renderReportCard(report, colorClass)).join('')}
                </div>
            </div>
        `
    }

    private renderReportCard(report: ReportCard, colorClass: string): string {
        const isDisabled = report.badge === 'Wkrótce'
        
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card report-card ${isDisabled ? 'disabled' : 'clickable'}" 
                     ${!isDisabled ? `data-report="${report.id}"` : ''}>
                    <div class="card-body">
                        <div class="d-flex align-items-start justify-content-between">
                            <div>
                                <div class="report-icon mb-2" style="font-size: 2rem;">
                                    ${report.icon}
                                </div>
                                <h5 class="card-title">${report.title}</h5>
                                ${report.badge ? `<span class="badge bg-warning text-dark">${report.badge}</span>` : ''}
                            </div>
                        </div>
                        <p class="card-text text-muted small mt-2">
                            ${report.description}
                        </p>
                        ${!isDisabled ? `
                            <button class="btn btn-sm btn-outline-${colorClass} mt-2 generate-report-btn" 
                                    data-report="${report.id}">
                                Generuj raport →
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `
    }

    private renderRecentReports(reports: any[]): string {
        return `
            <div class="recent-reports mt-5">
                <h4 class="mb-3">📋 Ostatnio wygenerowane</h4>
                <div class="list-group">
                    ${reports.map(report => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${report.title}</strong>
                                <small class="text-muted d-block">
                                    Wygenerowano: ${report.generatedAt}
                                </small>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary me-2 view-cached-report" 
                                        data-report-id="${report.id}">
                                    Podgląd
                                </button>
                                <button class="btn btn-sm btn-outline-success download-report" 
                                        data-report-id="${report.id}">
                                    📥 Pobierz
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
    }

    private getRecentReports(): any[] {
        // TODO: Pobierz z localStorage lub API
        const stored = localStorage.getItem('recentReports')
        if (stored) {
            try {
                return JSON.parse(stored).slice(0, 3)
            } catch {
                return []
            }
        }
        return []
    }

    public attachEventListeners(): void {
        // Obsługa kliknięć w karty raportów
        document.querySelectorAll('.generate-report-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault()
                const reportId = (e.currentTarget as HTMLElement).dataset.report
                if (reportId) {
                    this.navigateToReport(reportId)
                }
            })
        })

        // Obsługa kart klikalnych
        document.querySelectorAll('.report-card.clickable').forEach(card => {
            card.addEventListener('click', (e) => {
                const target = e.target as HTMLElement
                if (!target.classList.contains('btn')) {
                    const reportId = (card as HTMLElement).dataset.report
                    if (reportId) {
                        this.navigateToReport(reportId)
                    }
                }
            })
        })

        // Obsługa podglądu zapisanych raportów
        document.querySelectorAll('.view-cached-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportId = (e.currentTarget as HTMLElement).dataset.reportId
                if (reportId) {
                    this.viewCachedReport(reportId)
                }
            })
        })

        // Obsługa pobierania raportów
        document.querySelectorAll('.download-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportId = (e.currentTarget as HTMLElement).dataset.reportId
                if (reportId) {
                    this.downloadReport(reportId)
                }
            })
        })
    }

    private navigateToReport(reportId: string): void {
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
            window.location.href = `/admin/dashboard?section=raporty${report.route}`
        }
    }

    private viewCachedReport(reportId: string): void {
        // TODO: Implementacja podglądu zapisanego raportu
        console.log('Viewing cached report:', reportId)
    }

    private downloadReport(reportId: string): void {
        // TODO: Implementacja pobierania raportu
        console.log('Downloading report:', reportId)
    }
}