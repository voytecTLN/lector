@extends('emails.layout.app')

@section('title', 'Anulowanie lekcji')

@section('content')
    <h2 style="color: #dc3545;">PILNE: Anulowanie lekcji #{{ $lesson->id }}</h2>
    
    <p>Witaj {{ $recipient->name }},</p>
    
    <div class="alert alert-warning">
        <strong>Twoja lekcja została anulowana</strong><br>
        @if($cancelledBy)
            Anulowane przez: {{ $cancelledBy->name }}<br>
        @endif
        @if($reason)
            Powód: {{ $reason }}
        @endif
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Anulowana lekcja:</h3>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #666;">Data:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">
                    {{ \Carbon\Carbon::parse($lesson->scheduled_at)->locale('pl')->isoFormat('dddd, D MMMM YYYY') }}
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Godzina:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">
                    {{ \Carbon\Carbon::parse($lesson->scheduled_at)->format('H:i') }} - 
                    {{ \Carbon\Carbon::parse($lesson->scheduled_at)->addMinutes($lesson->duration_minutes)->format('H:i') }}
                </td>
            </tr>
            @if($recipientType === 'student')
                <tr>
                    <td style="padding: 8px 0; color: #666;">Lektor:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $lesson->tutor->name }}</td>
                </tr>
            @else
                <tr>
                    <td style="padding: 8px 0; color: #666;">Uczeń:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $lesson->student->name }}</td>
                </tr>
            @endif
        </table>
    </div>
    
    @php
        $hoursUntilLesson = \Carbon\Carbon::now()->diffInHours($lesson->scheduled_at);
    @endphp
    
    @if($hoursUntilLesson < 12)
        <div class="alert alert-warning">
            <strong>Uwaga:</strong> Lekcja została anulowana mniej niż 12 godzin przed rozpoczęciem. 
            Mogą obowiązywać dodatkowe opłaty zgodnie z regulaminem.
        </div>
    @endif
    
    @if($recipientType === 'student')
        <p>
            <strong>Co dalej?</strong><br>
            Możesz zarezerwować nową lekcję w dogodnym dla Ciebie terminie.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.url') }}/dashboard" class="btn">
                Zarezerwuj nową lekcję
            </a>
        </div>
    @else
        <p>
            <strong>Twój kalendarz został zaktualizowany</strong><br>
            Termin jest teraz dostępny dla innych rezerwacji.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.url') }}/dashboard" class="btn">
                Zobacz kalendarz
            </a>
        </div>
    @endif
    
    <p style="font-size: 14px; color: #999; margin-top: 30px;">
        Jeśli masz pytania dotyczące anulowania, skontaktuj się z nami przez panel aplikacji.
    </p>
@endsection