<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashierShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'opened_at',
        'closed_at',
        'starting_cash',
        'expected_ending_cash',
        'actual_ending_cash',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'starting_cash' => 'decimal:2',
            'expected_ending_cash' => 'decimal:2',
            'actual_ending_cash' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function getStartCashAttribute()
    {
        return $this->starting_cash;
    }

    public function getEndCashAttribute()
    {
        return $this->actual_ending_cash;
    }

    public function getStatusAttribute(): string
    {
        return $this->closed_at ? 'CLOSED' : 'OPEN';
    }
}
