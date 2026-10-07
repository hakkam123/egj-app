<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Support\Str;

class EmailToken extends Model
{
    use HasUlids, Prunable;

    /**
     * Every emailed approval/revision/preview link is valid for at most this many days.
     */
    public const TTL_DAYS = 5;

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
     * Issue a new random token for a journal, valid for TTL_DAYS.
     */
    public static function issue(GeneralJournal $journal, string $email, string $purpose): self
    {
        return static::create([
            'general_journal_id' => $journal->id,
            'token' => Str::random(64),
            'email' => $email,
            'purpose' => $purpose,
            'expires_at' => now()->addDays(self::TTL_DAYS),
            'created_at' => now(),
        ]);
    }

    /**
     * Expire every outstanding (unused, unexpired) token of a journal so old email links
     * can no longer act on it. Optionally limited to one recipient.
     */
    public static function revokeFor(string $journalId, ?string $email = null): void
    {
        static::where('general_journal_id', $journalId)
            ->when($email, fn ($q) => $q->where('email', $email))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->update(['expires_at' => now()->subSecond()]);
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
