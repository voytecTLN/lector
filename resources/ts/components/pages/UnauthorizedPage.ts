import type { RouteComponent } from '@router/routes'

export class UnauthorizedPage implements RouteComponent {
    async render(): Promise<HTMLElement> {
        document.body.classList.add('error-page-body', 'forbidden-page')
        
        const container = document.createElement('div')
        container.className = 'error-container forbidden-container'
        container.innerHTML = `
            <div class="error-content">
                <div class="forbidden-animation">
                    <div class="guard-character">
                        <div class="guard-hat">🎩</div>
                        <div class="guard-body">
                            <div class="stop-sign">✋</div>
                            <div class="guard-face">😤</div>
                        </div>
                        <div class="guard-speech">STOP!</div>
                    </div>
                    
                    <div class="forbidden-barriers">
                        <div class="barrier"></div>
                        <div class="barrier"></div>
                        <div class="barrier"></div>
                    </div>
                </div>
                
                <div class="error-message">
                    <h1 class="error-title">🚫 Stop! Tu nie możesz wejść!</h1>
                    <div class="error-subtitle">
                        <p>🛡️ Ochroniarz internetowy mówi: "Najpierw musisz się zalogować!"</p>
                        <p class="funny-line">To jak próba wejścia do zamku bez magicznego słowa! 🏰</p>
                    </div>
                    
                    <div class="helpful-suggestions">
                        <h3>🗝️ Jak zdobyć dostęp:</h3>
                        <ul class="suggestion-list">
                            <li>🎭 Zaloguj się swoim kontem</li>
                            <li>📝 Jeśli nie masz konta - załóż je!</li>
                            <li>🔐 Sprawdź czy masz odpowiednie uprawnienia</li>
                            <li>👮‍♀️ Poproś administratora o dostęp</li>
                        </ul>
                    </div>
                    
                    <div class="magic-rules">
                        <h4>🎪 Zasady magicznego internetu:</h4>
                        <div class="rules-grid">
                            <div class="rule-item">
                                <span class="rule-icon">🚪</span>
                                <span>Każdy pokój ma swoją klamkę</span>
                            </div>
                            <div class="rule-item">
                                <span class="rule-icon">🗝️</span>
                                <span>Każda klamka potrzebuje klucza</span>
                            </div>
                            <div class="rule-item">
                                <span class="rule-icon">👑</span>
                                <span>Nie każdy ma klucz do każdego pokoju</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="error-actions">
                        <a href="/#/login" class="btn btn-primary btn-login">
                            🎭 Zaloguj się
                        </a>
                        <a href="/#/register" class="btn btn-secondary btn-register">
                            📝 Załóż konto
                        </a>
                        <a href="/" class="btn btn-outline btn-home">
                            🏠 Wróć do domu
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="fun-facts">
                <div class="fact-box forbidden-facts">
                    <h4>🔐 Ciekawostka o zabezpieczeniach:</h4>
                    <p id="securityFact">Pierwsze hasło komputerowe zostało wymyślone w 1961 roku w MIT!</p>
                </div>
            </div>
            
            <div class="secret-knock">
                <p class="knock-text">🤫 Psst... spróbuj pukać:</p>
                <div class="knock-sequence">
                    <button class="knock-btn" data-knock="1">🚪</button>
                    <button class="knock-btn" data-knock="2">🚪</button>
                    <button class="knock-btn" data-knock="3">🚪</button>
                </div>
                <div class="knock-result" id="knockResult"></div>
            </div>
        `
        return container
    }
    
    mount(): void {
        this.startSecurityFactRotation()
        this.setupSecretKnock()
    }
    
    unmount(): void {
        document.body.classList.remove('error-page-body', 'forbidden-page')
        if (this.factInterval) {
            clearInterval(this.factInterval)
        }
    }
    
    private factInterval: number | null = null
    private knockSequence: number[] = []
    
    private startSecurityFactRotation(): void {
        const facts = [
            "Pierwsze hasło komputerowe zostało wymyślone w 1961 roku w MIT!",
            "Najczęściej używanym hasłem na świecie jest '123456' - nie używaj go!",
            "Słowo 'spam' pochodzi od marki amerykańskiej konserwy mięsnej!",
            "Pierwszy wirus komputerowy nazywał się 'Creeper' i pojawił się w 1971 roku!",
            "CAPTCHA to skrót od 'Completely Automated Public Turing test'!",
            "W 2019 roku złamanie hasła '123456789' zajęło komputerowi... 0 sekund! 😅"
        ]
        
        let currentIndex = 0
        
        this.factInterval = window.setInterval(() => {
            currentIndex = (currentIndex + 1) % facts.length
            const factElement = document.getElementById('securityFact')
            if (factElement) {
                factElement.style.opacity = '0'
                setTimeout(() => {
                    factElement.textContent = facts[currentIndex]
                    factElement.style.opacity = '1'
                }, 300)
            }
        }, 5000)
    }
    
    private setupSecretKnock(): void {
        const knockBtns = document.querySelectorAll('.knock-btn')
        const knockResult = document.getElementById('knockResult')
        
        knockBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement
                const knockNum = parseInt(target.dataset.knock || '0')
                this.knockSequence.push(knockNum)
                
                // Animation
                target.style.transform = 'scale(0.9)'
                setTimeout(() => {
                    target.style.transform = 'scale(1)'
                }, 150)
                
                // Check sequence
                if (this.knockSequence.length === 3) {
                    const sequence = this.knockSequence.join('')
                    
                    if (sequence === '321') {
                        knockResult!.innerHTML = '🎉 Wow! Znasz tajny kod! Ale i tak musisz się zalogować 😄'
                        knockResult!.className = 'knock-result success'
                    } else if (sequence === '123') {
                        knockResult!.innerHTML = '📚 Umiesz liczyć! Ale to nie ten kod... 🤔'
                        knockResult!.className = 'knock-result info'
                    } else {
                        knockResult!.innerHTML = '🚪 *Głuche pukanie* Ochroniarz nie odpowiada... 🤷‍♀️'
                        knockResult!.className = 'knock-result'
                    }
                    
                    this.knockSequence = []
                }
                
                if (this.knockSequence.length > 3) {
                    this.knockSequence = []
                    knockResult!.textContent = ''
                }
            })
        })
    }
}
