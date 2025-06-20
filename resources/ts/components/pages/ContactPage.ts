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
                    <p>Masz pytania? Wypełnij formularz lub napisz do nas.</p>
                    <form id="contactForm" class="contact-form">
                        <div class="mb-3">
                            <label for="name" class="form-label">Imię</label>
                            <input type="text" id="name" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" id="email" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label for="message" class="form-label">Wiadomość</label>
                            <textarea id="message" class="form-control" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Wyślij</button>
                    </form>
                </div>
            </section>
        `
        container.appendChild(footer.render())
        return container
    }
}
