<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'contact_person',
        'phone',
        'email',
        'address',
        'lead_time_days',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'lead_time_days' => 'integer',
    ];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
