<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', 'Platforma Lektorów')</title>

    <!-- Fonts -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

    <!-- Styles & Scripts -->
    @vite(['resources/css/app.css', 'resources/ts/main.ts'])
</head>
<body>
    <!-- Navigation -->
    <header class="header">
        <nav class="nav container">
            <div class="logo">
                <i class="fas fa-graduation-cap"></i>
                <a href="{{ route('home') }}">Platforma Lektorów</a>
            </div>
            <ul class="nav-links">
                <li><a href="{{ route('home') }}#home">Start</a></li>
                <li><a href="{{ route('home') }}#lecturers">Lektorzy</a></li>
                <li><a href="{{ route('home') }}#about">O nas</a></li>
                <li><a href="#contact">Kontakt</a></li>
            </ul>
            <div class="nav-actions">
                <a href="#login" class="login-btn">
                    <i class="fas fa-sign-in-alt"></i>
                    Zaloguj się
                </a>
                <button class="mobile-menu-btn" aria-label="Menu">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </nav>

        <!-- Mobile Menu -->
        <div class="mobile-menu">
            <ul class="mobile-nav-links">
                <li><a href="{{ route('home') }}#home">Start</a></li>
                <li><a href="{{ route('home') }}#lecturers">Lektorzy</a></li>
                <li><a href="{{ route('home') }}#about">O nas</a></li>
                <li><a href="#contact">Kontakt</a></li>
                <li><a href="#login" class="mobile-login-btn">Zaloguj się</a></li>
            </ul>
        </div>
    </header>

    <!-- Main Content -->
    <main>
        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="footer" id="contact">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>O nas</h3>
                    <p>Jesteśmy platformą łączącą uczniów z najlepszymi lektorami języków obcych. Nasze rozwiązanie pozwala na skuteczną naukę z każdego miejsca na świecie.</p>
                    <div class="social-links">
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
                        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
                    </div>
                </div>
                <div class="footer-section">
                    <h3>Kontakt</h3>
                    <p><i class="fas fa-envelope"></i> kontakt@platformalektorow.pl</p>
                    <p><i class="fas fa-phone"></i> +48 123 456 789</p>
                    <p><i class="fas fa-map-marker-alt"></i> Warszawa, ul. Przykładowa 123</p>
                </div>
                <div class="footer-section">
                    <h3>Języki</h3>
                    <ul class="languages-footer">
                        <li>Angielski</li>
                        <li>Niemiecki</li>
                        <li>Francuski</li>
                        <li>Hiszpański</li>
                        <li>Włoski</li>
                        <li>Portugalski</li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h3>Informacje</h3>
                    <ul class="footer-links">
                        <li><a href="#regulamin">Regulamin</a></li>
                        <li><a href="#polityka">Polityka prywatności</a></li>
                        <li><a href="#pomoc">Pomoc</a></li>
                        <li><a href="#faq">FAQ</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; {{ date('Y') }} Platforma Lektorów. Wszystkie prawa zastrzeżone.</p>
            </div>
        </div>
    </footer>

    <!-- Notification Container -->
    <div id="notification-container" class="notification-container"></div>

    <!-- Back to Top Button -->
    <button id="back-to-top" class="back-to-top" aria-label="Wróć na górę">
        <i class="fas fa-chevron-up"></i>
    </button>
</body>
</html>