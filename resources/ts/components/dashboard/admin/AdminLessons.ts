import { api } from '@services/ApiService'

export class AdminLessons {
    private currentFilter = {
        status: 'all',
        tutorId: '',
        studentId: '',
        dateFrom: '',
        dateTo: ''
    }
    
    public getLessonsContent(): string {
        // Trigger async loading
        this.loadLessons()
        
        return `
            <div class="admin-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Zarządzanie lekcjami</h2>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary" onclick="AdminLessons.exportLessons()">
                            <i class="bi bi-download me-2"></i>Eksportuj
                        </button>
                    </div>
                </div>
                
                ${this.renderFilters()}
                
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
    
    private renderFilters(): string {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title mb-3">Filtry</h5>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label for="status-filter" class="form-label">Status</label>
                            <select class="form-select" id="status-filter" onchange="AdminLessons.applyFilters()">
                                <option value="all">Wszystkie</option>
                                <option value="scheduled">Zaplanowane</option>
                                <option value="completed">Zakończone</option>
                                <option value="cancelled">Anulowane</option>
                                <option value="no_show">Nieobecność</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="tutor-filter" class="form-label">Lektor</label>
                            <select class="form-select" id="tutor-filter" onchange="AdminLessons.applyFilters()">
                                <option value="">Wszyscy</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="student-filter" class="form-label">Student</label>
                            <select class="form-select" id="student-filter" onchange="AdminLessons.applyFilters()">
                                <option value="">Wszyscy</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="date-range" class="form-label">Zakres dat</label>
                            <div class="input-group">
                                <input type="date" class="form-control" id="date-from" onchange="AdminLessons.applyFilters()">
                                <span class="input-group-text">-</span>
                                <input type="date" class="form-control" id="date-to" onchange="AdminLessons.applyFilters()">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private async loadLessons(): Promise<void> {
        try {
            // Load tutors and students for filters
            await this.loadFilterOptions()
            
            // Build query params
            const params = new URLSearchParams()
            if (this.currentFilter.status !== 'all') params.append('status', this.currentFilter.status)
            if (this.currentFilter.tutorId) params.append('tutor_id', this.currentFilter.tutorId)
            if (this.currentFilter.studentId) params.append('student_id', this.currentFilter.studentId)
            if (this.currentFilter.dateFrom) params.append('date_from', this.currentFilter.dateFrom)
            if (this.currentFilter.dateTo) params.append('date_to', this.currentFilter.dateTo)
            
            const response = await api.get<{success: boolean, data: {lessons: any[]}, message?: string}>(`/lessons?${params.toString()}`)
            const lessons = response.data?.lessons || []
            
            this.renderLessons(lessons)
        } catch (error) {
            console.error('Error loading lessons:', error)
            this.renderError()
        }
    }
    
    private async loadFilterOptions(): Promise<void> {
        try {
            // Load tutors
            const tutorsResponse = await api.get<{success: boolean, data: any[], message?: string}>('/tutors')
            const tutors = tutorsResponse.data || []
            
            const tutorSelect = document.getElementById('tutor-filter') as HTMLSelectElement
            if (tutorSelect) {
                tutorSelect.innerHTML = '<option value="">Wszyscy</option>' + 
                    tutors.map(tutor => `<option value="${tutor.id}">${tutor.name}</option>`).join('')
            }
            
            // Load students
            const studentsResponse = await api.get<{success: boolean, data: any[], message?: string}>('/students')
            const students = studentsResponse.data || []
            
            const studentSelect = document.getElementById('student-filter') as HTMLSelectElement
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Wszyscy</option>' + 
                    students.map(student => `<option value="${student.id}">${student.name}</option>`).join('')
            }
        } catch (error) {
            console.error('Error loading filter options:', error)
        }
    }
    
    private renderLessons(lessons: any[]): void {
        const container = document.getElementById('lessons-container')
        if (!container) return
        
        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-calendar-x" style="font-size: 3rem; color: #6c757d;"></i>
                    </div>
                    <h5>Brak lekcji</h5>
                    <p class="text-muted">Nie znaleziono lekcji spełniających kryteria wyszukiwania.</p>
                </div>
            `
            return
        }
        
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                            <th>Godzina</th>
                            <th>Student</th>
                            <th>Lektor</th>
                            <th>Status</th>
                            <th>Typ</th>
<!--                            <th>Cena</th>-->
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lessons.map(lesson => this.renderLessonRow(lesson)).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4">
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">Statystyki</h6>
                                <div class="d-flex justify-content-between">
                                    <span>Łącznie lekcji:</span>
                                    <strong>${lessons.length}</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Zaplanowane:</span>
                                    <strong>${lessons.filter(l => l.status === 'scheduled').length}</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Zakończone:</span>
                                    <strong>${lessons.filter(l => l.status === 'completed').length}</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Anulowane:</span>
                                    <strong>${lessons.filter(l => l.status === 'cancelled').length}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">Przychód</h6>
                                <div class="d-flex justify-content-between">
                                    <span>Zakończone:</span>
                                    <strong>${this.calculateRevenue(lessons.filter(l => l.status === 'completed'))} zł</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Zaplanowane:</span>
                                    <strong>${this.calculateRevenue(lessons.filter(l => l.status === 'scheduled'))} zł</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    -->
                </div>
            </div>
        `
        
        container.innerHTML = tableHtml
    }
    
    private renderLessonRow(lesson: any): string {
        const lessonDate = new Date(lesson.lesson_date)
        const statusBadge = this.getStatusBadge(lesson.status)
        
        return `
            <tr>
                <td>#${lesson.id}</td>
                <td>${lessonDate.toLocaleDateString('pl-PL')}</td>
                <td>${lesson.start_time} - ${lesson.end_time}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-placeholder-small bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 30px; height: 30px;">
                            ${lesson.student?.name?.charAt(0) || 'S'}
                        </div>
                        ${lesson.student?.name || 'Student'}
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-placeholder-small bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 30px; height: 30px;">
                            ${lesson.tutor?.name?.charAt(0) || 'L'}
                        </div>
                        ${lesson.tutor?.name || 'Lektor'}
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td><span class="badge bg-secondary">${this.getLessonTypeName(lesson.lesson_type)}</span></td>
                <!-- <td>${lesson.price ? `${Math.round(lesson.price)} zł` : '-'}</td> -->
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Akcje
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="AdminLessons.viewDetails(${lesson.id})">
                                <i class="bi bi-eye me-2"></i>Szczegóły
                            </a></li>
                            ${lesson.status === 'scheduled' ? `
                                <li><a class="dropdown-item text-danger" href="#" onclick="AdminLessons.cancelLesson(${lesson.id})">
                                    <i class="bi bi-x-circle me-2"></i>Anuluj
                                </a></li>
                            ` : ''}
                        </ul>
                    </div>
                </td>
            </tr>
        `
    }
    
    private calculateRevenue(lessons: any[]): number {
        return lessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0)
    }
    
    private renderError(): void {
        const container = document.getElementById('lessons-container')
        if (!container) return
        
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Błąd</h4>
                <p>Nie udało się załadować lekcji.</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
            </div>
        `
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
    
