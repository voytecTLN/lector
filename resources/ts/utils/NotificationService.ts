// resources/ts/utils/NotificationService.ts

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
    type: NotificationType;
    message: string;
    duration?: number;
    title?: string;
}

export class NotificationService {
    private static readonly DEFAULT_DURATION = 3000;

    /**
     * Show notification using the global event system
     */
    static show(options: NotificationOptions): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: options.type,
                message: options.message,
                duration: options.duration || this.DEFAULT_DURATION,
                title: options.title
            }
        }));
    }

    /**
     * Show success notification
     */
    static success(message: string, duration?: number): void {
        this.show({
            type: 'success',
            message,
            duration
        });
    }

    /**
     * Show error notification
     */
    static error(message: string, duration?: number): void {
        this.show({
            type: 'error',
            message,
            duration: duration || 5000 // Errors stay longer by default
        });
    }

    /**
     * Show warning notification
     */
    static warning(message: string, duration?: number): void {
        this.show({
            type: 'warning',
            message,
            duration
        });
    }

    /**
     * Show info notification
     */
    static info(message: string, duration?: number): void {
        this.show({
            type: 'info',
            message,
            duration
        });
    }

    /**
     * Show validation error notification
     */
    static validationError(message: string = 'Sprawdź wprowadzone dane i spróbuj ponownie'): void {
        this.error(message);
    }

    /**
     * Show network error notification
     */
    static networkError(message: string = 'Wystąpił błąd połączenia. Spróbuj ponownie'): void {
        this.error(message);
    }

    /**
     * Show saved notification
     */
    static saved(entityName: string = 'Dane'): void {
        this.success(`${entityName} zostały zapisane pomyślnie`);
    }

    /**
     * Show deleted notification
     */
    static deleted(entityName: string = 'Element'): void {
        this.success(`${entityName} został usunięty`);
    }

    /**
     * Show created notification
     */
    static created(entityName: string = 'Element'): void {
        this.success(`${entityName} został utworzony pomyślnie`);
    }

    /**
     * Show updated notification
     */
    static updated(entityName: string = 'Element'): void {
        this.success(`${entityName} został zaktualizowany`);
    }

    /**
     * Show loading notification (for long operations)
     */
    static loading(message: string = 'Trwa przetwarzanie...', duration: number = 10000): void {
        this.info(message, duration);
    }

    /**
     * Show coming soon notification
     */
    static comingSoon(feature: string): void {
        this.info(`${feature} będzie dostępny w następnej wersji.`, 4000);
    }
}