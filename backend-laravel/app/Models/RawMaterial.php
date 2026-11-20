<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RawMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'sku',
        'unit',
        'current_stock',
        'min_stock_alert',
        'avg_cost_per_unit',
    ];

    protected function casts(): array
    {
        return [
            'current_stock' => 'decimal:2',
            'min_stock_alert' => 'decimal:2',
            'avg_cost_per_unit' => 'decimal:2',
        ];
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function wasteLogs(): HasMany
    {
        return $this->hasMany(WasteLog::class);
    }

    public function modifiers(): HasMany
    {
        return $this->hasMany(Modifier::class);
    }
}
