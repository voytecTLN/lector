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
        Schema::create('package_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('package_id')->constrained('packages')->onDelete('cascade');
            $table->datetime('assigned_at');
            $table->datetime('expires_at');
            $table->integer('hours_remaining');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable(); // Optional notes about assignment
            $table->timestamps();

            // Indexes
            $table->index(['student_id', 'is_active']);
            $table->index(['package_id', 'is_active']);
            $table->index(['expires_at', 'is_active']);
            $table->index('assigned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_assignments');
    }
};
