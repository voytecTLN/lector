@extends('emails.layout.app')

@section('title', 'Witamy w Platformie Lektorów')

@section('content')
    <h2>Witaj {{ $user->name }}!</h2>
    
    <p>Twoje konto w Platformie Lektorów zostało pomyślnie aktywowane.</p>
    
    @if($user->role === 'student')
        <p>Jako uczeń możesz teraz:</p>
        <ul style="color: #555555; line-height: 1.8;">
            <li>Przeglądać dostępnych lektorów</li>
            <li>Rezerwować lekcje online</li>
            <li>Uczestniczyć w zajęciach przez wideo</li>
            <li>Śledzić swoje postępy w nauce</li>
            <li>Pobierać materiały edukacyjne</li>
        </ul>
    @elseif($user->role === 'tutor')
        <p>Jako lektor możesz teraz:</p>
        <ul style="color: #555555; line-height: 1.8;">
            <li>Uzupełnić swój profil zawodowy</li>
            <li>Ustawić dostępność w kalendarzu</li>
            <li>Przyjmować rezerwacje od uczniów</li>
            <li>Prowadzić lekcje online</li>
            <li>Udostępniać materiały edukacyjne</li>
        </ul>
    @endif
    
    <div style="text-align: center;">
        <a href="{{ config('app.url') }}/dashboard" class="btn">
            Przejdź do panelu
        </a>
    </div>
    
    @if(isset($password))
        <div class="alert alert-warning" style="margin-top: 30px;">
            <strong>Twoje hasło tymczasowe:</strong> {{ $password }}<br>
            Ze względów bezpieczeństwa zalecamy zmianę hasła po pierwszym zalogowaniu.
        </div>
    @endif
    
    <p style="margin-top: 30px;">
        <strong>Potrzebujesz pomocy?</strong><br>
        Zapoznaj się z naszą <a href="{{ config('app.url') }}/help" style="color: #667eea;">sekcją pomocy</a> 
        lub skontaktuj się z nami przez panel aplikacji.
    </p>
    
    <p>Życzymy owocnej nauki!</p>
    <p><strong>Zespół Platformy Lektorów</strong></p>
@endsection