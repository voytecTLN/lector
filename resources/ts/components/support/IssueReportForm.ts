import { api } from '@services/ApiService'
import { FormValidationHandler } from '@/utils/FormValidationHandler'
import { NotificationService } from '@/utils/NotificationService'

interface IssueReportData {
    issue_type: string
    subject: string
    description: string
    priority: string
    current_url?: string
}

export class IssueReportForm {
    private container: HTMLElement | null = null
    private formHandler: FormValidationHandler | null = null
    
    constructor() {
        // FormValidationHandler will be initialized after DOM is ready
    }
    
    public getContent(): string {
        return `
            <div class="support-container">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card shadow-sm">
                            <div class="card-header bg-primary text-white">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-headset me-2"></i>
                                    <h4 class="mb-0">Zgłoś sprawę</h4>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Opisz dokładnie problem, jaki napotkałeś. Im więcej szczegółów podasz, tym szybciej będziemy mogli Ci pomóc.
                                </div>

                                <form id="issue-report-form">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="issue-type" class="form-label">
                                                    <i class="bi bi-tag me-1"></i>Typ zgłoszenia
                                                </label>
                                                <select id="issue-type" name="issue_type" class="form-select" required>
                                                    <option value="">Wybierz typ zgłoszenia</option>
                                                    <option value="technical">🔧 Techniczne (błędy, problemy z działaniem)</option>
                                                    <option value="lessons">📚 Lekcje (rezerwacje, problemy z lekcjami)</option>
                                                    <option value="business">💼 Biznesowe (pakiety, współpraca)</option>
                                                </select>
                                                <div class="invalid-feedback"></div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="priority" class="form-label">
                                                    <i class="bi bi-exclamation-triangle me-1"></i>Priorytet
                                                </label>
                                                <select id="priority" name="priority" class="form-select" required>
                                                    <option value="">Wybierz priorytet</option>
                                                    <option value="low">🟢 Niski (może poczekać)</option>
                                                    <option value="medium">🟡 Średni (ważne)</option>
                                                    <option value="high">🔴 Wysoki (pilne)</option>
                                                </select>
                                                <div class="invalid-feedback"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="subject" class="form-label">
                                            <i class="bi bi-card-heading me-1"></i>Temat zgłoszenia
                                        </label>
                                        <input 
                                            type="text" 
                                            id="subject" 
                                            name="subject" 
                                            class="form-control" 
                                            placeholder="Krótko opisz problem (np. 'Nie mogę zarezerwować lekcji')"
                                            required
                                            minlength="5"
                                            maxlength="200"
                                        >
                                        <div class="invalid-feedback"></div>
                                        <div class="form-text">Minimum 5 znaków, maksimum 200 znaków</div>
                                    </div>

                                    <div class="mb-4">
                                        <label for="description" class="form-label">
                                            <i class="bi bi-card-text me-1"></i>Szczegółowy opis
                                        </label>
                                        <textarea 
                                            id="description" 
                                            name="description" 
                                            class="form-control" 
                                            rows="6"
                                            placeholder="Techniczne:&#10;- Jaki problem występuje? Jakie kroki podejmowałeś? Czy problem występuje zawsze?&#10;Lekcje:&#10;- Kiedy miała się odbyć? Jaki jest status lekcji?&#10;Biznesowe:&#10;- Dotyczące pakietów, współpracy lub innych kwestii biznesowych"
                                            required
                                            minlength="20"
                                            maxlength="2000"
                                        ></textarea>
                                        <div class="invalid-feedback"></div>
                                        <div class="form-text">Minimum 20 znaków, maksimum 2000 znaków</div>
                                    </div>

                                    <div class="border-top pt-3">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="text-muted small">
                                                <i class="bi bi-shield-check me-1"></i>
                                                Twoje zgłoszenie zostanie wysłane na odpowiedni adres wsparcia technicznego
                                            </div>
                                            <div class="d-flex gap-2">
                                                <button type="button" class="btn btn-secondary" id="cancel-btn">
                                                    <i class="bi bi-x-lg me-1"></i>Anuluj
                                                </button>
                                                <button type="submit" class="btn btn-primary" id="submit-btn">
                                                    <i class="bi bi-send me-1"></i>Wyślij zgłoszenie
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <!-- Help Card -->
                        <div class="card mt-4">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-question-circle me-2"></i>Potrzebujesz szybszej pomocy?
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-telephone text-primary me-2"></i>Kontakt telefoniczny</h6>
                                        <p class="small text-muted">
                                            W przypadku pilnych spraw technicznych:<br>
                                            <strong>+48 22 113 4004</strong><br>
                                            <small>Poniedziałek - Piątek: 10:00 - 18:00</small>
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-envelope text-primary me-2"></i>Email bezpośredni</h6>
                                        <p class="small text-muted">
                                            Możesz też napisać bezpośrednio na:<br>
                                            <strong>kontakt@tele-nauka.pl</strong><br>
                                            <small>Odpowiadamy w ciągu 24-48 godzin</small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    public mount(container: HTMLElement): void {
        this.container = container
        container.innerHTML = this.getContent()
        this.attachEventListeners()
    }
    
    private attachEventListeners(): void {
        if (!this.container) return
        
        const form = this.container.querySelector('#issue-report-form') as HTMLFormElement
        const cancelBtn = this.container.querySelector('#cancel-btn') as HTMLButtonElement
        
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e))
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel())
        }

        // Auto-resize textarea
        const textarea = this.container.querySelector('#description') as HTMLTextAreaElement
        if (textarea) {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto'
                textarea.style.height = textarea.scrollHeight + 'px'
            })
        }
        
        // Character counters
        this.addCharacterCounters()
    }
    
    private addCharacterCounters(): void {
        if (!this.container) return
        
        const subjectInput = this.container.querySelector('#subject') as HTMLInputElement
        const descriptionInput = this.container.querySelector('#description') as HTMLTextAreaElement
        
        if (subjectInput) {
            this.addCharacterCounter(subjectInput, 200)
        }
        
        if (descriptionInput) {
            this.addCharacterCounter(descriptionInput, 2000)
        }
    }
    
    private addCharacterCounter(element: HTMLInputElement | HTMLTextAreaElement, maxLength: number): void {
        const updateCounter = () => {
            const current = element.value.length
            const remaining = maxLength - current
            let counterElement = element.parentElement?.querySelector('.char-counter') as HTMLElement
            
            if (!counterElement) {
                counterElement = document.createElement('div')
                counterElement.className = 'char-counter form-text text-end'
                element.parentElement?.appendChild(counterElement)
            }
            
            counterElement.textContent = `${current}/${maxLength} znaków`
            counterElement.className = `char-counter form-text text-end ${remaining < 50 ? 'text-warning' : remaining < 20 ? 'text-danger' : ''}`
        }
        
        element.addEventListener('input', updateCounter)
        updateCounter() // Initial update
    }
    
    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault()
        
        const form = e.target as HTMLFormElement
        const submitBtn = form.querySelector('#submit-btn') as HTMLButtonElement
        const formData = new FormData(form)
        
        // Add current URL for debugging purposes
        formData.append('current_url', window.location.href)
        
        const data: IssueReportData = {
            issue_type: formData.get('issue_type') as string,
            subject: formData.get('subject') as string,
            description: formData.get('description') as string,
            priority: formData.get('priority') as string,
            current_url: formData.get('current_url') as string
        }
        
        try {
            // Disable submit button
            submitBtn.disabled = true
            submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i>Wysyłanie...'
            
            // Clear previous validation errors
            if (!this.formHandler) {
                this.formHandler = new FormValidationHandler(form)
            }
            this.formHandler.clearValidationErrors()
            
            const response = await api.post('/support/issue', data)
            
            NotificationService.show({
                type: 'success',
                title: 'Zgłoszenie wysłane!',
                message: (response as { message?: string }).message || 'Twoje zgłoszenie zostało wysłane. Odpowiemy w ciągu 24-48 godzin.',
                duration: 5000
            })
            
            // Reset form
            form.reset()
            this.updateCharacterCounters()
            
            // Go back to previous page or dashboard
            window.history.back()
            
        } catch (error: any) {
            console.error('Error submitting issue:', error)
            
            if (error.response?.status === 422) {
                // Validation errors
                if (this.formHandler) {
                    this.formHandler.displayValidationErrors(error.response.data.errors)
                }
            } else if (error.response?.data?.message) {
                NotificationService.show({
                    type: 'error',
                    title: 'Błąd podczas wysyłania',
                    message: error.response.data.message,
                    duration: 5000
                })
            } else {
                NotificationService.show({
                    type: 'error',
                    title: 'Błąd',
                    message: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
                    duration: 3000
                })
            }
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false
            submitBtn.innerHTML = '<i class="bi bi-send me-1"></i>Wyślij zgłoszenie'
        }
    }
    
    private updateCharacterCounters(): void {
        if (!this.container) return
        
        const counters = this.container.querySelectorAll('.char-counter')
        counters.forEach(counter => {
            const input = counter.parentElement?.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement
            if (input) {
                input.dispatchEvent(new Event('input'))
            }
        })
    }
    
    private handleCancel(): void {
        if (confirm('Czy na pewno chcesz anulować? Wprowadzone dane zostaną utracone.')) {
            window.history.back()
        }
    }
    
    public unmount(): void {
        // Cleanup if needed
        this.container = null
    }
}

// Export for global access
;(window as any).IssueReportForm = IssueReportForm