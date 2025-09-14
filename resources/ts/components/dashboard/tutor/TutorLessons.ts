import { LessonService } from '@services/LessonService'
import { formatDate } from '@utils/date'
import { AvatarHelper } from '@/utils/AvatarHelper'
import Swal from 'sweetalert2'

export class TutorLessons {
    private currentView: 'calendar' | 'list' = 'calendar'
    private currentWeekOffset = 0
    private lessons: any[] = []
    private tutorId?: number // For admin view - when viewing specific tutor's lessons
    
    constructor(tutorId?: number) {
        this.tutorId = tutorId
    }
    
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
            let response
            if (this.tutorId) {
                // Admin view - get upcoming lessons for specific tutor using admin endpoint
                response = await LessonService.getAdminLessons({ 
                    tutor_id: this.tutorId.toString(),
                    status: 'scheduled' // Only get scheduled lessons for upcoming view
                })
            } else {
                // Tutor view - get own upcoming lessons
                response = await LessonService.getTutorUpcomingLessons()
            }
            let upcomingLessons = response.lessons || []
            
            
            // Backend now properly filters upcoming lessons (like StudentLessons)
            // No frontend filtering needed
            
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
                    ${upcomingLessons.map((lesson: any) => this.renderUpcomingLessonCard(lesson)).join('')}
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
                <div class="card h-100 lesson-card ${cardClass}" onclick="LessonDetailsModal.show(${lesson.id})" style="cursor: pointer; transition: transform 0.2s;">
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
            let response
            if (this.tutorId) {
                // Admin view - get lessons for specific tutor
                response = await LessonService.getAdminLessons({ 
                    tutor_id: this.tutorId.toString() 
                })
            } else {
                // Tutor view - get own lessons
                response = await LessonService.getTutorLessons()
            }
            this.lessons = response.lessons || []
            
            
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
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
        const weekStart = new Date(today.setDate(diff))
        weekStart.setDate(weekStart.getDate() + (this.currentWeekOffset * 7))
        weekStart.setHours(0, 0, 0, 0)
        
        const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
        const hours = Array.from({length: 14}, (_, i) => i + 8) // 8:00 to 21:00
        
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
            
            <div class="hourly-grid">
                ${this.renderHourlyGrid(weekStart, days, hours)}
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
    
    private renderHourLabels(hours: number[]): string {
        // Add empty space for day headers row
        let labels = '<div class="hour-label" style="height: 49px;"></div>'
        
        // Add hour labels
        hours.forEach(hour => {
            labels += `<div class="hour-label">${hour}:00</div>`
        })
        
        return labels
    }
    
    private renderHourlyGrid(weekStart: Date, days: string[], hours: number[]): string {
        let grid = '<div class="hour-header"></div>' // Empty top-left corner
        
        // Day headers - natural CSS grid flow (like HourlyAvailabilityCalendar)
        for (let d = 0; d < 7; d++) {
            const date = new Date(weekStart)
            date.setDate(weekStart.getDate() + d)
            const isToday = this.isToday(date)
            
            grid += `
                <div class="day-header ${isToday ? 'today' : ''}">
                    <div>${days[d]}</div>
                    <div class="small">${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}</div>
                </div>
            `
        }
        
        // Hour rows - natural CSS grid flow (like HourlyAvailabilityCalendar)
        for (const hour of hours) {
            // Hour label
            grid += `<div class="hour-header">${hour}:00</div>`
            
            // Hour cells for each day
            for (let d = 0; d < 7; d++) {
                const date = new Date(weekStart)
                date.setDate(weekStart.getDate() + d)
                const dateStr = formatDate(date)
                
                // Find lesson for this date and hour
                const lesson = this.lessons.find(l => {
                    // Convert UTC to local time FIRST, then extract date
                    let lessonDateStr = l.lesson_date
                    
                    if (lessonDateStr.includes('T')) {
                        // For UTC timestamps like "2025-08-07T22:00:00.000000Z"
                        // Convert to local Date object first
                        const lessonDateObj = new Date(lessonDateStr)
                        // Format to local date string
                        lessonDateStr = formatDate(lessonDateObj)
                    }
                    
                    // Handle different time formats
                    let lessonTime = l.start_time
                    if (lessonTime.includes(' ')) {
                        lessonTime = lessonTime.split(' ')[1]
                    }
                    if (lessonTime.length > 5) {
                        lessonTime = lessonTime.substring(0, 5)
                    }
                    
                    const lessonHour = lessonTime.split(':')[0]
                    return lessonDateStr === dateStr && parseInt(lessonHour) === hour
                })
                
                if (lesson) {
                    grid += this.renderLessonCell(lesson)
                } else {
                    grid += `<div class="hour-cell empty"></div>`
                }
            }
        }
        
        return grid
    }
    
