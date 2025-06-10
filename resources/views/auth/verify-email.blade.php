@extends('layouts.app')

@section('title', 'Weryfikacja email')

@section('content')
<div class="auth-page">
    <div class="container">
        <div class="auth-container text-center">
            <h1>Zweryfikuj swój adres email</h1>
            <p>Na Twój adres wysłaliśmy link weryfikacyjny. Kliknij w niego, aby aktywować konto.</p>
            <button id="resend-verification" class="btn btn-outline-primary mt-3">Wyślij ponownie</button>
        </div>
    </div>
</div>
@endsection

