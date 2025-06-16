import { Navigation } from '../common/Navigation'
import { Footer } from '../common/Footer'
import type { RouteComponent } from '@router/routes'

export class HomePage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        const nav = new Navigation()
        const footer = new Footer()
        container.appendChild(nav.render())
        container.innerHTML += `
            <section class="hero" id="home">
                <div class="container">
                    <h1>Nauka języków online z najlepszymi lektorami</h1>
                    <p>Personalizowane lekcje, elastyczny harmonogram, sprawdzone metody nauczania</p>
                    <div class="cta-buttons">
                        <a href="#lecturers" class="btn btn-primary">Zobacz lektorów</a>
                        <a href="#about" class="btn btn-secondary">Dowiedz się więcej</a>
                        <a href="/register" class="btn btn-primary">Dołącz do nas</a>
                    </div>
                </div>
            </section>
            <section class="features">
                <div class="container">
                    <h2>Dlaczego warto nas wybrać?</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <h3>Spersonalizowane lekcje</h3>
                            <p>Każda lekcja dostosowana do Twoich potrzeb i poziomu zaawansowania</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">⏰</div>
                            <h3>Elastyczny harmonogram</h3>
                            <p>Uczysz się kiedy chcesz - dostępność lektorów 7 dni w tygodniu</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🌟</div>
                            <h3>Doświadczeni lektorzy</h3>
                            <p>Wszystkich naszych lektorów łączy pasja do nauczania i wysokie kwalifikacje</p>
                        </div>
                    </div>
                </div>
            </section>
            <section class="lecturers" id="lecturers">
                <div class="container">
                    <h2>Poznaj naszych lektorów</h2>
                    <div class="lecturers-grid">
                        <div class="lecturer-card">
                            <div class="lecturer-avatar">👩‍🏫</div>
                            <div class="lecturer-info">
                                <div class="lecturer-name">Anna Kowalska</div>
                                <div class="lecturer-languages">Angielski, Niemiecki</div>
                                <div class="lecturer-rating">
                                    <span class="stars">⭐⭐⭐⭐⭐</span>
                                    <span>5.0 (124 opinii)</span>
                                </div>
                                <p>Specjalizuje się w języku biznesowym i przygotowaniu do egzaminów międzynarodowych.</p>
                            </div>
                        </div>
                        <div class="lecturer-card">
                            <div class="lecturer-avatar">👨‍🏫</div>
                            <div class="lecturer-info">
                                <div class="lecturer-name">Piotr Novak</div>
                                <div class="lecturer-languages">Francuski, Hiszpański</div>
                                <div class="lecturer-rating">
                                    <span class="stars">⭐⭐⭐⭐⭐</span>
                                    <span>4.9 (89 opinii)</span>
                                </div>
                                <p>Nativespeaker z długoletnim doświadczeniem w nauczaniu konwersacji.</p>
                            </div>
                        </div>
                        <div class="lecturer-card">
                            <div class="lecturer-avatar">👩‍🏫</div>
                            <div class="lecturer-info">
                                <div class="lecturer-name">Maria Silva</div>
                                <div class="lecturer-languages">Włoski, Portugalski</div>
                                <div class="lecturer-rating">
                                    <span class="stars">⭐⭐⭐⭐⭐</span>
                                    <span>4.8 (76 opinii)</span>
                                </div>
                                <p>Specjalistka w zakresie gramatyki i nauki języków dla dzieci.</p>
                            </div>
                        </div>
                    </div>
                    <div class="login-note">
                        <strong>Chcesz zarezerwować lekcję?</strong> Zaloguj się do swojego konta lub skontaktuj się z nami.
                    </div>
                </div>
            </section>
        `
        container.appendChild(footer.render())
        return container
    }
}
