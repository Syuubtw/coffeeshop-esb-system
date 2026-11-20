<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_period_id',
        'employee_id',
        'total_attendance_days',
        'total_late_minutes',
        'total_overtime_hours',
        'base_salary_earned',
        'allowance_earned',
        'overtime_earned',
        'service_charge_bonus',
        'deductions_amount',
        'net_salary',
    ];

    protected function casts(): array
    {
        return [
            'total_overtime_hours' => 'decimal:2',
            'base_salary_earned' => 'decimal:2',
            'allowance_earned' => 'decimal:2',
            'overtime_earned' => 'decimal:2',
            'service_charge_bonus' => 'decimal:2',
            'deductions_amount' => 'decimal:2',
            'net_salary' => 'decimal:2',
        ];
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PayslipItem::class);
    }
}
