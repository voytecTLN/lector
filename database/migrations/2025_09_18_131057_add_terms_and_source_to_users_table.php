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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('terms_accepted')->nullable()->after('remember_token');
            $table->timestamp('terms_accepted_at')->nullable()->after('terms_accepted');
            $table->enum('account_source', ['rejestracja', 'admin', 'import', 'api'])->nullable()->after('terms_accepted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['terms_accepted', 'terms_accepted_at', 'account_source']);
        });
    }
};
