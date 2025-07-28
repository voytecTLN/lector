import { api } from '@services/ApiService'

interface StatusOption {
    value: string
    label: string
    badgeClass: string
}

export class LessonStatusManager {
    private lessonId: number
    private currentStatus: string
    private onStatusUpdate?: (newStatus: string) => void

    constructor(lessonId: number, currentStatus: string, onStatusUpdate?: (newStatus: string) => void) {
        this.lessonId = lessonId
        this.currentStatus = currentStatus
        this.onStatusUpdate = onStatusUpdate
    }

    /**
     * Get available status options based on user role
     */
    private async getStatusOptions(): Promise<Record<string, string>> {
        try {
            const response = await api.get<{ success: boolean, data: Record<string, string> }>('/lessons/status-options')
            return response.data || {}
        } catch (error) {
            console.error('Error fetching status options:', error)
            return {}
        }
    }

    /**
     * Update lesson status
     */
    private async updateStatus(newStatus: string, reason?: string): Promise<void> {
        try {
            const response = await api.put(`/lessons/${this.lessonId}/status`, {
                status: newStatus,
                reason: reason
            })

            if ((response as any).success) {
                this.currentStatus = newStatus
                
                // Show success notification
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Status lekcji został zaktualizowany',
                        duration: 3000
                    }
                }))

                // Call callback if provided
                if (this.onStatusUpdate) {
                    this.onStatusUpdate(newStatus)
                }
            }
        } catch (error: any) {
            console.error('Error updating status:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Nie udało się zaktualizować statusu',
                    duration: 5000
                }
            }))
        }
    }

    /**
     * Show status update modal
     */
    public async showModal(): Promise<void> {
        const statusOptions = await this.getStatusOptions()
        
        const modalHtml = `
            <div class="modal fade" id="lessonStatusModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Zmień status lekcji</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="statusSelect" class="form-label">Nowy status</label>
                                <select class="form-select" id="statusSelect">
                                    ${Object.entries(statusOptions).map(([value, label]) => `
                                        <option value="${value}" ${value === this.currentStatus ? 'selected' : ''}>
                                            ${label}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="statusReason" class="form-label">Powód zmiany (opcjonalnie)</label>
                                <textarea class="form-control" id="statusReason" rows="3" placeholder="Podaj powód zmiany statusu..."></textarea>
                            </div>

                            ${this.renderStatusInfo()}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
                            <button type="button" class="btn btn-primary" id="saveStatusBtn">Zapisz</button>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Remove existing modal if any
        const existingModal = document.getElementById('lessonStatusModal')
        if (existingModal) {
            existingModal.remove()
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml)
        
        // Initialize Bootstrap modal
        const modalElement = document.getElementById('lessonStatusModal')!
        const modal = new (window as any).bootstrap.Modal(modalElement)
        
        // Setup event listeners
        const saveBtn = modalElement.querySelector('#saveStatusBtn')
        saveBtn?.addEventListener('click', async () => {
            const statusSelect = modalElement.querySelector('#statusSelect') as HTMLSelectElement
            const reasonTextarea = modalElement.querySelector('#statusReason') as HTMLTextAreaElement
            
            const newStatus = statusSelect.value
            const reason = reasonTextarea.value.trim()
            
            if (newStatus !== this.currentStatus) {
                await this.updateStatus(newStatus, reason || undefined)
                modal.hide()
            }
        })

        // Cleanup on modal hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove()
        })

        // Show modal
        modal.show()
    }

    /**
     * Render status info/warnings
     */
    private renderStatusInfo(): string {
        return `
            <div class="alert alert-info">
                <h6 class="alert-heading">Informacje o statusach:</h6>
                <ul class="mb-0">
                    <li><strong>Zakończona</strong> - Lekcja odbyła się pomyślnie</li>
                    <li><strong>Anulowana</strong> - Lekcja została odwołana</li>
                    <li><strong>Student nieobecny</strong> - Student nie pojawił się na lekcji</li>
                    <li><strong>Lektor nieobecny</strong> - Lektor nie pojawił się (godziny zostaną zwrócone)</li>
                    <li><strong>Problemy techniczne</strong> - Lekcja nie mogła się odbyć z powodu problemów technicznych</li>
                </ul>
            </div>
        `
    }

    /**
     * Get badge class for status
     */
    public static getStatusBadgeClass(status: string): string {
        const badgeClasses: Record<string, string> = {
            scheduled: 'bg-primary',
            in_progress: 'bg-info',
            completed: 'bg-success',
            cancelled: 'bg-danger',
            no_show_student: 'bg-warning',
            no_show_tutor: 'bg-warning',
            technical_issues: 'bg-secondary'
        }
        return badgeClasses[status] || 'bg-secondary'
    }

    /**
     * Get status label
     */
    public static getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            scheduled: 'Zaplanowana',
            in_progress: 'W trakcie',
            completed: 'Zakończona',
            cancelled: 'Anulowana',
            no_show_student: 'Student nieobecny',
            no_show_tutor: 'Lektor nieobecny',
            technical_issues: 'Problemy techniczne'
        }
        return labels[status] || status
    }
}

// Export to global scope for easy access
;(window as any).LessonStatusManager = LessonStatusManager