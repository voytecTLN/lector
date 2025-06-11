// resources/ts/main.ts - SPA Entry Point

import '../css/app.css'
import { authService } from '@services/AuthService'
import { router } from '@/router/Router'

// Custom event interfaces
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
  private isInitialized = false;

  constructor() {
    console.log('🎯 Platforma Lektorów SPA initializing...')
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Initialize authentication first
      await this.initAuthentication();

      // 2. Setup global event listeners
      this.initGlobalEvents();

      // 3. Setup notification system
      this.initNotifications();

      // 4. Initialize router (this will render the current page)
      router.init();

      // 5. Mark app as ready
      this.markAppAsReady();

      this.isInitialized = true;
      console.log('✅ Platforma Lektorów SPA ready!');

    } catch (error) {
      console.error('❌ SPA initialization failed:', error);
      this.showCriticalError('Nie udało się załadować aplikacji');
    }
  }

  private async initAuthentication(): Promise<void> {
    console.log('🔐 Initializing authentication...');

    // Try to get current user if token exists
    if (authService.getToken()) {
      try {
        await authService.getCurrentUser();
        console.log('✅ User authenticated:', authService.getUser());
      } catch (error) {
        console.log('⚠️ Token invalid, user logged out');
        authService.logout();
      }
    }

    // Listen for auth changes
    document.addEventListener('auth:change', (e: Event) => {
      const customEvent = e as CustomEvent<AuthChangeEventDetail>;
      this.handleAuthChange(customEvent.detail);
    });
  }

  private initGlobalEvents(): void {
    console.log('📡 Setting up global event listeners...');

    // Global click handlers for dynamic content
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Handle logout buttons anywhere in the app
      if (target.matches('.logout-btn') || target.closest('.logout-btn')) {
        e.preventDefault();
        this.handleLogoutClick();
      }

      // Handle notification close buttons
      if (target.matches('.notification-close') || target.closest('.notification-close')) {
        const notification = target.closest('.notification-toast') as HTMLElement;
        notification?.remove();
      }
    });

    // Global keyboard events
    document.addEventListener('keydown', (e) => {
      // Escape key to close modals/notifications
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });

    // Handle route changes
    window.addEventListener('route:change', (e: Event) => {
      const customEvent = e as CustomEvent<{ route: any, path: string }>;
      this.handleRouteChange(customEvent.detail);
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.showNotification('success', 'Połączenie internetowe przywrócone');
    });

    window.addEventListener('offline', () => {
      this.showNotification('warning', 'Brak połączenia internetowego');
    });
  }

  private initNotifications(): void {
    console.log('🔔 Setting up notification system...');

    // Listen for custom notification events
    document.addEventListener('notification:show', (e: Event) => {
      const customEvent = e as CustomEvent<NotificationEventDetail>;
      const { type, message } = customEvent.detail;
      this.showNotification(type, message);
    });

    // Listen for form validation errors
    document.addEventListener('form:validationError', (e: Event) => {
      const customEvent = e as CustomEvent<{ errors: Record<string, string[]> }>;
      const { errors } = customEvent.detail;
      this.handleFormValidationErrors(errors);
    });
  }

  private handleAuthChange(detail: AuthChangeEventDetail): void {
    console.log('🔄 Auth state changed:', detail);

    if (detail.type === 'login' || detail.type === 'register') {
      this.showNotification('success', `Witamy ${detail.user?.name || 'w aplikacji'}!`);
    } else if (detail.type === 'logout') {
      this.showNotification('info', 'Wylogowano pomyślnie');
      // Redirect to home page after logout
      router.navigate('/');
    }
  }

  private handleRouteChange(detail: { route: any, path: string }): void {
    console.log('🛣️ Route changed:', detail.path);

    // Update any global UI based on route
    this.updateGlobalUI(detail.route);
  }

  private updateGlobalUI(route: any): void {
    // Add route-specific classes to body
    document.body.className = document.body.className
        .replace(/route-\S+/g, '')
        .trim();

    if (route.component) {
      document.body.classList.add(`route-${route.component.toLowerCase()}`);
    }

    // Update authentication-dependent UI elements
    const isAuth = authService.isAuthenticated();
    document.body.classList.toggle('user-authenticated', isAuth);
    document.body.classList.toggle('user-guest', !isAuth);
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

  private closeModals(): void {
    // Close any open modals or dropdowns
    document.querySelectorAll('.modal.show, .dropdown.show').forEach(element => {
      element.classList.remove('show');
    });
  }

  public showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Zamknij">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add entrance animation
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    container.appendChild(notification);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
      notification.style.transition = 'all 0.3s ease-in-out';
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification);
    }, 5000);
  }

  private removeNotification(notification: HTMLElement): void {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    setTimeout(() => {
      notification.remove();
    }, 300);
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
    // Show first error as notification
    const firstField = Object.keys(errors)[0];
    const firstError = errors[firstField]?.[0];

    if (firstError) {
      this.showNotification('error', `${firstField}: ${firstError}`);
    }
  }

  private markAppAsReady(): void {
    // Hide loading spinner
    document.body.classList.add('app-ready');

    // Dispatch app ready event
    window.dispatchEvent(new CustomEvent('app:ready'));
  }

  private showCriticalError(message: string): void {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    appContainer.innerHTML = `
      <div class="critical-error">
        <div class="error-container">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>Błąd krytyczny</h2>
          <p>${message}</p>
          <button onclick="window.location.reload()" class="btn btn-primary">
            <i class="fas fa-redo"></i>
            Odśwież stronę
          </button>
        </div>
      </div>
    `;

    // Add error styles
    const style = document.createElement('style');
    style.textContent = `
      .critical-error {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #ff6b35 0%, #e91e63 100%);
        color: white;
        text-align: center;
        padding: 2rem;
      }
      .error-container i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.8;
      }
      .error-container h2 {
        margin-bottom: 1rem;
        font-size: 2rem;
      }
      .error-container p {
        margin-bottom: 2rem;
        font-size: 1.1rem;
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }

  // Public utilities
  public getRouter() {
    return router;
  }

  public getAuthService() {
    return authService;
  }
}

// Global error handling
window.addEventListener('error', (e) => {
  console.error('❌ Global error:', e.error);
  // In production, send to error tracking service
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Unhandled promise rejection:', e.reason);
  // In production, send to error tracking service
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new TutoringApp();
  await app.init();

  // Make app globally accessible for debugging
  (window as any).tutoringApp = app;
});

// Expose utilities globally for dynamic content
(window as any).showNotification = (type: string, message: string) => {
  const app = (window as any).tutoringApp;
  if (app) {
    app.showNotification(type, message);
  }
};

(window as any).authService = authService;
(window as any).router = router;