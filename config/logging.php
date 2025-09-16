<?php
return [
    'default' => 'stack',
    'channels' => [
        'stack' => ['driver' => 'stack', 'channels' => ['single']],
        'single' => ['driver' => 'single', 'path' => storage_path('logs/laravel.log')],
        'emails' => [
            'driver' => 'single',
            'path' => storage_path('logs/emails.log'),
            'level' => 'info',
        ],
    ],
];