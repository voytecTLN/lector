<?php

namespace App\Services;

use App\Models\User;
use App\Models\StudentProfile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Exception;

class StudentImportService
{
    public function __construct(
        private StudentService $studentService
    ) {}

    /**
     * Generate CSV template with headers and sample data
     */
    public function generateCsvTemplate(): string
    {
        $headers = [
            'name',
            'email', 
            'phone',
            'birth_date',
            'city',
            'country',
            'learning_languages',
            'learning_goals',
            'current_levels'
        ];

        $sampleData = [
            'Jan Kowalski',
            'jan.kowalski@example.com',
            '+48123456789',
            '1990-01-15',
            'Warszawa',
            'Polska',
            'english,german',
            'conversation,business',
            'english:B1,german:A2'
        ];

        $output = fopen('php://temp', 'w');
        
        // Add BOM for UTF-8
        fwrite($output, "\xEF\xBB\xBF");
        
        // Add headers
        fputcsv($output, $headers);
        
        // Add sample data
        fputcsv($output, $sampleData);
        
        rewind($output);
        $csvData = stream_get_contents($output);
        fclose($output);
        
        return $csvData;
    }

    /**
     * Preview import without actually importing
     */
    public function previewImport(UploadedFile $file): array
    {
        $csvData = $this->parseCsvFile($file);
        
        $validRows = [];
        $invalidRows = [];
        $rowNumber = 1; // Start from 1 (header is row 0)
        
        foreach ($csvData as $row) {
            $rowNumber++;
            
            $validationResult = $this->validateRow($row, $rowNumber);
            
            if ($validationResult['valid']) {
                $validRows[] = [
                    'row' => $rowNumber,
                    'data' => $row
                ];
            } else {
                $invalidRows[] = [
                    'row' => $rowNumber,
                    'data' => $row,
                    'errors' => $validationResult['errors']
                ];
            }
        }
        
        return [
            'total_rows' => count($csvData),
            'valid_rows' => count($validRows),
            'invalid_rows' => count($invalidRows),
            'valid_data' => array_slice($validRows, 0, 5), // Show first 5 valid rows
            'invalid_data' => array_slice($invalidRows, 0, 10), // Show first 10 invalid rows
            'can_import' => count($validRows) > 0
        ];
    }

    /**
     * Import students from CSV file
     */
    public function importStudents(UploadedFile $file): array
    {
        $csvData = $this->parseCsvFile($file);
        
        $successCount = 0;
        $failureCount = 0;
        $errors = [];
        $rowNumber = 1;
        
        DB::beginTransaction();
        
        try {
            foreach ($csvData as $row) {
                $rowNumber++;
                
                $validationResult = $this->validateRow($row, $rowNumber);
                
                if ($validationResult['valid']) {
                    try {
                        $this->createStudentFromRow($row);
                        $successCount++;
                    } catch (Exception $e) {
                        $failureCount++;
                        $errors[] = [
                            'row' => $rowNumber,
                            'message' => 'Błąd podczas tworzenia studenta: ' . $e->getMessage()
                        ];
                    }
                } else {
                    $failureCount++;
                    $errors[] = [
                        'row' => $rowNumber,
                        'message' => 'Błąd walidacji: ' . implode(', ', $validationResult['errors'])
                    ];
                }
            }
            
            DB::commit();
            
            return [
                'success_count' => $successCount,
                'failure_count' => $failureCount,
                'total_rows' => count($csvData),
                'errors' => array_slice($errors, 0, 20) // Show first 20 errors
            ];
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Parse CSV file and return array of rows
     */
    private function parseCsvFile(UploadedFile $file): array
    {
        $csvData = [];
        $handle = fopen($file->getRealPath(), 'r');
        
        if ($handle === false) {
            throw new Exception('Nie można otworzyć pliku CSV');
        }
        
        // Skip BOM if present
        if (fgets($handle, 4) !== "\xEF\xBB\xBF") {
            rewind($handle);
        }
        
        // Read headers
        $headers = fgetcsv($handle);
        
        if (!$headers) {
            fclose($handle);
            throw new Exception('Plik CSV jest pusty lub ma nieprawidłowy format');
        }
        
        // Validate headers
        $expectedHeaders = ['name', 'email', 'phone', 'birth_date', 'city', 'country', 'learning_languages', 'learning_goals', 'current_levels'];
        if (array_diff($expectedHeaders, $headers)) {
            fclose($handle);
            throw new Exception('Nieprawidłowe nagłówki CSV. Użyj szablonu.');
        }
        
        $rowCount = 0;
        while (($row = fgetcsv($handle)) !== false && $rowCount < 100) {
            if (count($row) !== count($headers)) {
                continue; // Skip malformed rows
            }
            
            $csvData[] = array_combine($headers, $row);
            $rowCount++;
        }
        
        fclose($handle);
        
        if ($rowCount >= 100) {
            throw new Exception('Plik zawiera więcej niż 100 wierszy. Maksimum to 100 studentów na import.');
        }
        
        return $csvData;
    }

    /**
     * Validate single row data
     */
    private function validateRow(array $row, int $rowNumber): array
    {
        $validator = Validator::make($row, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'birth_date' => 'required|date|before:today',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'learning_languages' => 'nullable|string',
            'learning_goals' => 'nullable|string',
            'current_levels' => 'nullable|string'
        ]);
        
        $errors = [];
        
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $errors[] = $error;
            }
        }
        
        // Check if email already exists
        if (User::where('email', $row['email'])->exists()) {
            $errors[] = 'Email już istnieje w systemie';
        }
        
        // Validate learning languages format
        if (!empty($row['learning_languages'])) {
            $languages = explode(',', $row['learning_languages']);
            $validLanguages = ['english', 'german', 'french', 'spanish', 'italian', 'russian'];
            
            foreach ($languages as $lang) {
                if (!in_array(trim($lang), $validLanguages)) {
                    $errors[] = 'Nieprawidłowy język: ' . trim($lang);
                }
            }
        }
        
        // Validate learning goals format
        if (!empty($row['learning_goals'])) {
            $goals = explode(',', $row['learning_goals']);
            $validGoals = ['conversation', 'business', 'exam', 'travel', 'academic', 'hobby'];
            
            foreach ($goals as $goal) {
                if (!in_array(trim($goal), $validGoals)) {
                    $errors[] = 'Nieprawidłowy cel nauki: ' . trim($goal);
                }
            }
        }
        
        // Validate current levels format
        if (!empty($row['current_levels'])) {
            $levels = explode(',', $row['current_levels']);
            $validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            
            foreach ($levels as $level) {
                if (strpos($level, ':') !== false) {
                    list($lang, $lvl) = explode(':', $level);
                    if (!in_array(trim($lvl), $validLevels)) {
                        $errors[] = 'Nieprawidłowy poziom: ' . trim($lvl);
                    }
                }
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Create student from CSV row data
     */
    private function createStudentFromRow(array $row): User
    {
        $studentData = [
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'birth_date' => $row['birth_date'],
            'city' => $row['city'] ?: null,
            'country' => $row['country'] ?: 'Polska',
            'password' => Str::random(12), // Generate random password
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(), // Mark as verified during import
            'is_import' => true // Flag to skip welcome email
        ];
        
        // Parse learning languages
        if (!empty($row['learning_languages'])) {
            $studentData['learning_languages'] = array_map('trim', explode(',', $row['learning_languages']));
        }
        
        // Parse learning goals
        if (!empty($row['learning_goals'])) {
            $studentData['learning_goals'] = array_map('trim', explode(',', $row['learning_goals']));
        }
        
        // Parse current levels
        if (!empty($row['current_levels'])) {
            $levels = [];
            foreach (explode(',', $row['current_levels']) as $level) {
                if (strpos($level, ':') !== false) {
                    list($lang, $lvl) = explode(':', $level);
                    $levels[trim($lang)] = trim($lvl);
                }
            }
            $studentData['current_levels'] = $levels;
        }
        
        return $this->studentService->createStudent($studentData);
    }
}