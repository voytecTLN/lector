import '../css/app.css'
import { Homepage } from './pages/homepage'

// Custom event interfaces
interface NotificationEventDetail {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ValidationErrorEventDetail {
  errors: Record<string, string[]>;
}

class TutoringApp {
  private homepage: Homepage | null = null;

  constructor() {
    console.log('🎯 Platforma Lektorów initialized!')
    this.init()
  }

  private init(): void {
    // Initialize homepage functionality
    this.initHomepage();

    // Initialize global event listeners
    this.initGlobalEvents();

    // Initialize notifications
    this.initNotifications();

    // Initialize form validators (for future use)
    // this.initFormValidators();

    // Initialize authentication service (for future use)
    // this.initAuthService();
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

  private initGlobalEvents(): void {
    // Global click handlers
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

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
      // Escape key to close mobile menu
      if (e.key === 'Escape') {
        const mobileMenu = document.querySelector('.mobile-menu.active');
        if (mobileMenu) {
          const mobileMenuBtn = document.querySelector('.mobile-menu-btn') as HTMLElement;
          mobileMenuBtn?.click();
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

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
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