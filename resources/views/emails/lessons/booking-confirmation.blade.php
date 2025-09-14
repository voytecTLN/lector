@extends('emails.layout.app')

@section('title', 'Potwierdzenie rezerwacji lekcji')

@section('content')
    <h2>Potwierdzenie rezerwacji lekcji</h2>
    
    <p>Witaj {{ $recipient->name }},</p>
    
    @if($recipientType === 'student')
        <p>Twoja lekcja została pomyślnie zarezerwowana!</p>
    @else
        <p>Nowa lekcja została zarezerwowana przez ucznia!</p>
    @endif
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Szczegóły lekcji:</h3>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #666;">Data:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">
                    {{ \Carbon\Carbon::parse($lesson->lesson_date)->locale('pl')->isoFormat('dddd, D MMMM YYYY') }}
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Godzina:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">
                    {{ \Carbon\Carbon::parse($lesson->start_time)->format('H:i') }} - 
                    {{ \Carbon\Carbon::parse($lesson->end_time)->format('H:i') }}
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Czas trwania:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $lesson->duration_minutes }} minut</td>
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
    
    @if($lesson->notes)
        <div class="alert alert-info">
            <strong>Notatki do lekcji:</strong><br>
            {{ $lesson->notes }}
        </div>
    @endif
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ config('app.url') }}/{{ $recipientType }}/dashboard" class="btn">
            Zobacz w kalendarzu
        </a>
    </div>

    @if($recipientType === 'student')
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
                <strong>Przypomnienie:</strong> Lekcja odbędzie się online.
                Link do pokoju zostanie udostępniony po utworzeniu pokoju przez lektora, nie wcześniej niż 10 minut przed rozpoczęciem zajęć.
                Panel -> Nadchodzące lekcje -> Akcje (Szczegóły)
            </p>
        </div>
    @else
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
                <strong>Przypomnienie:</strong> Lekcja odbędzie się online.
                Link do utworzenia pokoju lekcji zostanie udostępniony 10 minut przed rozpoczęciem zajęć.
                Kalendarz -> Szczegóły (czerwona ikona)
                Lub
                Nadchodzące lekcje -> Lekcja
            </p>
        </div>
    @endif
    
    <p style="font-size: 14px; color: #666;">
        <strong>Zasady anulowania:</strong><br>
        Lekcję możesz anulować do momentu jej rozpoczęcia. Anulowanie co najmniej 12 godzin przed rozpoczęciem zwróci godzinę do Twojego pakietu. 
        Anulowanie w krótszym czasie (mniej niż 12 godzin) spowoduje odliczenie godziny od pakietu.
    </p>
    
    @if($recipientType === 'student')
        <p style="margin-top: 30px;">
            Życzymy owocnej lekcji!
        </p>
    @else
        <p style="margin-top: 30px;">
            Powodzenia w prowadzeniu lekcji!
        </p>
    @endif
@endsection