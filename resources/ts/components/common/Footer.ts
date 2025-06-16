// resources/ts/components/common/Footer.ts - POPRAWIONE
import type { RouteComponent } from '@/router/routes'

export class Footer implements RouteComponent {
    private container: HTMLElement | null = null
    private currentYear: number = new Date().getFullYear()

    async render(): Promise<HTMLElement> {
        const footer = document.createElement('footer')
        footer.className = 'app-footer'

        footer.innerHTML = `
            <div class="footer-wrapper">
                <div class="container">
                    <!-- Main Footer Content -->
                    <div class="footer-main">
                        <div class="footer-grid">
                            <!-- Company Info -->
                            <div class="footer-section footer-brand">
                                <div class="footer-logo">
                                    <span class="logo-icon">🎓</span>
                                    <span class="logo-text">Platforma Lektorów</span>
                                </div>
                                <p class="footer-description">
                                    Najlepsza platforma do nauki języków obcych z wykwalifikowanymi lektorami. 
                                    Dołącz do tysięcy zadowolonych uczniów z całego świata!
                                </p>
                                <div class="social-links">
                                    <!-- POPRAWIONE - social linki jako buttony z powiadomieniami -->
                                    <button class="social-link facebook" aria-label="Facebook" data-social="Facebook">
                                        <span class="social-icon">📘</span>
                                    </button>
                                    <button class="social-link twitter" aria-label="Twitter" data-social="Twitter">
                                        <span class="social-icon">🐦</span>
                                    </button>
                                    <button class="social-link linkedin" aria-label="LinkedIn" data-social="LinkedIn">
                                        <span class="social-icon">💼</span>
                                    </button>
                                    <button class="social-link instagram" aria-label="Instagram" data-social="Instagram">
                                        <span class="social-icon">📷</span>
                                    </button>
                                    <button class="social-link youtube" aria-label="YouTube" data-social="YouTube">
                                        <span class="social-icon">📺</span>
                                    </button>
                                </div>
                            </div>

                            <!-- For Students -->
                            <div class="footer-section">
                                <h4 class="footer-title">Dla Studentów</h4>
                                <ul class="footer-links">
                                    <li><a href="/register?role=student" data-navigate>Rozpocznij naukę</a></li>
                                    <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                                    <li><button class="footer-link-disabled" disabled>Znajdź lektora (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Przeglądaj kursy (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Cennik (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Darmowa lekcja próbna (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Historie sukcesu (Wkrótce)</button></li>
                                </ul>
                            </div>

                            <!-- For Tutors -->
                            <div class="footer-section">
                                <h4 class="footer-title">Dla Lektorów</h4>
                                <ul class="footer-links">
                                    <li><a href="/register?role=tutor" data-navigate>Zostań lektorem</a></li>
                                    <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                                    <li><button class="footer-link-disabled" disabled>Przewodnik lektora (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Zasoby do nauczania (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Społeczność lektorów (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Ile można zarobić? (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Certyfikacja (Wkrótce)</button></li>
                                </ul>
                            </div>

                            <!-- Languages -->
                            <div class="footer-section">
                                <h4 class="footer-title">Języki</h4>
                                <ul class="footer-links">
                                    <!-- POPRAWIONE - zakomentowane nieistniejące strony języków -->
                                    <li><button class="footer-link-disabled" disabled>Angielski (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Niemiecki (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Francuski (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Hiszpański (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Włoski (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Wszystkie języki (Wkrótce)</button></li>
                                </ul>
                            </div>

                            <!-- Company -->
                            <div class="footer-section">
                                <h4 class="footer-title">Firma</h4>
                                <ul class="footer-links">
                                    <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                                    <li><button class="footer-link-disabled" disabled>O nas (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Kariera (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Prasa (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Blog (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Partnerzy (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Inwestorzy (Wkrótce)</button></li>
                                </ul>
                            </div>

                            <!-- Support -->
                            <div class="footer-section">
                                <h4 class="footer-title">Wsparcie</h4>
                                <ul class="footer-links">
                                    <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                                    <li><button class="footer-link-disabled" disabled>Centrum pomocy (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Kontakt (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>FAQ (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Wsparcie techniczne (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Opinie (Wkrótce)</button></li>
                                    <li><button class="footer-link-disabled" disabled>Zgłoś problem (Wkrótce)</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Newsletter Signup -->
                    <div class="footer-newsletter">
                        <div class="newsletter-content">
                            <div class="newsletter-info">
                                <h3>Zostań na bieżąco!</h3>
                                <p>Otrzymuj najnowsze informacje o nowych kursach, promocjach i tipach językowych.</p>
                            </div>
                            <form class="newsletter-form" id="newsletter-form">
                                <div class="newsletter-input-group">
                                    <input 
                                        type="email" 
                                        placeholder="Twój adres email" 
                                        class="newsletter-input"
                                        id="newsletter-email"
                                        required
                                        aria-label="Adres email do newslettera"
                                    >
                                    <button type="submit" class="newsletter-btn">
                                        <span class="btn-text">Zapisz się</span>
                                        <span class="btn-loading hidden">Zapisuję...</span>
                                    </button>
                                </div>
                                <div class="newsletter-consent">
                                    <label class="checkbox-label">
                                        <input type="checkbox" required class="newsletter-checkbox">
                                        <span class="checkmark"></span>
                                        Zgadzam się na otrzymywanie newslettera zgodnie z 
                                        <button type="button" class="footer-link-disabled privacy-link" disabled>polityką prywatności (Wkrótce)</button>
                                    </label>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Trust Indicators -->
                    <div class="footer-trust">
                        <div class="trust-indicators">
                            <div class="trust-item">
                                <span class="trust-icon">🔒</span>
                                <div class="trust-text">
                                    <strong>Bezpieczne płatności</strong>
                                    <span>SSL encryption</span>
                                </div>
                            </div>
                            <div class="trust-item">
                                <span class="trust-icon">⭐</span>
                                <div class="trust-text">
                                    <strong>4.9/5 ocena</strong>
                                    <span>Z 50,000+ opinii</span>
                                </div>
                            </div>
                            <div class="trust-item">
                                <span class="trust-icon">🎯</span>
                                <div class="trust-text">
                                    <strong>Gwarancja jakości</strong>
                                    <span>30 dni zwrotu</span>
                                </div>
                            </div>
                            <div class="trust-item">
                                <span class="trust-icon">🌍</span>
                                <div class="trust-text">
                                    <strong>Globalny zasięg</strong>
                                    <span>150+ krajów</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Footer -->
                    <div class="footer-bottom">
                        <div class="footer-bottom-content">
                            <div class="footer-bottom-left">
                                <p class="copyright">
                                    &copy; ${this.currentYear} Platforma Lektorów. Wszystkie prawa zastrzeżone.
                                </p>
                                <div class="footer-bottom-links">
                                    <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                                    <button class="footer-link-disabled" disabled>Regulamin (Wkrótce)</button>
                                    <button class="footer-link-disabled" disabled>Polityka prywatności (Wkrótce)</button>
                                    <button class="footer-link-disabled" disabled>Polityka cookies (Wkrótce)</button>
                                    <button class="footer-link-disabled" disabled>GDPR (Wkrótce)</button>
                                </div>
                            </div>
                            <div class="footer-bottom-right">
                                <div class="language-selector">
                                    <button class="language-btn" id="language-btn">
                                        <span class="current-language">🇵🇱 Polski</span>
                                        <span class="dropdown-arrow">▼</span>
                                    </button>
                                    <div class="language-dropdown" id="language-dropdown">
                                        <button class="language-option active" data-lang="pl">
                                            <span class="flag">🇵🇱</span> Polski
                                        </button>
                                        <button class="language-option" data-lang="en">
                                            <span class="flag">🇬🇧</span> English
                                        </button>
                                        <button class="language-option" data-lang="de">
                                            <span class="flag">🇩🇪</span> Deutsch
                                        </button>
                                        <button class="language-option" data-lang="fr">
                                            <span class="flag">🇫🇷</span> Français
                                        </button>
                                    </div>
                                </div>
                                <button class="back-to-top" id="back-to-top" aria-label="Powrót na górę">
                                    <span class="back-to-top-icon">↑</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `

        return footer
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initScrollEffects()
        console.log('✅ Footer mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 Footer unmounted')
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Newsletter form
        const newsletterForm = this.container.querySelector('#newsletter-form')
        newsletterForm?.addEventListener('submit', this.handleNewsletterSubmit.bind(this))

        // Language selector
        const languageBtn = this.container.querySelector('#language-btn')
        languageBtn?.addEventListener('click', this.toggleLanguageDropdown.bind(this))

        // Language options
        const languageOptions = this.container.querySelectorAll('.language-option')
        languageOptions.forEach(option => {
            option.addEventListener('click', this.handleLanguageChange.bind(this))
        })

        // Back to top button
        const backToTop = this.container.querySelector('#back-to-top')
        backToTop?.addEventListener('click', this.scrollToTop.bind(this))

        // POPRAWIONE - obsługa wyłączonych linków
        const disabledLinks = this.container.querySelectorAll('.footer-link-disabled')
        disabledLinks.forEach(link => {
            link.addEventListener('click', this.handleDisabledClick.bind(this))
        })

        // POPRAWIONE - obsługa social linków
        const socialLinks = this.container.querySelectorAll('.social-link')
        socialLinks.forEach(link => {
            link.addEventListener('click', this.handleSocialClick.bind(this))
        })

        // Close dropdowns on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this))

        // Window scroll for back-to-top visibility
        window.addEventListener('scroll', this.handleScroll.bind(this))

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this))
    }

    private async handleNewsletterSubmit(event: Event): Promise<void> {
        event.preventDefault()

        const form = event.target as HTMLFormElement
        const emailInput = form.querySelector('#newsletter-email') as HTMLInputElement
        const submitBtn = form.querySelector('.newsletter-btn') as HTMLButtonElement
        const btnText = submitBtn.querySelector('.btn-text') as HTMLElement
        const btnLoading = submitBtn.querySelector('.btn-loading') as HTMLElement
        const checkbox = form.querySelector('.newsletter-checkbox') as HTMLInputElement

        // Validate
        if (!emailInput.value || !emailInput.checkValidity()) {
            this.showNewsletterMessage('Podaj poprawny adres email', 'error')
            return
        }

        if (!checkbox.checked) {
            this.showNewsletterMessage('Musisz zaakceptować warunki', 'error')
            return
        }

        // Show loading state
        submitBtn.classList.add('btn-loading')
        btnText.classList.add('hidden')
        btnLoading.classList.remove('hidden')
        submitBtn.disabled = true

        try {
            // POPRAWIONE - symulacja zamiast prawdziwego API
            await this.simulateNewsletterSignup(emailInput.value)

            this.showNewsletterMessage('Dziękujemy! Newsletter będzie dostępny wkrótce.', 'info')
            form.reset()

        } catch (error) {
            this.showNewsletterMessage('Wystąpił błąd. Spróbuj ponownie później.', 'error')
        } finally {
            // Reset button state
            submitBtn.classList.remove('btn-loading')
            btnText.classList.remove('hidden')
            btnLoading.classList.add('hidden')
            submitBtn.disabled = false
        }
    }

    private async simulateNewsletterSignup(email: string): Promise<void> {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 1500)
        })
    }

    private showNewsletterMessage(message: string, type: 'success' | 'error' | 'info'): void {
        // Remove existing messages
        this.container?.querySelectorAll('.newsletter-message').forEach(msg => msg.remove())

        const messageElement = document.createElement('div')
        messageElement.className = `newsletter-message newsletter-${type}`
        messageElement.textContent = message

        const form = this.container?.querySelector('#newsletter-form')
        form?.appendChild(messageElement)

        // Auto remove after 5 seconds
        setTimeout(() => {
            messageElement.remove()
        }, 5000)
    }

    private toggleLanguageDropdown(event: Event): void {
        event.stopPropagation()
        const dropdown = this.container?.querySelector('#language-dropdown')
        dropdown?.classList.toggle('open')
    }

    private handleLanguageChange(event: Event): void {
        const option = event.target as HTMLElement
        const lang = option.getAttribute('data-lang')

        if (lang) {
            // Update current language display
            const currentLang = this.container?.querySelector('.current-language')
            const flag = option.querySelector('.flag')?.textContent
            const text = option.textContent?.trim()

            if (currentLang && flag && text) {
                currentLang.textContent = `${flag} ${text.replace(flag, '').trim()}`
            }

            // Update active state
            this.container?.querySelectorAll('.language-option').forEach(opt => {
                opt.classList.remove('active')
            })
            option.classList.add('active')

            // Close dropdown
            this.container?.querySelector('#language-dropdown')?.classList.remove('open')

            // POPRAWIONE - symulacja zmiany języka
            this.changeLanguage(lang)
        }
    }

    private changeLanguage(lang: string): void {
        // POPRAWIONE - powiadomienie o zmianie języka
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `Zmiana języka na ${this.getLanguageName(lang)} będzie dostępna wkrótce!`,
                duration: 3000
            }
        }))

        // Store preference
        localStorage.setItem('preferred_language', lang)
    }

    private getLanguageName(lang: string): string {
        const languageNames: Record<string, string> = {
            pl: 'polski',
            en: 'angielski',
            de: 'niemiecki',
            fr: 'francuski'
        }
        return languageNames[lang] || lang
    }

    private handleDisabledClick(event: Event): void {
        event.preventDefault()
        const element = event.currentTarget as HTMLElement
        const text = element.textContent?.trim() || 'Ta funkcja'

        // Show notification about coming soon feature
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${text.replace(' (Wkrótce)', '')} będzie dostępna wkrótce!`,
                duration: 3000
            }
        }))

        // Visual feedback
        element.classList.add('clicked')
        setTimeout(() => {
            element.classList.remove('clicked')
        }, 200)
    }

    private handleSocialClick(event: Event): void {
        event.preventDefault()
        const element = event.currentTarget as HTMLElement
        const platform = element.getAttribute('data-social') || 'Social media'

        // Show notification about social links
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${platform} będzie dostępny wkrótce!`,
                duration: 3000
            }
        }))

        // Visual feedback
        element.classList.add('clicked')
        setTimeout(() => {
            element.classList.remove('clicked')
        }, 200)
    }

    private scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    private handleOutsideClick(event: Event): void {
        const target = event.target as HTMLElement

        if (!target.closest('.language-selector')) {
            this.container?.querySelector('#language-dropdown')?.classList.remove('open')
        }
    }

    private handleScroll(): void {
        const backToTop = this.container?.querySelector('#back-to-top')

        if (backToTop) {
            backToTop.classList.toggle('visible', window.scrollY > 300)
        }
    }

    private handleResize(): void {
        // Close mobile dropdowns on desktop
        if (window.innerWidth >= 768) {
            this.container?.querySelector('#language-dropdown')?.classList.remove('open')
        }
    }

    private initScrollEffects(): void {
        // Initial scroll state
        this.handleScroll()

        // Intersection Observer for footer animations
        if (this.container && 'IntersectionObserver' in window) {
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

            // Observe footer sections
            const sections = this.container.querySelectorAll('.footer-section')
            sections.forEach(section => observer.observe(section))
        }
    }

    private cleanup(): void {
        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll.bind(this))
        window.removeEventListener('resize', this.handleResize.bind(this))
        document.removeEventListener('click', this.handleOutsideClick.bind(this))
    }

    // Public methods for external use
    public updateYear(): void {
        this.currentYear = new Date().getFullYear()
        const copyrightElement = this.container?.querySelector('.copyright')
        if (copyrightElement) {
            copyrightElement.innerHTML = `&copy; ${this.currentYear} Platforma Lektorów. Wszystkie prawa zastrzeżone.`
        }
    }

    public highlightSection(sectionName: string): void {
        // Highlight a specific footer section (e.g., for guided tours)
        const sections = this.container?.querySelectorAll('.footer-section')
        sections?.forEach(section => {
            section.classList.remove('highlighted')
        })

        const targetSection = this.container?.querySelector(`[data-section="${sectionName}"]`)
        targetSection?.classList.add('highlighted')
    }
}