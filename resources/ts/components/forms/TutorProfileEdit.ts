// resources/ts/components/forms/TutorProfileEdit.ts
import type { RouteComponent } from '@router/routes'
import { TutorService } from '@services/TutorService'
import { FormValidationHandler } from '@/utils/FormValidationHandler'
import { NotificationService } from '@/utils/NotificationService'
import { PasswordValidator } from '@/utils/PasswordValidator'
import { PasswordToggleHelper } from '@/utils/PasswordToggleHelper'
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
    private isMounted: boolean = false
    private isLoadingProfile: boolean = false

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
        // Only check per-instance mounting
        if (this.isMounted) {
            return
        }
        
        this.isMounted = true
        this.container = container
        this.form = container.querySelector('#tutor-profile-form')

        // Initialize utilities
        if (this.form) {
            this.validationHandler = new FormValidationHandler(this.form)
            this.passwordValidator = new PasswordValidator(this.form, { 
                isEditMode: true, 
                enforceStrength: true,
                minLength: 12
            })
        } else {
            console.error('❌ Form #tutor-profile-form not found in container!')
            this.isMounted = false
            return
        }

        this.loadingManager = LoadingStateManager.simple(container, '#form-loading', '#profile-form-container')
        
        // Setup description preview
        this.setupDescriptionPreview()
        
        // Setup profile preview
        this.setupProfilePreview()

        await this.loadProfile()
    }

    unmount(): void {
        this.isMounted = false
        
        this.validationHandler?.destroy()
        this.passwordValidator?.destroy()
        
        // Don't clear form and container - they might be needed if component gets remounted
        // this.container = null
        // this.form = null
        
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
                            <div class="row">
                                <div class="col-lg-6">
                                    <textarea name="description" class="form-control" rows="10" id="description-textarea"
                                        placeholder="Opisz swoje doświadczenie, metody nauczania, osiągnięcia..."></textarea>
                                    <div class="form-text">
                                        <div class="alert alert-info p-2 mt-2">
                                            <strong>💡 Formatowanie tekstu:</strong><br>
                                            • <strong>Nowa linia:</strong> <code>Enter lub użyj &lt;br&gt;</code><br>
                                            • <strong>Pogrubienie:</strong> <code>&lt;b&gt;pogrubiony tekst&lt;/b&gt;</code><br>
                                            • <strong>Kursywa:</strong> <code>&lt;i&gt;pochylony tekst&lt;/i&gt;</code><br>
                                            • <strong>Podkreślenie:</strong> <code>&lt;u&gt;podkreślony tekst&lt;/u&gt;</code>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="card">
                                        <div class="card-header bg-light">
                                            <strong>📖 Podgląd</strong>
                                        </div>
                                        <div class="card-body" id="description-preview" style="min-height: 250px; max-height: 400px; overflow-y: auto;">
                                            <p class="text-muted">Tu pojawi się podgląd twojego opisu...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            <label class="form-label">Język nauczania</label>
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
                                    <input type="text" name="certifications[]" class="form-control" 
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

            <!-- Education -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Wykształcenie</h5>
                </div>
                <div class="card-body">
                    <div class="col-12">
                        <textarea name="education" class="form-control" rows="3" 
                            placeholder="np. Magister filologii angielskiej, Uniwersytet Warszawski&#10;Kurs metodyki nauczania języków obcych&#10;Certyfikat Cambridge CELTA..."></textarea>
                        <div class="form-text">Opisz swoje wykształcenie, kursy, szkolenia</div>
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
                            <input type="password" name="password" class="form-control" minlength="12">
                            <div class="form-text">Minimum 12 znaków (duże i małe litery, cyfry, znaki specjalne)</div>
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
                <button type="button" class="btn btn-outline-info" id="preview-profile-btn">
                    <i class="bi bi-eye me-1"></i> Podgląd profilu
                </button>
                <button type="submit" class="btn btn-primary" id="submit-button">
                    <i class="bi bi-check-circle me-1"></i> Zapisz zmiany
                </button>
            </div>
            
            <!-- Profile Preview Modal -->
            <div class="modal fade" id="profile-preview-modal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-eye me-2"></i>Podgląd profilu - tak widzą Cię studenci
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0" id="profile-preview-content">
                            <!-- Profile preview content will be rendered here -->
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i> Zamknij podgląd
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private generateLanguageCheckboxes(): string {
        return LanguageUtils.generateLanguageCheckboxes([], 'languages')
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
        // Prevent multiple concurrent loads
        if (this.isLoadingProfile) {
            return
        }
        
        // Always force refresh from server after form submission
        // if (this.profile) {
        //     console.log('✅ Profile data already loaded, filling form')
        //     this.fillForm()
        //     this.setupForm()
        //     return
        // }
        
        this.isLoadingProfile = true
        
        try {
            this.loadingManager?.showLoading()

            this.profile = await this.tutorService.getProfile()

            this.loadingManager?.showContent()
            this.fillForm()
            this.setupForm()

        } catch (error) {
            console.error('Error loading profile:', error)
            NotificationService.error('Nie udało się załadować profilu')
            this.loadingManager?.setError('Błąd ładowania profilu')
        } finally {
            this.isLoadingProfile = false
        }
    }

    private fillForm(): void {
        // Re-find form if it's null (might have been cleared by unmount)
        if (!this.form && this.container) {
            this.form = this.container.querySelector('#tutor-profile-form')
        }
        
        if (!this.form || !this.profile) {
            console.error('fillForm - missing form or profile:', { 
                form: this.form, 
                profile: this.profile,
                container: this.container,
                containerHTML: this.container?.innerHTML.substring(0, 200) + '...'
            })
            return
        }


        // Basic fields (excluding birth_date which needs special handling)
        const fields = ['name', 'email', 'phone', 'city']
        fields.forEach(field => {
            const input = this.form!.querySelector(`[name="${field}"]`) as HTMLInputElement
            const value = this.profile![field as keyof User]
            if (input && value) {
                input.value = String(value)
            }
        })

        // Special handling for birth_date field
        const birthDateInput = this.form!.querySelector('[name="birth_date"]') as HTMLInputElement
        if (birthDateInput && this.profile!.birth_date) {
            // Backend now returns date in Y-m-d format directly
            birthDateInput.value = this.profile!.birth_date.toString()
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
        
        if (tutorProfile) {
            const profile = tutorProfile

            const descriptionField = this.form.querySelector(`[name="description"]`) as HTMLTextAreaElement
            if (descriptionField && profile.description) {
                descriptionField.value = profile.description
                
                // Update preview
                const preview = this.container?.querySelector('#description-preview')
                if (preview) {
                    preview.innerHTML = this.formatDescriptionForPreview(profile.description)
                }
            }

            const educationField = this.form.querySelector(`[name="education"]`) as HTMLTextAreaElement
            if (educationField && profile.education) {
                // Handle if education is array or string
                educationField.value = Array.isArray(profile.education) 
                    ? profile.education.join('\n') 
                    : profile.education
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
                    const checkbox = this.form!.querySelector(`[name="languages[]"][value="${lang}"]`) as HTMLInputElement
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

            // Lesson types - field is called 'lesson_types' in backend
            if (profile.lesson_types) {
                profile.lesson_types.forEach((type: string) => {
                    const checkbox = this.form!.querySelector(`[name="lesson_types[]"][value="${type}"]`) as HTMLInputElement
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
                            <input type="text" name="certifications[]" class="form-control" value="${qualification}">
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

        // Convert password inputs to have toggles (after form is visible)
        PasswordToggleHelper.convertPasswordInputsToToggleable(this.container!)

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
                        <input type="text" name="certifications[]" class="form-control" 
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
                const languages = formData.getAll('languages[]')
                formData.delete('languages[]')
                languages.forEach(lang => {
                    formData.append('languages[]', lang)
                })
                
                const specializations = formData.getAll('specializations[]')
                
                // Validate specializations count (allow all 8 available options)
                if (specializations.length > 8) {
                    NotificationService.error('Możesz wybrać maksymalnie 8 specjalizacji')
                    return
                }
                
                formData.delete('specializations[]')
                specializations.forEach(spec => {
                    formData.append('specializations[]', spec)
                })
                
                const certifications = formData.getAll('certifications[]')
                formData.delete('certifications[]')
                certifications.forEach(cert => {
                    if (cert && String(cert).trim()) {
                        formData.append('certifications[]', cert)
                    }
                })
                
                // Send FormData directly for file upload
                var updateData: any = formData
            } else {
                // Parse to JSON for regular updates
                var updateData = this.parseFormData(formData)
            }

            const response = await this.tutorService.updateProfile(updateData)
            
            NotificationService.success('Profil został zaktualizowany')
            
            // Reload profile to get updated data
            await this.loadProfile()

        } catch (error: any) {
            console.error('Profile update error:', error)

            // Handle ValidationError from ApiService
            if (error.name === 'ValidationError' && error.errors) {
                // Display validation errors on form fields
                this.validationHandler?.displayValidationErrors(error.errors)
                
                // Show general error message
                NotificationService.error('Sprawdź poprawność wypełnionych pól')
            }
            // Check for specializations validation error
            else if (error.response?.data?.errors?.specializations) {
                const specError = Array.isArray(error.response.data.errors.specializations) 
                    ? error.response.data.errors.specializations[0]
                    : error.response.data.errors.specializations
                NotificationService.error(`Błąd specjalizacji: ${specError}`)
            } else {
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
        const tutorFields = ['description', 'education', 'years_experience', 'hourly_rate']
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
        data.languages = formData.getAll('languages[]')
        
        const specializations = formData.getAll('specializations[]')
        // Validate specializations count (allow all 8 available options)
        if (specializations.length > 8) {
            throw new Error('Możesz wybrać maksymalnie 8 specjalizacji')
        }
        data.specializations = specializations
        
        const certifications = formData.getAll('certifications[]').filter(q => q && String(q).trim())
        if (certifications.length > 0) {
            data.certifications = certifications
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
    
    /**
     * Setup live preview for description field
     */
    private setupDescriptionPreview(): void {
        const textarea = this.container?.querySelector('#description-textarea') as HTMLTextAreaElement
        const preview = this.container?.querySelector('#description-preview')
        
        if (!textarea || !preview) return
        
        // Initial preview update if there's existing text
        const existingText = textarea.value
        if (existingText) {
            preview.innerHTML = this.formatDescriptionForPreview(existingText)
        }
        
        // Update preview on input
        textarea.addEventListener('input', () => {
            const text = textarea.value
            if (text.trim()) {
                preview.innerHTML = this.formatDescriptionForPreview(text)
            } else {
                preview.innerHTML = '<p class="text-muted">Tu pojawi się podgląd twojego opisu...</p>'
            }
        })
    }
    
    /**
     * Format description text for preview (similar to StudentTutors formatDescription)
     */
    private formatDescriptionForPreview(text: string): string {
        if (!text) return ''
        
        // First, escape any existing HTML to prevent XSS, except our allowed tags
        let formatted = text
            // Temporarily replace allowed tags with placeholders
            .replace(/<b>/gi, '{{B_OPEN}}')
            .replace(/<\/b>/gi, '{{B_CLOSE}}')
            .replace(/<i>/gi, '{{I_OPEN}}')
            .replace(/<\/i>/gi, '{{I_CLOSE}}')
            .replace(/<u>/gi, '{{U_OPEN}}')
            .replace(/<\/u>/gi, '{{U_CLOSE}}')
            .replace(/<br\s*\/?>/gi, '{{BR}}')
            // Remove any script tags completely
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            // Remove all other HTML tags
            .replace(/<[^>]+>/g, '')
            // Restore allowed tags
            .replace(/{{B_OPEN}}/g, '<b>')
            .replace(/{{B_CLOSE}}/g, '</b>')
            .replace(/{{I_OPEN}}/g, '<i>')
            .replace(/{{I_CLOSE}}/g, '</i>')
            .replace(/{{U_OPEN}}/g, '<u>')
            .replace(/{{U_CLOSE}}/g, '</u>')
            .replace(/{{BR}}/g, '<br>')
            // Convert line breaks to <br> tags
            .replace(/\n/g, '<br>')
        
        return formatted
    }
    
    /**
     * Setup profile preview functionality
     */
    private setupProfilePreview(): void {
        const previewBtn = this.container?.querySelector('#preview-profile-btn')
        
        if (!previewBtn) return
        
        previewBtn.addEventListener('click', () => {
            this.showProfilePreview()
        })
    }
    
    /**
     * Show profile preview modal
     */
    private showProfilePreview(): void {
        const previewContent = this.container?.querySelector('#profile-preview-content')
        if (!previewContent) return
        
        // Generate preview content from current form data
        const previewHTML = this.generateProfilePreview()
        previewContent.innerHTML = previewHTML
        
        // Show modal using Bootstrap
        const modal = this.container?.querySelector('#profile-preview-modal')
        if (modal && (window as any).bootstrap) {
            const bsModal = new (window as any).bootstrap.Modal(modal)
            bsModal.show()
        }
    }
    
    /**
     * Generate profile preview HTML (same as student sees)
     */
    private generateProfilePreview(): string {
        if (!this.form) return '<p class="text-muted">Błąd podczas ładowania podglądu</p>'
        
        // Collect current form data
        const formData = new FormData(this.form)
        const currentData = this.parseFormData(formData)
        
        // Get user data
        const name = String(formData.get('name') || this.profile?.name || 'Nie podano')
        const city = String(formData.get('city') || this.profile?.city || 'Miasto nieznane')
        const avatar = this.profile?.avatar
        
        // Get tutor profile data with fallbacks
        const description = currentData.description || this.profile?.tutorProfile?.description || ''
        const education = currentData.education || this.profile?.tutorProfile?.education || ''
        const yearsExperience = currentData.years_experience || this.profile?.tutorProfile?.years_experience || 0
        const isAcceptingStudents = currentData.is_accepting_students !== undefined 
            ? currentData.is_accepting_students 
            : this.profile?.tutorProfile?.is_accepting_students || false
        const languages = currentData.languages?.length 
            ? currentData.languages 
            : this.profile?.tutorProfile?.languages || []
        const specializations = currentData.specializations?.length 
            ? currentData.specializations 
            : this.profile?.tutorProfile?.specializations || []
        const certifications = currentData.certifications?.length 
            ? currentData.certifications 
            : this.profile?.tutorProfile?.certifications || []
        
        // Generate stats
        const yearsLabel = yearsExperience === 1 ? 'rok' : yearsExperience >= 2 && yearsExperience <= 4 ? 'lata' : 'lat'
        const stats = `
            <div class="mb-3">
                <div class="small text-muted">Doświadczenie</div>
                <div class="fw-bold">${yearsExperience} ${yearsLabel}</div>
            </div>
        `
        
        // Generate avatar HTML
        const avatarHtml = avatar 
            ? `<img src="/storage/avatars/${avatar}" alt="Profile" class="rounded-circle" style="width: 120px; height: 120px; object-fit: cover;">`
            : `<div class="rounded-circle d-flex align-items-center justify-content-center" style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; font-weight: bold;">${name.charAt(0).toUpperCase()}</div>`
        
        return `
            <div class="container-fluid p-4">
                <div class="row">
                    <div class="col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <div class="mb-3" style="display: flex; justify-content: center;">
                                    ${avatarHtml}
                                </div>
                                <h3 class="card-title">${name}</h3>
                                <p class="text-muted mb-2">${city}</p>
                                
                                <div class="mb-3">
                                    ${isAcceptingStudents 
                                        ? '<span class="badge bg-success">Przyjmuje studentów</span>'
                                        : '<span class="badge bg-secondary">Nie przyjmuje studentów</span>'
                                    }
                                </div>
                                
                                ${stats}
                                
                                <button class="btn btn-primary btn-lg w-100" disabled>
                                    <i class="bi bi-calendar-check me-2"></i>Sprawdź terminy
                                </button>
                                <small class="text-muted d-block mt-2">To tylko podgląd - przycisk nieaktywny</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-8">
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">O mnie</h4>
                                <div class="card-text">${this.formatDescriptionForPreview(description) || '<p class="text-muted">Brak opisu</p>'}</div>
                            </div>
                        </div>
                        
                        ${education ? `
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">Wykształcenie</h4>
                                <p class="card-text" style="white-space: pre-line;">${education}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">Języki nauczania</h4>
                                <div class="d-flex flex-wrap gap-2">
                                    ${languages.length > 0 
                                        ? languages.map((lang: string) => 
                                            `<span class="badge bg-primary fs-6">${this.getLanguageName(lang)}</span>`
                                        ).join('')
                                        : '<span class="text-muted">Brak wybranych języków</span>'
                                    }
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">Specjalizacje</h4>
                                <div class="d-flex flex-wrap gap-2">
                                    ${specializations.length > 0 
                                        ? specializations.map((spec: string) => 
                                            `<span class="badge bg-info fs-6">${this.getSpecializationName(spec)}</span>`
                                        ).join('')
                                        : '<span class="text-muted">Brak wybranych specjalizacji</span>'
                                    }
                                </div>
                            </div>
                        </div>
                        
                        ${(certifications && certifications.length > 0) ? `
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">Kwalifikacje i certyfikaty</h4>
                                <ul class="list-unstyled">
                                    ${certifications.map((cert: string) => 
                                        `<li class="mb-2">
                                            <i class="bi bi-award text-success me-2"></i>
                                            ${cert}
                                        </li>`
                                    ).join('')}
                                </ul>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `
    }
    
    /**
     * Get language name for display
     */
    private getLanguageName(code: string): string {
        const languages: { [key: string]: string } = {
            'english': 'Angielski',
            'german': 'Niemiecki', 
            'french': 'Francuski',
            'spanish': 'Hiszpański',
            'italian': 'Włoski',
            'portuguese': 'Portugalski',
            'russian': 'Rosyjski',
            'chinese': 'Chiński',
            'japanese': 'Japoński',
            'polish': 'Polski'
        }
        return languages[code] || code
    }
    
    /**
     * Get specialization name for display
     */
    private getSpecializationName(code: string): string {
        const specializations: { [key: string]: string } = {
            'business': 'Język biznesowy',
            'conversation': 'Konwersacje',
            'exam': 'Przygotowanie do egzaminów',
            'grammar': 'Gramatyka',
            'pronunciation': 'Wymowa',
            'academic': 'Język akademicki',
            'travel': 'Język w podróży',
            'kids': 'Zajęcia dla dzieci'
        }
        return specializations[code] || code
    }

}