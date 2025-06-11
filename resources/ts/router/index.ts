// resources/ts/router/index.ts

export { Router, router } from './Router'
export type { Route } from './Router'

// Helper function for navigation
export const navigateTo = (path: string): void => {
    import('./Router').then(({ router }) => {
        router.navigate(path)
    })
}

// Helper function to create navigation links
export const createNavLink = (href: string, text: string, className?: string): HTMLAnchorElement => {
    const link = document.createElement('a')
    link.href = href
    link.textContent = text
    link.setAttribute('data-link', 'true')
    if (className) {
        link.className = className
    }
    return link
}