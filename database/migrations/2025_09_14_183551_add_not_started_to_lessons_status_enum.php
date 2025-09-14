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
        // Add 'not_started' to the existing ENUM values
        DB::statement("ALTER TABLE lessons MODIFY COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show_student', 'no_show_tutor', 'technical_issues', 'not_started') NOT NULL DEFAULT 'scheduled'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'not_started' from the ENUM values (this will fail if any lessons have this status)
        DB::statement("ALTER TABLE lessons MODIFY COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show_student', 'no_show_tutor', 'technical_issues') NOT NULL DEFAULT 'scheduled'");
    }
};