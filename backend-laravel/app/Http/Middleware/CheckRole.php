<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle role-based access control.
     * Usage in routes: ->middleware('role:super_admin,store_manager')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Autentikasi diperlukan.',
            ], 401);
        }

        // Check if user has any of the allowed roles
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Anda tidak memiliki akses ke fitur ini. Role yang dibutuhkan: ' . implode(', ', $roles),
        ], 403);
    }
}
