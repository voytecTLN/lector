<?php

namespace App\Notifications\Lessons;

use App\Models\Lesson;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LessonRoomAvailable extends Notification implements ShouldQueue
{
    use Queueable;

    protected $lesson;
    protected $meetingUrl;

    /**
     * Create a new notification instance.
     *
     * @param Lesson $lesson
     * @param string $meetingUrl
     */
    public function __construct(Lesson $lesson, $meetingUrl)
    {
        $this->lesson = $lesson;
        $this->meetingUrl = $meetingUrl;
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

        return (new MailMessage)
            ->subject('Twoja lekcja jest gotowa - dołącz teraz! - Platforma Lektorów')
            ->priority(1) // High priority
            ->view('emails.lessons.room-available', [
                'lesson' => $this->lesson,
                'student' => $this->lesson->student,
                'tutor' => $this->lesson->tutor,
                'meetingUrl' => $this->meetingUrl
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
            'type' => 'lesson_room_available',
            'lesson_id' => $this->lesson->id,
            'tutor_name' => $this->lesson->tutor->name,
            'meeting_url' => $this->meetingUrl,
            'sent_at' => now()->toISOString()
        ];
    }
}