// resources/ts/services/ApiService.ts - Poprawiony

import {ValidationError} from "@/types/models";

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
    // Pobierz najnowszy token z localStorage
    const authToken = this.getAuthToken()

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': this.csrfToken,
    }

    // Dodaj token autoryzacji jeśli jest dostępny
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    // Dodaj Content-Type dla żądań z body
    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method) && options.body) {
      headers['Content-Type'] = 'application/json'
    }

    // Połącz nagłówki
    const finalHeaders = {
      ...headers,
      ...options.headers
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: finalHeaders,
        credentials: 'same-origin' // Dodaj obsługę ciasteczek
      })

      // Sprawdź czy odpowiedź ma content
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        // Jeśli nie ma JSON, zwróć pustą odpowiedź
        return {} as T
      }

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 422 && result.errors) {
          throw new ValidationError(result.errors, result.message)
        }

        if (response.status === 401) {
          // Token wygasł lub nieprawidłowy - wyczyść localStorage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_permissions')

          // Przekieruj do logowania jeśli nie jesteśmy już na stronie logowania
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }

        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return result

    } catch (error) {
      // Jeśli to błąd sieci lub inny nieoczekiwany błąd
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Błąd połączenia z serwerem. Sprawdź połączenie internetowe.')
      }

      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  // Metoda do odświeżenia CSRF tokenu
  async refreshCSRF(): Promise<void> {
    try {
      const response = await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin'
      })

      if (response.ok) {
        this.initCSRF()
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error)
    }
  }
}

export const api = new ApiService()