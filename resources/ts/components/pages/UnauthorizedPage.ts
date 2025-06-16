import type { RouteComponent } from '@router/routes'

export class UnauthorizedPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'unauthorized'
        el.innerHTML = `
            <h1>Brak uprawnień</h1>
            <p><a href="/">Powrót do strony głównej</a></p>`
        return el
    }
}
