<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpname extends Model
{
    use HasFactory;

    protected $fillable = [
        'opname_number',
        'opname_date',
        'audited_by',
        'approved_by',
        'status',
        'total_variance_qty',
        'total_variance_cost',
        'notes',
    ];

    protected $casts = [
        'opname_date' => 'date',
        'total_variance_qty' => 'decimal:2',
        'total_variance_cost' => 'decimal:2',
    ];

    public function auditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'audited_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class, 'stock_opname_id');
    }
}
