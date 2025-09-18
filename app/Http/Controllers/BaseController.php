<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Exception;

abstract class BaseController extends Controller
{
    /**
     * Handle service exceptions consistently
     */
    protected function handleServiceException(Exception $e, string $action = 'operation'): JsonResponse
    {
        // Log error with context
        if (app()->environment(['local', 'testing'])) {
            \Log::error("Service error during {$action}", [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        } else {
            \Log::error("Service error during {$action}: " . $e->getMessage());
        }

        // Determine response based on exception type
        $response = $this->getErrorResponse($e, $action);
        
        return response()->json($response, $this->getStatusCode($e));
    }

    /**
     * Get error response structure
     */
    private function getErrorResponse(Exception $e, string $action): array
    {
        $baseResponse = [
            'success' => false,
            'message' => $this->getErrorMessage($e, $action)
        ];

        // Add validation errors for ValidationException
        if ($e instanceof ValidationException) {
            $baseResponse['errors'] = $e->errors();
        }

        // Add debug info in development
        if (app()->environment(['local', 'testing']) && config('app.debug')) {
            $baseResponse['debug'] = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ];
        }

        return $baseResponse;
    }

    /**
     * Get user-friendly error message
     */
    private function getErrorMessage(Exception $e, string $action): string
    {
        return match(get_class($e)) {
            ValidationException::class => 'Błąd walidacji danych',
            ModelNotFoundException::class => 'Nie znaleziono zasobu',
            AuthorizationException::class => 'Brak uprawnień do tej akcji',
            QueryException::class => 'Błąd bazy danych',
            default => "Błąd podczas {$action}"
        };
    }

    /**
     * Get HTTP status code based on exception type
     */
    private function getStatusCode(Exception $e): int
    {
        return match(get_class($e)) {
            ValidationException::class => 422,
            ModelNotFoundException::class => 404,
            AuthorizationException::class => 403,
            QueryException::class => 500,
            default => 400  // Changed from 500 to 400 for business logic errors
        };
    }

    /**
     * Handle success responses consistently
     */
    protected function successResponse(
        $data = null, 
        string $message = null, 
        int $statusCode = 200
    ): JsonResponse {
        $response = ['success' => true];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if ($message !== null) {
            $response['message'] = $message;
        }
        
        return response()->json($response, $statusCode);
    }

    /**
     * Handle validation errors consistently
     */
    protected function validationErrorResponse(array $errors, string $message = 'Błąd walidacji danych'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], 422);
    }
}