<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TutorFullAvailabilityReport extends Mailable
{
    use Queueable, SerializesModels;

    public array $tutorReports;
    public Carbon $checkMonth;

    /**
     * Create a new message instance.
     */
    public function __construct(array $tutorReports, Carbon $checkMonth)
    {
        $this->tutorReports = $tutorReports;
        $this->checkMonth = $checkMonth;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Raport dostępności wszystkich lektorów - ' . $this->checkMonth->format('F Y'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.tutor-full-availability-report',
            with: [
                'tutorReports' => $this->tutorReports,
                'month' => $this->checkMonth,
                'tutorCount' => count($this->tutorReports),
                'monthName' => $this->checkMonth->translatedFormat('F Y'),
                'lowAvailabilityCount' => count(array_filter($this->tutorReports, fn($report) => $report['hours'] < 20)),
                'totalHours' => array_sum(array_column($this->tutorReports, 'hours'))
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