{{-- resources/views/auth/register.blade.php --}}
@extends('layouts.app')

@section('title', 'Utwórz konto')

@section('content')
<div class="auth-page">
    <div class="container">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Utwórz konto</h1>
                    <p>Dołącz do naszej społeczności uczących się języków</p>
                </div>

                <form id="register-form" class="auth-form">
                    <div class="form-group">
                        <label for="name">Imię i nazwisko</label>
                        <input type="text" id="name" name="name" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="password">Hasło</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="password" name="password" class="form-control" required>
                            <button type="button" class="password-toggle" data-toggle-password="#password">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password_confirmation">Potwierdź hasło</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="password_confirmation" name="password_confirmation" class="form-control" required>
                            <button type="button" class="password-toggle" data-toggle-password="#password_confirmation">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="role">Jestem</label>
                        <select id="role" name="role" class="form-control" required>
                            <option value="">Wybierz...</option>
                            <option value="student">Uczniem</option>
                            <option value="tutor">Lektorem</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="phone">Telefon (opcjonalnie)</label>
                        <input type="tel" id="phone" name="phone" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="city">Miasto (opcjonalnie)</label>
                        <input type="text" id="city" name="city" class="form-control">
                    </div>

                    <div class="form-group form-check">
                        <input type="checkbox" id="terms_accepted" name="terms_accepted" class="form-check-input" required>
                        <label for="terms_accepted" class="form-check-label">
                            Akceptuję <a href="{{ route('terms') }}" target="_blank">regulamin</a> i <a href="{{ route('privacy') }}" target="_blank">politykę prywatności</a>
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="btn-text">Utwórz konto</span>
                    </button>
                </form>

                <div class="auth-links">
                    <a href="{{ route('login') }}">Masz już konto? Zaloguj się</a>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    new RegisterForm('#register-form');
});
</script>
@endsection