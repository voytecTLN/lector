// resources/ts/services/CorsTestService.ts
import { api } from '@services/ApiService'

export class CorsTestService {
    /**
     * Test CORS configuration by making a simple API call
     */
    static async testCorsConfiguration(): Promise<boolean> {
        try {
            console.log('🔄 Testing CORS configuration...')
            
            const response = await api.get('/health')
            
            console.log('✅ CORS test successful:', response)
            return true
        } catch (error: any) {
            console.error('❌ CORS test failed:', error)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                response: error.response,
                headers: error.response?.headers
            })
            return false
        }
    }
    
    /**
     * Test authentication endpoint with CORS
     */
    static async testAuthCors(): Promise<boolean> {
        try {
            console.log('🔄 Testing authentication CORS...')
            
            // Test with invalid credentials to check CORS headers
            const response = await api.post('/auth/login', {
                email: 'test@example.com',
                password: 'invalid'
            })
            
            console.log('✅ Auth CORS test response:', response)
            return true
        } catch (error: any) {
            // Even if auth fails, CORS should work
            if (error.status === 422 || error.status === 401) {
                console.log('✅ Auth CORS working (expected auth failure)')
                return true
            }
            
            console.error('❌ Auth CORS test failed:', error)
            return false
        }
    }
}