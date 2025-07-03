// resources/ts/components/students/StudentForm.ts
import { StudentService } from '@services/StudentService'
import type { CreateStudentRequest, UpdateStudentRequest, User } from '@/types/models'
import type { RouteComponent } from '@router/routes'

export class StudentForm implements RouteComponent {
    private studentService: StudentService
    private form: HTMLFormElement | null = null
    private submitButton: HTMLButtonElement | null = null
    private isEditMode: boolean = false
    private studentId: number | null = null
    private container: HTMLElement | null = null

    constructor() {
        this.studentService = new StudentService()

        const match = window.location.pathname.match(/\/(\d+)\/edit$/)
        if (match) {
            this.isEditMode = true
            this.studentId = parseInt(match[1], 10)
        }
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.innerHTML = this.getFormHTML()
        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.init()
    }

    private getFormHTML(): string {
        return `
            <form id="student-form">
                <input type="hidden" name="student_id" value="${this.studentId || ''}">
                <div class="form-group">
                    <label>Imię i nazwisko</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" ${this.isEditMode ? 'disabled' : 'required'}>
                </div>
                <div class="form-group">
                    <label>Telefon</label>
                    <input type="tel" name="phone">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status">
                        <option value="active">Aktywny</option>
                        <option value="inactive">Nieaktywny</option>
                        <option value="blocked">Zablokowany</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Hasło ${this.isEditMode ? '(opcjonalnie)' : ''}</label>
                    <input type="password" name="password" ${this.isEditMode ? '' : 'required'}>
                </div>
                <div class="form-group">
                    <label>Potwierdź hasło</label>
                    <input type="password" name="password_confirmation" ${this.isEditMode ? '' : 'required'}>
                </div>
                <button id="submit-button" type="submit">${this.isEditMode ? 'Zapisz zmiany' : 'Utwórz studenta'}</button>
            </form>
        `
    }

    private async init(): Promise<void> {
        this.form = this.container?.querySelector('#student-form') as HTMLFormElement
        this.submitButton = this.container?.querySelector('#submit-button') as HTMLButtonElement

        if (!this.form) return

        // Check if in edit mode
        const studentIdField = this.form.querySelector('input[name="student_id"]') as HTMLInputElement
        if (studentIdField && studentIdField.value) {
            this.isEditMode = true
            this.studentId = parseInt(studentIdField.value, 10)
        }

        // Setup form submit handler
        this.form.addEventListener('submit', this.handleSubmit.bind(this))

        // Setup validation listeners
        document.addEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener)

        // Setup language selection handling
        this.setupLanguageSelectionHandling()

        // Setup goal selection handling
        this.setupGoalSelectionHandling()

