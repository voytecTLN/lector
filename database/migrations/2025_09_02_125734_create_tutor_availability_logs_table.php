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
        Schema::create('tutor_availability_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // 'added', 'updated', 'deleted', 'bulk_update'
            $table->date('date')->nullable(); // Dzień którego dotyczy zmiana
            $table->string('day_of_week')->nullable(); // Dzień tygodnia dla zmian regularnych
            $table->json('old_slots')->nullable(); // Poprzednie sloty czasowe
            $table->json('new_slots')->nullable(); // Nowe sloty czasowe
            $table->text('description')->nullable(); // Opis zmiany
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Indeksy dla wydajnego wyszukiwania
            $table->index('tutor_id');
            $table->index('action');
            $table->index('date');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tutor_availability_logs');
    }
};