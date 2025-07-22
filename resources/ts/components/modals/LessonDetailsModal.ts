import Swal from 'sweetalert2'
import { api } from '../../services/ApiService'
import { authService } from '../../services/AuthService'

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

            // Pobierz rolę użytkownika z authService
            const user = await authService.getCurrentUser()
            const userRole = user?.role || 'student'
            let endpoint = `/student/lessons/${lessonId}`
            
            if (userRole === 'admin') {
                endpoint = `/lessons/${lessonId}`
            } else if (userRole === 'tutor') {
                endpoint = `/tutor/lessons/${lessonId}`
            }
            
            // Pobierz szczegóły lekcji
            const response = await api.get<{ success: boolean; data: { lesson: LessonDetails } }>(endpoint)
            
            // ApiService może zwrócić pusty obiekt jeśli był błąd 403/404/500
            if (!response || Object.keys(response).length === 0) {
                throw new Error('Nie udało się pobrać szczegółów lekcji. Sprawdź uprawnienia.')
            }
            
            if (!response.success || !response.data) {
                throw new Error('Nie udało się pobrać szczegółów lekcji')
            }

            const lesson = response.data.lesson
            
            // Przygotuj HTML z szczegółami
            const html = this.buildDetailsHtml(lesson)
            
            // Pokaż modal ze szczegółami
            await Swal.fire({
                title: `Szczegóły lekcji #${lessonId}`,
                html: html,
                width: '600px',
                showCancelButton: true,
                confirmButtonText: 'Zamknij',
                cancelButtonText: this.getActionButton(lesson),
                confirmButtonColor: '#3085d6',
                cancelButtonColor: this.getActionButtonColor(lesson),
                customClass: {
                    container: 'lesson-details-modal',
                    popup: 'lesson-details-popup',
                    htmlContainer: 'lesson-details-content'
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

    private static buildDetailsHtml(lesson: LessonDetails): string {
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
                scheduled: { text: 'Zaplanowana', class: 'bg-blue-100 text-blue-800' },
                completed: { text: 'Zakończona', class: 'bg-green-100 text-green-800' },
                cancelled: { text: 'Anulowana', class: 'bg-red-100 text-red-800' },
                no_show: { text: 'Nieobecność', class: 'bg-yellow-100 text-yellow-800' }
            }
            const statusInfo = statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' }
            return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusInfo.class}">${statusInfo.text}</span>`
        }

        const getPaymentBadge = (isPaid: boolean) => {
            if (isPaid) {
                return '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Opłacona</span>'
            }
            return '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Nieopłacona</span>'
        }

        let html = `
            <div class="lesson-details">
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Informacje o lekcji</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Data:</p>
                            <p class="font-medium">${formatDate(lesson.lesson_date)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Godzina:</p>
                            <p class="font-medium">${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Czas trwania:</p>
                            <p class="font-medium">${lesson.duration_minutes} minut</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Status:</p>
                            <p>${getStatusBadge(lesson.status)}</p>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Szczegóły zajęć</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Język:</p>
                            <p class="font-medium">${lesson.language}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Typ lekcji:</p>
                            <p class="font-medium">${lesson.lesson_type === 'individual' ? 'Indywidualna' : 'Grupowa'}</p>
                        </div>
                        ${lesson.topic ? `
                        <div class="col-span-2">
                            <p class="text-sm text-gray-600">Temat:</p>
                            <p class="font-medium">${lesson.topic}</p>
                        </div>
                        ` : ''}
                        ${lesson.notes ? `
                        <div class="col-span-2">
                            <p class="text-sm text-gray-600">Notatki:</p>
                            <p class="font-medium">${lesson.notes}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Lektor</h3>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="font-medium">${lesson.tutor.name}</p>
                        <p class="text-sm text-gray-600">${lesson.tutor.email}</p>
                        ${lesson.tutor.tutor_profile ? `
                            <div class="mt-2">
                                <p class="text-sm text-gray-600">Języki: ${lesson.tutor.tutor_profile.languages.join(', ')}</p>
                                <!-- <p class="text-sm text-gray-600">Stawka: ${lesson.tutor.tutor_profile.hourly_rate} zł/h</p> -->
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Pakiet</h3>
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
                    <h3 class="text-lg font-semibold mb-4">Informacje o anulowaniu</h3>
                    <div class="bg-red-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600">Anulowana przez: ${lesson.cancelled_by}</p>
                        <p class="text-sm text-gray-600">Data anulowania: ${formatDate(lesson.cancelled_at!)}</p>
                        ${lesson.cancellation_reason ? `
                            <p class="text-sm text-gray-600 mt-2">Powód: ${lesson.cancellation_reason}</p>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                ${lesson.student_rating ? `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Twoja ocena</h3>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="flex items-center mb-2">
                            <span class="text-yellow-400">${'★'.repeat(lesson.student_rating)}${'☆'.repeat(5 - lesson.student_rating)}</span>
                            <span class="ml-2 font-medium">${lesson.student_rating}/5</span>
                        </div>
                        ${lesson.student_feedback ? `
                            <p class="text-sm text-gray-700">${lesson.student_feedback}</p>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `

        return html
    }

    private static getActionButton(lesson: LessonDetails): string {
        if (lesson.status === 'scheduled') {
            return 'Anuluj lekcję'
        } else if (lesson.status === 'completed' && !lesson.student_rating) {
            return 'Oceń lekcję'
        }
        return ''
    }

    private static getActionButtonColor(lesson: LessonDetails): string {
        if (lesson.status === 'scheduled') {
            return '#dc2626' // red
        } else if (lesson.status === 'completed' && !lesson.student_rating) {
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
}

// Inicjalizuj przy załadowaniu
LessonDetailsModal.initialize()

// Eksportuj do globalnego scope
;(window as any).LessonDetailsModal = LessonDetailsModal