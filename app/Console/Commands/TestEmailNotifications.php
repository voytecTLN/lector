<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Notifications\Auth\EmailVerificationNotification;
use App\Notifications\Auth\WelcomeNotification;
use App\Notifications\Auth\PasswordResetNotification;

class TestEmailNotifications extends Command
{
    protected $signature = 'email:test {type} {--email=} {--user-id=}';
    protected $description = 'Test email notifications';

    public function handle()
    {
        $type = $this->argument('type');
        $email = $this->option('email');
        $userId = $this->option('user-id');

        // Get test user
        $user = null;
        if ($userId) {
            $user = User::find($userId);
        } elseif ($email) {
            $user = User::where('email', $email)->first();
        } else {
            // Get first available user
            $user = User::first();
        }

        if (!$user) {
            $this->error('No user found. Please specify --email or --user-id');
            return 1;
        }

        $this->info("Testing email notification for user: {$user->name} ({$user->email})");

        try {
            switch ($type) {
                case 'verification':
                    $user->notify(new EmailVerificationNotification());
                    $this->info('Email verification notification sent!');
                    break;

                case 'welcome':
                    $user->notify(new WelcomeNotification('tempPassword123'));
                    $this->info('Welcome notification sent!');
                    break;

                case 'password-reset':
                    $user->notify(new PasswordResetNotification('test-token-123'));
                    $this->info('Password reset notification sent!');
                    break;

                default:
                    $this->error('Invalid type. Use: verification, welcome, or password-reset');
                    return 1;
            }

            $this->info('Email notification queued successfully!');
            $this->info('Check your mail driver (MailHog for development) to see the email.');

        } catch (\Exception $e) {
            $this->error('Failed to send notification: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}