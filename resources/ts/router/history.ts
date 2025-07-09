// resources/ts/router/history.ts
export interface HistoryState {
    path: string
    title?: string
    data?: any
}

export class BrowserHistory {
    private listeners: ((path: string, state?: HistoryState) => void)[] = []

    constructor() {
        this.init()
    }

    private init(): void {
        window.addEventListener('popstate', this.handlePopState.bind(this))
    }

    push(path: string, title?: string, data?: any): void {
        const state: HistoryState = { path, title, data }

        // NOWE: Jeśli używamy hash routing
        if (path.startsWith('/') && window.location.hash) {
            window.location.hash = path
            if (title) {
                document.title = title
            }
            this.notifyListeners(path, state)
            return
        }

        window.history.pushState(state, title || '', path)
        if (title) {
            document.title = title
        }
        this.notifyListeners(path, state)
    }

    isHashRouting(): boolean {
        return window.location.hash.startsWith('#/')
    }

    replace(path: string, title?: string, data?: any): void {
        const state: HistoryState = { path, title, data }

        window.history.replaceState(state, title || '', path)

        if (title) {
            document.title = title
        }

        this.notifyListeners(path, state)
    }

    getCurrentPath(): string {
        // NOWE: Jeśli mamy hash routing, użyj hash jako path
        if (window.location.hash && window.location.hash.startsWith('#/')) {
            const hashPath = window.location.hash.substring(1) // Usuń tylko #
            return hashPath + window.location.search
        }

        // Fallback do normalnego pathname
        return window.location.pathname + window.location.search + window.location.hash
    }

    addListener(listener: (path: string, state?: HistoryState) => void): () => void {
        this.listeners.push(listener)

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener)
            if (index > -1) {
                this.listeners.splice(index, 1)
            }
        }
    }

    private handlePopState(event: PopStateEvent): void {
        const path = this.getCurrentPath()
        const state = event.state as HistoryState | null
        this.notifyListeners(path, state || undefined)
    }

    private notifyListeners(path: string, state?: HistoryState): void {
        this.listeners.forEach(listener => {
            try {
                listener(path, state)
            } catch (error) {
                console.error('History listener error:', error)
            }
        })
    }
}
