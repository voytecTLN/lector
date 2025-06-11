// resources/ts/components/auth/ForgotPasswordForm.ts - Complete Implementation

import { FormValidator } from '@components/FormValidator'
import { authService } from '@services/AuthService'

export class ForgotPasswordForm {
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
        const emailInput = this.form.querySelector('[name="email"]')
        emailInput?.addEventListener('blur', () => {
            this.validateField(emailInput as HTMLInputElement)
        })

        emailInput?.addEventListener('input', () => {
            this.clearFieldError(emailInput as HTMLInputElement)
        })
    }

    private setupValidation(): void {
        // Same styles as other forms
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
            
            .success-message {
                text-align: center;
                padding: 2rem;
            }
            
            .success-message i {
                color: #10b981;
                margin-bottom: 1rem;
            }
            
            .success-message h3 {
                color: #1e293b;
                margin-bottom: 1rem;
            }
            
            .success-message p {
                color: #64748b;
                margin-bottom: 1.5rem;
            }
        `
        if (!document.querySelector('#forgot-password-form-styles')) {
            style.id = 'forgot-password-form-styles'
            document.head.appendChild(style)
        }
    }

    private async handleSubmit(): Promise<void> {
        if (!this.form || this.isSubmitting) return

        const formData = new FormData(this.form)
        const email = (formData.get('email') as string)?.trim() || ''

        if (!this.validateEmail(email)) {
            return
        }

        this.setSubmittingState(true)

        try {
            await authService.forgotPassword(email)
            this.showSuccessMessage()
        } catch (error: any) {
            this.handleError(error)
        } finally {
            this.setSubmittingState(false)
        }
    }

    private validateEmail(email: string): boolean {
        if (!email) {
            this.showFieldError('email', 'Email jest wymagany')
            return false
        }

        if (!this.validator.validateEmail(email)) {
            this.showFieldError('email', 'Email musi być poprawny')
            return false
        }

        return true
    }

    private validateField(input: HTMLInputElement): boolean {
        const value = input.value.trim()
        this.clearFieldError(input)

        if (input.name === 'email') {
            return this.validateEmail(value)
        }

        return true
    }

    private showSuccessMessage(): void {
        const form = this.form
        if (!form) return

        form.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #10b981; margin-bottom: 1rem;"></i>
                <h3>Email został wysłany!</h3>
                <p>Sprawdź swoją skrzynkę pocztową i kliknij w link resetujący hasło.</p>
                <a href="/login" class="btn btn-primary">Powrót do logowania</a>
            </div>
        `
    }

    private showFieldError(fieldName: string, message: string): void {
        const input = this.form?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
        if (!input) return

        const formGroup = input.closest('.form-group')
        if (formGroup) {
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
        if (error.errors && error.errors.email) {
            this.showFieldError('email', error.errors.email[0])
        }
    }

    public reset(): void {
        if (!this.form) return

        this.form.reset()
        this.validator.clearErrors()

        // Clear all field states
        const formGroups = this.form.querySelectorAll('.form-group')
        formGroups.forEach(group => {
            group.classList.remove('has-error')
            const errorElement = group.querySelector('.field-error')
            if (errorElement) {
                errorElement.remove()
            }
        })
    }
}