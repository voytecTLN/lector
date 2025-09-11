import type { RouteComponent } from '@router/routes'

export class NotFoundPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        document.body.classList.add('error-page-body')
        
        const container = document.createElement('div')
        container.className = 'error-container'
        container.innerHTML = `
            <div class="error-content">
                <div class="error-animation">
                    <div class="floating-number">4</div>
                    <div class="search-character">
                        <div class="magnifying-glass">
                            <div class="glass-circle"></div>
                            <div class="glass-handle"></div>
                        </div>
                        <div class="confused-face">🤔</div>
                    </div>
                    <div class="floating-number">4</div>
                </div>
                
                <div class="error-message">
                    <h1 class="error-title">Oops! Zagubiliśmy się!</h1>
                    <div class="error-subtitle">
                        <p>🔍 Ta strona chyba poszła na przygody bez nas...</p>
                        <p class="funny-line">Może sprawdza czy jednorożce rzeczywiście istnieją? 🦄</p>
                    </div>
                    
                    <div class="helpful-suggestions">
                        <h3>🤓 Co możemy razem zrobić:</h3>
                        <ul class="suggestion-list">
                            <li>📱 Sprawdź czy dobrze wpisałeś adres</li>
                            <li>🏠 Wróć na stronę główną i spróbuj jeszcze raz</li>
                            <li>🔄 Odśwież stronę - może strona się już odnalazła!</li>
                            <li>🆘 Jeśli problem nie zniknie, powiedz nam o tym</li>
                        </ul>
                    </div>
                    
                    <div class="error-actions">
                        <a href="/" class="btn btn-primary btn-home">
                            🏠 Zabierz mnie do domu!
                        </a>
                        <button onclick="window.history.back()" class="btn btn-secondary btn-back">
                            ⬅️ Cofnij się
                        </button>
                        <a href="/#/contact" class="btn btn-outline btn-help">
                            💬 Poproś o pomoc
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="fun-facts">
                <div class="fact-box">
                    <h4>🌟 Czy wiesz, że...</h4>
                    <p id="funFact">Błąd 404 został nazwany tak, ponieważ pierwszy serwer WWW stał w pokoju numer 404!</p>
                </div>
            </div>
        `
        return container
    }
    
    mount(): void {
        this.startFunFactRotation()
    }
    
    unmount(): void {
        document.body.classList.remove('error-page-body')
        if (this.factInterval) {
            clearInterval(this.factInterval)
        }
    }
    
    private factInterval: number | null = null
    
    private startFunFactRotation(): void {
        const facts = [
            "Błąd 404 został nazwany tak, ponieważ pierwszy serwer WWW stał w pokoju numer 404!",
            "Dziennie na całym świecie pojawia się około 4 miliardów błędów 404!",
            "Niektóre strony mają specjalne gry na stronie 404, żeby było weselej!",
            "HTTP oznacza HyperText Transfer Protocol - bardzo mądrze brzmi, prawda?",
            "Pierwsza strona internetowa powstała w 1990 roku i nadal działa!",
            "Koты правят интернетом... ups, to po rosyjsku znaczy 'koty rządzą internetem'! 🐱"
        ]
        
        let currentIndex = 0
        
        this.factInterval = window.setInterval(() => {
            currentIndex = (currentIndex + 1) % facts.length
            const factElement = document.getElementById('funFact')
            if (factElement) {
                factElement.style.opacity = '0'
                setTimeout(() => {
                    factElement.textContent = facts[currentIndex]
                    factElement.style.opacity = '1'
                }, 300)
            }
        }, 4000)
    }
}
