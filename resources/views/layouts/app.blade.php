{{-- resources/views/layouts/app.blade.php - Poprawiony z widocznym logout --}}
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
                <li><a href="{{ route('contact') }}">Kontakt</a></li>

                @auth
                    <!-- Authenticated User Menu -->
                    @if(auth()->user()->isAdmin())
                        <li><a href="{{ route('admin.dashboard') }}">Panel Admin</a></li>
                    @elseif(auth()->user()->isModerator())
                        <li><a href="{{ route('moderator.dashboard') }}">Panel Moderatora</a></li>
                    @elseif(auth()->user()->isTutor())
                        <li><a href="{{ route('tutor.dashboard') }}">Panel Lektora</a></li>
                    @elseif(auth()->user()->isStudent())
                        <li><a href="{{ route('student.dashboard') }}">Panel Ucznia</a></li>
                    @endif
                @endauth
            </ul>

            <div class="nav-actions">
                @guest
                    <!-- Guest Navigation -->
                    <div class="auth-buttons">
                        <a href="{{ route('login') }}" class="login-btn">
                            <i class="fas fa-sign-in-alt"></i>
                            Zaloguj się
                        </a>
                        <a href="{{ route('register') }}" class="register-btn">
                            <i class="fas fa-user-plus"></i>
                            Dołącz do nas
                        </a>
                    </div>
                @else
                    <!-- Authenticated User Navigation -->
                    <div class="user-menu">
                        <div class="user-dropdown">
                            <button class="user-dropdown-toggle">
                                <img src="{{ auth()->user()->avatar_url }}" alt="{{ auth()->user()->name }}" class="user-avatar">
                                <span class="user-name">{{ auth()->user()->name }}</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="user-dropdown-menu">
                                <div class="user-info">
                                    <div class="user-name">{{ auth()->user()->name }}</div>
                                    <div class="user-role">{{ ucfirst(auth()->user()->role) }}</div>
                                    <div class="user-email">{{ auth()->user()->email }}</div>
                                    @if(!auth()->user()->is_verified)
                                        <div class="user-verification-status">
                                            <i class="fas fa-exclamation-triangle text-warning"></i>
                                            Email niezweryfikowany
                                        </div>
                                    @endif
                                </div>
                                <div class="dropdown-divider"></div>
                                <a href="{{ route('profile.edit') }}" class="dropdown-item">
                                    <i class="fas fa-user"></i>
                                    Profil
                                </a>
                                @if(auth()->user()->isAdmin())
                                    <a href="{{ route('admin.dashboard') }}" class="dropdown-item">
                                        <i class="fas fa-tachometer-alt"></i>
                                        Panel Admin
                                    </a>
                                @elseif(auth()->user()->isModerator())
                                    <a href="{{ route('moderator.dashboard') }}" class="dropdown-item">
                                        <i class="fas fa-shield-alt"></i>
                                        Panel Moderatora
                                    </a>
                                @elseif(auth()->user()->isTutor())
                                    <a href="{{ route('tutor.dashboard') }}" class="dropdown-item">
                                        <i class="fas fa-chalkboard-teacher"></i>
                                        Panel Lektora
                                    </a>
                                    <a href="{{ route('tutor.lessons') }}" class="dropdown-item">
                                        <i class="fas fa-calendar"></i>
                                        Moje lekcje
                                    </a>
                                @elseif(auth()->user()->isStudent())
                                    <a href="{{ route('student.dashboard') }}" class="dropdown-item">
                                        <i class="fas fa-graduation-cap"></i>
                                        Panel Ucznia
                                    </a>
                                    <a href="{{ route('student.lessons') }}" class="dropdown-item">
                                        <i class="fas fa-book"></i>
                                        Moje lekcje
                                    </a>
                                @endif
                                <div class="dropdown-divider"></div>
                                <button class="dropdown-item logout-btn">
                                    <i class="fas fa-sign-out-alt"></i>
                                    Wyloguj się
                                </button>
                            </div>
                        </div>
                    </div>
                @endguest

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
                <li><a href="{{ route('contact') }}">Kontakt</a></li>

                @auth
                    @if(auth()->user()->isAdmin())
                        <li><a href="{{ route('admin.dashboard') }}">Panel Admin</a></li>
                    @elseif(auth()->user()->isModerator())
                        <li><a href="{{ route('moderator.dashboard') }}">Panel Moderatora</a></li>
                    @elseif(auth()->user()->isTutor())
                        <li><a href="{{ route('tutor.dashboard') }}">Panel Lektora</a></li>
                        <li><a href="{{ route('tutor.lessons') }}">Moje lekcje</a></li>
                    @elseif(auth()->user()->isStudent())
                        <li><a href="{{ route('student.dashboard') }}">Panel Ucznia</a></li>
                        <li><a href="{{ route('student.lessons') }}">Moje lekcje</a></li>
                    @endif
                    <li><a href="{{ route('profile.edit') }}">Profil</a></li>
                    <li>
                        <button class="mobile-logout-btn logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            Wyloguj się
                        </button>
                    </li>
                @else
                    <li><a href="{{ route('login') }}" class="mobile-login-btn">Zaloguj się</a></li>
                    <li><a href="{{ route('register') }}" class="mobile-register-btn">Dołącz do nas</a></li>
                @endauth
            </ul>
        </div>
    </header>

    <!-- Main Content -->
    <main>
        @if(auth()->check() && !auth()->user()->is_verified)
            <!-- Email Verification Notice -->
            <div class="verification-notice">
                <div class="container">
                    <div class="verification-content">
                        <i class="fas fa-envelope"></i>
                        <div>
                            <strong>Zweryfikuj swój adres email</strong>
                            <p>Sprawdź swoją skrzynkę pocztową i kliknij w link weryfikacyjny, aby uzyskać pełny dostęp do platformy.</p>
                        </div>
                        <button id="resend-verification" class="btn btn-outline-primary">
                            Wyślij ponownie
                        </button>
                    </div>
                </div>
            </div>
        @endif

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
                        <li><a href="{{ route('terms') }}">Regulamin</a></li>
                        <li><a href="{{ route('privacy') }}">Polityka prywatności</a></li>
                        <li><a href="{{ route('help') }}">Pomoc</a></li>
                        <li><a href="{{ route('faq') }}">FAQ</a></li>
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

    <style>
        /* Auth Buttons Styles */
        .auth-buttons {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .register-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: transparent;
            color: var(--primary-pink);
            border: 2px solid var(--primary-pink);
            border-radius: var(--radius);
            text-decoration: none;
            font-weight: var(--font-semibold);
            transition: var(--transition);
            font-size: 0.875rem;
        }

        .register-btn:hover {
            background: var(--primary-pink);
            color: var(--text-white);
            transform: translateY(-1px);
            box-shadow: var(--shadow);
        }

        .login-btn {
            background: var(--primary-gradient);
            color: var(--text-white);
            padding: 0.5rem 1rem;
            border-radius: var(--radius);
            text-decoration: none;
            font-weight: var(--font-semibold);
            transition: var(--transition);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
        }

        .login-btn:hover {
            background: var(--primary-gradient-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow);
            color: var(--text-white);
        }

        /* User Menu Styles */
        .user-menu {
            position: relative;
        }

        .user-dropdown-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
        }

        .user-dropdown-toggle:hover {
            background: var(--bg-secondary);
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
        }

        .user-dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            min-width: 260px;
            background: white;
            border-radius: 0.75rem;
            box-shadow: var(--shadow-xl);
            border: 1px solid #e2e8f0;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
            z-index: 1000;
        }

        .user-dropdown:hover .user-dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .user-info {
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .user-info .user-name {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }

        .user-info .user-role {
            color: var(--primary-pink);
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }

        .user-info .user-email {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .user-verification-status {
            color: var(--warning);
            font-size: 0.75rem;
            font-weight: 500;
            margin-top: 0.25rem;
        }

        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: var(--text-primary);
            text-decoration: none;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
        }

        .dropdown-item:hover {
            background: var(--bg-secondary);
            color: var(--primary-pink);
        }

        .dropdown-item i {
            width: 16px;
            text-align: center;
        }

        .dropdown-divider {
            height: 1px;
            background: #e2e8f0;
            margin: 0.5rem 0;
        }

        /* Mobile logout button */
        .mobile-logout-btn {
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            padding: var(--space-md);
            color: var(--text-primary);
            font-size: 0.875rem;
            cursor: pointer;
            border-radius: var(--radius);
            transition: var(--transition);
        }

        .mobile-logout-btn:hover {
            background: var(--bg-secondary);
            color: var(--primary-pink);
        }

        /* Verification Notice */
        .verification-notice {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            padding: 1rem 0;
        }

        .verification-content {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .verification-content i {
            font-size: 2rem;
            opacity: 0.9;
        }

        .verification-content div {
            flex: 1;
        }

        .verification-content strong {
            display: block;
            margin-bottom: 0.25rem;
        }

        .verification-content p {
            margin: 0;
            opacity: 0.9;
            font-size: 0.875rem;
        }

        .btn-outline-primary {
            background: transparent;
            color: white;
            border: 2px solid white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .btn-outline-primary:hover {
            background: white;
            color: #f59e0b;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .verification-content {
                flex-direction: column;
                text-align: center;
            }

            .user-dropdown-menu {
                right: -1rem;
                left: -1rem;
                min-width: auto;
            }

            .auth-buttons {
                flex-direction: column;
                gap: 0.5rem;
            }

            .auth-buttons .login-btn,
            .auth-buttons .register-btn {
                font-size: 0.8rem;
                padding: 0.4rem 0.8rem;
            }

            .nav-links {
                display: none;
            }

            .mobile-menu-btn {
                display: block;
            }
        }

        @media (min-width: 769px) {
            .mobile-menu-btn {
                display: none;
            }
        }
    </style>

    <script>
        // Handle email verification resend
        document.addEventListener('DOMContentLoaded', function() {
            const resendBtn = document.getElementById('resend-verification');
            if (resendBtn) {
                resendBtn.addEventListener('click', async function() {
                    try {
                        await authService.resendVerification();
                        this.textContent = 'Wysłano!';
                        this.disabled = true;
                        setTimeout(() => {
                            this.textContent = 'Wyślij ponownie';
                            this.disabled = false;
                        }, 30000); // 30 seconds cooldown
                    } catch (error) {
                        console.error('Resend verification error:', error);
                    }
                });
            }
        });
    </script>

    @stack('scripts')
</body>
</html>