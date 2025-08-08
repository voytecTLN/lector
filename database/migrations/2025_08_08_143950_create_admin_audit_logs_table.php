<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_user_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // 'create', 'update', 'delete'
            $table->string('model_type'); // 'App\\Models\\Package'
            $table->unsignedBigInteger('model_id')->nullable();
            $table->string('model_name')->nullable(); // Human readable name
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index(['admin_user_id', 'created_at']);
            $table->index(['model_type', 'model_id']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_audit_logs');
    }
};