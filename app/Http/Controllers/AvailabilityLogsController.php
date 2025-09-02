<?php

namespace App\Http\Controllers;

use App\Models\TutorAvailabilityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class AvailabilityLogsController extends Controller
{
    /**
     * Get availability logs for admin dashboard
     */
    public function index(Request $request): JsonResponse
    {
        $query = TutorAvailabilityLog::with(['tutor', 'changedBy']);

        // Filter by tutor
        if ($request->tutor_id) {
            $query->where('tutor_id', $request->tutor_id);
        }

        // Filter by action
        if ($request->action) {
            $query->where('action', $request->action);
        }

        // Filter by date range
        if ($request->date_from) {
            $query->where('created_at', '>=', Carbon::parse($request->date_from)->startOfDay());
        }
        if ($request->date_to) {
            $query->where('created_at', '<=', Carbon::parse($request->date_to)->endOfDay());
        }

        // Search by tutor name
        if ($request->search) {
            $query->whereHas('tutor', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        // Pagination
        $perPage = $request->per_page ?? 20;
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Transform the data
        $logs->through(function ($log) {
            return [
                'id' => $log->id,
                'tutor' => [
                    'id' => $log->tutor->id,
                    'name' => $log->tutor->name,
                    'email' => $log->tutor->email,
                ],
                'action' => $log->action,
                'action_label' => $this->getActionLabel($log->action),
                'date' => $log->date ? $log->date->format('Y-m-d') : null,
                'day_of_week' => $log->day_of_week,
                'old_slots' => $log->old_slots,
                'new_slots' => $log->new_slots,
                'description' => $log->description,
                'readable_description' => $log->readable_description,
                'changed_by' => $log->changedBy ? [
                    'id' => $log->changedBy->id,
                    'name' => $log->changedBy->name,
                ] : null,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toIso8601String(),
                'created_at_formatted' => $log->created_at->format('d.m.Y H:i'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'from' => $logs->firstItem(),
                'to' => $logs->lastItem(),
            ]
        ]);
    }

    /**
     * Get statistics for availability logs
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = [
            'total_changes' => TutorAvailabilityLog::count(),
            'changes_today' => TutorAvailabilityLog::whereDate('created_at', today())->count(),
            'changes_this_week' => TutorAvailabilityLog::whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])->count(),
            'changes_this_month' => TutorAvailabilityLog::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'by_action' => TutorAvailabilityLog::selectRaw('action, count(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action'),
            'most_active_tutors' => User::where('role', 'tutor')
                ->withCount('availabilityLogs')
                ->orderBy('availability_logs_count', 'desc')
                ->take(5)
                ->get()
                ->map(function ($tutor) {
                    return [
                        'id' => $tutor->id,
                        'name' => $tutor->name,
                        'changes_count' => $tutor->availability_logs_count
                    ];
                })
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get availability logs for a specific tutor
     */
    public function tutorLogs(int $tutorId, Request $request): JsonResponse
    {
        $query = TutorAvailabilityLog::where('tutor_id', $tutorId)
            ->with(['changedBy']);

        // Filter by date range
        if ($request->date_from) {
            $query->where('created_at', '>=', Carbon::parse($request->date_from)->startOfDay());
        }
        if ($request->date_to) {
            $query->where('created_at', '<=', Carbon::parse($request->date_to)->endOfDay());
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->take(50)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'action_label' => $this->getActionLabel($log->action),
                    'date' => $log->date ? $log->date->format('Y-m-d') : null,
                    'old_slots' => $log->old_slots,
                    'new_slots' => $log->new_slots,
                    'description' => $log->description,
                    'created_at' => $log->created_at->toIso8601String(),
                    'created_at_formatted' => $log->created_at->format('d.m.Y H:i'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Export availability logs to CSV
     */
    public function export(Request $request)
    {
        $query = TutorAvailabilityLog::with(['tutor', 'changedBy']);

        // Apply the same filters as in index method
        if ($request->tutor_id) {
            $query->where('tutor_id', $request->tutor_id);
        }

        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->date_from) {
            $query->where('created_at', '>=', Carbon::parse($request->date_from)->startOfDay());
        }
        if ($request->date_to) {
            $query->where('created_at', '<=', Carbon::parse($request->date_to)->endOfDay());
        }

        if ($request->search) {
            $query->whereHas('tutor', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        // Generate CSV content
        $csvData = [];
        $csvData[] = ['ID', 'Data', 'Godzina', 'Lektor', 'Email', 'Akcja', 'Dzień tygodnia', 'Data dostępności', 'Stare sloty', 'Nowe sloty', 'Opis', 'Zmienione przez', 'IP'];

        foreach ($logs as $log) {
            // Handle slots which are stored as JSON arrays - with extra safety
            $oldSlots = '-';
            if ($log->old_slots) {
                try {
                    if (is_string($log->old_slots)) {
                        $slots = json_decode($log->old_slots, true);
                        if (is_array($slots)) {
                            // Flatten any nested arrays
                            $flatSlots = array_map(function($item) {
                                return is_array($item) ? json_encode($item) : (string)$item;
                            }, $slots);
                            $oldSlots = implode(', ', $flatSlots);
                        }
                    } elseif (is_array($log->old_slots)) {
                        // Flatten any nested arrays
                        $flatSlots = array_map(function($item) {
                            return is_array($item) ? json_encode($item) : (string)$item;
                        }, $log->old_slots);
                        $oldSlots = implode(', ', $flatSlots);
                    }
                } catch (\Exception $e) {
                    $oldSlots = 'Error: ' . $e->getMessage();
                }
            }
            
            $newSlots = '-';
            if ($log->new_slots) {
                try {
                    if (is_string($log->new_slots)) {
                        $slots = json_decode($log->new_slots, true);
                        if (is_array($slots)) {
                            // Flatten any nested arrays
                            $flatSlots = array_map(function($item) {
                                return is_array($item) ? json_encode($item) : (string)$item;
                            }, $slots);
                            $newSlots = implode(', ', $flatSlots);
                        }
                    } elseif (is_array($log->new_slots)) {
                        // Flatten any nested arrays
                        $flatSlots = array_map(function($item) {
                            return is_array($item) ? json_encode($item) : (string)$item;
                        }, $log->new_slots);
                        $newSlots = implode(', ', $flatSlots);
                    }
                } catch (\Exception $e) {
                    $newSlots = 'Error: ' . $e->getMessage();
                }
            }
            
            $csvData[] = [
                $log->id,
                $log->created_at->format('Y-m-d'),
                $log->created_at->format('H:i:s'),
                $log->tutor->name,
                $log->tutor->email,
                $this->getActionLabel($log->action),
                $log->day_of_week ?: '-',
                $log->date ? $log->date->format('Y-m-d') : '-',
                $oldSlots,
                $newSlots,
                $log->description ?: '-',
                $log->changedBy ? $log->changedBy->name : 'System',
                $log->ip_address ?: '-'
            ];
        }

        // Create CSV output
        $filename = 'logi_dostepnosci_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($csvData) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for UTF-8
            
            foreach ($csvData as $row) {
                fputcsv($file, $row, ';');
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get action label
     */
    private function getActionLabel(string $action): string
    {
        $labels = [
            'added' => 'Dodano',
            'updated' => 'Zaktualizowano',
            'deleted' => 'Usunięto',
            'bulk_update' => 'Zbiorcza aktualizacja'
        ];

        return $labels[$action] ?? $action;
    }
}