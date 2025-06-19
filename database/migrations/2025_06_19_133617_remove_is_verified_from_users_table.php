<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Usuń redundantne pole is_verified
            $table->dropColumn('is_verified');

            // Upewnij się że email_verified_at ma indeks dla wydajności
            if (!Schema::hasIndex('users', 'users_email_verified_at_index')) {
                $table->index('email_verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Przywróć pole przy rollback
            $table->boolean('is_verified')->default(false)->after('avatar');

            // Usuń indeks jeśli go dodaliśmy
            if (Schema::hasIndex('users', 'users_email_verified_at_index')) {
                $table->dropIndex('users_email_verified_at_index');
            }
        });
    }
};