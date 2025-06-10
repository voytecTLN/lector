// resources/ts/components/auth/LoginForm.ts

import { FormValidator } from '@components/FormValidator'
import { authService } from '@services/AuthService'
import type { LoginFormData } from '@/types/auth'

export class LoginForm {
    private form: HTMLFormElement | null = null
    private validator: FormValidator
    private isSubmitting = false

    constructor(formSelector: string) {
        this.form = document.querySelector(formSelector)
        this.validator = new FormValidator()

        if (this.form) {
            this.init()
        }
    }

    private init(): void {
        this.setupEventListeners()
        this.setupValidation()
    }

    private setupEventListeners(): void {
        if (!this.form) return

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault()
            this.handleSubmit()
        })

        // Real-time validation
        const inputs = this.form.querySelectorAll('input[required]')
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input as HTMLInputElement)
            })

            input.addEventListener('input', () => {
                this.clearFieldError(input as HTMLInputElement)
            })
        })

        // Toggle password visibility
        const toggleButtons = this.form.querySelectorAll('[data-toggle-password]')
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.togglePasswordVisibility(button as HTMLElement)
            })
        })
    }

    private setupValidation(): void {
        // Add visual feedback for validation
        const style = document.createElement('style')
        style.textContent = `
            .form-group.has-error .form-control {
                border-color: #ef4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            
            .form-group.has-success .form-control {
                border-color: #10b981;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }
            
            .field-error {
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
            }
            
            .form-loading {
                opacity: 0.6;
                pointer-events: none;
            }
            
            .btn-loading {
                position: relative;
            }
            
            .btn-loading::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                margin: auto;
                border: 2px solid transparent;
                border-top-color: currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `
        document.head.appendChild(style)
    }

    private async handleSubmit(): Promise<void> {
        if (!this.form || this.isSubmitting) return

        // Get form data
        const formData = this.getFormData()

        // Validate form
        if (!this.validateForm(formData)) {
            return
        }

        this.setSubmittingState(true)

        try {
            await authService.login({
                email: formData.email,
                password: formData.password,
                remember: formData.remember
            })

            // Redirect based on user role
            this.handleSuccessfulLogin()

        } catch (error: any) {
            this.handleLoginError(error)
        } finally {
            this.setSubmittingState(false)
        }
    }

    private getFormData(): LoginFormData {
        if (!this.form) throw new Error('Form not found')

        const formData = new FormData(this.form)

        return {
            email: (formData.get('email') as string)?.trim() || '',
            password: formData.get('password') as string || '',
            remember: formData.has('remember')
        }
    }

    private validateForm(data: LoginFormData): boolean {
        this.validator.clearErrors()

        // Validate email
        if (!this.validator.validateRequired(data.email, 'email')) {
            this.showFieldError('email', 'Email jest wymagany')
        } else if (!this.validator.validateEmail(data.email, 'email')) {
            this.showFieldError('email', 'Email musi być poprawny')
        }

        // Validate password
        if (!this.validator.validateRequired(data.password, 'password')) {
            this.showFieldError('password', 'Hasło jest wymagane')
        }

        return !this.validator.hasErrors()
    }

    private validateField(input: HTMLInputElement): boolean {
        const value = input.value.trim()
        const fieldName = input.name

        this.clearFieldError(input)

        switch (fieldName) {
            case 'email':
                if (!value) {
                    this.showFieldError(fieldName, 'Email jest wymagany')
                    return false
                } else if (!this.validator.validateEmail(value)) {
                    this.showFieldError(fieldName, 'Email musi być poprawny')
                    return false
                }
                break

            case 'password':
                if (!value) {
                    this.showFieldError(fieldName, 'Hasło jest wymagane')
                    return false
                }
                break
        }

        this.showFieldSuccess(input)
        return true
    }

    private showFieldError(fieldName: string, message: string): void {
        const input = this.form?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
        if (!input) return

        const formGroup = input.closest('.form-group')
        if (formGroup) {
            formGroup.classList.remove('has-success')
            formGroup.classList.add('has-error')

            // Remove existing error message
            const existingError = formGroup.querySelector('.field-error')
            if (existingError) {
                existingError.remove()
            }

            // Add new error message
            const errorElement = document.createElement('span')
            errorElement.className = 'field-error'
            errorElement.textContent = message
            input.parentElement?.appendChild(errorElement)
        }
    }

    private showFieldSuccess(input: HTMLInputElement): void {
        const formGroup = input.closest('.form-group')
        if (formGroup) {
            formGroup.classList.remove('has-error')
            formGroup.classList.add('has-success')

            // Remove error message
            const errorElement = formGroup.querySelector('.field-error')
            if (errorElement) {
                errorElement.remove()
            }
        }
    }

    private clearFieldError(input: HTMLInputElement): void {
        const formGroup = input.closest('.form-group')
        if (formGroup) {
            formGroup.classList.remove('has-error', 'has-success')

            const errorElement = formGroup.querySelector('.field-error')
            if (errorElement) {
                errorElement.remove()
            }
        }
    }

    private setSubmittingState(isSubmitting: boolean): void {
        this.isSubmitting = isSubmitting

        if (!this.form) return

        const submitButton = this.form.querySelector('button[type="submit"]') as HTMLButtonElement
        const inputs = this.form.querySelectorAll('input')

        if (isSubmitting) {
            this.form.classList.add('form-loading')
            submitButton?.classList.add('btn-loading')
            submitButton.disabled = true
            inputs.forEach(input => input.disabled = true)
        } else {
            this.form.classList.remove('form-loading')
            submitButton?.classList.remove('btn-loading')
            submitButton.disabled = false
            inputs.forEach(input => input.disabled = false)
        }
    }

    private togglePasswordVisibility(button: HTMLElement): void {
        const targetSelector = button.getAttribute('data-toggle-password')
        if (!targetSelector) return

        const passwordInput = this.form?.querySelector(targetSelector) as HTMLInputElement
        if (!passwordInput) return

        const icon = button.querySelector('i')

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text'
            icon?.classList.replace('fa-eye', 'fa-eye-slash')
        } else {
            passwordInput.type = 'password'
            icon?.classList.replace('fa-eye-slash', 'fa-eye')
        }
    }

    private handleSuccessfulLogin(): void {
        const user = authService.getUser()
        if (!user) return

        // Redirect based on role
        let redirectUrl = '/'

        switch (user.role) {
            case 'admin':
                redirectUrl = '/admin/dashboard'
                break
            case 'moderator':
                redirectUrl = '/moderator/dashboard'
                break
            case 'tutor':
                redirectUrl = '/tutor/dashboard'
                break
            case 'student':
                redirectUrl = '/student/dashboard'
                break
        }

        // Use direct navigation instead of location.href to prevent multiple redirects
        window.location.replace(redirectUrl)
    }

    private handleLoginError(error: any): void {
        if (error.errors) {
            // Handle validation errors
            Object.entries(error.errors).forEach(([field, messages]) => {
                const fieldMessages = messages as string[]
                if (fieldMessages.length > 0) {
                    this.showFieldError(field, fieldMessages[0])
                }
            })
        }
    }

    // Public methods
    public reset(): void {
        if (!this.form) return

        this.form.reset()
        this.validator.clearErrors()

        // Clear all field states
        const formGroups = this.form.querySelectorAll('.form-group')
        formGroups.forEach(group => {
            group.classList.remove('has-error', 'has-success')
            const errorElement = group.querySelector('.field-error')
            if (errorElement) {
                errorElement.remove()
            }
        })
    }

    public focus(): void {
        const firstInput = this.form?.querySelector('input') as HTMLInputElement
        firstInput?.focus()
    }
}