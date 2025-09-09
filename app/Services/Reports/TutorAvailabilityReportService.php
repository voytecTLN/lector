<?php

namespace App\Services\Reports;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TutorAvailabilityReportService
{
    /**
     * Generuj raport dostępności lektorów
     */
    public function generateReport(array $filters): array
    {
        try {
            $dateFrom = Carbon::parse($filters['dateFrom'] ?? Carbon::now()->subMonth());
            $dateTo = Carbon::parse($filters['dateTo'] ?? Carbon::now())->endOfDay();
        
            // Pobierz dane z logów
            $query = DB::table('tutor_availability_logs')
                ->whereBetween('created_at', [$dateFrom, $dateTo]);
        
        if (!empty($filters['tutorId'])) {
            $query->where('tutor_id', $filters['tutorId']);
        }
        
        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }
        
        $logs = $query->get();
        
        // Agreguj dane
        $summary = $this->calculateSummary($logs, $dateFrom, $dateTo);
        $tutorStats = $this->calculateTutorStats($logs);
        $dailyActivity = $this->calculateDailyActivity($logs, $dateFrom, $dateTo);
        
            return [
                'summary' => $summary,
                'tutors' => $tutorStats,
                'dailyActivity' => $dailyActivity
            ];
        } catch (\Exception $e) {
            \Log::error('Error in TutorAvailabilityReportService: ' . $e->getMessage(), [
                'filters' => $filters,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
    
    /**
     * Oblicz podsumowanie
     */
    private function calculateSummary(Collection $logs, Carbon $dateFrom, Carbon $dateTo): array
    {
        $totalAdded = $logs->where('action', 'added')->count();
        $totalRemoved = $logs->where('action', 'deleted')->count();
        $totalModified = $logs->whereIn('action', ['updated', 'bulk_update'])->count();
        
        $activeTutors = $logs->pluck('tutor_id')->unique()->count();
        
        return [
            'totalAdded' => $totalAdded,
            'totalRemoved' => $totalRemoved,
            'totalModified' => $totalModified,
            'activeTutors' => $activeTutors,
            'dateRange' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d')
            ]
        ];
    }
    
    /**
     * Oblicz statystyki per lektor
     */
    private function calculateTutorStats(Collection $logs): array
    {
        $tutorIds = $logs->pluck('tutor_id')->unique();
        
        $tutors = User::whereIn('id', $tutorIds)
            ->with('tutorProfile')
            ->get()
            ->keyBy('id');
        
        $stats = [];
        
        foreach ($tutorIds as $tutorId) {
            $tutorLogs = $logs->where('tutor_id', $tutorId);
            $tutor = $tutors->get($tutorId);
            
            if (!$tutor) {
                continue;
            }
            
            $stats[] = [
                'tutorId' => $tutorId,
                'tutorName' => $tutor->name,
                'added' => $tutorLogs->where('action', 'added')->count(),
                'removed' => $tutorLogs->where('action', 'deleted')->count(),
                'modified' => $tutorLogs->whereIn('action', ['updated', 'bulk_update'])->count(),
                'lastActivity' => $tutorLogs->sortByDesc('created_at')->first()?->created_at 
                    ? Carbon::parse($tutorLogs->sortByDesc('created_at')->first()->created_at)->format('Y-m-d H:i')
                    : 'Brak'
            ];
        }
        
        // Sortuj po całkowitej liczbie zmian
        usort($stats, function($a, $b) {
            $totalA = $a['added'] + $a['removed'] + $a['modified'];
            $totalB = $b['added'] + $b['removed'] + $b['modified'];
            return $totalB - $totalA;
        });
        
        return $stats;
    }
    
    /**
     * Oblicz aktywność dzienną
     */
    private function calculateDailyActivity(Collection $logs, Carbon $dateFrom, Carbon $dateTo): array
    {
        $dailyStats = [];
        $currentDate = $dateFrom->copy();
        
        while ($currentDate <= $dateTo) {
            $dayLogs = $logs->filter(function($log) use ($currentDate) {
                return Carbon::parse($log->created_at)->format('Y-m-d') === $currentDate->format('Y-m-d');
            });
            
            $dailyStats[] = [
                'date' => $currentDate->format('Y-m-d'),
                'added' => $dayLogs->where('action', 'added')->count(),
                'removed' => $dayLogs->where('action', 'deleted')->count(),
                'modified' => $dayLogs->whereIn('action', ['updated', 'bulk_update'])->count()
            ];
            
            $currentDate->addDay();
        }
        
        return $dailyStats;
    }
}