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
        'api' => [
            'driver' => 'single',
            'path' => storage_path('logs/api.log'),
            'level' => 'info',
        ],
        'meetings' => [
            'driver' => 'single',
            'path' => storage_path('logs/meetings.log'),
            'level' => 'info',
        ],
    ],
];