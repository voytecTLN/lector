<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id(); // BIGINT PRIMARY KEY AUTO_INCREMENT
            $table->string('name', 100);
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'moderator', 'tutor', 'student']);
            $table->string('phone', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('country', 100)->default('Polska');
            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active');
            $table->string('avatar')->nullable();
            $table->timestamps(); // created_at, updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};