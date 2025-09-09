<?php

namespace App\Console\Commands;

use App\Mail\TutorAccountCreated;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendTutorWelcomeEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tutor:send-welcome {email} {--preview : Preview email content}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send welcome email with password reset link to a tutor';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $preview = $this->option('preview');
        
        // Find tutor by email
        $tutor = User::where('email', $email)
            ->where('role', 'tutor')
            ->first();
            
        if (!$tutor) {
            $this->error("No tutor found with email: {$email}");
            return Command::FAILURE;
        }
        
        // Generate password reset token
        $resetToken = $tutor->generatePasswordResetToken();
        $resetUrl = config('app.url') . '/reset-password?' . http_build_query([
            'token' => $resetToken,
            'email' => $tutor->email
        ]);
        
        if ($preview) {
            $this->info("📧 Email Preview for: {$tutor->name} ({$tutor->email})");
            $this->line("Reset URL: {$resetUrl}");
            $this->line("Token: {$resetToken}");
            $this->line("Expires at: " . $tutor->password_reset_expires_at->format('Y-m-d H:i:s'));
            
            return Command::SUCCESS;
        }
        
        // Send email
        try {
            Mail::to($tutor->email)->send(new TutorAccountCreated($tutor, $resetUrl));
            
            $this->info("✅ Welcome email sent successfully to: {$tutor->name} ({$tutor->email})");
            $this->line("📧 Email queued for delivery");
            $this->line("🔗 Reset URL: {$resetUrl}");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send email: " . $e->getMessage());
            return Command::FAILURE;
        }
        
        return Command::SUCCESS;
    }
}
