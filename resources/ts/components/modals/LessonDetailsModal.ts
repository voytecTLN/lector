import Swal from 'sweetalert2'
import {LessonService} from '@services/LessonService'
import {authService} from '@services/AuthService'
import {MeetingButton} from '../video/MeetingButton'
import {LessonStatusManager} from '@/components/lessons/LessonStatusManager'
import {AvatarHelper} from '@/utils/AvatarHelper'

interface LessonDetails {
    id: number
    student_id: number
    tutor_id: number
    lesson_date: string
    start_time: string
    end_time: string
    duration_minutes: number
    status: string
    language: string
    lesson_type: string
    topic: string
    notes: string | null
    price: number
    is_paid: boolean
    student_rating: number | null
    student_feedback: string | null
    cancelled_at: string | null
    cancelled_by: string | null
    cancellation_reason: string | null
    tutor: {
        id: number
        name: string
        email: string
        avatar?: string
        tutor_profile: {
            specializations: string[]
            languages: string[]
            hourly_rate: number
            bio: string | null
        }
    }
    student: {
        id: number
        name: string
        email: string
    }
    package_assignment?: {
        id: number
        package: {
            id: number
            name: string
            lesson_type: string
            lessons_total: number
        }
    }
}

export class LessonDetailsModal {
    static initialize(): void {
        // Using singleton api instance
    }

