<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Support\Facades\Cache;

class Notification extends Model
{
    use HasUlids, Prunable;

    public $timestamps = false;

    /**
     * Pastikan cache unread-count user ter-invalidate setiap kali ada notifikasi baru
     * (atau dihapus / dibaca). Tanpa ini, polling frontend akan terus memperlihatkan
     * angka lama hingga 10 detik berikutnya.
     */
    protected static function booted(): void
    {
        $invalidate = function (Notification $notification): void {
            if ($notification->user_id) {
                Cache::forget('notif.unread.' . $notification->user_id);
            }
        };

        static::created($invalidate);
        static::updated($invalidate);
        static::deleted($invalidate);
    }

    protected $fillable = [
        'user_id',
        'general_journal_id',
        'type',
        'message',
        'is_read',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Get the prunable model query.
     * Prune read notifications older than 30 days.
     */
    public function prunable()
    {
        return static::where('is_read', true)
            ->where('created_at', '<', now()->subDays(30));
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function generalJournal()
    {
        return $this->belongsTo(GeneralJournal::class);
    }
}
