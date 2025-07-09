// resources/ts/types/vite-env.d.ts

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_API_URL: string
    readonly VITE_APP_ENV: string
    // więcej env variables jak potrzeba
}

interface ImportMeta {
    readonly env: ImportMetaEnv
    readonly hot?: {
        readonly data: any
        accept(): void
        accept(cb: (mod: any) => void): void
        accept(dep: string, cb: (mod: any) => void): void
        accept(deps: readonly string[], cb: (mods: any[]) => void): void
        dispose(cb: () => void): void
        decline(): void
        invalidate(): void
        on(event: string, cb: (...args: any[]) => void): void
        send(event: string, data?: any): void
    }
}

