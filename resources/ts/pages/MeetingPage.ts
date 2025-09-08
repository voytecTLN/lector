import { DailyVideoComponent } from '@components/video/DailyVideoComponent'
import { api } from '@services/ApiService'
import { authService } from '@services/AuthService'
import { AvatarHelper } from '@/utils/AvatarHelper'
import Swal from 'sweetalert2'

import type { RouteComponent } from '@router/routes'

export class MeetingPage implements RouteComponent {
    private lessonId: number
    private videoComponent: DailyVideoComponent | null = null
    private isInitialized: boolean = false

    constructor() {
        // Pobierz ID lekcji z URL (hash routing)
        const hash = window.location.hash.replace('#', '')
        const pathParts = hash.split('/')
        const lessonIdIndex = pathParts.indexOf('lesson') + 1
        this.lessonId = parseInt(pathParts[lessonIdIndex])
        
        console.log('MeetingPage constructor:', {
            hash,
            pathParts,
            lessonIdIndex,
            lessonId: this.lessonId
        })
        
        if (!this.lessonId || isNaN(this.lessonId)) {
            this.showError('Nieprawidłowy identyfikator lekcji')
            return
        }
    }

    private async init(): Promise<void> {
        if (this.isInitialized) {
            console.log('MeetingPage already initialized, skipping...')
            return
        }
        this.isInitialized = true
        
        try {
            // Sprawdź czy użytkownik jest zalogowany
            const user = await authService.getCurrentUser()
            if (!user) {
                window.location.href = '/login'
                return
            }

            // Pobierz szczegóły lekcji
            const lesson = await this.getLessonDetails()
            if (!lesson) {
                this.showError('Nie znaleziono lekcji')
                return
            }

            // Sprawdź uprawnienia
            if (user.id !== lesson.student_id && user.id !== lesson.tutor_id) {
                this.showError('Nie masz uprawnień do tej lekcji')
                return
            }

            // Ustaw tytuł strony
            document.title = `Spotkanie - Lekcja #${this.lessonId}`

            // Zrenderuj stronę
            this.renderContent(lesson)

        } catch (error) {
            console.error('Error initializing meeting page:', error)
            this.showError('Wystąpił błąd podczas ładowania strony')
        }
    }

    private async getLessonDetails(): Promise<any> {
        try {
            const user = await authService.getCurrentUser()
            const endpoint = user?.role === 'tutor' 
                ? `/tutor/lessons/${this.lessonId}`
                : `/student/lessons/${this.lessonId}`

            const response = await api.get(endpoint)
            return (response as any).data?.lesson
        } catch (error) {
            console.error('Error fetching lesson details:', error)
            return null
        }
    }

    public render(): HTMLElement {
        const container = document.createElement('div')
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Ładowanie...</span></div></div>'
        
        // Start initialization
        this.init()
        
        return container
    }
    
