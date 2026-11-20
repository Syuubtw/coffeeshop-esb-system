<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Modifier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'modifier_group_id',
        'name',
        'additional_price',
        'raw_material_id',
        'qty_used',
    ];

    protected function casts(): array
    {
        return [
            'additional_price' => 'decimal:2',
            'qty_used' => 'decimal:2',
        ];
    }

    public function modifierGroup(): BelongsTo
    {
        return $this->belongsTo(ModifierGroup::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function orderItemModifiers(): HasMany
    {
        return $this->hasMany(OrderItemModifier::class);
    }
}
