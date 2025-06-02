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
                <a href="#lecturers" class="btn btn-primary">
                    <i class="fas fa-search"></i>
                    Zobacz lektorów
                </a>
                <a href="#about" class="btn btn-secondary">
                    <i class="fas fa-info-circle"></i>
                    Dowiedz się więcej
                </a>
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
        <div class="login-note">
            <i class="fas fa-info-circle"></i>
            <strong>Chcesz zarezerwować lekcję?</strong> Zaloguj się do swojego konta lub skontaktuj się z nami.
        </div>
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
@endsection