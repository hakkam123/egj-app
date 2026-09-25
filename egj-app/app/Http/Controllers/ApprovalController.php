<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Mail\DeptHeadApprovalMail;
use App\Mail\ApprovalResultMail;

class ApprovalController extends Controller
{
    /**
     * Display approval list page.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = GeneralJournal::with(['requester', 'assignee'])
            ->where(function ($q) use ($user) {
                $q->where('current_assign_to', $user->id);
                if ($user->hasRole('Dept/Div Head')) {
                    $q->orWhere(function ($sub) {
                        $sub->where('status', 'Waiting Approval')
                            ->whereHas('approvals', function ($app) {
                                $app->where('approval_level', 'superior_of_superior')
                                    ->where('status', 'Pending');
                            });
                    });
                } elseif ($user->hasRole('Section Head')) {
                    $q->orWhere(function ($sub) {
                        $sub->where('status', 'Waiting Approval')
                            ->whereHas('approvals', function ($app) {
                                $app->where('approval_level', 'superior')
                                    ->where('status', 'Pending');
                            });
                    });
                }
            });

        if ($request->filled('doc_number')) {
            $query->where('document_number', 'like', "%{$request->doc_number}%");
        }

        if ($request->filled('reference')) {
            $query->where('reference', 'like', "%{$request->reference}%");
        }

        if ($request->filled('date')) {
            $query->whereDate('journal_date', $request->date);
        }

        if ($request->filled('requester')) {
            $req = $request->requester;
            $query->where(function ($q) use ($req) {
                $q->where('requested_by', $req)
                  ->orWhereHas('requester', function ($u) use ($req) {
                      $u->where('name', 'like', "%{$req}%");
                  });
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhereHas('requester', fn($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

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

        $perPage = $request->input('per_page', 10);
        $journals = $query->latest('submitted_at')->paginate($perPage)->withQueryString();

        $users = User::where('is_active', true)->get(['id', 'name']);

        // Stats counts
        $waitingCount = GeneralJournal::where(function ($q) use ($user) {
            $q->where('current_assign_to', $user->id);
            if ($user->hasRole('Dept/Div Head')) {
                $q->orWhere(function ($sub) {
                    $sub->where('status', 'Waiting Approval')
                        ->whereHas('approvals', function ($app) {
                            $app->where('approval_level', 'superior_of_superior')
                                ->where('status', 'Pending');
                        });
                });
            } elseif ($user->hasRole('Section Head')) {
                $q->orWhere(function ($sub) {
                    $sub->where('status', 'Waiting Approval')
                        ->whereHas('approvals', function ($app) {
                            $app->where('approval_level', 'superior')
                                ->where('status', 'Pending');
                        });
                });
            }
        })->where('status', 'Waiting Approval')->count();

        $approvedCount = GeneralJournal::whereHas('approvals', function ($q) use ($user) {
            $q->where('approved_by_user_id', $user->id)
                ->where('status', 'Approved');
        })->count();

        $revisedCount = GeneralJournal::whereHas('approvals', function ($q) use ($user) {
            $q->where('approved_by_user_id', $user->id)
                ->where('status', 'Revised');
        })->count();

        return Inertia::render('Approval/Index', [
            'journals' => $journals,
            'filters' => $request->only([
                'doc_number',
                'reference',
                'date',
                'requester',
                'status',
                'search',
                'date_from',
                'date_to',
                'requested_by',
                'per_page'
            ]),
            'users' => $users,
            'stats' => [
                'waiting' => $waitingCount,
                'approved' => $approvedCount,
                'revised' => $revisedCount,
            ],
        ]);
    }

    /**
     * Show detail for approval review.
     */
    public function show(string $id)
    {
        $journal = GeneralJournal::with([
            'requester',
            'assignee',
            'activeFiles',
            'approvals.assignedUser',
            'approvals.approvedByUser',
            'histories.actor',
        ])->findOrFail($id);

        $user = Auth::user();

        $isCurrentAssignee = $journal->current_assign_to == $user->id;
        $isInApprovalChain = $journal->approvals->contains('assigned_user_id', $user->id);
        $isEligibleApprover = ($user->hasRole('Dept/Div Head') && $journal->approvals->where('approval_level', 'superior_of_superior')->where('status', 'Pending')->count() > 0)
            || ($user->hasRole('Section Head') && $journal->approvals->where('approval_level', 'superior')->where('status', 'Pending')->count() > 0);

        if (!$isCurrentAssignee && !$isInApprovalChain && !$isEligibleApprover) {
            abort(403, 'You do not have permission to review this document.');
        }

        return Inertia::render('Approval/Show', [
            'journal' => $journal,
        ]);
    }

