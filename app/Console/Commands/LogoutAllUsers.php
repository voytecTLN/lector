<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LogoutAllUsers extends Command
{
    protected $signature = 'users:logout-all {--dry-run : Show what would be done without actually doing it}';
    protected $description = 'Logout all users by invalidating their authentication tokens';

    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        $this->info('Daily user logout process starting...');

        try {
            // Count tokens before deletion
            $tokenCount = DB::table('personal_access_tokens')->count();

            if ($isDryRun) {
                $this->warn("DRY RUN MODE - No changes will be made");
                $this->info("Would invalidate {$tokenCount} authentication tokens");
                return Command::SUCCESS;
            }

            if ($tokenCount === 0) {
                $this->info('No active tokens found - all users already logged out');
                return Command::SUCCESS;
            }

            // Delete all personal access tokens (Sanctum)
            $deletedTokens = DB::table('personal_access_tokens')->delete();

            // Also clear any cached sessions if using database sessions
            if (config('session.driver') === 'database') {
                $deletedSessions = DB::table('sessions')->delete();
                $this->info("Cleared {$deletedSessions} database sessions");
            }

            $this->info("Successfully logged out all users:");
            $this->info("- Invalidated {$deletedTokens} authentication tokens");
            $this->info("- Logout completed at: " . now()->format('Y-m-d H:i:s'));

            // Log this action for audit trail
            \Log::info("Daily logout: Invalidated {$deletedTokens} tokens at " . now()->format('Y-m-d H:i:s'));

        } catch (\Exception $e) {
            $this->error('Failed to logout users: ' . $e->getMessage());
            \Log::error('Daily logout failed: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}