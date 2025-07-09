// resources/ts/components/students/StudentForm.ts
import type { RouteComponent } from '@router/routes'
import { StudentService } from '@services/StudentService'
import type { CreateStudentRequest, UpdateStudentRequest, User } from '@/types/models'
import { navigate, routeChecker, urlBuilder } from '@/utils/navigation'
import { ROUTES } from '@/config/routing'

export class StudentForm implements RouteComponent {
    private studentService: StudentService
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private isEditMode: boolean = false
    private studentId: number | null = null
    private student: User | null = null

    constructor() {
        this.studentService = new StudentService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'student-form-page'

        // Determine if edit mode from URL params (dashboard integration)
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section')
        const studentId = urlParams.get('student_id')

        if (section === 'edytuj-studenta' && studentId) {
            this.isEditMode = true
            this.studentId = parseInt(studentId, 10)
        }

        el.innerHTML = `
            <div class="container mt-4">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <!-- Header -->
                        <div class="mb-4">
<!--                            <a href="/#/admin/students" class="text-muted text-decoration-none mb-2 d-inline-block">-->
                            <a href="/admin/dashboard?section=uczniowie" class="text-muted text-decoration-none mb-2 d-inline-block">
                                <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                            </a>
                            <h1>${this.isEditMode ? 'Edytuj studenta' : 'Dodaj nowego studenta'}</h1>
                        </div>

                        <!-- Loading state -->
                        <div id="form-loading" class="text-center py-5 ${!this.isEditMode ? 'd-none' : ''}">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Ładowanie...</span>
                            </div>
                        </div>

                        <!-- Form -->
                        <form id="student-form" class="${this.isEditMode ? 'd-none' : ''}">
                            ${this.generateFormHTML()}
                        </form>
                    </div>
                </div>
            </div>
        `

        return el
    }

