// resources/ts/main.ts - Poprawiony z ulepszoną obsługą autentykacji

import '../css/app.css'
import { Homepage } from './pages/homepage'
import { authService } from '@services/AuthService'
import { authModal } from '@components/auth/AuthModal'
import { routeGuard } from '@components/RouteGuard'

// Rozszerzenie globalne dla typów Window
declare global {
  interface Window {
    tutoringApp: TutoringApp;
    showNotification: (type: string, message: string) => void;
    authService: typeof authService;
    authModal: typeof authModal;
  }
}

// Custom event interfaces
interface NotificationEventDetail {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ValidationErrorEventDetail {
  errors: Record<string, string[]>;
}

interface AuthChangeEventDetail {
  type: 'login' | 'logout' | 'register';
  user: any;
  isAuthenticated: boolean;
}

class TutoringApp {
  private homepage: Homepage | null = null;
  private isInitialized = false;

  constructor() {
    console.log('🎯 Platforma Lektorów initialized!')
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('App already initialized');
      return;
    }

    try {
      console.log('Initializing TutoringApp...');

      // Initialize authentication first
      await this.initAuthentication();

      // Initialize homepage functionality (tylko na stronie głównej)
      this.initHomepage();

      // Initialize global event listeners
      this.initGlobalEvents();

      // Initialize notifications
      this.initNotifications();

      // Initialize route protection
      this.initRouteProtection();

      // Initialize dashboard features if on dashboard page
      this.initDashboardFeatures();

      // Initialize CSRF protection
      await this.initCSRFProtection();

      this.isInitialized = true;
      console.log('✅ TutoringApp initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize TutoringApp:', error);
      this.showNotification('error', 'Błąd inicjalizacji aplikacji');
    }
  }

