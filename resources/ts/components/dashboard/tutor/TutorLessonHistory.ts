import { LessonService } from '@services/LessonService'
import { LessonDetailsModal } from '@components/modals/LessonDetailsModal'
import { AvatarHelper } from '@/utils/AvatarHelper'

interface HistoricalLesson {
    id: number
    student_id: number
    student: {
        id: number
        name: string
        email: string
        avatar?: string
    }
    lesson_date: string
    start_time: string
    end_time: string
    duration_minutes: number
    status: string
    topic: string
    language: string
    lesson_type: string
    is_paid: boolean
    student_rating?: number
    student_feedback?: string
    cancelled_at?: string
    cancelled_by?: string
    cancellation_reason?: string
    completed_at?: string
}

export class TutorLessonHistory {
    private lessons: HistoricalLesson[] = []
    private filteredLessons: HistoricalLesson[] = []
    private currentFilter = {
        status: 'all',
        student: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    }
    
    constructor() {
        // Make methods available globally for onclick handlers
        (window as any).TutorLessonHistory = TutorLessonHistory
    }
    
    public applyStudentFilter(studentName: string): void {
        // Set the student filter
        this.currentFilter.student = studentName
        
        // Update the input field when it becomes available
        setTimeout(() => {
            const studentInput = document.getElementById('student-filter') as HTMLInputElement
            if (studentInput) {
                studentInput.value = studentName
                // Trigger the static filter method which handles the proper flow
                TutorLessonHistory.applyFilters()
            }
        }, 200)
    }
    
    public getHistoryContent(): string {
        // Trigger async loading
        this.loadLessonHistory()
        
        return `
            <div class="tutor-content-area">
                ${this.renderStats()}
                ${this.renderFilters()}
                
                <div id="lesson-history-container">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Ładowanie...</span>
                        </div>
                        <p class="mt-2">Ładowanie historii lekcji...</p>
                    </div>
                </div>
            </div>
        `
    }
    
