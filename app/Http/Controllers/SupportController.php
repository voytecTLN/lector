<?php

namespace App\Http\Controllers;

use App\Mail\IssueReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class SupportController extends Controller
{
    /**
     * Submit an issue report
     */
    public function submitIssue(Request $request): JsonResponse
    {
        // Rate limiting - 3 reports per hour per user
        $key = 'issue-report:'.$request->user()->id;
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'rate_limit' => 'Zbyt wiele zgłoszeń. Spróbuj ponownie za '.ceil($seconds / 60).' minut.',
            ]);
        }

        $validated = $request->validate([
            'issue_type' => ['required', 'in:technical,lessons,business'],
            'subject' => ['required', 'string', 'min:5', 'max:200'],
            'description' => ['required', 'string', 'min:20', 'max:2000'],
            'priority' => ['required', 'in:low,medium,high'],
            'current_url' => ['nullable', 'string', 'max:500'],
        ], [
            'issue_type.required' => 'Typ zgłoszenia jest wymagany.',
            'issue_type.in' => 'Nieprawidłowy typ zgłoszenia.',
            'subject.required' => 'Temat jest wymagany.',
            'subject.min' => 'Temat musi mieć co najmniej 5 znaków.',
            'subject.max' => 'Temat nie może być dłuższy niż 200 znaków.',
            'description.required' => 'Opis problemu jest wymagany.',
            'description.min' => 'Opis musi mieć co najmniej 20 znaków.',
            'description.max' => 'Opis nie może być dłuższy niż 2000 znaków.',
            'priority.required' => 'Priorytet jest wymagany.',
            'priority.in' => 'Nieprawidłowy priorytet.',
        ]);

        $user = $request->user();

        // Determine support email based on issue type
        $supportEmail = match ($validated['issue_type']) {
            'technical' => config('mail.support_technical', env('SUPPORT_EMAIL_TECHNICAL', 'support-tech@platforma-lektorow.local')),
            'lessons' => config('mail.support_lessons', env('SUPPORT_EMAIL_LESSONS', 'support-lessons@platforma-lektorow.local')),
            'business' => config('mail.support_business', env('SUPPORT_EMAIL_BUSINESS', 'support-biz@platforma-lektorow.local')),
        };

        // Prepare metadata
        $metadata = [
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        if (! empty($validated['current_url'])) {
            $metadata['url'] = $validated['current_url'];
        }

        try {
            // Send email to support
            Mail::to($supportEmail)
                ->send(new IssueReport(
                    user: $user,
                    issueType: $validated['issue_type'],
                    issueSubject: $validated['subject'],
                    description: $validated['description'],
                    priority: $validated['priority'],
                    issueMetadata: $metadata
                ));

            // Track rate limit
            RateLimiter::hit($key, 3600); // 1 hour

            // Log the issue

            return response()->json([
                'success' => true,
                'message' => 'Twoje zgłoszenie zostało wysłane. Odpowiemy na nie w ciągu 24-48 godzin.',
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to send issue report', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'support_email' => $supportEmail,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Wystąpił błąd podczas wysyłania zgłoszenia. Spróbuj ponownie lub skontaktuj się z nami bezpośrednio.',
            ], 500);
        }
    }
}
