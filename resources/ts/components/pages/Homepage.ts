// resources/ts/components/pages/Homepage.ts

import { authService } from '@services/AuthService'
import { authModal } from '@components/auth/AuthModal'

export class Homepage {
    private container: HTMLElement
    private mobileMenuBtn: HTMLElement | null = null
    private mobileMenu: HTMLElement | null = null
    private backToTopBtn: HTMLElement | null = null
    private header: HTMLElement | null = null
    private isMenuOpen = false

    constructor(container: HTMLElement) {
        this.container = container
        this.render()
        this.init()
    }

    private render(): void {
        this.container.innerHTML = this.getTemplate()
        this.setupElements()
        this.updateNavigationState()
    }

    private getTemplate(): string {
        const user = authService.getUser()
        const isAuthenticated = authService.isAuthenticated()

        return `
            <!-- Hero Section -->
            <section class="hero" id="home">
                <div class="container">
                    <div class="hero-content">
                        <h1 class="hero-title">Nauka języków online z najlepszymi lektorami</h1>
                        <p class="hero-subtitle">Personalizowane lekcje, elastyczny harmonogram, sprawdzone metody nauczania. Odkryj nowy sposób na naukę języków obcych.</p>
                        <div class="cta-buttons">
                            ${this.getHeroButtons(isAuthenticated, user)}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section class="features">
                <div class="container">
                    <h2 class="section-title">Dlaczego warto nas wybrać?</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-bullseye"></i>
                            </div>
                            <h3>Spersonalizowane lekcje</h3>
                            <p>Każda lekcja dostosowana do Twoich potrzeb i poziomu zaawansowania. Indywidualne podejście gwarantuje maksymalną efektywność nauki.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <h3>Elastyczny harmonogram</h3>
                            <p>Uczysz się kiedy chcesz - dostępność lektorów 7 dni w tygodniu. Dopasuj naukę do swojego trybu życia.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <h3>Doświadczeni lektorzy</h3>
                            <p>Wszystkich naszych lektorów łączy pasja do nauczania i wysokie kwalifikacje. Sprawdzone metody nauczania.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-laptop"></i>
                            </div>
                            <h3>Nowoczesna platforma</h3>
                            <p>Intuicyjna platforma z wszystkimi narzędziami potrzebnymi do nauki. Interaktywne materiały i zaawansowane funkcje.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-book"></i>
                            </div>
                            <h3>Materiały dydaktyczne</h3>
                            <p>Dostęp do bogatej biblioteki materiałów i ćwiczeń. Stale aktualizowane treści dostosowane do różnych poziomów.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <h3>Gwarancja jakości</h3>
                            <p>System ocen i opinii zapewnia najwyższą jakość nauczania. Monitorujemy postępy i dostosowujemy metody.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Lecturers Section -->
            <section class="lecturers" id="lecturers">
                <div class="container">
                    <h2 class="section-title">Poznaj naszych lektorów</h2>
                    <div class="lecturers-grid">
                        <div class="lecturer-card">
                            <div class="lecturer-avatar">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div class="lecturer-info">
                                <div class="lecturer-name">Anna Kowalska</div>
                                <div class="lecturer-languages">Angielski, Niemiecki</div>
                                <div class="lecturer-rating">
                                    <span class="stars">
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                    </span>
                                    <span class="rating-text">5.0 (124 opinii)</span>
                                </div>
                                <p class="lecturer-description">Specjalizuje się w języku biznesowym i przygotowaniu do egzaminów międzynarodowych.</p>
                            </div>
                        </div>
                        <div class="lecturer-card">
                            <div class="lecturer-avatar">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div class="lecturer-info">
                                <div class="lecturer-name">Piotr Novak</div>
                                <div class="lecturer-languages">Francuski, Hiszpański</div>
                                <div class="lecturer-rating">
                                    <span class="stars">
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                    </span>
                                    <span class="rating-text">4.9 (89 opinii)</span>
                                </div>
                                <p class="lecturer-description">Native speaker z długoletnim doświadczeniem w nauczaniu konwersacji.</p>
                            </div>
                        </div>
                        <div class="lecturer-card">
                            <div class="lecturer-avatar">
                                <i class="fas fa-user-friends"></i>
                            </div>
                            <div class="lecturer-info">
                                <div class="lecturer-name">Maria Silva</div>
                                <div class="lecturer-languages">Włoski, Portugalski</div>
                                <div class="lecturer-rating">
                                    <span class="stars">
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                    </span>
                                    <span class="rating-text">4.8 (76 opinii)</span>
                                </div>
                                <p class="lecturer-description">Specjalistka w zakresie gramatyki i nauki języków dla dzieci.</p>
                            </div>
                        </div>
                    </div>

                    ${this.getCallToActionSection(isAuthenticated, user)}
                </div>
            </section>

            <!-- About Section -->
            <section class="about" id="about">
                <div class="container">
                    <div class="row">
                        <div class="col-md-6">
                            <h2>O nas</h2>
                            <p>Jesteśmy platformą łączącą uczniów z najlepszymi lektorami języków obcych. Nasze rozwiązanie pozwala na skuteczną naukę z każdego miejsca na świecie.</p>
                            <p>Dzięki nowoczesnym technologiom i doświadczonym lektorom, zapewniamy najwyższą jakość nauczania dostosowaną do indywidualnych potrzeb każdego ucznia.</p>

                            ${!isAuthenticated ? this.getAboutCTASection() : ''}
                        </div>
                        <div class="col-md-6">
                            <h3>Kontakt</h3>
                            <div class="contact-info">
                                <p><i class="fas fa-envelope"></i> kontakt@platformalektorow.pl</p>
                                <p><i class="fas fa-phone"></i> +48 123 456 789</p>
                                <p><i class="fas fa-map-marker-alt"></i> Warszawa, ul. Przykładowa 123</p>
                            </div>
                            <h3>Dostępne języki</h3>
                            <div class="languages-list">
                                <span class="language-tag">Angielski</span>
                                <span class="language-tag">Niemiecki</span>
                                <span class="language-tag">Francuski</span>
                                <span class="language-tag">Hiszpański</span>
                                <span class="language-tag">Włoski</span>
                                <span class="language-tag">Portugalski</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `
    }

