<?php

return [

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Daily.co Configuration
    'daily' => [
        // TODO: Uzupełnij danymi z Daily.co dashboard
        'api_key' => env('DAILY_API_KEY'),
        'domain' => env('DAILY_DOMAIN'),
        'enable_prejoin' => env('DAILY_ENABLE_PREJOIN', true),
        'enable_recording' => env('DAILY_ENABLE_RECORDING', false),
        'max_participants' => env('DAILY_MAX_PARTICIPANTS', 2),
        'meeting_duration' => env('DAILY_MEETING_DURATION', 120),
        'enable_chat' => env('DAILY_ENABLE_CHAT', true),
        'enable_screen_share' => env('DAILY_ENABLE_SCREEN_SHARE', true),
        'enable_knocking' => env('DAILY_ENABLE_KNOCKING', false),
        'start_video_off' => env('DAILY_START_VIDEO_OFF', false),
        'start_audio_off' => env('DAILY_START_AUDIO_OFF', false),
    ],

];
