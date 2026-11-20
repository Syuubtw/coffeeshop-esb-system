<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_opname_id',
        'raw_material_id',
        'system_stock',
        'physical_stock',
        'variance_qty',
        'unit_cost',
        'variance_cost',
        'reason',
    ];

    protected $casts = [
        'system_stock' => 'decimal:2',
        'physical_stock' => 'decimal:2',
        'variance_qty' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'variance_cost' => 'decimal:2',
    ];

    public function stockOpname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class, 'stock_opname_id');
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }
}
