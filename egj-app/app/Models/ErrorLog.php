<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Prunable;

class ErrorLog extends Model
{
    use HasUlids, Prunable;

    protected $fillable = [
        'message',
        'exception_class',
        'file',
        'line',
        'stack_trace',
        'url',
        'method',
        'user_id',
        'ip_address',
        'user_agent',
        'status',
    ];

    /**
     * Get the prunable model query.
     * Resolved/Ignored > 7 hari, atau semua error > 30 hari.
     */
    public function prunable()
    {
        return static::where(function ($q) {
            $q->whereIn('status', ['Resolved', 'Ignored'])
              ->where('updated_at', '<', now()->subDays(7));
        })->orWhere('created_at', '<', now()->subDays(30));
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
