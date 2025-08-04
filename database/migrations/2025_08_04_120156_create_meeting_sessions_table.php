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
        Schema::create('meeting_sessions', function (Blueprint $table) {
            $table->id();
            
            // Foreign keys
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->foreignId('participant_id')->constrained('users')->onDelete('cascade');
            
            // Room information
            $table->string('room_name');
            
            // Session timestamps
            $table->timestamp('joined_at');
            $table->timestamp('left_at')->nullable();
            
            // Session metrics
            $table->integer('duration_seconds')->nullable();
            $table->enum('connection_quality', ['poor', 'fair', 'good', 'excellent'])->nullable();
            
            // Device and browser info (optional)
            $table->string('browser')->nullable();
            $table->string('device_type')->nullable(); // desktop, mobile, tablet
            
            // Indexes
            $table->index(['lesson_id', 'participant_id']);
            $table->index(['room_name', 'joined_at']);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_sessions');
    }
};
