import type { Router } from '@/router'

export function redirectWithMessage(
    path: string,
    message?: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
): void {
    const router = (window as any).router as Router | undefined

    if (router && router.redirectWithMessage) {
        router.redirectWithMessage(path, message, type)
    } else {
        // Fallback dla przypadków gdy router nie jest dostępny
        const url = new URL(path, window.location.origin)
        if (message) {
            url.searchParams.set('message', message)
            url.searchParams.set('type', type)
        }
        window.location.href = url.href
    }
}

export function navigateTo(path: string): void {
    const router = (window as any).router as Router | undefined

    if (router && router.navigate) {
        router.navigate(path)
    } else {
        window.location.href = path
    }
}