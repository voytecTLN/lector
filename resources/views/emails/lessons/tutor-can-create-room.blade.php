@extends('emails.layout.app')

@section('title', 'Możesz rozpocząć spotkanie')

@section('content')
    <h2 style="color: #667eea;">🎯 Czas rozpocząć lekcję!</h2>
    
    <p><strong>Cześć {{ $tutor->name }}!</strong></p>
    
    <p>Informujemy, że możesz już <strong>utworzyć pokój spotkania</strong> dla swojej nadchodzącej lekcji.</p>

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">📅 Szczegóły lekcji:</h3>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #666;">Student:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $student->name }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Data:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $lesson->lesson_date->format('d.m.Y') }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Godzina:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600; background: #dbeafe; padding: 4px 8px; border-radius: 4px;">{{ $lesson->start_time }} - {{ $lesson->end_time }}</td>
            </tr>
            @if($lesson->language)
            <tr>
                <td style="padding: 8px 0; color: #666;">Język:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $lesson->language }}</td>
            </tr>
            @endif
            @if($lesson->topic)
            <tr>
                <td style="padding: 8px 0; color: #666;">Temat:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">{{ $lesson->topic }}</td>
            </tr>
            @endif
        </table>
    </div>

    <div class="alert alert-warning">
        <strong>⏰ Ważne informacje:</strong>
        <ul style="margin: 10px 0;">
            <li>Możesz rozpocząć spotkanie już teraz (10 minut przed planowaną godziną)</li>
            <li>Po utworzeniu pokoju student otrzyma powiadomienie z linkiem do dołączenia</li>
            <li>Spotkanie można rozpocząć poprzez szczegóły lekcji w panelu lektora</li>
        </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $dashboardUrl }}" class="btn" style="font-size: 18px; padding: 16px 40px;">
            🚀 Przejdź do panelu lektora
        </a>
    </div>

    <div style="background-color: #e7f5ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #0c5460;">
            <strong>Jak rozpocząć spotkanie:</strong>
        </p>
        <ol style="color: #0c5460; margin: 10px 0;">
            <li>Przejdź do <strong>panelu lektora</strong></li>
            <li>Znajdź lekcję w sekcji <strong>"Nadchodzące lekcje"</strong></li>
            <li>Kliknij <strong>"Szczegóły"</strong> przy lekcji</li>
            <li>Kliknij przycisk <strong>"Rozpocznij spotkanie"</strong></li>
            <li>Sprawdź mikrofon/kamerę i czekaj na studenta</li>
        </ol>
    </div>

    <p style="font-size: 14px; color: #999;">
        To powiadomienie zostało wysłane automatycznie na 10 minut przed planowaną lekcją.
    </p>
    
    <p style="margin-top: 30px;">
        Powodzenia na lekcji! 🎓
    </p>
@endsection