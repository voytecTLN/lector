<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name') }}</title>
    @vite(['resources/css/app.css', 'resources/ts/main.ts'])
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="{{ route('home') }}">
                🎯 {{ config('app.name') }}
            </a>
            <!-- TODO: Add navigation menu -->
            <!-- TODO: Add user authentication links -->
        </div>
    </nav>

    <main class="py-4">
        @yield('content')
    </main>

    <!-- TODO: Add notification container -->
    <!-- TODO: Add global loader -->
    <!-- TODO: Add user data for JavaScript -->
</body>
</html>
