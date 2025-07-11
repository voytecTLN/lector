<?php
// app/Services/AdminService.php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Exception;

class AdminService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function createAdmin(array $data): User
    {
        DB::beginTransaction();

        try {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'admin',
                'phone' => $data['phone'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'city' => $data['city'] ?? null,
                'country' => $data['country'] ?? 'Polska',
                'status' => $data['status'] ?? User::STATUS_ACTIVE,
                'email_verified_at' => now()
            ]);

            // Send welcome email
            $this->notificationService->sendWelcomeEmail($user);

            DB::commit();
            return $user;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateAdmin(int $adminId, array $data): User
    {
        DB::beginTransaction();

        try {
            $user = User::findOrFail($adminId);

            $updateData = [
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
                'phone' => $data['phone'] ?? $user->phone,
                'birth_date' => $data['birth_date'] ?? $user->birth_date,
                'city' => $data['city'] ?? $user->city,
                'country' => $data['country'] ?? $user->country,
                'status' => $data['status'] ?? $user->status,
            ];

            // Handle password update
            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            DB::commit();
            return $user->fresh();

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getAdminById(int $adminId): User
    {
        return User::where('role', 'admin')
            ->findOrFail($adminId);
    }

    public function getAdmins(array $filters = []): array
    {
        $query = User::where('role', 'admin');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['city'])) {
            $query->where('city', 'like', '%' . $filters['city'] . '%');
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%');
            });
        }

        $query->orderBy('created_at', 'desc');

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

    public function deactivateAdmin(int $adminId): User
    {
        $user = User::findOrFail($adminId);
        
        // Don't allow deactivating the last admin
        $activeAdminsCount = User::where('role', 'admin')
            ->where('status', User::STATUS_ACTIVE)
            ->count();
            
        if ($activeAdminsCount <= 1 && $user->status === User::STATUS_ACTIVE) {
            throw new Exception('Cannot deactivate the last active administrator.');
        }

        $user->update(['status' => 'inactive']);
        return $user;
    }

    public function deleteAdmin(int $adminId): bool
    {
        $user = User::findOrFail($adminId);
        
        // Don't allow deleting the last admin
        $activeAdminsCount = User::where('role', 'admin')->count();
        if ($activeAdminsCount <= 1) {
            throw new Exception('Cannot delete the last administrator.');
        }

        return $user->delete();
    }

    /**
     * Search admins by name or email
     */
    public function searchAdmins(string $query)
    {
        return User::where('role', 'admin')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                    ->orWhere('email', 'like', '%' . $query . '%');
            })
            ->limit(10)
            ->get();
    }

    /**
     * Bulk update admin status
     */
    public function bulkUpdateStatus(array $ids, string $status): void
    {
        // Don't allow deactivating all admins
        if ($status === 'inactive') {
            $totalAdmins = User::where('role', 'admin')->count();
            $beingDeactivated = count($ids);
            $willRemainActive = $totalAdmins - $beingDeactivated;
            
            if ($willRemainActive <= 0) {
                throw new Exception('Cannot deactivate all administrators. At least one must remain active.');
            }
        }

        User::where('role', 'admin')
            ->whereIn('id', $ids)
            ->update(['status' => $status]);
    }

    /**
     * Get admin statistics
     */
    public function getAdminStats(): array
    {
        $total = User::where('role', 'admin')->count();
        $active = User::where('role', 'admin')
            ->where('status', User::STATUS_ACTIVE)
            ->count();
        $newThisMonth = User::where('role', 'admin')
            ->where('created_at', '>=', now()->subMonth())
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active,
            'new_this_month' => $newThisMonth,
        ];
    }
}