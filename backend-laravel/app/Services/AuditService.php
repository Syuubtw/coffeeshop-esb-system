<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class AuditService
{
    /**
     * Record an audit log entry for system traceability & anti-fraud
     */
    public static function log(
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        string $description = '',
        ?array $oldValues = null,
        ?array $newValues = null
    ): ?AuditLog {
        try {
            $user = auth()->user();
            $request = request();

            return AuditLog::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?: 'System / Customer',
                'user_role' => $user ? ($user->roles->first()?->name ?? 'Staff') : 'Guest',
                'action' => strtoupper($action),
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'description' => $description,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => $request?->ip() ?: '127.0.0.1',
                'user_agent' => substr($request?->userAgent() ?: 'Internal CLI / Web', 0, 255),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to write Audit Log: ' . $e->getMessage());
            return null;
        }
    }
}
