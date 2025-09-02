import { LessonService } from '@services/LessonService'
import Swal from 'sweetalert2'

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
            const response = await LessonService.getStudentLessons('upcoming')
            const lessons = response.lessons || []
            
            // Backend now properly filters upcoming lessons
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
                                        ${lesson.status === 'scheduled' ? 
                                            `<li><a class="dropdown-item text-danger" href="#" onclick="StudentLessons.cancelLesson(${lesson.id})">
                                                <i class="bi bi-x-circle me-2"></i>Anuluj${!canCancel ? ' (ostrzeżenie)' : ''}
                                            </a></li>` : 
                                            ''
                                        }
                                        <li><a class="dropdown-item" href="#" onclick="StudentLessons.viewLessonDetails(${lesson.id})">
                                            <i class="bi bi-eye me-2"></i>Szczegóły
                                        </a></li>
                                        <li><a class="dropdown-item" href="/student/dashboard?section=tutor-profile&tutor_id=${lesson.tutor_id}">
                                            <i class="bi bi-person me-2"></i>Profil lektora
                                        </a></li>
                                    </ul>
                                </div>
                                <div class="mt-2" id="meeting-button-${lesson.id}">
                                    <!-- Meeting button will be initialized here -->
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
        
        // Initialize meeting buttons for each lesson
        lessons.forEach(lesson => {
            const buttonContainer = document.getElementById(`meeting-button-${lesson.id}`)
            if (buttonContainer) {
                import('@components/video/MeetingButton').then(({ MeetingButton }) => {
                    new MeetingButton(buttonContainer, lesson.id, {
                        onMeetingOpen: () => {
                            window.location.hash = `#/lesson/${lesson.id}/meeting`
                        }
                    })
                })
            }
        })
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
        const hoursUntilLesson = (lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        return lesson.status === 'scheduled' && hoursUntilLesson >= 12
    }
    
    private getLanguageName(code: string): string {
        const languages: { [key: string]: string } = {
            'english': 'Angielski',
            'german': 'Niemiecki', 
            'french': 'Francuski',
            'spanish': 'Hiszpański',
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
            const response = await LessonService.getStudentLessons('past')
            const lessons = response.lessons || []
            
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
        try {
            // Najpierw pobierz szczegóły lekcji aby sprawdzić czas
            const response = await LessonService.getLessonDetails(lessonId)
            const lesson = response.data
            
            // Sprawdź czy można anulować bez konsekwencji
            const lessonDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`)
            const now = new Date()
            const hoursUntilLesson = (lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
            const canCancelWithoutPenalty = hoursUntilLesson >= 12
            
            // Przygotuj odpowiedni komunikat
            const warningHtml = canCancelWithoutPenalty ? 
                `<div class="alert alert-info mt-3">
                    <i class="bi bi-info-circle me-2"></i>
                    Możesz anulować tę lekcję bez żadnych konsekwencji.
                </div>` :
                `<div class="alert alert-danger mt-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Uwaga!</strong> Anulowanie lekcji na mniej niż 12 godzin przed rozpoczęciem:
                    <ul class="mb-0 mt-2">
                        <li>Może skutkować utratą opłaty za lekcję</li>
                        <li>Będzie odnotowane w Twojej historii</li>
                        <li>Zbyt częste późne anulowania mogą wpłynąć na Twój dostęp do rezerwacji</li>
                    </ul>
                </div>`
            
            // Użyj SweetAlert2 dla lepszego UX
            const { value: formValues } = await Swal.fire({
                title: 'Anulowanie lekcji',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Czy na pewno chcesz anulować lekcję #${lessonId}?</p>
                        <div class="mb-3">
                            <strong>Data:</strong> ${new Date(lesson.lesson_date).toLocaleDateString('pl-PL')}<br>
                            <strong>Godzina:</strong> ${lesson.start_time} - ${lesson.end_time}<br>
                            <strong>Lektor:</strong> ${lesson.tutor?.name || 'Nieznany'}
                        </div>
                        <div class="form-group">
                            <label for="cancel-reason" class="form-label">Powód anulowania ${!canCancelWithoutPenalty ? '(wymagany)' : '(opcjonalny)'}:</label>
                            <textarea id="cancel-reason" class="form-control" rows="3" 
                                placeholder="Podaj powód anulowania lekcji..." 
                                ${!canCancelWithoutPenalty ? 'required' : ''}></textarea>
                        </div>
                        ${warningHtml}
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: canCancelWithoutPenalty ? 'Anuluj lekcję' : 'Anuluj mimo ostrzeżenia',
                cancelButtonText: 'Wróć',
                confirmButtonColor: canCancelWithoutPenalty ? '#dc3545' : '#d9534f',
                cancelButtonColor: '#6c757d',
                focusConfirm: false,
                preConfirm: () => {
                    const reason = (document.getElementById('cancel-reason') as HTMLTextAreaElement)?.value
                    if (!canCancelWithoutPenalty && !reason) {
                        Swal.showValidationMessage('Musisz podać powód anulowania lekcji poniżej 12h')
                        return false
                    }
                    return { reason: reason || 'Anulowanie przez studenta' }
                }
            })
            
            if (!formValues) return
        } catch (error) {
            console.error('Error fetching lesson details:', error)
            // Jeśli nie uda się pobrać szczegółów, użyj standardowego dialogu
            var formValues = await Swal.fire({
                title: 'Anulowanie lekcji',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Czy na pewno chcesz anulować lekcję #${lessonId}?</p>
                        <div class="form-group">
                            <label for="cancel-reason" class="form-label">Powód anulowania:</label>
                            <textarea id="cancel-reason" class="form-control" rows="3" placeholder="Podaj powód anulowania lekcji..."></textarea>
                        </div>
                        <div class="alert alert-warning mt-3">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>Uwaga:</strong> Anulowanie lekcji na mniej niż 12 godzin przed rozpoczęciem może skutkować konsekwencjami.
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
                    return { reason: reason || 'Anulowanie przez studenta' }
                }
            }).then(result => result.value)
            
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
            const response = await LessonService.cancelStudentLesson(lessonId, formValues.reason)
            
            if (response.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Lekcja anulowana',
                    text: 'Lekcja została anulowana pomyślnie. Lista lekcji zostanie odświeżona.',
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true
                })
                
                // Odśwież tylko sekcję lekcji zamiast całej strony
                if ((window as any).studentDashboard) {
                    (window as any).studentDashboard.loadContent('nadchodzace')
                } else {
                    location.reload()
                }
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
    
    static async rateLesson(lessonId: number): Promise<void> {
        // Użyj SweetAlert2 dla lepszego UX oceniania
        const { value: formValues } = await Swal.fire({
            title: 'Oceń lekcję',
            html: `
                <div class="text-left">
                    <p class="mb-3">Jak oceniasz lekcję #${lessonId}?</p>
                    <div class="form-group mb-3">
                        <label class="form-label">Ocena (1-5 gwiazdek):</label>
                        <div class="rating-stars text-center py-2">
                            <span class="star" data-rating="1">★</span>
                            <span class="star" data-rating="2">★</span>
                            <span class="star" data-rating="3">★</span>
                            <span class="star" data-rating="4">★</span>
                            <span class="star" data-rating="5">★</span>
                        </div>
                        <input type="hidden" id="lesson-rating" value="">
                    </div>
                    <div class="form-group">
                        <label for="lesson-feedback" class="form-label">Komentarz (opcjonalny):</label>
                        <textarea id="lesson-feedback" class="form-control" rows="3" placeholder="Podziel się swoją opinią o lekcji..."></textarea>
                    </div>
                </div>
                <style>
                    .rating-stars .star {
                        font-size: 2rem;
                        color: #ddd;
                        cursor: pointer;
                        margin: 0 2px;
                        transition: color 0.2s;
                    }
                    .rating-stars .star.active,
                    .rating-stars .star:hover {
                        color: #ffc107;
                    }
                </style>
            `,
            showCancelButton: true,
            confirmButtonText: 'Dodaj ocenę',
            cancelButtonText: 'Anuluj',
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            focusConfirm: false,
            didOpen: () => {
                // Obsługa kliknięć na gwiazdki
                const stars = document.querySelectorAll('.star')
                const ratingInput = document.getElementById('lesson-rating') as HTMLInputElement
                
                stars.forEach((star, index) => {
                    star.addEventListener('click', () => {
                        const rating = index + 1
                        ratingInput.value = rating.toString()
                        
                        // Aktualizuj wygląd gwiazdek
                        stars.forEach((s, i) => {
                            if (i < rating) {
                                s.classList.add('active')
                            } else {
                                s.classList.remove('active')
                            }
                        })
                    })
                    
                    star.addEventListener('mouseenter', () => {
                        stars.forEach((s, i) => {
                            const htmlElement = s as HTMLElement
                            if (i <= index) {
                                htmlElement.style.color = '#ffc107'
                            } else {
                                htmlElement.style.color = '#ddd'
                            }
                        })
                    })
                })
                
                document.querySelector('.rating-stars')?.addEventListener('mouseleave', () => {
                    const currentRating = parseInt(ratingInput.value) || 0
                    stars.forEach((s, i) => {
                        const htmlElement = s as HTMLElement
                        if (i < currentRating) {
                            htmlElement.style.color = '#ffc107'
                        } else {
                            htmlElement.style.color = '#ddd'
                        }
                    })
                })
            },
            preConfirm: () => {
                const rating = (document.getElementById('lesson-rating') as HTMLInputElement)?.value
                const feedback = (document.getElementById('lesson-feedback') as HTMLTextAreaElement)?.value
                
                if (!rating || parseInt(rating) < 1 || parseInt(rating) > 5) {
                    Swal.showValidationMessage('Proszę wybrać ocenę od 1 do 5 gwiazdek')
                    return false
                }
                
                return { rating: parseInt(rating), feedback: feedback || '' }
            }
        })

        if (!formValues) return

        // Pokaż loader
        Swal.fire({
            title: 'Dodawanie oceny...',
            text: 'Proszę czekać',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading()
            }
        })
        
        try {
            const response = await LessonService.addStudentFeedback(lessonId, {
                rating: formValues.rating,
                feedback: formValues.feedback
            })
            
            if (response.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Ocena dodana',
                    text: 'Dziękujemy za ocenę lekcji. Lista lekcji zostanie odświeżona.',
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true
                })
                
                // Odśwież tylko sekcję lekcji
                if ((window as any).studentDashboard) {
                    (window as any).studentDashboard.loadContent('historia')
                } else {
                    location.reload()
                }
            } else {
                throw new Error(response.message || 'Błąd podczas dodawania oceny')
            }
        } catch (error: any) {
            console.error('Error rating lesson:', error)
            await Swal.fire({
                icon: 'error',
                title: 'Błąd oceny',
                text: error.message || 'Wystąpił błąd podczas dodawania oceny',
                confirmButtonText: 'OK'
            })
        }
    }
    
    static async viewLessonDetails(lessonId: number): Promise<void> {
        // Importuj i wywołaj modal ze szczegółami
        if ((window as any).LessonDetailsModal) {
            await (window as any).LessonDetailsModal.show(lessonId)
        } else {
            // Fallback jeśli modal nie jest załadowany
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie można załadować szczegółów lekcji',
                    duration: 3000
                }
            }))
        }
    }

    public async getUpcomingLessonsPreview(): Promise<string> {
        try {
            const response = await LessonService.getStudentLessons('upcoming', 3)
            const lessons = response.lessons || []
            
            if (lessons.length === 0) {
                return `
                    <div class="text-center py-3">
                        <div class="text-muted">
                            <i class="bi bi-calendar-x fs-1 mb-2"></i>
                            <p>Brak nadchodzących lekcji</p>
                            <button class="btn btn-primary btn-sm" data-action="goto-rezerwuj">
                                Zarezerwuj pierwszą lekcję
                            </button>
                        </div>
                    </div>
                `
            }
            
            const lessonsHtml = lessons.map((lesson: any) => {
                const lessonDate = new Date(lesson.lesson_date)
                const startTime = lesson.start_time ? new Date(`1970-01-01T${lesson.start_time}:00`) : null
                
                return `
                <div class="d-flex align-items-center py-2 border-bottom">
                    <div class="me-3">
                        <div class="bg-primary text-white rounded p-2 text-center" style="min-width: 50px;">
                            <div class="fw-bold">${lessonDate.getDate()}</div>
                            <div class="small">${lessonDate.toLocaleDateString('pl-PL', { month: 'short' })}</div>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-semibold">${lesson.tutor?.name || 'Nieznany lektor'}</div>
                        <div class="text-muted small">
                            ${startTime ? startTime.toLocaleTimeString('pl-PL', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            }) : '00:00'} - ${lesson.lesson_type || 'Standardowa'}
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success">Zaplanowana</span>
                    </div>
                </div>
                `
            }).join('')
            
            return `
                ${lessonsHtml}
                <div class="text-center pt-3">
                    <button class="btn btn-outline-primary btn-sm" data-action="goto-nadchodzace">
                        Zobacz wszystkie
                    </button>
                </div>
            `
        } catch (error) {
            console.error('Error loading upcoming lessons preview:', error)
            return `
                <div class="text-center py-3 text-muted">
                    <p>Nie udało się załadować nadchodzących lekcji</p>
                </div>
            `
        }
    }
}