// resources/ts/utils/logger.ts
// Production-safe logging utility

declare const __APP_ENV__: string

// Check both Vite env and Laravel APP_ENV
const isProduction = import.meta.env.PROD || (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__ === 'production')
const isDevelopment = import.meta.env.DEV || (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__ === 'development')


export class Logger {
    /**
     * Log errors - always shown
     */
    static error(message: string, ...args: any[]): void {
        console.error(message, ...args)
    }

    /**
     * Log warnings - always shown
     */
    static warn(message: string, ...args: any[]): void {
        console.warn(message, ...args)
    }

    /**
     * Log info - only in development
     */
    static info(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.info(message, ...args)
        }
    }

    /**
     * Log debug info - only in development
     */
    static debug(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.log(message, ...args)
        }
    }

    /**
     * Log API requests - only in development
     */
    static api(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.log(`🌐 ${message}`, ...args)
        }
    }

    /**
     * Log router navigation - only in development
     */
    static router(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.log(`🧭 ${message}`, ...args)
        }
    }

    /**
     * Log guards - only in development
     */
    static guard(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.log(`🛡️ ${message}`, ...args)
        }
    }

    /**
     * Log authentication - only critical info in production
     */
    static auth(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.log(`🔑 ${message}`, ...args)
        }
    }

    /**
     * Force log in production (use sparingly)
     */
    static force(message: string, ...args: any[]): void {
        console.log(message, ...args)
    }

    /**
     * Check if running in production
     */
    static get isProduction(): boolean {
        return isProduction
    }

    /**
     * Check if running in development
     */
    static get isDevelopment(): boolean {
        return isDevelopment
    }
}

// Export as default for easier importing
export default Logger