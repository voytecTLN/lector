// resources/ts/components/students/StudentProfileEdit.ts
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'
import type { UpdateStudentRequest } from '@/types/models'
import type { AuthUser } from '@/types/auth'

export class StudentProfileEdit {
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private student: AuthUser | null = null
    private isLoading: boolean = false
    private isSaving: boolean = false

    constructor() {
        this.student = authService.getUser()
    }

    async render(): Promise<string> {
        if (!this.student) {
            return '<div class="alert alert-danger">Błąd: Nie można załadować danych profilu.</div>'
        }

        if (this.isLoading) {
            return `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie profilu...</span>
                    </div>
                </div>
            `
        }

        return `
            <div class="student-profile-edit">
                <div class="mb-4">
                    <h2>Edytuj profil</h2>
                    <p class="text-muted">Zaktualizuj swoje dane osobowe i preferencje nauki</p>
                </div>

                <form id="profile-form" class="needs-validation" novalidate>
                    <!-- Dane osobowe -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Dane osobowe</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="name" class="form-label">Imię i nazwisko *</label>
                                        <input type="text" 
                                               class="form-control" 
                                               id="name" 
                                               name="name" 
                                               value="${this.student.name || ''}" 
                                               required>
                                        <div class="invalid-feedback">
                                            Imię i nazwisko jest wymagane
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="email" class="form-label">Email *</label>
                                        <input type="email" 
                                               class="form-control" 
                                               id="email" 
                                               name="email" 
                                               value="${this.student.email || ''}" 
                                               readonly>
                                        <div class="form-text">Email nie może być zmieniony</div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="phone" class="form-label">Telefon</label>
                                        <input type="tel" 
                                               class="form-control" 
                                               id="phone" 
                                               name="phone" 
                                               value="${this.student.phone || ''}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="birth_date" class="form-label">Data urodzenia</label>
                                        <input type="date" 
                                               class="form-control" 
                                               id="birth_date" 
                                               name="birth_date" 
                                               value="${this.student.birth_date || ''}">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="city" class="form-label">Miasto</label>
                                        <input type="text" 
                                               class="form-control" 
                                               id="city" 
                                               name="city" 
                                               value="${this.student.city || ''}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="country" class="form-label">Kraj</label>
                                        <input type="text" 
                                               class="form-control" 
                                               id="country" 
                                               name="country" 
                                               value="${this.student.country || ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Preferencje nauki -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Preferencje nauki</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Języki do nauki</label>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_languages" value="english" id="lang-english">
                                            <label class="form-check-label" for="lang-english">
                                                Angielski
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_languages" value="german" id="lang-german">
                                            <label class="form-check-label" for="lang-german">
                                                Niemiecki
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_languages" value="french" id="lang-french">
                                            <label class="form-check-label" for="lang-french">
                                                Francuski
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_languages" value="spanish" id="lang-spanish">
                                            <label class="form-check-label" for="lang-spanish">
                                                Hiszpański
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_languages" value="italian" id="lang-italian">
                                            <label class="form-check-label" for="lang-italian">
                                                Włoski
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_languages" value="russian" id="lang-russian">
                                            <label class="form-check-label" for="lang-russian">
                                                Rosyjski
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Poziomy dla języków -->
                            <div id="language-levels" class="mb-3">
                                <label class="form-label">Obecne poziomy</label>
                                <div id="level-inputs">
                                    <!-- Dynamically populated based on selected languages -->
                                </div>
                            </div>

                            <!-- Cele nauki -->
                            <div class="mb-3">
                                <label class="form-label">Cele nauki</label>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_goals" value="conversation" id="goal-conversation">
                                            <label class="form-check-label" for="goal-conversation">
                                                Konwersacje
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_goals" value="business" id="goal-business">
                                            <label class="form-check-label" for="goal-business">
                                                Język biznesowy
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_goals" value="exam" id="goal-exam">
                                            <label class="form-check-label" for="goal-exam">
                                                Przygotowanie do egzaminów
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_goals" value="travel" id="goal-travel">
                                            <label class="form-check-label" for="goal-travel">
                                                Podróże
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_goals" value="academic" id="goal-academic">
                                            <label class="form-check-label" for="goal-academic">
                                                Język akademicki
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="learning_goals" value="hobby" id="goal-hobby">
                                            <label class="form-check-label" for="goal-hobby">
                                                Hobby
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Zmiana hasła -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Zmiana hasła</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="current_password" class="form-label">Obecne hasło</label>
                                <input type="password" 
                                       class="form-control" 
                                       id="current_password" 
                                       name="current_password">
                                <div class="form-text">Pozostaw puste, jeśli nie chcesz zmieniać hasła</div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="password" class="form-label">Nowe hasło</label>
                                        <input type="password" 
                                               class="form-control" 
                                               id="password" 
                                               name="password">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="password_confirmation" class="form-label">Potwierdź nowe hasło</label>
                                        <input type="password" 
                                               class="form-control" 
                                               id="password_confirmation" 
                                               name="password_confirmation">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Przyciski -->
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="btn btn-secondary" id="cancel-btn">
                            Anuluj
                        </button>
                        <button type="submit" class="btn btn-primary" id="save-btn">
                            <span class="spinner-border spinner-border-sm me-2 d-none" role="status"></span>
                            Zapisz zmiany
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        this.form = container.querySelector('#profile-form')

        if (!this.form) return

        this.setupEventListeners()
        this.loadProfileData()
    }

    unmount(): void {
        this.container = null
        this.form = null
    }

    private setupEventListeners(): void {
        if (!this.form) return

        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this))

        // Cancel button
        const cancelBtn = this.form.querySelector('#cancel-btn')
        cancelBtn?.addEventListener('click', () => {
            // Reset form to original values
            this.loadProfileData()
        })

        // Language checkbox changes
        const languageCheckboxes = this.form.querySelectorAll('input[name="learning_languages"]')
        languageCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.updateLanguageLevels.bind(this))
        })

        // Initial language levels update
        this.updateLanguageLevels()
    }

    private async loadProfileData(): Promise<void> {
        try {
            this.isLoading = true
            
            console.log('🔄 Loading profile data from /student/profile...')
            
            // Get fresh user data
            const response = await api.get('/student/profile')
            const userData = (response as any).data
            
            console.log('✅ Profile data loaded:', userData)
            
            if (userData) {
                this.student = userData
                this.populateForm()
            }
        } catch (error: any) {
            console.error('❌ Failed to load profile data:', error)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            })
            
            // If endpoint doesn't exist, use current user data
            if (error.message?.includes('404')) {
                console.log('📋 Using current user data as fallback')
                this.student = authService.getUser()
                this.populateForm()
                this.showNotification('warning', 'Używam podstawowych danych profilu')
            } else {
                this.showNotification('error', 'Nie udało się załadować danych profilu')
            }
        } finally {
            this.isLoading = false
        }
    }

    private populateForm(): void {
        if (!this.form || !this.student) return

        // Basic fields
        const nameInput = this.form.querySelector('#name') as HTMLInputElement
        if (nameInput) nameInput.value = this.student.name || ''

        const phoneInput = this.form.querySelector('#phone') as HTMLInputElement
        if (phoneInput) phoneInput.value = this.student.phone || ''

        const birthDateInput = this.form.querySelector('#birth_date') as HTMLInputElement
        if (birthDateInput) birthDateInput.value = this.student.birth_date || ''

        const cityInput = this.form.querySelector('#city') as HTMLInputElement
        if (cityInput) cityInput.value = this.student.city || ''

        const countryInput = this.form.querySelector('#country') as HTMLInputElement
        if (countryInput) countryInput.value = this.student.country || ''

        // Student profile data
        const profile = this.student.studentProfile
        if (profile) {
            // Learning languages
            const learningLanguages = profile.learning_languages || []
            learningLanguages.forEach(lang => {
                const checkbox = this.form?.querySelector(`input[name="learning_languages"][value="${lang}"]`) as HTMLInputElement
                if (checkbox) checkbox.checked = true
            })

            // Learning goals
            const learningGoals = profile.learning_goals || []
            learningGoals.forEach(goal => {
                const checkbox = this.form?.querySelector(`input[name="learning_goals"][value="${goal}"]`) as HTMLInputElement
                if (checkbox) checkbox.checked = true
            })

            // Update language levels after setting languages
            this.updateLanguageLevels()
        }
    }

    private updateLanguageLevels(): void {
        if (!this.form) return

        const levelInputsContainer = this.form.querySelector('#level-inputs')
        if (!levelInputsContainer) return

        const selectedLanguages = Array.from(this.form.querySelectorAll('input[name="learning_languages"]:checked'))
            .map(checkbox => (checkbox as HTMLInputElement).value)

        const profile = this.student?.studentProfile
        const currentLevels = profile?.current_levels || {}

        let levelInputsHTML = ''
        selectedLanguages.forEach(lang => {
            const langName = this.getLanguageName(lang)
            const currentLevel = currentLevels[lang] || 'A1'
            
            levelInputsHTML += `
                <div class="mb-2">
                    <label class="form-label">${langName}</label>
                    <select class="form-select" name="current_levels[${lang}]">
                        <option value="A1" ${currentLevel === 'A1' ? 'selected' : ''}>A1 - Podstawowy</option>
                        <option value="A2" ${currentLevel === 'A2' ? 'selected' : ''}>A2 - Średnio-podstawowy</option>
                        <option value="B1" ${currentLevel === 'B1' ? 'selected' : ''}>B1 - Średnio-zaawansowany</option>
                        <option value="B2" ${currentLevel === 'B2' ? 'selected' : ''}>B2 - Średnio-zaawansowany wyższy</option>
                        <option value="C1" ${currentLevel === 'C1' ? 'selected' : ''}>C1 - Zaawansowany</option>
                        <option value="C2" ${currentLevel === 'C2' ? 'selected' : ''}>C2 - Biegły</option>
                    </select>
                </div>
            `
        })

        levelInputsContainer.innerHTML = levelInputsHTML
    }

    private getLanguageName(code: string): string {
        const languages: Record<string, string> = {
            english: 'Angielski',
            german: 'Niemiecki',
            french: 'Francuski',
            spanish: 'Hiszpański',
            italian: 'Włoski',
            russian: 'Rosyjski'
        }
        return languages[code] || code
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()
        
        if (!this.validateSubmission()) return

        this.setLoadingState(true)

        try {
            const formData = new FormData(this.form!)
            const data = this.prepareSubmissionData(formData)
            
            await this.submitProfileData(data)
            this.handleSuccessResponse()
        } catch (error: any) {
            this.handleSubmissionError(error)
        } finally {
            this.setLoadingState(false)
        }
    }

    private validateSubmission(): boolean {
        if (!this.form || this.isSaving) return false
        
        // Clear previous validation errors
        this.clearValidationErrors()
        
        let isValid = true
        
        // Validate required fields
        isValid = this.validateRequiredFields() && isValid
        
        // Validate email format
        isValid = this.validateEmailFormat() && isValid
        
        // Validate password confirmation
        isValid = this.validatePasswordConfirmation() && isValid
        
        // Validate phone format
        isValid = this.validatePhoneFormat() && isValid
        
        return isValid
    }

    private clearValidationErrors(): void {
        if (!this.form) return
        
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid')
        })
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove())
    }

    private validateRequiredFields(): boolean {
        if (!this.form) return false
        
        const nameInput = this.form.querySelector('#name') as HTMLInputElement
        if (!nameInput?.value.trim()) {
            this.showFieldError(nameInput, 'Imię i nazwisko jest wymagane')
            return false
        }
        
        return true
    }

    private validateEmailFormat(): boolean {
        if (!this.form) return false
        
        const emailInput = this.form.querySelector('#email') as HTMLInputElement
        const emailValue = emailInput?.value.trim()
        
        if (emailValue && !this.isValidEmail(emailValue)) {
            this.showFieldError(emailInput, 'Nieprawidłowy format adresu email')
            return false
        }
        
        return true
    }

    private validatePasswordConfirmation(): boolean {
        if (!this.form) return false
        
        const passwordInput = this.form.querySelector('#password') as HTMLInputElement
        const confirmInput = this.form.querySelector('#password_confirmation') as HTMLInputElement
        
        const password = passwordInput?.value
        const confirmation = confirmInput?.value
        
        if (password && password !== confirmation) {
            this.showFieldError(confirmInput, 'Hasła muszą być identyczne')
            return false
        }
        
        if (password && password.length < 8) {
            this.showFieldError(passwordInput, 'Hasło musi mieć minimum 8 znaków')
            return false
        }
        
        return true
    }

    private validatePhoneFormat(): boolean {
        if (!this.form) return false
        
        const phoneInput = this.form.querySelector('#phone') as HTMLInputElement
        const phoneValue = phoneInput?.value.trim()
        
        if (phoneValue && !this.isValidPhone(phoneValue)) {
            this.showFieldError(phoneInput, 'Nieprawidłowy format numeru telefonu')
            return false
        }
        
        return true
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    private isValidPhone(phone: string): boolean {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/
        return phoneRegex.test(phone) && phone.length >= 9
    }

    private showFieldError(input: HTMLInputElement, message: string): void {
        if (!input) return
        
        input.classList.add('is-invalid')
        
        const feedback = document.createElement('div')
        feedback.className = 'invalid-feedback'
        feedback.textContent = message
        
        input.parentElement?.appendChild(feedback)
    }

    private setLoadingState(loading: boolean): void {
        this.isSaving = loading
        this.updateSaveButton(loading)
    }

    private async submitProfileData(data: UpdateStudentRequest): Promise<any> {
        const endpoint = this.determineEndpoint()
        this.logSubmissionDebug(data, endpoint)
        
        const response = await api.put(endpoint, data)
        console.log('✅ Profile update response:', response)
        
        return response
    }

    private determineEndpoint(): string {
        const currentUser = authService.getUser()
        
        if (currentUser?.role === 'admin' || currentUser?.role === 'moderator') {
            const endpoint = `/students/${this.student?.id}`
            console.log('🔧 Using admin endpoint:', endpoint)
            return endpoint
        } else if (currentUser?.role === 'student') {
            const endpoint = '/student/profile'
            console.log('👤 Using student endpoint:', endpoint)
            return endpoint
        } else {
            console.error('❌ Unknown user role:', currentUser?.role)
            return '/student/profile'
        }
    }

    private logSubmissionDebug(data: UpdateStudentRequest, endpoint: string): void {
        console.log('💾 Submitting profile data:', data)
        console.log('👤 Current user:', authService.getUser())
        console.log('🔑 Current token:', authService.getToken()?.substring(0, 20) + '...')
        console.log('🔒 User authenticated:', authService.isAuthenticated())
        console.log('✅ User verified:', authService.isVerified())
        
        const currentUser = authService.getUser()
        console.log('🔍 Debug info:', {
            currentUserRole: currentUser?.role,
            currentUserId: currentUser?.id,
            studentId: this.student?.id,
            studentRole: this.student?.role,
            endpoint: endpoint
        })
    }

    private async handleSuccessResponse(): Promise<void> {
        // Refresh user data from getCurrentUser
        await authService.getCurrentUser()
        this.student = authService.getUser()

        this.showNotification('success', 'Profil został zaktualizowany pomyślnie')
        this.clearPasswordFields()
    }

    private clearPasswordFields(): void {
        if (!this.form) return
        
        const passwordFields = this.form.querySelectorAll('input[type="password"]')
        passwordFields.forEach(field => (field as HTMLInputElement).value = '')
    }

    private handleSubmissionError(error: any): void {
        console.error('❌ Failed to update profile:', error)
        console.error('❌ Update error details:', {
            message: error.message,
            status: error.status,
            response: error.response
        })
        
        if (error.response?.status === 422) {
            console.log('🔍 Validation errors:', error.response.data.errors)
            this.handleValidationErrors(error.response.data.errors)
        } else {
            this.showErrorNotification(error)
        }
    }

    private showErrorNotification(error: any): void {
        let message = 'Wystąpił błąd podczas aktualizacji profilu'
        
        if (error.message?.includes('404')) {
            message = 'Endpoint do aktualizacji profilu nie istnieje'
        } else if (error.message?.includes('403')) {
            message = 'Brak uprawnień do aktualizacji profilu'
        }
        
        this.showNotification('error', message)
    }

    private prepareSubmissionData(formData: FormData): UpdateStudentRequest {
        const data: any = {}

        // Basic fields
        data.name = formData.get('name')
        data.phone = formData.get('phone')
        data.birth_date = formData.get('birth_date')
        data.city = formData.get('city')
        data.country = formData.get('country')

        // Password fields (only if provided)
        const currentPassword = formData.get('current_password')
        const newPassword = formData.get('password')
        const confirmPassword = formData.get('password_confirmation')

        if (currentPassword && newPassword) {
            data.current_password = currentPassword
            data.password = newPassword
            data.password_confirmation = confirmPassword
        }

        // Learning languages
        const learningLanguages = formData.getAll('learning_languages')
        data.learning_languages = learningLanguages

        // Learning goals
        const learningGoals = formData.getAll('learning_goals')
        data.learning_goals = learningGoals

        // Current levels
        const currentLevels: Record<string, string> = {}
        formData.forEach((value, key) => {
            if (key.startsWith('current_levels[')) {
                const lang = key.match(/current_levels\[([^\]]+)\]/)?.[1]
                if (lang) {
                    currentLevels[lang] = value.toString()
                }
            }
        })
        data.current_levels = currentLevels

        return data
    }

    private handleValidationErrors(errors: Record<string, string[]>): void {
        if (!this.form) return

        // Clear previous errors
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid')
        })
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove())

        // Show new errors
        for (const [field, messages] of Object.entries(errors)) {
            const input = this.form.querySelector(`[name="${field}"]`)
            if (input) {
                input.classList.add('is-invalid')

                const feedback = document.createElement('div')
                feedback.className = 'invalid-feedback'
                feedback.textContent = Array.isArray(messages) ? messages[0] : String(messages)

                input.parentElement?.appendChild(feedback)
            }
        }
    }

    private updateSaveButton(saving: boolean): void {
        const saveBtn = this.form?.querySelector('#save-btn')
        const spinner = saveBtn?.querySelector('.spinner-border')
        
        if (saveBtn && spinner) {
            if (saving) {
                saveBtn.setAttribute('disabled', 'true')
                spinner.classList.remove('d-none')
                saveBtn.textContent = ' Zapisywanie...'
                saveBtn.prepend(spinner)
            } else {
                saveBtn.removeAttribute('disabled')
                spinner.classList.add('d-none')
                saveBtn.textContent = 'Zapisz zmiany'
            }
        }
    }

    private showNotification(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type,
                message,
                duration: 4000
            }
        }))
    }
}