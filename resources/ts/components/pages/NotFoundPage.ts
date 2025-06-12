// resources/ts/components/pages/NotFoundPage.ts
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
                            <a href="/tutors" data-navigate class="suggestion-card">
                                <div class="suggestion-icon">👨‍🏫</div>
                                <div class="suggestion-content">
                                    <h4>Lektorzy</h4>
                                    <p>Znajdź idealnego lektora</p>
                                </div>
                            </a>
                            <a href="/courses" data-navigate class="suggestion-card">
                                <div class="suggestion-icon">📚</div>
                                <div class="suggestion-content">
                                    <h4>Kursy</h4>
                                    <p>Przeglądaj dostępne kursy</p>
                                </div>
                            </a>
                            <a href="/help" data-navigate class="suggestion-card">
                                <div class="suggestion-icon">❓</div>
                                <div class="suggestion-content">
                                    <h4>Pomoc</h4>
                                    <p>Centrum wsparcia</p>
                                </div>
                            </a>
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

        // Suggestion cards hover
        const suggestionCards = this.container.querySelectorAll('.suggestion-card')
        suggestionCards.forEach(card => {
            card.addEventListener('mouseenter', this.handleCardHover.bind(this))
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
            // Navigate to search results
            window.location.href = `/search?q=${encodeURIComponent(query)}`
        }
    }

    private handleReport(): void {
        // Open report modal or navigate to contact
        const currentUrl = window.location.href
        const subject = encodeURIComponent('Zgłoszenie błędu 404')
        const body = encodeURIComponent(`Znalazłem błąd na stronie: ${currentUrl}\n\nOpis problemu:\n`)

        window.location.href = `/contact?subject=${subject}&body=${body}`
    }

    private handleCardHover(event: Event): void {
        const card = event.currentTarget as HTMLElement
        card.classList.add('hovered')
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
        // TODO: Implement analytics tracking for 404 errors
        console.log('404 Page viewed:', window.location.pathname)
    }
}