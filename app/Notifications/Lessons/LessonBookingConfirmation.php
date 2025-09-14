<?php

namespace App\Notifications\Lessons;

use App\Models\Lesson;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LessonBookingConfirmation extends Notification implements ShouldQueue
{
    use Queueable;

    protected $lesson;
    protected $recipientType;

    /**
     * Create a new notification instance.
     *
     * @param Lesson $lesson
     * @param string $recipientType 'student' or 'tutor'
     */
    public function __construct(Lesson $lesson, $recipientType = 'student')
    {
        $this->lesson = $lesson;
        $this->recipientType = $recipientType;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        // Load relationships
        $this->lesson->load(['student', 'tutor']);

        $subject = $this->recipientType === 'student' 
            ? 'Potwierdzenie rezerwacji lekcji'
            : 'Nowa rezerwacja lekcji';

        return (new MailMessage)
            ->subject($subject . ' - Platforma Lektorów')
            ->view('emails.lessons.booking-confirmation', [
                'lesson' => $this->lesson,
                'recipient' => $notifiable,
                'recipientType' => $this->recipientType
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'lesson_booking',
            'lesson_id' => $this->lesson->id,
            'scheduled_at' => $this->lesson->scheduled_at,
            'recipient_type' => $this->recipientType,
            'sent_at' => now()->toISOString()
        ];
    }
}