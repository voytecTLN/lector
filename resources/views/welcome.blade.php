{{-- resources/views/welcome.blade.php - Zaktualizowana strona główna --}}
@extends('layouts.app')

@section('title', 'Nauka języków online')

@section('content')
<!-- Hero Section -->
<section class="hero" id="home">
    <div class="container">
        <div class="hero-content">
            <h1 class="hero-title">Nauka języków online z najlepszymi lektorami</h1>
            <p class="hero-subtitle">Personalizowane lekcje, elastyczny harmonogram, sprawdzone metody nauczania. Odkryj nowy sposób na naukę języków obcych.</p>
            <div class="cta-buttons">
                @guest
                    <!-- Buttons for not logged in users -->
                    <a href="{{ route('register') }}" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i>
                        Dołącz za darmo
                    </a>
                    <a href="#lecturers" class="btn btn-secondary">
                        <i class="fas fa-search"></i>
                        Zobacz lektorów
                    </a>
                @else
                    <!-- Buttons for logged in users -->
                    @if(auth()->user()->isStudent())
                        <a href="{{ route('student.tutors') }}" class="btn btn-primary">
                            <i class="fas fa-search"></i>
                            Znajdź lektora
                        </a>
                        <a href="{{ route('student.dashboard') }}" class="btn btn-secondary">
                            <i class="fas fa-tachometer-alt"></i>
                            Mój panel
                        </a>
                    @elseif(auth()->user()->isTutor())
                        <a href="{{ route('tutor.dashboard') }}" class="btn btn-primary">
                            <i class="fas fa-tachometer-alt"></i>
                            Panel lektora
                        </a>
                        <a href="{{ route('tutor.lessons') }}" class="btn btn-secondary">
                            <i class="fas fa-calendar"></i>
                            Moje lekcje
                        </a>
                    @else
                        <a href="{{ route(auth()->user()->role . '.dashboard') }}" class="btn btn-primary">
                            <i class="fas fa-tachometer-alt"></i>
                            Mój panel
                        </a>
                        <a href="#about" class="btn btn-secondary">
                            <i class="fas fa-info-circle"></i>
                            Dowiedz się więcej
                        </a>
                    @endif
                @endguest
            </div>
        </div>
    </div>
</section>

<!-- Features Section -->
<section class="features">
    <div class="container">
        <h2 class="section-title">Dlaczego warto nas wybrać?</h2>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <h3>Spersonalizowane lekcje</h3>
                <p>Każda lekcja dostosowana do Twoich potrzeb i poziomu zaawansowania. Indywidualne podejście gwarantuje maksymalną efektywność nauki.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h3>Elastyczny harmonogram</h3>
                <p>Uczysz się kiedy chcesz - dostępność lektorów 7 dni w tygodniu. Dopasuj naukę do swojego trybu życia.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3>Doświadczeni lektorzy</h3>
                <p>Wszystkich naszych lektorów łączy pasja do nauczania i wysokie kwalifikacje. Sprawdzone metody nauczania.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-laptop"></i>
                </div>
                <h3>Nowoczesna platforma</h3>
                <p>Intuicyjna platforma z wszystkimi narzędziami potrzebnymi do nauki. Interaktywne materiały i zaawansowane funkcje.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-book"></i>
                </div>
                <h3>Materiały dydaktyczne</h3>
                <p>Dostęp do bogatej biblioteki materiałów i ćwiczeń. Stale aktualizowane treści dostosowane do różnych poziomów.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <h3>Gwarancja jakości</h3>
                <p>System ocen i opinii zapewnia najwyższą jakość nauczania. Monitorujemy postępy i dostosowujemy metody.</p>
            </div>
        </div>
    </div>
</section>

