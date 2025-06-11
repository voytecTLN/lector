// resources/ts/main.ts - Poprawiony dla branch fix/auth z obsługą Sanctum

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
  private isInitializing = false;

  constructor() {
    console.log('🎯 Platforma Lektorów initializing...')
  }

  public async init(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      console.warn('App already initialized or initializing');
      return;
    }

    this.isInitializing = true;

    try {
      console.log('🚀 Starting TutoringApp initialization...');

      // 1. Initialize CSRF protection first (critical for Sanctum)
      await this.initCSRFProtection();

      // 2. Initialize authentication (depends on CSRF)
      await this.initAuthentication();

      // 3. Initialize homepage functionality (only on homepage)
      this.initHomepage();

      // 4. Initialize global event listeners
      this.initGlobalEvents();

      // 5. Initialize notifications system
      this.initNotifications();

      // 6. Initialize route protection
      this.initRouteProtection();

      // 7. Initialize dashboard features if on dashboard page
      this.initDashboardFeatures();

      this.isInitialized = true;
      this.isInitializing = false;

      console.log('✅ TutoringApp initialized successfully');

    } catch (error) {
      this.isInitializing = false;
      console.error('❌ Failed to initialize TutoringApp:', error);
      this.showNotification('error', 'Błąd inicjalizacji aplikacji');
      throw error;
    }
  }

  /**
   * Initialize CSRF protection for Sanctum - MUST be first
   */
  private async initCSRFProtection(): Promise<void> {
    try {
      console.log('🔐 Initializing CSRF protection...');

      // For Sanctum, we need to get CSRF cookie first
      const response = await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`CSRF initialization failed: ${response.status}`);
      }

      console.log('✅ CSRF token initialized for Sanctum');
    } catch (error) {
      console.error('❌ CSRF initialization failed:', error);
      // Don't throw here - allow app to continue with degraded functionality
    }
  }

  private async initAuthentication(): Promise<void> {
    try {
      console.log('🔑 Initializing authentication...');

      // Check if user has existing token
      const token = authService.getToken();
      if (token) {
        console.log('Found existing token, verifying with server...');
        try {
          // Verify token is still valid by getting current user
          const user = await authService.getCurrentUser();
          if (user) {
            console.log('✅ User authenticated from stored token:', user.name);
          }
        } catch (error) {
          console.log('⚠️ Stored token invalid, clearing auth data...');
          authService.logout(); // This will clear localStorage
        }
      } else {
        console.log('No existing token found');
      }

      // Listen for auth state changes
      document.addEventListener('auth:change', (e: Event) => {
        const customEvent = e as CustomEvent<AuthChangeEventDetail>;
        this.handleAuthChange(customEvent.detail);
      });

      // Update navigation to reflect current auth state
      this.updateNavigation();

    } catch (error) {
      console.error('❌ Authentication initialization failed:', error);
      // Clear any corrupted auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_permissions');
    }
  }

  private initHomepage(): void {
    if (this.isHomepage()) {
      console.log('📱 Initializing homepage functionality...');
      this.homepage = new Homepage();
    }
  }

  private isHomepage(): boolean {
    return document.querySelector('.hero') !== null;
  }

  private isDashboard(): boolean {
    return document.querySelector('.dashboard-container') !== null;
  }

  private initGlobalEvents(): void {
    console.log('🎧 Setting up global event listeners...');

    // Handle authentication button clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Login button clicks
      if (target.matches('.login-btn') || target.closest('.login-btn')) {
        e.preventDefault();
        this.handleLoginClick();
        return;
      }

      // Register button clicks
      if (target.matches('.register-btn') || target.closest('.register-btn')) {
        e.preventDefault();
        this.handleRegisterClick();
        return;
      }

      // Logout button clicks
      if (target.matches('.logout-btn') || target.closest('.logout-btn')) {
        e.preventDefault();
        this.handleLogoutClick();
        return;
      }

      // CTA button clicks for homepage
      if (target.matches('.btn[href^="#"]') || target.closest('.btn[href^="#"]')) {
        const btn = target.matches('.btn') ? target : target.closest('.btn');
        const href = btn?.getAttribute('href');
        if (href) {
          e.preventDefault();
          const targetName = href.substring(1);
          this.homepage?.handleCTAClick(targetName);
        }
        return;
      }

      // Notification close buttons
      if (target.matches('.notification-toast .fa-times') || target.closest('.notification-toast .fa-times')) {
        const notification = target.closest('.notification-toast') as HTMLElement;
        notification?.remove();
        return;
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape key handling
      if (e.key === 'Escape') {
        // Close mobile menu if open
        const mobileMenu = document.querySelector('.mobile-menu.active');
        if (mobileMenu) {
          const mobileMenuBtn = document.querySelector('.mobile-menu-btn') as HTMLElement;
          mobileMenuBtn?.click();
          return;
        }

        // Close auth modal if open
        if (authModal.isVisible()) {
          authModal.hide();
          return;
        }
      }
    });

    // Handle page visibility changes (user switching tabs)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && authService.isAuthenticated()) {
        // Re-verify authentication when user returns to tab
        this.verifyAuthenticationOnFocus();
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      this.showNotification('success', 'Połączenie z internetem zostało przywrócone');
    });

    window.addEventListener('offline', () => {
      console.log('📡 Connection lost');
      this.showNotification('warning', 'Brak połączenia z internetem');
    });
  }

  private async verifyAuthenticationOnFocus(): Promise<void> {
    try {
      // Silently verify if user is still authenticated
      await authService.getCurrentUser();
    } catch (error) {
      console.log('Authentication expired, logging out...');
      authService.logout();
    }
  }

  private initNotifications(): void {
    console.log('🔔 Setting up notification system...');

    // Listen for notification events
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
    this.createNotificationContainer();
  }

  private createNotificationContainer(): void {
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                width: 100%;
                pointer-events: none;
            `;
      document.body.appendChild(container);
    }
  }

  private initRouteProtection(): void {
    console.log('🛡️ Setting up route protection...');

    // Check current route access
    this.checkCurrentRouteAccess();
console.log('this.checkCurrentRouteAccess();')
console.log(this.checkCurrentRouteAccess());
    // Listen for route changes (for SPA navigation)
    window.addEventListener('popstate', () => {
      this.checkCurrentRouteAccess();
    });
  }

  private initDashboardFeatures(): void {
    if (this.isDashboard()) {
      const path = window.location.pathname;
      console.log(`📊 Initializing dashboard features for: ${path}`);

      // Initialize specific dashboard based on path
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
    console.log('👑 Initializing admin dashboard...');
    // Admin-specific initialization
  }

  private initTutorDashboard(): void {
    console.log('👨‍🏫 Initializing tutor dashboard...');
    // Tutor-specific initialization
  }

  private initStudentDashboard(): void {
    console.log('🎓 Initializing student dashboard...');
    // Student-specific initialization
  }

  private initModeratorDashboard(): void {
    console.log('🛡️ Initializing moderator dashboard...');
    // Moderator-specific initialization
  }

  private async checkCurrentRouteAccess(): Promise<void> {
    const path = window.location.pathname;
    const routeConfig = this.getRouteConfig(path);
console.log('path,routeConfig');
console.log(path, routeConfig);
console.log('window.location.pathname');
console.log(window.location.pathname);
    // throw new Error('error');
    if (routeConfig) {
      try {
        const hasAccess = await routeGuard.checkAccess(routeConfig);
        if (!hasAccess) {
          console.log(`🚫 Access denied to ${path}`);
        }
      } catch (error) {
        console.error('Route access check failed:', error);
      }
    }
  }

  private getRouteConfig(path: string): any {
    const routes: Record<string, any> = {
      '/admin': { requiresAuth: true, requiresVerification: true, roles: ['admin'] },
      '/admin/dashboard': { requiresAuth: true, requiresVerification: true, roles: ['admin'] },
      '/moderator/dashboard': { requiresAuth: true, requiresVerification: true, roles: ['moderator', 'admin'] },
      '/tutor/dashboard': { requiresAuth: true, requiresVerification: true, roles: ['tutor', 'admin'] },
      '/student/dashboard': { requiresAuth: true, requiresVerification: true, roles: ['student', 'admin'] },
      '/profile': { requiresAuth: true, requiresVerification: true }
    };
console.log('path');
console.log(path);
    // Exact match first
    if (routes[path]) {
      return routes[path];
    }

    // Pattern matching
    for (const [pattern, config] of Object.entries(routes)) {
      if (path.startsWith(pattern)) {
        return config;
      }
    }

    return null;
  }

  private handleAuthChange(detail: AuthChangeEventDetail): void {
    console.log('🔄 Auth state changed:', detail.type, detail.isAuthenticated);

    // Update UI to reflect auth state
    this.updateNavigation();

    // Handle specific auth events
    if (detail.type === 'login' || detail.type === 'register') {
      this.handleSuccessfulAuth(detail.user);
    } else if (detail.type === 'logout') {
      this.handleLogout();
    }
  }

  private updateNavigation(): void {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getUser();

    console.log('🔄 Updating navigation - authenticated:', isAuthenticated);

    // Elements to update
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userMenus = document.querySelectorAll('.user-menu');
    const logoutButtons = document.querySelectorAll('.logout-btn');

    if (isAuthenticated && user) {
      // Hide auth buttons, show user menu
      authButtons.forEach(btn => (btn as HTMLElement).style.display = 'none');
      userMenus.forEach(menu => {
        (menu as HTMLElement).style.display = 'block';

        // Update user info in menu
        const userName = menu.querySelector('.user-name');
        const userRole = menu.querySelector('.user-role');
        if (userName) userName.textContent = user.name;
        if (userRole) userRole.textContent = this.getRoleDisplayName(user.role);
      });
      logoutButtons.forEach(btn => (btn as HTMLElement).style.display = 'inline-flex');

    } else {
      // Show auth buttons, hide user menu
      authButtons.forEach(btn => (btn as HTMLElement).style.display = 'flex');
      userMenus.forEach(menu => (menu as HTMLElement).style.display = 'none');
      logoutButtons.forEach(btn => (btn as HTMLElement).style.display = 'none');
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
      console.log('🔑 Opening login modal');
      authModal.show('login');
    } else {
      console.log('🔑 Redirecting to login page');
      window.location.href = '/login';
    }
  }

  private handleRegisterClick(): void {
    if (this.isHomepage()) {
      console.log('📝 Opening register modal');
      authModal.show('register');
    } else {
      console.log('📝 Redirecting to register page');
      window.location.href = '/register';
    }
  }

  private async handleLogoutClick(): Promise<void> {
    console.log('🚪 Logging out user...');

    try {
      await authService.logout();
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout locally even if server request fails
      authService.logout();
    }
  }

  private handleSuccessfulAuth(user: any): void {
    console.log('✅ Handling successful authentication for:', user.name);

    // Close auth modal if open
    if (authModal.isVisible()) {
      authModal.hide();
    }

    // Only redirect if on auth pages or homepage
    const currentPath = window.location.pathname;
    const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];

    if (authPages.includes(currentPath) || currentPath === '/') {
      const redirectUrl = this.getDashboardUrl(user.role);

      console.log(`🔄 Redirecting to: ${redirectUrl}`);
      this.showNotification('success', `Witamy ${user.name}! Przekierowujemy...`);

      // Delay redirect slightly to show notification
      setTimeout(() => {
        window.location.replace(redirectUrl);
      }, 1000);
    }
  }

  private getDashboardUrl(role: string): string {
    const dashboards = {
      'admin': '/admin/dashboard',
      'moderator': '/moderator/dashboard',
      'tutor': '/tutor/dashboard',
      'student': '/student/dashboard'
    };
    return dashboards[role as keyof typeof dashboards] || '/';
  }

  private handleLogout(): void {
    console.log('🚪 Handling logout cleanup...');

    // Redirect if on protected page
    const currentPath = window.location.pathname;
    const protectedPaths = ['/admin', '/moderator', '/tutor', '/student', '/profile'];

    if (protectedPaths.some(path => currentPath.startsWith(path))) {
      console.log('🔄 Redirecting to homepage after logout');
      window.location.href = '/';
    }
  }

  public showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    if (this.homepage) {
      this.homepage.showNotification(type, message);
    } else {
      this.createNotification(type, message);
    }
  }

  private createNotification(type: string, message: string): void {
    const container = document.getElementById('notification-container');
    if (!container) {
      this.createNotificationContainer();
      return this.createNotification(type, message);
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
            pointer-events: auto;
        `;

    notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getNotificationIcon(type)}" style="color: ${this.getNotificationColor(type)}; font-size: 1.1rem;"></i>
                <span style="flex: 1; color: #1e293b; font-weight: 500; font-size: 0.9rem;">${message}</span>
                <button style="background: none; border: none; font-size: 1.1rem; opacity: 0.7; cursor: pointer; padding: 4px; border-radius: 2px;" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times" style="color: #64748b;"></i>
                </button>
            </div>
        `;

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
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
    // Show first error from each field
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      if (fieldErrors.length > 0) {
        this.showNotification('error', `${field}: ${fieldErrors[0]}`);
      }
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

// Add notification animation styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Global error handling
window.addEventListener('error', (e) => {
  console.error('🚨 Global JavaScript error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 Unhandled promise rejection:', e.reason);
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 DOM ready, initializing TutoringApp...');
    const app = new TutoringApp();
    await app.init();

    // Make globally accessible
    window.tutoringApp = app;

    console.log('🎉 TutoringApp fully initialized!');
  } catch (error) {
    console.error('💥 Failed to initialize TutoringApp:', error);
  }
});

// Expose utilities globally for Blade templates
window.showNotification = (type: string, message: string) => {
  const app = TutoringApp.getInstance();
  if (app) {
    app.showNotification(type as any, message);
  } else {
    console.warn('TutoringApp not initialized yet');
  }
};

window.authService = authService;
window.authModal = authModal;