// resources/ts/utils/eventBus.ts
export type EventCallback = (...args: any[]) => void

export interface EventMap {
    [event: string]: EventCallback[]
}

export class EventBus {
    private events: EventMap = {}

    /**
     * Subscribe to an event
     */
    on(event: string, callback: EventCallback): () => void {
        if (!this.events[event]) {
            this.events[event] = []
        }

        this.events[event].push(callback)

        // Return unsubscribe function
        return () => this.off(event, callback)
    }

    /**
     * Subscribe to an event and automatically unsubscribe after first call
     */
    once(event: string, callback: EventCallback): () => void {
        const wrappedCallback: EventCallback = (...args: any[]) => {
            callback(...args)
            this.off(event, wrappedCallback)
        }

        return this.on(event, wrappedCallback)
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, callback?: EventCallback): void {
        if (!this.events[event]) return

        if (callback) {
            const index = this.events[event].indexOf(callback)
            if (index > -1) {
                this.events[event].splice(index, 1)
            }
        } else {
            // Remove all listeners for this event
            delete this.events[event]
        }
    }

    /**
     * Emit an event
     */
    emit(event: string, ...args: any[]): void {
        if (!this.events[event]) return

        // Create a copy of listeners to avoid issues if callbacks modify the array
        const listeners = [...this.events[event]]

        listeners.forEach(callback => {
            try {
                callback(...args)
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error)
            }
        })
    }

    /**
     * Check if event has listeners
     */
    hasListeners(event: string): boolean {
        return !!(this.events[event] && this.events[event].length > 0)
    }

    /**
     * Get count of listeners for an event
     */
    listenerCount(event: string): number {
        return this.events[event]?.length || 0
    }

    /**
     * Get all event names that have listeners
     */
    eventNames(): string[] {
        return Object.keys(this.events).filter(event => this.events[event].length > 0)
    }

    /**
     * Remove all listeners
     */
    removeAllListeners(): void {
        this.events = {}
    }

    /**
     * Debug helper - log all events
     */
    debug(enabled: boolean = true): void {
        if (enabled) {
            const debugCallback: EventCallback = (event: string, ...args: any[]) => {
                console.log(`[EventBus] ${event}:`, ...args)
            }
            this.on('*', debugCallback)
        }
    }
}

// Global event bus instance
export const globalEventBus = new EventBus()