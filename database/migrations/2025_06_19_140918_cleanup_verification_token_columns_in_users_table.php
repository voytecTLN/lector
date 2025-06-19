<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Migruj dane ze starego pola verification_token do nowych pól (jeśli jeszcze nie zmigrowane)
        $users = DB::table('users')
            ->whereNotNull('verification_token')
            ->whereNull('verification_token_hash')
            ->orderBy('id')
            ->get();

        foreach ($users as $user) {
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'verification_token_hash' => hash('sha256', $user->verification_token),
                    'verification_token_expires_at' => now()->addHours(24),
                ]);
        }

        // Usuń starą kolumnę verification_token
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Przywróć starą kolumnę
            $table->string('verification_token')->nullable()->after('email_verified_at');
        });

        // Opcjonalnie: przywróć dane z hash do plain (nie zalecane)
        // Ten krok jest niemożliwy bo hash jest jednokierunkowy
    }
};