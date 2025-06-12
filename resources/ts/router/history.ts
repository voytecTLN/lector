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

        window.history.pushState(state, title || '', path)

        if (title) {
            document.title = title
        }

        this.notifyListeners(path, state)
    }

    replace(path: string, title?: string, data?: any): void {
        const state: HistoryState = { path, title, data }

        window.history.replaceState(state, title || '', path)

        if (title) {
            document.title = title
        }

        this.notifyListeners(path, state)
    }

    back(): void {
        window.history.back()
    }

    forward(): void {
        window.history.forward()
    }

    go(delta: number): void {
        window.history.go(delta)
    }

    getCurrentPath(): string {
        return window.location.pathname + window.location.search + window.location.hash
    }

    getCurrentState(): HistoryState | null {
        return window.history.state as HistoryState | null
    }

    parseURL(url: string = window.location.href): URLInfo {
        const urlObj = new URL(url, window.location.origin)

        return {
            pathname: urlObj.pathname,
            search: urlObj.search,
            hash: urlObj.hash,
            query: this.parseQuery(urlObj.search),
            params: {}
        }
    }

    parseQuery(search: string): Record<string, string> {
        const params = new URLSearchParams(search)
        const query: Record<string, string> = {}

        params.forEach((value, key) => {
            query[key] = value
        })

        return query
    }

    buildURL(path: string, query?: Record<string, string>, hash?: string): string {
        let url = path

        if (query && Object.keys(query).length > 0) {
            const searchParams = new URLSearchParams()
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value))
                }
            })
            url += '?' + searchParams.toString()
        }

        if (hash) {
            url += hash.startsWith('#') ? hash : '#' + hash
        }

        return url
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

export interface URLInfo {
    pathname: string
    search: string
    hash: string
    query: Record<string, string>
    params: Record<string, string>
}