// resources/ts/utils/LoadingStateManager.ts

export interface LoadingElements {
    loading?: string | HTMLElement | null;
    content?: string | HTMLElement | null;
    error?: string | HTMLElement | null;
}

export class LoadingStateManager {
    private container: HTMLElement;
    private elements: {
        loading: HTMLElement | null;
        content: HTMLElement | null;
        error: HTMLElement | null;
    };

    constructor(container: HTMLElement, elements: LoadingElements) {
        this.container = container;
        this.elements = {
            loading: this.getElement(elements.loading),
            content: this.getElement(elements.content),
            error: this.getElement(elements.error)
        };
    }

    private getElement(selector: string | HTMLElement | null | undefined): HTMLElement | null {
        if (!selector) return null;
        
        if (typeof selector === 'string') {
            return this.container.querySelector(selector);
        }
        
        return selector;
    }

    /**
     * Show loading state
     */
    showLoading(): void {
        this.hideAll();
        this.show(this.elements.loading);
    }

    /**
     * Show content state
     */
    showContent(): void {
        this.hideAll();
        this.show(this.elements.content);
    }

    /**
     * Show error state
     */
    showError(): void {
        this.hideAll();
        this.show(this.elements.error);
    }

    private hideAll(): void {
        this.hide(this.elements.loading);
        this.hide(this.elements.content);
        this.hide(this.elements.error);
    }

    private show(element: HTMLElement | null): void {
        if (element) {
            element.classList.remove('d-none');
            element.style.display = '';
        }
    }

    private hide(element: HTMLElement | null): void {
        if (element) {
            element.classList.add('d-none');
        }
    }

    /**
     * Set loading state with optional text
     */
    setLoading(show: boolean, text?: string): void {
        if (show) {
            if (text && this.elements.loading) {
                const textElement = this.elements.loading.querySelector('.loading-text, .admin-loading-text');
                if (textElement) {
                    textElement.textContent = text;
                }
            }
            this.showLoading();
        } else {
            this.showContent();
        }
    }

    /**
     * Set error state with optional message
     */
    setError(message?: string): void {
        if (message && this.elements.error) {
            const messageElement = this.elements.error.querySelector('.error-message');
            if (messageElement) {
                messageElement.textContent = message;
            } else {
                this.elements.error.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <span class="error-message">${message}</span>
                    </div>
                `;
            }
        }
        this.showError();
    }

    /**
     * Static method for simple loading state management
     */
    static simple(container: HTMLElement, loadingSelector: string, contentSelector: string): LoadingStateManager {
        return new LoadingStateManager(container, {
            loading: loadingSelector,
            content: contentSelector
        });
    }

    /**
     * Static method for form loading states
     */
    static forForm(form: HTMLFormElement, submitButton: HTMLButtonElement): {
        setLoading: (loading: boolean) => void;
        setDisabled: (disabled: boolean) => void;
    } {
        const originalText = submitButton.innerHTML;
        const spinnerHtml = '<span class="spinner-border spinner-border-sm me-1"></span>';

        return {
            setLoading: (loading: boolean) => {
                if (loading) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = `${spinnerHtml} Przetwarzanie...`;
                } else {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                }
            },
            setDisabled: (disabled: boolean) => {
                submitButton.disabled = disabled;
                if (!disabled) {
                    submitButton.innerHTML = originalText;
                }
            }
        };
    }

    /**
     * Static method for button loading states
     */
    static forButton(button: HTMLButtonElement, loadingText: string = 'Ładowanie...'): {
        setLoading: (loading: boolean) => void;
    } {
        const originalText = button.innerHTML;
        const spinnerHtml = '<span class="spinner-border spinner-border-sm me-1"></span>';

        return {
            setLoading: (loading: boolean) => {
                if (loading) {
                    button.disabled = true;
                    button.innerHTML = `${spinnerHtml} ${loadingText}`;
                } else {
                    button.disabled = false;
                    button.innerHTML = originalText;
                }
            }
        };
    }

    /**
     * Static method for table loading states
     */
    static forTable(container: HTMLElement, tableSelector: string = '.table-container', loadingSelector: string = '#loading'): LoadingStateManager {
        // Create loading element if it doesn't exist
        if (!container.querySelector(loadingSelector)) {
            const loadingHtml = `
                <div id="loading" class="text-center py-5 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie...</span>
                    </div>
                    <p class="mt-2 text-muted loading-text">Ładowanie danych...</p>
                </div>
            `;
            container.insertAdjacentHTML('afterbegin', loadingHtml);
        }

        return new LoadingStateManager(container, {
            loading: loadingSelector,
            content: tableSelector
        });
    }
}