    private getHeroButtons(isAuthenticated: boolean, user: any): string {
        if (!isAuthenticated) {
            return `
                <button class="btn btn-primary register-btn">
                    <i class="fas fa-user-plus"></i>
                    Dołącz za darmo
                </button>
                <a href="#lecturers" class="btn btn-secondary">
                    <i class="fas fa-search"></i>
                    Zobacz lektorów
                </a>
            `
        }

        if (user?.role === 'student') {
            return `
                <button class="btn btn-primary" data-route="/student/tutors">
                    <i class="fas fa-search"></i>
                    Znajdź lektora
                </button>
                <button class="btn btn-secondary" data-route="/student/dashboard">
                    <i class="fas fa-tachometer-alt"></i>
                    Mój panel
                </button>
            `
        }

        if (user?.role === 'tutor') {
            return `
                <button class="btn btn-primary" data-route="/tutor/dashboard">
                    <i class="fas fa-tachometer-alt"></i>
                    Panel lektora
                </button>
                <button class="btn btn-secondary" data-route="/tutor/lessons">
                    <i class="fas fa-calendar"></i>
                    Moje lekcje
                </button>
            `
        }

        return `
            <button class="btn btn-primary" data-route="/${user?.role}/dashboard">
                <i class="fas fa-tachometer-alt"></i>
                Mój panel
            </button>
            <a href="#about" class="btn btn-secondary">
                <i class="fas fa-info-circle"></i>
                Dowiedz się więcej
            </a>
        `
    }