<!-- Lecturers Section -->
<section class="lecturers" id="lecturers">
    <div class="container">
        <h2 class="section-title">Poznaj naszych lektorów</h2>
        <div class="lecturers-grid">
            <div class="lecturer-card">
                <div class="lecturer-avatar">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="lecturer-info">
                    <div class="lecturer-name">Anna Kowalska</div>
                    <div class="lecturer-languages">Angielski, Niemiecki</div>
                    <div class="lecturer-rating">
                        <span class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </span>
                        <span class="rating-text">5.0 (124 opinii)</span>
                    </div>
                    <p class="lecturer-description">Specjalizuje się w języku biznesowym i przygotowaniu do egzaminów międzynarodowych.</p>
                </div>
            </div>
            <div class="lecturer-card">
                <div class="lecturer-avatar">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="lecturer-info">
                    <div class="lecturer-name">Piotr Novak</div>
                    <div class="lecturer-languages">Francuski, Hiszpański</div>
                    <div class="lecturer-rating">
                        <span class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </span>
                        <span class="rating-text">4.9 (89 opinii)</span>
                    </div>
                    <p class="lecturer-description">Native speaker z długoletnim doświadczeniem w nauczaniu konwersacji.</p>
                </div>
            </div>
            <div class="lecturer-card">
                <div class="lecturer-avatar">
                    <i class="fas fa-user-friends"></i>
                </div>
                <div class="lecturer-info">
                    <div class="lecturer-name">Maria Silva</div>
                    <div class="lecturer-languages">Włoski, Portugalski</div>
                    <div class="lecturer-rating">
                        <span class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </span>
                        <span class="rating-text">4.8 (76 opinii)</span>
                    </div>
                    <p class="lecturer-description">Specjalistka w zakresie gramatyki i nauki języków dla dzieci.</p>
                </div>
            </div>
        </div>

        @guest
            <!-- Call to action for guests -->
            <div class="login-note">
                <div class="cta-content">
                    <i class="fas fa-rocket"></i>
                    <div class="cta-text">
                        <strong>Gotowy na rozpoczęcie przygody z językami?</strong>
                        <p>Dołącz do tysięcy zadowolonych użytkowników i zacznij naukę już dziś!</p>
                    </div>
                    <div class="cta-buttons-inline">
                        <a href="{{ route('register') }}" class="btn btn-primary">
                            <i class="fas fa-user-plus"></i>
                            Utwórz konto
                        </a>
                        <a href="{{ route('login') }}" class="btn btn-outline-primary">
                            <i class="fas fa-sign-in-alt"></i>
                            Mam już konto
                        </a>
                    </div>
                </div>
            </div>
        @else
            <!-- Message for logged in users -->
            <div class="login-note">
                <div class="welcome-message">
                    <i class="fas fa-heart"></i>
                    <div class="welcome-text">
                        <strong>Witaj ponownie, {{ auth()->user()->name }}!</strong>
                        <p>
                            @if(auth()->user()->isStudent())
                                Gotowy na kolejną lekcję? Sprawdź dostępnych lektorów lub zarządzaj swoimi lekcjami.
                            @elseif(auth()->user()->isTutor())
                                Sprawdź swój harmonogram i zarządzaj lekcjami ze swoimi studentami.
                            @else
                                Witamy w panelu {{ $this->getRoleDisplayName(auth()->user()->role) }}.
                            @endif
                        </p>
                    </div>
                    <div class="welcome-buttons">
                        @if(auth()->user()->isStudent())
                            <a href="{{ route('student.dashboard') }}" class="btn btn-primary">
                                <i class="fas fa-tachometer-alt"></i>
                                Mój panel
                            </a>
                        @elseif(auth()->user()->isTutor())
                            <a href="{{ route('tutor.dashboard') }}" class="btn btn-primary">
                                <i class="fas fa-chalkboard-teacher"></i>
                                Panel lektora
                            </a>
                        @else
                            <a href="{{ route(auth()->user()->role . '.dashboard') }}" class="btn btn-primary">
                                <i class="fas fa-tachometer-alt"></i>
                                Przejdź do panelu
                            </a>
                        @endif
                    </div>
                </div>
            </div>
        @endguest
    </div>
</section>

