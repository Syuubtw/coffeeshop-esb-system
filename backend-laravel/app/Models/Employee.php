<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_code',
        'qr_token',
        'position',
        'department',
        'hire_date',
        'phone',
        'device_id',
        'device_info',
        'device_locked_at',
        'employment_status',
        'base_salary',
        'daily_allowance',
        'hourly_overtime_rate',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'daily_allowance' => 'decimal:2',
            'hourly_overtime_rate' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workSchedules(): HasMany
    {
        return $this->hasMany(WorkSchedule::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }
}
