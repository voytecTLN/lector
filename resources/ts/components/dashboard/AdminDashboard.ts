import type { RouteComponent } from '@router/routes'

export class AdminDashboard implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'admin-dashboard'
        el.innerHTML = `<h1>Panel Administratora</h1>`
        return el
    }
}