    private renderLessonCell(lesson: any): string {
        const statusClass = this.getStatusClass(lesson.status)
        const canModify = lesson.status === 'scheduled' && this.canModifyLesson(lesson)
        
        return `
            <div class="hour-cell lesson ${statusClass}" data-lesson-id="${lesson.id}">
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
                        ${AvatarHelper.render({
                            name: lesson.student?.name || 'Student',
                            avatar: lesson.student?.avatar,
                            size: 'sm',
                            className: 'me-2',
                            userId: lesson.student?.id
                        })}
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
                .hourly-grid {
                    display: grid;
                    grid-template-columns: 80px repeat(7, 1fr);
                    gap: 1px;
                    background-color: #dee2e6;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .hour-header, .day-header, .hour-cell {
                    background-color: white;
                    padding: 8px;
                    text-align: center;
                    user-select: none;
                }
                
                .hour-header {
                    background-color: #f8f9fa;
                    font-weight: 500;
                    color: #495057;
                    text-align: right;
                    padding-right: 12px;
                }
                
                .day-header {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    color: #495057;
                    padding: 12px 8px;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .day-header.today {
                    background-color: #e3f2fd;
                    color: #1976d2;
                }
                
                .hour-cell {
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    min-height: 40px;
                }
                
                .hour-cell.empty {
                    background: #fff;
                }
                
                .hour-cell.lesson {
                    background: #e8f4fd;
                    border: 1px solid #2196f3;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .hour-cell.lesson:hover {
                    background: #d1e7fd;
                }
                
                .hour-cell.lesson.completed {
                    background: #d4edda;
                    border-color: #28a745;
                }
                
                .hour-cell.lesson.cancelled {
                    background: #f8d7da;
                    border-color: #dc3545;
                    opacity: 0.7;
                }
                
                .hour-cell.lesson.no-show {
                    background: #fff3cd;
                    border-color: #ffc107;
                }
                
                .lesson-time {
                    font-weight: bold;
                    font-size: 0.75em;
                    color: #495057;
                    line-height: 1;
                }
                
                .lesson-student {
                    font-size: 0.7em;
                    color: #6c757d;
                    margin-top: 2px;
                    line-height: 1;
                }
                
                .lesson-topic {
                    font-style: italic;
                    color: #6c757d;
                    font-size: 0.65em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    margin-top: 1px;
                }
                
                .lesson-actions {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    display: none;
                    gap: 2px;
                }
                
                .hour-cell.lesson:hover .lesson-actions {
                    display: flex;
                }
                
                .lesson-actions .btn {
                    padding: 1px 3px;
                    font-size: 0.6em;
                    line-height: 1;
                }
            </style>
        `
    }
    
    private filterFutureLessons(lessons: any[]): any[] {
        const now = new Date()
        const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD format
        const currentTime = now.getHours() * 60 + now.getMinutes() // Minutes since midnight
        
        
        return lessons.filter(lesson => {
            try {
                // Parse lesson date
                let lessonDateStr = lesson.lesson_date
                if (lessonDateStr.includes('T')) {
                    lessonDateStr = lessonDateStr.split('T')[0]
                }
                
                // Parse lesson start time
                let startTimeStr = lesson.start_time
                if (startTimeStr.includes(' ')) {
                    startTimeStr = startTimeStr.split(' ')[1]
                }
                if (startTimeStr.length > 5) {
                    startTimeStr = startTimeStr.substring(0, 5)
                }
                
                const [startHour, startMinute] = startTimeStr.split(':').map(Number)
                const lessonStartTime = startHour * 60 + startMinute // Minutes since midnight
                
                
                // If lesson is on a future date, always include it
                if (lessonDateStr > currentDate) {
                    return true
                }
                
                // If lesson is on a past date, exclude it
                if (lessonDateStr < currentDate) {
                    return false
                }
                
                // If lesson is today, only include if it hasn't started yet
                // Add small buffer before the lesson start time
                const bufferMinutes = 5
                return lessonStartTime > (currentTime + bufferMinutes)
                
            } catch (error) {
                console.warn('Error parsing lesson time:', lesson, error)
                return true // Include if we can't parse (safer to show than hide)
            }
        })
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
        // Future lessons can be modified, past lessons cannot
        return lessonDateTime > now
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
            case 'not_started':
                return '<span class="badge bg-dark">Nie rozpoczęta</span>'
            case 'in_progress':
                return '<span class="badge bg-info">W trakcie</span>'
            case 'technical_issues':
                return '<span class="badge bg-secondary">Problemy techniczne</span>'
            case 'no_show_student':
                return '<span class="badge bg-warning text-dark">Student nieobecny</span>'
            case 'no_show_tutor':
                return '<span class="badge bg-warning text-dark">Lektor nieobecny</span>'
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
        const currentInstance = (window as any).currentTutorLessonsInstance || this.instance
        currentInstance.currentView = view
        currentInstance.loadLessons()
    }
    
    static previousWeek(): void {
        const currentInstance = (window as any).currentTutorLessonsInstance || this.instance
        currentInstance.currentWeekOffset--
        currentInstance.loadLessons()
    }
    