<!-- About Section -->
<section class="about" id="about">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <h2>O nas</h2>
                <p>Jesteśmy platformą łączącą uczniów z najlepszymi lektorami języków obcych. Nasze rozwiązanie pozwala na skuteczną naukę z każdego miejsca na świecie.</p>
                <p>Dzięki nowoczesnym technologiom i doświadczonym lektorom, zapewniamy najwyższą jakość nauczania dostosowaną do indywidualnych potrzeb każdego ucznia.</p>

                @guest
                    <!-- Encourage registration -->
                    <div class="about-cta">
                        <h3>Rozpocznij swoją podróż językową</h3>
                        <p>Dołącz do naszej społeczności i odkryj nowy sposób nauki języków. Rejestracja jest bezpłatna!</p>
                        <a href="{{ route('register') }}" class="btn btn-gradient">
                            <i class="fas fa-rocket"></i>
                            Rozpocznij za darmo
                        </a>
                    </div>
                @endguest
            </div>
            <div class="col-md-6">
                <h3>Kontakt</h3>
                <div class="contact-info">
                    <p><i class="fas fa-envelope"></i> kontakt@platformalektorow.pl</p>
                    <p><i class="fas fa-phone"></i> +48 123 456 789</p>
                    <p><i class="fas fa-map-marker-alt"></i> Warszawa, ul. Przykładowa 123</p>
                </div>
                <h3>Dostępne języki</h3>
                <div class="languages-list">
                    <span class="language-tag">Angielski</span>
                    <span class="language-tag">Niemiecki</span>
                    <span class="language-tag">Francuski</span>
                    <span class="language-tag">Hiszpański</span>
                    <span class="language-tag">Włoski</span>
                    <span class="language-tag">Portugalski</span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Additional Styles for enhanced welcome page -->
<style>
/* CTA Content Styles */
.cta-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
}

.cta-content i {
    font-size: 3rem;
    color: var(--primary-orange);
    flex-shrink: 0;
}

.cta-text {
    flex: 1;
}

.cta-text strong {
    display: block;
    color: var(--text-primary);
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
}

.cta-text p {
    margin: 0;
    color: var(--text-secondary);
}

.cta-buttons-inline {
    display: flex;
    gap: 1rem;
    flex-shrink: 0;
}

/* Welcome Message Styles */
.welcome-message {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
}

.welcome-message i {
    font-size: 3rem;
    color: var(--primary-pink);
    flex-shrink: 0;
}

.welcome-text {
    flex: 1;
}

.welcome-text strong {
    display: block;
    color: var(--text-primary);
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
}

.welcome-text p {
    margin: 0;
    color: var(--text-secondary);
}

.welcome-buttons {
    flex-shrink: 0;
}

/* About CTA Styles */
.about-cta {
    background: var(--bg-secondary);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    margin-top: 2rem;
    border-left: 4px solid var(--primary-pink);
}

.about-cta h3 {
    color: var(--text-primary);
    margin-bottom: 1rem;
}

.about-cta p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .cta-content,
    .welcome-message {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .cta-buttons-inline {
        flex-direction: column;
        width: 100%;
    }

    .cta-buttons-inline .btn {
        width: 100%;
        justify-content: center;
    }

    .hero .cta-buttons {
        flex-direction: column;
        align-items: center;
    }

    .hero .cta-buttons .btn {
        width: 100%;
        max-width: 300px;
    }
}

/* Enhanced hero section for different user states */
.hero.authenticated {
    background: linear-gradient(135deg, #4ade80 0%, #059669 100%);
}

@auth
    .hero {
        background: linear-gradient(135deg, #4ade80 0%, #059669 100%);
    }
@endauth
</style>

@push('scripts')
<script>
// Helper function dla ról użytkowników w Blade templates
function getRoleDisplayName(role) {
    const roleNames = {
        'admin': 'Administrator',
        'moderator': 'Moderator',
        'tutor': 'Lektor',
        'student': 'Student'
    };
    return roleNames[role] || role;
}

// Enhanced CTA tracking for analytics
document.addEventListener('DOMContentLoaded', function() {
    // Track CTA button clicks
    document.querySelectorAll('.cta-buttons a, .cta-buttons-inline a').forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            const section = this.closest('section')?.id || 'unknown';

            console.log('CTA clicked:', {
                text: buttonText,
                section: section,
                href: this.getAttribute('href'),
                authenticated: {{ auth()->check() ? 'true' : 'false' }}
            });

            // Here you could send analytics data to your tracking service
        });
    });
});
</script>
@endpush
@endsection