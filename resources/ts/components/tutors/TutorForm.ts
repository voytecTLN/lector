// resources/ts/components/tutors/TutorForm.ts
import type { RouteComponent } from '@router/routes'
import { TutorService } from '@services/TutorService'
import type { CreateTutorRequest, UpdateTutorRequest, User } from '@/types/models'
import { navigate } from '@/utils/navigation'

export class TutorForm implements RouteComponent {
    private tutorService: TutorService
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private isEditMode: boolean = false
    private tutorId: number | null = null
    private tutor: User | null = null

    constructor() {
        this.tutorService = new TutorService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'tutor-form-page'

        // Determine if edit mode from URL params (dashboard integration)
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section')
        const tutorId = urlParams.get('tutor_id')

        if (section === 'edytuj-lektora' && tutorId) {
            this.isEditMode = true
            this.tutorId = parseInt(tutorId, 10)
        }

        el.innerHTML = `
            <div class="container-fluid">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 class="mb-1">${this.isEditMode ? 'Edytuj Lektora' : 'Dodaj Nowego Lektora'}</h2>
                        <p class="text-muted mb-0">
                            ${this.isEditMode ? 'Aktualizuj dane lektora' : 'Wypełnij formularz aby dodać nowego lektora'}
                        </p>
                    </div>
                    <a href="/admin/dashboard?section=lektorzy" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                    </a>
                </div>

                <!-- Loading state -->
                <div id="form-loading" class="text-center py-5 ${!this.isEditMode ? 'd-none' : ''}">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie...</span>
                    </div>
                    <p class="mt-2 text-muted">Ładowanie danych lektora...</p>
                </div>

                <!-- Form -->
                <form id="tutor-form" class="${this.isEditMode ? 'd-none' : ''}">
                    ${this.generateFormHTML()}
                </form>
            </div>
        `

        return el
    }

