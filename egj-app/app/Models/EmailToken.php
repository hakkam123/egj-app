<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Prunable;

class EmailToken extends Model
{
    use HasUlids, Prunable;

    public $timestamps = false;

    protected static function booted()
    {
        static::creating(function ($token) {
            if (!$token->created_at) {
                $token->created_at = now();
            }
        });
    }

    protected $fillable = [
        'general_journal_id',
        'token',
        'email',
        'purpose',
        'expires_at',
        'used_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Get the prunable model query.
     * Prune tokens expired more than 7 days ago.
     */
    public function prunable()
    {
        return static::where('expires_at', '<', now()->subDays(7));
    }

    /**
     * The general journal this token belongs to.
     */
    public function generalJournal()
    {
        return $this->belongsTo(GeneralJournal::class);
    }

    /**
     * Check if the token is valid (not expired and not used).
     */
    public function isValid(): bool
    {
        return !$this->used_at && $this->expires_at->isFuture();
    }

    /**
     * Check if the token has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the token has been used.
     */
    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    /**
     * Mark the token as used.
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
