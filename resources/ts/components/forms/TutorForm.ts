// resources/ts/components/forms/TutorForm.ts
import type { RouteComponent } from '@router/routes'
import { TutorService } from '@services/TutorService'
import type { CreateTutorRequest, UpdateTutorRequest, User } from '@/types/models'
import { navigate } from '@/utils/navigation'
import { ROUTES } from '@/config/routing'
import { PasswordValidator } from '@/utils/PasswordValidator'
import { PasswordToggleHelper } from '@/utils/PasswordToggleHelper'

// Global tracking to prevent multiple form setups
const setupFormInstances = new Set<string>()

export class TutorForm implements RouteComponent {
    private tutorService: TutorService
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private isEditMode: boolean = false
    private tutorId: number | null = null
    private tutor: User | null = null
    private passwordValidator: PasswordValidator | null = null
    private isMounted: boolean = false
    private isFormSetup: boolean = false
    private instanceKey: string = ''

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
        // Create unique instance key based on mode and tutor ID
        this.instanceKey = this.isEditMode ? `edit-${this.tutorId}` : 'create'
        
        console.log('🔥 TutorForm mount called', { 
            isEditMode: this.isEditMode, 
            tutorId: this.tutorId, 
            isMounted: this.isMounted,
            instanceKey: this.instanceKey,
            globalSetup: setupFormInstances.has(this.instanceKey)
        })
        
        // Check if this specific form instance is already set up globally AND form exists in DOM
        const existingForm = container.querySelector('#tutor-form') as HTMLFormElement
        if (setupFormInstances.has(this.instanceKey) && existingForm?.dataset?.tutorFormSetup === 'true') {
            console.log('⚠️ TutorForm instance already set up globally with valid DOM form, skipping...', this.instanceKey)
            return
        } else if (setupFormInstances.has(this.instanceKey)) {
            console.log('🔧 TutorForm instance in global set but no valid DOM form found, clearing and proceeding...', this.instanceKey)
            setupFormInstances.delete(this.instanceKey)
        }
        
        if (this.isMounted) {
            console.log('⚠️ TutorForm already mounted, skipping...')
            return
        }
        
