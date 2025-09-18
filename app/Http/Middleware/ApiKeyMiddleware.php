<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key') ?? $request->input('api_key');
        $validApiKeys = explode(',', config('app.external_api_keys', ''));

        // Loguj próbę dostępu
        Log::channel('api')->info('🔐 API Key Verification Attempt', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'endpoint' => $request->getPathInfo(),
            'method' => $request->method(),
            'has_api_key' => !empty($apiKey),
            'api_key_preview' => $apiKey ? substr($apiKey, 0, 8) . '...' : null,
        ]);

        if (empty($apiKey)) {
            Log::channel('api')->warning('⚠️ API Access Denied - Missing API Key', [
                'ip' => $request->ip(),
                'endpoint' => $request->getPathInfo(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Brak klucza API. Podaj klucz w nagłówku X-API-Key lub parametrze api_key.'
            ], 401);
        }

        if (!in_array($apiKey, $validApiKeys) || empty($validApiKeys[0])) {
            Log::channel('api')->warning('🚫 API Access Denied - Invalid API Key', [
                'ip' => $request->ip(),
                'endpoint' => $request->getPathInfo(),
                'api_key_preview' => substr($apiKey, 0, 8) . '...',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Nieprawidłowy klucz API.'
            ], 403);
        }

        Log::channel('api')->info('✅ API Access Granted', [
            'ip' => $request->ip(),
            'endpoint' => $request->getPathInfo(),
        ]);

        return $next($request);
    }
}
