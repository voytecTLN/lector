<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tutor_availability_slots', function (Blueprint $table) {
            // Najpierw usuń stary unique constraint
            $table->dropUnique(['tutor_id', 'date']);
            
            // Usuń kolumnę time_slot
            $table->dropColumn('time_slot');
            
            // Dodaj nowe kolumny dla godzin
            $table->tinyInteger('start_hour')->after('date')->comment('Hour from 8 to 21');
            $table->tinyInteger('end_hour')->after('start_hour')->comment('Hour from 9 to 22');
            
            // Zmień hours_booked na domyślnie 0 (będzie zawsze 0 lub 1 dla godzinowych slotów)
            $table->integer('hours_booked')->default(0)->change();
            
            // Dodaj nowy unique constraint
            $table->unique(['tutor_id', 'date', 'start_hour'], 'unique_tutor_date_hour');
            
            // Dodaj indeks dla szybkiego wyszukiwania
            $table->index(['date', 'start_hour', 'end_hour', 'is_available'], 'idx_date_hours_availability');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tutor_availability_slots', function (Blueprint $table) {
            // Usuń nowe indeksy
            $table->dropIndex('idx_date_hours_availability');
            $table->dropUnique('unique_tutor_date_hour');
            
            // Usuń nowe kolumny
            $table->dropColumn(['start_hour', 'end_hour']);
            
            // Przywróć starą kolumnę
            $table->enum('time_slot', ['morning', 'afternoon'])->after('date');
            
            // Przywróć stary unique constraint
            $table->unique(['tutor_id', 'date']);
        });
    }
};