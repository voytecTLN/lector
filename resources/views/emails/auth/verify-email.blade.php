@extends('emails.layout.app')

@section('title', 'Weryfikacja adresu email')

@section('content')
    <h2>Witaj {{ $user->name }}!</h2>
    
    <p>Dziękujemy za rejestrację w Platformie Lektorów. Aby dokończyć proces rejestracji, prosimy o potwierdzenie swojego adresu email.</p>
    
    <p>Kliknij poniższy przycisk, aby zweryfikować swoje konto:</p>
    
    <div style="text-align: center;">
        <a href="{{ $verificationUrl }}" class="btn">
            Zweryfikuj adres email
        </a>
    </div>
    
    <p style="font-size: 14px; color: #999; margin-top: 30px;">
        Jeśli przycisk nie działa, możesz skopiować i wkleić poniższy link do przeglądarki:
    </p>
    <p style="font-size: 12px; word-break: break-all; color: #667eea;">
        {{ $verificationUrl }}
    </p>
    
    <div class="alert alert-info" style="margin-top: 30px;">
        <strong>Ważne:</strong> Link weryfikacyjny wygaśnie za {{ config('auth.verification.expire', 24) }} godzin.
    </div>
    
    <p style="font-size: 14px; color: #999; margin-top: 30px;">
        Jeśli nie rejestrowałeś się w Platformie Lektorów, zignoruj tę wiadomość.
    </p>
@endsection