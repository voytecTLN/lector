{{-- resources/views/auth/login.blade.php --}}
@extends('layouts.app')

@section('title', 'Zaloguj się')

@section('content')
<div class="auth-page">
    <div class="container">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Zaloguj się</h1>
                    <p>Wprowadź swoje dane, aby uzyskać dostęp do konta</p>
                </div>

                <form id="login-form" class="auth-form">
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

                    <div class="form-group form-check">
                        <input type="checkbox" id="remember" name="remember" class="form-check-input">
                        <label for="remember" class="form-check-label">Zapamiętaj mnie</label>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="btn-text">Zaloguj się</span>
                    </button>
                </form>

                <div class="auth-links">
                    <a href="{{ route('password.request') }}">Zapomniałeś hasła?</a>
                    <span>•</span>
                    <a href="{{ route('register') }}">Utwórz konto</a>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ff6b35 0%, #e91e63 100%);
    padding: 2rem 0;
}

.auth-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
}

.auth-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.auth-header {
    text-align: center;
    margin-bottom: 2rem;
}

.auth-header h1 {
    margin-bottom: 0.5rem;
    color: #1e293b;
}

.auth-header p {
    color: #64748b;
    margin: 0;
}

.auth-form .form-group {
    margin-bottom: 1rem;
}

.auth-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
}

.auth-form .form-control {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease;
}

.auth-form .form-control:focus {
    border-color: #e91e63;
    box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
    outline: none;
}

.password-input-wrapper {
    position: relative;
}

.password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
}

.password-toggle:hover {
    color: #e91e63;
}

.form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-check-input {
    width: auto;
}

.form-check-label {
    margin-bottom: 0;
    font-size: 0.875rem;
}

.btn-block {
    width: 100%;
    margin-top: 1rem;
}

.auth-links {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.auth-links a {
    color: #e91e63;
    text-decoration: none;
    font-size: 0.875rem;
}

.auth-links a:hover {
    text-decoration: underline;
}

@media (max-width: 640px) {
    .auth-page {
        padding: 1rem;
    }

    .auth-card {
        padding: 1.5rem;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    new LoginForm('#login-form');
});
</script>
@endsection

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