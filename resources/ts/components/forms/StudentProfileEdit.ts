// resources/ts/components/forms/StudentProfileEdit.ts
import type { RouteComponent } from '@router/routes'
import { api } from '@services/ApiService'
import { FormValidationHandler } from '@/utils/FormValidationHandler'
import { NotificationService } from '@/utils/NotificationService'
import { PasswordValidator } from '@/utils/PasswordValidator'
import { LoadingStateManager } from '@/utils/LoadingStateManager'

export interface StudentProfile {
    id: number;
    name: string;
    email: string;
    phone?: string;
    birth_date?: string;
    city?: string;
    country?: string;
    student_profile?: {
        learning_languages?: string[];
        learning_goals?: string[];
        current_levels?: { [key: string]: string };
    };
}

export class StudentProfileEdit implements RouteComponent {
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private profile: StudentProfile | null = null
    private validationHandler: FormValidationHandler | null = null
    private passwordValidator: PasswordValidator | null = null
    private loadingManager: LoadingStateManager | null = null

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'student-profile-edit-page'
        el.innerHTML = `
            <div class="container-fluid">
                <!-- Loading state -->
                <div id="form-loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie profilu...</span>
                    </div>
                </div>

                <!-- Form -->
                <div id="profile-form-container" class="d-none">
                    <form id="student-profile-form">
                        ${this.generateFormHTML()}
                    </form>
                </div>
            </div>
        `
        return el
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        this.form = container.querySelector('#student-profile-form')

        // Initialize utilities
        if (this.form) {
            this.validationHandler = new FormValidationHandler(this.form)
            this.passwordValidator = new PasswordValidator(this.form, { isEditMode: true })
        }

        this.loadingManager = LoadingStateManager.simple(container, '#form-loading', '#profile-form-container')

