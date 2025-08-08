import { api } from '@services/ApiService'
import { authService } from '@services/AuthService'
import Swal from 'sweetalert2'
import type { MeetingStatus } from '@/types/models'

interface ExtendedMeetingStatus extends MeetingStatus {
    active_participants: Array<{
        id: number
        name: string
        role: 'tutor' | 'student'
        joined_at: string
    }>
}

interface MeetingCredentials {
    room_url: string
    room_name: string
    token: string
    is_moderator: boolean
    participant_name?: string
}

export class DailyVideoComponent {
    private lessonId: number
    private container: HTMLElement
    private dailyFrame: any = null
    private statusCheckInterval: number | null = null
    private isDestroyed: boolean = false

    constructor(container: HTMLElement, lessonId: number) {
        this.container = container
        this.lessonId = lessonId
        console.log('🎥 DailyVideoComponent initialized for lesson:', lessonId)
        this.init()
    }

    private async init(): Promise<void> {
        console.log('🎬 DailyVideoComponent init() called')
        // Sprawdź status spotkania
        const status = await this.getMeetingStatus()
        
        console.log('📊 Meeting status received:', status)
        
        if (!status) {
            this.showError('Nie udało się pobrać statusu spotkania')
            return
        }

        // Pokaż odpowiedni interfejs
        await this.renderMeetingInterface(status)
        
        // Rozpocznij sprawdzanie statusu co 10 sekund
        this.startStatusChecking()
    }

    private async getMeetingStatus(): Promise<MeetingStatus | null> {
        try {
            const user = await authService.getCurrentUser()
            const endpoint = user?.role === 'tutor' 
                ? `/tutor/lessons/${this.lessonId}/meeting/status`
                : `/student/lessons/${this.lessonId}/meeting/status`

            const response = await api.get<{ success: boolean; data: MeetingStatus }>(endpoint)
            return response.success && response.data ? response.data : null
        } catch (error) {
            console.error('Error getting meeting status:', error)
            return null
        }
    }

    private async renderMeetingInterface(status: MeetingStatus): Promise<void> {
        this.container.innerHTML = ''
        
        const wrapper = document.createElement('div')
        wrapper.className = 'daily-video-wrapper'
        
        if (status.is_active && status.can_join) {
            // Spotkanie aktywne - pokaż przycisk dołączenia
            this.renderJoinInterface(wrapper, status as ExtendedMeetingStatus)
        } else if (status.has_room && status.can_start) {
            // Pokój istnieje i lektor może dołączyć
            this.renderRejoinInterface(wrapper, status)
        } else if (status.can_start) {
            // Lektor może rozpocząć spotkanie
            this.renderStartInterface(wrapper)
        } else if (!status.is_active && status.meeting_ended_at) {
            // Spotkanie zakończone
            this.renderEndedInterface(wrapper, status)
        } else {
            // Oczekiwanie na rozpoczęcie
            this.renderWaitingInterface(wrapper, status)
        }
        
        this.container.appendChild(wrapper)
    }

    private renderStartInterface(wrapper: HTMLElement): void {
        wrapper.innerHTML = `
            <div class="meeting-start-container d-flex align-items-center justify-content-center" style="height: 100%; min-height: 500px;">
                <div class="text-center">
                    <div class="mb-4">
                        <i class="bi bi-camera-video text-muted" style="font-size: 5rem;"></i>
                    </div>
                    <h3 class="fw-semibold mb-3">Rozpocznij spotkanie</h3>
                    <p class="text-muted mb-4">
                        Możesz rozpocząć spotkanie do 60 minut przed planowaną godziną.
                    </p>
                    <button class="btn btn-primary btn-lg start-meeting-btn">
                        <i class="bi bi-play-fill me-2"></i>
                        Rozpocznij spotkanie
                    </button>
                </div>
            </div>
        `
        
        wrapper.querySelector('.start-meeting-btn')?.addEventListener('click', () => {
            this.startMeeting()
        })
    }

