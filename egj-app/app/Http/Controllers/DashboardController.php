<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournal;
use App\Models\ApprovalHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display role-based dashboard.
     */
    public function index()
    {
        $user = Auth::user();
        $role = $user->role;
        $thresholdDays = 3;

        $stats = [];
        $recentData = [];
        $actionQuery = null;

        if ($role === 'Staff') {
            $stats = [
                'total' => GeneralJournal::where('requested_by', $user->id)->count(),
                'draft' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Draft')->count(),
                'waiting' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Waiting Approval')->count(),
                'revised' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Revised')->count(),
                'approved' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Approved')->count(),
                'rejected' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Rejected')->count(),
            ];

            $recentData = GeneralJournal::with(['assignee'])
                ->where('requested_by', $user->id)
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();
        } elseif ($role === 'Section Head' || $role === 'Dept/Div Head') {
            $stats = [
                'pending_approval' => GeneralJournal::where('current_assign_to', $user->id)->where('status', 'Waiting Approval')->count(),
                'draft' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Draft')->count(),
                'revised' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Revised')->count(),
                'total_approved' => ApprovalHistory::where('actor_user_id', $user->id)->where('action', 'approve')->count(),
                'total_revised' => ApprovalHistory::where('actor_user_id', $user->id)->where('action', 'revise')->count(),
                'total_submitted_by_me' => GeneralJournal::where('requested_by', $user->id)->count(),
            ];

            $recentData = GeneralJournal::with(['requester'])
                ->where('current_assign_to', $user->id)
                ->where('status', 'Waiting Approval')
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();

            $actionQuery = GeneralJournal::with(['requester', 'assignee'])
                ->where('current_assign_to', $user->id)
                ->where('status', 'Waiting Approval');

        } elseif ($role === 'Admin') {
            $stats = [
                'total_users' => User::count(),
                'total_journals' => GeneralJournal::count(),
                'draft' => GeneralJournal::where('status', 'Draft')->count(),
                'waiting' => GeneralJournal::where('status', 'Waiting Approval')->count(),
                'revised' => GeneralJournal::where('status', 'Revised')->count(),
                'approved' => GeneralJournal::where('status', 'Approved')->count(),
                'rejected' => GeneralJournal::where('status', 'Rejected')->count(),
            ];

            $recentData = GeneralJournal::with(['requester', 'assignee'])
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();

            $actionQuery = GeneralJournal::with(['requester', 'assignee'])
                ->where('status', 'Waiting Approval');
        }

        // Calculate Action Required Documents (Waiting >= thresholdDays)
        $actionRequiredDocs = [];
        if ($actionQuery) {
            $thresholdDate = now()->subDays($thresholdDays);

            $actionRequiredDocs = $actionQuery
                ->where(function ($q) use ($thresholdDate) {
                    $q->where('submitted_at', '<=', $thresholdDate)
                      ->orWhere(function ($sub) use ($thresholdDate) {
                          $sub->whereNull('submitted_at')
                              ->where('created_at', '<=', $thresholdDate);
                      });
                })
                ->orderBy('submitted_at', 'asc')
                ->limit(20)
                ->get()
                ->map(function ($journal) {
                    $submittedDate = $journal->submitted_at ?? $journal->created_at ?? $journal->journal_date;
                    $daysWaiting = $submittedDate ? (int) floor(now()->floatDiffInDays($submittedDate)) : 0;

                    return [
                        'id' => $journal->id,
                        'document_number' => $journal->document_number,
                        'journal_date' => $journal->journal_date ? $journal->journal_date->format('Y-m-d') : null,
                        'submitted_at' => $journal->submitted_at ? $journal->submitted_at->format('Y-m-d H:i') : ($journal->created_at ? $journal->created_at->format('Y-m-d H:i') : null),
                        'reference' => $journal->reference,
                        'status' => $journal->status,
                        'requester' => $journal->requester ? ['id' => $journal->requester->id, 'name' => $journal->requester->name] : null,
                        'assignee' => $journal->assignee ? ['id' => $journal->assignee->id, 'name' => $journal->assignee->name] : null,
                        'days_waiting' => $daysWaiting,
                        'is_overdue' => true,
                    ];
                })
                ->all();
        }

        return Inertia::render('Dashboard/Index', [
            'role' => $role,
            'stats' => $stats,
            'recentData' => $recentData,
            'actionRequiredDocs' => $actionRequiredDocs,
            'thresholdDays' => $thresholdDays,
        ]);
    }
}
