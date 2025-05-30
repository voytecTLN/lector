export class FormValidator {
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    static validateRequired(value: any): boolean {
        return value !== null && value !== undefined && value !== ''
    }

    static validateMinLength(value: string, minLength: number): boolean {
        return value.length >= minLength
    }

    static validatePassword(password: string): boolean {
        return password.length >= 8
    }
}