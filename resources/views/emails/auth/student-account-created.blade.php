@extends('emails.layout.app')

@section('title', 'Witamy w Platformie Lektorów - Ustaw swoje hasło')

@section('content')
    <h2>Witamy w Platformie Lektorów!</h2>
    
    <p>Dzień dobry {{ $student->name }},</p>
    
    <p>Zostało utworzone dla Państwa konto studenta w naszej platformie edukacyjnej.</p>
    
    <div class="alert alert-info">
        <strong>Dane logowania:</strong><br>
        <strong>Email:</strong> {{ $student->email }}<br>
        <strong>Hasło:</strong> Należy ustawić nowe hasło używając poniższego linku
    </div>
    
    <div style="text-align: center;">
        <a href="{{ $resetUrl }}" class="btn">
            Ustaw hasło i zaloguj się
        </a>
    </div>
    
    <p><strong>Co dalej?</strong></p>
    
    <p>Po ustawieniu hasła będą mogli Państwo:</p>
    <ul style="color: #555555; line-height: 1.8;">
        <li>Uzupełnić swój profil studenta</li>
        <li>Przeglądać dostępnych lektorów</li>
        <li>Rezerwować lekcje online</li>
        <li>Pobierać materiały edukacyjne</li>
        <li>Uczestniczyć w lekcjach wideo</li>
        <li>Śledzić swoje postępy w nauce</li>
    </ul>
    
    <div class="alert alert-warning" style="margin-top: 30px;">
        <strong>Ważne informacje bezpieczeństwa:</strong><br>
        • Link do ustawienia hasła jest ważny przez 24 godziny<br>
        • Nie udostępniaj tego linku nikomu innemu<br>
        • Jeśli link wygasł, wejdź na stronę <a href="https://telenauka.pl/login">telenauka.pl/login</a> i skorzystaj z opcji "Zapomniałeś hasła?"<br>
    </div>
<!--
    <p style="margin-top: 30px;">
        <strong>Potrzebujesz pomocy?</strong><br>
        Jeśli masz pytania dotyczące platformy, skontaktuj się z nami:<br>
        📧 Email: support@platforma-lektorow.pl<br>
        📞 Telefon: +48 123 456 789
    </p>
-->
    
    <p>Dziękujemy za dołączenie do naszej platformy!</p>
    
    <p><strong>Zespół Platformy Lektorów</strong></p>
@endsection