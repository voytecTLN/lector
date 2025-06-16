// resources/ts/components/pages/NotFoundPage.ts - POPRAWIONE
import type { RouteComponent } from '@/router/routes'

export class NotFoundPage implements RouteComponent {
    private container: HTMLElement | null = null

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'not-found-page'

        page.innerHTML = `
            <div class="not-found-container">
                <div class="not-found-content">
                    <!-- Error Animation -->
                    <div class="error-animation">
                        <div class="error-number">
                            <span class="digit">4</span>
                            <span class="digit bounce">0</span>
                            <span class="digit">4</span>
                        </div>
                        <div class="error-illustration">
                            <div class="floating-elements">
                                <span class="floating-element">📚</span>
                                <span class="floating-element">🎓</span>
                                <span class="floating-element">🌟</span>
                                <span class="floating-element">📝</span>
                            </div>
                        </div>
                    </div>

                    <!-- Error Message -->
                    <div class="error-message">
                        <h1 class="error-title">Ups! Strona nie została znaleziona</h1>
                        <p class="error-description">
                            Wygląda na to, że szukana strona nie istnieje lub została przeniesiona. 
                            Nie martw się - pomożemy Ci znaleźć to, czego szukasz!
                        </p>
                    </div>

                    <!-- Suggestions -->
                    <div class="error-suggestions">
                        <h3>Sprawdź te popularne strony:</h3>
                        <div class="suggestions-grid">
                            <a href="/" data-navigate class="suggestion-card">
                                <div class="suggestion-icon">🏠</div>
                                <div class="suggestion-content">
                                    <h4>Strona główna</h4>
                                    <p>Wróć na stronę główną</p>
                                </div>
                            </a>
                            <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                            <button class="suggestion-card suggestion-disabled" disabled>
                                <div class="suggestion-icon">👨‍🏫</div>
                                <div class="suggestion-content">
                                    <h4>Lektorzy</h4>
                                    <p>Znajdź idealnego lektora (Wkrótce)</p>
                                </div>
                            </button>
                            <button class="suggestion-card suggestion-disabled" disabled>
                                <div class="suggestion-icon">📚</div>
                                <div class="suggestion-content">
                                    <h4>Kursy</h4>
                                    <p>Przeglądaj dostępne kursy (Wkrótce)</p>
                                </div>
                            </button>
                            <button class="suggestion-card suggestion-disabled" disabled>
                                <div class="suggestion-icon">❓</div>
                                <div class="suggestion-content">
                                    <h4>Pomoc</h4>
                                    <p>Centrum wsparcia (Wkrótce)</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Search -->
                    <div class="error-search">
                        <h3>Lub spróbuj wyszukać:</h3>
                        <form class="search-form" id="search-form">
                            <div class="search-input-group">
                                <input 
                                    type="text" 
                                    placeholder="Czego szukasz?" 
                                    class="search-input"
                                    id="search-input"
                                >
                                <button type="submit" class="search-btn">
                                    <span class="search-icon">🔍</span>
                                    Szukaj
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Actions -->
                    <div class="error-actions">
                        <button class="btn btn-primary" id="go-back-btn">
                            ← Wróć do poprzedniej strony
                        </button>
                        <a href="/" data-navigate class="btn btn-outline-primary">
                            🏠 Strona główna
                        </a>
                    </div>

                    <!-- Report -->
                    <div class="error-report">
                        <p class="report-text">
                            Myślisz, że to błąd? 
                            <button class="report-link" id="report-btn">Zgłoś problem</button>
                        </p>
                    </div>
                </div>

                <!-- Background Elements -->
                <div class="background-elements">
                    <div class="bg-element bg-element-1"></div>
                    <div class="bg-element bg-element-2"></div>
                    <div class="bg-element bg-element-3"></div>
                </div>
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initAnimations()
        console.log('✅ NotFoundPage mounted')
    }

    unmount(): void {
        console.log('👋 NotFoundPage unmounted')
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Go back button
        const goBackBtn = this.container.querySelector('#go-back-btn')
        goBackBtn?.addEventListener('click', this.handleGoBack.bind(this))

        // Search form
        const searchForm = this.container.querySelector('#search-form')
        searchForm?.addEventListener('submit', this.handleSearch.bind(this))

        // Report button
        const reportBtn = this.container.querySelector('#report-btn')
        reportBtn?.addEventListener('click', this.handleReport.bind(this))

        // Suggestion cards hover - tylko dla działających
        const suggestionCards = this.container.querySelectorAll('.suggestion-card:not(.suggestion-disabled)')
        suggestionCards.forEach(card => {
            card.addEventListener('mouseenter', this.handleCardHover.bind(this))
        })

        // POPRAWIONE - obsługa wyłączonych kart sugestii
        const disabledCards = this.container.querySelectorAll('.suggestion-disabled')
        disabledCards.forEach(card => {
            card.addEventListener('click', this.handleDisabledCardClick.bind(this))
        })
    }

    private initAnimations(): void {
        // Add entrance animations
        const content = this.container?.querySelector('.not-found-content')
        content?.classList.add('fade-in-up')

        // Animate floating elements
        const floatingElements = this.container?.querySelectorAll('.floating-element')
        floatingElements?.forEach((element, index) => {
            element.classList.add('animate-float')
            ;(element as HTMLElement).style.animationDelay = `${index * 0.5}s`
        })

        // Animate background elements
        const bgElements = this.container?.querySelectorAll('.bg-element')
        bgElements?.forEach((element, index) => {
            element.classList.add('animate-float')
            ;(element as HTMLElement).style.animationDelay = `${index * 1}s`
        })
    }

    private handleGoBack(): void {
        if (window.history.length > 1) {
            window.history.back()
        } else {
            // Fallback to home page
            window.location.href = '/'
        }
    }

    private handleSearch(event: Event): void {
        event.preventDefault()
        const form = event.target as HTMLFormElement
        const input = form.querySelector('#search-input') as HTMLInputElement
        const query = input.value.trim()

        if (query) {
            // POPRAWIONE - pokazuj powiadomienie zamiast nawigacji do nieistniejącej strony
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'info',
                    message: `Wyszukiwarka dla "${query}" będzie dostępna wkrótce!`,
                    duration: 4000
                }
            }))

            // Clear input
            input.value = ''
        }
    }

    private handleReport(): void {
        // POPRAWIONE - pokazuj powiadomienie zamiast nawigacji do contact
        const currentUrl = window.location.href

        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: 'Formularz zgłaszania problemów będzie dostępny wkrótce. Problem zostanie zarejestrowany automatycznie.',
                duration: 5000
            }
        }))

        // Log error for debugging
        console.log('404 Error reported:', {
            url: currentUrl,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        })
    }

    private handleCardHover(event: Event): void {
        const card = event.currentTarget as HTMLElement
        card.classList.add('hovered')
    }

    private handleDisabledCardClick(event: Event): void {
        event.preventDefault()
        const card = event.currentTarget as HTMLElement
        const title = card.querySelector('h4')?.textContent || 'Ta funkcja'

        // Show notification about coming soon feature
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${title} będzie dostępna wkrótce!`,
                duration: 3000
            }
        }))

        // Visual feedback
        card.classList.add('clicked')
        setTimeout(() => {
            card.classList.remove('clicked')
        }, 200)
    }

    onBeforeEnter(): boolean {
        return true
    }

    onAfterEnter(): void {
        // Update page title
        document.title = 'Strona nie znaleziona - Platforma Lektorów'

        // Track 404 error
        this.track404Error()
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        // Cleanup
    }

    private track404Error(): void {
        // POPRAWIONE - uproszczone logowanie błędów 404
        console.log('404 Page viewed:', {
            path: window.location.pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        })
    }
}