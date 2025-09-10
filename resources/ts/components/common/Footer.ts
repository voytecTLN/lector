export class Footer {
    render(): HTMLElement {
        const footer = document.createElement('footer')
        footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-section">
                    <h3>O nas</h3>
                    <p>Jesteśmy platformą łączącą uczniów z najlepszymi lektorami języków obcych.</p>
                </div>
                <div class="footer-section">
                    <h3>Kontakt</h3>
                    <p>📧 kontakt@tele-nauka.pl</p>
                    <p>📞 +48 22 113 4004</p>
                </div>
                <div class="footer-section">
                    <h3>Informacje</h3>
                    <a href="/#/regulamin">Regulamin</a><br>
                    <a href="/#/polityka">Polityka prywatności</a><br>
                    <a href="/#/faq">FAQ</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Platforma Lektorów</p>
            </div>
        `
        return footer
    }
}