        this.isMounted = true
        document.addEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)
        this.container = container
        this.form = container.querySelector('#tutor-form') as HTMLFormElement
        
        console.log('🔥 Form element search results:', {
            form: this.form,
            formId: this.form?.id,
            formTagName: this.form?.tagName,
            formNodeType: this.form?.nodeType,
            isHTMLElement: this.form instanceof HTMLElement,
            isHTMLFormElement: this.form instanceof HTMLFormElement,
            hasAddEventListener: typeof this.form?.addEventListener === 'function',
            instanceKey: this.instanceKey,
            containerHTML: container.innerHTML.substring(0, 200) + '...'
        })

        // Additional validation
        if (!this.form) {
            console.error('❌ Form element #tutor-form not found in container!')
            console.log('Container innerHTML:', container.innerHTML.substring(0, 500))
            this.isMounted = false
            return
        }

        if (!(this.form instanceof HTMLFormElement)) {
            console.error('❌ Found element is not an HTMLFormElement:', this.form)
            this.isMounted = false
            return
        }

        if (this.isEditMode && this.tutorId) {
            console.log('🔥 Edit mode detected, loading tutor data...')
            await this.loadTutorData()
        } else {
            console.log('🔥 Create mode detected, setting up form...')
            this.setupForm()
        }
    }

    unmount(): void {
        console.log('🔥 TutorForm UNMOUNT called', { 
            tutorId: this.tutorId, 
            isMounted: this.isMounted,
            instanceKey: this.instanceKey
        })
        this.isMounted = false
        this.isFormSetup = false
        document.removeEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)
        
        // Clean up global setup tracking
        if (this.instanceKey) {
            setupFormInstances.delete(this.instanceKey)
            console.log('✅ Cleaned up global setup tracking for:', this.instanceKey)
        }
        
        this.container = null
        this.form = null
        this.tutor = null
        this.instanceKey = ''
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
                                        <input type="password" name="password" class="form-control" required minlength="12">
                                        <div class="form-text">Minimum 12 znaków (duże i małe litery, cyfry, znaki specjalne)</div>
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
                                        <input type="password" name="password" class="form-control" minlength="12">
                                        <div class="form-text">Minimum 12 znaków (duże i małe litery, cyfry, znaki specjalne)</div>
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
                                <label class="form-label">Język nauczania <span class="text-danger">*</span></label>
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
                                ${this.isEditMode ? `
                                    <button type="button" class="btn btn-danger" id="delete-button">
                                        <i class="bi bi-trash me-1"></i> Usuń lektora
                                    </button>
                                ` : ''}
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
        console.log('🔥 TutorForm setupForm called', { 
            form: this.form, 
            formElement: this.form?.tagName, 
            isFormSetup: this.isFormSetup,
            formInstanceCheck: this.form instanceof HTMLFormElement,
            addEventListenerType: typeof this.form?.addEventListener
        })
        
        if (!this.form) {
            console.error('❌ Form element not found in setupForm!')
            return
        }

        if (!(this.form instanceof HTMLFormElement)) {
            console.error('❌ Form is not an HTMLFormElement in setupForm:', this.form)
            return
        }

        if (this.isFormSetup) {
            console.log('⚠️ Form already set up, skipping event listener setup...')
            return
        }

        this.isFormSetup = true
        console.log('✅ Adding submit event listener to form')
        
        // Mark this instance as set up globally
        setupFormInstances.add(this.instanceKey)
        
        try {
            this.form.addEventListener('submit', this.handleSubmit.bind(this))
            console.log('✅ Submit event listener added successfully')
        } catch (error) {
            console.error('❌ Failed to add submit event listener:', error)
            return
        }
        
        // Initialize password validation with strong password requirements
        try {
            this.passwordValidator = new PasswordValidator(this.form, {
                isEditMode: this.isEditMode,
                enforceStrength: true,
                minLength: 12
            })
            console.log('✅ Password validator initialized')
        } catch (error) {
            console.error('❌ Failed to initialize password validator:', error)
        }

        // Convert password inputs to have toggles
        try {
            PasswordToggleHelper.convertPasswordInputsToToggleable(this.container!)
            console.log('✅ Password toggles initialized')
        } catch (error) {
            console.error('❌ Failed to initialize password toggles:', error)
        }
        
        // Setup delete button for edit mode
        if (this.isEditMode) {
            const deleteButton = this.form.querySelector('#delete-button') as HTMLButtonElement
            if (deleteButton) {
                try {
                    deleteButton.addEventListener('click', this.handleDelete.bind(this))
                    console.log('✅ Delete button event listener added')
                } catch (error) {
                    console.error('❌ Failed to add delete button event listener:', error)
                }
            }
        }
    }

    private async loadTutorData(): Promise<void> {
        console.log('🔥 loadTutorData called', { tutorId: this.tutorId })
        if (!this.tutorId) return

        try {
            console.log('🔥 Fetching tutor data...')
            this.tutor = await this.tutorService.getTutorById(this.tutorId)
            console.log('🔥 Tutor data loaded, populating form...')
            this.populateForm()
            console.log('🔥 Form populated, setting up form...')
            this.setupForm()
            console.log('🔥 Form setup complete, showing form...')
            this.showForm()
        } catch (error) {
            console.error('❌ Failed to load tutor data:', error)
            this.showError('Nie udało się załadować danych lektora')
            await navigate.to(ROUTES.ADMIN_TUTORS)
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
        } else if (element.type === 'date' && value) {
            // Special handling for date fields - ensure YYYY-MM-DD format
            const dateValue = value.toString().split('T')[0] // Remove time part if present
            element.value = dateValue
        } else {
            element.value = value || ''
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        console.log('🔥 TutorForm handleSubmit called', { event, form: this.form, isEditMode: this.isEditMode, tutorId: this.tutorId })
        console.log('🔥 Preventing default behavior...')
        event.preventDefault()
        console.log('🔥 Looking for submit button...')
        
        const submitButton = this.form?.querySelector('#submit-button') as HTMLButtonElement
        console.log('🔥 Submit button search result:', { submitButton, form: this.form })
        if (!submitButton) {
            console.log('❌ Submit button not found!')
            return
        }
        console.log('✅ Submit button found, proceeding...')

        const originalText = submitButton.innerHTML
        submitButton.disabled = true
        submitButton.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Zapisywanie...'

        try {
            const formData = new FormData(this.form!)
            const data = this.extractFormData(formData)
            console.log('🔥 Form data extracted:', data)

            if (this.isEditMode && this.tutorId) {
                console.log('🔥 Sending UPDATE request for tutor:', this.tutorId)
                await this.tutorService.updateTutor(this.tutorId, data as UpdateTutorRequest)
                console.log('✅ UPDATE request completed successfully!')
                this.showSuccess('Lektor został zaktualizowany')
                
                // Stay on the edit form after successful update
                console.log('✅ Staying on edit form after successful update')
            } else {
                console.log('🔥 Sending CREATE request')
                await this.tutorService.createTutor(data as CreateTutorRequest)
                console.log('✅ CREATE request completed successfully!')
                this.showSuccess('Lektor został utworzony')
                
                console.log('🔥 Redirecting to tutors list...')
                // Redirect to tutor list only after creation
                await navigate.to(ROUTES.ADMIN_TUTORS)
            }

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

    private async handleDelete(): Promise<void> {
        if (!this.tutorId || !this.tutor) return

        // Import SweetAlert2 for confirmation dialog
        const { default: Swal } = await import('sweetalert2')

        const result = await Swal.fire({
            title: 'Czy na pewno chcesz usunąć lektora?',
            html: `
                <p>Lektor <strong>${this.tutor.name}</strong> zostanie dezaktywowany.</p>
                <p class="text-muted">Ta operacja nie usuwa lektora z bazy danych, tylko dezaktywuje go.</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Tak, usuń',
            cancelButtonText: 'Anuluj',
            customClass: {
                popup: 'swal-wide'
            }
        })

        if (!result.isConfirmed) return

        const deleteButton = this.form?.querySelector('#delete-button') as HTMLButtonElement
        if (!deleteButton) return

        const originalText = deleteButton.innerHTML
        deleteButton.disabled = true
        deleteButton.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Usuwanie...'

        try {
            await this.tutorService.deactivateTutor(this.tutorId)
            
            this.showSuccess('Lektor został dezaktywowany')
            
            // Redirect to tutor list
            setTimeout(() => {
                navigate.to(ROUTES.ADMIN_TUTORS)
            }, 1500)

        } catch (error: any) {
            console.error('Delete error:', error)
            this.showError('Wystąpił błąd podczas dezaktywacji lektora')
        } finally {
            deleteButton.disabled = false
            deleteButton.innerHTML = originalText
        }
    }

    private extractFormData(formData: FormData): CreateTutorRequest | UpdateTutorRequest {
        const data: any = {}

        // Handle multi-select fields first (checkboxes/multiple selects)
        const languages = formData.getAll('languages')
        if (languages.length > 0) {
            data.languages = languages
        }
        
        const lessonTypes = formData.getAll('lesson_types')
        if (lessonTypes.length > 0) {
            data.lesson_types = lessonTypes
        }

        const specializations = formData.getAll('specializations')
        if (specializations.length > 0) {
            data.specializations = specializations
        }

        // Basic fields
        formData.forEach((value, key) => {
            // Skip multi-select fields (already handled above)
            if (key === 'languages' || key === 'lesson_types' || key === 'specializations') {
                return
            }
            
            if (key.endsWith('[]')) {
                const arrayKey = key.replace('[]', '')
                if (!data[arrayKey]) data[arrayKey] = []
                data[arrayKey].push(value)
            } else if (key === 'certifications' || key === 'education') {
                // Split by lines and filter empty
                data[key] = (value as string).split('\n').filter(line => line.trim())
            } else if (key === 'is_accepting_students') {
                data[key] = true // checkbox present means true
            } else if (key === 'years_experience' || key === 'weekly_contract_limit') {
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