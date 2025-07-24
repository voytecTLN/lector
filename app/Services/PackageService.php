<?php

namespace App\Services;

use App\Models\Package;
use App\Models\User;
use App\Models\PackageAssignment;
use Illuminate\Support\Facades\DB;
use Exception;

class PackageService
{
    /**
     * Get paginated packages with optional filters
     */
    public function getPackages(array $filters = []): array
    {
        $query = Package::query();

        // Apply filters
        if (!empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->where('is_active', true);
            } elseif ($filters['status'] === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price'] * 100); // Convert to cents
        }

        if (!empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price'] * 100); // Convert to cents
        }

        // Order by sort_order and name
        $query->ordered();

        $paginator = $query->paginate($filters['per_page'] ?? 15);

        return [
            'data' => $paginator->items(),
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'has_more_pages' => $paginator->hasMorePages(),
            'filters_applied' => array_filter($filters)
        ];
    }

    /**
     * Get package by ID
     */
    public function getPackageById(int $packageId): Package
    {
        return Package::with(['assignments.student'])->findOrFail($packageId);
    }

    /**
     * Create new package
     */
    public function createPackage(array $data): Package
    {
        DB::beginTransaction();

        try {
            // Convert price from float to cents
            if (isset($data['price'])) {
                $data['price'] = (int) ($data['price'] * 100);
            }

            $package = Package::create($data);

            DB::commit();
            return $package;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update package
     */
    public function updatePackage(int $packageId, array $data): Package
    {
        DB::beginTransaction();

        try {
            $package = Package::findOrFail($packageId);

            // Convert price from float to cents
            if (isset($data['price'])) {
                $data['price'] = (int) ($data['price'] * 100);
            }

            $package->update($data);

            DB::commit();
            return $package->fresh();

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete package (soft delete)
     */
    public function deletePackage(int $packageId): void
    {
        DB::beginTransaction();

        try {
            $package = Package::findOrFail($packageId);

            // Check if package has any active assignments
            $activeAssignments = PackageAssignment::where('package_id', $packageId)
                ->where('is_active', true)
                ->count();

            if ($activeAssignments > 0) {
                throw new Exception("Nie można usunąć pakietu który ma aktywne przypisania do studentów");
            }

            $package->delete(); // Soft delete

            DB::commit();

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get active packages for selection (dropdown etc.)
     */
    public function getActivePackages(): array
    {
        return Package::active()
            ->ordered()
            ->get(['id', 'name', 'hours_count', 'price', 'validity_days', 'description', 'color'])
            ->toArray();
    }

    /**
     * Assign package to student
     */
    public function assignPackageToStudent(int $studentId, int $packageId, ?string $notes = null): PackageAssignment
    {
        DB::beginTransaction();

        try {
            $student = User::where('role', 'student')->findOrFail($studentId);
            $package = Package::active()->findOrFail($packageId);

            $assignment = PackageAssignment::createForStudent($student, $package, $notes);

            DB::commit();
            return $assignment->load(['student', 'package']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get package statistics
     */
    public function getPackageStats(): array
    {
        return [
            'total_packages' => Package::count(),
            'active_packages' => Package::active()->count(),
            'inactive_packages' => Package::where('is_active', false)->count(),
            'total_assignments' => PackageAssignment::count(),
            'active_assignments' => PackageAssignment::active()->valid()->count(),
            'expired_assignments' => PackageAssignment::expired()->count(),
            'revenue_potential' => Package::active()->sum('price') / 100, // Convert to main currency
        ];
    }

    /**
     * Get student's package assignments
     */
    public function getStudentPackages(int $studentId): array
    {
        return PackageAssignment::with(['package'])
            ->where('student_id', $studentId)
            ->orderBy('assigned_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Deactivate expired assignments (can be run as scheduled task)
     */
    public function deactivateExpiredAssignments(): int
    {
        return PackageAssignment::where('is_active', true)
            ->where('expires_at', '<', now())
            ->update(['is_active' => false]);
    }
}