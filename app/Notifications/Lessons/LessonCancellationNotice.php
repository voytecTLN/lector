<?php

namespace App\Notifications\Lessons;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LessonCancellationNotice extends Notification implements ShouldQueue
{
    use Queueable;

    protected $lesson;
    protected $recipientType;
    protected $cancelledBy;
    protected $reason;

    /**
     * Create a new notification instance.
     *
     * @param Lesson $lesson
     * @param string $recipientType 'student' or 'tutor'
     * @param User|null $cancelledBy Who cancelled the lesson
     * @param string|null $reason Cancellation reason
     */
    public function __construct(Lesson $lesson, $recipientType = 'student', User $cancelledBy = null, $reason = null)
    {
        $this->lesson = $lesson;
        $this->recipientType = $recipientType;
        $this->cancelledBy = $cancelledBy;
        $this->reason = $reason;
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

        // Check if cancellation is urgent (less than 12 hours before lesson)
        $hoursUntilLesson = now()->diffInHours($this->lesson->scheduled_at);
        $isUrgent = $hoursUntilLesson < 12;

        $subject = $isUrgent 
            ? 'PILNE: Anulowanie lekcji #' . $this->lesson->id
            : 'Anulowanie lekcji #' . $this->lesson->id;

        return (new MailMessage)
            ->subject($subject . ' - Platforma Lektorów')
            ->priority($isUrgent ? 1 : 3) // 1 = high priority
            ->view('emails.lessons.cancellation-notice', [
                'lesson' => $this->lesson,
                'recipient' => $notifiable,
                'recipientType' => $this->recipientType,
                'cancelledBy' => $this->cancelledBy,
                'reason' => $this->reason
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
            'type' => 'lesson_cancellation',
            'lesson_id' => $this->lesson->id,
            'scheduled_at' => $this->lesson->scheduled_at,
            'cancelled_by' => $this->cancelledBy ? $this->cancelledBy->id : null,
            'reason' => $this->reason,
            'recipient_type' => $this->recipientType,
            'sent_at' => now()->toISOString()
        ];
    }
}