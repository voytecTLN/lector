<?php

namespace App\Listeners;

use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Log;

class LogEmailSent
{
    /**
     * Handle the event.
     */
    public function handle(MessageSending $event): void
    {
        $message = $event->message;
        
        // Get recipients
        $to = collect($message->getTo())->map(function ($address) {
            return $address->getAddress();
        })->implode(', ');
        
        // Get CC recipients if any
        $cc = $message->getCc() ? collect($message->getCc())->map(function ($address) {
            return $address->getAddress();
        })->implode(', ') : null;
        
        // Get BCC recipients if any
        $bcc = $message->getBcc() ? collect($message->getBcc())->map(function ($address) {
            return $address->getAddress();
        })->implode(', ') : null;
        
        // Prepare log data
        $logData = [
            'to' => $to,
            'subject' => $message->getSubject(),
            'from' => $message->getFrom() ? collect($message->getFrom())->first()->getAddress() : null,
            'timestamp' => now()->toDateTimeString(),
            'mailer' => config('mail.default'),
        ];
        
        // Add optional fields
        if ($cc) {
            $logData['cc'] = $cc;
        }
        if ($bcc) {
            $logData['bcc'] = $bcc;
        }
        
        // Generate unique ID for this log entry to prevent duplicates
        static $lastLoggedEmail = null;
        $emailHash = md5($to . $message->getSubject() . now()->format('Y-m-d H:i:s'));
        
        if ($lastLoggedEmail === $emailHash) {
            return; // Skip duplicate
        }
        
        $lastLoggedEmail = $emailHash;
        
        // Log email to dedicated emails channel
        Log::channel('emails')->info('📧 Email sent', $logData);
    }
}