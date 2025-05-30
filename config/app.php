<?php

return [
    'name' => env('APP_NAME', 'Platforma Lektorów'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => 'Europe/Warsaw',
    'locale' => 'pl',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
    'providers' => [
            Illuminate\Foundation\Providers\FoundationServiceProvider::class,
            Illuminate\Cookie\CookieServiceProvider::class,
            Illuminate\Encryption\EncryptionServiceProvider::class,
            Illuminate\Filesystem\FilesystemServiceProvider::class,
            Illuminate\Session\SessionServiceProvider::class,
            Illuminate\View\ViewServiceProvider::class,
            Illuminate\Routing\RoutingServiceProvider::class,
            Illuminate\Cache\CacheServiceProvider::class,
            Illuminate\Database\DatabaseServiceProvider::class,  // dla DB
            Illuminate\Translation\TranslationServiceProvider::class,  // dla lokalizacji
            Illuminate\Validation\ValidationServiceProvider::class,  // dla walidacji
            App\Providers\RouteServiceProvider::class,
    ],
//     'providers' => [
//         Illuminate\Foundation\Providers\FoundationServiceProvider::class,
//         Illuminate\Cookie\CookieServiceProvider::class,
//         Illuminate\Database\DatabaseServiceProvider::class,
//         Illuminate\Encryption\EncryptionServiceProvider::class,
//         Illuminate\Filesystem\FilesystemServiceProvider::class,
//         Illuminate\Foundation\Providers\FormRequestServiceProvider::class,
//         Illuminate\Hash\HashServiceProvider::class,
//         Illuminate\Mail\MailServiceProvider::class,
//         Illuminate\Notifications\NotificationServiceProvider::class,
//         Illuminate\Pagination\PaginationServiceProvider::class,
//         Illuminate\Pipeline\PipelineServiceProvider::class,
//         Illuminate\Queue\QueueServiceProvider::class,
//         Illuminate\Redis\RedisServiceProvider::class,
//         Illuminate\Auth\Passwords\PasswordResetServiceProvider::class,
//         Illuminate\Session\SessionServiceProvider::class,
//         Illuminate\Translation\TranslationServiceProvider::class,
//         Illuminate\Validation\ValidationServiceProvider::class,
//         Illuminate\View\ViewServiceProvider::class,
//     ],
];
