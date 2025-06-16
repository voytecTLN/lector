// resources/ts/components/pages/UnauthorizedPage.ts - POPRAWIONE
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@/router/routes'

export class UnauthorizedPage implements RouteComponent {
    private container: HTMLElement | null = null

    async render(): Promise<HTMLElement> {
        const page = document.createElement('div')
        page.className = 'unauthorized-page'

        const isAuthenticated = authService.isAuthenticated()
        const user = authService.getUser()

        page.innerHTML = `
            <div class="unauthorized-container">
                <div class="unauthorized-content">
                    <!-- Error Icon -->
                    <div class="error-icon">
                        <div class="icon-container">
                            <span class="main-icon">🚫</span>
                            <div class="icon-effects">
                                <div class="pulse-ring"></div>
                                <div class="pulse-ring delay-1"></div>
                                <div class="pulse-ring delay-2"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Error Message -->
                    <div class="error-message">
                        <h1 class="error-title">Brak uprawnień</h1>
                        <p class="error-description">
                            ${this.getErrorMessage(isAuthenticated, user)}
                        </p>
                    </div>

                    <!-- User Info (if logged in) -->
                    ${isAuthenticated && user ? this.getUserInfoSection(user) : ''}

                    <!-- Actions -->
                    <div class="unauthorized-actions">
                        ${this.getActionButtons(isAuthenticated, user)}
                    </div>

                    <!-- Help Section -->
                    <div class="help-section">
                        <h3>Potrzebujesz pomocy?</h3>
                        <div class="help-options">
                            <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
                            <button class="help-option help-disabled" disabled>
                                <span class="help-icon">❓</span>
                                <div class="help-content">
                                    <h4>Centrum pomocy</h4>
                                    <p>Znajdź odpowiedzi na najczęstsze pytania (Wkrótce)</p>
                                </div>
                            </button>
                            <button class="help-option help-disabled" disabled>
                                <span class="help-icon">💬</span>
                                <div class="help-content">
                                    <h4>Skontaktuj się z nami</h4>
                                    <p>Nasz zespół pomoże rozwiązać problem (Wkrótce)</p>
                                </div>
                            </button>
                            <button class="help-option help-disabled" disabled>
                                <span class="help-icon">📖</span>
                                <div class="help-content">
                                    <h4>FAQ</h4>
                                    <p>Sprawdź często zadawane pytania (Wkrótce)</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Information Box -->
                    <div class="info-box">
                        <div class="info-icon">💡</div>
                        <div class="info-content">
                            <h4>Dlaczego widzę tę stronę?</h4>
                            <ul class="info-list">
                                <li>Próbujesz uzyskać dostęp do strony, która wymaga specjalnych uprawnień</li>
                                <li>Twoja rola użytkownika nie pozwala na dostęp do tej funkcji</li>
                                <li>Sesja mogła wygasnąć - spróbuj zalogować się ponownie</li>
                                <li>Link może być nieprawidłowy lub nieaktualny</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Background Animation -->
                <div class="background-animation">
                    <div class="floating-shape shape-1"></div>
                    <div class="floating-shape shape-2"></div>
                    <div class="floating-shape shape-3"></div>
                    <div class="floating-shape shape-4"></div>
               </div>
           </div>
       `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        this.initAnimations()
        console.log('✅ UnauthorizedPage mounted')
    }

    unmount(): void {
        console.log('👋 UnauthorizedPage unmounted')
    }

    private getErrorMessage(isAuthenticated: boolean, user: any): string {
        if (!isAuthenticated) {
            return 'Aby uzyskać dostęp do tej strony, musisz się najpierw zalogować.'
        }

        if (user && !user.is_verified) {
            return 'Twoje konto nie jest jeszcze zweryfikowane. Sprawdź swoją skrzynkę pocztową i kliknij link weryfikacyjny.'
        }

        return 'Nie masz uprawnień do przeglądania tej strony. Skontaktuj się z administratorem, jeśli uważasz, że to błąd.'
    }

    private getUserInfoSection(user: any): string {
        return `
           <div class="user-info-section">
               <h3>Informacje o koncie</h3>
               <div class="user-card">
                   <div class="user-avatar">
                       ${user.avatar ?
            `<img src="${user.avatar}" alt="${user.name}">` :
            `<span class="avatar-initials">${this.getInitials(user.name)}</span>`
        }
                   </div>
                   <div class="user-details">
                       <div class="user-name">${user.name}</div>
                       <div class="user-email">${user.email}</div>
                       <div class="user-role">
                           <span class="role-badge role-${user.role}">
                               ${this.getRoleLabel(user.role)}
                           </span>
                       </div>
                       ${!user.is_verified ? `
                           <div class="verification-status">
                               <span class="status-badge status-unverified">
                                   ❌ Konto niezweryfikowane
                               </span>
                           </div>
                       ` : ''}
                   </div>
               </div>
           </div>
       `
    }

