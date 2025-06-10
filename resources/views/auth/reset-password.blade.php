{{-- resources/views/auth/reset-password.blade.php --}}
@extends('layouts.app')

@section('title', 'Ustaw nowe hasło')

@section('content')
<div class="auth-page">
    <div class="container">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Ustaw nowe hasło</h1>
                    <p>Wprowadź nowe hasło dla swojego konta</p>
                </div>

                <form id="reset-password-form" class="auth-form">
                    <input type="hidden" name="token" value="{{ request('token') }}">
                    <input type="hidden" name="email" value="{{ request('email') }}">

                    <div class="form-group">
                        <label for="password">Nowe hasło</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="password" name="password" class="form-control" required>
                            <button type="button" class="password-toggle" data-toggle-password="#password">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password_confirmation">Potwierdź nowe hasło</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="password_confirmation" name="password_confirmation" class="form-control" required>
                            <button type="button" class="password-toggle" data-toggle-password="#password_confirmation">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="btn-text">Ustaw nowe hasło</span>
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
    new ResetPasswordForm('#reset-password-form');
});
</script>
@endsection