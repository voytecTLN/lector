import { Navigation } from '../common/Navigation'
import { Footer } from '../common/Footer'
import type { RouteComponent } from '@router/routes'

export class ContactPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        const nav = new Navigation()
        const footer = new Footer()
        container.appendChild(nav.render())
        container.innerHTML += `
            <section class="contact-page">
                <div class="container">
                    <h1>Kontakt</h1>
                    <p>Masz pytania?</p>
                    <p>Dane firmy</p>
                </div>
            </section>
        `
        container.appendChild(footer.render())
        return container
    }
}
