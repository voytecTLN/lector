// resources/ts/main.ts - Updated for SPA with Page Components

import '../css/app.css'
import { Router } from '@/router/Router'
import { authService } from '@services/AuthService'
import { authModal } from '@components/auth/AuthModal'
import { routeGuard } from '@components/RouteGuard'

// Page Components
import { Homepage } from '@components/pages/Homepage'
import { LoginPage } from '@components/pages/LoginPage'
import { RegisterPage } from '@components/pages/RegisterPage'
import { AdminDashboard } from '@components/pages/dashboards/AdminDashboard'
import { StudentDashboard } from '@components/pages/dashboards/StudentDashboard'
import { TutorDashboard } from '@components/pages/dashboards/TutorDashboard'

interface NotificationEventDetail {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AuthChangeEventDetail {
  type: 'login' | 'logout' | 'register';
  user: any;
  isAuthenticated: boolean;
}

class TutoringApp {
  private router: Router
  private mainContent: HTMLElement
  private currentPageComponent: any = null

  constructor() {
    console.log('🎯 Platforma Lektorów SPA initialized!')

    // Initialize main content container
    this.mainContent = document.getElementById('main-content') || document.body

    // Initialize router
    this.router = new Router()
    this.setupRoutes()

    this.init()
  }

  private async init(): Promise<void> {
    // Initialize authentication first
    await this.initAuthentication()

    // Initialize layout
    this.initLayout()

    // Initialize global event listeners
    this.initGlobalEvents()

    // Initialize notifications
    this.initNotifications()

    // Start the router
    this.router.start()

    // Make router globally available
    ;(window as any).router = this.router
  }

  private setupRoutes(): void {
    // Public routes
    this.router.addRoute('/', () => this.renderPage('homepage'))
    this.router.addRoute('/login', () => this.renderPage('login'))
    this.router.addRoute('/register', () => this.renderPage('register'))
    this.router.addRoute('/forgot-password', () => this.renderPage('forgot-password'))

    // Protected routes
    this.router.addRoute('/admin/dashboard', () => this.renderPage('admin-dashboard'))
    this.router.addRoute('/moderator/dashboard', () => this.renderPage('moderator-dashboard'))
    this.router.addRoute('/tutor/dashboard', () => this.renderPage('tutor-dashboard'))
    this.router.addRoute('/student/dashboard', () => this.renderPage('student-dashboard'))

    // Profile routes
    this.router.addRoute('/profile', () => this.renderPage('profile'))

    // Catch-all for 404
    this.router.addRoute('*', () => this.renderPage('404'))
  }

  private async renderPage(pageType: string): Promise<void> {
    // Destroy current page component
    if (this.currentPageComponent?.destroy) {
      this.currentPageComponent.destroy()
    }
    this.currentPageComponent = null

    // Check route access
    if (!(await this.checkRouteAccess(pageType))) {
      return // Access denied - routeGuard handles redirection
    }

    // Clear main content
    this.mainContent.innerHTML = ''

    // Render the appropriate page
    switch (pageType) {
      case 'homepage':
        this.currentPageComponent = new Homepage()
        break

      case 'login':
        this.currentPageComponent = new LoginPage()
        break

      case 'register':
        this.currentPageComponent = new RegisterPage()
        break

      case 'admin-dashboard':
        this.currentPageComponent = new AdminDashboard(this.mainContent)
        break

      case 'student-dashboard':
        this.currentPageComponent = new StudentDashboard(this.mainContent)
        break

      case 'tutor-dashboard':
        this.currentPageComponent = new TutorDashboard(this.mainContent)
        break

      case 'forgot-password':
        this.renderForgotPasswordPage()
        break

      case 'profile':
        this.renderProfilePage()
        break

      case '404':
        this.render404Page()
        break

      default:
        this.render404Page()
    }

    // Update navigation state
    this.updateNavigationHighlight()

    // Scroll to top
    window.scrollTo(0, 0)
  }

