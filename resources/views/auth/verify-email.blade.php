{{-- resources/views/auth/verify-email.blade.php --}}
@extends('layouts.app')

@section('title', 'Zweryfikuj email')

@section('content')
<div class="auth-page">
    <div class="container">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Zweryfikuj adres email</h1>
                    <p>Na Twój adres email został wysłany link weryfikacyjny. Kliknij w niego, aby aktywować konto.</p>
                </div>
                <div class="text-center">
                    <button id="resend-verification" class="btn btn-outline-primary">
                        Wyślij ponownie
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection