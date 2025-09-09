<?php

namespace App\Services\Reports;

use App\Models\User;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StudentActivityReportService
{
    /**
     * Generuj raport aktywności studentów
     */
    public function generateReport(array $filters): array
    {
        try {
            $dateFrom = Carbon::parse($filters['dateFrom'] ?? Carbon::now()->subMonth());
            $dateTo = Carbon::parse($filters['dateTo'] ?? Carbon::now())->endOfDay();
        
            // Pobierz studentów z lekcjami w okresie (użyj lesson_date zamiast scheduled_at)
            $query = Lesson::whereBetween('lesson_date', [$dateFrom->format('Y-m-d'), $dateTo->format('Y-m-d')]);
        
        if (!empty($filters['studentId'])) {
            $query->where('student_id', $filters['studentId']);
        }
        
        $lessons = $query->get();
        
        // Pobierz wszystkich studentów
        $studentIds = $lessons->pluck('student_id')->unique();
        $students = User::whereIn('id', $studentIds)
            ->where('role', 'student')
            ->with('studentProfile')
            ->get()
            ->keyBy('id');
        
        // Agreguj dane
        $summary = $this->calculateSummary($lessons, $students, $dateFrom, $dateTo);
        $studentStats = $this->calculateStudentStats($lessons, $students);
        $activityTrends = $this->calculateActivityTrends($lessons, $dateFrom, $dateTo);
        
            return [
                'summary' => $summary,
                'students' => $studentStats,
                'activityTrends' => $activityTrends
            ];
        } catch (\Exception $e) {
            \Log::error('Error in StudentActivityReportService: ' . $e->getMessage(), [
                'filters' => $filters,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
    
    /**
     * Oblicz podsumowanie
     */
    private function calculateSummary($lessons, $students, Carbon $dateFrom, Carbon $dateTo): array
    {
        $totalStudents = $students->count();
        $activeStudents = $lessons->pluck('student_id')->unique()->count();
        $totalLessons = $lessons->count();
        
        $averageLessonsPerStudent = $activeStudents > 0 
            ? round($totalLessons / $activeStudents, 1)
            : 0;
        
        return [
            'totalStudents' => $totalStudents,
            'activeStudents' => $activeStudents,
            'totalLessons' => $totalLessons,
            'averageLessonsPerStudent' => $averageLessonsPerStudent,
            'dateRange' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d')
            ]
        ];
    }
    
    /**
     * Oblicz statystyki per student
     */
    private function calculateStudentStats($lessons, $students): array
    {
        $stats = [];
        
        foreach ($students as $student) {
            $studentLessons = $lessons->where('student_id', $student->id);
            
            $stats[] = [
                'studentId' => $student->id,
                'studentName' => $student->name,
                'lessonsBooked' => $studentLessons->count(),
                'lessonsCompleted' => $studentLessons->where('status', 'completed')->count(),
                'lessonsCancelled' => $studentLessons->whereIn('status', [
                    'cancelled', 
                    'student_cancelled', 
                    'tutor_cancelled'
                ])->count(),
                'lastActivity' => $studentLessons->sortByDesc('lesson_date')->first()
                    ? Carbon::parse($studentLessons->sortByDesc('lesson_date')->first()->lesson_date)->format('Y-m-d')
                    : 'Brak',
                'registeredAt' => Carbon::parse($student->created_at)->format('Y-m-d')
            ];
        }
        
        // Sortuj po liczbie zarezerwowanych lekcji
        usort($stats, function($a, $b) {
            return $b['lessonsBooked'] - $a['lessonsBooked'];
        });
        
        return $stats;
    }
    
    /**
     * Oblicz trendy aktywności
     */
    private function calculateActivityTrends($lessons, Carbon $dateFrom, Carbon $dateTo): array
    {
        $trends = [];
        $currentDate = $dateFrom->copy();
        
        while ($currentDate <= $dateTo) {
            $dayLessons = $lessons->filter(function($lesson) use ($currentDate) {
                return Carbon::parse($lesson->lesson_date)->format('Y-m-d') === $currentDate->format('Y-m-d');
            });
            
            $trends[] = [
                'date' => $currentDate->format('Y-m-d'),
                'bookings' => $dayLessons->whereIn('status', ['scheduled', 'confirmed'])->count(),
                'completions' => $dayLessons->where('status', 'completed')->count(),
                'cancellations' => $dayLessons->whereIn('status', [
                    'cancelled',
                    'student_cancelled',
                    'tutor_cancelled'
                ])->count()
            ];
            
            $currentDate->addDay();
        }
        
        return $trends;
    }
}