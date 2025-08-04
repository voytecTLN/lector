import { api } from '@services/ApiService'
import { formatDate } from '@utils/date'

export class TutorLessons {
    private currentView: 'calendar' | 'list' = 'calendar'
    private currentWeekOffset = 0
    private lessons: any[] = []
    
    public getUpcomingLessonsContent(): string {
        // Load upcoming lessons
        this.loadUpcomingLessons()
        
        return `
            <div class="tutor-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Nadchodzące lekcje</h2>
                </div>
                
                <div id="upcoming-lessons-container">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Ładowanie...</span>
                        </div>
                        <p class="mt-2">Ładowanie nadchodzących lekcji...</p>
                    </div>
                </div>
            </div>
        `
    }
    
    public getCalendarContent(): string {
        // Trigger async loading
        this.loadLessons()
        
        return `
            <div class="tutor-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Kalendarz lekcji</h2>
                    <div class="btn-group" role="group">
                        <button class="btn ${this.currentView === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick="TutorLessons.switchView('calendar')">
                            <i class="bi bi-calendar3 me-2"></i>Kalendarz
                        </button>
                        <!--
                        <button class="btn ${this.currentView === 'list' ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick="TutorLessons.switchView('list')">
                            <i class="bi bi-list-ul me-2"></i>Lista
                        </button>
                        -->
                    </div>
                </div>
                
                <div id="lessons-container">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Ładowanie...</span>
                        </div>
                        <p class="mt-2">Ładowanie lekcji...</p>
                    </div>
                </div>
            </div>
        `
    }
    
    private async loadUpcomingLessons(): Promise<void> {
        try {
            const response = await api.get<{success: boolean, data: {lessons: any[]}, message?: string}>('/tutor/lessons/upcoming')
            const upcomingLessons = response.data?.lessons || []
            
            const container = document.getElementById('upcoming-lessons-container')
            if (!container) return
            
            if (upcomingLessons.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        Nie masz żadnych nadchodzących lekcji.
                    </div>
                `
                return
            }
            
            // Render upcoming lessons list
            container.innerHTML = `
                <div class="row">
                    ${upcomingLessons.map(lesson => this.renderUpcomingLessonCard(lesson)).join('')}
                </div>
            `
        } catch (error) {
            console.error('Failed to load upcoming lessons:', error)
            const container = document.getElementById('upcoming-lessons-container')
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Błąd podczas ładowania nadchodzących lekcji.
                    </div>
                `
            }
        }
    }
    
