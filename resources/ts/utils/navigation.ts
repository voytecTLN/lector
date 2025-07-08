import type { Router } from '@/router'

export function redirectWithMessage(
    path: string,
    message?: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
): void {
    console.log(`🔄 redirectWithMessage called:`, { path, message, type })

    const router = (window as any).router as Router | undefined

    if (router && router.redirectWithMessage) {
        console.log(`📍 Using router.redirectWithMessage`)
        router.redirectWithMessage(path, message, type)
    } else {
        console.log(`📍 Using fallback redirect (no router available)`)

        // Fallback dla przypadków gdy router nie jest dostępny

        // Sprawdź czy to hash routing
        if (path.startsWith('/#')) {
            // Dla hash routing buduj URL ręcznie
            let fullUrl = path

            if (message) {
                // Sprawdź czy hash już ma query params
                const hashIndex = path.indexOf('#')
                const hashPart = path.substring(hashIndex + 1)
                const separator = hashPart.includes('?') ? '&' : '?'

                fullUrl = path + separator + `message=${encodeURIComponent(message)}&type=${type}`
            }

            console.log(`🔗 Hash routing redirect to: ${fullUrl}`)
            navigateTo(fullUrl)
            //TODO

        } else {
            // Normalne URL routing
            try {
                const url = new URL(path, window.location.origin)

                if (message) {
                    url.searchParams.set('message', message)
                    url.searchParams.set('type', type)
                }

                console.log(`🔗 Normal redirect to: ${url.href}`)
                // window.location.href = url.href
                navigateTo(url.href)
            } catch (error) {
                console.error('❌ Failed to build URL:', error)
                // Ostatnia deska ratunku - przekieruj bez parametrów
                navigateTo(path)
                //TODO
            }
        }
    }
}

export function navigateTo(path: string): void {
    console.log(`🧭 navigateTo called:`, path)

    const router = (window as any).router as Router | undefined

    if (router && router.navigate) {
        console.log(`📍 Using router.navigate`)
        router.navigate(path)
    } else {
        console.log(`📍 Using direct navigation (no router)`)
        window.location.href = path
    }
}