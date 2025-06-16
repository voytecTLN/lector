// resources/ts/services/ApiService.ts - Zgodny z Laravel Sanctum
import { ValidationError } from "@/types/models"

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

        // Unauthorized - wyczyść auth data
        if (response.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_permissions')

          // Emit auth change event
          document.dispatchEvent(new CustomEvent('auth:change', {
            detail: { type: 'logout', isAuthenticated: false, user: null }
          }))

          // Redirect tylko jeśli nie jesteśmy już na stronie auth
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }

        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Laravel zawsze zwraca success/data format
      // return result.data || result as T
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
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Metoda do odświeżenia CSRF tokenu dla Sanctum
  async refreshCSRF(): Promise<void> {
    try {
      await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin'
      })

      // Odczytaj token ponownie
      this.initCSRF()
    } catch (error) {
      console.warn('Failed to refresh CSRF token:', error)
    }
  }
}

export const api = new ApiService()