export class FormValidator {
    private errors: Record<string, string[]> = {}

    // Validate required field
    validateRequired(value: any, fieldName: string): boolean {
        if (value === null || value === undefined || value === '') {
            this.addError(fieldName, `${fieldName} jest wymagane`)
            return false
        }
        return true
    }

    // Validate email format
    validateEmail(email: string, fieldName: string = 'Email'): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            this.addError(fieldName, 'Email musi być poprawny')
            return false
        }
        return true
    }

    // Validate minimum length
    validateMinLength(value: string, minLength: number, fieldName: string): boolean {
        if (value.length < minLength) {
            this.addError(fieldName, `${fieldName} musi mieć minimum ${minLength} znaków`)
            return false
        }
        return true
    }

    // Validate password strength
    validatePassword(password: string, fieldName: string = 'Hasło'): boolean {
        if (password.length < 8) {
            this.addError(fieldName, 'Hasło musi mieć minimum 8 znaków')
            return false
        }
        return true
    }

    // Validate phone number (Polish format)
    validatePhone(phone: string, fieldName: string = 'Telefon'): boolean {
        const phoneRegex = /^(\+48\s?)?[\d\s-]{9,}$/
        if (!phoneRegex.test(phone)) {
            this.addError(fieldName, 'Numer telefonu musi być poprawny')
            return false
        }
        return true
    }

    // Validate date (not in future for birth date)
    validateBirthDate(date: string, fieldName: string = 'Data urodzenia'): boolean {
        const birthDate = new Date(date)
        const today = new Date()

        if (birthDate >= today) {
            this.addError(fieldName, 'Data urodzenia musi być z przeszłości')
            return false
        }
        return true
    }

    // Add error to field
    private addError(fieldName: string, message: string): void {
        if (!this.errors[fieldName]) {
            this.errors[fieldName] = []
        }
        this.errors[fieldName].push(message)
    }

    // Get all errors
    getErrors(): Record<string, string[]> {
        return this.errors
    }

    // Get errors for specific field
    getFieldErrors(fieldName: string): string[] {
        return this.errors[fieldName] || []
    }

    // Get first error for field
    getFirstError(fieldName: string): string | null {
        const fieldErrors = this.getFieldErrors(fieldName)
        return fieldErrors.length > 0 ? fieldErrors[0] : null
    }

    // Check if field has errors
    hasErrors(fieldName?: string): boolean {
        if (fieldName) {
            return (this.errors[fieldName]?.length || 0) > 0
        }
        return Object.keys(this.errors).length > 0
    }

    // Clear all errors
    clearErrors(): void {
        this.errors = {}
    }

    // Clear errors for specific field
    clearFieldErrors(fieldName: string): void {
        delete this.errors[fieldName]
    }

    // Validate form data against rules
    validate(data: Record<string, any>, rules: Record<string, string>): boolean {
        this.clearErrors()

        for (const [field, ruleString] of Object.entries(rules)) {
            const value = data[field]
            const fieldRules = ruleString.split('|')

            for (const rule of fieldRules) {
                const [ruleName, ruleValue] = rule.split(':')

                switch (ruleName) {
                    case 'required':
                        this.validateRequired(value, field)
                        break
                    case 'email':
                        if (value) this.validateEmail(value, field)
                        break
                    case 'min':
                        if (value) this.validateMinLength(value, parseInt(ruleValue), field)
                        break
                    case 'phone':
                        if (value) this.validatePhone(value, field)
                        break
                    case 'birth_date':
                        if (value) this.validateBirthDate(value, field)
                        break
                }
            }
        }

        return !this.hasErrors()
    }
}