  private async checkRouteAccess(pageType: string): Promise<boolean> {
    const routeConfigs: Record<string, any> = {
      'admin-dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['admin']
      },
      'moderator-dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['moderator', 'admin']
      },
      'tutor-dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['tutor', 'admin']
      },
      'student-dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['student', 'admin']
      },
      'profile': {
        requiresAuth: true,
        requiresVerification: true
      }
    }

    const config = routeConfigs[pageType]
    if (config) {
      return await routeGuard.checkAccess(config)
    }

    return true // Allow access to public pages
  }

  private async initAuthentication(): Promise<void> {
    // Try to get current user if token exists
    if (authService.getToken()) {
      try {
        await authService.getCurrentUser()
        console.log('User authenticated:', authService.getUser())
      } catch (error) {
        console.log('Token invalid, user logged out')
        authService.logout()
      }
    }

    // Listen for auth changes
    document.addEventListener('auth:change', (e: Event) => {
      const customEvent = e as CustomEvent<AuthChangeEventDetail>
      this.handleAuthChange(customEvent.detail)
    })

    // Update navigation based on auth state
    this.updateNavigation()
  }

  private initLayout(): void {
    // Create the main layout structure
    document.body.innerHTML = this.getLayoutTemplate()

    // Get main content container
    this.mainContent = document.getElementById('main-content')!

    // Setup layout event listeners
    this.setupLayoutEventListeners()
  }

  private getLayoutTemplate(): string {
    return `
            <!-- Navigation -->
            <header class="header">
                <nav class="nav container">
                    <div class="logo">
                        <i class="fas fa-graduation-cap"></i>
                        <a href="/" data-route="/">Platforma Lektorów</a>
                    </div>

                    <ul class="nav-links">
                        <li><a href="/" data-route="/">Start</a></li>
                        <li><a href="/#lecturers">Lektorzy</a></li>
                        <li><a href="/#about">O nas</a></li>
                        <li><a href="/contact" data-route="/contact">Kontakt</a></li>
                    </ul>

                    <div class="nav-actions">
                        <div class="auth-buttons" id="guest-nav" style="display: none;">
                            <button class="login-btn">
                                <i class="fas fa-sign-in-alt"></i>
                                Zaloguj się
                            </button>
                            <button class="register-btn">
                                <i class="fas fa-user-plus"></i>
                                Dołącz do nas
                            </button>
                        </div>

                        <div class="user-menu" id="user-nav" style="display: none;">
                            <div class="user-dropdown">
                                <button class="user-dropdown-toggle">
                                    <img src="" alt="" class="user-avatar" id="user-avatar">
                                    <span class="user-name" id="user-name"></span>
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <div class="user-dropdown-menu">
                                    <div class="user-info">
                                        <div class="user-name" id="dropdown-user-name"></div>
                                        <div class="user-role" id="dropdown-user-role"></div>
                                        <div class="user-email" id="dropdown-user-email"></div>
                                    </div>
                                    <div class="dropdown-divider"></div>
                                    <a href="/profile" data-route="/profile" class="dropdown-item">
                                        <i class="fas fa-user"></i>
                                        Profil
                                    </a>
                                    <div id="role-specific-links"></div>
                                    <div class="dropdown-divider"></div>
                                    <button class="dropdown-item logout-btn">
                                        <i class="fas fa-sign-out-alt"></i>
                                        Wyloguj się
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button class="mobile-menu-btn" aria-label="Menu">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </nav>

                <!-- Mobile Menu -->
                <div class="mobile-menu">
                    <ul class="mobile-nav-links">
                        <li><a href="/" data-route="/">Start</a></li>
                        <li><a href="/#lecturers">Lektorzy</a></li>
                        <li><a href="/#about">O nas</a></li>
                        <li><a href="/contact" data-route="/contact">Kontakt</a></li>
                        <div id="mobile-auth-links"></div>
                    </ul>
                </div>
            </header>

            <!-- Main Content -->
            <main id="main-content">
                <!-- Page content will be injected here -->
            </main>

            <!-- Footer -->
            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h3>O nas</h3>
                            <p>Jesteśmy platformą łączącą uczniów z najlepszymi lektorami języków obcych.</p>
                            <div class="social-links">
                                <a href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
                                <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                                <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
                            </div>
                        </div>
                        <div class="footer-section">
                            <h3>Kontakt</h3>
                            <p><i class="fas fa-envelope"></i> kontakt@platformalektorow.pl</p>
                            <p><i class="fas fa-phone"></i> +48 123 456 789</p>
                        </div>
                        <div class="footer-section">
                            <h3>Języki</h3>
                            <ul class="languages-footer">
                                <li>Angielski</li>
                                <li>Niemiecki</li>
                                <li>Francuski</li>
                                <li>Hiszpański</li>
                            </ul>
                        </div>
                        <div class="footer-section">
                            <h3>Informacje</h3>
                            <ul class="footer-links">
                                <li><a href="/terms">Regulamin</a></li>
                                <li><a href="/privacy">Polityka prywatności</a></li>
                                <li><a href="/help">Pomoc</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>&copy; ${new Date().getFullYear()} Platforma Lektorów. Wszystkie prawa zastrzeżone.</p>
                    </div>
                </div>
            </footer>

            <!-- Notification Container -->
            <div id="notification-container" class="notification-container"></div>

            <!-- Back to Top Button -->
            <button id="back-to-top" class="back-to-top" aria-label="Wróć na górę">
                <i class="fas fa-chevron-up"></i>
            </button>
        `
  }

  private setupLayoutEventListeners(): void {
    // Navigation link handling
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const link = target.closest('[data-route]') as HTMLElement

      if (link) {
        e.preventDefault()
        const route = link.getAttribute('data-route')
        if (route) {
          this.router.navigate(route)
        }
      }
    })

    // Auth button handling
    const loginBtn = document.querySelector('.login-btn')
    const registerBtn = document.querySelector('.register-btn')
    const logoutBtn = document.querySelector('.logout-btn')

    loginBtn?.addEventListener('click', () => {
      authModal.show('login')
    })

    registerBtn?.addEventListener('click', () => {
      authModal.show('register')
    })

    logoutBtn?.addEventListener('click', async () => {
      await authService.logout()
    })

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn')
    const mobileMenu = document.querySelector('.mobile-menu')

    mobileMenuBtn?.addEventListener('click', () => {
      mobileMenu?.classList.toggle('active')
      const icon = mobileMenuBtn.querySelector('i')
      if (mobileMenu?.classList.contains('active')) {
        icon?.classList.replace('fa-bars', 'fa-times')
      } else {
        icon?.classList.replace('fa-times', 'fa-bars')
      }
    })

    // Back to top button
    const backToTopBtn = document.getElementById('back-to-top')
    backToTopBtn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn?.classList.add('visible')
      } else {
        backToTopBtn?.classList.remove('visible')
      }
    })
  }

  private initGlobalEvents(): void {
    // Global error handling
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error)
    })

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason)
    })

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && authModal.isModalVisible()) {
        authModal.hide()
      }
    })
  }

  private initNotifications(): void {
    document.addEventListener('notification:show', (e: Event) => {
      const customEvent = e as CustomEvent<NotificationEventDetail>
      const { type, message } = customEvent.detail
      this.showNotification(type, message)
    })
  }

  private handleAuthChange(detail: AuthChangeEventDetail): void {
    console.log('Auth state changed:', detail)

    this.updateNavigation()

    if (detail.type === 'login' || detail.type === 'register') {
      this.handleSuccessfulAuth(detail.user)
    } else if (detail.type === 'logout') {
      this.handleLogout()
    }
  }

  private updateNavigation(): void {
    const isAuthenticated = authService.isAuthenticated()
    const user = authService.getUser()

    const guestNav = document.getElementById('guest-nav')
    const userNav = document.getElementById('user-nav')

    if (isAuthenticated && user) {
      guestNav!.style.display = 'none'
      userNav!.style.display = 'block'

      // Update user info
      const userAvatar = document.getElementById('user-avatar') as HTMLImageElement
      const userName = document.getElementById('user-name')!
      const dropdownUserName = document.getElementById('dropdown-user-name')!
      const dropdownUserRole = document.getElementById('dropdown-user-role')!
      const dropdownUserEmail = document.getElementById('dropdown-user-email')!

      userAvatar.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&color=e91e63&background=f8fafc`
      userAvatar.alt = user.name
      userName.textContent = user.name
      dropdownUserName.textContent = user.name
      dropdownUserRole.textContent = this.getRoleDisplayName(user.role)
      dropdownUserEmail.textContent = user.email

      // Update role-specific links
      this.updateRoleSpecificLinks(user.role)

    } else {
      guestNav!.style.display = 'flex'
      userNav!.style.display = 'none'
    }

    // Update mobile navigation
    this.updateMobileNavigation(isAuthenticated, user)
  }

  private updateRoleSpecificLinks(role: string): void {
    const roleLinksContainer = document.getElementById('role-specific-links')!

    let roleLinks = ''
    switch (role) {
      case 'admin':
        roleLinks = `
                    <a href="/admin/dashboard" data-route="/admin/dashboard" class="dropdown-item">
                        <i class="fas fa-tachometer-alt"></i>
                        Panel Admin
                    </a>
                `
        break
      case 'moderator':
        roleLinks = `
                    <a href="/moderator/dashboard" data-route="/moderator/dashboard" class="dropdown-item">
                        <i class="fas fa-shield-alt"></i>
                        Panel Moderatora
                    </a>
                `
        break
      case 'tutor':
        roleLinks = `
                    <a href="/tutor/dashboard" data-route="/tutor/dashboard" class="dropdown-item">
                        <i class="fas fa-chalkboard-teacher"></i>
                        Panel Lektora
                    </a>
                    <a href="/tutor/lessons" data-route="/tutor/lessons" class="dropdown-item">
                        <i class="fas fa-calendar"></i>
                        Moje lekcje
                    </a>
                `
        break
      case 'student':
        roleLinks = `
                    <a href="/student/dashboard" data-route="/student/dashboard" class="dropdown-item">
                        <i class="fas fa-graduation-cap"></i>
                        Panel Ucznia
                    </a>
                    <a href="/student/lessons" data-route="/student/lessons" class="dropdown-item">
                        <i class="fas fa-book"></i>
                        Moje lekcje
                    </a>
                `
        break
    }

    roleLinksContainer.innerHTML = roleLinks
  }

  private updateMobileNavigation(isAuthenticated: boolean, user: any): void {
    const mobileAuthLinks = document.getElementById('mobile-auth-links')!

    if (isAuthenticated && user) {
      let mobileLinks = ''

      // Add role-specific links
      switch (user.role) {
        case 'admin':
          mobileLinks += `<li><a href="/admin/dashboard" data-route="/admin/dashboard">Panel Admin</a></li>`
          break
        case 'moderator':
          mobileLinks += `<li><a href="/moderator/dashboard" data-route="/moderator/dashboard">Panel Moderatora</a></li>`
          break
        case 'tutor':
          mobileLinks += `
                        <li><a href="/tutor/dashboard" data-route="/tutor/dashboard">Panel Lektora</a></li>
                        <li><a href="/tutor/lessons" data-route="/tutor/lessons">Moje lekcje</a></li>
                    `
          break
        case 'student':
          mobileLinks += `
                        <li><a href="/student/dashboard" data-route="/student/dashboard">Panel Ucznia</a></li>
                        <li><a href="/student/lessons" data-route="/student/lessons">Moje lekcje</a></li>
                    `
          break
      }

      mobileLinks += `
                <li><a href="/profile" data-route="/profile">Profil</a></li>
                <li><button class="mobile-logout-btn logout-btn">Wyloguj się</button></li>
            `

      mobileAuthLinks.innerHTML = mobileLinks

      // Setup mobile logout button
      const mobileLogoutBtn = mobileAuthLinks.querySelector('.mobile-logout-btn')
      mobileLogoutBtn?.addEventListener('click', async () => {
        await authService.logout()
      })

    } else {
      mobileAuthLinks.innerHTML = `
                <li><button class="mobile-login-btn">Zaloguj się</button></li>
                <li><button class="mobile-register-btn">Dołącz do nas</button></li>
            `

      // Setup mobile auth buttons
      const mobileLoginBtn = mobileAuthLinks.querySelector('.mobile-login-btn')
      const mobileRegisterBtn = mobileAuthLinks.querySelector('.mobile-register-btn')

      mobileLoginBtn?.addEventListener('click', () => {
        authModal.show('login')
      })

      mobileRegisterBtn?.addEventListener('click', () => {
        authModal.show('register')
      })
    }
  }

  private updateNavigationHighlight(): void {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-links a, .mobile-nav-links a').forEach(link => {
      link.classList.remove('active')
    })

    // Add active class to current page link
    const currentPath = window.location.pathname
    const currentLink = document.querySelector(`[data-route="${currentPath}"]`)
    currentLink?.classList.add('active')
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

  private handleSuccessfulAuth(user: any): void {
    // Close auth modal if open
    if (authModal.isModalVisible()) {
      authModal.hide()
    }

    // Redirect based on role and current path
    const currentPath = window.location.pathname
    const authPages = ['/login', '/register', '/forgot-password']

    if (authPages.includes(currentPath) || currentPath === '/') {
      let redirectUrl = '/'

      switch (user.role) {
        case 'admin':
          redirectUrl = '/admin/dashboard'
          break
        case 'moderator':
          redirectUrl = '/moderator/dashboard'
          break
        case 'tutor':
          redirectUrl = '/tutor/dashboard'
          break
        case 'student':
          redirectUrl = '/student/dashboard'
          break
      }

      this.showNotification('success', `Witamy ${user.name}! Przekierowujemy...`)
      setTimeout(() => {
        this.router.navigate(redirectUrl)
      }, 1000)
    }
  }

  private handleLogout(): void {
    // Redirect to homepage if on protected page
    const currentPath = window.location.pathname
    const protectedPaths = ['/admin', '/moderator', '/tutor', '/student', '/profile']

    if (protectedPaths.some(path => currentPath.startsWith(path))) {
      this.router.navigate('/')
    }

    this.showNotification('info', 'Wylogowano pomyślnie')
  }

  private renderForgotPasswordPage(): void {
    this.mainContent.innerHTML = `
            <div class="auth-page">
                <div class="container">
                    <div class="auth-container">
                        <div class="auth-card">
                            <div class="auth-header">
                                <h1>Resetuj hasło</h1>
                                <p>Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła</p>
                            </div>
                            <form id="forgot-password-form" class="auth-form">
                                <div class="form-group">
                                    <label for="email">Email</label>
                                    <input type="email" id="email" name="email" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">
                                    <span class="btn-text">Wyślij link resetujący</span>
                                </button>
                            </form>
                            <div class="auth-links">
                                <button class="link-button" data-route="/login">Powrót do logowania</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  private renderProfilePage(): void {
    const user = authService.getUser()
    this.mainContent.innerHTML = `
            <div class="profile-page">
                <div class="container">
                    <h1>Profil użytkownika</h1>
                    <div class="profile-card">
                        <h2>Witaj, ${user?.name}!</h2>
                        <p>Email: ${user?.email}</p>
                        <p>Rola: ${this.getRoleDisplayName(user?.role || '')}</p>
                        <button class="btn btn-primary" data-notification="Edycja profilu w budowie!">
                            Edytuj profil
                        </button>
                    </div>
                </div>
            </div>
        `
  }

  private render404Page(): void {
    this.mainContent.innerHTML = `
            <div class="error-page">
                <div class="container">
                    <div class="error-content">
                        <h1>404</h1>
                        <h2>Strona nie została znaleziona</h2>
                        <p>Przepraszamy, ale strona której szukasz nie istnieje.</p>
                        <button class="btn btn-primary" data-route="/">
                            <i class="fas fa-home"></i>
                            Powrót do strony głównej
                        </button>
                    </div>
                </div>
            </div>
        `
  }

  public showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    const container = document.getElementById('notification-container')
    if (!container) return

    const notification = document.createElement('div')
    notification.className = `notification-toast ${type}`
    notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button style="margin-left: auto; background: none; border: none; font-size: 1.2rem; opacity: 0.7; cursor: pointer;" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `

    container.appendChild(notification)

    // Add entrance animation
    setTimeout(() => {
      notification.classList.add('show')
    }, 10)

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => {
        notification.remove()
      }, 300)
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

  // Utility methods
  public static getInstance(): TutoringApp {
    return (window as any).tutoringApp
  }

  public getRouter(): Router {
    return this.router
  }

  public getAuthService(): typeof authService {
    return authService
  }

  public getAuthModal(): typeof authModal {
    return authModal
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new TutoringApp()
  ;(window as any).tutoringApp = app // Make it globally accessible for debugging
})

// Expose utilities globally for convenience
;(window as any).showNotification = (type: string, message: string) => {
  const app = TutoringApp.getInstance()
  if (app) {
    app.showNotification(type as any, message)
  }
}

;(window as any).authService = authService
;(window as any).authModal = authModal