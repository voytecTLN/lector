<?php

return [
    /*
    |--------------------------------------------------------------------------
    | ClamAV Antivirus Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the ClamAV antivirus scanner for file uploads.
    |
    */

    // Enable/disable antivirus scanning
    'enabled' => env('CLAMAV_ENABLED', false),

    // Path to ClamAV socket file
    'socket_path' => env('CLAMAV_SOCKET_PATH', '/var/run/clamav/clamd.ctl'),

    // Connection timeout in seconds
    'timeout' => env('CLAMAV_TIMEOUT', 30),

    // Maximum file size to scan (in bytes)
    'max_file_size' => env('CLAMAV_MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB

    // File types to skip scanning (trusted extensions)
    'skip_extensions' => [
        // Add trusted extensions if needed
    ],

    // Action to take on infected files
    'quarantine_path' => storage_path('app/quarantine'),
];