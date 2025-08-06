// resources/ts/utils/FormValidationHandler.ts

export interface ValidationErrors {
    [field: string]: string[] | string;
}

export class FormValidationHandler {
    private form: HTMLFormElement | null;

    constructor(form: HTMLFormElement | null) {
        this.form = form;
        this.bindEventListener();
    }

    private bindEventListener(): void {
        if (!this.form) return;
        
        document.addEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener);
    }

    private handleValidationError(event: CustomEvent): void {
        const { errors } = event.detail;

        this.clearValidationErrors();
        this.displayValidationErrors(errors);
    }

    public clearValidationErrors(): void {
        if (!this.form) return;

        // Remove invalid classes
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });

        // Remove feedback elements
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    }

    public displayValidationErrors(errors: ValidationErrors): void {
        if (!this.form || !errors) return;

        for (const [field, messages] of Object.entries(errors)) {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (input) {
                this.markFieldAsInvalid(input as HTMLElement, messages);
            }
        }
    }

    private markFieldAsInvalid(input: HTMLElement, messages: string[] | string): void {
        input.classList.add('is-invalid');

        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = Array.isArray(messages) ? messages[0] : String(messages);

        input.parentElement?.appendChild(feedback);
    }

    public destroy(): void {
        document.removeEventListener('form:validationError', this.handleValidationError.bind(this) as EventListener);
    }

    // Static method for one-off validation without creating instance
    static displayErrors(form: HTMLFormElement, errors: ValidationErrors): void {
        const handler = new FormValidationHandler(form);
        handler.displayValidationErrors(errors);
        handler.destroy();
    }
}