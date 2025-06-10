// resources/ts/components/auth/ResetPasswordForm.ts

import { FormValidator } from '@components/FormValidator'
import { authService } from '@services/AuthService'

export class ResetPasswordForm {
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

        this.form.addEventListener('submit', (e) => {
            e.preventDefault()
            this.handleSubmit()
        })

        // Real-time validation
        const inputs = this.form.querySelectorAll('input[type="password"]')
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input as HTMLInputElement)
            })

            input.addEventListener('input', () => {
                this.clearFieldError(input as HTMLInputElement)
            })
        })

        // Password toggle buttons
        const toggleButtons = this.form.querySelectorAll('[data-toggle-password]')
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.togglePasswordVisibility(button as HTMLElement)
            })
        })
    }

    private setupValidation(): void {
        const style = document.createElement('style')
        style.textContent = `
            .form-group.has-error .form-control {
                border-color: #ef4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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
            
            .btn-loading .btn-text {
                opacity: 0;
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
        if (!document.querySelector('#reset-password-form-styles')) {
            style.id = 'reset-password-form-styles'
            document.head.appendChild(style)
        }
    }

    private async handleSubmit(): Promise<void> {
        if (!this.form || this.isSubmitting) return

        const formData = new FormData(this.form)
        const data = {
            email: formData.get('email') as string,
            token: formData.get('token') as string,
            password: formData.get('password') as string,
            password_confirmation: formData.get('password_confirmation') as string
        }

        if (!this.validateForm(data)) {
            return
        }

        this.setSubmittingState(true)

        try {
            await authService.resetPassword(data)
            this.handleSuccess()
        } catch (error: any) {
            this.handleError(error)
        } finally {
            this.setSubmittingState(false)
        }
    }

    private validateForm(data: any): boolean {
        let isValid = true

        if (!data.password) {
            this.showFieldError('password', 'Hasło jest wymagane')
            isValid = false
        } else if (!this.validator.validatePassword(data.password)) {
            this.showFieldError('password', 'Hasło musi mieć minimum 8 znaków')
            isValid = false
        }

        if (data.password !== data.password_confirmation) {
            this.showFieldError('password_confirmation', 'Hasła muszą być identyczne')
            isValid = false
        }

        return isValid
    }

    private validateField(input: HTMLInputElement): boolean {
        const value = input.value
        const fieldName = input.name

        this.clearFieldError(input)

        switch (fieldName) {
            case 'password':
                if (!value) {
                    this.showFieldError(fieldName, 'Hasło jest wymagane')
                    return false
                } else if (!this.validator.validatePassword(value)) {
                    this.showFieldError(fieldName, 'Hasło musi mieć minimum 8 znaków')
                    return false
                }
                this.validatePasswordConfirmation()
                break

            case 'password_confirmation':
                return this.validatePasswordConfirmation()
        }

        return true
    }

    private validatePasswordConfirmation(): boolean {
        const password = this.form?.querySelector('[name="password"]') as HTMLInputElement
        const passwordConfirm = this.form?.querySelector('[name="password_confirmation"]') as HTMLInputElement

        if (password && passwordConfirm && passwordConfirm.value) {
            if (password.value !== passwordConfirm.value) {
                this.showFieldError('password_confirmation', 'Hasła muszą być identyczne')
                return false
            } else {
                this.clearFieldError(passwordConfirm)
                return true
            }
        }
        return true
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

    private handleSuccess(): void {
        setTimeout(() => {
            window.location.href = '/login?message=password-reset-success'
        }, 1000)
    }

    private showFieldError(fieldName: string, message: string): void {
        const input = this.form?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
        if (!input) return

        const formGroup = input.closest('.form-group')
        if (formGroup) {
            formGroup.classList.add('has-error')

            const existingError = formGroup.querySelector('.field-error')
            if (existingError) {
                existingError.remove()
            }

            const errorElement = document.createElement('span')
            errorElement.className = 'field-error'
            errorElement.textContent = message
            input.parentElement?.appendChild(errorElement)
        }
    }

    private clearFieldError(input: HTMLInputElement): void {
        const formGroup = input.closest('.form-group')
        if (formGroup) {
            formGroup.classList.remove('has-error')

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

    private handleError(error: any): void {
        if (error.errors) {
            Object.entries(error.errors).forEach(([field, messages]) => {
                const fieldMessages = messages as string[]
                if (fieldMessages.length > 0) {
                    this.showFieldError(field, fieldMessages[0])
                }
            })
        }
    }

    public reset(): void {
        if (!this.form) return

        const tokenField = this.form.querySelector('[name="token"]') as HTMLInputElement
        const emailField = this.form.querySelector('[name="email"]') as HTMLInputElement
        const tokenValue = tokenField?.value
        const emailValue = emailField?.value

        this.form.reset()

        if (tokenField && tokenValue) {
            tokenField.value = tokenValue
        }
        if (emailField && emailValue) {
            emailField.value = emailValue
        }

        this.validator.clearErrors()

        const formGroups = this.form.querySelectorAll('.form-group')
        formGroups.forEach(group => {
            group.classList.remove('has-error')
            const errorElement = group.querySelector('.field-error')
            if (errorElement) {
                errorElement.remove()
            }
        })
    }

    public focus(): void {
        const firstInput = this.form?.querySelector('input[type="password"]') as HTMLInputElement
        firstInput?.focus()
    }
}
