// resources/ts/components/forms/TutorProfileEdit.ts
import type { RouteComponent } from '@router/routes'
import { TutorService } from '@services/TutorService'
import { FormValidationHandler } from '@/utils/FormValidationHandler'
import { NotificationService } from '@/utils/NotificationService'
import { PasswordValidator } from '@/utils/PasswordValidator'
import { LoadingStateManager } from '@/utils/LoadingStateManager'
import { LanguageUtils } from '@/utils/LanguageUtils'

// Use the User type from models which includes tutorProfile
import type { User } from '@/types/models'

export class TutorProfileEdit implements RouteComponent {
    private form: HTMLFormElement | null = null
    private container: HTMLElement | null = null
    private profile: User | null = null
    private validationHandler: FormValidationHandler | null = null
    private passwordValidator: PasswordValidator | null = null
    private loadingManager: LoadingStateManager | null = null
    private tutorService = new TutorService()

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'tutor-profile-edit-page'
        
        // Add CSS for hover effect
        const style = document.createElement('style')
        style.textContent = `
            #profile-picture:hover .profile-picture-overlay {
                opacity: 1 !important;
            }
        `
        el.appendChild(style)
        
        el.innerHTML += `
            <div class="tutor-content-area">
                <!-- Loading state -->
                <div id="form-loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie profilu...</span>
                    </div>
                </div>

                <!-- Form -->
                <div id="profile-form-container" class="d-none">
                    <div class="mb-4">
                        <h2>Edytuj profil</h2>
                        <p class="tutor-text-muted">Zaktualizuj swoje dane osobowe i informacje o nauczaniu</p>
                    </div>

                    <form id="tutor-profile-form">
                        ${this.generateFormHTML()}
                    </form>
                </div>
            </div>
        `
        return el
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        this.form = container.querySelector('#tutor-profile-form')

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
                                <div class="profile-picture-wrapper mb-3" style="display: flex; justify-content: center;">
                                    <div class="profile-picture" id="profile-picture" style="position: relative; width: 150px; height: 150px;">
                                        <div class="profile-avatar-large" id="profile-avatar" style="width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: #e9ecef; border-radius: 50%; font-size: 48px; color: #6c757d;"></div>
                                        <div class="profile-picture-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.5); border-radius: 50%; opacity: 0; transition: opacity 0.3s; cursor: pointer;">
                                            <i class="bi bi-camera" style="color: white; font-size: 32px;"></i>
                                        </div>
                                    </div>
                                </div>
                                <input type="file" id="profile-picture-input" name="profile_picture" accept="image/*" style="display: none;">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Teaching Information -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Informacje o nauczaniu</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label">O mnie / Bio</label>
                            <textarea name="description" class="form-control" rows="4" 
                                placeholder="Opisz swoje doświadczenie, metody nauczania, osiągnięcia..."></textarea>
                            <div class="form-text">Przedstaw się swoim przyszłym studentom</div>
                        </div>
                        
                        <div class="col-md-4">
                            <label class="form-label">Lata doświadczenia</label>
                            <input type="number" name="years_experience" class="form-control" min="0" max="50">
                        </div>
                        
                        <!--
                        <div class="col-md-4">
                            <label class="form-label">Stawka godzinowa (PLN)</label>
                            <div class="input-group">
                                <input type="number" name="hourly_rate" class="form-control" min="0" step="0.01">
                                <span class="input-group-text">zł/h</span>
                            </div>
                        </div>
                        -->
                        