    static async show(lessonId: number): Promise<void> {
        try {
            // Pokaż loader
            Swal.fire({
                title: 'Ładowanie...',
                text: 'Pobieranie szczegółów lekcji',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading()
                }
            })

            // Pobierz szczegóły lekcji
            const response = await LessonService.getLessonDetails(lessonId)
            
            // Check if response is valid
            if (!response || Object.keys(response).length === 0) {
                throw new Error('Nie udało się pobrać szczegółów lekcji. Sprawdź uprawnienia.')
            }
            
            // Handle different response structures
            const lesson = response.lesson || response.data?.lesson || response
            
            // Przygotuj HTML z szczegółami
            const html = await this.buildDetailsHtml(lesson)
            
            // Get action button text and color
            const actionButtonText = await this.getActionButton(lesson)
            const actionButtonColor = await this.getActionButtonColor(lesson)
            
            // Pokaż modal ze szczegółami
            await Swal.fire({
                title: `Szczegóły lekcji`,
                html: html,
                width: '600px',
                showCancelButton: actionButtonText !== '',
                confirmButtonText: 'Zamknij',
                cancelButtonText: actionButtonText,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: actionButtonColor,
                customClass: {
                    container: 'lesson-details-modal',
                    popup: 'lesson-details-popup',
                    htmlContainer: 'lesson-details-content'
                },
                didOpen: () => {
                    // Inicjalizuj przycisk spotkania jeśli istnieje
                    const meetingButtonContainer = document.getElementById('meeting-button-container')
                    if (meetingButtonContainer) {
                        new MeetingButton(meetingButtonContainer, lesson.id, {
                            onMeetingOpen: () => {
                                Swal.close()
                                // Use hash routing for SPA navigation
                                window.location.hash = `#/lesson/${lesson.id}/meeting`
                            }
                        })
                    } else {
                    }
                }
            }).then((result: any) => {
                if (result.dismiss === Swal.DismissReason.cancel) {
                    // Obsłuż akcję przycisku (anuluj/oceń)
                    this.handleActionButton(lesson)
                }
            })
            
        } catch (error) {
            console.error('Error loading lesson details:', error)
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: 'Nie udało się załadować szczegółów lekcji'
            })
        }
    }

    private static async buildDetailsHtml(lesson: LessonDetails): Promise<string> {
        const formatDate = (date: string) => {
            return new Date(date).toLocaleDateString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }

        const formatTime = (time: string) => {
            return time.substring(0, 5)
        }

        const getStatusBadge = (status: string) => {
            const statusMap: Record<string, { text: string; class: string }> = {
                scheduled: { text: 'Zaplanowana', class: 'badge bg-primary' },
                completed: { text: 'Zakończona', class: 'badge bg-success' },
                cancelled: { text: 'Anulowana', class: 'badge bg-danger' },
                no_show: { text: 'Nieobecność', class: 'badge bg-warning text-dark' },
                not_started: { text: 'Nie rozpoczęta', class: 'badge bg-dark' },
                in_progress: { text: 'W trakcie', class: 'badge bg-info' },
                technical_issues: { text: 'Problemy techniczne', class: 'badge bg-secondary' },
                no_show_student: { text: 'Student nieobecny', class: 'badge bg-warning text-dark' },
                no_show_tutor: { text: 'Lektor nieobecny', class: 'badge bg-warning text-dark' }
            }
            const statusInfo = statusMap[status] || { text: status, class: 'badge bg-secondary' }
            return `<span class="${statusInfo.class}">${statusInfo.text}</span>`
        }

        const getPaymentBadge = (isPaid: boolean) => {
            if (isPaid) {
                return '<span class="badge bg-success">Opłacona</span>'
            }
            return '<span class="badge bg-warning text-dark">Nieopłacona</span>'
        }

        return `
            <div class="lesson-details">
                <div class="mb-6">
                    <h3 class="h5 mb-4">Informacje o lekcji</h3>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <p class="text-muted small mb-1">Data:</p>
                            <p class="fw-bold">${formatDate(lesson.lesson_date)}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="text-muted small mb-1">Godzina:</p>
                            <p class="fw-bold">${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="text-muted small mb-1">Czas trwania:</p>
                            <p class="fw-bold">${lesson.duration_minutes} minut</p>
                        </div>
                        <div class="col-md-6">
                            <p class="text-muted small mb-1">Status:</p>
                            <p>${getStatusBadge(lesson.status)}</p>
                        </div>
                    </div>
                </div>

                ${await this.buildMeetingSection(lesson)}

                ${await this.buildStatusSection(lesson)}

                <div class="mb-6">
                    <h3 class="h5 mb-4">Szczegóły zajęć</h3>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <p class="text-muted small mb-1">Typ lekcji:</p>
                            <p class="fw-bold">${lesson.lesson_type === 'individual' ? 'Indywidualna' : 'Grupowa'}</p>
                        </div>
                        ${lesson.topic ? `
                        <div class="col-12">
                            <p class="text-muted small mb-1">Temat:</p>
                            <p class="fw-bold">${lesson.topic}</p>
                        </div>
                        ` : ''}
                        ${lesson.notes ? `
                        <div class="col-12">
                            <p class="text-muted small mb-1">Notatki:</p>
                            <p class="fw-bold">${lesson.notes}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="h5 mb-4">Lektor</h3>
                    <div class="bg-light p-4 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="d-flex align-items-center">
                                <div class="me-3">
                                    ${AvatarHelper.render({
                                        name: lesson.tutor.name,
                                        avatar: lesson.tutor.avatar,
                                        size: 'md',
                                        userId: lesson.tutor.id
                                    })}
                                </div>
                                <div>
                                    <p class="fw-bold mb-1">${lesson.tutor.name}</p>
                                    <p class="text-muted small mb-0">${lesson.tutor.email}</p>
                                    ${lesson.tutor.tutor_profile ? `
                                        <div class="mt-2">
                                            <p class="text-muted small mb-0">Języki: ${lesson.tutor.tutor_profile.languages.join(', ')}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            ${await this.getTutorProfileButton(lesson)}
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="h5 mb-4">Pakiet</h3>
                    <!-- <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Cena:</p>
                            <p class="font-medium">${lesson.price} zł</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Status płatności:</p>
                            <p>${getPaymentBadge(lesson.is_paid)}</p>
                        </div>
                    </div>
                    -->
                    ${lesson.package_assignment ? `
                        <div class="mt-2">
                            <!-- <p class="text-sm text-gray-600">Pakiet:</p> -->
                            <p class="font-medium">${lesson.package_assignment.package.name}</p>
                        </div>
                    ` : ''}
                </div>

                ${lesson.status === 'cancelled' ? `
                <div class="mb-6">
                    <h3 class="h5 mb-4">Informacje o anulowaniu</h3>
                    <div class="alert alert-danger">
                        <p class="mb-1"><strong>Anulowana przez:</strong> ${lesson.cancelled_by}</p>
                        <p class="mb-1"><strong>Data anulowania:</strong> ${formatDate(lesson.cancelled_at!)}</p>
                        ${lesson.cancellation_reason ? `
                            <p class="mb-0"><strong>Powód:</strong> ${lesson.cancellation_reason}</p>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                ${lesson.student_rating ? `
                <div class="mb-6">
                    <h3 class="h5 mb-4">Twoja ocena</h3>
                    <div class="alert alert-success">
                        <div class="d-flex align-items-center mb-2">
                            <span class="text-warning">${'★'.repeat(lesson.student_rating)}${'☆'.repeat(5 - lesson.student_rating)}</span>
                            <span class="ms-2 fw-bold">${lesson.student_rating}/5</span>
                        </div>
                        ${lesson.student_feedback ? `
                            <p class="mb-0">${lesson.student_feedback}</p>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `
    }

    private static async buildStatusSection(lesson: LessonDetails): Promise<string> {
        const user = await authService.getCurrentUser()
        
        // Show status section only for tutors and only for certain statuses
        if (user?.role !== 'tutor' || user.id !== lesson.tutor_id) {
            return ''
        }
        
        const canChangeStatus = lesson.status === 'completed' || lesson.status === 'no_show_student' || lesson.status === 'technical_issues'
        
        if (!canChangeStatus) {
            return ''
        }
        
        const statusLabel = LessonStatusManager.getStatusLabel(lesson.status)
        const badgeClass = LessonStatusManager.getStatusBadgeClass(lesson.status)
        
        return `
            <div class="mb-6 p-4 bg-warning bg-opacity-10 rounded">
                <h3 class="h5 mb-3 d-flex align-items-center">
                    <i class="bi bi-arrow-repeat me-2"></i>
                    Zarządzanie statusem lekcji
                </h3>
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <p class="mb-1 text-muted small">Aktualny status:</p>
                        <span class="badge ${badgeClass}">${statusLabel}</span>
                    </div>
                    <button id="change-status-btn" class="btn btn-outline-warning btn-sm" 
                            onclick="LessonDetailsModal.changeStatus(${lesson.id}, '${lesson.status}')">
                        <i class="bi bi-arrow-repeat me-1"></i>
                        Zmień status
                    </button>
                </div>
            </div>
        `
    }

    private static async getTutorProfileButton(lesson: LessonDetails): Promise<string> {
        const user = await authService.getCurrentUser()
        
        // Show profile button only for students
        if (user?.role === 'student') {
            return `
                <a href="#/student/dashboard?section=tutor-profile&tutor_id=${lesson.tutor.id}" 
                   class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-person me-1"></i>
                    Profil
                </a>
            `
        }
        
        return ''
    }

    private static async buildMeetingSection(lesson: LessonDetails): Promise<string> {
        
        // Pokaż sekcję spotkania tylko dla aktywnych lekcji
        if (lesson.status !== 'scheduled' && lesson.status !== 'in_progress') {
            return ''
        }

        const user = await authService.getCurrentUser()
        
        const isTutor = user?.role === 'tutor' && user.id === lesson.tutor_id
        const isStudent = user?.role === 'student' && user.id === lesson.student_id
        const isParticipant = isTutor || isStudent

        if (!isParticipant) {
            return ''
        }

        return `
            <div class="mb-6 p-4 bg-info bg-opacity-10 rounded">
                <h3 class="h5 mb-3 d-flex align-items-center">
                    <i class="bi bi-camera-video me-2"></i>
                    Spotkanie online
                </h3>
                <div id="meeting-button-container" class="text-center">
                    <div class="text-muted">
                        <div class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        Sprawdzanie statusu spotkania...
                    </div>
                </div>
            </div>
        `
    }

    private static async getActionButton(lesson: LessonDetails): Promise<string> {
        if (lesson.status === 'scheduled') {
            return 'Anuluj lekcję'
        }
        
        // Only show rating option for students
        const user = await authService.getCurrentUser()
        if (user?.role === 'student' && lesson.status === 'completed' && !lesson.student_rating) {
            return 'Oceń lekcję'
        }
        
        return ''
    }

    private static async getActionButtonColor(lesson: LessonDetails): Promise<string> {
        if (lesson.status === 'scheduled') {
            return '#dc2626' // red
        }
        
        // Only show green for rating if user is student
        const user = await authService.getCurrentUser()
        if (user?.role === 'student' && lesson.status === 'completed' && !lesson.student_rating) {
            return '#10b981' // green
        }
        
        return '#6b7280' // gray
    }

    private static async handleActionButton(lesson: LessonDetails): Promise<void> {
        if (lesson.status === 'scheduled') {
            // Determine user role and call appropriate cancel function
            const user = await authService.getCurrentUser()
            const userRole = user?.role || 'student'
            
            if (userRole === 'admin' && (window as any).AdminLessons) {
                (window as any).AdminLessons.cancelLesson(lesson.id)
            } else if (userRole === 'tutor' && (window as any).TutorLessons) {
                (window as any).TutorLessons.cancelLesson(lesson.id)
            } else if ((window as any).StudentLessons) {
                (window as any).StudentLessons.cancelLesson(lesson.id)
            }
        } else if (lesson.status === 'completed' && !lesson.student_rating) {
            // Rating is only for students
            if ((window as any).StudentLessons) {
                (window as any).StudentLessons.rateLesson(lesson.id)
            }
        }
    }
    
    static async changeStatus(lessonId: number, currentStatus: string): Promise<void> {
        try {
            // Close the current lesson details modal first
            Swal.close()
            
            // Wait a bit for the modal to close
            setTimeout(async () => {
                const statusManager = new LessonStatusManager(lessonId, currentStatus, (newStatus: string) => {
                    // After status change, reopen lesson details modal with updated data
                    setTimeout(() => {
                        LessonDetailsModal.show(lessonId)
                    }, 300)
                })
                
                await statusManager.showModal()
            }, 200)
            
        } catch (error) {
            console.error('Error in changeStatus:', error)
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: 'Wystąpił błąd podczas zmiany statusu'
            })
        }
    }
}

// Inicjalizuj przy załadowaniu
LessonDetailsModal.initialize()

// Eksportuj do globalnego scope
;(window as any).LessonDetailsModal = LessonDetailsModal