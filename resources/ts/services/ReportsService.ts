import { api } from './ApiService'

export interface ReportFilters {
    dateFrom?: string
    dateTo?: string
    tutorId?: number
    studentId?: number
    action?: string
    status?: string
    format?: 'json' | 'csv' | 'pdf'
    [key: string]: any
}

export interface AvailabilityReportData {
    summary: {
        totalAdded: number
        totalRemoved: number
        totalModified: number
        activeTutors: number
        dateRange: {
            from: string
            to: string
        }
    }
    tutors: Array<{
        tutorId: number
        tutorName: string
        added: number
        removed: number
        modified: number
        lastActivity: string
    }>
    dailyActivity?: Array<{
        date: string
        added: number
        removed: number
        modified: number
    }>
}

export interface LessonsReportData {
    summary: {
        totalScheduled: number
        totalCompleted: number
        totalCancelled: number
        totalInProgress: number
        completionRate: number
        dateRange: {
            from: string
            to: string
        }
    }
    tutors: Array<{
        tutorId: number
        tutorName: string
        scheduled: number
        completed: number
        cancelled: number
        inProgress: number
        completionRate: number
    }>
    statusBreakdown: {
        scheduled: number
        confirmed: number
        in_progress: number
        completed: number
        cancelled: number
        student_cancelled: number
        tutor_cancelled: number
        rescheduled: number
    }
}

export interface StudentActivityReportData {
    summary: {
        totalStudents: number
        activeStudents: number
        totalLessons: number
        averageLessonsPerStudent: number
        dateRange: {
            from: string
            to: string
        }
    }
    students: Array<{
        studentId: number
        studentName: string
        lessonsBooked: number
        lessonsCompleted: number
        lessonsCancelled: number
        lastActivity: string
        registeredAt: string
    }>
    activityTrends?: Array<{
        date: string
        bookings: number
        completions: number
        cancellations: number
    }>
}

class ReportsService {
    /**
     * Pobierz raport dostępności lektorów
     */
    async getTutorAvailabilityReport(filters: ReportFilters): Promise<AvailabilityReportData> {
        try {
            const params = new URLSearchParams()
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    params.append(key, String(filters[key]))
                }
            })

            return await api.get<AvailabilityReportData>(`/reports/tutor-availability?${params.toString()}`)
        } catch (error) {
            console.error('Error fetching availability report:', error)
            throw error
        }
    }

    /**
     * Pobierz raport lekcji lektorów
     */
    async getTutorLessonsReport(filters: ReportFilters): Promise<LessonsReportData> {
        try {
            const params = new URLSearchParams()
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    params.append(key, String(filters[key]))
                }
            })

            return await api.get<LessonsReportData>(`/reports/tutor-lessons?${params.toString()}`)
        } catch (error) {
            console.error('Error fetching lessons report:', error)
            throw error
        }
    }

    /**
     * Pobierz raport aktywności studentów
     */
    async getStudentActivityReport(filters: ReportFilters): Promise<StudentActivityReportData> {
        try {
            const params = new URLSearchParams()
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    params.append(key, String(filters[key]))
                }
            })

            return await api.get<StudentActivityReportData>(`/reports/student-activity?${params.toString()}`)
        } catch (error) {
            console.error('Error fetching student activity report:', error)
            throw error
        }
    }

    /**
     * Eksportuj raport do CSV
     */
    async exportReportToCSV(reportType: string, filters: ReportFilters): Promise<Blob> {
        try {
            const params = new URLSearchParams()
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    params.append(key, String(filters[key]))
                }
            })
            params.append('format', 'csv')

            return await api.get<Blob>(`/reports/${reportType}/export?${params.toString()}`, {}, { responseType: 'blob' })
        } catch (error) {
            console.error('Error exporting report:', error)
            throw error
        }
    }

    /**
     * Pobierz listę dostępnych lektorów (do filtrów)
     */
    async getTutorsList(): Promise<Array<{ id: number; name: string }>> {
        try {
            const data = await api.get<{ tutors: Array<{ id: number; name: string }> }>('/tutors/simple-list')
            return data.tutors || []
        } catch (error) {
            console.error('Error fetching tutors list:', error)
            return []
        }
    }

    /**
     * Pobierz listę dostępnych studentów (do filtrów)
     */
    async getStudentsList(): Promise<Array<{ id: number; name: string }>> {
        try {
            const data = await api.get<{ students: Array<{ id: number; name: string }> }>('/students/simple-list')
            return data.students || []
        } catch (error) {
            console.error('Error fetching students list:', error)
            return []
        }
    }

    /**
     * Zapisz wygenerowany raport w cache
     */
    saveReportToCache(reportType: string, data: any): void {
        try {
            const recentReports = this.getRecentReports()
            const newReport = {
                id: `${reportType}_${Date.now()}`,
                type: reportType,
                title: this.getReportTitle(reportType),
                data: data,
                generatedAt: new Date().toLocaleString('pl-PL'),
                timestamp: Date.now()
            }

            // Dodaj nowy raport na początek
            recentReports.unshift(newReport)

            // Zachowaj tylko 10 ostatnich raportów
            const trimmedReports = recentReports.slice(0, 10)

            localStorage.setItem('recentReports', JSON.stringify(trimmedReports))
        } catch (error) {
            console.error('Error saving report to cache:', error)
        }
    }

    /**
     * Pobierz ostatnie raporty z cache
     */
    getRecentReports(): any[] {
        try {
            const stored = localStorage.getItem('recentReports')
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    }

    /**
     * Pobierz tytuł raportu na podstawie typu
     */
    private getReportTitle(reportType: string): string {
        const titles: { [key: string]: string } = {
            'tutor-availability': 'Dostępności lektorów',
            'tutor-lessons': 'Lekcje lektorów',
            'student-activity': 'Aktywność studentów',
            'student-progress': 'Postępy studentów',
            'system-overview': 'Przegląd systemu'
        }
        return titles[reportType] || 'Raport'
    }

    /**
     * Pobierz raport z cache
     */
    getCachedReport(reportId: string): any | null {
        try {
            const reports = this.getRecentReports()
            return reports.find(r => r.id === reportId) || null
        } catch {
            return null
        }
    }

    /**
     * Usuń raport z cache
     */
    removeCachedReport(reportId: string): void {
        try {
            const reports = this.getRecentReports()
            const filtered = reports.filter(r => r.id !== reportId)
            localStorage.setItem('recentReports', JSON.stringify(filtered))
        } catch (error) {
            console.error('Error removing cached report:', error)
        }
    }
}

export const reportsService = new ReportsService()