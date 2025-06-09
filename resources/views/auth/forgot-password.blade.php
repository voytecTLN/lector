{{-- resources/views/auth/forgot-password.blade.php --}}
@extends('layouts.app')

@section('title', 'Resetuj hasło')

@section('content')
<div class="auth-page">
    <div class="container">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Resetuj hasło</h1>
                    <p>Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła</p>
                </div>

                <form id="forgot-password-form" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" class="form-control" required>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="btn-text">Wyślij link resetujący</span>
                    </button>
                </form>

                <div class="auth-links">
                    <a href="{{ route('login') }}">Powrót do logowania</a>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    new ForgotPasswordForm('#forgot-password-form');
});
</script>
@endsection