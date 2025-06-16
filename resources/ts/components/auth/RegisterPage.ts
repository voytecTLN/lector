// resources/ts/components/auth/RegisterPage.ts
import { authService } from '@services/AuthService'
import { ValidationError } from '@/types/models'
import type { RouteComponent } from '@/router/routes'
import type { RegisterFormData } from '@/types/auth'

export class RegisterPage implements RouteComponent {
    private container: HTMLElement | null = null
    private isSubmitting: boolean = false
    private selectedRole: 'student' | 'tutor' = 'student'

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'register-page auth-page'

        // Get role from URL params
        const urlParams = new URLSearchParams(window.location.search)
        this.selectedRole = (urlParams.get('role') as 'student' | 'tutor') || 'student'

        page.innerHTML = `
            <div class="auth-card">
                <div class="auth-card-header">
                    <h1 class="auth-title">Dołącz do nas</h1>
                    <p class="auth-subtitle">Utwórz konto i rozpocznij swoją językową przygodę</p>
                </div>

                <div class="auth-card-body">
                    <!-- Role Selection -->
                    <div class="role-selection" id="role-selection">
                        <h3>Wybierz typ konta:</h3>
                        <div class="role-options">
                            <div class="role-option ${this.selectedRole === 'student' ? 'active' : ''}" data-role="student">
                                <div class="role-icon">🎓</div>
                                <div class="role-content">
                                    <h4>Student</h4>
                                    <p>Chcę uczyć się języków</p>
                                </div>
                                <div class="role-check">✓</div>
                            </div>
                            <div class="role-option ${this.selectedRole === 'tutor' ? 'active' : ''}" data-role="tutor">
                                <div class="role-icon">👨‍🏫</div>
                                <div class="role-content">
                                    <h4>Lektor</h4>
                                    <p>Chcę nauczać języków</p>
                                </div>
                                <div class="role-check">✓</div>
                            </div>
                        </div>
                    </div>

                    <!-- Registration Form -->
                    <form class="auth-form" id="register-form" novalidate>
                        <input type="hidden" name="role" id="role-input" value="${this.selectedRole}">

                        <!-- Name Field -->
                        <div class="form-group">
                            <label for="name" class="form-label">
                                Imię i nazwisko
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name"
                                    class="form-control" 
                                    placeholder="Jan Kowalski"
                                    autocomplete="name"
                                    required
                                    aria-describedby="name-error"
                                >
                                <span class="input-icon">👤</span>
                            </div>
                            <div class="field-error" id="name-error"></div>
                        </div>

                        <!-- Email Field -->
                        <div class="form-group">
                            <label for="email" class="form-label">
                                Adres email
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email"
                                    class="form-control" 
                                    placeholder="twoj@email.com"
                                    autocomplete="email"
                                    required
                                    aria-describedby="email-error"
                                >
                                <span class="input-icon">📧</span>
                            </div>
                            <div class="field-error" id="email-error"></div>
                        </div>

                        <!-- Password Field -->
                        <div class="form-group">
                            <label for="password" class="form-label">
                                Hasło
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password"
                                    class="form-control" 
                                    placeholder="Minimum 8 znaków"
                                    autocomplete="new-password"
                                    required
                                    aria-describedby="password-error password-help"
                                >
                                <span class="input-icon">🔒</span>
                                <button type="button" class="password-toggle" id="password-toggle" aria-label="Pokaż/ukryj hasło">
                                    <span class="toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="field-help" id="password-help">
                                Hasło musi mieć minimum 8 znaków
                            </div>
                            <div class="field-error" id="password-error"></div>
                        </div>

                        <!-- Confirm Password Field -->
                        <div class="form-group">
                            <label for="password_confirmation" class="form-label">
                                Powtórz hasło
                                <span class="required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input 
                                    type="password" 
                                    id="password_confirmation" 
                                    name="password_confirmation"
                                    class="form-control" 
                                    placeholder="Powtórz hasło"
                                    autocomplete="new-password"
                                    required
                                    aria-describedby="password_confirmation-error"
                                >
                                <span class="input-icon">🔒</span>
                                <button type="button" class="password-toggle" id="password-confirmation-toggle" aria-label="Pokaż/ukryj hasło">
                                    <span class="toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="field-error" id="password_confirmation-error"></div>
                        </div>

                        <!-- Optional Fields -->
                        <div class="optional-fields">
                            <h4>Dodatkowe informacje (opcjonalne)</h4>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="phone" class="form-label">Telefon</label>
                                    <div class="input-wrapper">
                                        <input 
                                            type="tel" 
                                            id="phone" 
                                            name="phone"
                                            class="form-control" 
                                            placeholder="+48 123 456 789"
                                            autocomplete="tel"
                                            aria-describedby="phone-error"
                                        >
                                        <span class="input-icon">📞</span>
                                    </div>
                                    <div class="field-error" id="phone-error"></div>
                                </div>

                                <div class="form-group">
                                    <label for="city" class="form-label">Miasto</label>
                                    <div class="input-wrapper">
                                        <input 
                                            type="text" 
                                            id="city" 
                                            name="city"
                                            class="form-control" 
                                            placeholder="Warszawa"
                                            autocomplete="address-level2"
                                            aria-describedby="city-error"
                                        >
                                        <span class="input-icon">🏙️</span>
                                    </div>
                                    <div class="field-error" id="city-error"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Terms Acceptance -->
                        <div class="form-group">
                            <div class="form-check">
                                <input 
                                    type="checkbox" 
                                    id="terms_accepted" 
                                    name="terms_accepted"
                                    class="form-checkbox"
                                    required
                                    aria-describedby="terms-error"
                                >
                                <label for="terms_accepted" class="form-check-label">
                                    Akceptuję 
                                    <a href="/terms" target="_blank" class="terms-link">regulamin</a> 
                                    oraz 
                                    <a href="/privacy" target="_blank" class="terms-link">politykę prywatności</a>
                                    <span class="required">*</span>
                                </label>
                            </div>
                            <div class="field-error" id="terms_accepted-error"></div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="btn btn-primary btn-full" id="submit-btn">
                            <span class="btn-text">
                                Utwórz konto ${this.selectedRole === 'student' ? 'studenta' : 'lektora'}
                            </span>
                            <span class="btn-loading hidden">
                                <span class="loading-spinner"></span>
                                Tworzenie konta...
                            </span>
                        </button>

                        <!-- Form Errors -->
                        <div class="form-errors" id="form-errors"></div>
                    </form>
                </div>

                <div class="auth-card-footer">
                    <p class="auth-footer-text">
                        Masz już konto? 
                        <a href="/login" data-navigate class="auth-link">Zaloguj się</a>
                    </p>
                </div>
            </div>

            <!-- Role Benefits -->
            <div class="role-benefits" id="role-benefits">
                ${this.getRoleBenefitsHTML()}
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initFormValidation()
        this.focusFirstField()
        console.log('✅ RegisterPage mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 RegisterPage unmounted')
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Form submission
        const form = this.container.querySelector('#register-form')
        form?.addEventListener('submit', this.handleSubmit.bind(this))

        // Role selection
        const roleOptions = this.container.querySelectorAll('.role-option')
        roleOptions.forEach(option => {
            option.addEventListener('click', this.handleRoleSelect.bind(this))
        })

        // Password toggles
        const passwordToggles = this.container.querySelectorAll('.password-toggle')
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', this.togglePassword.bind(this))
        })

        // Real-time validation
        const inputs = this.container.querySelectorAll('.form-control')
        inputs.forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this))
            input.addEventListener('input', this.clearFieldError.bind(this))
        })

        // Terms checkbox
        const termsCheckbox = this.container.querySelector('#terms_accepted')
        termsCheckbox?.addEventListener('change', this.validateTerms.bind(this))
    }

    private initFormValidation(): void {
        // No pre-fill for registration
    }

    private handleRoleSelect(event: Event): void {
        const option = event.currentTarget as HTMLElement
        const role = option.getAttribute('data-role') as 'student' | 'tutor'

        if (role && role !== this.selectedRole) {
            this.selectedRole = role

            // Update UI
            const roleOptions = this.container?.querySelectorAll('.role-option')
            roleOptions?.forEach(opt => {
                opt.classList.toggle('active', opt.getAttribute('data-role') === role)
            })

            // Update hidden input
            const roleInput = this.container?.querySelector('#role-input') as HTMLInputElement
            if (roleInput) {
                roleInput.value = role
            }

            // Update submit button text
            const submitBtn = this.container?.querySelector('.btn-text')
            if (submitBtn) {
                submitBtn.textContent = `Utwórz konto ${role === 'student' ? 'studenta' : 'lektora'}`
            }

            // Update benefits section
            const benefitsContainer = this.container?.querySelector('#role-benefits')
            if (benefitsContainer) {
                benefitsContainer.innerHTML = this.getRoleBenefitsHTML()
            }
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()

        if (this.isSubmitting) return

        const form = event.target as HTMLFormElement
        const formData = new FormData(form)

        const data: RegisterFormData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            password_confirmation: formData.get('password_confirmation') as string,
            role: this.selectedRole,
            phone: formData.get('phone') as string,
            city: formData.get('city') as string,
            terms_accepted: formData.has('terms_accepted')
        }

        // Validate form
        const validationErrors = this.validateForm(data)
        if (Object.keys(validationErrors).length > 0) {
            this.showValidationErrors(validationErrors)
            return
        }

        this.setLoadingState(true)
        this.clearErrors()

        try {
            console.log('📝 Attempting registration...')

            const response = await authService.register({
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                role: data.role,
                phone: data.phone,
                city: data.city,
                terms_accepted: data.terms_accepted
            })

            if (response.success) {
                console.log('✅ Registration successful')

                if (response.data.requires_verification) {
                    // Show verification message and redirect
                    this.showSuccess('Konto zostało utworzone! Sprawdź email w celu weryfikacji.')

                    setTimeout(() => {
                        window.location.href = '/verify-email'
                    }, 2000)
                } else {
                    // Show success and redirect to dashboard
                    this.showSuccess('Konto zostało utworzone pomyślnie! Przekierowywanie...')

                    setTimeout(() => {
                        this.redirectAfterRegistration(response.data.user.role)
                    }, 1500)
                }
            }

        } catch (error) {
            console.error('❌ Registration error:', error)

            if (error instanceof ValidationError) {
                this.showValidationErrors(error.errors)
            } else {
                this.showFormError(error instanceof Error ? error.message : 'Błąd podczas rejestracji')
            }
        } finally {
            this.setLoadingState(false)
        }
    }

    private validateForm(data: RegisterFormData): Record<string, string[]> {
        const errors: Record<string, string[]> = {}

        // Name validation
        if (!data.name) {
            errors.name = ['Imię i nazwisko jest wymagane']
        } else if (data.name.length < 2) {
            errors.name = ['Imię i nazwisko musi mieć minimum 2 znaki']
        }

        // Email validation
        if (!data.email) {
            errors.email = ['Email jest wymagany']
        } else if (!this.isValidEmail(data.email)) {
            errors.email = ['Podaj poprawny adres email']
        }

        // Password validation
        if (!data.password) {
            errors.password = ['Hasło jest wymagane']
        } else if (data.password.length < 8) {
            errors.password = ['Hasło musi mieć minimum 8 znaków']
        }

        // Password confirmation
        if (!data.password_confirmation) {
            errors.password_confirmation = ['Potwierdzenie hasła jest wymagane']
        } else if (data.password !== data.password_confirmation) {
            errors.password_confirmation = ['Hasła muszą być identyczne']
        }

        // Phone validation (optional)
        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.phone = ['Podaj poprawny numer telefonu']
        }

        // Terms validation
        if (!data.terms_accepted) {
            errors.terms_accepted = ['Musisz zaakceptować regulamin']
        }

        return errors
    }

    private validateField(event: Event): void {
        const input = event.target as HTMLInputElement
        const field = input.name
        const value = input.value

        let error = ''

        switch (field) {
            case 'name':
                if (!value) {
                    error = 'Imię i nazwisko jest wymagane'
                } else if (value.length < 2) {
                    error = 'Imię i nazwisko musi mieć minimum 2 znaki'
                }
                break

            case 'email':
                if (!value) {
                    error = 'Email jest wymagany'
                } else if (!this.isValidEmail(value)) {
                    error = 'Podaj poprawny adres email'
                }
                break

            case 'password':
                if (!value) {
                    error = 'Hasło jest wymagane'
                } else if (value.length < 8) {
                    error = 'Hasło musi mieć minimum 8 znaków'
                }
                break

            case 'password_confirmation':
                const passwordInput = this.container?.querySelector('#password') as HTMLInputElement
                if (!value) {
                    error = 'Potwierdzenie hasła jest wymagane'
                } else if (value !== passwordInput?.value) {
                    error = 'Hasła muszą być identyczne'
                }
                break

            case 'phone':
                if (value && !this.isValidPhone(value)) {
                    error = 'Podaj poprawny numer telefonu'
                }
                break
        }

        this.showFieldError(field, error)
    }

    private validateTerms(): void {
        const termsCheckbox = this.container?.querySelector('#terms_accepted') as HTMLInputElement
        const error = !termsCheckbox?.checked ? 'Musisz zaakceptować regulamin' : ''
        this.showFieldError('terms_accepted', error)
    }

    private clearFieldError(event: Event): void {
        const input = event.target as HTMLInputElement
        this.showFieldError(input.name, '')
    }

    private togglePassword(event: Event): void {
        const toggle = event.currentTarget as HTMLButtonElement
        const inputWrapper = toggle.closest('.input-wrapper')
        const passwordInput = inputWrapper?.querySelector('input') as HTMLInputElement
        const toggleIcon = toggle.querySelector('.toggle-icon')

        if (passwordInput && toggleIcon) {
            const isPassword = passwordInput.type === 'password'
            passwordInput.type = isPassword ? 'text' : 'password'
            toggleIcon.textContent = isPassword ? '🙈' : '👁️'
        }
    }

    private setLoadingState(loading: boolean): void {
        this.isSubmitting = loading

        const submitBtn = this.container?.querySelector('#submit-btn') as HTMLButtonElement
        const btnText = submitBtn?.querySelector('.btn-text')
        const btnLoading = submitBtn?.querySelector('.btn-loading')

        if (submitBtn && btnText && btnLoading) {
            submitBtn.disabled = loading
            submitBtn.classList.toggle('btn-loading', loading)
            btnText.classList.toggle('hidden', loading)
            btnLoading.classList.toggle('hidden', !loading)
        }

        // Disable form inputs during submission
        const inputs = this.container?.querySelectorAll('.form-control') as NodeListOf<HTMLInputElement>
        inputs?.forEach(input => {
            input.disabled = loading
        })

        // Disable role selection during submission
        const roleOptions = this.container?.querySelectorAll('.role-option') as NodeListOf<HTMLElement>
        roleOptions?.forEach(option => {
            option.style.pointerEvents = loading ? 'none' : 'auto'
        })
    }

    private showValidationErrors(errors: Record<string, string[]>): void {
        // Clear previous errors
        this.clearErrors()

        // Show field-specific errors
        Object.entries(errors).forEach(([field, fieldErrors]) => {
            this.showFieldError(field, fieldErrors[0])
        })

        // Focus first error field
        const firstErrorField = Object.keys(errors)[0]
        const firstInput = this.container?.querySelector(`#${firstErrorField}`) as HTMLInputElement
        firstInput?.focus()
    }

    private showFieldError(field: string, error: string): void {
        const errorElement = this.container?.querySelector(`#${field}-error`)
        const inputElement = this.container?.querySelector(`#${field}`)

        if (errorElement) {
            errorElement.textContent = error
            errorElement.classList.toggle('visible', !!error)
        }

        if (inputElement) {
            inputElement.classList.toggle('error', !!error)
        }
    }

    private showFormError(message: string): void {
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = `
                <div class="alert alert-error">
                    <span class="alert-icon">❌</span>
                    <span class="alert-message">${message}</span>
                </div>
            `
            errorsContainer.classList.add('visible')
        }
    }

    private showSuccess(message: string): void {
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = `
                <div class="alert alert-success">
                    <span class="alert-icon">✅</span>
                    <span class="alert-message">${message}</span>
                </div>
            `
            errorsContainer.classList.add('visible')
        }
    }

    private clearErrors(): void {
        // Clear form errors
        const errorsContainer = this.container?.querySelector('#form-errors')
        if (errorsContainer) {
            errorsContainer.innerHTML = ''
            errorsContainer.classList.remove('visible')
        }

        // Clear field errors
        const errorElements = this.container?.querySelectorAll('.field-error')
        errorElements?.forEach(element => {
            element.textContent = ''
            element.classList.remove('visible')
        })

        // Clear input error styles
        const inputs = this.container?.querySelectorAll('.form-control')
        inputs?.forEach(input => {
            input.classList.remove('error')
        })
    }

    private focusFirstField(): void {
        const nameInput = this.container?.querySelector('#name') as HTMLInputElement
        nameInput?.focus()
    }

    private redirectAfterRegistration(role: string): void {
        const dashboardRoutes: Record<string, string> = {
            admin: '/admin/dashboard',
            moderator: '/moderator/dashboard',
            tutor: '/tutor/dashboard',
            student: '/student/dashboard'
        }

        const redirectUrl = dashboardRoutes[role] || '/profile'
        window.location.href = redirectUrl
    }

    private getRoleBenefitsHTML(): string {
        if (this.selectedRole === 'student') {
            return `
                <h3>🎓 Korzyści dla studentów:</h3>
                <ul class="benefits-list">
                    <li>Personalizowane lekcje dostosowane do Twojego poziomu</li>
                    <li>Dostęp do tysięcy wykwalifikowanych lektorów</li>
                    <li>Elastyczny harmonogram - ucz się kiedy chcesz</li>
                    <li>Śledzenie postępów i statystyki nauki</li>
                    <li>Materiały edukacyjne i ćwiczenia online</li>
                    <li>Pierwsza lekcja próbna za darmo</li>
                </ul>
            `
        } else {
            return `
                <h3>👨‍🏫 Korzyści dla lektorów:</h3>
                <ul class="benefits-list">
                    <li>Zarabiaj nauczając tego co kochasz</li>
                    <li>Elastyczne godziny pracy - ustalasz swój harmonogram</li>
                    <li>Dostęp do tysięcy motywowanych studentów</li>
                    <li>Narzędzia do prowadzenia lekcji online</li>
                    <li>Wsparcie i szkolenia dla lektorów</li>
                    <li>Konkurencyjne stawki i szybkie wypłaty</li>
                </ul>
            `
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    private isValidPhone(phone: string): boolean {
        const phoneRegex = /^[+]?[0-9\s\-\(\)]{9,}$/
        return phoneRegex.test(phone)
    }

    private cleanup(): void {
        this.isSubmitting = false
    }

    // Lifecycle hooks
    onBeforeEnter(): boolean {
        // Redirect if already authenticated
        if (authService.isAuthenticated()) {
            const user = authService.getUser()
            if (user) {
                this.redirectAfterRegistration(user.role)
                return false
            }
        }
        return true
    }

    onAfterEnter(): void {
        document.title = 'Rejestracja - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        this.cleanup()
    }
}