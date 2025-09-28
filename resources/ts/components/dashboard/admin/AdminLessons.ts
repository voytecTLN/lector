import { LessonService } from '@services/LessonService'
import { tutorService } from '@services/TutorService'
import { studentService } from '@services/StudentService'
import { LessonStatusManager } from '@/components/lessons/LessonStatusManager'
import { AvatarHelper } from '@/utils/AvatarHelper'

export class AdminLessons {
    static instance: AdminLessons = new AdminLessons()
    
    private currentFilter = {
        status: 'all',
        tutorId: '',
        studentId: '',
        dateFrom: '',
        dateTo: ''
    }
    private currentPage = 1
    private totalPages = 1
    private perPage = 100
    
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
                                <option value="in_progress">W trakcie</option>
                                <option value="completed">Zakończone</option>
                                <option value="cancelled">Anulowane</option>
                                <option value="no_show_student">Student nieobecny</option>
                                <option value="no_show_tutor">Lektor nieobecny</option>
                                <option value="technical_issues">Problemy techniczne</option>
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
                    <div class="row mt-3">
                        <div class="col-12">
                            <button class="btn btn-outline-secondary" onclick="AdminLessons.resetFilters()">
                                <i class="bi bi-arrow-counterclockwise me-2"></i>Resetuj filtry
                            </button>
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
            
            const filters = {
                status: this.currentFilter.status === 'all' ? undefined : this.currentFilter.status,
                tutor_id: this.currentFilter.tutorId || undefined,
                student_id: this.currentFilter.studentId || undefined,
                date_from: this.currentFilter.dateFrom || undefined,
                date_to: this.currentFilter.dateTo || undefined,
                page: this.currentPage,
                per_page: this.perPage
            }
            
            const response = await LessonService.getAdminLessons(filters)
            
            
            const lessons = response.lessons || response.data || []
            this.totalPages = response.last_page || Math.ceil((response.total || lessons.length) / this.perPage)
            
