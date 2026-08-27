<?php

namespace App\Http\Controllers;

use App\Models\ErrorLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ErrorMonitoringController extends Controller
{
    /**
     * Display a listing of error logs.
     */
    public function index(Request $request)
    {
        $query = ErrorLog::with('user');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                  ->orWhere('exception_class', 'like', "%{$search}%")
                  ->orWhere('url', 'like', "%{$search}%")
                  ->orWhere('file', 'like', "%{$search}%");
            });
        }

        // Stats before status filter
        $statsQuery = clone $query;
        $stats = [
            'total' => (clone $statsQuery)->count(),
            'new' => (clone $statsQuery)->where('status', 'New')->count(),
            'resolved' => (clone $statsQuery)->where('status', 'Resolved')->count(),
            'ignored' => (clone $statsQuery)->where('status', 'Ignored')->count(),
        ];

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $query->orderBy('created_at', 'desc');

        $allowedPerPage = [10, 25, 50, 100];
        $perPage = in_array((int) $request->input('per_page', 10), $allowedPerPage)
            ? (int) $request->input('per_page', 10)
            : 10;

        $logs = $query->paginate($perPage)->withQueryString();

        return Inertia::render('ErrorMonitoring/Index', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'per_page']),
            'stats' => $stats,
        ]);
    }

    /**
     * Update status of an error log.
     */
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => ['required', 'in:New,Resolved,Ignored'],
        ]);

        $log = ErrorLog::findOrFail($id);
        $log->update(['status' => $request->status]);

        return back()->with('success', "Status error log diubah menjadi {$request->status}.");
    }

    /**
     * Delete an error log.
     */
    public function destroy(string $id)
    {
        $log = ErrorLog::findOrFail($id);
        $log->delete();

        return back()->with('success', 'Error log berhasil dihapus.');
    }
}

