<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrackingController extends Controller
{
    /**
     * Show tracking list.
     */
    public function index(Request $request)
    {
        $query = GeneralJournal::with(['requester', 'assignee', 'lastApproveHistory.actor']);

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('journal_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('journal_date', '<=', $request->date_to);
        }

        // Filter by requester
        if ($request->filled('requested_by')) {
            $query->where('requested_by', $request->requested_by);
        }

        // Search by document number or reference
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $query->orderBy('last_updated_at', 'desc');

        // Per page with allowed values
        $allowedPerPage = [10, 25, 50, 100];
        $perPage = in_array((int) $request->input('per_page', 10), $allowedPerPage)
            ? (int) $request->input('per_page', 10)
            : 10;

        $journals = $query->paginate($perPage)->withQueryString();

        // Get users for requester dropdown
        $users = \App\Models\User::where('is_active', true)
            ->whereIn('role', ['Staff', 'Section Head', 'Dept/Div Head'])
            ->select('id', 'name', 'role')
            ->orderBy('name')
            ->get();

        return Inertia::render('Tracking/Index', [
            'journals' => $journals,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'requested_by', 'per_page']),
            'users' => $users,
        ]);
    }

    /**
     * Show tracking timeline for a journal.
     */
    public function show(string $id)
    {
        $journal = GeneralJournal::with([
            'requester',
            'histories' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'histories.actor',
            'approvals.assignedUser',
            'approvals.approvedByUser',
        ])->findOrFail($id);

        return response()->json([
            'journal' => $journal,
        ]);
    }
}
