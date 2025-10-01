<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TutorAvailabilityAlert extends Mailable
{
    use Queueable, SerializesModels;

    public array $lowAvailabilityTutors;
    public Carbon $checkMonth;

    /**
     * Create a new message instance.
     */
    public function __construct(array $lowAvailabilityTutors, Carbon $checkMonth)
    {
        $this->lowAvailabilityTutors = $lowAvailabilityTutors;
        $this->checkMonth = $checkMonth;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Alert: Lektorzy z niewystarczającą dostępnością - ' . $this->checkMonth->format('F Y'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.tutor-availability-alert',
            with: [
                'tutors' => $this->lowAvailabilityTutors,
                'month' => $this->checkMonth,
                'tutorCount' => count($this->lowAvailabilityTutors),
                'monthName' => $this->checkMonth->translatedFormat('F Y')
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}