import { Navigation } from '../common/Navigation'
import { Footer } from '../common/Footer'
import type { RouteComponent } from '@router/routes'

export class FaqPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        const container = document.createElement('div')
        const nav = new Navigation()
        const footer = new Footer()
        
        container.appendChild(nav.render())
        container.innerHTML += `
            <section class="hero faq-hero">
                <div class="container">
                    <h1>Często zadawane pytania</h1>
                    <p>Znajdź odpowiedzi na najczęściej zadawane pytania</p>
                </div>
            </section>

            <section class="features faq-content">
                <div class="container">
                    <div class="faq-categories">
                        <div class="faq-category">
                            <h2 style="color: #1e293b; margin-bottom: 2rem;">Ogólne pytania</h2>
                            
                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Czym jest Platforma Lektorów?</h3>
                                <p style="color: #475569; line-height: 1.6;">Platforma Lektorów to nowoczesny serwis edukacyjny umożliwiający naukę języków obcych online. Łączymy uczniów z doświadczonymi lektorami, oferując elastyczne godziny nauki i spersonalizowane podejście do każdego ucznia.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jak mogę rozpocząć naukę?</h3>
                                <p style="color: #475569; line-height: 1.6;">Aby rozpocząć naukę, zaloguj się na platformie jako uczeń, uzupełnij swój profil, wybierz lektora i język, który chcesz poznać, a następnie zarezerwuj swoją pierwszą lekcję w dogodnym terminie.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jakie języki mogę poznać?</h3>
                                <p style="color: #475569; line-height: 1.6;">Oferujemy naukę najpopularniejszych języków: angielskiego, niemieckiego, hiszpańskiego, francuskiego. Lista dostępnych języków stale się powiększa.</p>
                            </div>
                        </div>

                        <div class="faq-category" style="margin-top: 3rem;">
                            <h2 style="color: #1e293b; margin-bottom: 2rem;">Lekcje i rezerwacje</h2>
                            
                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jak długo trwa jedna lekcja?</h3>
                                <p style="color: #475569; line-height: 1.6;">Standardowa lekcja trwa maksymalnie 60 minut. Można zarezerwować kilka lekcji w tym samym dniu.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Czy mogę odwołać lekcję?</h3>
                                <p style="color: #475569; line-height: 1.6;">Tak, lekcję można odwołać do 12 godzin przed jej rozpoczęciem bez żadnych konsekwencji. Odwołania z krótszym wyprzedzeniem mogą wiązać się z odliczeniem godziny od pakietu zgodnie z regulaminem.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jak odbywają się lekcje online?</h3>
                                <p style="color: #475569; line-height: 1.6;">Lekcje odbywają się poprzez wbudowany system wideokonferencji na naszej platformie. Nie musisz instalować dodatkowego oprogramowania - wystarczy przeglądarka internetowa i stabilne połączenie z internetem.</p>
                            </div>
                        </div>

<!--
                        <div class="faq-category" style="margin-top: 3rem;">
                            <h2 style="color: #1e293b; margin-bottom: 2rem;">Płatności i pakiety</h2>
                            
                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jakie są formy płatności?</h3>
                                <p style="color: #475569; line-height: 1.6;">Akceptujemy płatności kartą kredytową/debetową, przelewem bankowym oraz przez popularne systemy płatności online jak PayPal, Przelewy24 czy BLIK.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Czy oferujecie pakiety lekcji?</h3>
                                <p style="color: #475569; line-height: 1.6;">Tak, oferujemy pakiety 5, 10 i 20 lekcji z atrakcyjnymi rabatami. Im większy pakiet, tym niższa cena za pojedynczą lekcję. Pakiety są ważne przez 6 miesięcy od daty zakupu.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Czy mogę otrzymać fakturę?</h3>
                                <p style="color: #475569; line-height: 1.6;">Oczywiście! Faktury VAT wystawiamy automatycznie po każdej płatności. Dokument otrzymasz na adres e-mail podany podczas rejestracji. Faktury są również dostępne w panelu użytkownika.</p>
                            </div>
                        </div>
-->

                        <div class="faq-category" style="margin-top: 3rem;">
                            <h2 style="color: #1e293b; margin-bottom: 2rem;">Dla lektorów</h2>
                            
                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jak zostać lektorem na platformie?</h3>
                                <p style="color: #475569; line-height: 1.6;">Aby zostać lektorem, wypełnij formularz aplikacyjny, prześlij wymagane dokumenty potwierdzające kwalifikacje, przejdź rozmowę kwalifikacyjną online, a po pozytywnej weryfikacji możesz rozpocząć prowadzenie lekcji.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jakie są wymagania dla lektorów?</h3>
                                <p style="color: #475569; line-height: 1.6;">Wymagamy wykształcenia wyższego (preferowane filologiczne lub pedagogiczne), doświadczenia w nauczaniu, doskonałej znajomości nauczanego języka oraz podstawowych umiejętności obsługi komputera i internetu.</p>
                            </div>
                        </div>

                        <div class="faq-category" style="margin-top: 3rem;">
                            <h2 style="color: #1e293b; margin-bottom: 2rem;">Wsparcie techniczne</h2>
                            
                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Co zrobić, gdy mam problemy techniczne?</h3>
                                <p style="color: #475569; line-height: 1.6;">W przypadku problemów technicznych skontaktuj się z naszym wsparciem przez formularz kontaktowy, e-mail kontakt@tele-nauka.pl lub telefon +48 22 113 4004. Odpowiadamy w ciągu 24 godzin w dni robocze.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Jakie są wymagania sprzętowe?</h3>
                                <p style="color: #475569; line-height: 1.6;">Potrzebujesz komputera lub tabletu z kamerą i mikrofonem, stabilnego połączenia internetowego (min. 5 Mbps), oraz przeglądarki Chrome, Firefox, Safari, Brave lub Edge w aktualnej wersji.</p>
                            </div>

                            <div class="faq-item" style="background: #fff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="color: #e91e63; margin-bottom: 0.5rem;">Czy aplikacja jest dostępna na telefony?</h3>
                                <p style="color: #475569; line-height: 1.6;">Obecnie platforma działa w pełni responsywnie w przeglądarkach mobilnych. Dedykowane aplikacje na iOS i Android są w fazie rozwoju i będą dostępne wkrótce.</p>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 4rem; padding: 2rem; background: #fff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
                        <h3 style="color: #1e293b; margin-bottom: 1rem;">Nie znalazłeś odpowiedzi?</h3>
                        <p style="color: #475569; margin-bottom: 1.5rem;">Skontaktuj się z nami, a chętnie odpowiemy na wszystkie Twoje pytania!</p>
                        <div style="display: flex; gap: 1rem; justify-content: center;">
                            <a href="#/contact" class="btn btn-primary" style="padding: 0.75rem 2rem; background: #e91e63; color: white; text-decoration: none; border-radius: 5px; font-weight: 600;">Kontakt</a>
                            <a href="mailto:kontakt@tele-nauka.pl" class="btn btn-secondary" style="padding: 0.75rem 2rem; background: transparent; color: #e91e63; text-decoration: none; border: 2px solid #e91e63; border-radius: 5px; font-weight: 600;">Napisz do nas</a>
                        </div>
                    </div>
                </div>
            </section>
        `
        
        container.appendChild(footer.render())
        return container
    }
}