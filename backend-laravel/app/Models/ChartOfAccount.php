<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_code',
        'account_name',
        'type',
        'category',
        'normal_balance',
        'initial_balance',
        'current_balance',
        'description',
        'is_active',
    ];

    protected $casts = [
        'initial_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function journalItems(): HasMany
    {
        return $this->hasMany(JournalEntryItem::class, 'chart_of_account_id');
    }
}
