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

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': this.csrfToken
      }
    })
    return response.json()
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': this.csrfToken
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

export const api = new ApiService()