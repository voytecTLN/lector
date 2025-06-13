// resources/ts/components/auth/EmailVerificationPage.ts
import { authService } from '@services/AuthService'
import type { RouteComponent } from '@/router/routes'

export class EmailVerificationPage implements RouteComponent {
    private container: HTMLElement | null = null
    private isProcessing: boolean = false
    private verificationStatus: 'pending' | 'success' | 'error' | 'already_verified' = 'pending'
    private currentUser: any = null

    async render(): Promise<HTMLElement> {
        this.currentUser = authService.getUser()

        const page = document.createElement('div')
        page.className = 'email-verification-page auth-page'

        // Check for token in URL
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')

        if (token) {
            // Auto-verify if token is present
            this.autoVerifyWithToken(token)
        } else if (this.currentUser?.is_verified) {
            this.verificationStatus = 'already_verified'
        }

        page.innerHTML = `
            <div class="auth-card">
                <div class="auth-card-header">
                    <h1 class="auth-title">Weryfikacja adresu email</h1>
                    <p class="auth-subtitle" id="subtitle">
                        ${this.getSubtitleText()}
                    </p>
                </div>

                <div class="auth-card-body">
                    <div class="verification-content" id="verification-content">
                        ${this.getContentHTML()}
                    </div>
                </div>

                <div class="auth-card-footer">
                    <p class="auth-footer-text">
                        <button class="logout-link" id="logout-btn">Wyloguj się</button>
                        lub 
                        <a href="/contact" data-navigate class="auth-link">Skontaktuj się z nami</a>
                    </p>
                </div>
            </div>

            <!-- User Info -->
            ${this.currentUser ? this.getUserInfoHTML() : ''}

            <!-- Help Section -->
            <div class="auth-help">
                <h3>Problemy z weryfikacją?</h3>
                <div class="help-links">
                    <a href="/help/email-verification" data-navigate>Nie otrzymuję emaila weryfikacyjnego</a>
                    <a href="/help/account" data-navigate>Problemy z kontem</a>
                    <a href="/contact" data-navigate>Skontaktuj się z pomocą</a>
                </div>
            </div>
        `

        return page
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.initEventListeners()
        console.log('✅ EmailVerificationPage mounted')
    }

    unmount(): void {
        this.cleanup()
        console.log('👋 EmailVerificationPage unmounted')
    }

    private getSubtitleText(): string {
        switch (this.verificationStatus) {
            case 'success':
                return 'Twój email został pomyślnie zweryfikowany! Przekierowywanie...'
            case 'error':
                return 'Wystąpił problem z weryfikacją. Spróbuj ponownie.'
            case 'already_verified':
                return 'Twój email jest już zweryfikowany!'
            case 'pending':
            default:
                return 'Aby kontynuować, musisz zweryfikować swój adres email.'
        }
    }

    private getContentHTML(): string {
        switch (this.verificationStatus) {
            case 'success':
                return this.getSuccessContent()
            case 'error':
                return this.getErrorContent()
            case 'already_verified':
                return this.getAlreadyVerifiedContent()
            case 'pending':
            default:
                return this.getPendingContent()
        }
    }

    private getPendingContent(): string {
        return `
            <!-- Pending Verification -->
            <div class="verification-pending">
                <div class="verification-icon">
                    <div class="icon-container">
                        <span class="main-icon">📧</span>
                        <div class="icon-effects">
                            <div class="pulse-ring"></div>
                            <div class="pulse-ring delay-1"></div>
                            <div class="pulse-ring delay-2"></div>
                        </div>
                    </div>
                </div>

                <div class="verification-message">
                    <h3>Sprawdź swoją skrzynkę pocztową</h3>
                    <p>
                        Wysłaliśmy email weryfikacyjny na adres <strong>${this.currentUser?.email}</strong>. 
                        Kliknij link w emailu, aby zweryfikować swoje konto.
                    </p>
                </div>

                <div class="verification-actions">
                    <button class="btn btn-primary" id="resend-btn">
                        <span class="btn-text">📧 Wyślij ponownie</span>
                        <span class="btn-loading hidden">
                            <span class="loading-spinner"></span>
                            Wysyłanie...
                        </span>
                    </button>
                    <button class="btn btn-outline-primary" id="check-status-btn">
                        🔄 Sprawdź status
                    </button>
                </div>

                <div class="verification-help">
                    <h4>Nie widzisz emaila?</h4>
                    <ul class="help-list">
                        <li>Sprawdź folder spam/wiadomości niechciane</li>
                        <li>Upewnij się, że adres email jest poprawny</li>
                        <li>Odczekaj kilka minut - dostarczenie może potrwać</li>
                        <li>Kliknij "Wyślij ponownie" jeśli nadal nie ma emaila</li>
                    </ul>
                </div>

                <!-- Manual Verification -->
                <div class="manual-verification">
                    <h4>Masz token weryfikacyjny?</h4>
                    <form class="verification-form" id="manual-verification-form">
                        <div class="form-group">
                            <label for="verification-token" class="form-label">Token weryfikacyjny</label>
                            <div class="input-wrapper">
                                <input 
                                    type="text" 
                                    id="verification-token" 
                                    name="token"
                                    class="form-control" 
                                    placeholder="Wpisz token z emaila"
                                    aria-describedby="token-error"
                                >
                                <span class="input-icon">🔑</span>
                            </div>
                            <div class="field-error" id="token-error"></div>
                        </div>
                        <button type="submit" class="btn btn-secondary">
                            ✅ Zweryfikuj ręcznie
                        </button>
                    </form>
                </div>
            </div>
        `
    }

