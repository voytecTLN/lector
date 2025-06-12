// resources/ts/components/common/LoadingSpinner.ts
import type { RouteComponent } from '@/router/routes'

export class LoadingSpinner implements RouteComponent {
    private container: HTMLElement | null = null
    private message: string
    private size: 'small' | 'medium' | 'large'

    constructor(message: string = 'Ładowanie...', size: 'small' | 'medium' | 'large' = 'medium') {
        this.message = message
        this.size = size
    }

    async render(): Promise<HTMLElement> {
        const spinner = document.createElement('div')
        spinner.className = `loading-spinner-component loading-${this.size}`

        spinner.innerHTML = `
            <div class="spinner-container">
                <div class="spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                ${this.message ? `<p class="spinner-message">${this.message}</p>` : ''}
            </div>
        `

        return spinner
    }

    mount(container: HTMLElement): void {
        this.container = container
        console.log('✅ LoadingSpinner mounted')
    }

    unmount(): void {
        console.log('👋 LoadingSpinner unmounted')
    }

    updateMessage(message: string): void {
        if (this.container) {
            const messageElement = this.container.querySelector('.spinner-message')
            if (messageElement) {
                messageElement.textContent = message
            }
        }
    }

    show(): void {
        if (this.container) {
            this.container.classList.remove('hidden')
        }
    }

    hide(): void {
        if (this.container) {
            this.container.classList.add('hidden')
        }
    }
}