    private renderStats(): string {
        return `
            <div class="row mb-4" id="history-stats">
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-primary bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-calendar-check text-primary fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="total-lessons">-</h4>
                            <p class="text-muted small mb-0">Wszystkie lekcje</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-success bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-check-circle text-success fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="completed-lessons">-</h4>
                            <p class="text-muted small mb-0">Zakończone</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-warning bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-x-circle text-warning fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="cancelled-lessons">-</h4>
                            <p class="text-muted small mb-0">Anulowane</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-info bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-clock text-info fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="total-hours">-</h4>
                            <p class="text-muted small mb-0">Łączne godziny</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private renderFilters(): string {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label for="status-filter" class="form-label">Status</label>
                            <select id="status-filter" class="form-select">
                                <option value="all">Wszystkie</option>
                                <option value="completed">Zakończone</option>
                                <option value="cancelled">Anulowane</option>
                                <option value="no_show">Nieobecność</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="student-filter" class="form-label">Student</label>
                            <input type="text" id="student-filter" class="form-control" placeholder="Szukaj studenta...">
                        </div>
                        <div class="col-md-2">
                            <label for="date-from" class="form-label">Od daty</label>
                            <input type="date" id="date-from" class="form-control">
                        </div>
                        <div class="col-md-2">
                            <label for="date-to" class="form-label">Do daty</label>
                            <input type="date" id="date-to" class="form-control">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">&nbsp;</label>
                            <button class="btn btn-primary w-100" onclick="TutorLessonHistory.applyFilters()">
                                <i class="bi bi-funnel me-2"></i>Filtruj
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private async loadLessonHistory(): Promise<void> {
        try {
            const params = {
                type: 'past', // Get past lessons from backend
                status: this.currentFilter.status !== 'all' ? this.currentFilter.status : undefined,
                date_from: this.currentFilter.dateFrom || undefined,
                date_to: this.currentFilter.dateTo || undefined
            }
            
            const response = await LessonService.getTutorLessons(params)
            
            // Handle different response formats
            if (Array.isArray(response)) {
                this.lessons = response
            } else if (response.data?.lessons) {
                this.lessons = response.data.lessons
            } else if (response.lessons) {
                this.lessons = response.lessons
            } else if (response.data && Array.isArray(response.data)) {
                this.lessons = response.data
            } else {
                console.error('Unexpected response format:', response)
                this.lessons = []
            }
            
            
            // Backend handles filtering and sorting
            
            this.filteredLessons = [...this.lessons]
            this.applyLocalFilters()
            this.renderLessons()
            this.updateStats()
            
        } catch (error) {
            console.error('Error loading lesson history:', error)
            this.renderError()
        }
    }
    
    private applyLocalFilters(): void {
        this.filteredLessons = this.lessons.filter(lesson => {
            // Status filter
            if (this.currentFilter.status !== 'all' && lesson.status !== this.currentFilter.status) {
                return false
            }
            
            // Student filter
            if (this.currentFilter.student) {
                const searchTerm = this.currentFilter.student.toLowerCase()
                if (!lesson.student.name.toLowerCase().includes(searchTerm) &&
                    !lesson.student.email.toLowerCase().includes(searchTerm)) {
                    return false
                }
            }
            
            // Date filters
            if (this.currentFilter.dateFrom) {
                if (lesson.lesson_date < this.currentFilter.dateFrom) {
                    return false
                }
            }
            if (this.currentFilter.dateTo) {
                if (lesson.lesson_date > this.currentFilter.dateTo) {
                    return false
                }
            }
            
            return true
        })
    }
    
    private renderLessons(): void {
        const container = document.getElementById('lesson-history-container')
        if (!container) return
        
        if (this.filteredLessons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-calendar-x" style="font-size: 3rem; color: #6c757d;"></i>
                    </div>
                    <h5>Brak lekcji w historii</h5>
                    <p class="text-muted">Nie znaleziono lekcji spełniających kryteria filtrowania.</p>
                </div>
            `
            return
        }
        
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Data i godzina</th>
                            <th>Student</th>
                            <!-- <th>Temat</th> -->
                            <th>Status</th>
                            <th>Ocena</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredLessons.map(lesson => this.renderLessonRow(lesson)).join('')}
                    </tbody>
                </table>
            </div>
        `
        
        container.innerHTML = tableHtml
    }
    
    private renderLessonRow(lesson: HistoricalLesson): string {
        const formatDate = (date: string) => {
            return new Date(date).toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        }
        
        const formatTime = (time: string) => {
            return time.substring(0, 5)
        }
        
        const getStatusBadge = (status: string) => {
            const statusMap: Record<string, { text: string; class: string }> = {
                completed: { text: 'Zakończona', class: 'badge bg-success' },
                cancelled: { text: 'Anulowana', class: 'badge bg-danger' },
                no_show: { text: 'Nieobecność', class: 'badge bg-warning text-dark' },
                not_started: { text: 'Nie rozpoczęta', class: 'badge bg-dark' },
                scheduled: { text: 'Zaplanowana', class: 'badge bg-primary' },
                in_progress: { text: 'W trakcie', class: 'badge bg-info' },
                technical_issues: { text: 'Problemy techniczne', class: 'badge bg-secondary' },
                no_show_student: { text: 'Student nieobecny', class: 'badge bg-warning text-dark' },
                no_show_tutor: { text: 'Lektor nieobecny', class: 'badge bg-warning text-dark' }
            }
            const statusInfo = statusMap[status] || { text: status, class: 'badge bg-secondary' }
            return `<span class="${statusInfo.class}">${statusInfo.text}</span>`
        }
        
        const getRatingStars = (rating?: number) => {
            if (!rating) return '<span class="text-muted">-</span>'
            const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
            return `<span class="text-warning">${stars}</span>`
        }
        
        return `
            <tr>
                <td>
                    <div class="fw-bold">${formatDate(lesson.lesson_date)}</div>
                    <div class="small text-muted">${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}</div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            ${AvatarHelper.render({
                                name: lesson.student.name,
                                avatar: lesson.student.avatar,
                                size: 'sm',
                                userId: lesson.student.id
                            })}
                        </div>
                        <div>
                            <div>${lesson.student.name}</div>
                            <div class="small text-muted">${lesson.student.email}</div>
                        </div>
                    </div>
                </td>
                <!-- <td>${lesson.topic}</td> -->
                <td>${getStatusBadge(lesson.status)}</td>
                <td>${getRatingStars(lesson.student_rating)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="LessonDetailsModal.show(${lesson.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `
    }
    
    private updateStats(): void {
        const totalLessons = this.lessons.length
        const completedLessons = this.lessons.filter(l => l.status === 'completed').length
        const cancelledLessons = this.lessons.filter(l => l.status === 'cancelled').length
        const totalHours = this.lessons
            .filter(l => l.status === 'completed')
            .reduce((sum, l) => sum + (l.duration_minutes / 60), 0)
        
        const updateStat = (id: string, value: number | string) => {
            const element = document.getElementById(id)
            if (element) element.textContent = value.toString()
        }
        
        updateStat('total-lessons', totalLessons)
        updateStat('completed-lessons', completedLessons)
        updateStat('cancelled-lessons', cancelledLessons)
        updateStat('total-hours', totalHours.toFixed(1) + 'h')
    }
    
    private renderError(): void {
        const container = document.getElementById('lesson-history-container')
        if (!container) return
        
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Błąd</h4>
                <p>Nie udało się załadować historii lekcji.</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
            </div>
        `
    }
    
    // Static methods for onclick handlers
    static applyFilters(): void {
        const instance = (window as any).currentTutorLessonHistoryInstance
        if (!instance) return
        
        instance.currentFilter = {
            status: (document.getElementById('status-filter') as HTMLSelectElement)?.value || 'all',
            student: (document.getElementById('student-filter') as HTMLInputElement)?.value || '',
            dateFrom: (document.getElementById('date-from') as HTMLInputElement)?.value || '',
            dateTo: (document.getElementById('date-to') as HTMLInputElement)?.value || '',
            search: ''
        }
        
        instance.loadLessonHistory()
    }
    
    static async exportHistory(): Promise<void> {
        try {
            const blob = await LessonService.exportLessons('csv', {
                role: 'tutor',
                type: 'past'
            })
            
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `historia_lekcji_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Historia lekcji została wyeksportowana'
                }
            }))
        } catch (error) {
            console.error('Export error:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas eksportowania historii'
                }
            }))
        }
    }
}