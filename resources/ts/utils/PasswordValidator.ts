// resources/ts/utils/PasswordValidator.ts

export interface PasswordValidationOptions {
    isEditMode?: boolean;
    passwordFieldName?: string;
    confirmFieldName?: string;
    confirmMessage?: string;
    mismatchMessage?: string;
}

export class PasswordValidator {
    private form: HTMLFormElement;
    private options: Required<PasswordValidationOptions>;
    private passwordInput: HTMLInputElement | null = null;
    private confirmInput: HTMLInputElement | null = null;

    constructor(form: HTMLFormElement, options: PasswordValidationOptions = {}) {
        this.form = form;
        this.options = {
            isEditMode: false,
            passwordFieldName: 'password',
            confirmFieldName: 'password_confirmation',
            confirmMessage: 'Potwierdź hasło',
            mismatchMessage: 'Hasła muszą być identyczne',
            ...options
        };

        this.initialize();
    }

    private initialize(): void {
        this.passwordInput = this.form.querySelector(`[name="${this.options.passwordFieldName}"]`) as HTMLInputElement;
        this.confirmInput = this.form.querySelector(`[name="${this.options.confirmFieldName}"]`) as HTMLInputElement;

        if (this.passwordInput && this.confirmInput) {
            this.setupValidation();
        }
    }

    private setupValidation(): void {
        const validatePasswords = () => {
            this.validatePasswordMatch();
        };

        this.passwordInput?.addEventListener('input', validatePasswords);
        this.confirmInput?.addEventListener('input', validatePasswords);
    }

    private validatePasswordMatch(): void {
        if (!this.passwordInput || !this.confirmInput) return;

        const password = this.passwordInput.value;
        const confirm = this.confirmInput.value;

        if (this.options.isEditMode && !password && !confirm) {
            // In edit mode, empty passwords are valid (no change)
            this.confirmInput.setCustomValidity('');
            return;
        }

        if (password && !confirm) {
            this.confirmInput.setCustomValidity(this.options.confirmMessage);
        } else if (password !== confirm) {
            this.confirmInput.setCustomValidity(this.options.mismatchMessage);
        } else {
            this.confirmInput.setCustomValidity('');
        }
    }

    /**
     * Check if passwords are valid
     */
    public isValid(): boolean {
        this.validatePasswordMatch();
        return this.confirmInput?.checkValidity() ?? true;
    }

    /**
     * Get password value (empty string if not set)
     */
    public getPassword(): string {
        return this.passwordInput?.value || '';
    }

    /**
     * Get confirmation value (empty string if not set)
     */
    public getConfirmation(): string {
        return this.confirmInput?.value || '';
    }

    /**
     * Check if password should be updated (has value in create mode, or has value in edit mode)
     */
    public shouldUpdatePassword(): boolean {
        const password = this.getPassword();
        
        if (this.options.isEditMode) {
            // In edit mode, only update if password is provided
            return password.length > 0;
        } else {
            // In create mode, password is always required
            return true;
        }
    }

    /**
     * Clear password fields
     */
    public clearFields(): void {
        if (this.passwordInput) this.passwordInput.value = '';
        if (this.confirmInput) this.confirmInput.value = '';
        this.validatePasswordMatch();
    }

    /**
     * Destroy the validator and remove event listeners
     */
    public destroy(): void {
        const validatePasswords = () => {
            this.validatePasswordMatch();
        };

        this.passwordInput?.removeEventListener('input', validatePasswords);
        this.confirmInput?.removeEventListener('input', validatePasswords);
    }

    /**
     * Static method for simple password validation
     */
    static validate(password: string, confirmation: string): boolean {
        return password === confirmation;
    }

    /**
     * Static method to get validation message
     */
    static getValidationMessage(password: string, confirmation: string, isEditMode: boolean = false): string | null {
        if (isEditMode && !password && !confirmation) {
            return null; // No change in edit mode
        }

        if (password && !confirmation) {
            return 'Potwierdź hasło';
        }

        if (password !== confirmation) {
            return 'Hasła muszą być identyczne';
        }

        return null;
    }
}