    private handleValidationError(event: CustomEvent): void {
        const { errors } = event.detail

        // Reset previous errors
        this.form?.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid')
        })
        this.form?.querySelectorAll('.invalid-feedback').forEach(el => el.remove())

        // Display new errors
        for (const [field, messages] of Object.entries(errors)) {
            const input = this.form?.querySelector(`[name="${field}"]`)
            if (input) {
                input.classList.add('is-invalid')

                const feedback = document.createElement('div')
                feedback.className = 'invalid-feedback'
                feedback.textContent = Array.isArray(messages) ? messages[0] : String(messages)

                input.parentElement?.appendChild(feedback)
            }
        }
    }

    async mount(container: HTMLElement): Promise<void> {
        document.addEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)
        this.container = container
        this.form = container.querySelector('#tutor-form')

        if (this.isEditMode && this.tutorId) {
            await this.loadTutorData()
        } else {
            this.setupForm()
        }
    }

    unmount(): void {
        document.removeEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)
        this.container = null
        this.form = null
        this.tutor = null
    }

    private generateFormHTML(): string {
        return `
            <div class="row">
                <div class="col-lg-8">
                    <!-- Dane podstawowe -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Dane podstawowe</h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Imię i nazwisko <span class="text-danger">*</span></label>
                                    <input type="text" name="name" class="form-control" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Email <span class="text-danger">*</span></label>
                                    <input type="email" name="email" class="form-control" required>
                                </div>
                                
                                ${!this.isEditMode ? `
                                    <div class="col-md-6">
                                        <label class="form-label">Hasło <span class="text-danger">*</span></label>
                                        <input type="password" name="password" class="form-control" required minlength="8">
                                        <div class="form-text">Minimum 8 znaków</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Potwierdź hasło <span class="text-danger">*</span></label>
                                        <input type="password" name="password_confirmation" class="form-control" required>
                                    </div>
                                ` : `
                                    <div class="col-12">
                                        <div class="alert alert-info">
                                            <i class="bi bi-info-circle me-1"></i>
                                            Zostaw pola hasła puste, jeśli nie chcesz zmieniać hasła
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Nowe hasło</label>
                                        <input type="password" name="password" class="form-control" minlength="8">
                                        <div class="form-text">Minimum 8 znaków (opcjonalne)</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Potwierdź nowe hasło</label>
                                        <input type="password" name="password_confirmation" class="form-control">
                                    </div>
                                `}
                                
                                <div class="col-md-6">
                                    <label class="form-label">Telefon</label>
                                    <input type="tel" name="phone" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Data urodzenia</label>
                                    <input type="date" name="birth_date" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Miasto</label>
                                    <input type="text" name="city" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Status</label>
                                    <select name="status" class="form-select">
                                        <option value="active">Aktywny</option>
                                        <option value="inactive">Nieaktywny</option>
                                        <option value="blocked">Zablokowany</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Języki i specjalizacje -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Języki i specjalizacje</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Języki nauczania <span class="text-danger">*</span></label>
                                <div class="row g-2">
                                    ${this.generateLanguageCheckboxes()}
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Specjalizacje <span class="text-danger">*</span></label>
                                <div class="row g-2">
                                    ${this.generateSpecializationCheckboxes()}
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Typy lekcji</label>
                                <div class="row g-2">
                                    ${this.generateLessonTypeCheckboxes()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Doświadczenie i wykształcenie -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Doświadczenie i wykształcenie</h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Lata doświadczenia <span class="text-danger">*</span></label>
                                    <input type="number" name="years_experience" class="form-control" required min="0" max="50">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Maksymalnie studentów na tydzień</label>
                                    <input type="number" name="max_students_per_week" class="form-control" min="1" max="100">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Tygodniowy limit godzin <span class="text-danger">*</span></label>
                                    <select name="weekly_contract_limit" class="form-select" required>
                                        <option value="8">8 godzin</option>
                                        <option value="16">16 godzin</option>
                                        <option value="24">24 godziny</option>
                                        <option value="32">32 godziny</option>
                                        <option value="40" selected>40 godzin</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Opis/Bio</label>
                                    <textarea name="description" class="form-control" rows="4" 
                                              placeholder="Opisz swoje doświadczenie, metody nauczania, osiągnięcia..."></textarea>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Certyfikaty (jeden w linii)</label>
                                    <textarea name="certifications" class="form-control" rows="3" 
                                              placeholder="Np. CELTA\nCAE Certificate\nTKT Module 1-3"></textarea>
                                    <div class="form-text">Każdy certyfikat w nowej linii</div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Wykształcenie (jeden w linii)</label>
                                    <textarea name="education" class="form-control" rows="3" 
                                              placeholder="Np. Magister filologii angielskiej - UW\nKurs metodyki nauczania - Oxford"></textarea>
                                    <div class="form-text">Każde wykształcenie w nowej linii</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <!-- Ustawienia -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Ustawienia</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" name="is_accepting_students" 
                                           id="acceptingStudents" checked>
                                    <label class="form-check-label" for="acceptingStudents">
                                        Przyjmuje nowych studentów
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Przyciski -->
                    <div class="card">
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary" id="submit-button">
                                    <i class="bi bi-check-circle me-1"></i> 
                                    ${this.isEditMode ? 'Zapisz zmiany' : 'Utwórz lektora'}
                                </button>
                                <a href="/admin/dashboard?section=lektorzy" class="btn btn-outline-secondary">
                                    <i class="bi bi-x-circle me-1"></i> Anuluj
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <input type="hidden" name="tutor_id" value="${this.tutorId || ''}">
        `
    }

    private generateLanguageCheckboxes(): string {
        const languages = this.tutorService.getLanguageOptions()

        return languages.map(lang => `
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input language-checkbox" type="checkbox" 
                           name="languages[]" value="${lang.value}" 
                           id="lang-${lang.value}">
                    <label class="form-check-label" for="lang-${lang.value}">
                        ${lang.label}
                    </label>
                </div>
            </div>
        `).join('')
    }

    private generateSpecializationCheckboxes(): string {
        const specializations = this.tutorService.getSpecializationOptions()

        return specializations.map(spec => `
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" 
                           name="specializations[]" value="${spec.value}" 
                           id="spec-${spec.value}">
                    <label class="form-check-label" for="spec-${spec.value}">
                        ${spec.label}
                    </label>
                </div>
            </div>
        `).join('')
    }

    private generateLessonTypeCheckboxes(): string {
        const lessonTypes = this.tutorService.getLessonTypeOptions()

        return lessonTypes.map(type => `
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" 
                           name="lesson_types[]" value="${type.value}" 
                           id="lesson-${type.value}">
                    <label class="form-check-label" for="lesson-${type.value}">
                        ${type.label}
                    </label>
                </div>
            </div>
        `).join('')
    }

    private setupForm(): void {
        if (!this.form) return

        this.form.addEventListener('submit', this.handleSubmit.bind(this))
        this.showForm()
    }

    private async loadTutorData(): Promise<void> {
        if (!this.tutorId) return

        try {
            this.tutor = await this.tutorService.getTutorById(this.tutorId)
            this.populateForm()
            this.setupForm()
            this.showForm()
        } catch (error) {
            console.error('Failed to load tutor data:', error)
            this.showError('Nie udało się załadować danych lektora')
            navigate.to('/admin/dashboard?section=lektorzy')
        }
    }

    private populateForm(): void {
        if (!this.form || !this.tutor) return

        // Basic data
        this.setFormValue('name', this.tutor.name)
        this.setFormValue('email', this.tutor.email)
        this.setFormValue('phone', this.tutor.phone)
        this.setFormValue('birth_date', this.tutor.birth_date)
        this.setFormValue('city', this.tutor.city)
        this.setFormValue('status', this.tutor.status)

        // Tutor profile data
        const profile = this.tutor.tutor_profile
        if (profile) {
            this.setFormValue('years_experience', profile.years_experience?.toString())
            this.setFormValue('max_students_per_week', profile.max_students_per_week?.toString())
            this.setFormValue('hourly_rate', profile.hourly_rate?.toString())
            this.setFormValue('weekly_contract_limit', profile.weekly_contract_limit?.toString() || '40')
            this.setFormValue('description', profile.description)
            this.setFormValue('is_accepting_students', profile.is_accepting_students)

            // Arrays
            if (profile.languages) {
                profile.languages.forEach(lang => {
                    const checkbox = this.form?.querySelector(`input[name="languages[]"][value="${lang}"]`) as HTMLInputElement
                    if (checkbox) checkbox.checked = true
                })
            }

            if (profile.specializations) {
                profile.specializations.forEach(spec => {
                    const checkbox = this.form?.querySelector(`input[name="specializations[]"][value="${spec}"]`) as HTMLInputElement
                    if (checkbox) checkbox.checked = true
                })
            }

            if (profile.lesson_types) {
                profile.lesson_types.forEach(type => {
                    const checkbox = this.form?.querySelector(`input[name="lesson_types[]"][value="${type}"]`) as HTMLInputElement
                    if (checkbox) checkbox.checked = true
                })
            }

            if (profile.certifications) {
                this.setFormValue('certifications', profile.certifications.join('\n'))
            }

            if (profile.education) {
                this.setFormValue('education', profile.education.join('\n'))
            }
        }
    }

    private setFormValue(name: string, value: any): void {
        const element = this.form?.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        if (!element) return

        if (element.type === 'checkbox') {
            (element as HTMLInputElement).checked = Boolean(value)
        } else {
            element.value = value || ''
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()
        
        const submitButton = this.form?.querySelector('#submit-button') as HTMLButtonElement
        if (!submitButton) return

        const originalText = submitButton.innerHTML
        submitButton.disabled = true
        submitButton.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Zapisywanie...'

        try {
            const formData = new FormData(this.form!)
            const data = this.extractFormData(formData)

            if (this.isEditMode && this.tutorId) {
                await this.tutorService.updateTutor(this.tutorId, data as UpdateTutorRequest)
                this.showSuccess('Lektor został zaktualizowany')
            } else {
                await this.tutorService.createTutor(data as CreateTutorRequest)
                this.showSuccess('Lektor został utworzony')
            }

            // Redirect to tutor list
            navigate.to('/admin/dashboard?section=lektorzy')

        } catch (error: any) {
            console.error('Form submission error:', error)
            
            if (error.errors) {
                // Validation errors
                document.dispatchEvent(new CustomEvent('form:validationError', {
                    detail: { errors: error.errors }
                }))
            } else {
                this.showError('Wystąpił błąd podczas zapisywania lektora')
            }
        } finally {
            submitButton.disabled = false
            submitButton.innerHTML = originalText
        }
    }

    private extractFormData(formData: FormData): CreateTutorRequest | UpdateTutorRequest {
        const data: any = {}

        // Basic fields
        formData.forEach((value, key) => {
            if (key.endsWith('[]')) {
                const arrayKey = key.replace('[]', '')
                if (!data[arrayKey]) data[arrayKey] = []
                data[arrayKey].push(value)
            } else if (key === 'certifications' || key === 'education') {
                // Split by lines and filter empty
                data[key] = (value as string).split('\n').filter(line => line.trim())
            } else if (key === 'is_accepting_students') {
                data[key] = true // checkbox present means true
            } else if (key === 'years_experience' || key === 'max_students_per_week' || key === 'weekly_contract_limit') {
                data[key] = value ? parseInt(value as string) : undefined
            } else if (key === 'hourly_rate') {
                data[key] = value ? parseFloat(value as string) : undefined
            } else {
                data[key] = value || undefined
            }
        })

        // Handle unchecked checkbox
        if (!formData.has('is_accepting_students')) {
            data.is_accepting_students = false
        }

        // Remove empty password fields for edit mode
        if (this.isEditMode) {
            if (!data.password) {
                delete data.password
                delete data.password_confirmation
            }
        }

        return data
    }

    private showForm(): void {
        const loading = this.container?.querySelector('#form-loading')
        const form = this.container?.querySelector('#tutor-form')
        
        loading?.classList.add('d-none')
        form?.classList.remove('d-none')
    }

    private showSuccess(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'success',
                message: message
            }
        }))
    }

    private showError(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'error',
                message: message
            }
        }))
    }
}