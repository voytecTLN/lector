// resources/ts/utils/appState.ts
import { EventBus, type EventCallback } from './eventBus'

export interface AppStateData {
    isReady: boolean
    isLoading: boolean
    isAuthenticated: boolean
    currentUser: any | null
    currentRoute: string | null
    notifications: NotificationState[]
    theme: 'light' | 'dark'
    language: string
}

export interface NotificationState {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
    timestamp: number
}

export class AppState {
    private state: AppStateData
    private eventBus: EventBus
    private storageKey = 'app_state'

    constructor() {
        this.eventBus = new EventBus()
        this.state = this.getDefaultState()
        this.loadFromStorage()
    }

    private getDefaultState(): AppStateData {
        return {
            isReady: false,
            isLoading: false,
            isAuthenticated: false,
            currentUser: null,
            currentRoute: null,
            notifications: [],
            theme: 'light',
            language: 'pl'
        }
    }

    // Getters
    getState(): Readonly<AppStateData> {
        return { ...this.state }
    }

    isReady(): boolean {
        return this.state.isReady
    }

    isLoading(): boolean {
        return this.state.isLoading
    }

    isAuthenticated(): boolean {
        return this.state.isAuthenticated
    }

    getCurrentUser(): any | null {
        return this.state.currentUser
    }

    getCurrentRoute(): string | null {
        return this.state.currentRoute
    }

    getTheme(): 'light' | 'dark' {
        return this.state.theme
    }

    getLanguage(): string {
        return this.state.language
    }

    // Setters
    setAppReady(isReady: boolean): void {
        this.updateState({ isReady })
        this.eventBus.emit('app:ready', isReady)
    }

    setLoading(isLoading: boolean): void {
        this.updateState({ isLoading })
        this.eventBus.emit('app:loading', isLoading)
    }

    setAuthState(isAuthenticated: boolean, user?: any): void {
        this.updateState({
            isAuthenticated,
            currentUser: user || null
        })
        this.eventBus.emit('app:auth-change', { isAuthenticated, user })
    }

    setCurrentRoute(route: string): void {
        this.updateState({ currentRoute: route })
        this.eventBus.emit('app:route-change', route)
    }

    setTheme(theme: 'light' | 'dark'): void {
        this.updateState({ theme })
        document.body.classList.toggle('dark-theme', theme === 'dark')
        this.eventBus.emit('app:theme-change', theme)
        this.saveToStorage()
    }

    setLanguage(language: string): void {
        this.updateState({ language })
        document.documentElement.lang = language
        this.eventBus.emit('app:language-change', language)
        this.saveToStorage()
    }

    // Notifications
    addNotification(notification: Omit<NotificationState, 'id' | 'timestamp'>): string {
        const id = this.generateId()
        const newNotification: NotificationState = {
            ...notification,
            id,
            timestamp: Date.now()
        }

        this.updateState({
            notifications: [...this.state.notifications, newNotification]
        })

        this.eventBus.emit('app:notification-added', newNotification)

        // Auto remove if duration is set
        if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
                this.removeNotification(id)
            }, notification.duration)
        }

        return id
    }

    removeNotification(id: string): void {
        this.updateState({
            notifications: this.state.notifications.filter(n => n.id !== id)
        })
        this.eventBus.emit('app:notification-removed', id)
    }

    clearNotifications(): void {
        this.updateState({ notifications: [] })
        this.eventBus.emit('app:notifications-cleared')
    }

    // Event subscription with proper typing
    on(event: string, callback: EventCallback): () => void {
        return this.eventBus.on(event, callback)
    }

    off(event: string, callback: EventCallback): void {
        this.eventBus.off(event, callback)
    }

    // Typed event subscription methods for common events
    onReady(callback: (isReady: boolean) => void): () => void {
        return this.eventBus.on('app:ready', callback)
    }

    onLoading(callback: (isLoading: boolean) => void): () => void {
        return this.eventBus.on('app:loading', callback)
    }

    onAuthChange(callback: (data: { isAuthenticated: boolean, user: any }) => void): () => void {
        return this.eventBus.on('app:auth-change', callback)
    }

    onRouteChange(callback: (route: string) => void): () => void {
        return this.eventBus.on('app:route-change', callback)
    }

    onThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
        return this.eventBus.on('app:theme-change', callback)
    }

    onLanguageChange(callback: (language: string) => void): () => void {
        return this.eventBus.on('app:language-change', callback)
    }

    onNotificationAdded(callback: (notification: NotificationState) => void): () => void {
        return this.eventBus.on('app:notification-added', callback)
    }

    onNotificationRemoved(callback: (id: string) => void): () => void {
        return this.eventBus.on('app:notification-removed', callback)
    }

    onStateChange(callback: (state: AppStateData) => void): () => void {
        return this.eventBus.on('app:state-change', callback)
    }

    // Private methods
    private updateState(updates: Partial<AppStateData>): void {
        this.state = { ...this.state, ...updates }
        this.eventBus.emit('app:state-change', this.state)
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    private saveToStorage(): void {
        try {
            const persistentState = {
                theme: this.state.theme,
                language: this.state.language
            }
            localStorage.setItem(this.storageKey, JSON.stringify(persistentState))
        } catch (error) {
            console.warn('Failed to save app state to storage:', error)
        }
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey)
            if (stored) {
                const persistentState = JSON.parse(stored)
                this.updateState(persistentState)

                // Apply theme
                if (persistentState.theme) {
                    document.body.classList.toggle('dark-theme', persistentState.theme === 'dark')
                }

                // Apply language
                if (persistentState.language) {
                    document.documentElement.lang = persistentState.language
                }
            }
        } catch (error) {
            console.warn('Failed to load app state from storage:', error)
        }
    }
}