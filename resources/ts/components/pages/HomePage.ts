// resources/ts/components/pages/HomePage.ts
import type { RouteComponent } from '@/router/routes'

export class HomePage implements RouteComponent {
    private container: HTMLElement | null = null

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'home-page'

        page.innerHTML = `
            <!-- Hero Section -->
            <section class="hero">
                <div class="hero-background">
                    <div class="hero-gradient"></div>
                    <div class="hero-pattern"></div>
                </div>
                <div class="container">
                    <div class="hero-content">
                        <div class="hero-text">
                            <h1 class="hero-title fade-in">
                                Naucz się języków z najlepszymi lektorami
                            </h1>
                            <p class="hero-subtitle fade-in-up">
                                Dołącz do ponad 50,000 studentów, którzy już osiągnęli swoje cele językowe. 
                                Personalizowane lekcje 1-na-1 z wykwalifikowanymi native speakerami.
                            </p>
                            <div class="cta-buttons fade-in-up">
                                <a href="/register?role=student" data-navigate class="btn btn-primary btn-lg">
                                    <span class="btn-icon">🎓</span>
                                    Rozpocznij naukę
                                </a>
                                <a href="/register?role=tutor" data-navigate class="btn btn-secondary btn-lg">
                                    <span class="btn-icon">👨‍🏫</span>
                                    Zostań lektorem
                                </a>
                            </div>
                            <div class="hero-stats fade-in-up">
                                <div class="stat-item">
                                    <span class="stat-number">50,000+</span>
                                    <span class="stat-label">Aktywnych studentów</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">2,500+</span>
                                    <span class="stat-label">Wykwalifikowanych lektorów</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">15+</span>
                                    <span class="stat-label">Języków do wyboru</span>
                                </div>
                            </div>
                        </div>
                        <div class="hero-visual">
                            <div class="hero-image-placeholder">
                                <div class="floating-card card-1">
                                    <div class="card-content">
                                        <span class="card-flag">🇬🇧</span>
                                        <span class="card-text">English</span>
                                        <span class="card-level">B2 → C1</span>
                                    </div>
                                </div>
                                <div class="floating-card card-2">
                                    <div class="card-content">
                                        <span class="card-flag">🇩🇪</span>
                                        <span class="card-text">Deutsch</span>
                                        <span class="card-level">A1 → B1</span>
                                    </div>
                                </div>
                                <div class="floating-card card-3">
                                    <div class="card-content">
                                        <span class="card-flag">🇫🇷</span>
                                        <span class="card-text">Français</span>
                                        <span class="card-level">A2 → B2</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section class="features">
                <div class="container">
                    <div class="section-header">
                        <h2 class="section-title">Dlaczego wybierają nas?</h2>
                        <p class="section-subtitle">Odkryj, co czyni naszą platformę wyjątkową</p>
                    </div>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <h3>Personalizowane lekcje</h3>
                            <p>Każda lekcja dostosowana do Twoich potrzeb, poziomu i celów językowych.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">👨‍🏫</div>
                            <h3>Wykwalifikowani lektorzy</h3>
                            <p>Native speakerzy z certyfikatami i wieloletnim doświadczeniem w nauczaniu.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📱</div>
                            <h3>Nauka online 24/7</h3>
                            <p>Ucz się kiedy chcesz, gdzie chcesz. Nasza platforma jest dostępna zawsze.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📈</div>
                            <h3>Śledzenie postępów</h3>
                            <p>Monitoruj swoje postępy i osiągnięcia w czasie rzeczywistym.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💡</div>
                            <h3>Interaktywne materiały</h3>
                            <p>Nowoczesne narzędzia i materiały do nauki, które przyspieszają proces.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🏆</div>
                            <h3>Gwarancja rezultatów</h3>
                            <p>Nie jesteś zadowolony? Zwrócimy Ci pieniądze w ciągu 30 dni.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Languages Section -->
            <section class="languages">
                <div class="container">
                    <div class="section-header">
                        <h2 class="section-title">Wybierz swój język</h2>
                        <p class="section-subtitle">Oferujemy kursy w najpopularniejszych językach świata</p>
                    </div>
                    <div class="languages-grid">
                        <div class="language-card" data-language="english">
                            <div class="language-flag">🇬🇧</div>
                            <h3>Angielski</h3>
                            <p>Najbardziej popularny język na świecie</p>
                            <div class="language-stats">
                                <span>2,100+ lektorów</span>
                                <span>od 50 zł/h</span>
                            </div>
                        </div>
                        <div class="language-card" data-language="german">
                            <div class="language-flag">🇩🇪</div>
                            <h3>Niemiecki</h3>
                            <p>Język biznesu w Europie</p>
                            <div class="language-stats">
                                <span>450+ lektorów</span>
                                <span>od 60 zł/h</span>
                            </div>
                        </div>
                        <div class="language-card" data-language="french">
                            <div class="language-flag">🇫🇷</div>
                            <h3>Francuski</h3>
                            <p>Język kultury i dyplomacji</p>
                            <div class="language-stats">
                                <span>380+ lektorów</span>
                                <span>od 55 zł/h</span>
                            </div>
                        </div>
                        <div class="language-card" data-language="spanish">
                            <div class="language-flag">🇪🇸</div>
                            <h3>Hiszpański</h3>
                            <p>Drugi najczęściej używany język</p>
                            <div class="language-stats">
                                <span>520+ lektorów</span>
                                <span>od 45 zł/h</span>
                            </div>
                        </div>
                        <div class="language-card" data-language="italian">
                            <div class="language-flag">🇮🇹</div>
                            <h3>Włoski</h3>
                            <p>Język sztuki i muzyki</p>
                            <div class="language-stats">
                                <span>210+ lektorów</span>
                                <span>od 50 zł/h</span>
                            </div>
                        </div>
                        <div class="language-card" data-language="more">
                            <div class="language-flag">🌍</div>
                            <h3>Więcej języków</h3>
                            <p>Portugalski, rosyjski, chiński...</p>
                            <div class="language-stats">
                                <span>800+ lektorów</span>
                                <span>od 40 zł/h</span>
                            </div>
                        </div>
                    </div>
                    <div class="languages-cta">
                        <a href="/languages" data-navigate class="btn btn-outline-primary">
                            Zobacz wszystkie języki
                        </a>
                    </div>
                </div>
            </section>

            <!-- Testimonials Section -->
            <section class="testimonials">
                <div class="container">
                    <div class="section-header">
                        <h2 class="section-title">Co mówią nasi studenci?</h2>
                        <p class="section-subtitle">Prawdziwe opinie od zadowolonych uczniów</p>
                    </div>
                    <div class="testimonials-grid">
                        <div class="testimonial-card">
                            <div class="testimonial-content">
                                <div class="testimonial-text">
                                    "Dzięki platformie w 6 miesięcy przeszłam z poziomu A2 na B2 w angielskim. 
                                    Lektorzy są niesamowici!"
                                </div>
                                <div class="testimonial-author">
                                    <div class="author-avatar">AM</div>
                                    <div class="author-info">
                                        <div class="author-name">Anna Makowska</div>
                                        <div class="author-details">Studentka, Warszawa</div>
                                    </div>
                                </div>
                            </div>
                            <div class="testimonial-rating">⭐⭐⭐⭐⭐</div>
                        </div>
                        <div class="testimonial-card">
                            <div class="testimonial-content">
                                <div class="testimonial-text">
                                    "Jako lektor doceniam profesjonalizm platformy. Moi studenci są bardzo zadowoleni 
                                    z postępów."
                                </div>
                                <div class="testimonial-author">
                                    <div class="author-avatar">MK</div>
                                    <div class="author-info">
                                        <div class="author-name">Michał Kowalski</div>
                                        <div class="author-details">Lektor niemieckiego</div>
                                    </div>
                                </div>
                            </div>
                            <div class="testimonial-rating">⭐⭐⭐⭐⭐</div>
                        </div>
                        <div class="testimonial-card">
                            <div class="testimonial-content">
                                <div class="testimonial-text">
                                    "Najlepsza inwestycja w moją karierę. Dzięki nauce francuskiego dostałam pracę 
                                    w międzynarodowej firmie."
                                </div>
                                <div class="testimonial-author">
                                    <div class="author-avatar">KN</div>
                                    <div class="author-info">
                                        <div class="author-name">Katarzyna Nowak</div>
                                        <div class="author-details">Marketing Manager</div>
                                    </div>
                                </div>
                            </div>
                            <div class="testimonial-rating">⭐⭐⭐⭐⭐</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CTA Section -->
            <section class="cta-section">
                <div class="container">
                    <div class="cta-content">
                        <h2>Gotowy, żeby rozpocząć swoją językową przygodę?</h2>
                        <p>Zapisz się już dziś i otrzymaj pierwszą lekcję za darmo!</p>
                        <div class="cta-buttons">
                            <a href="/register?role=student" data-navigate class="btn btn-primary btn-lg">
                                Rozpocznij za darmo
                            </a>
                            <a href="/demo" data-navigate class="btn btn-outline-white btn-lg">
                                Zobacz demo
                            </a>
                        </div>
                        <div class="cta-features">
                            <div class="cta-feature">
                                <span class="feature-icon">✓</span>
                                <span>Bez zobowiązań</span>
                            </div>
                            <div class="cta-feature">
                                <span class="feature-icon">✓</span>
                                <span>Anuluj kiedy chcesz</span>
                            </div>
                            <div class="cta-feature">
                                <span class="feature-icon">✓</span>
                                <span>Pierwsza lekcja gratis</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initAnimations()
        console.log('✅ HomePage mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 HomePage unmounted')
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Language card clicks
        const languageCards = this.container.querySelectorAll('.language-card')
        languageCards.forEach(card => {
            card.addEventListener('click', this.handleLanguageCardClick.bind(this))
        })

        // Feature card hover effects
        const featureCards = this.container.querySelectorAll('.feature-card')
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', this.handleCardHover.bind(this))
        })

        // Scroll animations
        this.initScrollAnimations()
    }

    private handleLanguageCardClick(event: Event): void {
        const card = event.currentTarget as HTMLElement
        const language = card.getAttribute('data-language')

        if (language && language !== 'more') {
            // Navigate to language-specific page
            window.dispatchEvent(new CustomEvent('navigate', {
                detail: { path: `/languages/${language}` }
            }))
        } else if (language === 'more') {
            // Navigate to all languages page
            window.dispatchEvent(new CustomEvent('navigate', {
                detail: { path: '/languages' }
            }))
        }
    }

    private handleCardHover(event: Event): void {
        const card = event.currentTarget as HTMLElement
        card.classList.add('hovered')

        setTimeout(() => {
            card.classList.remove('hovered')
        }, 300)
    }

    private initAnimations(): void {
        // Add entrance animations to elements
        const animatedElements = this.container?.querySelectorAll('.fade-in, .fade-in-up')
        animatedElements?.forEach((element, index) => {
            element.classList.add('stagger-' + (index % 6 + 1))
        })

        // Floating cards animation
        const floatingCards = this.container?.querySelectorAll('.floating-card')
        floatingCards?.forEach(card => {
            card.classList.add('animate-float')
        })
    }

    private initScrollAnimations(): void {
        if (!('IntersectionObserver' in window)) return

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in')
                }
            })
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        })

        // Observe sections for scroll animations
        const sections = this.container?.querySelectorAll('section')
        sections?.forEach(section => observer.observe(section))

        // Observe cards for stagger animations
        const cards = this.container?.querySelectorAll('.feature-card, .language-card, .testimonial-card')
        cards?.forEach(card => observer.observe(card))
    }

    private cleanup(): void {
        // Cleanup any intervals or timeouts if needed
    }

    onBeforeEnter(): boolean {
        return true
    }

    onAfterEnter(): void {
        // Update page title
        document.title = 'Platforma Lektorów - Nauka języków online z najlepszymi lektorami'

        // Track page view
        this.trackPageView()
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        // Cleanup
    }

    private trackPageView(): void {
        // TODO: Implement analytics tracking
        console.log('HomePage viewed')
    }
}