    private renderRejoinInterface(wrapper: HTMLElement, status: MeetingStatus): void {
        wrapper.innerHTML = `
            <div class="meeting-rejoin-container d-flex align-items-center justify-content-center" style="height: 100%; min-height: 500px;">
                <div class="text-center">
                    <div class="mb-4">
                        <i class="bi bi-camera-video-fill text-success" style="font-size: 5rem;"></i>
                    </div>
                    <h3 class="fw-semibold mb-3">Pokój spotkania jest gotowy</h3>
                    <p class="text-muted mb-4">
                        Spotkanie zostało już utworzone. Możesz wrócić do pokoju.
                    </p>
                    <button class="btn btn-success btn-lg rejoin-meeting-btn">
                        <i class="bi bi-box-arrow-in-right me-2"></i>
                        Powrót do pokoju
                    </button>
                    ${status.meeting_started_at ? `
                        <p class="text-muted mt-3">
                            <small><i class="bi bi-clock me-1"></i>Spotkanie rozpoczęte o ${new Date(status.meeting_started_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</small>
                        </p>
                    ` : ''}
                </div>
            </div>
        `
        
        wrapper.querySelector('.rejoin-meeting-btn')?.addEventListener('click', () => {
            this.joinMeeting()
        })
    }

    private renderJoinInterface(wrapper: HTMLElement, status: ExtendedMeetingStatus): void {
        const participantsList = status.active_participants
            .map((p: any) => {
                const roleIcon = p.role === 'tutor' ? 'bi-mortarboard' : 'bi-person'
                const roleColor = p.role === 'tutor' ? 'text-primary' : 'text-info'
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                        <div class="d-flex align-items-center">
                            <div class="avatar-placeholder ${p.role === 'tutor' ? 'bg-primary' : 'bg-info'} text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; font-size: 18px;">
                                ${p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-medium">${p.name}</div>
                                <small class="text-muted">Dołączył o ${new Date(p.joined_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                        </div>
                        <span class="badge ${p.role === 'tutor' ? 'bg-primary' : 'bg-info'} rounded-pill">
                            <i class="bi ${roleIcon} me-1"></i>
                            ${p.role === 'tutor' ? 'Lektor' : 'Uczeń'}
                        </span>
                    </li>
                `
            }).join('')

        wrapper.innerHTML = `
            <div class="meeting-join-container d-flex align-items-center justify-content-center" style="height: 100%; min-height: 500px;">
                <div class="w-100" style="max-width: 500px;">
                    <div class="card shadow">
                        <div class="card-header bg-success text-white text-center py-4">
                            <div class="mb-2">
                                <i class="bi bi-broadcast" style="font-size: 3rem;"></i>
                            </div>
                            <h4 class="mb-0 fw-semibold">Spotkanie jest aktywne</h4>
                        </div>
                        <div class="card-body p-4">
                            ${participantsList ? `
                                <div class="mb-4">
                                    <h6 class="text-muted mb-3">
                                        <i class="bi bi-people me-2"></i>Obecni uczestnicy:
                                    </h6>
                                    <ul class="list-group list-group-flush">
                                        ${participantsList}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            <button class="btn btn-success btn-lg w-100 join-meeting-btn">
                                <i class="bi bi-camera-video-fill me-2"></i>
                                Dołącz do spotkania
                            </button>
                        </div>
                        <div class="card-footer bg-light text-center py-3">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                Przed dołączeniem sprawdź kamerę i mikrofon
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        wrapper.querySelector('.join-meeting-btn')?.addEventListener('click', () => {
            this.joinMeeting()
        })
    }

    private async renderWaitingInterface(wrapper: HTMLElement, status: MeetingStatus): Promise<void> {
        const user = await authService.getCurrentUser()
        const isStudent = user?.role === 'student'
        
        wrapper.innerHTML = `
            <div class="meeting-waiting-container d-flex align-items-center justify-content-center" style="height: 100%; min-height: 500px;">
                <div class="text-center">
                    <div class="mb-4">
                        <i class="bi bi-clock text-muted" style="font-size: 5rem;"></i>
                    </div>
                    <h3 class="fw-semibold mb-3">Oczekiwanie na spotkanie</h3>
                    <p class="text-muted mb-4">
                        ${isStudent 
                            ? 'Lektor jeszcze nie rozpoczął spotkania. Możesz dołączyć 60 minut przed planowaną godziną.'
                            : 'Spotkanie można rozpocząć 60 minut przed planowaną godziną.'}
                    </p>
                    
                    <div class="d-flex justify-content-center align-items-center text-muted">
                        <div class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">Ładowanie...</span>
                        </div>
                        <small>Automatyczne odświeżanie...</small>
                    </div>
                </div>
            </div>
        `
    }

    private renderEndedInterface(wrapper: HTMLElement, status: MeetingStatus): void {
        const startTime = status.meeting_started_at ? new Date(status.meeting_started_at) : null
        const endTime = status.meeting_ended_at ? new Date(status.meeting_ended_at) : null
        
        let duration = ''
        if (startTime && endTime) {
            const diff = endTime.getTime() - startTime.getTime()
            const minutes = Math.floor(diff / 60000)
            duration = `${minutes} minut`
        }

        wrapper.innerHTML = `
            <div class="meeting-ended-container d-flex align-items-center justify-content-center" style="height: 100%; min-height: 500px;">
                <div class="text-center">
                    <div class="mb-4">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 5rem;"></i>
                    </div>
                    <h3 class="fw-semibold mb-3">Spotkanie zakończone</h3>
                    <p class="text-muted mb-0">
                        Spotkanie zostało zakończone.
                    </p>
                    ${duration ? `
                        <p class="text-muted mt-2">
                            <i class="bi bi-stopwatch me-1"></i>Czas trwania: ${duration}
                        </p>
                    ` : ''}
                </div>
            </div>
        `
    }

    private async startMeeting(): Promise<void> {
        console.log('🚀 Starting meeting for lesson:', this.lessonId)
        try {
            // Pokaż loader
            Swal.fire({
                title: 'Tworzenie pokoju...',
                text: 'Proszę czekać',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            console.log('📡 Calling API to create meeting room...')
            const response = await api.post<{ success: boolean; data: MeetingCredentials }>(`/tutor/lessons/${this.lessonId}/meeting/start`)
            console.log('📥 Meeting start response:', response)
            console.log('📥 Response data:', JSON.stringify(response.data))
            
            if (!response.success || !response.data) {
                console.error('❌ Invalid response structure:', {
                    success: response.success,
                    hasData: !!response.data,
                    response: response
                })
                throw new Error('Invalid response from server')
            }
            
            const credentials: MeetingCredentials = response.data
            console.log('🔑 Meeting credentials received:', {
                room_url: credentials.room_url,
                room_name: credentials.room_name,
                is_moderator: credentials.is_moderator,
                has_token: !!credentials.token
            })

            Swal.close()
            
            // Otwórz spotkanie
            this.openMeeting(credentials)
        } catch (error: any) {
            console.error('❌ Error starting meeting:', error)
            console.error('❌ Error details:', {
                message: error.message,
                response: error.response,
                responseData: error.response?.data,
                stack: error.stack
            })
            Swal.close()
            
            const errorMessage = error.response?.data?.message || error.message || 'Nie udało się rozpocząć spotkania'
            const errorDetails = error.response?.data?.details || ''
            
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: errorMessage,
                footer: errorDetails ? `<small>${errorDetails}</small>` : undefined
            })
        }
    }

    private async joinMeeting(): Promise<void> {
        try {
            // Pokaż loader
            Swal.fire({
                title: 'Dołączanie do spotkania...',
                text: 'Proszę czekać',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            const user = await authService.getCurrentUser()
            const endpoint = user?.role === 'tutor' 
                ? `/tutor/lessons/${this.lessonId}/meeting/join`
                : `/student/lessons/${this.lessonId}/meeting/join`

            const response = await api.post<{ success: boolean; data: MeetingCredentials }>(endpoint)
            const credentials: MeetingCredentials = response.data!

            Swal.close()
            
            // Otwórz spotkanie
            this.openMeeting(credentials)
        } catch (error: any) {
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: error.response?.data?.message || 'Nie udało się dołączyć do spotkania'
            })
        }
    }

    private openMeeting(credentials: MeetingCredentials): void {
        console.log('🎬 Opening meeting with credentials:', credentials)
        
        // Ukryj obecny interfejs
        this.container.innerHTML = ''
        
        // Utwórz kontener dla Daily iframe
        const frameContainer = document.createElement('div')
        frameContainer.className = 'daily-frame-container'
        frameContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: 70vh;
            background: #000;
            overflow: hidden;
        `
        
        console.log('📦 Created frame container')
        
        // Dodaj przyciski kontrolne
        const controls = document.createElement('div')
        controls.className = 'meeting-controls'
        controls.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 100;
        `
        
        if (credentials.is_moderator) {
            controls.innerHTML = `
                <button class="btn btn-danger end-meeting-btn">
                    <i class="fas fa-stop mr-2"></i>
                    Zakończ spotkanie
                </button>
            `
            
            controls.querySelector('.end-meeting-btn')?.addEventListener('click', () => {
                this.endMeeting()
            })
        } else {
            controls.innerHTML = `
                <button class="btn btn-secondary leave-meeting-btn">
                    <i class="fas fa-sign-out-alt mr-2"></i>
                    Opuść spotkanie
                </button>
            `
            
            controls.querySelector('.leave-meeting-btn')?.addEventListener('click', () => {
                this.leaveMeeting()
            })
        }
        
        frameContainer.appendChild(controls)
        this.container.appendChild(frameContainer)
        
        // Załaduj Daily Prebuilt iframe
        this.loadDailyFrame(frameContainer, credentials)
    }

    private loadDailyFrame(container: HTMLElement, credentials: MeetingCredentials): void {
        console.log('📺 Loading Daily.co iframe...')
        console.log('📺 Credentials:', {
            room_url: credentials.room_url,
            has_token: !!credentials.token,
            token_length: credentials.token?.length
        })
        
        // Utwórz iframe dla Daily Prebuilt
        const iframe = document.createElement('iframe')
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `
        
        // Buduj URL z tokenem
        const url = new URL(credentials.room_url)
        url.searchParams.set('t', credentials.token)
        
        console.log('📺 iframe URL:', url.toString())
        
        iframe.src = url.toString()
        iframe.allow = 'camera; microphone; fullscreen; display-capture'
        
        // Dodaj iframe do kontenera
        const frameWrapper = container.querySelector('.daily-frame-container') || container
        frameWrapper.insertBefore(iframe, frameWrapper.firstChild)
        
        console.log('📺 iframe added to DOM')
        
        // Zapisz referencję
        this.dailyFrame = iframe
        
        // Nasłuchuj na wydarzenia z iframe (opcjonalnie)
        window.addEventListener('message', this.handleFrameMessage.bind(this))
        
        console.log('✅ Daily.co iframe loaded successfully')
    }

    private handleFrameMessage(event: MessageEvent): void {
        // Obsługa wiadomości z Daily iframe
        if (event.origin !== new URL(this.dailyFrame?.src || '').origin) {
            return
        }
        
        // Daily.co może wysyłać różne wydarzenia
        console.log('Daily.co event:', event.data)
    }

    private async endMeeting(): Promise<void> {
        const result = await Swal.fire({
            title: 'Czy na pewno?',
            text: 'Czy chcesz zakończyć spotkanie dla wszystkich uczestników?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Tak, zakończ',
            cancelButtonText: 'Anuluj',
            confirmButtonColor: '#dc3545'
        })

        if (!result.isConfirmed) return

        try {
            await api.post(`/tutor/lessons/${this.lessonId}/meeting/end`)
            
            Swal.fire({
                icon: 'success',
                title: 'Spotkanie zakończone',
                text: 'Spotkanie zostało zakończone dla wszystkich uczestników'
            })
            
            // Odśwież interfejs
            this.destroy()
            this.init()
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: error.response?.data?.message || 'Nie udało się zakończyć spotkania'
            })
        }
    }

    private leaveMeeting(): void {
        // Usuń iframe
        if (this.dailyFrame) {
            this.dailyFrame.remove()
            this.dailyFrame = null
        }
        
        // Odśwież interfejs
        this.init()
    }

    private startStatusChecking(): void {
        // Sprawdzaj status co 10 sekund
        this.statusCheckInterval = window.setInterval(async () => {
            if (this.isDestroyed || this.dailyFrame) return
            
            const status = await this.getMeetingStatus()
            if (status) {
                await this.renderMeetingInterface(status)
            }
        }, 10000)
    }

    private showError(message: string): void {
        this.container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${message}
            </div>
        `
    }

    public destroy(): void {
        this.isDestroyed = true
        
        // Zatrzymaj sprawdzanie statusu
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval)
            this.statusCheckInterval = null
        }
        
        // Usuń iframe
        if (this.dailyFrame) {
            this.dailyFrame.remove()
            this.dailyFrame = null
        }
        
        // Usuń event listener
        window.removeEventListener('message', this.handleFrameMessage.bind(this))
        
        // Wyczyść kontener
        this.container.innerHTML = ''
    }
}