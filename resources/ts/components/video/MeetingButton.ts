import { api } from '@services/ApiService'
import { authService } from '@services/AuthService'
import type { MeetingStatus } from '@/types/models'

export class MeetingButton {
    private lessonId: number
    private container: HTMLElement
    private onMeetingOpen?: () => void
    private checkInterval: number | null = null

    constructor(
        container: HTMLElement, 
        lessonId: number,
        options?: {
            onMeetingOpen?: () => void
        }
    ) {
        this.container = container
        this.lessonId = lessonId
        this.onMeetingOpen = options?.onMeetingOpen
        this.init()
    }

    private async init(): Promise<void> {
        console.log('🎬 MeetingButton init for lesson:', this.lessonId)
        await this.updateButton()
        
        // Sprawdzaj status co 30 sekund
        this.checkInterval = window.setInterval(() => {
            console.log('🔄 MeetingButton auto-refresh for lesson:', this.lessonId)
            this.updateButton()
        }, 60000)
    }

    private updateButton = async (): Promise<void> => {
        const status = await this.getMeetingStatus()
        if (!status) {
            this.container.innerHTML = ''
            return
        }

        await this.renderButton(status)
    }

    private async getMeetingStatus(): Promise<MeetingStatus | null> {
        try {
            const user = await authService.getCurrentUser()
            const endpoint = user?.role === 'tutor' 
                ? `/tutor/lessons/${this.lessonId}/meeting/status`
                : `/student/lessons/${this.lessonId}/meeting/status`

            console.log('📡 Fetching meeting status:', {
                lessonId: this.lessonId,
                userRole: user?.role,
                userId: user?.id,
                endpoint: endpoint
            })

            const response = await api.get<{ success: boolean; data: MeetingStatus }>(endpoint)
            console.log('📥 Meeting status response:', response)
            console.log('📥 Response type:', typeof response)
            console.log('📥 Response keys:', Object.keys(response))
            
            // If response is empty object, it might be a content-type issue
            if (Object.keys(response).length === 0) {
                console.error('❌ Empty response object - possible content-type issue')
                return null
            }
            
            if (response.success && response.data) {
                return response.data
            }
            
            console.warn('⚠️ No data in meeting status response')
            return null
        } catch (error) {
            console.error('❌ Error getting meeting status:', error)
            return null
        }
    }

    private async renderButton(status: MeetingStatus): Promise<void> {
        const user = await authService.getCurrentUser()
        const isTutor = user?.role === 'tutor'
        
        console.log('🎨 Rendering button with status:', {
            status: status,
            isTutor: isTutor,
            user: { id: user?.id, role: user?.role }
        })
        
        let buttonHtml = ''
        
        if ((status.is_active || status.has_room) && status.can_join) {
            // Spotkanie aktywne lub pokój istnieje - pokaż przycisk dołączenia
            buttonHtml = `
                <button class="btn btn-success meeting-action-btn">
                    <i class="fas fa-video mr-2"></i>
                    Dołącz do spotkania
                </button>
            `
        } else if (isTutor && status.can_start) {
            // Lektor może rozpocząć
            buttonHtml = `
                <button class="btn btn-primary meeting-action-btn">
                    <i class="fas fa-play mr-2"></i>
                    Rozpocznij spotkanie
                </button>
            `
        } else if (status.meeting_ended_at) {
            // Spotkanie zakończone
            buttonHtml = `
                <div class="text-gray-500">
                    <i class="fas fa-check-circle mr-2"></i>
                    Spotkanie zakończone
                </div>
            `
        } else if (!status.is_active && (status.can_start || status.can_join)) {
            // Oczekiwanie na rozpoczęcie
            const message = isTutor 
                ? 'Możesz rozpocząć za chwilę' 
                : 'Oczekiwanie na lektora'
                
            buttonHtml = `
                <div class="text-gray-500">
                    <i class="fas fa-clock mr-2"></i>
                    ${message}
                </div>
            `
        }
        
        console.log('🗒️ Setting button HTML:', buttonHtml || 'empty')
        this.container.innerHTML = buttonHtml
        
        // Dodaj event listener
        const actionBtn = this.container.querySelector('.meeting-action-btn')
        if (actionBtn) {
            console.log('✅ Meeting action button found, adding click listener')
            actionBtn.addEventListener('click', () => {
                console.log('🕵️ Meeting button clicked')
                if (this.onMeetingOpen) {
                    this.onMeetingOpen()
                } else {
                    // Domyślnie otwórz w nowym oknie
                    this.openMeetingWindow()
                }
            })
        } else {
            console.log('ℹ️ No action button found in rendered HTML')
        }
    }

    private openMeetingWindow(): void {
        // Otwórz spotkanie w nowym oknie/zakładce
        const width = 1200
        const height = 800
        const left = (window.screen.width - width) / 2
        const top = (window.screen.height - height) / 2
        
        window.open(
            `/lesson/${this.lessonId}/meeting`,
            'DailyMeeting',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        )
    }

    public destroy(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval)
            this.checkInterval = null
        }
        
        this.container.innerHTML = ''
    }
}