@extends('emails.layout.app')

@section('title', 'Lekcja jest gotowa')

@section('content')
    <h2 style="color: #28a745;">Twoja lekcja właśnie się rozpoczyna!</h2>
    
    <p>Witaj {{ $student->name }},</p>
    
    <p><strong>{{ $tutor->name }}</strong> czeka na Ciebie w pokoju lekcyjnym.</p>
    
    <div class="alert alert-success">
        <strong>Pokój lekcyjny jest otwarty!</strong><br>
        Możesz teraz dołączyć do lekcji.
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Szczegóły lekcji:</h3>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #666;">Lektor:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $tutor->name }}</td>
            </tr>
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
                <td style="padding: 8px 0; color: #666;">Czas trwania:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $lesson->duration_minutes }} minut</td>
            </tr>
        </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $meetingUrl }}" class="btn" style="font-size: 18px; padding: 16px 40px;">
            Dołącz do lekcji teraz
        </a>
    </div>
    
    <div style="background-color: #e7f5ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #0c5460;">
            <strong>Wskazówki przed lekcją:</strong>
        </p>
        <ul style="color: #0c5460; margin: 10px 0;">
            <li>Sprawdź połączenie internetowe</li>
            <li>Upewnij się, że mikrofon i kamera działają</li>
            <li>Znajdź ciche miejsce bez zakłóceń</li>
            <li>Przygotuj materiały do nauki</li>
        </ul>
    </div>
    
    <p style="font-size: 14px; color: #999;">
        Jeśli masz problemy z dołączeniem do lekcji, skontaktuj się z lektorem przez czat w aplikacji.
    </p>
    
    <p style="margin-top: 30px;">
        Życzymy owocnej lekcji!
    </p>
@endsection