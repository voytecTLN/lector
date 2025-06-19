<?php
// config/auth.php - Updated Authentication Configuration

return [
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
        'api' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_resets',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'verification' => [
        'token_lifetime' => env('VERIFICATION_TOKEN_LIFETIME', 24), // hours
        'resend_throttle' => env('VERIFICATION_RESEND_THROTTLE', 60), // minutes
        'max_attempts' => env('VERIFICATION_MAX_ATTEMPTS', 2),
    ],

    'password_timeout' => 10800,
];
