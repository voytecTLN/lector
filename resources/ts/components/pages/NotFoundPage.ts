import type { RouteComponent } from '@router/routes'

export class NotFoundPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'not-found'
        el.innerHTML = `
            <h1>404 - Strona nie znaleziona</h1>
            <p><a href="/">Powrót do strony głównej</a></p>`
        return el
    }
}
