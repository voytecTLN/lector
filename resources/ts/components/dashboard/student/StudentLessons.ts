import { api } from '@services/ApiService'

export class StudentLessons {
    
    public getUpcomingLessonsContent(): string {
        // This method now triggers async loading
        this.loadUpcomingLessons()
        
        return `
            <div class="student-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Nadchodzące lekcje</h2>
                    <button class="btn btn-primary" data-action="goto-rezerwuj">
                        <i class="bi bi-plus-circle me-2"></i>Zarezerwuj lekcję
                    </button>
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
    
    private async loadUpcomingLessons(): Promise<void> {
        try {
            const response = await api.get<any>('/student/lessons/my-lessons?type=upcoming')
            const lessons = response.data?.lessons || []
            
            this.renderUpcomingLessons(lessons)
        } catch (error) {
            console.error('Error loading upcoming lessons:', error)
            this.renderUpcomingLessonsError()
        }
    }
    
    private renderUpcomingLessons(lessons: any[]): void {
        const container = document.getElementById('upcoming-lessons-container')
        if (!container) return
        
        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-calendar-x" style="font-size: 3rem; color: #6c757d;"></i>
                    </div>
                    <h5>Brak zaplanowanych lekcji</h5>
                    <p class="text-muted">Nie masz jeszcze żadnych zaplanowanych lekcji.</p>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-section=rezerwuj]').click()">
                        <i class="bi bi-plus-circle me-2"></i>Zarezerwuj pierwszą lekcję
                    </button>
                </div>
            `
            return
        }
        
