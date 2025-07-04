<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="api-base-url" content="{{ config('app.url') }}/api">

    <title>{{ config('app.name', 'Platforma Lektorów') }}</title>

    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Bootstrap -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- SEO Meta Tags -->
    <meta name="description" content="Platforma do nauki języków obcych z wykwalifikowanymi lektorami. Dołącz do tysięcy zadowolonych uczniów!">
    <meta name="keywords" content="nauka języków, lektor, angielski, niemiecki, francuski, kursy online">
    <meta name="author" content="Platforma Lektorów">

    <!-- Open Graph -->
    <meta property="og:title" content="{{ config('app.name') }}">
    <meta property="og:description" content="Najlepsza platforma do nauki języków obcych">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ config('app.url') }}">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Critical CSS - inline small amount of CSS for faster rendering -->
    <style>
        /* Critical CSS for loading state */
        body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #ffffff;
        }

        .app-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #ff6b35 0%, #e91e63 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
        }

        .loading-logo {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }

        .loading-text {
            font-size: 1rem;
            opacity: 0.9;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        /* Hide loading when app is ready */
        .app-ready .app-loading {
            display: none;
        }

        /* Basic layout styles */
        #app {
            min-height: 100vh;
        }

        .hidden {
            display: none !important;
        }
    </style>

    <!-- Vite CSS -->
    @vite(['resources/css/app.css'])
</head>
<body>
    <!-- Loading Screen -->
    <div class="app-loading" id="app-loading">
        <div class="loading-logo">
            🎓 Platforma Lektorów
        </div>
        <div class="loading-spinner"></div>
        <div class="loading-text">Ładowanie aplikacji...</div>
    </div>

    <!-- Main Application Container -->
    <div id="app">
        <!-- Content will be rendered here by TypeScript/Router -->
        <noscript>
            <div style="text-align: center; padding: 50px; color: #666;">
                <h2>JavaScript jest wymagany</h2>
                <p>Ta aplikacja wymaga włączonego JavaScript aby działać poprawnie.</p>
                <p>Proszę włączyć JavaScript w ustawieniach przeglądarki i odświeżyć stronę.</p>
            </div>
        </noscript>
    </div>

    <!-- Environment Variables for Frontend -->
    <script>
        window.__APP_CONFIG__ = {
            apiUrl: '{{ config('app.url') }}/api',
            appName: '{{ config('app.name') }}',
            appEnv: '{{ config('app.env') }}',
            locale: '{{ app()->getLocale() }}'
        };
    </script>

    <!-- Vite TypeScript -->
    @vite(['resources/ts/main.ts'])

    <!-- Development Scripts -->
    @if(config('app.debug'))
    <script>
        // Development helpers
        console.log('🚀 App starting in development mode');
        console.log('Config:', window.__APP_CONFIG__);

        // Performance monitoring
        window.addEventListener('load', function() {
            if (window.performance) {
                console.log('⚡ Page load time:', window.performance.timing.loadEventEnd - window.performance.timing.navigationStart, 'ms');
            }
        });
    </script>
    @endif
</body>
</html>