    /**
     * Approve a General Journal.
     */
    public function approve(Request $request, string $id)
    {
        $journal = GeneralJournal::with('approvals')->findOrFail($id);
        $user = Auth::user();

        $isEligibleApprover = ($journal->current_assign_to == $user->id)
            || ($user->hasRole('Dept/Div Head') && $journal->approvals()->where('approval_level', 'superior_of_superior')->where('status', 'Pending')->exists())
            || ($user->hasRole('Section Head') && $journal->approvals()->where('approval_level', 'superior')->where('status', 'Pending')->exists());

        if (!$isEligibleApprover || !$journal->isWaitingApproval()) {
            abort(403, 'You do not have permission to approve this document.');
        }

        DB::transaction(function () use ($journal, $user) {
            // Find the current pending approval for this user/role
            $currentApproval = $journal->approvals()
                ->where('status', 'Pending')
                ->where(function ($q) use ($user) {
                    $q->where('assigned_user_id', $user->id);
                    if ($user->hasRole('Dept/Div Head')) {
                        $q->orWhere('approval_level', 'superior_of_superior');
                    } elseif ($user->hasRole('Section Head')) {
                        $q->orWhere('approval_level', 'superior');
                    }
                })
                ->first();

            if (!$currentApproval) {
                abort(403, 'No pending approval task found for your account.');
            }

            // Approve current level
            $currentApproval->update([
                'status' => 'Approved',
                'assigned_user_id' => $user->id,
                'approved_by_user_id' => $user->id,
                'approved_at' => now(),
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $user->name,
            ]);

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'approve',
                'actor_user_id' => $user->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $user->name,
                'created_at' => now(),
            ]);

            // Check if next pending approval exists
            $nextPending = $journal->approvals()
                ->where('status', 'Pending')
                ->orderByRaw("CASE approval_level WHEN 'accounting' THEN 1 WHEN 'superior' THEN 2 WHEN 'superior_of_superior' THEN 3 END")
                ->first();

            if ($nextPending) {
                $nextUser = User::find($nextPending->assigned_user_id);
                if (!$nextUser && $nextPending->approval_level === 'superior_of_superior') {
                    $nextUser = User::where('role', 'Dept/Div Head')->where('is_active', true)->first();
                    if ($nextUser) {
                        $nextPending->update(['assigned_user_id' => $nextUser->id]);
                    }
                }

                $nextAssigneeId = $nextUser ? $nextUser->id : $nextPending->assigned_user_id;

                $journal->update([
                    'current_assign_to' => $nextAssigneeId,
                    'last_updated_at' => now(),
                ]);

                if ($nextAssigneeId) {
                    Notification::create([
                        'user_id' => $nextAssigneeId,
                        'general_journal_id' => $journal->id,
                        'type' => 'approval_request',
                        'message' => "Document {$journal->document_number} has been approved by Section Head and is waiting for your review.",
                        'created_at' => now(),
                    ]);
                }

                if ($nextUser) {
                    try {
                        $approvalToken = $this->createEmailToken($journal, $nextUser->email, 'approval');
                        $reviseToken = $this->createEmailToken($journal, $nextUser->email, 'rejection');

                        Mail::to($nextUser->email)->send(
                            new DeptHeadApprovalMail(
                                $journal,
                                $nextUser,
                                url('/approve-email/' . $approvalToken->token),
                                url('/revise-email/' . $reviseToken->token)
                            )
                        );
                    } catch (\Throwable $e) {
                        Log::error("Failed sending DeptHeadApprovalMail for journal {$journal->id}: " . $e->getMessage());
                    }
                }
            } else {
                // Final approved by Dept Head
                $journal->update([
                    'status' => 'Approved',
                    'current_assign_to' => null,
                    'last_updated_at' => now(),
                ]);

                Notification::create([
                    'user_id' => $journal->requested_by,
                    'general_journal_id' => $journal->id,
                    'type' => 'approved',
                    'message' => "Document {$journal->document_number} has been fully approved.",
                    'created_at' => now(),
                ]);

                $requester = User::find($journal->requested_by);
                if ($requester) {
                    try {
                        Mail::to($requester->email)->send(
                            new ApprovalResultMail($journal, $requester, 'approved')
                        );
                    } catch (\Throwable $e) {
                        Log::error("Failed sending ApprovalResultMail (approved) for journal {$journal->id}: " . $e->getMessage());
                    }
                }
            }
        });

        return redirect()->route('approval.index')
            ->with('success', 'General Journal approved successfully.');
    }

    /**
     * Request revision for a General Journal (replaces Reject for approvers).
     */
    public function revise(Request $request, string $id)
    {
        $request->validate([
            'notes' => ['required', 'string', 'min:5', 'max:2000'],
        ], [
            'notes.required' => 'Revision notes are required.',
            'notes.min' => 'Revision notes must be at least 5 characters.',
        ]);

        $journal = GeneralJournal::with('approvals')->findOrFail($id);
        $user = Auth::user();

        $isEligibleApprover = ($journal->current_assign_to == $user->id)
            || ($user->hasRole('Dept/Div Head') && $journal->approvals()->where('approval_level', 'superior_of_superior')->where('status', 'Pending')->exists())
            || ($user->hasRole('Section Head') && $journal->approvals()->where('approval_level', 'superior')->where('status', 'Pending')->exists());

        if (!$isEligibleApprover || !$journal->isWaitingApproval()) {
            abort(403, 'You do not have permission to request revision for this document.');
        }

        DB::transaction(function () use ($request, $journal, $user) {
            $currentApproval = $journal->approvals()
                ->where('status', 'Pending')
                ->where(function ($q) use ($user) {
                    $q->where('assigned_user_id', $user->id);
                    if ($user->hasRole('Dept/Div Head')) {
                        $q->orWhere('approval_level', 'superior_of_superior');
                    } elseif ($user->hasRole('Section Head')) {
                        $q->orWhere('approval_level', 'superior');
                    }
                })
                ->first();

            if ($currentApproval) {
                $currentApproval->update([
                    'status' => 'Revised',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'approved_at' => now(),
                    'notes' => $request->notes,
                ]);
            }

            // Update journal status to Revised and assign back to requester
            $journal->update([
                'status' => 'Revised',
                'current_assign_to' => $journal->requested_by,
                'last_updated_at' => now(),
            ]);

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'revise',
                'actor_user_id' => $user->id,
                'target_level' => $currentApproval ? $currentApproval->approval_level : 'superior',
                'notes' => $request->notes,
                'created_at' => now(),
            ]);

            // Create notification for requester
            Notification::create([
                'user_id' => $journal->requested_by,
                'general_journal_id' => $journal->id,
                'type' => 'revised',
                'message' => "Document {$journal->document_number} requires revision: {$request->notes}",
                'created_at' => now(),
            ]);

            // Send revision notice email to requester
            $requester = User::find($journal->requested_by);
            if ($requester) {
                try {
                    Mail::to($requester->email)->send(
                        new ApprovalResultMail($journal, $requester, 'revised', $request->notes)
                    );
                } catch (\Throwable $e) {
                    Log::error("Failed sending ApprovalResultMail (revised) for journal {$journal->id}: " . $e->getMessage());
                }
            }
        });

        return redirect()->route('approval.index')
            ->with('success', 'Revision requested successfully.');
    }

    /**
     * Backward-compatibility wrapper for reject route.
     */
    public function reject(Request $request, string $id)
    {
        return $this->revise($request, $id);
    }

    /**
     * Create an email token with 3 days (72 hours) expiry.
     */
    private function createEmailToken(GeneralJournal $journal, string $email, string $purpose): EmailToken
    {
        return EmailToken::create([
            'general_journal_id' => $journal->id,
            'token' => Str::uuid()->toString(),
            'email' => $email,
            'purpose' => $purpose,
            'expires_at' => Carbon::now()->addDays(3),
            'created_at' => now(),
        ]);
    }
}