        // Initialize form data if in edit mode
        if (this.isEditMode && this.studentId) {
            await this.initializeFormData()
        }
    }

    private async initializeFormData(): Promise<void> {
        if (!this.studentId) return

        try {
            const student = await this.studentService.getStudentById(this.studentId)
            this.fillFormWithStudentData(student)
        } catch (error) {
            console.error('Failed to load student data:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się załadować danych studenta'
                }
            }))
        }
    }

    private fillFormWithStudentData(student: User): void {
        if (!this.form) return

        // Set basic fields
        const fieldsToSet = [
            'name', 'email', 'phone', 'birth_date', 'city', 'country', 'status'
        ]

        fieldsToSet.forEach(field => {
            const input = this.form!.querySelector(`[name="${field}"]`) as HTMLInputElement
            if (input && student[field as keyof User]) {
                input.value = student[field as keyof User] as string
            }
        })

        const statusSelect = this.form!.querySelector('select[name="status"]') as HTMLSelectElement
        if (statusSelect && student.status) {
            statusSelect.value = student.status
        }

        // Set learning languages and levels
        if (student.studentProfile?.learning_languages) {
            student.studentProfile.learning_languages.forEach(lang => {
                const checkbox = this.form!.querySelector(`[name="learning_languages[]"][value="${lang}"]`) as HTMLInputElement
                if (checkbox) {
                    checkbox.checked = true
                    this.showLevelSelector(lang)
                }

                // Set level if available
                if (student.studentProfile?.current_levels && student.studentProfile.current_levels[lang]) {
                    const levelSelect = this.form!.querySelector(`[name="current_levels[${lang}]"]`) as HTMLSelectElement
                    if (levelSelect) {
                        levelSelect.value = student.studentProfile.current_levels[lang]
                    }
                }
            })
        }

        // Set learning goals
        if (student.studentProfile?.learning_goals) {
            student.studentProfile.learning_goals.forEach(goal => {
                const checkbox = this.form!.querySelector(`[name="learning_goals[]"][value="${goal}"]`) as HTMLInputElement
                if (checkbox) {
                    checkbox.checked = true
                }
            })
        }

        // Set preferred schedule
        if (student.studentProfile?.preferred_schedule) {
            const schedule = student.studentProfile.preferred_schedule

            if (schedule.days) {
                schedule.days.forEach((day: string) => {
                    const checkbox = this.form!.querySelector(`[name="preferred_schedule[days][]"][value="${day}"]`) as HTMLInputElement
                    if (checkbox) {
                        checkbox.checked = true
                    }
                })
            }

            if (schedule.times) {
                schedule.times.forEach((time: string) => {
                    const checkbox = this.form!.querySelector(`[name="preferred_schedule[times][]"][value="${time}"]`) as HTMLInputElement
                    if (checkbox) {
                        checkbox.checked = true
                    }
                })
            }

            // Set frequency
            if (schedule.frequency) {
                const frequencySelect = this.form!.querySelector('[name="preferred_schedule[frequency]"]') as HTMLSelectElement
                if (frequencySelect) {
                    frequencySelect.value = schedule.frequency
                }
            }
        }
    }

    private setupLanguageSelectionHandling(): void {
        if (!this.form) return

        const languageCheckboxes = this.form.querySelectorAll('input[name="learning_languages[]"]')

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
    }

    private showLevelSelector(language: string): void {
        const levelContainer = document.querySelector(`.level-selector[data-language="${language}"]`)
        if (levelContainer) {
            levelContainer.classList.remove('d-none')

            // Make the select required
            const select = levelContainer.querySelector('select')
            if (select) {
                select.setAttribute('required', 'required')
            }
        }
    }

    private hideLevelSelector(language: string): void {
        const levelContainer = document.querySelector(`.level-selector[data-language="${language}"]`)
        if (levelContainer) {
            levelContainer.classList.add('d-none')

            // Remove required attribute
            const select = levelContainer.querySelector('select')
            if (select) {
                select.removeAttribute('required')
                select.value = '' // Reset value
            }
        }
    }

    private setupGoalSelectionHandling(): void {
        // For simplicity, no additional handling is needed for goals
        // We just collect the checked goals during form submission
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault()

        if (!this.form || !this.submitButton) return

        // Disable submit button to prevent double submission
        this.submitButton.disabled = true
        this.submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Przetwarzanie...'

        try {
            const formData = new FormData(this.form)
            const password = formData.get('password') as string | null
            const confirm = formData.get('password_confirmation') as string | null

            if ((!this.isEditMode || password) && password !== confirm) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: { type: 'error', message: 'Hasła nie są takie same' }
                }))
                return
            }

            const studentData = this.parseFormData(formData)

            if (this.isEditMode && this.studentId) {
                // Update existing student
                await this.studentService.updateStudent(this.studentId, studentData as UpdateStudentRequest)

                // Redirect to student profile
                window.location.href = `/panel/students/${this.studentId}`
            } else {
                // Create new student
                const student = await this.studentService.createStudent(studentData as CreateStudentRequest)

                // Redirect to student profile
                window.location.href = `/panel/students/${student.id}`
            }
        } catch (error) {
            console.error('Form submission error:', error)

            // Error is handled by validation error event listener
            // or shown as a general error notification
            if (!(error instanceof Error && error.name === 'ValidationError')) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Wystąpił błąd podczas zapisywania danych'
                    }
                }))
            }
        } finally {
            // Re-enable submit button
            this.submitButton.disabled = false
            this.submitButton.innerHTML = this.isEditMode ? 'Zapisz zmiany' : 'Utwórz studenta'
        }
    }

    private parseFormData(formData: FormData): CreateStudentRequest | UpdateStudentRequest {
        const data: any = {}

        // Basic fields
        const basicFields = ['name', 'email', 'password', 'phone', 'birth_date', 'city', 'country', 'status']
        basicFields.forEach(field => {
            const value = formData.get(field)
            if (value !== null && value !== '') {
                data[field] = value
            }
        })

        // Learning languages (array)
        const languages = formData.getAll('learning_languages[]')
        if (languages.length > 0) {
            data.learning_languages = languages

            // Current levels (object)
            data.current_levels = {}
            languages.forEach(langValue => {
                // Upewnij się, że lang jest stringiem
                const lang = String(langValue)
                const level = formData.get(`current_levels[${lang}]`)
                if (level) {
                    data.current_levels[lang] = level
                }
            })
        }

        // Learning goals (array)
        const goals = formData.getAll('learning_goals[]')
        if (goals.length > 0) {
            data.learning_goals = goals
        }

        // Preferred schedule (object)
        data.preferred_schedule = {
            days: formData.getAll('preferred_schedule[days][]'),
            times: formData.getAll('preferred_schedule[times][]'),
            frequency: formData.get('preferred_schedule[frequency]') || 'weekly'
        }

        return data
    }

    private handleValidationError(event: CustomEvent): void {
        const { errors } = event.detail

        // Reset previous errors
        this.resetValidationErrors()

        // Display new errors
        for (const [field, messages] of Object.entries(errors)) {
            const input = this.form?.querySelector(`[name="${field}"]`)
            const fieldContainer = input?.closest('.form-group') || input?.closest('.mb-3')

            if (fieldContainer) {
                fieldContainer.classList.add('is-invalid')

                const feedbackElement = document.createElement('div')
                feedbackElement.className = 'invalid-feedback'
                feedbackElement.textContent = Array.isArray(messages) ? messages[0] : messages

                fieldContainer.appendChild(feedbackElement)
            }
        }
    }

    private resetValidationErrors(): void {
        if (!this.form) return

        // Remove is-invalid class
        const invalidFields = this.form.querySelectorAll('.is-invalid')
        invalidFields.forEach(field => field.classList.remove('is-invalid'))

        // Remove feedback messages
        const feedbackElements = this.form.querySelectorAll('.invalid-feedback')
        feedbackElements.forEach(el => el.remove())
    }
}

// Initialize on document load
