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
            <section class="hero contact-hero">
                <div class="container">
                    <h1>Skontaktuj się z nami</h1>
                    <p>Jesteśmy tutaj, aby pomóc Ci w nauce języków</p>
                </div>
            </section>

            <section class="features contact-info">
                <div class="container">
                    <h2>Dane kontaktowe</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📍</div>
                            <h3>Adres</h3>
                            <p>
                                Tele-Nauka Sp. z o.o.<br>
                                ul. Piękna 24/26a<br>
                                00-549 Warszawa<br>
                                Polska
                            </p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">✉️</div>
                            <h3>E-mail</h3>
                            <p>
                                <strong>Biuro obsługi klienta:</strong><br>
                                <a href="mailto:kontakt@tele-nauka.pl" style="color: #2563eb; text-decoration: none;">
                                    kontakt@tele-nauka.pl
                                </a><br><br>
                                <strong>Wsparcie techniczne:</strong><br>
                                <a href="mailto:kontakt@tele-nauka.pl" style="color: #2563eb; text-decoration: none;">
                                    kontakt@tele-nauka.pl
                                </a>
                            </p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📞</div>
                            <h3>Telefon</h3>
                            <p>
                                <strong>Infolinia:</strong><br>
                                <a href="tel:+48221134004" style="color: #2563eb; text-decoration: none; font-size: 1.25rem; font-weight: bold;">
                                    +48 22 113 4004
                                </a><br><br>
                                <span style="color: #64748b;">pon-pt: 8:00 - 18:00<br>
                                sob: 9:00 - 14:00</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="about social-section">
                <div class="container">
                    <h2>Śledź nas w mediach społecznościowych</h2>
                    <div class="social-links" style="display: flex; justify-content: center; gap: 2rem; margin-top: 2rem;">
                        <a href="#" class="social-link" style="display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: #fff; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-decoration: none; transition: transform 0.3s;" 
                           onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="bi bi-facebook" style="font-size: 28px; color: #1877F2;"></i>
                        </a>
                        <a href="#" class="social-link" style="display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: #fff; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-decoration: none; transition: transform 0.3s;"
                           onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="bi bi-twitter" style="font-size: 28px; color: #1DA1F2;"></i>
                        </a>
                        <a href="#" class="social-link" style="display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: #fff; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-decoration: none; transition: transform 0.3s;"
                           onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="bi bi-instagram" style="font-size: 28px; color: #E4405F;"></i>
                        </a>
                        <a href="#" class="social-link" style="display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: #fff; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-decoration: none; transition: transform 0.3s;"
                           onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="bi bi-linkedin" style="font-size: 28px; color: #0077B5;"></i>
                        </a>
                        <a href="#" class="social-link" style="display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: #fff; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-decoration: none; transition: transform 0.3s;"
                           onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="bi bi-youtube" style="font-size: 28px; color: #FF0000;"></i>
                        </a>
                    </div>
                </div>
            </section>
        `
        container.appendChild(footer.render())
        return container
    }
}