    static nextWeek(): void {
        const currentInstance = (window as any).currentTutorLessonsInstance || this.instance
        currentInstance.currentWeekOffset++
        currentInstance.loadLessons()
    }
    
    static async completeLesson(lessonId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz oznaczyć tę lekcję jako zakończoną?')) return
        
        try {
            const response = await LessonService.updateLessonStatus(lessonId, { status: 'completed' })
            
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
            const response = await LessonService.updateLessonStatus(lessonId, { status: 'no_show_student' })
            
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
        let formValues: any = null
        
        try {
            // Pobierz szczegóły lekcji
            const response = await LessonService.getLessonDetails(lessonId)
            const lesson = response.data?.lesson || response.lesson || response.data || response
            
            if (!lesson || !lesson.lesson_date) {
                throw new Error('Nie udało się pobrać szczegółów lekcji')
            }
            
            // Użyj SweetAlert2 dla lepszego UX
            const { value } = await Swal.fire({
                title: 'Anulowanie lekcji',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Czy na pewno chcesz anulować lekcję #${lessonId}?</p>
                        <div class="mb-3">
                            <strong>Data:</strong> ${new Date(lesson.lesson_date).toLocaleDateString('pl-PL')}<br>
                            <strong>Godzina:</strong> ${this.formatTimeStatic(lesson.start_time)} - ${this.formatTimeStatic(lesson.end_time)}<br>
                            <strong>Student:</strong> ${lesson.student?.name || 'Nieznany'}
                        </div>
                        <div class="form-group">
                            <label for="cancel-reason" class="form-label">Powód anulowania (wymagany):</label>
                            <textarea id="cancel-reason" class="form-control" rows="3" 
                                placeholder="Podaj powód anulowania lekcji..." 
                                required></textarea>
                        </div>
                        <div class="alert alert-info mt-3">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Dla lektora:</strong>
                            <div class="mt-2" style="text-align: left;">
                                • Godzina zostanie zwrócona do pakietu studenta<br>
                                • Student otrzyma powiadomienie o anulowaniu<br>
                                • Wymagany jest powód anulowania
                            </div>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Anuluj lekcję',
                cancelButtonText: 'Wróć',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                focusConfirm: false,
                preConfirm: () => {
                    const reason = (document.getElementById('cancel-reason') as HTMLTextAreaElement)?.value
                    if (!reason) {
                        Swal.showValidationMessage('Musisz podać powód anulowania lekcji')
                        return false
                    }
                    return { reason }
                }
            })
            
            formValues = value
            if (!formValues) return
        } catch (error) {
            console.error('Error fetching lesson details:', error)
            // Jeśli nie uda się pobrać szczegółów, użyj standardowego dialogu
            const { value: fallbackFormValues } = await Swal.fire({
                title: 'Anulowanie lekcji',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Czy na pewno chcesz anulować lekcję #${lessonId}?</p>
                        <div class="form-group">
                            <label for="cancel-reason" class="form-label">Powód anulowania (wymagany):</label>
                            <textarea id="cancel-reason" class="form-control" rows="3" 
                                placeholder="Podaj powód anulowania lekcji..." 
                                required></textarea>
                        </div>
                        <div class="alert alert-info mt-3">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Dla lektora:</strong> Godzina zostanie zwrócona do pakietu studenta.
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Anuluj lekcję',
                cancelButtonText: 'Wróć',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                focusConfirm: false,
                preConfirm: () => {
                    const reason = (document.getElementById('cancel-reason') as HTMLTextAreaElement)?.value
                    if (!reason) {
                        Swal.showValidationMessage('Musisz podać powód anulowania lekcji')
                        return false
                    }
                    return { reason }
                }
            })
            
            formValues = fallbackFormValues
            if (!formValues) return
        }

        // Pokaż loader
        Swal.fire({
            title: 'Anulowanie lekcji...',
            text: 'Proszę czekać',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading()
            }
        })
        
        try {
            const response = await LessonService.cancelTutorLesson(lessonId, formValues.reason)
            
            if (response.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Lekcja anulowana',
                    text: 'Lekcja została anulowana pomyślnie. Student został powiadomiony.',
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true
                })
                
                // Odśwież listę lekcji
                this.instance.loadLessons()
            } else {
                throw new Error(response.message || 'Błąd podczas anulowania lekcji')
            }
        } catch (error: any) {
            console.error('Error canceling lesson:', error)
            await Swal.fire({
                icon: 'error',
                title: 'Błąd anulowania',
                text: error.message || 'Wystąpił błąd podczas anulowania lekcji',
                confirmButtonText: 'OK'
            })
        }
    }
    
    private static formatTimeStatic(timeString: string): string {
        if (!timeString) return '00:00'
        if (timeString.includes(':') && !timeString.includes('T')) {
            return timeString.substring(0, 5) // "HH:MM"
        }
        try {
            return new Date(timeString).toTimeString().substring(0, 5)
        } catch {
            return timeString.substring(0, 5)
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