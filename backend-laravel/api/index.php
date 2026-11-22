<?php

// Prepare temporary storage directory for Vercel Serverless environment
$tmpDirs = [
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
    '/tmp/views',
];

foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Normalize SCRIPT_NAME so Symfony/Laravel doesn't treat /api as subdirectory baseUrl
$_SERVER['SCRIPT_NAME'] = '/index.php';

// Forward to public/index.php
require __DIR__ . '/../public/index.php';