    private handleValidationError(event: CustomEvent): void {
        const { errors } = event.detail

        // Resetuj poprzednie błędy
        this.form?.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid')
        })
        this.form?.querySelectorAll('.invalid-feedback').forEach(el => el.remove())

        // Wyświetl nowe błędy
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
        this.form = container.querySelector('#student-form')

        if (this.isEditMode && this.studentId) {
            await this.loadStudentData()
        } else {
            this.setupForm()
        }
    }

    unmount(): void {
        document.removeEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)
        this.container = null
        this.form = null
        this.student = null
    }

    private generateFormHTML(): string {
        return `
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

            <!-- Języki i poziomy -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Języki i poziomy</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Języki do nauki</label>
                        <div class="row g-2">
                            ${this.generateLanguageCheckboxes()}
                        </div>
                    </div>
                    
                    <div id="level-selectors">
                        ${this.generateLevelSelectors()}
                    </div>
                </div>
            </div>

            <!-- Cele nauki -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Cele nauki</h5>
                </div>
                <div class="card-body">
                    <div class="row g-2">
                        ${this.generateGoalCheckboxes()}
                    </div>
                </div>
            </div>

            <!-- Przyciski -->
            <div class="d-flex justify-content-between mb-5">
                <a href="/admin/dashboard?section=uczniowie" class="btn btn-outline-secondary">
                    <i class="bi bi-x-circle me-1"></i> Anuluj
                </a>
                <button type="submit" class="btn btn-primary" id="submit-button">
                    <i class="bi bi-check-circle me-1"></i> 
                    ${this.isEditMode ? 'Zapisz zmiany' : 'Utwórz studenta'}
                </button>
            </div>

            <input type="hidden" name="student_id" value="${this.studentId || ''}">
        `
    }

    private generateLanguageCheckboxes(): string {
        const languages = [
            { value: 'english', label: 'Angielski' },
            { value: 'german', label: 'Niemiecki' },
            { value: 'french', label: 'Francuski' },
            { value: 'spanish', label: 'Hiszpański' },
            { value: 'italian', label: 'Włoski' },
            { value: 'portuguese', label: 'Portugalski' },
            { value: 'russian', label: 'Rosyjski' },
            { value: 'chinese', label: 'Chiński' },
            { value: 'japanese', label: 'Japoński' }
        ]

        return languages.map(lang => `
            <div class="col-md-4">
                <div class="form-check">
                    <input class="form-check-input language-checkbox" type="checkbox" 
                           name="learning_languages[]" value="${lang.value}" 
                           id="lang-${lang.value}">
                    <label class="form-check-label" for="lang-${lang.value}">
                        ${lang.label}
                    </label>
                </div>
            </div>
        `).join('')
    }

    private generateLevelSelectors(): string {
        const languages = ['english', 'german', 'french', 'spanish', 'italian', 'portuguese', 'russian', 'chinese', 'japanese']
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

        return languages.map(lang => `
            <div class="row g-3 mb-3 level-selector d-none" data-language="${lang}">
                <div class="col-md-6">
                    <label class="form-label">Poziom ${this.getLanguageLabel(lang)}</label>
                    <select name="current_levels[${lang}]" class="form-select">
                        <option value="">Wybierz poziom</option>
                        ${levels.map(level => `<option value="${level}">${level}</option>`).join('')}
                    </select>
                </div>
            </div>
        `).join('')
    }

    private generateGoalCheckboxes(): string {
        const goals = [
            { value: 'conversation', label: 'Konwersacje' },
            { value: 'business', label: 'Język biznesowy' },
            { value: 'exam', label: 'Przygotowanie do egzaminów' },
            { value: 'travel', label: 'Podróże' },
            { value: 'academic', label: 'Język akademicki' },
            { value: 'hobby', label: 'Hobby' },
            { value: 'culture', label: 'Kultura' }
        ]

        return goals.map(goal => `
            <div class="col-md-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" 
                           name="learning_goals[]" value="${goal.value}" 
                           id="goal-${goal.value}">
                    <label class="form-check-label" for="goal-${goal.value}">
                        ${goal.label}
                    </label>
                </div>
            </div>
        `).join('')
    }

    private async loadStudentData(): Promise<void> {
        if (!this.studentId) return

        try {
            const loadingDiv = this.container?.querySelector('#form-loading')
            const form = this.container?.querySelector('#student-form')

            this.student = await this.studentService.getStudentById(this.studentId)

            // Hide loading, show form
            loadingDiv?.classList.add('d-none')
            form?.classList.remove('d-none')

            this.fillFormWithStudentData(this.student)
            this.setupForm()

        } catch (error) {
            console.error('Failed to load student:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się załadować danych studenta'
                }
            }))
            navigate.to('/admin/dashboard?section=uczniowie')
        }
    }

    private fillFormWithStudentData(student: User): void {
        if (!this.form) return

        // Basic fields
        const fields = ['name', 'email', 'phone', 'birth_date', 'city', 'status']
        fields.forEach(field => {
            const input = this.form!.querySelector(`[name="${field}"]`) as HTMLInputElement
            if (input && student[field as keyof User]) {
                input.value = String(student[field as keyof User])
            }
        })

        // Languages and levels
        if (student.student_profile?.learning_languages) {
            student.student_profile.learning_languages.forEach(lang => {
                const checkbox = this.form!.querySelector(`[name="learning_languages[]"][value="${lang}"]`) as HTMLInputElement
                if (checkbox) {
                    checkbox.checked = true
                    this.showLevelSelector(lang)
                }

                if (student.student_profile?.current_levels?.[lang]) {
                    const levelSelect = this.form!.querySelector(`[name="current_levels[${lang}]"]`) as HTMLSelectElement
                    if (levelSelect) {
                        levelSelect.value = student.student_profile.current_levels[lang]
                    }
                }
            })
        }

        // Goals
        if (student.student_profile?.learning_goals) {
            student.student_profile.learning_goals.forEach(goal => {
                const checkbox = this.form!.querySelector(`[name="learning_goals[]"][value="${goal}"]`) as HTMLInputElement
                if (checkbox) {
                    checkbox.checked = true
                }
            })
        }
    }

    private setupForm(): void {
        if (!this.form) return

        // Form submit
        this.form.addEventListener('submit', this.handleSubmit.bind(this))

        // Language checkbox handlers
        const languageCheckboxes = this.form.querySelectorAll('.language-checkbox')
        languageCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement
                const language = target.value
                if (target.checked) {
                    this.showLevelSelector(language)
                } else {
                    this.hideLevelSelector(language)
                }
            })
        })

        // Password validation for edit mode
        if (this.isEditMode) {
            const passwordInput = this.form.querySelector('[name="password"]') as HTMLInputElement
            const confirmInput = this.form.querySelector('[name="password_confirmation"]') as HTMLInputElement

            const validatePasswords = () => {
                if (passwordInput.value && !confirmInput.value) {
                    confirmInput.setCustomValidity('Potwierdź hasło')
                } else if (passwordInput.value !== confirmInput.value) {
                    confirmInput.setCustomValidity('Hasła muszą być identyczne')
                } else {
                    confirmInput.setCustomValidity('')
                }
            }

            passwordInput?.addEventListener('input', validatePasswords)
            confirmInput?.addEventListener('input', validatePasswords)
        }
    }

    private showLevelSelector(language: string): void {
        const selector = this.container?.querySelector(`.level-selector[data-language="${language}"]`)
        selector?.classList.remove('d-none')

        const select = selector?.querySelector('select')
        if (select && !this.isEditMode) {
            select.setAttribute('required', 'required')
        }
    }

    private hideLevelSelector(language: string): void {
        const selector = this.container?.querySelector(`.level-selector[data-language="${language}"]`)
        selector?.classList.add('d-none')

        const select = selector?.querySelector('select') as HTMLSelectElement
        if (select) {
            select.removeAttribute('required')
            select.value = ''
        }
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault()

        if (!this.form) return

        const submitButton = this.form.querySelector('#submit-button') as HTMLButtonElement
        submitButton.disabled = true
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Przetwarzanie...'

        try {
            const formData = new FormData(this.form)

            // DODAJ TO DO DEBUGOWANIA
            console.log('=== Form Debug ===')
            console.log('Password:', formData.get('password'))
            console.log('Password Confirmation:', formData.get('password_confirmation'))
            console.log('All form data:')
            formData.forEach((value, key) => {
                console.log(`${key}: ${value}`)
            })
            console.log('=================')

            const studentData = this.parseFormData(formData)

            // DODAJ TO TEŻ
            console.log('Parsed data:', studentData)

            if (this.isEditMode && this.studentId) {
                await this.studentService.updateStudent(this.studentId, studentData as UpdateStudentRequest)
                navigate.to(`/admin/dashboard?section=student-details&student_id=${this.studentId}`)
            } else {
                const student = await this.studentService.createStudent(studentData as CreateStudentRequest)
                navigate.to(`/admin/dashboard?section=student-details&student_id=${student.id}`)
            }

        } catch (error: any) {
            console.error('Form submission error:', error)

            if (error.name !== 'ValidationError') {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Wystąpił błąd podczas zapisywania danych'
                    }
                }))
            }
        } finally {
            submitButton.disabled = false
            submitButton.innerHTML = `<i class="bi bi-check-circle me-1"></i> ${this.isEditMode ? 'Zapisz zmiany' : 'Utwórz studenta'}`
        }
    }

    private parseFormData(formData: FormData): CreateStudentRequest | UpdateStudentRequest {
        const data: any = {}

        // Basic fields
        const fields = ['name', 'email', 'password', 'phone', 'birth_date', 'city', 'status']
        fields.forEach(field => {
            const value = formData.get(field)
            if (value !== null && value !== '') {
                data[field] = value
            }
        })

        // For edit mode, handle password properly
        if (this.isEditMode) {
            if (!data.password) {
                // Jeśli nie ma hasła, usuń oba pola
                delete data.password
                delete data.password_confirmation
            } else {
                // Jeśli jest hasło, zawsze dodaj password_confirmation
                data.password_confirmation = formData.get('password_confirmation') || ''
            }
        } else {
            // For create mode, always include password_confirmation if password exists
            if (data.password) {
                data.password_confirmation = formData.get('password_confirmation') || ''
            }
        }

        // Languages and levels
        const languages = formData.getAll('learning_languages[]')
        if (languages.length > 0) {
            data.learning_languages = languages
            data.current_levels = {}

            languages.forEach(lang => {
                const level = formData.get(`current_levels[${lang}]`)
                if (level) {
                    data.current_levels[String(lang)] = level
                }
            })
        }

        // Goals
        const goals = formData.getAll('learning_goals[]')
        if (goals.length > 0) {
            data.learning_goals = goals
        }

        return data
    }

    private getLanguageLabel(language: string): string {
        const labels: Record<string, string> = {
            english: 'angielskiego',
            german: 'niemieckiego',
            french: 'francuskiego',
            spanish: 'hiszpańskiego',
            italian: 'włoskiego',
            portuguese: 'portugalskiego',
            russian: 'rosyjskiego',
            chinese: 'chińskiego',
            japanese: 'japońskiego'
        }
        return labels[language] || language
    }
}