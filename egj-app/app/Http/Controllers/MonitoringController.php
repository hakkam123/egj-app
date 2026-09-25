<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use OpenSpout\Writer\XLSX\Writer;
use OpenSpout\Common\Entity\Row;

class MonitoringController extends Controller
{
    /**
     * Show monitoring page with all General Journals (including Drafts, Revised, etc.) and in-column filtering.
     */
    public function index(Request $request)
    {
        $query = GeneralJournal::with(['requester', 'assignee']);

        // In-column filter: Document Number
        if ($request->filled('doc_number')) {
            $query->where('document_number', 'like', "%{$request->doc_number}%");
        }

        // In-column filter: Requester / Person Request
        if ($request->filled('requester')) {
            $req = $request->requester;
            $query->where(function ($q) use ($req) {
                $q->where('requested_by', $req)
                  ->orWhereHas('requester', function ($u) use ($req) {
                      $u->where('name', 'like', "%{$req}%");
                  });
            });
        }

        // In-column filter: Assign To
        if ($request->filled('assign_to')) {
            $assign = $request->assign_to;
            $query->where(function ($q) use ($assign) {
                $q->where('current_assign_to', $assign)
                  ->orWhereHas('assignee', function ($u) use ($assign) {
                      $u->where('name', 'like', "%{$assign}%");
                  });
            });
        }

        // In-column filter: Reference
        if ($request->filled('reference')) {
            $query->where('reference', 'like', "%{$request->reference}%");
        }

        // In-column filter: Date
        if ($request->filled('date')) {
            $query->whereDate('journal_date', $request->date);
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->whereDate('journal_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('journal_date', '<=', $request->date_to);
        }

        // Search overall
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhereHas('requester', fn($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('assignee', fn($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        // Stats aggregated query
        $statsRaw = (clone $query)->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
            SUM(CASE WHEN status = 'Waiting Approval' THEN 1 ELSE 0 END) as waiting,
            SUM(CASE WHEN status = 'Revised' THEN 1 ELSE 0 END) as revised,
            SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
        ")->first();

        $stats = [
            'total' => (int) ($statsRaw->total ?? 0),
            'draft' => (int) ($statsRaw->draft ?? 0),
            'waiting' => (int) ($statsRaw->waiting ?? 0),
            'revised' => (int) ($statsRaw->revised ?? 0),
            'approved' => (int) ($statsRaw->approved ?? 0),
            'rejected' => (int) ($statsRaw->rejected ?? 0),
        ];

        // Filter by status if requested
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $query->orderBy('last_updated_at', 'desc');

        $allowedPerPage = [10, 25, 50, 100];
        $perPage = in_array((int) $request->input('per_page', 10), $allowedPerPage)
            ? (int) $request->input('per_page', 10)
            : 10;

        $journals = $query->paginate($perPage)->withQueryString();

        $users = User::where('is_active', true)
            ->whereIn('role', ['Staff', 'Section Head', 'Dept/Div Head'])
            ->select('id', 'name', 'role')
            ->orderBy('name')
            ->get();

        return Inertia::render('Monitoring/Index', [
            'journals' => $journals,
            'filters' => $request->only([
                'status',
                'date',
                'date_from',
                'date_to',
                'requested_by',
                'doc_number',
                'reference',
                'requester',
                'assign_to',
                'search',
                'per_page'
            ]),
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    /**
     * Export monitoring data to Excel with streaming.
     */
    public function export(Request $request)
    {
        $query = GeneralJournal::with(['requester', 'assignee']);

        if ($request->filled('doc_number')) {
            $query->where('document_number', 'like', "%{$request->doc_number}%");
        }
        if ($request->filled('reference')) {
            $query->where('reference', 'like', "%{$request->reference}%");
        }
        if ($request->filled('requester')) {
            $req = $request->requester;
            $query->where(function ($q) use ($req) {
                $q->where('requested_by', $req)
                  ->orWhereHas('requester', fn($u) => $u->where('name', 'like', "%{$req}%"));
            });
        }
        if ($request->filled('assign_to')) {
            $assign = $request->assign_to;
            $query->where(function ($q) use ($assign) {
                $q->where('current_assign_to', $assign)
                  ->orWhereHas('assignee', fn($u) => $u->where('name', 'like', "%{$assign}%"));
            });
        }
        if ($request->filled('date')) {
            $query->whereDate('journal_date', $request->date);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('journal_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('journal_date', '<=', $request->date_to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
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

        // Header row with # column
        $headerRow = Row::fromValues([
            '#',
            'Document Number',
            'Journal Date',
            'Reference',
            'Status',
            'Assign To',
            'Person Request',
            'Last Updated',
        ]);
        $writer->addRow($headerRow);

        $rowNumber = 1;
        $query->orderBy('last_updated_at', 'desc')->chunk(500, function ($journals) use ($writer, &$rowNumber) {
            foreach ($journals as $journal) {
                $row = Row::fromValues([
                    $rowNumber++,
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
