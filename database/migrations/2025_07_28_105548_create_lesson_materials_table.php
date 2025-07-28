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
        Schema::create('lesson_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->string('file_path');
            $table->string('original_name');
            $table->bigInteger('file_size');
            $table->string('mime_type');
            $table->boolean('is_active')->default(true);
            $table->integer('version')->default(1);
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['tutor_id', 'student_id']);
            $table->index(['student_id', 'is_active']);
            $table->index(['lesson_id']);
            $table->index('uploaded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesson_materials');
    }
};
