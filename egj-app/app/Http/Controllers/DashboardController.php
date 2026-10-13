<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Dashboard per role, mengikuti aturan RBAC visibility:
     *   - Staff          : hanya journal buatannya sendiri
     *   - Section Head   : journal buatannya + buatan Staff
     *   - Dept/Div Head  : semua journal (lintas role)
     *   - Admin          : semua journal + statistik system
     *
     * Approver (Section Head, Dept/Div Head) juga mendapat tambahan info personal:
     * antrian pending di meja mereka, dan jumlah approve/revise yang pernah dilakukan.
     */
    public function index()
    {
        $user = Auth::user();
        $role = $user->role;
        $thresholdDays = 3;

        $stats = [];
        $recentData = [];
        $actionQuery = null;

        if ($role === 'Admin') {
            $stats = [
                'total_users'     => User::count(),
                'total_journals'  => GeneralJournal::count(),
                'draft'           => GeneralJournal::where('status', 'Draft')->count(),
                'waiting'         => GeneralJournal::where('status', 'Waiting Approval')->count(),
                'revised'         => GeneralJournal::where('status', 'Revised')->count(),
                'approved'        => GeneralJournal::where('status', 'Approved')->count(),
                'rejected'        => GeneralJournal::where('status', 'Rejected')->count(),
            ];

            $recentData = GeneralJournal::with(['requester', 'assignee'])
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();

            $actionQuery = GeneralJournal::with(['requester', 'assignee'])
                ->where('status', 'Waiting Approval');
        } else {
            // Non-admin: ringkasan berbasis RBAC visibility
            $visible = GeneralJournal::visibleTo($user);

            $stats = [
                'total'    => (clone $visible)->count(),
                'draft'    => (clone $visible)->where('status', 'Draft')->count(),
                'waiting'  => (clone $visible)->where('status', 'Waiting Approval')->count(),
                'revised'  => (clone $visible)->where('status', 'Revised')->count(),
                'approved' => (clone $visible)->where('status', 'Approved')->count(),
                'rejected' => (clone $visible)->where('status', 'Rejected')->count(),
            ];

            // Info personal untuk Approver (Section Head, Dept/Div Head)
            if ($user->isApprover()) {
                $stats['pending_approval']       = GeneralJournal::where('current_assign_to', $user->id)
                    ->where('status', 'Waiting Approval')->count();
                $stats['total_approved']         = ApprovalHistory::where('actor_user_id', $user->id)
                    ->where('action', 'approve')->count();
                $stats['total_revised']          = ApprovalHistory::where('actor_user_id', $user->id)
                    ->where('action', 'revise')->count();
                $stats['total_submitted_by_me']  = GeneralJournal::where('requested_by', $user->id)->count();
            }

            $recentData = (clone $visible)->with(['requester', 'assignee'])
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();

            if ($user->isApprover()) {
                $actionQuery = GeneralJournal::with(['requester', 'assignee'])
                    ->where('current_assign_to', $user->id)
                    ->where('status', 'Waiting Approval');
            }
        }

        // Documents Requiring Action: dokumen yang menanti user tersebut lebih dari thresholdDays
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
                    $daysWaiting = $submittedDate ? (int) floor($submittedDate->floatDiffInDays(now())) : 0;

                    return [
                        'id'              => $journal->id,
                        'document_number' => $journal->document_number,
                        'journal_date'    => $journal->journal_date?->format('Y-m-d'),
                        'submitted_at'    => $journal->submitted_at?->format('Y-m-d H:i')
                                             ?? $journal->created_at?->format('Y-m-d H:i'),
                        'reference'       => $journal->reference,
                        'status'          => $journal->status,
                        'requester'       => $journal->requester
                                             ? ['id' => $journal->requester->id, 'name' => $journal->requester->name]
                                             : null,
                        'assignee'        => $journal->assignee
                                             ? ['id' => $journal->assignee->id, 'name' => $journal->assignee->name]
                                             : null,
                        'days_waiting'    => $daysWaiting,
                        'is_overdue'      => true,
                    ];
                })
                ->all();
        }

        return Inertia::render('Dashboard/Index', [
            'role'               => $role,
            'stats'              => $stats,
            'recentData'         => $recentData,
            'actionRequiredDocs' => $actionRequiredDocs,
            'thresholdDays'      => $thresholdDays,
        ]);
    }
}
