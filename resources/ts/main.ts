// resources/ts/main.ts - Zaktualizowany z ulepszoną obsługą autentykacji i dashboardów

import '../css/app.css'
import { Homepage } from './pages/homepage'
import { authService } from '@services/AuthService'
import { authModal } from '@components/auth/AuthModal'
import { routeGuard } from '@components/RouteGuard'

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

  constructor() {
    console.log('🎯 Platforma Lektorów initialized!')
    this.init()
  }

  private async init(): Promise<void> {
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
  }

  private async initAuthentication(): Promise<void> {
    // Try to get current user if token exists
    if (authService.getToken()) {
      try {
        await authService.getCurrentUser();
        console.log('User authenticated:', authService.getUser());
      } catch (error) {
        console.log('Token invalid, user logged out');
        authService.logout();
      }
    }

    // Listen for auth changes
    document.addEventListener('auth:change', (e: Event) => {
      const customEvent = e as CustomEvent<AuthChangeEventDetail>;
      this.handleAuthChange(customEvent.detail);
    });

    // Update navigation based on auth state
    this.updateNavigation();
  }

  private initHomepage(): void {
    // Only initialize homepage if we're on the homepage
    if (this.isHomepage()) {
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
      // Load dashboard stats based on current path
      const path = window.location.pathname;

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
        // Access denied - routeGuard will handle redirection
        return;
      }
    }
  }

  private getRouteConfig(path: string): any {
    // Define route protection rules
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

    // Update login/logout buttons
    const loginButtons = document.querySelectorAll('.login-btn');
    const registerButtons = document.querySelectorAll('.register-btn');
    const logoutButtons = document.querySelectorAll('.logout-btn');
    const userMenus = document.querySelectorAll('.user-menu');
    const authButtons = document.querySelectorAll('.auth-buttons');

    if (isAuthenticated && user) {
      // Hide auth buttons
      authButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });

      // Show logout buttons and user menus
      logoutButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'inline-flex';
      });

      userMenus.forEach(menu => {
        (menu as HTMLElement).style.display = 'block';
        // Update user info in menu
        const userName = menu.querySelector('.user-name');
        const userRole = menu.querySelector('.user-role');
        if (userName) userName.textContent = user.name;
        if (userRole) userRole.textContent = this.getRoleDisplayName(user.role);
      });

    } else {
      // Show auth buttons
      authButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'flex';
      });

      // Hide logout buttons and user menus
      logoutButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });

      userMenus.forEach(menu => {
        (menu as HTMLElement).style.display = 'none';
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
      // Show auth modal on homepage
      authModal.show('login');
    } else {
      // Redirect to login page
      window.location.href = '/login';
    }
  }

  private handleRegisterClick(): void {
    if (this.isHomepage()) {
      // Show auth modal on homepage
      authModal.show('register');
    } else {
      // Redirect to register page
      window.location.href = '/register';
    }
  }

  private async handleLogoutClick(): Promise<void> {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if API fails
      authService.logout();
    }
  }

  private handleSuccessfulAuth(user: any): void {
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

      // Show success message
      this.showNotification('success', `Witamy ${user.name}! Przekierowujemy...`);

      // Use location.replace to prevent back button issues
      window.location.replace(redirectUrl);
    }
  }

  private handleLogout(): void {
    // Redirect to homepage if on protected page
    const currentPath = window.location.pathname;
    const protectedPaths = ['/admin', '/moderator', '/tutor', '/student', '/profile'];

    if (protectedPaths.some(path => currentPath.startsWith(path))) {
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
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button style="margin-left: auto; background: none; border: none; font-size: 1.2rem; opacity: 0.7; cursor: pointer;" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    container.appendChild(notification);

    // Add entrance animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
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

  private handleFormValidationErrors(errors: Record<string, string[]>): void {
    // Handle form validation errors
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      fieldErrors.forEach(error => {
        this.showNotification('error', `${field}: ${error}`);
      });
    });
  }

  // Utility methods
  public static getInstance(): TutoringApp {
    return (window as any).tutoringApp;
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

// Global error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  // In production, you might want to send this to an error tracking service
});

// Unhandled promise rejection handling
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  // In production, you might want to send this to an error tracking service
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new TutoringApp();
  (window as any).tutoringApp = app; // Make it globally accessible for debugging
});

// Expose some utilities globally for Blade templates
(window as any).showNotification = (type: string, message: string) => {
  const app = TutoringApp.getInstance();
  if (app) {
    app.showNotification(type as any, message);
  }
};

(window as any).authService = authService;
(window as any).authModal = authModal;