    private getSuccessContent(): string {
        return `
            <!-- Success State -->
            <div class="verification-success">
                <div class="success-icon">
                    <div class="icon-container">
                        <span class="main-icon">✅</span>
                        <div class="icon-effects">
                            <div class="success-ring"></div>
                            <div class="success-ring delay-1"></div>
                        </div>
                    </div>
                </div>

                <div class="success-message">
                    <h3>Email zweryfikowany pomyślnie!</h3>
                    <p>
                        Twoje konto jest teraz w pełni aktywne. Za chwilę zostaniesz przekierowany 
                        do swojego panelu.
                    </p>
                </div>

                <div class="success-actions">
                    <a href="${this.getDashboardRoute()}" data-navigate class="btn btn-primary">
                        📊 Przejdź do panelu
                    </a>
                    <a href="/profile" data-navigate class="btn btn-outline-primary">
                        👤 Mój profil
                    </a>
                </div>

                <div class="welcome-message">
                    <h4>🎉 Witamy w Platforma Lektorów!</h4>
                    <p>
                        Twoje konto jest gotowe do użycia. Możesz teraz korzystać ze wszystkich funkcji platformy.
                    </p>
                </div>
            </div>
        `
    }

    private getErrorContent(): string {
        return `
            <!-- Error State -->
            <div class="verification-error">
                <div class="error-icon">
                    <div class="icon-container">
                        <span class="main-icon">❌</span>
                        <div class="icon-effects">
                            <div class="error-ring"></div>
                            <div class="error-ring delay-1"></div>
                        </div>
                    </div>
                </div>

                <div class="error-message">
                    <h3>Wystąpił problem z weryfikacją</h3>
                    <p id="error-details">
                        Token weryfikacyjny może być nieprawidłowy, wygasły lub już został użyty.
                    </p>
                </div>

                <div class="error-actions">
                    <button class="btn btn-primary" id="retry-resend-btn">
                        📧 Wyślij nowy email
                    </button>
                    <button class="btn btn-outline-primary" id="try-again-btn">
                        🔄 Spróbuj ponownie
                    </button>
                </div>

                <div class="error-help">
                    <h4>Co można zrobić?</h4>
                    <ul class="help-list">
                        <li>Wyślij nowy email weryfikacyjny klikając przycisk powyżej</li>
                        <li>Sprawdź czy kliknąłeś najnowszy link z emaila</li>
                        <li>Upewnij się, że nie wykorzystałeś już tego linku wcześniej</li>
                        <li>Skontaktuj się z pomocą techniczną jeśli problem się powtarza</li>
                    </ul>
                </div>
            </div>
        `
    }

