<!doctype html>
<html lang="en" data-theme="{{ $config->renderer()->get('theme', 'light') }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="color-scheme" content="{{ $config->renderer()->get('theme', 'light') }}">
    <title>{{ $config->get('ui.title') ?? config('app.name') . ' - API Docs' }}</title>

    <script src="https://cdn.jsdelivr.net/npm/@stoplight/elements@8.4.2/web-components.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stoplight/elements@8.4.2/styles.min.css">

    @include('scramble::dev-tools', ['renderer' => 'elements'])

    <style>
        html, body { margin:0; height:100%; }
        body { 
            background-color: var(--color-canvas); 
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* Top Live Auth Status Bar */
        #api-auth-bar {
            background: #0f172a;
            color: #f8fafc;
            height: 48px;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1e293b;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
            z-index: 99999;
            flex-shrink: 0;
            user-select: none;
        }

        .auth-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.02em;
            transition: all 0.3s ease;
        }

        .auth-pill-red {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .auth-pill-green {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.4);
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }

        .dot-red {
            background: #ef4444;
        }

        .dot-green {
            background: #10b981;
            box-shadow: 0 0 8px #10b981;
            animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
        }

        .auth-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;
        }
        .auth-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .auth-btn:active { transform: translateY(0); }

        .btn-logout { background: #dc2626; color: #fff; }

        #docs-container {
            flex: 1;
            height: calc(100vh - 48px);
            overflow: hidden;
            position: relative;
        }

        elements-api {
            height: 100% !important;
            display: block;
        }
    </style>

    <script>
        const originalFetch = window.fetch;
        const TOKEN_STORAGE_KEY = 'scramble_bearer_token';
        const USER_STORAGE_KEY = 'scramble_user_info';

        // Auto-inject Sanctum Bearer Token & CSRF, and capture token on login
        window.fetch = async (url, options = {}) => {
            const token = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token');
            const headers = options.headers instanceof Headers
                ? options.headers
                : new Headers(options.headers || {});

            if (token && !headers.has('Authorization')) {
                headers.set('Authorization', 'Bearer ' + token);
            }

            const CSRF_TOKEN_COOKIE_KEY = "XSRF-TOKEN";
            const CSRF_TOKEN_HEADER_KEY = "X-XSRF-TOKEN";
            const getCookieValue = (key) => {
                const cookie = document.cookie.split(';').find((cookie) => cookie.trim().startsWith(key));
                return cookie?.split("=")[1];
            };

            const csrfToken = getCookieValue(CSRF_TOKEN_COOKIE_KEY);
            if (csrfToken && !headers.has(CSRF_TOKEN_HEADER_KEY)) {
                headers.set(CSRF_TOKEN_HEADER_KEY, decodeURIComponent(csrfToken));
            }

            const response = await originalFetch(url, { ...options, headers });

            // Otomatis deteksi & simpan token jika user menjalankan endpoint Login Staf
            try {
                const urlString = typeof url === 'string' ? url : (url.url || '');
                if (urlString.includes('/api/auth/login')) {
                    const clone = response.clone();
                    clone.json().then(data => {
                        if (data && data.status === 'success' && data.data?.token) {
                            localStorage.setItem(TOKEN_STORAGE_KEY, data.data.token);
                            localStorage.setItem('token', data.data.token);
                            if (data.data.user) {
                                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data.user));
                            }
                            updateAuthBadge();
                        }
                    }).catch(() => {});
                } else if (urlString.includes('/api/auth/logout')) {
                    const clone = response.clone();
                    clone.json().then(data => {
                        if (data && data.status === 'success') {
                            localStorage.removeItem(TOKEN_STORAGE_KEY);
                            localStorage.removeItem('token');
                            localStorage.removeItem(USER_STORAGE_KEY);
                            updateAuthBadge();
                        }
                    }).catch(() => {});
                }
            } catch (e) {}

            return response;
        };

        // Live Auth State Check
        async function updateAuthBadge() {
            const badge = document.getElementById('auth-status-pill');
            const dot = document.getElementById('auth-status-dot');
            const text = document.getElementById('auth-status-text');
            const userSpan = document.getElementById('auth-user-detail');
            const btnLogout = document.getElementById('btn-logout');

            const token = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token');

            if (!token) {
                renderUnauthenticated();
                return;
            }

            try {
                const res = await originalFetch('/api/auth/status', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
                const result = await res.json();

                if (result.authenticated && result.data?.user) {
                    badge.className = 'auth-status-pill auth-pill-green';
                    dot.className = 'status-dot dot-green';
                    text.innerText = '🟢 SEDANG LOGIN: ' + result.data.user.name;
                    userSpan.innerText = '[' + (result.data.user.roles || []).join(', ').toUpperCase() + ']';
                    userSpan.style.display = 'inline';
                    if (btnLogout) btnLogout.style.display = 'inline-flex';
                } else {
                    localStorage.removeItem(TOKEN_STORAGE_KEY);
                    renderUnauthenticated();
                }
            } catch (err) {
                renderUnauthenticated();
            }

            function renderUnauthenticated() {
                badge.className = 'auth-status-pill auth-pill-red';
                dot.className = 'status-dot dot-red';
                text.innerText = '🔴 BELUM LOGIN (Unauthenticated)';
                userSpan.style.display = 'none';
                if (btnLogout) btnLogout.style.display = 'none';
            }
        }

        function logoutAuth() {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem('token');
            localStorage.removeItem(USER_STORAGE_KEY);
            updateAuthBadge();
        }

        document.addEventListener('DOMContentLoaded', () => {
            updateAuthBadge();
        });
    </script>
</head>
<body>

<!-- TOP AUTHENTICATION & STATUS BAR -->
<div id="api-auth-bar">
    <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: 800; font-size: 13px; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
            ☕ CoffeeShop API Docs
        </span>
        <span style="color: #334155;">|</span>
        
        <!-- Live Status Pill (Hijau = Sedang Login, Merah = Belum Login) -->
        <div id="auth-status-pill" class="auth-status-pill auth-pill-red" title="Status otentikasi Sanctum Bearer Token saat ini">
            <span id="auth-status-dot" class="status-dot dot-red"></span>
            <span id="auth-status-text">Memeriksa Status Login...</span>
            <span id="auth-user-detail" style="font-size: 11px; opacity: 0.85; margin-left: 2px; display: none;"></span>
        </div>
    </div>

    <!-- Tombol Logout (Hanya tampil saat sedang login) -->
    <div style="display: flex; align-items: center; gap: 8px;">
        <button id="btn-logout" onclick="logoutAuth()" class="auth-btn btn-logout" style="display: none;" title="Hapus token dan reset status ke Belum Login">
            🚪 Logout / Cabut Token
        </button>
    </div>
</div>

<!-- STOPLIGHT ELEMENTS CONTAINER -->
<div id="docs-container">
    <elements-api
        id="docs"
        @foreach($config->renderer()->all(except: ['theme']) as $key => $value)
            @continue(! $value)
            {{ $key }}="{{ $value === true ? 'true' : ($value === false ? 'false' : $value) }}"
        @endforeach
    />
</div>

<script>
    (async () => {
        const docs = document.getElementById('docs');
        docs.apiDescriptionDocument = @json($spec);
    })();
</script>

@if($config->renderer()->get('theme', 'light') === 'system')
    <script>
        var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        function updateTheme(e) {
            if (e.matches) {
                window.document.documentElement.setAttribute('data-theme', 'dark');
                window.document.getElementsByName('color-scheme')[0].setAttribute('content', 'dark');
            } else {
                window.document.documentElement.setAttribute('data-theme', 'light');
                window.document.getElementsByName('color-scheme')[0].setAttribute('content', 'light');
            }
        }

        mediaQuery.addEventListener('change', updateTheme);
        updateTheme(mediaQuery);
    </script>
@endif
</body>
</html>
