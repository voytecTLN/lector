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
            // Daily.co room information
            $table->string('meeting_room_name')->nullable()->after('feedback_submitted_at');
            $table->string('meeting_room_url')->nullable()->after('meeting_room_name');
            $table->text('meeting_token')->nullable()->after('meeting_room_url');
            
            // Meeting timestamps
            $table->timestamp('meeting_started_at')->nullable()->after('meeting_token');
            $table->timestamp('meeting_ended_at')->nullable()->after('meeting_started_at');
            
            // Recording URL (if enabled)
            $table->string('recording_url')->nullable()->after('meeting_ended_at');
            
            // Indexes for performance
            $table->index('meeting_room_name');
            $table->index(['lesson_date', 'meeting_started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['meeting_room_name']);
            $table->dropIndex(['lesson_date', 'meeting_started_at']);
            
            // Drop columns
            $table->dropColumn([
                'meeting_room_name',
                'meeting_room_url',
                'meeting_token',
                'meeting_started_at',
                'meeting_ended_at',
                'recording_url'
            ]);
        });
    }
};
