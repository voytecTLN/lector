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
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('package_assignment_id')->nullable()->constrained('package_assignments');
            $table->foreignId('tutor_availability_slot_id')->nullable()->constrained('tutor_availability_slots');
            
            $table->date('lesson_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('duration_minutes')->default(60);
            
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->enum('cancelled_by', ['student', 'tutor', 'admin'])->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            $table->string('language', 50);
            $table->string('lesson_type', 50)->default('individual'); // individual, group, intensive, conversation
            $table->text('topic')->nullable();
            $table->text('notes')->nullable();
            
            $table->decimal('price', 10, 2)->nullable();
            $table->boolean('is_paid')->default(false);
            
            $table->integer('student_rating')->nullable();
            $table->text('student_feedback')->nullable();
            $table->timestamp('feedback_submitted_at')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['student_id', 'lesson_date']);
            $table->index(['tutor_id', 'lesson_date']);
            $table->index(['status', 'lesson_date']);
            $table->index('cancelled_at');
            
            // Ensure no double booking
            $table->unique(['tutor_id', 'lesson_date', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