        await this.loadProfile()
    }

    unmount(): void {
        this.validationHandler?.destroy()
        this.passwordValidator?.destroy()
        this.container = null
        this.form = null
        this.profile = null
        this.validationHandler = null
        this.passwordValidator = null
        this.loadingManager = null
    }

    private generateFormHTML(): string {
        return `
            <!-- Basic Information -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Dane podstawowe</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-4 text-center">
                            <div class="profile-picture-section">
                                <div class="profile-picture-wrapper mb-3">
                                    <div class="profile-picture" id="profile-picture">
                                        <div class="profile-avatar-large" id="profile-avatar"></div>
                                        <div class="profile-picture-overlay">
                                            <i class="bi bi-camera"></i>
                                        </div>
                                    </div>
                                </div>
                                <input type="file" id="profile-picture-input" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-outline-secondary btn-sm" id="change-picture-btn">
                                    <i class="bi bi-camera me-1"></i> Zmień zdjęcie
                                </button>
                                <div class="form-text">Max 5MB, JPG/PNG</div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Imię i nazwisko <span class="text-danger">*</span></label>
                                    <input type="text" name="name" class="form-control" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Email</label>
                                    <input type="email" name="email" class="form-control" readonly>
                                    <div class="form-text">Skontaktuj się z administratorem aby zmienić email</div>
                                </div>
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
                                    <label class="form-label">Kraj</label>
                                    <input type="text" name="country" class="form-control" value="Polska">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Password Change -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Zmiana hasła</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-1"></i>
                        Zostaw pola puste, jeśli nie chcesz zmieniać hasła
                    </div>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Obecne hasło</label>
                            <input type="password" name="current_password" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Nowe hasło</label>
                            <input type="password" name="password" class="form-control" minlength="8">
                            <div class="form-text">Minimum 8 znaków</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Potwierdź nowe hasło</label>
                            <input type="password" name="password_confirmation" class="form-control">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Learning Preferences -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Preferencje nauki</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-4">
                                <label class="form-label">Języki do nauki</label>
                                <div class="row g-2">
                                    ${this.generateLanguageCheckboxes()}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-4">
                                <label class="form-label">Cele nauki</label>
                                <div class="row g-2">
                                    ${this.generateGoalCheckboxes()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Current Levels -->
                    <div class="mt-4">
                        <label class="form-label">Obecne poziomy językowe</label>
                        <div id="level-selectors">
                            ${this.generateLevelSelectors()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2 mb-4">
                <button type="button" class="btn btn-outline-secondary" onclick="window.history.back()">
                    <i class="bi bi-x-circle me-1"></i> Anuluj
                </button>
                <button type="submit" class="btn btn-primary" id="submit-button">
                    <i class="bi bi-check-circle me-1"></i> Zapisz zmiany
                </button>
            </div>
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
            <div class="col-md-6">
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

    private generateGoalCheckboxes(): string {
        const goals = [
            { value: 'conversation', label: 'Konwersacje' },
            { value: 'business', label: 'Język biznesowy' },
            { value: 'exam', label: 'Egzaminy' },
            { value: 'travel', label: 'Podróże' },
            { value: 'academic', label: 'Język akademicki' },
            { value: 'hobby', label: 'Hobby' }
        ]

        return goals.map(goal => `
            <div class="col-md-6">
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

    private generateLevelSelectors(): string {
        const languages = ['english', 'german', 'french', 'spanish', 'italian', 'portuguese', 'russian', 'chinese', 'japanese']
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

        return languages.map(lang => `
            <div class="row g-3 mb-3 level-selector d-none" data-language="${lang}">
                <div class="col-md-3">
                    <label class="form-label">${this.getLanguageLabel(lang)}</label>
                </div>
                <div class="col-md-9">
                    <select name="current_levels[${lang}]" class="form-select">
                        <option value="">Wybierz poziom</option>
                        ${levels.map(level => `<option value="${level}">${level}</option>`).join('')}
                    </select>
                </div>
            </div>
        `).join('')
    }

    private async loadProfile(): Promise<void> {
        try {
            this.loadingManager?.showLoading()

            const response = await api.get('/student/profile')
            this.profile = response.data

            this.loadingManager?.showContent()
            this.fillForm()
            this.setupForm()

        } catch (error) {
            console.error('Error loading profile:', error)
            NotificationService.error('Nie udało się załadować profilu')
            this.loadingManager?.setError('Błąd ładowania profilu')
        }
    }

    private fillForm(): void {
        if (!this.form || !this.profile) return

        // Basic fields
        const fields = ['name', 'email', 'phone', 'birth_date', 'city', 'country']
        fields.forEach(field => {
            const input = this.form!.querySelector(`[name="${field}"]`) as HTMLInputElement
            if (input && this.profile![field as keyof StudentProfile]) {
                input.value = String(this.profile![field as keyof StudentProfile])
            }
        })

        // Update avatar
        this.updateAvatar()

        // Learning languages
        if (this.profile.student_profile?.learning_languages) {
            this.profile.student_profile.learning_languages.forEach(lang => {
                const checkbox = this.form!.querySelector(`[name="learning_languages[]"][value="${lang}"]`) as HTMLInputElement
                if (checkbox) {
                    checkbox.checked = true
                    this.showLevelSelector(lang)
                }
            })
        }

        // Learning goals
        if (this.profile.student_profile?.learning_goals) {
            this.profile.student_profile.learning_goals.forEach(goal => {
                const checkbox = this.form!.querySelector(`[name="learning_goals[]"][value="${goal}"]`) as HTMLInputElement
                if (checkbox) {
                    checkbox.checked = true
                }
            })
        }

        // Current levels
        if (this.profile.student_profile?.current_levels) {
            Object.entries(this.profile.student_profile.current_levels).forEach(([lang, level]) => {
                const select = this.form!.querySelector(`[name="current_levels[${lang}]"]`) as HTMLSelectElement
                if (select) {
                    select.value = level
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

        // Profile picture upload
        const pictureInput = this.form.querySelector('#profile-picture-input') as HTMLInputElement
        const changePictureBtn = this.form.querySelector('#change-picture-btn')

        changePictureBtn?.addEventListener('click', () => {
            pictureInput.click()
        })

        pictureInput?.addEventListener('change', (e) => {
            this.handlePictureUpload(e)
        })
    }

    private showLevelSelector(language: string): void {
        const selector = this.container?.querySelector(`.level-selector[data-language="${language}"]`)
        selector?.classList.remove('d-none')
    }

    private hideLevelSelector(language: string): void {
        const selector = this.container?.querySelector(`.level-selector[data-language="${language}"]`)
        selector?.classList.add('d-none')
        
        const select = selector?.querySelector('select') as HTMLSelectElement
        if (select) {
            select.value = ''
        }
    }

    private updateAvatar(): void {
        if (!this.profile) return
        
        const avatarElement = this.container?.querySelector('#profile-avatar')
        if (avatarElement) {
            const initial = this.profile.name?.charAt(0).toUpperCase() || 'S'
            avatarElement.textContent = initial
            avatarElement.className = 'profile-avatar-large'
        }
    }

    private handlePictureUpload(e: Event): void {
        const input = e.target as HTMLInputElement
        const file = input.files?.[0]
        
        if (!file) return

        // Validate file
        if (file.size > 5 * 1024 * 1024) {
            NotificationService.error('Plik jest za duży. Maksymalny rozmiar to 5MB.')
            input.value = ''
            return
        }

        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            NotificationService.error('Nieobsługiwany format pliku. Użyj JPG, PNG lub GIF.')
            input.value = ''
            return
        }

        // Preview image
        const reader = new FileReader()
        reader.onload = (e) => {
            const avatarElement = this.container?.querySelector('#profile-avatar')
            if (avatarElement && e.target?.result) {
                avatarElement.innerHTML = `<img src="${e.target.result}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            }
        }
        reader.readAsDataURL(file)
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault()

        if (!this.form) return

        const submitButton = this.form.querySelector('#submit-button') as HTMLButtonElement
        const buttonLoader = LoadingStateManager.forButton(submitButton, 'Zapisywanie...')
        
        buttonLoader.setLoading(true)

        try {
            const formData = new FormData(this.form)
            const updateData = this.parseFormData(formData)

            await api.put('/student/profile', updateData)
            
            NotificationService.success('Profil został zaktualizowany')
            
            // Reload profile to get updated data
            await this.loadProfile()

        } catch (error: any) {
            console.error('Profile update error:', error)

            if (error.name !== 'ValidationError') {
                NotificationService.error('Wystąpił błąd podczas zapisywania profilu')
            }
        } finally {
            buttonLoader.setLoading(false)
        }
    }

    private parseFormData(formData: FormData): any {
        const data: any = {}

        // Basic fields
        const fields = ['name', 'phone', 'birth_date', 'city', 'country']
        fields.forEach(field => {
            const value = formData.get(field)
            if (value !== null && value !== '') {
                data[field] = value
            }
        })

        // Password fields (only if provided)
        const currentPassword = formData.get('current_password')
        const newPassword = formData.get('password')
        
        if (currentPassword && newPassword) {
            data.current_password = currentPassword
            data.password = newPassword
            data.password_confirmation = formData.get('password_confirmation') || ''
        }

        // Learning preferences
        const languages = formData.getAll('learning_languages[]')
        if (languages.length > 0) {
            data.learning_languages = languages
            
            // Current levels for selected languages
            const levels: { [key: string]: string } = {}
            languages.forEach(lang => {
                const level = formData.get(`current_levels[${lang}]`)
                if (level) {
                    levels[String(lang)] = String(level)
                }
            })
            data.current_levels = levels
        }

        const goals = formData.getAll('learning_goals[]')
        if (goals.length > 0) {
            data.learning_goals = goals
        }

        return data
    }

    private getLanguageLabel(language: string): string {
        const labels: Record<string, string> = {
            english: 'Angielski',
            german: 'Niemiecki', 
            french: 'Francuski',
            spanish: 'Hiszpański',
            italian: 'Włoski',
            portuguese: 'Portugalski',
            russian: 'Rosyjski',
            chinese: 'Chiński',
            japanese: 'Japoński'
        }
        return labels[language] || language
    }
}