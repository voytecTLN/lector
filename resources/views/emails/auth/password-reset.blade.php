@extends('emails.layout.app')

@section('title', 'Reset hasła')

@section('content')
    <h2>Reset hasła</h2>
    
    <p>Witaj {{ $user->name }},</p>
    
    <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Platformie Lektorów.</p>
    
    <p>Aby ustawić nowe hasło, kliknij poniższy przycisk:</p>
    
    <div style="text-align: center;">
        <a href="{{ $resetUrl }}" class="btn">
            Zresetuj hasło
        </a>
    </div>
    
    <p style="font-size: 14px; color: #999; margin-top: 30px;">
        Jeśli przycisk nie działa, możesz skopiować i wkleić poniższy link do przeglądarki:
    </p>
    <p style="font-size: 12px; word-break: break-all; color: #667eea;">
        {{ $resetUrl }}
    </p>
    
    <div class="alert alert-warning" style="margin-top: 30px;">
        <strong>Uwaga:</strong> Ten link wygaśnie za {{ config('auth.passwords.users.expire', 60) }} minut.
    </div>
    
    <p style="color: #999; margin-top: 30px;">
        <strong>Nie prosiłeś o reset hasła?</strong><br>
        Jeśli nie wysyłałeś prośby o reset hasła, zignoruj tę wiadomość. 
        Twoje hasło pozostanie niezmienione.
    </p>
    
    <p style="font-size: 14px; color: #999;">
        Ze względów bezpieczeństwa, jeśli wielokrotnie otrzymujesz takie wiadomości, 
        zalecamy skontaktowanie się z nami.
    </p>
@endsection