                        <div class="col-md-4">
                            <label class="form-label">Status</label>
                            <div class="form-check form-switch mt-2">
                                <input class="form-check-input" type="checkbox" name="is_accepting_students" id="accepting-students">
                                <label class="form-check-label" for="accepting-students">
                                    Przyjmuję nowych studentów
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Teaching Languages & Specializations -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Języki i specjalizacje</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Języki nauczania</label>
                            <div class="row g-2">
                                ${this.generateLanguageCheckboxes()}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Specjalizacje</label>
                            <div class="row g-2">
                                ${this.generateSpecializationCheckboxes()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Qualifications -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Kwalifikacje i certyfikaty</h5>
                </div>
                <div class="card-body">
                    <div id="qualifications-container">
                        <div class="qualification-item mb-3">
                            <div class="row g-2">
                                <div class="col-md-10">
                                    <input type="text" name="qualifications[]" class="form-control" 
                                        placeholder="np. Certyfikat TESOL, Magister filologii angielskiej...">
                                </div>
                                <div class="col-md-2">
                                    <button type="button" class="btn btn-outline-danger remove-qualification" style="display: none;">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-primary btn-sm" id="add-qualification">
                        <i class="bi bi-plus-circle me-1"></i> Dodaj kwalifikację
                    </button>
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
        return LanguageUtils.generateLanguageCheckboxes([], 'teaching_languages')
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

    private async loadProfile(): Promise<void> {
        try {
            this.loadingManager?.showLoading()

            this.profile = await this.tutorService.getProfile()
            console.log('Loaded profile:', this.profile)

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
        if (!this.form || !this.profile) {
            console.error('fillForm - missing form or profile:', { form: this.form, profile: this.profile })
            return
        }

        console.log('Filling form with profile:', this.profile)

        // Basic fields (excluding birth_date which needs special handling)
        const fields = ['name', 'email', 'phone', 'city']
        fields.forEach(field => {
            const input = this.form!.querySelector(`[name="${field}"]`) as HTMLInputElement
            const value = this.profile![field as keyof User]
            console.log(`Field ${field}:`, { input, value })
            if (input && value) {
                input.value = String(value)
            }
        })

        // Special handling for birth_date field
        const birthDateInput = this.form!.querySelector('[name="birth_date"]') as HTMLInputElement
        if (birthDateInput && this.profile!.birth_date) {
            // Backend now returns date in Y-m-d format directly
            birthDateInput.value = this.profile!.birth_date.toString()
            console.log('Setting birth_date:', this.profile!.birth_date)
        }

        // Update avatar
        this.updateAvatar()
        
        // Show current avatar if exists
        if (this.profile!.avatar) {
            const avatarElement = this.container?.querySelector('#profile-avatar')
            if (avatarElement) {
                avatarElement.innerHTML = `<img src="/storage/avatars/${this.profile!.avatar}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            }
        }

        // Tutor profile fields - check both camelCase and snake_case
        const tutorProfile = this.profile.tutorProfile || this.profile.tutor_profile
        console.log('tutorProfile field:', tutorProfile)
        console.log('Full profile object:', JSON.stringify(this.profile, null, 2))
        
        if (tutorProfile) {
            const profile = tutorProfile

            const descriptionField = this.form.querySelector(`[name="description"]`) as HTMLTextAreaElement
            if (descriptionField && profile.description) {
                descriptionField.value = profile.description
            }

            const experienceField = this.form.querySelector(`[name="years_experience"]`) as HTMLInputElement
            if (experienceField && profile.years_experience !== undefined) {
                experienceField.value = String(profile.years_experience)
            }

            const rateField = this.form.querySelector(`[name="hourly_rate"]`) as HTMLInputElement
            if (rateField && profile.hourly_rate) {
                rateField.value = String(profile.hourly_rate)
            }

            const acceptingField = this.form.querySelector(`[name="is_accepting_students"]`) as HTMLInputElement
            if (acceptingField) {
                acceptingField.checked = Boolean(profile.is_accepting_students)
            }

            // Teaching languages - field is called 'languages' in backend
            if (profile.languages) {
                profile.languages.forEach((lang: string) => {
                    const checkbox = this.form!.querySelector(`[name="teaching_languages[]"][value="${lang}"]`) as HTMLInputElement
                    if (checkbox) {
                        checkbox.checked = true
                    }
                })
            }

            // Specializations
            if (profile.specializations) {
                profile.specializations.forEach((spec: string) => {
                    const checkbox = this.form!.querySelector(`[name="specializations[]"][value="${spec}"]`) as HTMLInputElement
                    if (checkbox) {
                        checkbox.checked = true
                    }
                })
            }

            // Qualifications - might be called 'certifications' in backend
            const qualifications = (profile as any).qualifications || profile.certifications
            if (qualifications && qualifications.length > 0) {
                this.fillQualifications(qualifications)
            }
        }
    }

    private fillQualifications(qualifications: string[]): void {
        const container = this.container?.querySelector('#qualifications-container')
        if (!container) return

        container.innerHTML = ''

        qualifications.forEach((qualification, index) => {
            const qualificationHtml = `
                <div class="qualification-item mb-3">
                    <div class="row g-2">
                        <div class="col-md-10">
                            <input type="text" name="qualifications[]" class="form-control" value="${qualification}">
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-outline-danger remove-qualification" ${index === 0 ? 'style="display: none;"' : ''}>
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `
            container.insertAdjacentHTML('beforeend', qualificationHtml)
        })

        this.setupQualificationHandlers()
    }

    private setupForm(): void {
        if (!this.form) return

        // Form submit
        this.form.addEventListener('submit', this.handleSubmit.bind(this))

        // Profile picture upload
        const pictureInput = this.form.querySelector('#profile-picture-input') as HTMLInputElement
        const changePictureBtn = this.form.querySelector('#change-picture-btn')

        changePictureBtn?.addEventListener('click', () => {
            pictureInput.click()
        })

        pictureInput?.addEventListener('change', (e) => {
            this.handlePictureUpload(e)
        })

        // Qualifications management
        const addQualificationBtn = this.form.querySelector('#add-qualification')
        addQualificationBtn?.addEventListener('click', () => {
            this.addQualificationField()
        })

        this.setupQualificationHandlers()
    }

    private setupQualificationHandlers(): void {
        const removeButtons = this.container?.querySelectorAll('.remove-qualification')
        removeButtons?.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement
                const item = target.closest('.qualification-item')
                item?.remove()
                this.updateQualificationRemoveButtons()
            })
        })
    }

    private addQualificationField(): void {
        const container = this.container?.querySelector('#qualifications-container')
        if (!container) return

        const qualificationHtml = `
            <div class="qualification-item mb-3">
                <div class="row g-2">
                    <div class="col-md-10">
                        <input type="text" name="qualifications[]" class="form-control" 
                            placeholder="np. Certyfikat TESOL, Magister filologii angielskiej...">
                    </div>
                    <div class="col-md-2">
                        <button type="button" class="btn btn-outline-danger remove-qualification">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
        container.insertAdjacentHTML('beforeend', qualificationHtml)
        this.setupQualificationHandlers()
        this.updateQualificationRemoveButtons()
    }

    private updateQualificationRemoveButtons(): void {
        const items = this.container?.querySelectorAll('.qualification-item')
        items?.forEach((item, index) => {
            const removeBtn = item.querySelector('.remove-qualification') as HTMLElement
            if (removeBtn) {
                removeBtn.style.display = index === 0 && items.length === 1 ? 'none' : 'block'
            }
        })
    }

    private updateAvatar(): void {
        if (!this.profile) return
        
        const avatarElement = this.container?.querySelector('#profile-avatar')
        if (avatarElement) {
            // Add inline styles for proper display
            avatarElement.setAttribute('style', 'width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: #e9ecef; border-radius: 50%; font-size: 48px; color: #6c757d;')
            
            if (this.profile.avatar) {
                avatarElement.innerHTML = `<img src="/storage/avatars/${this.profile.avatar}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            } else {
                const initial = this.profile.name?.charAt(0).toUpperCase() || 'L'
                avatarElement.textContent = initial
            }
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
            
            // Check if we have a file upload
            const fileInput = this.form.querySelector('#profile-picture-input') as HTMLInputElement
            const hasFile = fileInput?.files && fileInput.files.length > 0
            
            if (hasFile) {
                // When sending FormData with file, we need to convert checkbox to proper boolean
                const isAcceptingCheckbox = this.form.querySelector('[name="is_accepting_students"]') as HTMLInputElement
                if (isAcceptingCheckbox) {
                    formData.delete('is_accepting_students')
                    formData.append('is_accepting_students', isAcceptingCheckbox.checked ? '1' : '0')
                }
                
                // Also need to handle arrays properly - rename them without brackets for Laravel
                const teachingLanguages = formData.getAll('teaching_languages[]')
                formData.delete('teaching_languages[]')
                teachingLanguages.forEach(lang => {
                    formData.append('teaching_languages[]', lang)
                })
                
                const specializations = formData.getAll('specializations[]')
                formData.delete('specializations[]')
                specializations.forEach(spec => {
                    formData.append('specializations[]', spec)
                })
                
                const qualifications = formData.getAll('qualifications[]')
                formData.delete('qualifications[]')
                qualifications.forEach(qual => {
                    if (qual && String(qual).trim()) {
                        formData.append('qualifications[]', qual)
                    }
                })
                
                // Send FormData directly for file upload
                var updateData: any = formData
            } else {
                // Parse to JSON for regular updates
                var updateData = this.parseFormData(formData)
            }

            await this.tutorService.updateProfile(updateData)
            
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
        const fields = ['name', 'phone', 'city', 'birth_date']
        fields.forEach(field => {
            const value = formData.get(field)
            if (value !== null && value !== '') {
                data[field] = value
            }
        })

        // Tutor profile fields
        const tutorFields = ['description', 'years_experience', 'hourly_rate']
        tutorFields.forEach(field => {
            const value = formData.get(field)
            if (value !== null && value !== '') {
                if (field === 'years_experience') {
                    data[field] = parseInt(String(value))
                } else if (field === 'hourly_rate') {
                    data[field] = parseFloat(String(value))
                } else {
                    data[field] = value
                }
            }
        })

        // Boolean field
        data.is_accepting_students = formData.get('is_accepting_students') === 'on'

        // Array fields - handle them even if empty to clear existing values
        data.teaching_languages = formData.getAll('teaching_languages[]')
        data.specializations = formData.getAll('specializations[]')
        
        const qualifications = formData.getAll('qualifications[]').filter(q => q && String(q).trim())
        if (qualifications.length > 0) {
            data.qualifications = qualifications
        }

        // Password fields (only if provided)
        const currentPassword = formData.get('current_password')
        const newPassword = formData.get('password')
        
        if (currentPassword && newPassword) {
            data.current_password = currentPassword
            data.password = newPassword
            data.password_confirmation = formData.get('password_confirmation') || ''
        }

        return data
    }
}