    private getAlreadyVerifiedContent(): string {
        return `
            <!-- Already Verified -->
            <div class="verification-complete">
                <div class="complete-icon">
                    <div class="icon-container">
                        <span class="main-icon">🎯</span>
                        <div class="icon-effects">
                            <div class="complete-ring"></div>
                        </div>
                    </div>
                </div>

                <div class="complete-message">
                    <h3>Email już zweryfikowany</h3>
                    <p>
                        Twój adres email <strong>${this.currentUser?.email}</strong> jest już zweryfikowany 
                        i Twoje konto jest w pełni aktywne.
                    </p>
                </div>

                <div class="complete-actions">
                    <a href="${this.getDashboardRoute()}" data-navigate class="btn btn-primary">
                        📊 Przejdź do panelu
                    </a>
                    <a href="/profile" data-navigate class="btn btn-outline-primary">
                        👤 Mój profil
                    </a>
                </div>

                <div class="account-info">
                    <h4>Status konta</h4>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="status-icon">✅</span>
                            <span class="status-text">Email zweryfikowany</span>
                        </div>
                        <div class="status-item">
                            <span class="status-icon">🔓</span>
                            <span class="status-text">Konto aktywne</span>
                        </div>
                        <div class="status-item">
                            <span class="status-icon">🎯</span>
                            <span class="status-text">Pełny dostęp</span>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private getUserInfoHTML(): string {
        if (!this.currentUser) return ''

        return `
            <div class="user-info-card">
                <h3>Informacje o koncie</h3>
                <div class="user-details">
                    <div class="user-avatar">
                        ${this.currentUser.avatar
            ? `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}">`
            : `<span class="avatar-initials">${this.getInitials(this.currentUser.name)}</span>`
        }
                    </div>
                    <div class="user-info">
                        <div class="user-name">${this.currentUser.name}</div>
                        <div class="user-email">${this.currentUser.email}</div>
                        <div class="user-role">
                            <span class="role-badge role-${this.currentUser.role}">
                                ${this.getRoleLabel(this.currentUser.role)}
                            </span>
                        </div>
                        <div class="verification-status">
                            <span class="status-badge ${this.currentUser.is_verified ? 'status-verified' : 'status-unverified'}">
                                ${this.currentUser.is_verified ? '✅ Zweryfikowany' : '⏳ Oczekuje weryfikacji'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private initEventListeners(): void {
        if (!this.container) return

        // Resend verification button
        const resendBtn = this.container.querySelector('#resend-btn')
        resendBtn?.addEventListener('click', this.handleResendVerification.bind(this))

        // Retry resend button (in error state)
        const retryResendBtn = this.container.querySelector('#retry-resend-btn')
        retryResendBtn?.addEventListener('click', this.handleResendVerification.bind(this))

        // Check status button
        const checkStatusBtn = this.container.querySelector('#check-status-btn')
        checkStatusBtn?.addEventListener('click', this.handleCheckStatus.bind(this))

        // Try again button (in error state)
        const tryAgainBtn = this.container.querySelector('#try-again-btn')
        tryAgainBtn?.addEventListener('click', this.handleTryAgain.bind(this))

        // Manual verification form
        const manualForm = this.container.querySelector('#manual-verification-form')
        manualForm?.addEventListener('submit', this.handleManualVerification.bind(this))

        // Logout button
        const logoutBtn = this.container.querySelector('#logout-btn')
        logoutBtn?.addEventListener('click', this.handleLogout.bind(this))
    }

    private async autoVerifyWithToken(token: string): Promise<void> {
        this.setProcessingState(true)

        try {
            console.log('🔐 Auto-verifying with token...')

            await authService.verifyEmail(token)

            // Update user data
            await authService.getCurrentUser()

            this.verificationStatus = 'success'
            this.updatePageContent()

            // Redirect after delay
            setTimeout(() => {
                this.redirectToDashboard()
            }, 3000)

        } catch (error) {
            console.error('❌ Auto-verification failed:', error)
            this.verificationStatus = 'error'
            this.updatePageContent()

            // Show specific error if available
            const errorDetails = this.container?.querySelector('#error-details')
            if (errorDetails && error instanceof Error) {
                errorDetails.textContent = error.message
            }
        } finally {
            this.setProcessingState(false)
        }
    }

    private async handleResendVerification(): Promise<void> {
        const button = event?.target as HTMLButtonElement
        if (!button || this.isProcessing) return

        this.setLoadingState(button, true)

        try {
            await authService.resendVerification()

            this.showSuccess('Email weryfikacyjny został wysłany ponownie!')

        } catch (error) {
            console.error('❌ Resend verification error:', error)
            this.showError(error instanceof Error ? error.message : 'Błąd podczas wysyłania emaila')
        } finally {
            this.setLoadingState(button, false)
        }
    }

    private async handleCheckStatus(): Promise<void> {
        this.setProcessingState(true)

        try {
            // Refresh user data
            const user = await authService.getCurrentUser()

            if (user?.is_verified) {
                this.verificationStatus = 'success'
                this.currentUser = user
                this.updatePageContent()

                setTimeout(() => {
                    this.redirectToDashboard()
                }, 2000)
            } else {
                this.showInfo('Status nie zmienił się. Sprawdź swoją skrzynkę pocztową.')
            }

        } catch (error) {
            console.error('❌ Check status error:', error)
            this.showError('Błąd podczas sprawdzania statusu')
        } finally {
            this.setProcessingState(false)
        }
    }

    private handleTryAgain(): void {
        this.verificationStatus = 'pending'
        this.updatePageContent()
    }

    private async handleManualVerification(event: Event): Promise<void> {
        event.preventDefault()

        const form = event.target as HTMLFormElement
        const formData = new FormData(form)
        const token = formData.get('token') as string

        if (!token?.trim()) {
            this.showTokenError('Token jest wymagany')
            return
        }

        this.setProcessingState(true)
        this.clearTokenError()

        try {
            await authService.verifyEmail(token.trim())

            // Update user data
            await authService.getCurrentUser()

            this.verificationStatus = 'success'
            this.updatePageContent()

            setTimeout(() => {
                this.redirectToDashboard()
            }, 2000)

        } catch (error) {
            console.error('❌ Manual verification error:', error)
            this.showTokenError(error instanceof Error ? error.message : 'Nieprawidłowy token')
        } finally {
            this.setProcessingState(false)
        }
    }

    private async handleLogout(): Promise<void> {
        try {
            await authService.logout()
        } catch (error) {
            console.error('Logout error:', error)
            // Force logout anyway
            window.location.href = '/login'
        }
    }

    private updatePageContent(): void {
        if (!this.container) return

        const subtitle = this.container.querySelector('#subtitle')
        const content = this.container.querySelector('#verification-content')

        if (subtitle) {
            subtitle.textContent = this.getSubtitleText()
        }

        if (content) {
            content.innerHTML = this.getContentHTML()
        }

        // Re-initialize event listeners
        this.initEventListeners()
    }

    private setProcessingState(processing: boolean): void {
        this.isProcessing = processing
        // Add visual feedback if needed
    }

    private setLoadingState(button: HTMLButtonElement, loading: boolean): void {
        const btnText = button.querySelector('.btn-text')
        const btnLoading = button.querySelector('.btn-loading')

        button.disabled = loading

        if (btnText && btnLoading) {
            btnText.classList.toggle('hidden', loading)
            btnLoading.classList.toggle('hidden', !loading)
        }
    }

    private showTokenError(message: string): void {
        const errorElement = this.container?.querySelector('#token-error')
        const inputElement = this.container?.querySelector('#verification-token')

        if (errorElement) {
            errorElement.textContent = message
            errorElement.classList.add('visible')
        }

        if (inputElement) {
            inputElement.classList.add('error')
        }
    }

    private clearTokenError(): void {
        const errorElement = this.container?.querySelector('#token-error')
        const inputElement = this.container?.querySelector('#verification-token')

        if (errorElement) {
            errorElement.textContent = ''
            errorElement.classList.remove('visible')
        }

        if (inputElement) {
            inputElement.classList.remove('error')
        }
    }

    private showSuccess(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: { type: 'success', message }
        }))
    }

    private showError(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: { type: 'error', message }
        }))
    }

    private showInfo(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: { type: 'info', message }
        }))
    }

    private getDashboardRoute(): string {
        const dashboardRoutes: Record<string, string> = {
            admin: '/admin/dashboard',
            moderator: '/moderator/dashboard',
            tutor: '/tutor/dashboard',
            student: '/student/dashboard'
        }
        return dashboardRoutes[this.currentUser?.role] || '/profile'
    }

    private redirectToDashboard(): void {
        window.location.href = this.getDashboardRoute()
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

    private cleanup(): void {
        this.isProcessing = false
    }

    // Lifecycle hooks
    onBeforeEnter(): boolean {
        // Redirect if not authenticated
        if (!authService.isAuthenticated()) {
            window.location.href = '/login'
            return false
        }

        // Redirect if already verified (unless there's a token to process)
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')

        if (!token && authService.isVerified()) {
            const user = authService.getUser()
            if (user) {
                const dashboardRoutes: Record<string, string> = {
                    admin: '/admin/dashboard',
                    moderator: '/moderator/dashboard',
                    tutor: '/tutor/dashboard',
                    student: '/student/dashboard'
                }
                const redirectUrl = dashboardRoutes[user.role] || '/profile'
                window.location.href = redirectUrl
                return false
            }
        }

        return true
    }

    onAfterEnter(): void {
        document.title = 'Weryfikacja email - Platforma Lektorów'
    }

    onBeforeLeave(): boolean {
        return true
    }

    onAfterLeave(): void {
        this.cleanup()
    }
}