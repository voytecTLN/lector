// resources/ts/services/ApiService.ts - Zgodny z Laravel Sanctum
import { ValidationError } from "@/types/models"
import { navigateTo } from '@/utils/navigation'

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

  private async request<T>(endpoint: string, options: RequestInit = {}, retryCount: number = 0): Promise<T> {
    // Najpierw pobierz CSRF cookie dla Sanctum (tylko jeśli potrzebne)
    if (!this.csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || 'GET')) {
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

    // Dodaj Content-Type dla żądań z body
    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method) && options.body) {
      headers['Content-Type'] = 'application/json'
    }

    // Połącz z przekazanymi nagłówkami
    const finalHeaders = {
      ...headers,
      ...options.headers
    }

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`)

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: finalHeaders,
        credentials: 'same-origin' // Ważne dla Laravel Sanctum
      })

      console.log(`📡 API Response: ${response.status} ${response.statusText}`)

      // Obsługa 419 - CSRF token mismatch
      if (response.status === 419 && retryCount < 2) {
        console.log('🔄 CSRF token mismatch, refreshing token and retrying...')

        // Odśwież CSRF token
        await this.refreshCSRF()

        // Powtórz żądanie
        return this.request<T>(endpoint, options, retryCount + 1)
      }

      // Sprawdź content-type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        // Zwróć pustą odpowiedź jeśli nie ma JSON
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

          // Emit auth change event
          document.dispatchEvent(new CustomEvent('auth:change', {
            detail: { type: 'logout', isAuthenticated: false, user: null }
          }))

          // Redirect tylko jeśli nie jesteśmy już na stronie auth
          if (!window.location.hash.includes('/login') &&
              !window.location.hash.includes('/register') &&
              !window.location.hash.includes('/forgot-password')) {

            // NOWE: Małe opóźnienie aby użytkownik zobaczył komunikat
            setTimeout(() => {
              navigateTo('/login');
            }, 500)
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

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, 0)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
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
      console.log('🔐 Refreshing CSRF token...')

      await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      // Odczytaj token z meta tag
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      this.csrfToken = token || ''

      console.log('✅ CSRF token refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh CSRF token:', error)
      // Nie rzucaj błędu - pozwól żądaniu kontynuować
    }
  }
}

export const api = new ApiService()