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
        // Drop unused password_resets table since we use password_reset_token in users table
        Schema::dropIfExists('password_resets');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the table if needed to rollback
        Schema::create('password_resets', function (Blueprint $table) {
            $table->string('email')->index();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }
};
