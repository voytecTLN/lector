// resources/ts/services/CorsTestService.ts
import { api } from '@services/ApiService'

export class CorsTestService {
    /**
     * Test CORS configuration by making a simple API call
     */
    static async testCorsConfiguration(): Promise<boolean> {
        try {
            const response = await api.get('/health')
            return true
        } catch (error: any) {
            return false
        }
    }
    
    /**
     * Test authentication endpoint with CORS
     */
    static async testAuthCors(): Promise<boolean> {
        try {
            // Test with invalid credentials to check CORS headers
            const response = await api.post('/auth/login', {
                email: 'test@example.com',
                password: 'invalid'
            })
            
            return true
        } catch (error: any) {
            // Even if auth fails, CORS should work
            if (error.status === 422 || error.status === 401) {
                return true
            }
            
            return false
        }
    }
}