    private getCallToActionSection(isAuthenticated: boolean, user: any): string {
        if (!isAuthenticated) {
            return `
                <div class="login-note">
                    <div class="cta-content">
                        <i class="fas fa-rocket"></i>
                        <div class="cta-text">
                            <strong>Gotowy na rozpoczęcie przygody z językami?</strong>
                            <p>Dołącz do tysięcy zadowolonych użytkowników i zacznij naukę już dziś!</p>
                        </div>
                        <div class="cta-buttons-inline">
                            <button class="btn btn-primary register-btn">
                                <i class="fas fa-user-plus"></i>
                                Utwórz konto
                            </button>
                            <button class="btn btn-outline-primary login-btn">
                                <i class="fas fa-sign-in-alt"></i>
                                Mam już konto
                            </button>
                        </div>
                    </div>
                </div>
            `
        }

        return `
            <div class="login-note">
                <div class="welcome-message">
                    <i class="fas fa-heart"></i>
                    <div class="welcome-text">
                        <strong>Witaj ponownie, ${user?.name}!</strong>
                        <p>
                            ${this.getWelcomeMessage(user?.role)}
                        </p>
                    </div>
                    <div class="welcome-buttons">
                        ${this.getWelcomeButton(user?.role)}
                    </div>
                </div>
            </div>
        `
    }

    private getWelcomeMessage(role: string): string {
        switch (role) {
            case 'student':
                return 'Gotowy na kolejną lekcję? Sprawdź dostępnych lektorów lub zarządzaj swoimi lekcjami.'
            case 'tutor':
                return 'Sprawdź swój harmonogram i zarządzaj lekcjami ze swoimi studentami.'
            default:
                return `Witamy w panelu ${this.getRoleDisplayName(role)}.`
        }
    }

    private getWelcomeButton(role: string): string {
        if (role === 'student') {
            return `
                <button class="btn btn-primary" data-route="/student/dashboard">
                    <i class="fas fa-tachometer-alt"></i>
                    Mój panel
                </button>
            `
        }

        if (role === 'tutor') {
            return `
                <button class="btn btn-primary" data-route="/tutor/dashboard">
                    <i class="fas fa-chalkboard-teacher"></i>
                    Panel lektora
                </button>
            `
        }

        return `
            <button class="btn btn-primary" data-route="/${role}/dashboard">
                <i class="fas fa-tachometer-alt"></i>
                Przejdź do panelu
            </button>
        `
    }

    private getAboutCTASection(): string {
        return `
            <div class="about-cta">
                <h3>Rozpocznij swoją podróż językową</h3>
                <p>Dołącz do naszej społeczności i odkryj nowy sposób nauki języków. Rejestracja jest bezpłatna!</p>
                <button class="btn btn-gradient register-btn">
                    <i class="fas fa-rocket"></i>
                    Rozpocznij za darmo
                </button>
            </div>
        `
    }

    private getRoleDisplayName(role: string): string {
        const roleNames = {
            'admin': 'Administrator',
            'moderator': 'Moderator',
            'tutor': 'Lektor',
            'student': 'Student'
        }
        return roleNames[role as keyof typeof roleNames] || role
    }

    private setupElements(): void {
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn')
        this.mobileMenu = document.querySelector('.mobile-menu')
        this.backToTopBtn = document.querySelector('.back-to-top')
        this.header = document.querySelector('.header')
    }

    private init(): void {
        this.setupEventListeners()
        this.setupScrollAnimations()
        this.setupSmoothScrolling()
        this.setupBackToTop()
        this.setupHeaderScroll()
    }