    private getActionButtons(isAuthenticated: boolean, user: any): string {
        if (!isAuthenticated) {
            return `
               <a href="/login" data-navigate class="btn btn-primary btn-lg">
                   🔐 Zaloguj się
               </a>
               <a href="/register" data-navigate class="btn btn-outline-primary btn-lg">
                   📝 Utwórz konto
               </a>
               <a href="/" data-navigate class="btn btn-secondary">
                   🏠 Strona główna
               </a>
           `
        }

        if (user && !user.is_verified) {
            return `
               <button class="btn btn-primary btn-lg" id="resend-verification-btn">
                   📧 Wyślij ponownie email weryfikacyjny
               </button>
               <a href="/verify-email" data-navigate class="btn btn-outline-primary">
                   ✅ Weryfikuj konto
               </a>
               <button class="btn btn-secondary" id="logout-btn">
                   🚪 Wyloguj się
               </button>
           `
        }

        // Authenticated but insufficient permissions
        return `
           <a href="${this.getDashboardRoute(user?.role)}" data-navigate class="btn btn-primary btn-lg">
               📊 Mój panel
           </a>
           <!-- POPRAWIONE - zakomentowane nieistniejące strony -->
           <button class="btn btn-outline-primary btn-disabled" id="profile-btn" disabled>
               👤 Mój profil (Wkrótce)
           </button>
           <button class="btn btn-secondary" id="logout-btn">
               🚪 Wyloguj się
           </button>
       `
    }

    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
    }

    private getRoleLabel(role: string): string {
        const roleLabels: Record<string, string> = {
            admin: 'Administrator',
            moderator: 'Moderator',
            tutor: 'Lektor',
            student: 'Student'
        }
        return roleLabels[role] || 'Użytkownik'
    }

    private getDashboardRoute(role: string): string {
        const dashboardRoutes: Record<string, string> = {
            admin: '/admin/dashboard',
            moderator: '/moderator/dashboard',
            tutor: '/tutor/dashboard',
            student: '/student/dashboard'
        }
        return dashboardRoutes[role] || '/student/dashboard'
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Resend verification button
        const resendBtn = this.container.querySelector('#resend-verification-btn')
        resendBtn?.addEventListener('click', this.handleResendVerification.bind(this))

        // Logout button
        const logoutBtn = this.container.querySelector('#logout-btn')
        logoutBtn?.addEventListener('click', this.handleLogout.bind(this))

        // POPRAWIONE - obsługa wyłączonych przycisków
        const disabledButtons = this.container.querySelectorAll('.btn-disabled')
        disabledButtons.forEach(button => {
            button.addEventListener('click', this.handleDisabledButtonClick.bind(this))
        })

        // POPRAWIONE - obsługa wyłączonych opcji pomocy
        const helpOptions = this.container.querySelectorAll('.help-disabled')
        helpOptions.forEach(option => {
            option.addEventListener('click', this.handleHelpOptionClick.bind(this))
        })

        // Help options hover - tylko dla działających
        const workingOptions = this.container.querySelectorAll('.help-option:not(.help-disabled)')
        workingOptions.forEach(option => {
            option.addEventListener('mouseenter', this.handleHelpOptionHover.bind(this))
        })
    }

    private initAnimations(): void {
        // Add entrance animations
        const content = this.container?.querySelector('.unauthorized-content')
        content?.classList.add('fade-in-up')

        // Animate floating shapes
        const shapes = this.container?.querySelectorAll('.floating-shape')
        shapes?.forEach((shape, index) => {
            shape.classList.add('animate-float')
            ;(shape as HTMLElement).style.animationDelay = `${index * 0.8}s`
        })

        // Pulse animation for error icon
        const pulseRings = this.container?.querySelectorAll('.pulse-ring')
        pulseRings?.forEach(ring => {
            ring.classList.add('animate-pulse')
        })
    }

    private async handleResendVerification(): Promise<void> {
        const button = this.container?.querySelector('#resend-verification-btn') as HTMLButtonElement
        if (!button) return

        const originalText = button.textContent
        button.disabled = true
        button.textContent = '📧 Wysyłanie...'

        try {
            await authService.resendVerification()
            button.textContent = '✅ Wysłano!'

            setTimeout(() => {
                button.textContent = originalText
                button.disabled = false
            }, 3000)

        } catch (error) {
            button.textContent = '❌ Błąd'

            setTimeout(() => {
                button.textContent = originalText
                button.disabled = false
            }, 3000)
        }
    }

    private async handleLogout(): Promise<void> {
        const button = this.container?.querySelector('#logout-btn') as HTMLButtonElement
        if (!button) return

        const originalText = button.textContent
        button.disabled = true
        button.textContent = '🚪 Wylogowywanie...'

        try {
            await authService.logout()
            // AuthService will handle the redirect
        } catch (error) {
            button.textContent = originalText
            button.disabled = false
        }
    }

    private handleDisabledButtonClick(event: Event): void {
        event.preventDefault()
        const button = event.currentTarget as HTMLElement
        const text = button.textContent?.trim() || 'Ta funkcja'

        // Show notification about coming soon feature
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${text.replace(' (Wkrótce)', '')} będzie dostępna wkrótce!`,
                duration: 3000
            }
        }))

        // Visual feedback
        button.classList.add('clicked')
        setTimeout(() => {
            button.classList.remove('clicked')
        }, 200)
    }

    private handleHelpOptionClick(event: Event): void {
        event.preventDefault()
        const option = event.currentTarget as HTMLElement
        const title = option.querySelector('h4')?.textContent || 'Ta funkcja'

        // Show notification about coming soon feature
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${title} będzie dostępna wkrótce!`,
                duration: 3000
            }
        }))

        // Visual feedback
        option.classList.add('clicked')
        setTimeout(() => {
            option.classList.remove('clicked')
        }, 200)
    }

    private handleHelpOptionHover(event: Event): void {
        const option = event.currentTarget as HTMLElement
        option.classList.add('hovered')
    }

    onBeforeEnter(): boolean {
        return true
    }

    onAfterEnter(): void {
        // Update page title
        document.title = 'Brak uprawnień - Platforma Lektorów'

        // Track unauthorized access
        this.trackUnauthorizedAccess()
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        // Cleanup
    }

    private trackUnauthorizedAccess(): void {
        // POPRAWIONE - uproszczone logowanie dostępu bez uprawnień
        const user = authService.getUser()
        console.log('Unauthorized access:', {
            path: window.location.pathname,
            user: user ? { id: user.id, role: user.role } : null,
            timestamp: new Date().toISOString()
        })
    }
}