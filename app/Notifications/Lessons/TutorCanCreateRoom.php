<?php

namespace App\Notifications\Lessons;

use App\Models\Lesson;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TutorCanCreateRoom extends Notification implements ShouldQueue
{
    use Queueable;

    protected $lesson;
    protected $dashboardUrl;

    /**
     * Create a new notification instance.
     *
     * @param Lesson $lesson
     * @param string $dashboardUrl
     */
    public function __construct(Lesson $lesson, $dashboardUrl)
    {
        $this->lesson = $lesson;
        $this->dashboardUrl = $dashboardUrl;
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
            ->subject('Możesz rozpocząć spotkanie - Platforma Lektorów')
            ->priority(1) // High priority
            ->view('emails.lessons.tutor-can-create-room', [
                'lesson' => $this->lesson,
                'student' => $this->lesson->student,
                'tutor' => $this->lesson->tutor,
                'dashboardUrl' => $this->dashboardUrl
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
            'type' => 'tutor_can_create_room',
            'lesson_id' => $this->lesson->id,
            'student_name' => $this->lesson->student->name,
            'dashboard_url' => $this->dashboardUrl,
            'sent_at' => now()->toISOString()
        ];
    }
}