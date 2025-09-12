// resources/ts/services/ApiService.ts - Zgodny z Laravel Sanctum
import { ValidationError } from "@/types/models"
import { navigate } from '@/utils/navigation'
import { ROUTES } from '@/config/routing'

interface LaravelResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export class ApiService {
  private baseURL = '/api'
  private csrfToken: string = ''

  constructor() {
    this.initCSRF()
  }

  private initCSRF(): void {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    this.csrfToken = token || ''
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  async request<T>(endpoint: string, options: RequestInit & { responseType?: 'json' | 'blob' } = {}, retryCount: number = 0): Promise<T> {
    // Pobierz CSRF cookie dla Sanctum dla wszystkich requestów uwierzytelnionych
    if (!this.csrfToken) {
      await this.refreshCSRF()
    }

    const authToken = this.getAuthToken()

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }

    // Dodaj CSRF token dla Sanctum
    if (this.csrfToken) {
      headers['X-CSRF-TOKEN'] = this.csrfToken
    }

    // Dodaj Authorization header jeśli mamy token
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    // Dodaj Content-Type dla żądań z body (ale nie dla FormData)
    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method) && options.body) {
      // Nie ustawiaj Content-Type dla FormData - przeglądarka ustawi automatycznie
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }
    }

    // Połącz z przekazanymi nagłówkami
    const finalHeaders = {
      ...headers,
      ...options.headers
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: finalHeaders,
        credentials: 'include' // Changed from 'same-origin' to 'include' for better session handling
      })

      // Handle 419 - CSRF token mismatch
      if (response.status === 419 && retryCount < 2) {
        // Refresh CSRF token and retry
        await this.refreshCSRF()
        return this.request<T>(endpoint, options, retryCount + 1)
      }

      // Handle different response types
      if (options.responseType === 'blob') {
        if (!response.ok) {
          // Check if it's a redirect to login (session expired)
          if (response.status === 302 || response.redirected) {
            // Session expired, trigger logout
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_permissions')
            
            document.dispatchEvent(new CustomEvent('notification:show', {
              detail: {
                type: 'warning',
                message: 'Twoja sesja wygasła. Zaloguj się ponownie.',
                duration: 6000
              }
            }))
            
            document.dispatchEvent(new CustomEvent('auth:change', {
              detail: { type: 'logout', isAuthenticated: false, user: null }
            }))
            
            await navigate.to(ROUTES.LOGIN)
            throw new Error('Session expired')
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const blob = await response.blob()
        // Return blob with headers attached
        return Object.assign(blob, {
          headers: Object.fromEntries(response.headers.entries())
        }) as T
      }

      // Check content-type
      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        // Check if it's CSV or other binary content
        if (contentType && (contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
          const blob = await response.blob()
          return blob as T
        }
        
        // Return empty response if not JSON
        return {} as T
      }

      const result: LaravelResponse<T> = await response.json()

      if (!response.ok) {
        // Laravel validation errors (422)
        if (response.status === 422 && result.errors) {
          throw new ValidationError(result.errors, result.message || 'Błąd walidacji')
        }

        if (response.status === 403) {
          document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
              type: 'error',
              message: 'Nie masz uprawnień do tej akcji.',
              duration: 5000
            }
          }))
        }

        if (response.status === 404) {
          document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
              type: 'error',
              message: 'Nie znaleziono żądanego zasobu.',
              duration: 5000
            }
          }))
        }

        if (response.status >= 500) {
          document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
              type: 'error',
              message: 'Błąd serwera. Spróbuj ponownie za chwilę.',
              duration: 5000
            }
          }))
        }

        // CSRF token error po retry
        if (response.status === 419) {
          throw new Error('Błąd weryfikacji CSRF. Odśwież stronę i spróbuj ponownie.')
        }

        // Unauthorized - wyczyść auth data
        if (response.status === 401) {
          console.error('⚠️ 401 Unauthorized detected for:', endpoint)
          console.error('Response status:', response.status)
          console.error('Response headers:', Object.fromEntries(response.headers.entries()))
          
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_permissions')

          // NOWE: Sprawdź czy to wygaśnięcie sesji czy brak autoryzacji
          const isSessionExpired = !!localStorage.getItem('auth_token') ||
              window.location.hash.includes('/dashboard') ||
              window.location.hash.includes('/profile')

          // NOWE: Pokaż odpowiedni komunikat
          document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
              type: 'warning',
              message: isSessionExpired
                  ? 'Twoja sesja wygasła. Zaloguj się ponownie.'
                  : 'Wymagane logowanie do tej strony.',
              duration: 6000
            }
          }))

          // Clear auth data from storage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          
          // Emit auth change event
          document.dispatchEvent(new CustomEvent('auth:change', {
            detail: { type: 'logout', isAuthenticated: false, user: null }
          }))

          // Redirect tylko jeśli nie jesteśmy już na stronie auth
          if (!window.location.hash.includes('/login') &&
              !window.location.hash.includes('/register') &&
              !window.location.hash.includes('/forgot-password')) {

            try {
              await navigate.to(ROUTES.LOGIN)
            } catch (navError) {
              console.warn('Navigation failed during 401 redirect, using fallback:', navError)
              // Fallback - direct window redirect
              window.location.href = '/login'
            }
          }
        }

        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Laravel zawsze zwraca success/data format
      return result as T

    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error)

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Błąd połączenia z serwerem. Sprawdź połączenie internetowe.')
      }

      throw error
    }
  }

  async get<T>(endpoint: string, params?: any, config?: RequestInit & { responseType?: 'json' | 'blob' }): Promise<T> {
    // Add query parameters to the endpoint if provided
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString()
      endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`
    }
    return this.request<T>(endpoint, { method: 'GET', ...config }, 0)
  }

  async post<T>(endpoint: string, data?: any, config?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
      ...config
    }, 0)
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, 0)
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }, 0)
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, 0)
  }

  // Metoda do odświeżenia CSRF tokenu dla Sanctum
  async refreshCSRF(): Promise<void> {
    try {

      await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      // Odczytaj token z meta tag
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      this.csrfToken = token || ''

    } catch (error) {
      console.error('❌ Failed to refresh CSRF token:', error)
      // Nie rzucaj błędu - pozwól żądaniu kontynuować
    }
  }

  async downloadFile(endpoint: string): Promise<{ blob: Blob; filename: string }> {
    try {
      const response = await this.request<Blob & { headers: Record<string, string> }>(
        endpoint,
        {
          method: 'GET',
          responseType: 'blob',
          headers: {
            'Accept': 'application/octet-stream'
          }
        }
      )

      // Extract filename from content-disposition header
      let filename = 'download'
      const contentDisposition = response.headers?.['content-disposition']
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      return { blob: response, filename }
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  }
}

export const api = new ApiService()