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
        Schema::create('tutor_availability_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->enum('time_slot', ['morning', 'afternoon']); // morning: 8-16, afternoon: 14-22
            $table->boolean('is_available')->default(true);
            $table->integer('hours_booked')->default(0);
            $table->timestamps();
            
            // Ensure only one slot per tutor per date
            $table->unique(['tutor_id', 'date']);
            
            // Index for quick lookups
            $table->index(['tutor_id', 'date', 'is_available']);
            $table->index(['date', 'is_available']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tutor_availability_slots');
    }
};