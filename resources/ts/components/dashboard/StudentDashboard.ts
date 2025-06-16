import type { RouteComponent } from '@router/routes'

export class StudentDashboard implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'student-dashboard'
        el.innerHTML = `<h1>Panel Studenta</h1>`
        return el
    }
}