            this.renderLessons(lessons)
        } catch (error) {
            console.error('Error loading lessons:', error)
            this.renderError()
        }
    }
    
    private async loadFilterOptions(): Promise<void> {
        try {
            // Load tutors
            const tutorsResponse = await tutorService.getAllTutors()
            const tutors = tutorsResponse || []
            
            const tutorSelect = document.getElementById('tutor-filter') as HTMLSelectElement
            if (tutorSelect) {
                tutorSelect.innerHTML = '<option value="">Wszyscy</option>' + 
                    tutors.map((tutor: any) => `<option value="${tutor.id}">${tutor.name}</option>`).join('')
            }
            
            // Load students
            const studentsResponse = await studentService.getAllStudents()
            const students = studentsResponse || []
            
            const studentSelect = document.getElementById('student-filter') as HTMLSelectElement
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Wszyscy</option>' + 
                    students.map((student: any) => `<option value="${student.id}">${student.name}</option>`).join('')
            }
        } catch (error) {
            console.error('Error loading filter options:', error)
            // Don't block lesson loading if filter options fail
        }
    }
    
    private renderLessons(lessons: any[]): void {
        const container = document.getElementById('lessons-container')
        if (!container) {
            console.error('lessons-container not found!')
            return
        }
        
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
                            <th>Ocena</th>
<!--                            <th>Cena</th>-->
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lessons.map(lesson => this.renderLessonRow(lesson)).join('')}
                    </tbody>
                </table>
            </div>
            
            ${this.renderPagination()}
            
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
                </div>
            </div>
        `
        
        container.innerHTML = tableHtml
    }
    
    private renderPagination(): string {
        if (this.totalPages <= 1) return ''
        
        const pages = []
        const maxPagesToShow = 7
        let startPage = Math.max(1, this.currentPage - 3)
        let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1)
        
        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1)
        }
        
        // First page
        if (startPage > 1) {
            pages.push(`
                <li class="page-item">
                    <a class="page-link" href="#" onclick="AdminLessons.goToPage(1); return false;">1</a>
                </li>
            `)
            if (startPage > 2) {
                pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>')
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage
            pages.push(`
                <li class="page-item ${isActive ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="AdminLessons.goToPage(${i}); return false;">${i}</a>
                </li>
            `)
        }
        
        // Last page
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>')
            }
            pages.push(`
                <li class="page-item">
                    <a class="page-link" href="#" onclick="AdminLessons.goToPage(${this.totalPages}); return false;">${this.totalPages}</a>
                </li>
            `)
        }
        
        return `
            <nav aria-label="Nawigacja po stronach" class="mt-4">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="AdminLessons.goToPage(${this.currentPage - 1}); return false;">
                            <i class="bi bi-chevron-left"></i>
                        </a>
                    </li>
                    ${pages.join('')}
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="AdminLessons.goToPage(${this.currentPage + 1}); return false;">
                            <i class="bi bi-chevron-right"></i>
                        </a>
                    </li>
                </ul>
            </nav>
        `
    }
    
    private renderLessonRow(lesson: any): string {
        const lessonDate = new Date(lesson.lesson_date)
        const statusLabel = LessonStatusManager.getStatusLabel(lesson.status)
        const badgeClass = LessonStatusManager.getStatusBadgeClass(lesson.status)
        const statusBadge = `<span class="badge ${badgeClass}">${statusLabel}</span>`
        
        return `
            <tr>
                <td>#${lesson.id}</td>
                <td>${lessonDate.toLocaleDateString('pl-PL')}</td>
                <td>${lesson.start_time} - ${lesson.end_time}</td>
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
                <td>
                    <div class="d-flex align-items-center">
                        ${AvatarHelper.render({
                            name: lesson.tutor?.name || 'Lektor',
                            avatar: lesson.tutor?.avatar,
                            size: 'sm',
                            className: 'me-2',
                            userId: lesson.tutor?.id
                        })}
                        ${lesson.tutor?.name || 'Lektor'}
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td><span class="badge bg-secondary">${this.getLessonTypeName(lesson.lesson_type)}</span></td>
                <td>${this.renderLessonRating(lesson)}</td>
                <!-- <td>${lesson.price ? `${Math.round(lesson.price)} zł` : '-'}</td> -->
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Akcje
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="AdminLessons.viewDetails(${lesson.id}); return false;">
                                <i class="bi bi-eye me-2"></i>Szczegóły
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="AdminLessons.changeStatus(${lesson.id}, '${lesson.status}'); return false;">
                                <i class="bi bi-arrow-repeat me-2"></i>Zmień status
                            </a></li>
                            <li><a class="dropdown-item" href="javascript:void(0)" onclick="event.preventDefault(); event.stopPropagation(); AdminLessons.viewStatusHistory(${lesson.id}); return false;">
                                <i class="bi bi-clock-history me-2"></i>Historia statusów
                            </a></li>
                            ${lesson.status === 'scheduled' ? `
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="AdminLessons.cancelLesson(${lesson.id}); return false;">
                                    <i class="bi bi-x-circle me-2"></i>Anuluj
                                </a></li>
                            ` : ''}
                        </ul>
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
                <p>Nie udało się załadować lekcji.</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
            </div>
        `
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
    
    private renderLessonRating(lesson: any): string {
        if (lesson.student_rating && lesson.student_rating > 0) {
            const rating = lesson.student_rating
            const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
            return `
                <div class="d-flex align-items-center">
                    <span class="text-warning me-1" style="font-size: 0.9rem;">${stars}</span>
                    <small class="text-muted">${rating}/5</small>
                </div>
            `
        } else if (lesson.status === 'completed') {
            return '<small class="text-muted">Brak oceny</small>'
        } else {
            return '<small class="text-muted">-</small>'
        }
    }
    
    
    static async cancelLesson(lessonId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz anulować tę lekcję?')) return
        
        try {
            const response = await LessonService.updateLessonStatus(lessonId, {
                status: 'cancelled',
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
    
    static applyFilters(): void {
        const instance = AdminLessons.instance
        instance.currentFilter = {
            status: (document.getElementById('status-filter') as HTMLSelectElement)?.value || 'all',
            tutorId: (document.getElementById('tutor-filter') as HTMLSelectElement)?.value || '',
            studentId: (document.getElementById('student-filter') as HTMLSelectElement)?.value || '',
            dateFrom: (document.getElementById('date-from') as HTMLInputElement)?.value || '',
            dateTo: (document.getElementById('date-to') as HTMLInputElement)?.value || ''
        }
        instance.currentPage = 1 // Reset to first page when filtering
        instance.loadLessons()
    }

    static resetFilters(): void {
        const instance = AdminLessons.instance

        // Reset filter values in UI
        const statusFilter = document.getElementById('status-filter') as HTMLSelectElement
        if (statusFilter) statusFilter.value = 'all'

        const tutorFilter = document.getElementById('tutor-filter') as HTMLSelectElement
        if (tutorFilter) tutorFilter.value = ''

        const studentFilter = document.getElementById('student-filter') as HTMLSelectElement
        if (studentFilter) studentFilter.value = ''

        const dateFrom = document.getElementById('date-from') as HTMLInputElement
        if (dateFrom) dateFrom.value = ''

        const dateTo = document.getElementById('date-to') as HTMLInputElement
        if (dateTo) dateTo.value = ''

        // Reset internal filter state
        instance.currentFilter = {
            status: 'all',
            tutorId: '',
            studentId: '',
            dateFrom: '',
            dateTo: ''
        }

        instance.currentPage = 1
        instance.loadLessons()
    }
    
    static goToPage(page: number): void {
        const instance = AdminLessons.instance
        if (page < 1 || page > instance.totalPages) return
        instance.currentPage = page
        instance.loadLessons()
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
    
    static async exportLessons(): Promise<void> {
        try {
            const instance = AdminLessons.instance

            // Show loading notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'info',
                    message: 'Przygotowywanie eksportu...',
                    duration: 2000
                }
            }))

            // Build query params from current filters
            const params = new URLSearchParams()
            if (instance.currentFilter.status !== 'all') {
                params.append('status', instance.currentFilter.status)
            }
            if (instance.currentFilter.tutorId) {
                params.append('tutor_id', instance.currentFilter.tutorId)
            }
            if (instance.currentFilter.studentId) {
                params.append('student_id', instance.currentFilter.studentId)
            }
            if (instance.currentFilter.dateFrom) {
                params.append('date_from', instance.currentFilter.dateFrom)
            }
            if (instance.currentFilter.dateTo) {
                params.append('date_to', instance.currentFilter.dateTo)
            }

            // Debug: sprawdź URL i parametry
            const exportUrl = `/api/lessons/export?${params}`
            console.log('Export URL:', exportUrl)
            console.log('Export params:', Object.fromEntries(params.entries()))

            // Test: sprawdź najpierw czy endpoint jest dostępny
            const testResponse = await fetch('/api/lessons', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            })
            console.log('Test /api/lessons status:', testResponse.status)

            // Test: sprawdź auth user
            const authResponse = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            })
            console.log('Auth status:', authResponse.status)
            if (authResponse.ok) {
                const user = await authResponse.json()
                console.log('Current user:', user)
            }

            // Fetch CSV data - bez niepotrzebnych headers
            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            })

            console.log('Response status:', response.status)
            console.log('Response URL:', response.url)

            if (!response.ok) {
                // Debug: sprawdź co zwraca server
                const errorText = await response.text()
                console.error('Export error response:', errorText)
                console.error('Response status:', response.status)
                console.error('Response headers:', Object.fromEntries(response.headers.entries()))
                throw new Error(`Błąd podczas eksportu danych: ${response.status} - ${errorText.substring(0, 200)}`)
            }

            // Check if response is actually CSV
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('csv')) {
                const responseText = await response.text()
                console.error('Expected CSV but got:', contentType)
                console.error('Response body:', responseText.substring(0, 500))
                throw new Error('Server nie zwrócił pliku CSV. Sprawdź logi serwera.')
            }

            // Get the blob from response
            const blob = await response.blob()

            // Create download link
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `lekcje_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()

            // Cleanup
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Eksport CSV został zakończony',
                    duration: 3000
                }
            }))

        } catch (error) {
            console.error('Error exporting lessons:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się wyeksportować danych',
                    duration: 5000
                }
            }))
        }
    }
    
    static async changeStatus(lessonId: number, currentStatus: string): Promise<void> {
        try {
            const statusManager = new LessonStatusManager(lessonId, currentStatus, (newStatus: string) => {
                // Reload lessons after status update
                this.instance.loadLessons()
            })

            await statusManager.showModal()
        } catch (error) {
            console.error('Error in changeStatus:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Wystąpił błąd podczas zmiany statusu',
                    duration: 3000
                }
            }))
        }
    }

    static async viewStatusHistory(lessonId: number): Promise<void> {
        try {
            // Show loading modal first
            const loadingModalHtml = `
                <div class="modal fade" id="statusHistoryModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Historia statusów lekcji #${lessonId}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="text-center py-4">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Ładowanie...</span>
                                    </div>
                                    <p class="mt-2">Ładowanie historii statusów...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `

            // Remove existing modal if any
            const existingModal = document.getElementById('statusHistoryModal')
            if (existingModal) {
                existingModal.remove()
            }

            // Add loading modal to page
            document.body.insertAdjacentHTML('beforeend', loadingModalHtml)
            
            // Show modal
            const modal = new (window as any).bootstrap.Modal(document.getElementById('statusHistoryModal'))
            modal.show()

            
            let response
            try {
                // Fetch status history from API
                response = await LessonService.getStatusHistory(lessonId)
            } catch (error) {
                console.error('Error fetching status history:', error)
                throw error
            }
            
            // Extract history array from response
            let historyArray: any[] = []
            if (response) {
                if (Array.isArray(response)) {
                    historyArray = response
                } else if (response.data && Array.isArray(response.data)) {
                    historyArray = response.data
                } else if (response.history && Array.isArray(response.history)) {
                    historyArray = response.history
                }
            }
            

            // Get status label helper
            const getStatusLabel = (status: string): string => {
                const labels: { [key: string]: string } = {
                    'scheduled': 'Zaplanowana',
                    'in_progress': 'W trakcie',
                    'completed': 'Zakończona',
                    'cancelled': 'Anulowana',
                    'no_show_student': 'Student nieobecny',
                    'no_show_tutor': 'Lektor nieobecny',
                    'technical_issues': 'Problemy techniczne'
                }
                return labels[status] || status
            }

            // Get status badge class
            const getStatusBadgeClass = (status: string): string => {
                const classes: { [key: string]: string } = {
                    'scheduled': 'bg-primary',
                    'in_progress': 'bg-info',
                    'completed': 'bg-success',
                    'cancelled': 'bg-danger',
                    'no_show_student': 'bg-warning',
                    'no_show_tutor': 'bg-warning',
                    'technical_issues': 'bg-secondary'
                }
                return classes[status] || 'bg-secondary'
            }

            // Update modal content with fetched data
            const modalBody = document.querySelector('#statusHistoryModal .modal-body')
            if (modalBody) {
                
                if (historyArray.length === 0) {
                    modalBody.innerHTML = `
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Brak historii zmian statusu dla tej lekcji.
                        </div>
                    `
                } else {
                    modalBody.innerHTML = `
                        <div class="timeline">
                            ${historyArray.map((entry, index) => {
                                const isFirst = index === 0
                                const statusLabel = getStatusLabel(entry.status)
                                const badgeClass = getStatusBadgeClass(entry.status)
                                const changedAt = new Date(entry.changed_at)
                                
                                return `
                                    <div class="timeline-item mb-4 ${isFirst ? 'current-status' : ''}">
                                        <div class="d-flex align-items-start">
                                            <div class="timeline-icon-wrapper me-3">
                                                <div class="timeline-icon ${isFirst ? 'bg-primary' : 'bg-secondary'} text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                                    <i class="bi ${isFirst ? 'bi-circle-fill' : 'bi-clock-history'}"></i>
                                                </div>
                                                ${index < historyArray.length - 1 ? '<div class="timeline-line"></div>' : ''}
                                            </div>
                                            <div class="flex-grow-1">
                                                <div class="card ${isFirst ? 'border-primary' : ''}">
                                                    <div class="card-body">
                                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <span class="badge ${badgeClass} me-2">${statusLabel}</span>
                                                                ${isFirst ? '<span class="badge bg-light text-dark">Obecny status</span>' : ''}
                                                            </div>
                                                            <small class="text-muted">
                                                                ${changedAt.toLocaleDateString('pl-PL', { 
                                                                    day: '2-digit', 
                                                                    month: '2-digit', 
                                                                    year: 'numeric', 
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit' 
                                                                })}
                                                            </small>
                                                        </div>
                                                        <div class="text-muted">
                                                            <i class="bi bi-person me-1"></i>
                                                            Zmienione przez: <strong>${entry.changed_by || 'System'}</strong>
                                                        </div>
                                                        ${entry.reason ? `
                                                            <div class="mt-2 pt-2 border-top">
                                                                <small class="text-muted">
                                                                    <i class="bi bi-chat-left-text me-1"></i>
                                                                    Powód: ${entry.reason}
                                                                </small>
                                                            </div>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `
                            }).join('')}
                        </div>
                        
                        <style>
                            .timeline-icon-wrapper {
                                position: relative;
                            }
                            .timeline-line {
                                position: absolute;
                                left: 50%;
                                top: 45px;
                                width: 2px;
                                height: calc(100% + 20px);
                                background-color: #dee2e6;
                                transform: translateX(-50%);
                            }
                            .current-status .card {
                                box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
                            }
                        </style>
                    `
                }
            }

            // Cleanup on modal hidden
            document.getElementById('statusHistoryModal')?.addEventListener('hidden.bs.modal', () => {
                document.getElementById('statusHistoryModal')?.remove()
            })

        } catch (error) {
            console.error('Error loading status history:', error)
            
            // Close loading modal if exists
            const modal = document.getElementById('statusHistoryModal')
            if (modal) {
                const bsModal = (window as any).bootstrap.Modal.getInstance(modal)
                if (bsModal) bsModal.hide()
                modal.remove()
            }
            
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się załadować historii statusów',
                    duration: 3000
                }
            }))
        }
    }
}

// Export to global scope
;(window as any).AdminLessons = AdminLessons