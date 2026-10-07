<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    /**
     * Cache key prefix for a user's unread count. Invalidated setiap kali ada notifikasi
     * baru atau tindakan mark-as-read.
     */
    private const UNREAD_CACHE_PREFIX = 'notif.unread.';
    private const UNREAD_CACHE_TTL = 10; // detik — polling frontend 30s, cache 10s = max 2/3 request masuk DB

    /**
     * Get unread notification count for the authenticated user.
     *
     * Dicache 10 detik supaya polling 30s dari banyak tab tidak selalu memukul DB.
     * Hasil: 50 user × 2 tab × 2 poll/menit = 200 req/menit → maksimum ~50 query/menit
     * (hanya setiap 10 detik yang benar-benar query, sisanya dari cache).
     */
    public function unreadCount()
    {
        $userId = Auth::id();
        $count = Cache::remember(
            self::UNREAD_CACHE_PREFIX . $userId,
            self::UNREAD_CACHE_TTL,
            fn () => Notification::where('user_id', $userId)->where('is_read', false)->count()
        );

        return response()->json(['unread_count' => $count]);
    }

    /**
     * Hapus cache unread-count user tertentu. Dipanggil setiap kali status read berubah
     * atau ada notifikasi baru.
     */
    public static function forgetUnreadCache(string $userId): void
    {
        Cache::forget(self::UNREAD_CACHE_PREFIX . $userId);
    }

    /**
     * Get latest notifications for the authenticated user.
     */
    public function index()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(string $id)
    {
        $notification = Notification::where('user_id', Auth::id())->findOrFail($id);
        $notification->update(['is_read' => true]);
        self::forgetUnreadCache(Auth::id());

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);
        self::forgetUnreadCache(Auth::id());

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications for a specific journal as read.
     */
    public function markReadByJournal(string $journalId)
    {
        Notification::where('user_id', Auth::id())
            ->where('general_journal_id', $journalId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
        self::forgetUnreadCache(Auth::id());

        return response()->json(['success' => true]);
    }
}
