// resources/ts/types/events.ts
export interface AuthChangeEventDetail {
    type: 'login' | 'logout' | 'register'
    isAuthenticated: boolean
    user?: any
}

export interface NotificationEventDetail {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
}

// Extend global CustomEvent interface
declare global {
    interface CustomEventMap {
        'auth:change': CustomEvent<AuthChangeEventDetail>
        'notification:show': CustomEvent<NotificationEventDetail>
    }
}