    private renderUpcomingLessonCard(lesson: any): string {
        const lessonDate = new Date(lesson.lesson_date)
        const startTime = lesson.start_time
        const endTime = lesson.end_time
        
        // Style based on lesson status
        const isCompleted = lesson.status === 'completed'
        const isInProgress = lesson.status === 'in_progress'
        const cardClass = isCompleted ? 'border-success opacity-75' : isInProgress ? 'border-primary' : ''
        const titleClass = isCompleted ? 'text-success' : ''
        
        // Get the appropriate status badge
        let statusBadge = ''
        switch (lesson.status) {
            case 'scheduled':
                statusBadge = '<span class="badge bg-primary">Zaplanowana</span>'
                break
            case 'completed':
                statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Zakończona</span>'
                break
            case 'in_progress':
                statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-play-circle me-1"></i>W trakcie</span>'
                break
            default:
                statusBadge = `<span class="badge bg-secondary">${lesson.status}</span>`
        }
        
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 lesson-card ${cardClass}" onclick="console.log('🎯 Lesson clicked:', ${lesson.id}, ${JSON.stringify(lesson).replace(/"/g, '&quot;')}); LessonDetailsModal.show(${lesson.id})" style="cursor: pointer; transition: transform 0.2s;">
                    <div class="card-body">
                        <h5 class="card-title ${titleClass}">
                            <i class="bi bi-person-circle me-2"></i>
                            ${lesson.student?.name || 'Student'}
                        </h5>
                        <p class="card-text">
                            <small class="text-muted">
                                <i class="bi bi-calendar me-1"></i>
                                ${lessonDate.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </small><br>
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>
                                ${startTime} - ${endTime}
                            </small><br>
                            <small class="text-muted">
                                <i class="bi bi-translate me-1"></i>
                                ${lesson.language || 'Nieznany język'}
                            </small>
                        </p>
                        ${statusBadge}
                        ${isCompleted ? '<div class="mt-2"><small class="text-muted"><i class="bi bi-check-all me-1"></i>Lekcja została zakończona</small></div>' : ''}
                    </div>
                </div>
            </div>
        `
    }
    
    private async loadLessons(): Promise<void> {
        try {
            const response = await api.get<{success: boolean, data: {lessons: any[]}, message?: string}>('/tutor/lessons/my-lessons')
            this.lessons = response.data?.lessons || []
            
            if (this.currentView === 'calendar') {
                this.renderCalendarView()
            } else {
                this.renderListView()
            }
        } catch (error) {
            console.error('Error loading lessons:', error)
            this.renderError()
        }
    }
    
    private renderCalendarView(): void {
        const container = document.getElementById('lessons-container')
        if (!container) return
        
        const today = new Date()
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay() + 1 + (this.currentWeekOffset * 7)) // Monday
        
        const weekDays = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart)
            day.setDate(weekStart.getDate() + i)
            weekDays.push(day)
        }
        
        container.innerHTML = `
            <div class="calendar-navigation mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn btn-outline-primary" onclick="TutorLessons.previousWeek()">
                        <i class="bi bi-chevron-left"></i> Poprzedni tydzień
                    </button>
                    <h4>${this.formatWeekRange(weekStart)}</h4>
                    <button class="btn btn-outline-primary" onclick="TutorLessons.nextWeek()">
                        Następny tydzień <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <div class="calendar-grid">
                <div class="calendar-header">
                    ${weekDays.map(day => `
                        <div class="calendar-header-day ${this.isToday(day) ? 'today' : ''}">
                            <div class="day-name">${this.getDayName(day)}</div>
                            <div class="day-date">${day.getDate()}.${(day.getMonth() + 1).toString().padStart(2, '0')}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="calendar-body">
                    ${weekDays.map(day => this.renderDayColumn(day)).join('')}
                </div>
            </div>
            
            <div class="mt-4">
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">Statystyki tygodnia</h6>
                                <div class="d-flex justify-content-between">
                                    <span>Zaplanowane lekcje:</span>
                                    <strong>${this.getWeekLessonsCount(weekStart, 'scheduled')}</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Godzin łącznie:</span>
                                    <strong>${this.getWeekHours(weekStart)}</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Liczba studentów:</span>
                                    <strong>${this.getWeekStudentsCount(weekStart)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.renderCalendarStyles()}
        `
    }
    
    private renderDayColumn(day: Date): string {
        const dayStr = formatDate(day)
        const dayLessons = this.lessons.filter(lesson => {
            let lessonDateStr = lesson.lesson_date
            if (lessonDateStr.includes('T')) {
                lessonDateStr = lessonDateStr.split('T')[0]
            }
            return lessonDateStr === dayStr
        }).sort((a, b) => {
            // Extract just the time for comparison
            let aTime = a.start_time
            let bTime = b.start_time
            if (aTime.includes(' ')) aTime = aTime.split(' ')[1].substring(0, 5)
            if (bTime.includes(' ')) bTime = bTime.split(' ')[1].substring(0, 5)
            return aTime.localeCompare(bTime)
        })
        
        const slots = []
        for (let hour = 8; hour < 22; hour++) {
            const hourStr = hour.toString().padStart(2, '0') + ':00'
            const lesson = dayLessons.find(l => {
                // Handle different time formats that might come from API
                let lessonTime = l.start_time
                if (lessonTime.includes(' ')) {
                    lessonTime = lessonTime.split(' ')[1] // Extract time part if datetime
                }
                if (lessonTime.length > 5) {
                    lessonTime = lessonTime.substring(0, 5) // Truncate seconds if present (HH:MM:SS -> HH:MM)
                }
                return lessonTime === hourStr
            })
            
            if (lesson) {
                slots.push(this.renderLessonSlot(lesson))
            } else {
                slots.push(`<div class="time-slot empty"></div>`)
            }
        }
        
        return `<div class="day-column">${slots.join('')}</div>`
    }
    
    private renderLessonSlot(lesson: any): string {
        const statusClass = this.getStatusClass(lesson.status)
        const canModify = lesson.status === 'scheduled' && this.canModifyLesson(lesson)
        
        return `
            <div class="time-slot lesson ${statusClass}" data-lesson-id="${lesson.id}">
                <div class="lesson-time">${this.formatTime(lesson.start_time)} - ${this.formatTime(lesson.end_time)}</div>
                <div class="lesson-student">
                    <i class="bi bi-person me-1"></i>${lesson.student?.name || 'Student'}
                </div>
                ${lesson.topic ? `<div class="lesson-topic small">${lesson.topic}</div>` : ''}
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="TutorLessons.viewDetails(${lesson.id})" title="Szczegóły">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${canModify ? `
                        <button class="btn btn-sm btn-success" onclick="TutorLessons.completeLesson(${lesson.id})" title="Oznacz jako zakończoną">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="TutorLessons.markNoShow(${lesson.id})" title="Nieobecność">
                            <i class="bi bi-x-lg"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="TutorLessons.cancelLesson(${lesson.id})" title="Anuluj">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `
    }
    
    private renderListView(): void {
        const container = document.getElementById('lessons-container')
        if (!container) return
        
        const upcomingLessons = this.lessons.filter(l => l.status === 'scheduled')
            .sort((a, b) => {
                const dateCompare = a.lesson_date.localeCompare(b.lesson_date)
                return dateCompare !== 0 ? dateCompare : a.start_time.localeCompare(b.start_time)
            })
        
        if (upcomingLessons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-calendar-x" style="font-size: 3rem; color: #6c757d;"></i>
                    </div>
                    <h5>Brak zaplanowanych lekcji</h5>
                    <p class="text-muted">Nie masz jeszcze żadnych zaplanowanych lekcji.</p>
                </div>
            `
            return
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Godzina</th>
                            <th>Student</th>
                            <th>Temat</th>
                            <th>Typ</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${upcomingLessons.map(lesson => this.renderLessonRow(lesson)).join('')}
                    </tbody>
                </table>
            </div>
        `
    }
    
    private renderLessonRow(lesson: any): string {
        const lessonDate = new Date(lesson.lesson_date)
        const statusBadge = this.getStatusBadge(lesson.status)
        const canModify = lesson.status === 'scheduled' && this.canModifyLesson(lesson)
        
        return `
            <tr>
                <td>${lessonDate.toLocaleDateString('pl-PL')}</td>
                <td>${this.formatTime(lesson.start_time)} - ${this.formatTime(lesson.end_time)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-placeholder-small bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 30px; height: 30px;">
                            ${lesson.student?.name?.charAt(0) || 'S'}
                        </div>
                        ${lesson.student?.name || 'Student'}
                    </div>
                </td>
                <td>${lesson.topic || '-'}</td>
                <td><span class="badge bg-secondary">${this.getLessonTypeName(lesson.lesson_type)}</span></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="TutorLessons.viewDetails(${lesson.id})" title="Szczegóły">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${canModify ? `
                            <button class="btn btn-outline-success" onclick="TutorLessons.completeLesson(${lesson.id})" title="Oznacz jako zakończoną">
                                <i class="bi bi-check"></i>
                            </button>
                            <button class="btn btn-outline-warning" onclick="TutorLessons.markNoShow(${lesson.id})" title="Nieobecność">
                                <i class="bi bi-x-lg"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="TutorLessons.cancelLesson(${lesson.id})" title="Anuluj">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `
    }
    
    private renderError(): void {
        const container = document.getElementById('lessons-container')
        if (!container) return
        
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Błąd</h4>
                <p>Nie udało się załadować kalendarza lekcji.</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
            </div>
        `
    }
    
    private renderCalendarStyles(): string {
        return `
            <style>
                .calendar-grid {
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .calendar-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: #f8f9fa;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .calendar-header-day {
                    padding: 15px;
                    text-align: center;
                    border-right: 1px solid #dee2e6;
                }
                
                .calendar-header-day:last-child {
                    border-right: none;
                }
                
                .calendar-header-day.today {
                    background: #e3f2fd;
                    font-weight: bold;
                }
                
                .day-name {
                    font-weight: bold;
                    color: #495057;
                }
                
                .day-date {
                    color: #6c757d;
                    font-size: 0.9em;
                }
                
                .calendar-body {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    min-height: 600px;
                }
                
                .day-column {
                    border-right: 1px solid #dee2e6;
                    display: flex;
                    flex-direction: column;
                }
                
                .day-column:last-child {
                    border-right: none;
                }
                
                .time-slot {
                    flex: 1;
                    border-bottom: 1px solid #e9ecef;
                    padding: 5px;
                    min-height: 60px;
                    position: relative;
                }
                
                .time-slot.empty {
                    background: #fff;
                }
                
                .time-slot.lesson {
                    background: #e8f4fd;
                    border-left: 4px solid #2196f3;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .time-slot.lesson:hover {
                    background: #d1e7fd;
                }
                
                .time-slot.lesson.completed {
                    background: #d4edda;
                    border-left-color: #28a745;
                }
                
                .time-slot.lesson.cancelled {
                    background: #f8d7da;
                    border-left-color: #dc3545;
                    opacity: 0.7;
                }
                
                .time-slot.lesson.no_show {
                    background: #fff3cd;
                    border-left-color: #ffc107;
                }
                
                .lesson-time {
                    font-weight: bold;
                    font-size: 0.85em;
                    color: #495057;
                }
                
                .lesson-student {
                    font-size: 0.85em;
                    color: #6c757d;
                    margin-top: 2px;
                }
                
                .lesson-topic {
                    font-style: italic;
                    color: #6c757d;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .lesson-actions {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    display: none;
                }
                
                .time-slot.lesson:hover .lesson-actions {
                    display: flex;
                    gap: 5px;
                }
                
                .lesson-actions .btn {
                    padding: 2px 6px;
                    font-size: 0.75em;
                }
            </style>
        `
    }
    
    // Helper methods
    
    private formatWeekRange(weekStart: Date): string {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        const startMonth = weekStart.toLocaleDateString('pl-PL', { month: 'long' })
        const endMonth = weekEnd.toLocaleDateString('pl-PL', { month: 'long' })
        const year = weekStart.getFullYear()
        
        if (startMonth === endMonth) {
            return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth} ${year}`
        } else {
            return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth} ${year}`
        }
    }
    
    private getDayName(date: Date): string {
        return date.toLocaleDateString('pl-PL', { weekday: 'long' })
    }
    
    private isToday(date: Date): boolean {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }
    
    private canModifyLesson(lesson: any): boolean {
        // Handle different date formats that might come from the API
        let lessonDateStr = lesson.lesson_date
        if (lessonDateStr.includes('T')) {
            lessonDateStr = lessonDateStr.split('T')[0]
        }
        
        // Extract just the time part if start_time contains a full datetime
        let startTimeStr = lesson.start_time
        if (startTimeStr.includes(' ')) {
            // If it's in format "YYYY-MM-DD HH:MM:SS", extract just the time
            startTimeStr = startTimeStr.split(' ')[1].substring(0, 5) // Get HH:MM
        } else if (startTimeStr.length > 5) {
            // If it's longer than HH:MM format, truncate
            startTimeStr = startTimeStr.substring(0, 5)
        }
        
        const lessonDateTime = new Date(`${lessonDateStr}T${startTimeStr}`)
        const now = new Date()
        return lessonDateTime <= now
    }
    
    private getWeekLessonsCount(weekStart: Date, status?: string): number {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        
        return this.lessons.filter(lesson => {
            const lessonDate = new Date(lesson.lesson_date)
            const inWeek = lessonDate >= weekStart && lessonDate < weekEnd
            return inWeek && (!status || lesson.status === status)
        }).length
    }
    
    private getWeekHours(weekStart: Date): number {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        
        return this.lessons
            .filter(lesson => {
                const lessonDate = new Date(lesson.lesson_date)
                return lessonDate >= weekStart && lessonDate < weekEnd && lesson.status === 'scheduled'
            })
            .reduce((sum, lesson) => sum + (lesson.duration_minutes / 60), 0)
    }
    
    private getWeekStudentsCount(weekStart: Date): number {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        
        const studentIds = new Set(
            this.lessons
                .filter(lesson => {
                    const lessonDate = new Date(lesson.lesson_date)
                    return lessonDate >= weekStart && lessonDate < weekEnd && lesson.status === 'scheduled'
                })
                .map(lesson => lesson.student_id)
        )
        
        return studentIds.size
    }
    
    private getStatusBadge(status: string): string {
        switch (status) {
            case 'scheduled':
                return '<span class="badge bg-primary">Zaplanowana</span>'
            case 'completed':
                return '<span class="badge bg-success">Zakończona</span>'
            case 'cancelled':
                return '<span class="badge bg-danger">Anulowana</span>'
            case 'no_show':
                return '<span class="badge bg-warning">Nieobecność</span>'
            default:
                return '<span class="badge bg-secondary">Nieznany</span>'
        }
    }
    
    private getStatusClass(status: string): string {
        return status.replace('_', '-')
    }
    
    private getLessonTypeName(type: string): string {
        switch (type) {
            case 'individual':
                return 'Indywidualna'
            case 'group':
                return 'Grupowa'
            case 'intensive':
                return 'Intensywna'
            case 'conversation':
                return 'Konwersacja'
            default:
                return type
        }
    }
    
    private formatTime(time: string): string {
        // Handle different time formats that might come from API
        let timeStr = time
        if (timeStr.includes(' ')) {
            timeStr = timeStr.split(' ')[1] // Extract time part if datetime
        }
        if (timeStr.length > 5) {
            timeStr = timeStr.substring(0, 5) // Truncate seconds if present (HH:MM:SS -> HH:MM)
        }
        return timeStr
    }
    
    // Static methods for global access
    static instance = new TutorLessons()
    
    static switchView(view: 'calendar' | 'list'): void {
        this.instance.currentView = view
        this.instance.loadLessons()
    }
    
    static previousWeek(): void {
        this.instance.currentWeekOffset--
        this.instance.loadLessons()
    }
    
    static nextWeek(): void {
        this.instance.currentWeekOffset++
        this.instance.loadLessons()
    }
    
    static async completeLesson(lessonId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz oznaczyć tę lekcję jako zakończoną?')) return
        
        try {
            const response = await api.put<{success: boolean, message?: string}>(`/tutor/lessons/${lessonId}/complete`, {})
            
            if (response.success) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Lekcja została oznaczona jako zakończona.',
                        duration: 3000
                    }
                }))
                this.instance.loadLessons()
            } else {
                throw new Error(response.message || 'Błąd podczas oznaczania lekcji')
            }
        } catch (error: any) {
            console.error('Error completing lesson:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Wystąpił błąd podczas oznaczania lekcji',
                    duration: 5000
                }
            }))
        }
    }
    
    static async markNoShow(lessonId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz oznaczyć nieobecność studenta?')) return
        
        try {
            const response = await api.put<{success: boolean, message?: string}>(`/tutor/lessons/${lessonId}/no-show`, {})
            
            if (response.success) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Lekcja została oznaczona jako nieobecność.',
                        duration: 3000
                    }
                }))
                this.instance.loadLessons()
            } else {
                throw new Error(response.message || 'Błąd podczas oznaczania nieobecności')
            }
        } catch (error: any) {
            console.error('Error marking no-show:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Wystąpił błąd podczas oznaczania nieobecności',
                    duration: 5000
                }
            }))
        }
    }
    
    static async cancelLesson(lessonId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz anulować tę lekcję?')) return
        
        try {
            const response = await api.put<{success: boolean, message?: string}>(`/tutor/lessons/${lessonId}/cancel`, {
                reason: 'Anulowane przez lektora'
            })
            
            if (response.success) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Lekcja została anulowana pomyślnie.',
                        duration: 3000
                    }
                }))
                this.instance.loadLessons()
            } else {
                throw new Error(response.message || 'Błąd podczas anulowania lekcji')
            }
        } catch (error: any) {
            console.error('Error canceling lesson:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Wystąpił błąd podczas anulowania lekcji',
                    duration: 5000
                }
            }))
        }
    }
    
    static async viewDetails(lessonId: number): Promise<void> {
        // Use the LessonDetailsModal
        if ((window as any).LessonDetailsModal) {
            (window as any).LessonDetailsModal.show(lessonId)
        } else {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie można załadować modalu szczegółów',
                    duration: 3000
                }
            }))
        }
    }
}

// Export to global scope
;(window as any).TutorLessons = TutorLessons