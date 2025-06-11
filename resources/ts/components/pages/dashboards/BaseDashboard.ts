// resources/ts/components/pages/dashboards/BaseDashboard.ts

export abstract class BaseDashboard {
    protected container: HTMLElement
    protected statsRefreshInterval: number | null = null

    constructor(container: HTMLElement) {
        this.container = container
        this.render()
        this.init()
        this.startStatsRefresh()
    }

    protected abstract render(): void
    protected abstract getTemplate(): string
    protected abstract loadStats(): Promise<void>

    protected init(): void {
        this.setupEventListeners()
    }

    protected setupEventListeners(): void {
        // Common event listeners for all dashboards
        this.container.querySelectorAll('[data-route]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault()
                const route = (e.currentTarget as HTMLElement).getAttribute('data-route')
                if (route) {
                    window.router.navigate(route)
                }
            })
        })

        // Notification buttons
        this.container.querySelectorAll('[data-notification]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = (e.currentTarget as HTMLElement).getAttribute('data-notification')
                if (message) {
                    this.showNotification('info', message)
                }
            })
        })
    }

    protected showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: { type, message }
        }))
    }

    protected startStatsRefresh(): void {
        // Load stats immediately
        this.loadStats()

        // Refresh every 30 seconds
        this.statsRefreshInterval = window.setInterval(() => {
            this.loadStats()
        }, 30000)
    }

    protected stopStatsRefresh(): void {
        if (this.statsRefreshInterval) {
            clearInterval(this.statsRefreshInterval)
            this.statsRefreshInterval = null
        }
    }

    public destroy(): void {
        this.stopStatsRefresh()
    }
}
