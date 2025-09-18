<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing users with account_source based on their role
        DB::table('users')
            ->whereIn('role', ['admin', 'moderator'])
            ->update(['account_source' => 'admin']);
            
        DB::table('users')
            ->where('role', 'tutor')
            ->update(['account_source' => 'admin']);
            
        DB::table('users')
            ->where('role', 'student')
            ->update(['account_source' => 'import']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset account_source to null for all users
        DB::table('users')->update(['account_source' => null]);
    }
};
