<?php

namespace App\Services\Reports;

use App\Models\User;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TutorLessonsReportService
{
    /**
     * Generuj raport lekcji lektorów
     */
    public function generateReport(array $filters): array
    {
        $dateFrom = Carbon::parse($filters['dateFrom'] ?? Carbon::now()->subMonth());
        $dateTo = Carbon::parse($filters['dateTo'] ?? Carbon::now())->endOfDay();
        
        // Pobierz lekcje z okresu
        $query = Lesson::whereBetween('scheduled_at', [$dateFrom, $dateTo]);
        
        if (!empty($filters['tutorId'])) {
            $query->where('tutor_id', $filters['tutorId']);
        }
        
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        $lessons = $query->get();
        
        // Agreguj dane
        $summary = $this->calculateSummary($lessons, $dateFrom, $dateTo);
        $tutorStats = $this->calculateTutorStats($lessons);
        $statusBreakdown = $this->calculateStatusBreakdown($lessons);
        
        return [
            'summary' => $summary,
            'tutors' => $tutorStats,
            'statusBreakdown' => $statusBreakdown
        ];
    }
    
    /**
     * Oblicz podsumowanie
     */
    private function calculateSummary($lessons, Carbon $dateFrom, Carbon $dateTo): array
    {
        $totalScheduled = $lessons->count();
        $totalCompleted = $lessons->where('status', 'completed')->count();
        $totalCancelled = $lessons->whereIn('status', ['cancelled', 'student_cancelled', 'tutor_cancelled'])->count();
        $totalInProgress = $lessons->where('status', 'in_progress')->count();
        
        $completionRate = $totalScheduled > 0 
            ? round(($totalCompleted / $totalScheduled) * 100, 1)
            : 0;
        
        return [
            'totalScheduled' => $totalScheduled,
            'totalCompleted' => $totalCompleted,
            'totalCancelled' => $totalCancelled,
            'totalInProgress' => $totalInProgress,
            'completionRate' => $completionRate,
            'dateRange' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d')
            ]
        ];
    }
    
    /**
     * Oblicz statystyki per lektor
     */
    private function calculateTutorStats($lessons): array
    {
        $tutorIds = $lessons->pluck('tutor_id')->unique();
        
        $tutors = User::whereIn('id', $tutorIds)
            ->with('tutorProfile')
            ->get()
            ->keyBy('id');
        
        $stats = [];
        
        foreach ($tutorIds as $tutorId) {
            $tutorLessons = $lessons->where('tutor_id', $tutorId);
            $tutor = $tutors->get($tutorId);
            
            if (!$tutor) {
                continue;
            }
            
            $scheduled = $tutorLessons->count();
            $completed = $tutorLessons->where('status', 'completed')->count();
            $cancelled = $tutorLessons->whereIn('status', ['cancelled', 'student_cancelled', 'tutor_cancelled'])->count();
            $inProgress = $tutorLessons->where('status', 'in_progress')->count();
            
            $completionRate = $scheduled > 0 
                ? round(($completed / $scheduled) * 100, 1)
                : 0;
            
            $stats[] = [
                'tutorId' => $tutorId,
                'tutorName' => $tutor->name,
                'scheduled' => $scheduled,
                'completed' => $completed,
                'cancelled' => $cancelled,
                'inProgress' => $inProgress,
                'completionRate' => $completionRate
            ];
        }
        
        // Sortuj po skuteczności
        usort($stats, function($a, $b) {
            return $b['completionRate'] <=> $a['completionRate'];
        });
        
        return $stats;
    }
    
    /**
     * Oblicz podział według statusów
     */
    private function calculateStatusBreakdown($lessons): array
    {
        return [
            'scheduled' => $lessons->where('status', 'scheduled')->count(),
            'confirmed' => $lessons->where('status', 'confirmed')->count(),
            'in_progress' => $lessons->where('status', 'in_progress')->count(),
            'completed' => $lessons->where('status', 'completed')->count(),
            'cancelled' => $lessons->where('status', 'cancelled')->count(),
            'student_cancelled' => $lessons->where('status', 'student_cancelled')->count(),
            'tutor_cancelled' => $lessons->where('status', 'tutor_cancelled')->count(),
            'rescheduled' => $lessons->where('status', 'rescheduled')->count()
        ];
    }
}