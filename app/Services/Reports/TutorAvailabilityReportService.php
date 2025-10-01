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
        $mode = $filters['mode'] ?? 'summary';

        if ($mode === 'net-availability') {
            return $this->generateNetAvailabilityReport($filters);
        }

        // Existing summary report logic
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
     * Generuj raport dostępności netto
     */
    public function generateNetAvailabilityReport(array $filters): array
    {
        try {
            $dateFrom = Carbon::parse($filters['dateFrom'] ?? Carbon::now()->startOfMonth());
            $dateTo = Carbon::parse($filters['dateTo'] ?? Carbon::now()->endOfMonth())->endOfDay();

            // Pobierz wszystkie logi w zakresie dat
            $query = DB::table('tutor_availability_logs')
                ->whereBetween('date', [$dateFrom->format('Y-m-d'), $dateTo->format('Y-m-d')])
                ->whereIn('action', ['added', 'deleted']);

            if (!empty($filters['tutorId'])) {
                $query->where('tutor_id', $filters['tutorId']);
            }

            $logs = $query->orderBy('tutor_id')->orderBy('date')->orderBy('created_at')->get();

            // Oblicz netto dostępność
            $netSlots = $this->calculateNetAvailabilitySlots($logs);

            // Oblicz statystyki tutorów z net slots
            $tutorStats = $this->calculateTutorStatsFromNetSlots($netSlots, $logs);

            // Podsumowanie
            $summary = [
                'totalSlots' => count($netSlots),
                'totalHours' => count($netSlots), // Każdy slot = 1 godzina (można dostosować)
                'totalTutors' => collect($netSlots)->pluck('tutor_id')->unique()->count(),
                'dateRange' => [
                    'from' => $dateFrom->format('Y-m-d'),
                    'to' => $dateTo->format('Y-m-d')
                ]
            ];

            return [
                'mode' => 'net-availability',
                'slots' => $netSlots,
                'tutors' => $tutorStats,
                'summary' => $summary
            ];

        } catch (\Exception $e) {
            \Log::error('Error in generateNetAvailabilityReport: ' . $e->getMessage(), [
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
            
            // Oblicz liczby akcji (proste liczenie)
            $addedCount = $tutorLogs->where('action', 'added')->count();
            $removedCount = $tutorLogs->where('action', 'deleted')->count();
            $modifiedCount = $tutorLogs->whereIn('action', ['updated', 'bulk_update'])->count();

            // Bilans netto - proste odejmowanie akcji
            $netHours = $addedCount - $removedCount;

            $stats[] = [
                'tutorId' => $tutorId,
                'tutorName' => $tutor->name,
                'added' => $addedCount,
                'removed' => $removedCount,
                'modified' => $modifiedCount,
                'hoursNet' => $netHours,
                'lastActivity' => $tutorLogs->sortByDesc('created_at')->first()?->created_at
                    ? Carbon::parse($tutorLogs->sortByDesc('created_at')->first()->created_at)->format('Y-m-d H:i')
                    : 'Brak'
            ];
        }
        
        // Sortuj po całkowitej liczbie zmian
        usort($stats, function($a, $b) {
            $totalA = $a['added'] + $a['removed'];
            $totalB = $b['added'] + $b['removed'];
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

    /**
     * Oblicz godziny z logów
     */
    private function calculateHoursFromLogs(Collection $logs, string $slotField): float
    {
        $totalHours = 0;

        foreach ($logs as $log) {
            $slots = json_decode($log->$slotField, true);
            if ($slots) {
                $totalHours += $this->calculateHoursFromSlots($slots);
            }
        }

        return $totalHours;
    }

    /**
     * Oblicz godziny ze slotów
     */
    private function calculateHoursFromSlots(array $slots): float
    {
        $totalMinutes = 0;

        foreach ($slots as $slot) {
            if (isset($slot['start_time']) && isset($slot['end_time'])) {
                $start = Carbon::parse($slot['start_time']);
                $end = Carbon::parse($slot['end_time']);

                // Jeśli end_time jest przed start_time, dodaj dzień (przejście przez północ)
                if ($end->lt($start)) {
                    $end->addDay();
                }

                $totalMinutes += $end->diffInMinutes($start);
            } elseif (isset($slot['from']) && isset($slot['to'])) {
                // Alternatywny format
                $start = Carbon::parse($slot['from']);
                $end = Carbon::parse($slot['to']);

                if ($end->lt($start)) {
                    $end->addDay();
                }

                $totalMinutes += $end->diffInMinutes($start);
            }
        }

        return $totalMinutes / 60; // Konwertuj na godziny
    }

    /**
     * Oblicz netto dostępność - sloty które były dodane ale nie usunięte
     */
    private function calculateNetAvailabilitySlots(Collection $logs): array
    {
        // Pobierz informacje o tutorach
        $tutorIds = $logs->pluck('tutor_id')->unique();
        $tutors = User::whereIn('id', $tutorIds)->get()->keyBy('id');

        $netSlots = [];
        $slotTracker = []; // Śledź [tutor_id][date][time_slot] = status

        foreach ($logs as $log) {
            $tutorId = $log->tutor_id;
            $date = $log->date;
            $newSlots = json_decode($log->new_slots, true) ?? [];
            $oldSlots = json_decode($log->old_slots, true) ?? [];

            if ($log->action === 'added' && !empty($newSlots)) {
                // Dodaj sloty
                foreach ($newSlots as $slot) {
                    $timeSlot = $this->formatTimeSlot($slot);
                    if ($timeSlot) {
                        $slotKey = "{$tutorId}_{$date}_{$timeSlot}";
                        $slotTracker[$slotKey] = [
                            'status' => 'added',
                            'tutor_id' => $tutorId,
                            'date' => $date,
                            'time_slot' => $timeSlot,
                            'tutor_name' => $tutors->get($tutorId)?->name ?? 'Unknown',
                            'created_at' => $log->created_at,
                            'log_id' => $log->id ?? null
                        ];
                    }
                }
            } elseif ($log->action === 'deleted' && !empty($oldSlots)) {
                // Usuń sloty
                foreach ($oldSlots as $slot) {
                    $timeSlot = $this->formatTimeSlot($slot);
                    if ($timeSlot) {
                        $slotKey = "{$tutorId}_{$date}_{$timeSlot}";
                        // Oznacz jako usunięty
                        if (isset($slotTracker[$slotKey])) {
                            $slotTracker[$slotKey]['status'] = 'deleted';
                        }
                    }
                }
            }
        }

        // Filtruj tylko sloty które są 'added' (nie 'deleted')
        $counter = 1;
        foreach ($slotTracker as $slotData) {
            if ($slotData['status'] === 'added') {
                $netSlots[] = [
                    'id' => $counter++,
                    'log_id' => $slotData['log_id'],
                    'tutor_id' => $slotData['tutor_id'],
                    'tutorName' => $slotData['tutor_name'],
                    'date' => $slotData['date'],
                    'timeSlot' => $slotData['time_slot'],
                    'created_at' => $slotData['created_at']
                ];
            }
        }

        // Sortuj według daty i czasu
        usort($netSlots, function($a, $b) {
            $dateCompare = strcmp($a['date'], $b['date']);
            if ($dateCompare !== 0) return $dateCompare;

            $timeCompare = strcmp($a['timeSlot'], $b['timeSlot']);
            if ($timeCompare !== 0) return $timeCompare;

            return strcmp($a['tutorName'], $b['tutorName']);
        });

        return $netSlots;
    }

    /**
     * Formatuj slot czasu do standardowego formatu
     */
    private function formatTimeSlot(array $slot): ?string
    {
        if (isset($slot['start_time']) && isset($slot['end_time'])) {
            return $slot['start_time'] . '-' . $slot['end_time'];
        } elseif (isset($slot['from']) && isset($slot['to'])) {
            return $slot['from'] . '-' . $slot['to'];
        }

        return null;
    }

    /**
     * Oblicz statystyki tutorów z net slots dla CSV
     */
    private function calculateTutorStatsFromNetSlots(array $netSlots, Collection $logs): array
    {
        $tutorStats = [];

        // Grupuj sloty według tutorów
        $slotsByTutor = collect($netSlots)->groupBy('tutor_id');

        foreach ($slotsByTutor as $tutorId => $tutorSlots) {
            $tutorName = $tutorSlots->first()['tutorName'] ?? 'Unknown';

            // Policz wszystkie akcje tego tutora w logach
            $tutorLogs = $logs->where('tutor_id', $tutorId);
            $addedCount = $tutorLogs->where('action', 'added')->count();
            $removedCount = $tutorLogs->where('action', 'deleted')->count();
            $netCount = $tutorSlots->count(); // Faktyczne dostępne sloty

            $tutorStats[] = [
                'tutorName' => $tutorName,
                'added' => $addedCount,
                'removed' => $removedCount,
                'netto' => $netCount
            ];
        }

        // Sortuj według liczby netto slotów
        usort($tutorStats, function($a, $b) {
            return $b['netto'] - $a['netto'];
        });

        return $tutorStats;
    }
}