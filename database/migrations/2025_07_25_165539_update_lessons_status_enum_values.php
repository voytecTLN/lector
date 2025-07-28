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
        // MySQL wymaga surowego SQL do modyfikacji ENUM
        DB::statement("ALTER TABLE lessons MODIFY COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show_student', 'no_show_tutor', 'technical_issues') NOT NULL DEFAULT 'scheduled'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Przywróć oryginalny ENUM (uwaga: to usunie dane dla nowych statusów!)
        DB::statement("ALTER TABLE lessons MODIFY COLUMN status ENUM('scheduled', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled'");
    }
};