    // Static methods for global access
    static instance = new AdminLessons()
    
    static applyFilters(): void {
        const statusFilter = (document.getElementById('status-filter') as HTMLSelectElement)?.value
        const tutorFilter = (document.getElementById('tutor-filter') as HTMLSelectElement)?.value
        const studentFilter = (document.getElementById('student-filter') as HTMLSelectElement)?.value
        const dateFrom = (document.getElementById('date-from') as HTMLInputElement)?.value
        const dateTo = (document.getElementById('date-to') as HTMLInputElement)?.value
        
        this.instance.currentFilter = {
            status: statusFilter || 'all',
            tutorId: tutorFilter || '',
            studentId: studentFilter || '',
            dateFrom: dateFrom || '',
            dateTo: dateTo || ''
        }
        
        this.instance.loadLessons()
    }
    
    static async cancelLesson(lessonId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz anulować tę lekcję?')) return
        
        try {
            const response = await api.put<{success: boolean, message?: string}>(`/lessons/${lessonId}/cancel`, {
                reason: 'Anulowane przez administratora'
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
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `Szczegóły lekcji #${lessonId} - funkcja w przygotowaniu`,
                duration: 3000
            }
        }))
    }
    
    static async exportLessons(): Promise<void> {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: 'Eksport lekcji - funkcja w przygotowaniu',
                duration: 3000
            }
        }))
    }
}