<?php
// database/migrations/2025_06_06_150000_create_tutor_profiles_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Languages and specializations
            $table->json('languages')->comment('Languages the tutor teaches: english, german, french, etc.');
            $table->json('specializations')->comment('Teaching specializations: business, conversation, exam, etc.');

            // Pricing and description
            $table->decimal('hourly_rate', 8, 2)->comment('Hourly rate in PLN');
            $table->text('description')->nullable()->comment('Tutor bio and teaching approach');

            // Availability
            $table->json('weekly_availability')->nullable()->comment('Weekly availability schedule');

            // Verification and status
            $table->boolean('is_verified')->default(false)->comment('Profile verification status');
            $table->timestamp('verified_at')->nullable();
            $table->string('verification_status')->default('pending')->comment('pending, approved, rejected');
            $table->text('verification_notes')->nullable();

            // Experience and qualifications
            $table->integer('years_experience')->nullable()->comment('Years of teaching experience');
            $table->json('certifications')->nullable()->comment('Teaching certifications and qualifications');
            $table->json('education')->nullable()->comment('Educational background');

            // Statistics
            $table->decimal('average_rating', 3, 2)->default(0)->comment('Average rating from students');
            $table->integer('total_lessons')->default(0)->comment('Total lessons completed');
            $table->integer('total_students')->default(0)->comment('Total unique students taught');

            // Settings
            $table->boolean('is_accepting_students')->default(true)->comment('Currently accepting new students');
            $table->integer('max_students_per_week')->nullable()->comment('Maximum students per week');
            $table->json('lesson_types')->nullable()->comment('Types of lessons offered: individual, group, etc.');

            $table->timestamps();

            // Indexes
            $table->index(['is_verified', 'verification_status']);
            $table->index('hourly_rate');
            $table->index('average_rating');
            $table->index('is_accepting_students');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_profiles');
    }
};