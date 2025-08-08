@extends('emails.layout.app')

@section('title', 'Potwierdzenie rezerwacji lekcji')

@section('content')
    <h2>Potwierdzenie rezerwacji lekcji #{{ $lesson->id }}</h2>
    
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
            <tr>
                <td style="padding: 8px 0; color: #666;">Język:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">
                    {{ $lesson->language === 'english' ? 'Angielski' : 
                       ($lesson->language === 'german' ? 'Niemiecki' : 
                       ($lesson->language === 'french' ? 'Francuski' : 
                       ($lesson->language === 'spanish' ? 'Hiszpański' : $lesson->language))) }}
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Typ lekcji:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ ucfirst($lesson->type) }}</td>
            </tr>
        </table>
    </div>
    
    @if($lesson->notes)
        <div class="alert alert-info">
            <strong>Notatki do lekcji:</strong><br>
            {{ $lesson->notes }}
        </div>
    @endif
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ config('app.url') }}/dashboard" class="btn">
            Zobacz w kalendarzu
        </a>
    </div>
    
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;">
            <strong>Przypomnienie:</strong> Lekcja odbędzie się online. 
            Link do pokoju zostanie udostępniony 15 minut przed rozpoczęciem zajęć.
        </p>
    </div>
    
    <p style="font-size: 14px; color: #666;">
        <strong>Zasady anulowania:</strong><br>
        Lekcję można anulować bezpłatnie do 12 godzin przed jej rozpoczęciem. 
        Późniejsze anulowanie może wiązać się z opłatą.
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