    private setupEventListeners(): void {
        // Login/Register buttons
        this.container.querySelectorAll('.login-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                authModal.show('login')
            })
        })

        this.container.querySelectorAll('.register-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                authModal.show('register')
            })
        })

        // Navigation buttons with data-route
        this.container.querySelectorAll('[data-route]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault()
                const route = (e.currentTarget as HTMLElement).getAttribute('data-route')
                if (route) {
                    window.router.navigate(route)
                }
            })
        })

        // Mobile menu toggle
        this.mobileMenuBtn?.addEventListener('click', () => {
            this.toggleMobileMenu()
        })

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen &&
                !this.mobileMenu?.contains(e.target as Node) &&
                !this.mobileMenuBtn?.contains(e.target as Node)) {
                this.closeMobileMenu()
            }
        })

        // Back to top button
        this.backToTopBtn?.addEventListener('click', () => {
            this.scrollToTop()
        })

        // Scroll events
        window.addEventListener('scroll', () => {
            this.handleScroll()
        })

        // Resize event
        window.addEventListener('resize', () => {
            this.handleResize()
        })
    }

    private updateNavigationState(): void {
        // This will be handled by the main layout navigation
        document.dispatchEvent(new CustomEvent('page:changed', {
            detail: { page: 'homepage' }
        }))
    }

    private toggleMobileMenu(): void {
        if (this.isMenuOpen) {
            this.closeMobileMenu()
        } else {
            this.openMobileMenu()
        }
    }

    private openMobileMenu(): void {
        this.mobileMenu?.classList.add('active')
        this.mobileMenuBtn?.querySelector('i')?.classList.replace('fa-bars', 'fa-times')
        this.isMenuOpen = true
        document.body.style.overflow = 'hidden'
    }

    private closeMobileMenu(): void {
        this.mobileMenu?.classList.remove('active')
        this.mobileMenuBtn?.querySelector('i')?.classList.replace('fa-times', 'fa-bars')
        this.isMenuOpen = false
        document.body.style.overflow = ''
    }

    private setupSmoothScrolling(): void {
        // Smooth scroll for anchor links
        this.container.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault()
                const targetId = (anchor as HTMLAnchorElement).getAttribute('href')?.substring(1)
                if (targetId) {
                    const targetElement = document.getElementById(targetId)
                    if (targetElement) {
                        const headerHeight = this.header?.offsetHeight || 0
                        const targetPosition = targetElement.offsetTop - headerHeight - 20

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        })
                    }
                }
            })
        })
    }

    private setupBackToTop(): void {
        const toggleBackToTop = () => {
            if (window.scrollY > 300) {
                this.backToTopBtn?.classList.add('visible')
            } else {
                this.backToTopBtn?.classList.remove('visible')
            }
        }

        window.addEventListener('scroll', toggleBackToTop)
        toggleBackToTop()
    }

    private scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    private setupHeaderScroll(): void {
        let lastScrollY = window.scrollY

        const handleHeaderScroll = () => {
            const currentScrollY = window.scrollY

            if (currentScrollY > 50) {
                this.header?.classList.add('scrolled')
            } else {
                this.header?.classList.remove('scrolled')
            }

            lastScrollY = currentScrollY
        }

        window.addEventListener('scroll', handleHeaderScroll)
        handleHeaderScroll()
    }

    private setupScrollAnimations(): void {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate')
                }
            })
        }, observerOptions)

        // Observe all elements with aos class
        this.container.querySelectorAll('.aos').forEach(el => {
            observer.observe(el)
        })

        // Observe feature cards and lecturer cards for staggered animation
        this.container.querySelectorAll('.feature-card').forEach((card, index) => {
            card.classList.add('aos');
            (card as HTMLElement).style.animationDelay = `${(index + 1) * 0.1}s`
            observer.observe(card)
        })

        this.container.querySelectorAll('.lecturer-card').forEach((card, index) => {
            card.classList.add('aos');
            (card as HTMLElement).style.animationDelay = `${(index + 1) * 0.1}s`
            observer.observe(card)
        })
    }

    private handleScroll(): void {
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight

        // Parallax effect for hero background
        const hero = this.container.querySelector('.hero') as HTMLElement
        if (hero) {
            const parallaxSpeed = 0.5
            hero.style.transform = `translateY(${scrollY * parallaxSpeed}px)`
        }

        this.updateScrollProgress()
    }

    private updateScrollProgress(): void {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollPercent = (scrollTop / docHeight) * 100

        const progressBars = document.querySelectorAll('.scroll-progress')
        progressBars.forEach(bar => {
            (bar as HTMLElement).style.width = `${scrollPercent}%`
        })
    }

    private handleResize(): void {
        if (window.innerWidth >= 768 && this.isMenuOpen) {
            this.closeMobileMenu()
        }

        this.setupSmoothScrolling()
    }

    // Public methods
    public showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
        const container = document.getElementById('notification-container')
        if (!container) return

        const notification = document.createElement('div')
        notification.className = `notification-toast ${type}`
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="ml-auto text-lg opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `

        container.appendChild(notification)

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove()
        }, 5000)
    }

    private getNotificationIcon(type: string): string {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        }
        return icons[type as keyof typeof icons] || icons.info
    }

    public destroy(): void {
        // Cleanup event listeners and observers
        window.removeEventListener('scroll', this.handleScroll)
        window.removeEventListener('resize', this.handleResize)
    }
}