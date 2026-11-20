<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

#[Group(
    name: '01. Autentikasi Staf (Login & Sesi)',
    description: 'Endpoint autentikasi staf kasir, barista, admin gudang, store manager, dan owner (Sanctum Token).',
    weight: 1
)]
class AuthController extends Controller
{
    /**
     * Login Staf & Terbitkan Bearer Token Sanctum
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $roles = $user->getRoleNames();
        $token = $user->createToken('auth-token', $roles->toArray())->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $roles,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Cek Status Autentikasi Sesi Staf (Indikator Hijau / Merah)
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();

        if ($user) {
            return response()->json([
                'status' => 'authenticated',
                'authenticated' => true,
                'indicator' => 'HIJAU',
                'badge' => '🟢 SEDANG LOGIN (TOKEN VALID)',
                'color' => '#10B981',
                'message' => 'Anda telah terotentikasi dan dapat mengakses seluruh endpoint API sesuai hak akses (role).',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'roles' => $user->getRoleNames(),
                    ],
                ],
            ], 200);
        }

        return response()->json([
            'status' => 'unauthenticated',
            'authenticated' => false,
            'indicator' => 'MERAH',
            'badge' => '🔴 BELUM LOGIN (UNAUTHENTICATED)',
            'color' => '#EF4444',
            'message' => 'Anda belum login atau token Bearer tidak valid! Silakan login melalui endpoint POST /api/auth/login untuk mendapatkan token akses.',
            'action' => 'Kirim POST /api/auth/login dengan { email, password } untuk mendapatkan access_token.',
        ], 200);
    }

    /**
     * Profil Pengguna yang Sedang Login
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'employee' => $user->employee,
            ],
        ]);
    }

    /**
     * Logout & Cabut Sesi Token Aktif
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully',
        ]);
    }
}

