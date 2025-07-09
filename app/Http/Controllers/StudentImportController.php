<?php

namespace App\Http\Controllers;

use App\Services\StudentImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StudentImportController extends BaseController
{
    public function __construct(
        private StudentImportService $studentImportService
    ) {}

    /**
     * Download CSV template for student import
     */
    public function downloadTemplate()
    {
        $csvData = $this->studentImportService->generateCsvTemplate();
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="szablon_importu_studentow.csv"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ];

        return response($csvData, 200, $headers);
    }

    /**
     * Preview CSV import - validate and show summary without importing
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048'
        ]);

        try {
            $file = $request->file('file');
            $previewResult = $this->studentImportService->previewImport($file);
            
            return $this->successResponse($previewResult, 'Podgląd importu wygenerowany pomyślnie');
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'generowania podglądu importu');
        }
    }

    /**
     * Import students from CSV file
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048'
        ]);

        try {
            $file = $request->file('file');
            $importResult = $this->studentImportService->importStudents($file);
            
            return $this->successResponse($importResult, 'Import studentów zakończony');
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'importu studentów');
        }
    }
}