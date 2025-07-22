<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the existing unique constraint
        try {
            DB::statement('ALTER TABLE lessons DROP INDEX lessons_tutor_id_lesson_date_start_time_unique');
        } catch (\Exception $e) {
            // Constraint may not exist, continue
        }
        
        // MySQL doesn't support partial indexes with WHERE clauses
        // We rely on application logic in LessonService::checkForConflicts() instead
        // which already filters by STATUS_SCHEDULED
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the partial unique index
        try {
            DB::statement('ALTER TABLE lessons DROP INDEX lessons_tutor_id_lesson_date_start_time_scheduled_unique');
        } catch (\Exception $e) {
            // Index may not exist
        }
        
        // Restore original constraint
        Schema::table('lessons', function (Blueprint $table) {
            $table->unique(['tutor_id', 'lesson_date', 'start_time'], 'lessons_tutor_id_lesson_date_start_time_unique');
        });
    }
};