        const lessonsHtml = lessons.map(lesson => {
            const lessonDate = new Date(lesson.lesson_date)
            const startTime = lesson.start_time
            const endTime = lesson.end_time
            const canCancel = this.canCancelLesson(lesson)
            
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <div class="text-center">
                                    <div class="fw-bold text-primary">${lessonDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</div>
                                    <div class="small text-muted">${lessonDate.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="fw-bold">${startTime} - ${endTime}</div>
                                <div class="small text-muted">${lesson.duration_minutes} min</div>
                            </div>
                            <div class="col-md-3">
                                <div class="d-flex align-items-center">
                                    <div class="me-2">
                                        <div class="avatar-placeholder-small bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                            ${lesson.tutor?.name?.charAt(0) || 'L'}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="fw-bold">${lesson.tutor?.name || 'Lektor'}</div>
                                        <!--
                                        <div class="small text-muted">${this.getLanguageName(lesson.language)}</div> 
                                        -->
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                ${lesson.topic ? `<div class="fw-bold">${lesson.topic}</div>` : ''}
                                <div class="small text-muted">${lesson.lesson_type === 'individual' ? 'Lekcja indywidualna' : lesson.lesson_type}</div>
                                <!--
                                ${lesson.price ? `<div class="small text-success fw-bold">${Math.round(lesson.price)} zł</div>` : ''}
                                -->
                            </div>
                            <div class="col-md-2">
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        Akcje
                                    </button>
                                    <ul class="dropdown-menu">
                                        ${canCancel ? 
                                            `<li><a class="dropdown-item text-danger" href="#" onclick="StudentLessons.cancelLesson(${lesson.id})">
                                                <i class="bi bi-x-circle me-2"></i>Anuluj
                                            </a></li>` : 
                                            `<li><span class="dropdown-item-text text-muted">
                                                <i class="bi bi-info-circle me-2"></i>Nie można anulować
                                            </span></li>`
                                        }
                                        <li><a class="dropdown-item" href="#" onclick="StudentLessons.viewLessonDetails(${lesson.id})">
                                            <i class="bi bi-eye me-2"></i>Szczegóły
                                        </a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        }).join('')
        
        container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Pamiętaj:</strong> Lekcje można anulować najpóźniej 12 godzin przed rozpoczęciem.
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-outline-primary me-2" data-action="goto-historia">
                            <i class="bi bi-clock-history me-2"></i>Historia lekcji
                        </button>
                    </div>
                </div>
            </div>
            ${lessonsHtml}
        `
    }
    
    private renderUpcomingLessonsError(): void {
        const container = document.getElementById('upcoming-lessons-container')
        if (!container) return
        
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Błąd</h4>
                <p>Nie udało się załadować nadchodzących lekcji.</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
            </div>
        `
    }
    
    private canCancelLesson(lesson: any): boolean {
        const lessonDate = lesson.lesson_date.split('T')[0]
        const lessonDateTime = new Date(`${lessonDate}T${lesson.start_time}`)
        const now = new Date()
        const hoursUntilLesson = (lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        return lesson.status === 'scheduled' && hoursUntilLesson >= 12
    }
    
    private getLanguageName(code: string): string {
        const languages: { [key: string]: string } = {
            'english': 'Angielski',
            'german': 'Niemiecki', 
            'french': 'Francuski',
            'spanish': 'Hiszpański',
            'italian': 'Włoski',
            'portuguese': 'Portugalski',
            'russian': 'Rosyjski',
            'chinese': 'Chiński',
            'japanese': 'Japoński'
        }
        return languages[code] || code
    }
    
    public getLessonHistoryContent(): string {
        this.loadLessonHistory()
        
        return `
            <div class="student-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Historia lekcji</h2>
                    <button class="btn btn-outline-primary" data-action="goto-nadchodzace">
                        <i class="bi bi-calendar-event me-2"></i>Nadchodzące lekcje
                    </button>
                </div>
                
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
    
    private async loadLessonHistory(): Promise<void> {
        try {
            const response = await api.get<any>('/student/lessons/my-lessons?type=past')
            const lessons = response.data?.lessons || []
            
            this.renderLessonHistory(lessons)
        } catch (error) {
            console.error('Error loading lesson history:', error)
            this.renderLessonHistoryError()
        }
    }
    
    private renderLessonHistory(lessons: any[]): void {
        const container = document.getElementById('lesson-history-container')
        if (!container) return
        
        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-clock-history" style="font-size: 3rem; color: #6c757d;"></i>
                    </div>
                    <h5>Brak historii lekcji</h5>
                    <p class="text-muted">Nie masz jeszcze żadnych zakończonych lekcji.</p>
                    <button class="btn btn-primary" data-action="goto-rezerwuj">
                        <i class="bi bi-plus-circle me-2"></i>Zarezerwuj lekcję
                    </button>
                </div>
            `
            return
        }
        
        const lessonsHtml = lessons.map(lesson => {
            const lessonDate = new Date(lesson.lesson_date)
            const statusBadge = this.getStatusBadge(lesson.status)
            const canRate = lesson.status === 'completed' && !lesson.student_rating
            
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <div class="text-center">
                                    <div class="fw-bold">${lessonDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</div>
                                    <div class="small text-muted">${lessonDate.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="fw-bold">${lesson.start_time} - ${lesson.end_time}</div>
                                <div class="small text-muted">${lesson.duration_minutes} min</div>
                            </div>
                            <div class="col-md-3">
                                <div class="d-flex align-items-center">
                                    <div class="me-2">
                                        <div class="avatar-placeholder-small bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                            ${lesson.tutor?.name?.charAt(0) || 'L'}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="fw-bold">${lesson.tutor?.name || 'Lektor'}</div>
                                        <div class="small text-muted">${this.getLanguageName(lesson.language)}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                ${lesson.topic ? `<div class="fw-bold">${lesson.topic}</div>` : ''}
                                <div class="small text-muted">${lesson.lesson_type === 'individual' ? 'Lekcja indywidualna' : lesson.lesson_type}</div>
                                ${statusBadge}
                                ${lesson.student_rating ? `<div class="small text-warning">⭐ ${lesson.student_rating}/5</div>` : ''}
                            </div>
                            <div class="col-md-2">
                                ${canRate ? 
                                    `<button class="btn btn-sm btn-outline-primary" onclick="StudentLessons.rateLesson(${lesson.id})">
                                        <i class="bi bi-star me-1"></i>Oceń
                                    </button>` : 
                                    `<button class="btn btn-sm btn-outline-secondary" onclick="StudentLessons.viewLessonDetails(${lesson.id})">
                                        <i class="bi bi-eye me-1"></i>Szczegóły
                                    </button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `
        }).join('')
        
        container.innerHTML = lessonsHtml
    }
    
    private renderLessonHistoryError(): void {
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
    
    private getStatusBadge(status: string): string {
        switch (status) {
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
    
    // Static methods for global access
    static async cancelLesson(lessonId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz anulować tę lekcję?')) return
        
        try {
            const response = await api.put<{success: boolean, message?: string}>(`/student/lessons/${lessonId}/cancel`, {
                reason: 'Anulowanie przez studenta'
            })
            
            if (response.success) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Lekcja została anulowana pomyślnie.',
                        duration: 3000
                    }
                }))
                location.reload()
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
    
    static async rateLesson(lessonId: number): Promise<void> {
        const rating = prompt('Oceń lekcję (1-5):')
        if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'warning',
                    message: 'Proszę podać ocenę od 1 do 5',
                    duration: 3000
                }
            }))
            return
        }
        
        const feedback = prompt('Opcjonalny komentarz:') || ''
        
        try {
            const response = await api.post<{success: boolean, message?: string}>(`/student/lessons/${lessonId}/feedback`, {
                rating: parseInt(rating),
                feedback: feedback
            })
            
            if (response.success) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Ocena została dodana pomyślnie.',
                        duration: 3000
                    }
                }))
                location.reload()
            } else {
                throw new Error(response.message || 'Błąd podczas dodawania oceny')
            }
        } catch (error: any) {
            console.error('Error rating lesson:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Wystąpił błąd podczas dodawania oceny',
                    duration: 5000
                }
            }))
        }
    }
    
    static async viewLessonDetails(lessonId: number): Promise<void> {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `Szczegóły lekcji #${lessonId} - funkcja w przygotowaniu`,
                duration: 3000
            }
        }))
    }
}