    private renderContent(lesson: any): void {
        const app = document.getElementById('app')
        if (!app) return

        app.innerHTML = `
            <div class="meeting-page-wrapper" style="min-height: 100vh; background-color: #f5f5f5;">
                <!-- Meeting Header -->
                <div class="meeting-header bg-white border-bottom sticky-top" style="z-index: 100;">
                    <div class="container-fluid px-4">
                        <div class="row align-items-center py-3">
                            <div class="col-auto">
                                <button class="btn btn-light back-btn" title="Powrót">
                                    <i class="bi bi-arrow-left"></i>
                                </button>
                            </div>
                            <div class="col">
                                <h5 class="mb-0 fw-semibold">Spotkanie online - Lekcja #${this.lessonId}</h5>
                                <small class="text-muted">${this.formatLessonInfo(lesson)}</small>
                            </div>
                            <div class="col-auto">
                                <span class="badge bg-success">
                                    <i class="bi bi-camera-video-fill me-1"></i>
                                    Spotkanie aktywne
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <main class="meeting-content">
                    <!-- Video Container - Full Device Width -->
                    <div class="mb-4" style="width: 100vw; margin-left: calc(-50vw + 50%);">
                        <div class="card shadow-sm" style="border-radius: 0; border-left: none; border-right: none;">
                            <div class="card-body p-0" style="min-height: 70vh; background-color: #000;">
                                <div id="video-container" style="height: 70vh; width: 100%;">
                                        <!-- Daily.co component będzie tutaj -->
                                    </div>
                                </div>
                            </div>
                        </div>

                    <!-- Info and Tips Section - Side by Side -->
                    <div class="container-fluid px-4">
                        <div class="row g-4">
                        <!-- Lesson Info Card - 50% -->
                        <div class="col-md-6">
                            <div class="card shadow-sm h-100">
                                <div class="card-header bg-white">
                                    <h6 class="mb-0 fw-semibold">
                                        <i class="bi bi-info-circle me-2"></i>Informacje o lekcji
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <small class="text-muted d-block">Lektor</small>
                                        <div class="d-flex align-items-center mt-1">
                                            ${AvatarHelper.render({
                                                name: lesson.tutor.name,
                                                avatar: lesson.tutor.avatar,
                                                size: 'sm',
                                                className: 'me-2',
                                                userId: lesson.tutor.id
                                            })}
                                            <span class="fw-medium">${lesson.tutor.name}</span>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <small class="text-muted d-block">Uczeń</small>
                                        <div class="d-flex align-items-center mt-1">
                                            ${AvatarHelper.render({
                                                name: lesson.student.name,
                                                avatar: lesson.student.avatar,
                                                size: 'sm',
                                                className: 'me-2',
                                                userId: lesson.student.id
                                            })}
                                            <span class="fw-medium">${lesson.student.name}</span>
                                        </div>
                                    </div>
                                    ${lesson.topic ? `
                                    <div>
                                        <small class="text-muted d-block">Temat</small>
                                        <span class="fw-medium">${lesson.topic}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Tips Card - 50% -->
                        <div class="col-md-6">
                            <div class="card shadow-sm h-100">
                                <div class="card-header bg-white">
                                    <h6 class="mb-0 fw-semibold">
                                        <i class="bi bi-lightbulb me-2"></i>Wskazówki
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex align-items-start mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2 mt-1" style="font-size: 14px;"></i>
                                        <small>Upewnij się, że kamera i mikrofon działają poprawnie</small>
                                    </div>
                                    <div class="d-flex align-items-start mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2 mt-1" style="font-size: 14px;"></i>
                                        <small>Znajdź ciche miejsce bez zakłóceń</small>
                                    </div>
                                    <div class="d-flex align-items-start mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2 mt-1" style="font-size: 14px;"></i>
                                        <small>Sprawdź stabilność połączenia internetowego</small>
                                    </div>
                                    <div class="d-flex align-items-start">
                                        <i class="bi bi-check-circle-fill text-success me-2 mt-1" style="font-size: 14px;"></i>
                                        <small>Przygotuj materiały do lekcji</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </main>
            </div>
        `

        // Event listeners
        app.querySelector('.back-btn')?.addEventListener('click', () => {
            window.history.back()
        })

        // Inicjalizuj komponent video
        const videoContainer = document.getElementById('video-container')
        if (videoContainer) {
            this.videoComponent = new DailyVideoComponent(videoContainer, this.lessonId)
        }
    }

    private formatLessonInfo(lesson: any): string {
        const date = new Date(lesson.lesson_date).toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        const startTime = lesson.start_time.substring(0, 5)
        const endTime = lesson.end_time.substring(0, 5)
        
        return `${date}, ${startTime} - ${endTime}`
    }

    public showError(message: string): void {
        const app = document.getElementById('app')
        if (!app) return

        app.innerHTML = `
            <div class="d-flex align-items-center justify-content-center" style="min-height: 100vh; background-color: #f5f5f5;">
                <div class="card shadow-sm" style="max-width: 500px; width: 100%;">
                    <div class="card-body text-center p-5">
                        <div class="text-danger mb-4">
                            <i class="bi bi-exclamation-circle" style="font-size: 4rem;"></i>
                        </div>
                        <h3 class="mb-3">Błąd</h3>
                        <p class="text-muted mb-4">${message}</p>
                        <button onclick="window.history.back()" class="btn btn-primary">
                            <i class="bi bi-arrow-left me-2"></i>
                            Powrót
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    public destroy(): void {
        if (this.videoComponent) {
            this.videoComponent.destroy()
            this.videoComponent = null
        }
    }
}

// Automatyczna inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
    new MeetingPage()
})