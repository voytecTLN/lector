<?php
// database/migrations/2025_06_06_120000_enhance_users_table_for_auth.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add remember_token for "remember me" functionality
            $table->rememberToken();

            // Add password reset fields
            $table->string('password_reset_token')->nullable();
            $table->timestamp('password_reset_expires_at')->nullable();

            // Add login tracking
            $table->timestamp('last_login_at')->nullable();
            $table->ipAddress('last_login_ip')->nullable();

            // Add email verification fields (secure approach with hash)
            $table->string('verification_token_hash', 64)->nullable();
            $table->timestamp('verification_token_expires_at')->nullable();

            // Add two-factor authentication fields (for future use)
            $table->string('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();

            // Add indexes for performance
            $table->index(['email', 'status']);
            $table->index('verification_token_hash');
            $table->index('password_reset_token');
            $table->index('email_verified_at');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['email', 'status']);
            $table->dropIndex(['verification_token_hash']);
            $table->dropIndex(['password_reset_token']);
            $table->dropIndex(['email_verified_at']);
            $table->dropIndex(['status']);

            // Drop columns
            $table->dropColumn([
                'remember_token',
                'password_reset_token',
                'password_reset_expires_at',
                'last_login_at',
                'last_login_ip',
                'verification_token_hash',
                'verification_token_expires_at',
                'two_factor_secret',
                'two_factor_recovery_codes'
            ]);
        });
    }
};