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
        // Check and drop any existing unique constraints related to tutor_id, lesson_date, start_time
        $indexes = DB::select("SHOW INDEX FROM lessons WHERE Key_name LIKE '%tutor_id%' AND Non_unique = 0");
        
        foreach ($indexes as $index) {
            try {
                DB::statement("ALTER TABLE lessons DROP INDEX `{$index->Key_name}`");
            } catch (\Exception $e) {
                // Index might not exist or might be in use
            }
        }
        
        // For MySQL, we can't use partial indexes, so we'll rely on application logic
        // to handle conflicts only for scheduled/completed/no_show lessons
        // The LessonService already filters by STATUS_SCHEDULED in checkForConflicts()
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // Restore the original unique constraint
            $table->unique(['tutor_id', 'lesson_date', 'start_time'], 'lessons_tutor_id_lesson_date_start_time_unique');
        });
    }
};
