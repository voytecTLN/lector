<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePackageRequest;
use App\Http\Requests\UpdatePackageRequest;
use App\Http\Requests\AssignPackageRequest;
use App\Services\PackageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class PackageController extends Controller
{
    protected PackageService $packageService;

    public function __construct(PackageService $packageService)
    {
        $this->packageService = $packageService;
    }

    /**
     * Display a listing of packages
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search', 'status', 'min_price', 'max_price', 'per_page'
        ]);

        $packages = $this->packageService->getPackages($filters);

        return response()->json($packages);
    }

    /**
     * Get active packages for selection
     */
    public function active(): JsonResponse
    {
        $packages = $this->packageService->getActivePackages();

        return response()->json($packages);
    }

    /**
     * Store a newly created package
     */
    public function store(StorePackageRequest $request): JsonResponse
    {
        try {
            $package = $this->packageService->createPackage($request->validated());

            return response()->json([
                'message' => 'Pakiet został pomyślnie utworzony',
                'package' => $package
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Nie udało się utworzyć pakietu: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Display the specified package
     */
    public function show(int $id): JsonResponse
    {
        try {
            $package = $this->packageService->getPackageById($id);

            return response()->json($package);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Pakiet nie został znaleziony'
            ], 404);
        }
    }

    /**
     * Update the specified package
     */
    public function update(UpdatePackageRequest $request, int $id): JsonResponse
    {
        try {
            $package = $this->packageService->updatePackage($id, $request->validated());

            return response()->json([
                'message' => 'Pakiet został pomyślnie zaktualizowany',
                'package' => $package
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Nie udało się zaktualizować pakietu: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Remove the specified package
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->packageService->deletePackage($id);

            return response()->json([
                'message' => 'Pakiet został pomyślnie usunięty'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Nie udało się usunąć pakietu: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Assign package to student
     */
    public function assign(AssignPackageRequest $request): JsonResponse
    {
        try {
            $assignment = $this->packageService->assignPackageToStudent(
                $request->validated('student_id'),
                $request->validated('package_id'),
                $request->validated('notes')
            );

            return response()->json([
                'message' => 'Pakiet został pomyślnie przypisany do studenta',
                'assignment' => $assignment
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Nie udało się przypisać pakietu: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get package statistics
     */
    public function stats(): JsonResponse
    {
        $stats = $this->packageService->getPackageStats();

        return response()->json($stats);
    }

    /**
     * Get student's packages
     */
    public function studentPackages(int $studentId): JsonResponse
    {
        $packages = $this->packageService->getStudentPackages($studentId);

        return response()->json($packages);
    }

    /**
     * Deactivate expired assignments
     */
    public function deactivateExpired(): JsonResponse
    {
        $count = $this->packageService->deactivateExpiredAssignments();

        return response()->json([
            'message' => "Dezaktywowano $count wygasłych przypisań pakietów",
            'count' => $count
        ]);
    }

    /**
     * Get packages for current student
     */
    public function myPackages(Request $request): JsonResponse
    {
        $studentId = auth()->id();
        $packages = $this->packageService->getStudentPackages($studentId);
        
        return response()->json([
            'success' => true,
            'packages' => $packages
        ]);
    }
}