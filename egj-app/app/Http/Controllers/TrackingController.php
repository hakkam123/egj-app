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
        $query = GeneralJournal::with(['requester', 'assignee']);

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

        $journals = $query->paginate(15)->withQueryString();

        return Inertia::render('Tracking/Index', [
            'journals' => $journals,
            'filters' => $request->only(['search', 'status']),
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
