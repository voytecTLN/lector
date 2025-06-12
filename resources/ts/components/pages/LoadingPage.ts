// resources/ts/components/pages/LoadingPage.ts
import type { RouteComponent } from '@/router/routes'

export class LoadingPage implements RouteComponent {
    private container: HTMLElement | null = null
    private message: string
    private timeout: number | null = null
    private progressInterval: number | null = null
    private currentProgress: number = 0

    constructor(message: string = 'Ładowanie...') {
        this.message = message
    }

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'loading-page'

        page.innerHTML = `
            <div class="loading-container">
                <div class="loading-content">
                    <!-- Logo -->
                    <div class="loading-logo">
                        <span class="logo-icon">🎓</span>
                        <span class="logo-text">Platforma Lektorów</span>
                    </div>

                    <!-- Main Spinner -->
                    <div class="loading-spinner-main">
                        <div class="spinner-container">
                            <div class="spinner-ring ring-1"></div>
                            <div class="spinner-ring ring-2"></div>
                            <div class="spinner-ring ring-3"></div>
                            <div class="spinner-center">
                                <span class="spinner-icon">📚</span>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="loading-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text" id="progress-text">0%</div>
                    </div>

                    <!-- Loading Message -->
                    <div class="loading-message">
                        <h2 class="message-title" id="message-title">${this.message}</h2>
                        <p class="message-subtitle" id="message-subtitle">Przygotowujemy wszystko dla Ciebie...</p>
                    </div>

                    <!-- Loading Steps -->
                    <div class="loading-steps">
                        <div class="step-item active" data-step="1">
                            <div class="step-icon">🔧</div>
                            <div class="step-text">Inicjalizacja</div>
                        </div>
                        <div class="step-item" data-step="2">
                            <div class="step-icon">🔐</div>
                            <div class="step-text">Autoryzacja</div>
                        </div>
                        <div class="step-item" data-step="3">
                            <div class="step-icon">📊</div>
                            <div class="step-text">Ładowanie danych</div>
                        </div>
                        <div class="step-item" data-step="4">
                            <div class="step-icon">✨</div>
                            <div class="step-text">Finalizacja</div>
                        </div>
                    </div>

                    <!-- Tips -->
                    <div class="loading-tips">
                        <div class="tip-container" id="tip-container">
                            <div class="tip-icon">💡</div>
                            <div class="tip-text" id="tip-text">Czy wiesz, że regularność jest kluczem do sukcesu w nauce języków?</div>
                        </div>
                    </div>
                </div>

                <!-- Background Animation -->
                <div class="loading-background">
                    <div class="bg-circle circle-1"></div>
                    <div class="bg-circle circle-2"></div>
                    <div class="bg-circle circle-3"></div>
                    <div class="bg-circle circle-4"></div>
                </div>
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initAnimations()
        this.startProgress()
        this.startTipRotation()
        console.log('✅ LoadingPage mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 LoadingPage unmounted')
    }

    private initAnimations(): void {
        // Add entrance animations
        const content = this.container?.querySelector('.loading-content')
        content?.classList.add('fade-in')

        // Start spinner animations
        const rings = this.container?.querySelectorAll('.spinner-ring')
        rings?.forEach((ring, index) => {
            ring.classList.add('animate-spin')
            ;(ring as HTMLElement).style.animationDelay = `${index * 0.2}s`
        })

        // Animate background circles
        const circles = this.container?.querySelectorAll('.bg-circle')
        circles?.forEach((circle, index) => {
            circle.classList.add('animate-float')
            ;(circle as HTMLElement).style.animationDelay = `${index * 0.5}s`
        })
    }

    private startProgress(): void {
        this.currentProgress = 0
        this.progressInterval = window.setInterval(() => {
            this.updateProgress()
        }, 100)

        // Auto-complete after timeout
        this.timeout = window.setTimeout(() => {
            this.completeProgress()
        }, 8000)
    }

    private updateProgress(): void {
        if (this.currentProgress < 90) {
            // Simulate realistic loading with varying speed
            const increment = Math.random() * 3 + 0.5
            this.currentProgress = Math.min(90, this.currentProgress + increment)
        }

        const progressFill = this.container?.querySelector('#progress-fill') as HTMLElement
        const progressText = this.container?.querySelector('#progress-text') as HTMLElement

        if (progressFill && progressText) {
            progressFill.style.width = `${this.currentProgress}%`
            progressText.textContent = `${Math.round(this.currentProgress)}%`
        }

        // Update steps based on progress
        this.updateSteps()
    }

    private updateSteps(): void {
        const steps = this.container?.querySelectorAll('.step-item')
        if (!steps) return

        steps.forEach((step, index) => {
            const stepNumber = index + 1
            const stepProgress = (stepNumber - 1) * 25

            if (this.currentProgress >= stepProgress) {
                step.classList.add('active')
                if (this.currentProgress >= stepProgress + 25) {
                    step.classList.add('completed')
                }
            }
        })
    }

    private completeProgress(): void {
        this.currentProgress = 100

        const progressFill = this.container?.querySelector('#progress-fill') as HTMLElement
        const progressText = this.container?.querySelector('#progress-text') as HTMLElement

        if (progressFill && progressText) {
            progressFill.style.width = '100%'
            progressText.textContent = '100%'
        }

        // Complete all steps
        const steps = this.container?.querySelectorAll('.step-item')
        steps?.forEach(step => {
            step.classList.add('active', 'completed')
        })

        // Update message
        this.updateMessage('Gotowe!', 'Przekierowywanie...')
    }

    private startTipRotation(): void {
        const tips = [
            'Czy wiesz, że regularność jest kluczem do sukcesu w nauce języków?',
            'Najlepiej uczyć się nowych słów w kontekście, a nie w izolacji.',
            'Słuchanie muzyki w języku obcym to świetny sposób na naukę wymowy.',
            'Prowadzenie dziennika w języku obcym pomaga w zapamiętywaniu.',
            'Oglądanie filmów z napisami w docelowym języku przyspiesza naukę.',
            'Mówienie na głos, nawet do siebie, poprawia płynność wypowiedzi.',
            'Nauka 15 minut dziennie jest lepsza niż 2 godziny raz w tygodniu.',
            'Błędy to naturalna część procesu nauki - nie bój się ich popełniać!'
        ]

        let currentTipIndex = 0

        const rotateTips = () => {
            const tipText = this.container?.querySelector('#tip-text')
            if (tipText) {
                tipText.classList.add('fade-out')

                setTimeout(() => {
                    currentTipIndex = (currentTipIndex + 1) % tips.length
                    tipText.textContent = tips[currentTipIndex]
                    tipText.classList.remove('fade-out')
                    tipText.classList.add('fade-in')

                    setTimeout(() => {
                        tipText.classList.remove('fade-in')
                    }, 500)
                }, 250)
            }
        }

        // Rotate tips every 3 seconds
        setInterval(rotateTips, 3000)
    }

    private cleanup(): void {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }

        if (this.progressInterval) {
            clearInterval(this.progressInterval)
            this.progressInterval = null
        }
    }

    // Public methods for controlling loading state
    public updateMessage(title: string, subtitle?: string): void {
        const titleElement = this.container?.querySelector('#message-title')
        const subtitleElement = this.container?.querySelector('#message-subtitle')

        if (titleElement) {
            titleElement.textContent = title
        }

        if (subtitleElement && subtitle) {
            subtitleElement.textContent = subtitle
        }
    }

    public setProgress(progress: number): void {
        this.currentProgress = Math.max(0, Math.min(100, progress))

        const progressFill = this.container?.querySelector('#progress-fill') as HTMLElement
        const progressText = this.container?.querySelector('#progress-text') as HTMLElement

        if (progressFill && progressText) {
            progressFill.style.width = `${this.currentProgress}%`
            progressText.textContent = `${Math.round(this.currentProgress)}%`
        }

        this.updateSteps()
    }

    public showError(message: string): void {
        this.updateMessage('Wystąpił błąd', message)

        // Add error styling
        const container = this.container?.querySelector('.loading-container')
        container?.classList.add('error-state')

        // Stop progress
        this.cleanup()
    }

    public showSuccess(message: string = 'Załadowano pomyślnie!'): void {
        this.completeProgress()
        this.updateMessage('Sukces!', message)

        // Add success styling
        const container = this.container?.querySelector('.loading-container')
        container?.classList.add('success-state')
    }

    onBeforeEnter(): boolean {
        return true
    }

    onAfterEnter(): void {
        // Update page title
        document.title = 'Ładowanie... - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        this.cleanup()
    }
}