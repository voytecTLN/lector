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
        Schema::table('lessons', function (Blueprint $table) {
            // Add new status fields
            $table->text('status_reason')->nullable()->after('status');
            $table->unsignedBigInteger('status_updated_by')->nullable()->after('status_reason');
            $table->timestamp('status_updated_at')->nullable()->after('status_updated_by');
            
            // Add lesson timing fields
            $table->timestamp('started_at')->nullable()->after('status_updated_at');
            $table->timestamp('ended_at')->nullable()->after('started_at');
            
            // Add foreign key constraint
            $table->foreign('status_updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['status_updated_by']);
            
            // Drop columns
            $table->dropColumn(['status_reason', 'status_updated_by', 'status_updated_at', 'started_at', 'ended_at']);
        });
    }
};
