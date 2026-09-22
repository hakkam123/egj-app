<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use OpenSpout\Writer\XLSX\Writer;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Cell;

class MonitoringController extends Controller
{
    /**
     * Show monitoring page with all General Journals.
     */
    public function index(Request $request)
    {
        $query = GeneralJournal::with(['requester', 'assignee']);

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

        // Compute stats before applying status filter using single aggregated query
        $statsRaw = (clone $query)->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Waiting Approval' THEN 1 ELSE 0 END) as waiting,
            SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
        ")->first();

        $stats = [
            'total' => (int) ($statsRaw->total ?? 0),
            'waiting' => (int) ($statsRaw->waiting ?? 0),
            'approved' => (int) ($statsRaw->approved ?? 0),
            'rejected' => (int) ($statsRaw->rejected ?? 0),
        ];

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

        // Get all users for filter dropdown
        $users = \App\Models\User::where('is_active', true)
            ->whereIn('role', ['Staff', 'Section Head', 'Dept/Div Head'])
            ->select('id', 'name', 'role')
            ->orderBy('name')
            ->get();

        return Inertia::render('Monitoring/Index', [
            'journals' => $journals,
            'filters' => $request->only(['status', 'date_from', 'date_to', 'requested_by', 'search', 'per_page']),
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    /**
     * Export monitoring data to Excel (all filtered data using streaming chunking).
     */
    public function export(Request $request)
    {
        $query = GeneralJournal::with(['requester', 'assignee']);

        // Apply same filters as index
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('journal_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('journal_date', '<=', $request->date_to);
        }
        if ($request->filled('requested_by')) {
            $query->where('requested_by', $request->requested_by);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $fileName = 'monitoring_gj_' . now()->format('Y-m-d_His') . '.xlsx';
        $filePath = storage_path("app/{$fileName}");

        $writer = new Writer();
        $writer->openToFile($filePath);

        // Header row
        $headerRow = Row::fromValues([
            'Document Number',
            'Journal Date',
            'Reference',
            'Status',
            'Assign To',
            'Person Request',
            'Last Updated',
        ]);
        $writer->addRow($headerRow);

        // Stream data rows in chunks of 500
        $query->orderBy('last_updated_at', 'desc')->chunk(500, function ($journals) use ($writer) {
            foreach ($journals as $journal) {
                $row = Row::fromValues([
                    $journal->document_number,
                    $journal->journal_date ? $journal->journal_date->format('Y-m-d') : '',
                    $journal->reference ?? '',
                    $journal->status,
                    $journal->assignee?->name ?? '-',
                    $journal->requester?->name ?? '-',
                    $journal->last_updated_at?->format('Y-m-d H:i:s') ?? '',
                ]);
                $writer->addRow($row);
            }
        });

        $writer->close();

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