  private async initCSRFProtection(): Promise<void> {
    try {
      // Inicjalizuj CSRF token dla Sanctum
      await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin'
      });
      console.log('✅ CSRF token initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize CSRF token:', error);
    }
  }

  private async initAuthentication(): Promise<void> {
    try {
      console.log('Initializing authentication...');

      // Sprawdź czy użytkownik jest już zalogowany (token w localStorage)
      const token = authService.getToken();
      if (token) {
        console.log('Found existing token, verifying...');
        try {
          // Sprawdź czy token jest nadal ważny
          await authService.getCurrentUser();
          console.log('✅ User authenticated:', authService.getUser());
        } catch (error) {
          console.log('⚠️ Token invalid, clearing...');
          authService.logout();
        }
      } else {
        console.log('No existing token found');
      }

      // Listen for auth changes
      document.addEventListener('auth:change', (e: Event) => {
        const customEvent = e as CustomEvent<AuthChangeEventDetail>;
        this.handleAuthChange(customEvent.detail);
      });

      // Update navigation based on auth state
      this.updateNavigation();

    } catch (error) {
      console.error('Authentication initialization failed:', error);
    }
  }

  private initHomepage(): void {
    // Only initialize homepage if we're on the homepage
    if (this.isHomepage()) {
      console.log('Initializing homepage...');
      this.homepage = new Homepage();
    }
  }

  private isHomepage(): boolean {
    // Check if we're on the homepage by looking for hero section
    return document.querySelector('.hero') !== null;
  }

  private isDashboard(): boolean {
    // Check if we're on any dashboard page
    return document.querySelector('.dashboard-container') !== null;
  }

  private initGlobalEvents(): void {
    console.log('Initializing global events...');

    // Global click handlers
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Handle login button clicks
      if (target.matches('.login-btn') || target.closest('.login-btn')) {
        e.preventDefault();
        this.handleLoginClick();
      }

      // Handle register button clicks
      if (target.matches('.register-btn') || target.closest('.register-btn')) {
        e.preventDefault();
        this.handleRegisterClick();
      }

      // Handle logout button clicks
      if (target.matches('.logout-btn') || target.closest('.logout-btn')) {
        e.preventDefault();
        this.handleLogoutClick();
      }

      // Handle CTA button clicks
      if (target.matches('.btn[href^="#"]') || target.closest('.btn[href^="#"]')) {
        const btn = target.matches('.btn') ? target : target.closest('.btn');
        const href = btn?.getAttribute('href');
        if (href) {
          e.preventDefault();
          const targetName = href.substring(1);
          this.homepage?.handleCTAClick(targetName);
        }
      }

      // Handle notification close buttons
      if (target.matches('.notification-toast .fa-times') || target.closest('.notification-toast .fa-times')) {
        const notification = target.closest('.notification-toast') as HTMLElement;
        notification?.remove();
      }
    });

    // Global keyboard events
    document.addEventListener('keydown', (e) => {
      // Escape key to close mobile menu or auth modal
      if (e.key === 'Escape') {
        const mobileMenu = document.querySelector('.mobile-menu.active');
        if (mobileMenu) {
          const mobileMenuBtn = document.querySelector('.mobile-menu-btn') as HTMLElement;
          mobileMenuBtn?.click();
        }

        if (authModal.isVisible()) {
          authModal.hide();
        }
      }

      // Space or Enter on back to top button
      if ((e.key === ' ' || e.key === 'Enter') && e.target === document.querySelector('.back-to-top')) {
        e.preventDefault();
        (e.target as HTMLElement).click();
      }
    });

    // Handle beforeunload for form changes
    window.addEventListener('beforeunload', (e) => {
      // Można tutaj sprawdzić czy są niezapisane zmiany w formularzach
      // i ostrzec użytkownika
    });
  }

  private initNotifications(): void {
    // Listen for custom notification events
    document.addEventListener('notification:show', (e: Event) => {
      const customEvent = e as CustomEvent<NotificationEventDetail>;
      const { type, message } = customEvent.detail;
      this.showNotification(type, message);
    });

    // Listen for form validation errors
    document.addEventListener('form:validationError', (e: Event) => {
      const customEvent = e as CustomEvent<ValidationErrorEventDetail>;
      const { errors } = customEvent.detail;
      this.handleFormValidationErrors(errors);
    });

    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
  }

  private initRouteProtection(): void {
    // Check route access on page load
    this.checkCurrentRouteAccess();

    // Listen for navigation events (if using SPA routing)
    window.addEventListener('popstate', () => {
      this.checkCurrentRouteAccess();
    });
  }

  private initDashboardFeatures(): void {
    // Initialize dashboard-specific features if on dashboard page
    if (this.isDashboard()) {
      const path = window.location.pathname;
      console.log(`Initializing dashboard features for: ${path}`);

      if (path.includes('/admin/dashboard')) {
        this.initAdminDashboard();
      } else if (path.includes('/tutor/dashboard')) {
        this.initTutorDashboard();
      } else if (path.includes('/student/dashboard')) {
        this.initStudentDashboard();
      } else if (path.includes('/moderator/dashboard')) {
        this.initModeratorDashboard();
      }
    }
  }

  private initAdminDashboard(): void {
    console.log('Initializing admin dashboard...');
    // Load admin-specific dashboard functionality
  }

  private initTutorDashboard(): void {
    console.log('Initializing tutor dashboard...');
    // Load tutor-specific dashboard functionality
  }

  private initStudentDashboard(): void {
    console.log('Initializing student dashboard...');
    // Load student-specific dashboard functionality
  }

  private initModeratorDashboard(): void {
    console.log('Initializing moderator dashboard...');
    // Load moderator-specific dashboard functionality
  }

  private async checkCurrentRouteAccess(): Promise<void> {
    const path = window.location.pathname;
    const routeConfig = this.getRouteConfig(path);

    if (routeConfig) {
      const hasAccess = await routeGuard.checkAccess(routeConfig);
      if (!hasAccess) {
        console.log(`Access denied to ${path}`);
        return;
      }
    }
  }

  private getRouteConfig(path: string): any {
    const routes: Record<string, any> = {
      '/admin': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['admin']
      },
      '/admin/dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['admin']
      },
      '/moderator/dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['moderator', 'admin']
      },
      '/tutor/dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['tutor', 'admin']
      },
      '/student/dashboard': {
        requiresAuth: true,
        requiresVerification: true,
        roles: ['student', 'admin']
      },
      '/profile': {
        requiresAuth: true,
        requiresVerification: true
      }
    };

    // Check for exact match first
    if (routes[path]) {
      return routes[path];
    }

    // Check for pattern matches
    for (const [pattern, config] of Object.entries(routes)) {
      if (path.startsWith(pattern)) {
        return config;
      }
    }

    return null;
  }

  private handleAuthChange(detail: AuthChangeEventDetail): void {
    console.log('Auth state changed:', detail);

    // Update navigation
    this.updateNavigation();

    // Handle redirections
    if (detail.type === 'login' || detail.type === 'register') {
      this.handleSuccessfulAuth(detail.user);
    } else if (detail.type === 'logout') {
      this.handleLogout();
    }
  }

  private updateNavigation(): void {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getUser();

    console.log('Updating navigation, authenticated:', isAuthenticated);

    // Update login/logout buttons
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userMenus = document.querySelectorAll('.user-menu');
    const logoutButtons = document.querySelectorAll('.logout-btn');

    if (isAuthenticated && user) {
      // Hide auth buttons
      authButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });

      // Show user menus
      userMenus.forEach(menu => {
        (menu as HTMLElement).style.display = 'block';
        // Update user info in menu
        const userName = menu.querySelector('.user-name');
        const userRole = menu.querySelector('.user-role');
        if (userName) userName.textContent = user.name;
        if (userRole) userRole.textContent = this.getRoleDisplayName(user.role);
      });

      // Show logout buttons
      logoutButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'inline-flex';
      });

    } else {
      // Show auth buttons
      authButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'flex';
      });

      // Hide user menus and logout buttons
      userMenus.forEach(menu => {
        (menu as HTMLElement).style.display = 'none';
      });

      logoutButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });
    }
  }

  private getRoleDisplayName(role: string): string {
    const roleNames = {
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'tutor': 'Lektor',
      'student': 'Student'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  }

  private handleLoginClick(): void {
    if (this.isHomepage()) {
      console.log('Showing auth modal for login');
      authModal.show('login');
    } else {
      console.log('Redirecting to login page');
      window.location.href = '/login';
    }
  }

  private handleRegisterClick(): void {
    if (this.isHomepage()) {
      console.log('Showing auth modal for register');
      authModal.show('register');
    } else {
      console.log('Redirecting to register page');
      window.location.href = '/register';
    }
  }

  private async handleLogoutClick(): Promise<void> {
    try {
      console.log('Logging out user...');
      await authService.logout();
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout on client side even if API fails
      authService.logout();
    }
  }

  private handleSuccessfulAuth(user: any): void {
    console.log('Handling successful authentication for:', user);

    // Close auth modal if open
    if (authModal.isVisible()) {
      authModal.hide();
    }

    // Redirect based on role (only if on auth pages or homepage)
    const currentPath = window.location.pathname;
    const authPages = ['/login', '/register', '/forgot-password'];

    if (authPages.includes(currentPath) || currentPath === '/') {
      let redirectUrl = '/';

      switch (user.role) {
        case 'admin':
          redirectUrl = '/admin/dashboard';
          break;
        case 'moderator':
          redirectUrl = '/moderator/dashboard';
          break;
        case 'tutor':
          redirectUrl = '/tutor/dashboard';
          break;
        case 'student':
          redirectUrl = '/student/dashboard';
          break;
      }

      console.log(`Redirecting to: ${redirectUrl}`);

      // Show success message
      this.showNotification('success', `Witamy ${user.name}! Przekierowujemy...`);

      // Use setTimeout to allow notification to show before redirect
      setTimeout(() => {
        window.location.replace(redirectUrl);
      }, 1500);
    }
  }

  private handleLogout(): void {
    console.log('Handling logout');

    // Redirect to homepage if on protected page
    const currentPath = window.location.pathname;
    const protectedPaths = ['/admin', '/moderator', '/tutor', '/student', '/profile'];

    if (protectedPaths.some(path => currentPath.startsWith(path))) {
      console.log('Redirecting to homepage after logout');
      window.location.href = '/';
    }
  }

  public showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    if (this.homepage) {
      this.homepage.showNotification(type, message);
    } else {
      // Fallback notification system for non-homepage
      this.createNotification(type, message);
    }
  }

  private createNotification(type: string, message: string): void {
    let container = document.getElementById('notification-container');

    // Create container if it doesn't exist
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                width: 100%;
            `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-left: 4px solid ${this.getNotificationColor(type)};
            animation: slideInRight 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

    notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getNotificationIcon(type)}" style="color: ${this.getNotificationColor(type)}; font-size: 1.1rem;"></i>
                <span style="flex: 1; color: #1e293b; font-weight: 500;">${message}</span>
                <button style="background: none; border: none; font-size: 1.2rem; opacity: 0.7; cursor: pointer; padding: 4px;" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times" style="color: #64748b;"></i>
                </button>
            </div>
        `;

    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 5000);
  }

  private getNotificationIcon(type: string): string {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }

  private getNotificationColor(type: string): string {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private handleFormValidationErrors(errors: Record<string, string[]>): void {
    // Handle form validation errors
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      fieldErrors.forEach(error => {
        this.showNotification('error', `${field}: ${error}`);
      });
    });
  }

  // Public static methods
  public static getInstance(): TutoringApp {
    return window.tutoringApp;
  }

  public getHomepage(): Homepage | null {
    return this.homepage;
  }

  public getAuthService(): typeof authService {
    return authService;
  }

  public getAuthModal(): typeof authModal {
    return authModal;
  }
}

// CSS dla animacji notyfikacji
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification-container {
        pointer-events: none;
    }

    .notification-toast {
        pointer-events: auto;
    }
`;
document.head.appendChild(notificationStyles);

// Global error handling
window.addEventListener('error', (e) => {
  console.error('🚨 Global error:', e.error);
  // W przyszłości można dodać wysyłanie błędów do serwisu monitoringu
});

// Unhandled promise rejection handling
window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 Unhandled promise rejection:', e.reason);
  // W przyszłości można dodać wysyłanie błędów do serwisu monitoringu
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 DOM loaded, initializing app...');
    const app = new TutoringApp();
    await app.init();

    // Make it globally accessible
    window.tutoringApp = app;

    console.log('✅ App fully initialized and ready');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
  }
});

// Expose utilities globally for Blade templates
window.showNotification = (type: string, message: string) => {
  const app = TutoringApp.getInstance();
  if (app) {
    app.showNotification(type as any, message);
  } else {
    console.error('TutoringApp not initialized yet');
  }
};

window.authService = authService;
window.authModal = authModal;