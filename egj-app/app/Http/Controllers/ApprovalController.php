<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\Notification;
use App\Models\User;
use App\Services\PdfApprovalStampService;
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

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%");
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

        $rejectedCount = GeneralJournal::whereHas('approvals', function ($q) use ($user) {
            $q->where('approved_by_user_id', $user->id)
                ->where('status', 'Rejected');
        })->count();

        return Inertia::render('Approval/Index', [
            'journals' => $journals,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'requested_by', 'per_page']),
            'users' => $users,
            'stats' => [
                'waiting' => $waitingCount,
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
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

        // User can access if they are the current assignee OR they are in the approval chain OR eligible approver
        $isCurrentAssignee = $journal->current_assign_to == $user->id;
        $isInApprovalChain = $journal->approvals->contains('assigned_user_id', $user->id);
        $isEligibleApprover = ($user->hasRole('Dept/Div Head') && $journal->approvals->where('approval_level', 'superior_of_superior')->where('status', 'Pending')->count() > 0)
            || ($user->hasRole('Section Head') && $journal->approvals->where('approval_level', 'superior')->where('status', 'Pending')->count() > 0);

        if (!$isCurrentAssignee && !$isInApprovalChain && !$isEligibleApprover) {
            abort(403, 'Anda tidak memiliki akses untuk approval dokumen ini.');
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
            abort(403, 'Anda tidak memiliki hak untuk menyetujui dokumen ini.');
        }

        $levelStamped = null;

        DB::transaction(function () use ($journal, $user, &$levelStamped) {
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
                abort(403, 'Tidak ada approval yang pending untuk Anda.');
            }

            // Approve the current level
            $currentApproval->update([
                'status' => 'Approved',
                'assigned_user_id' => $user->id,
                'approved_by_user_id' => $user->id,
                'approved_at' => now(),
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $user->name,
            ]);

            $levelStamped = $currentApproval->approval_level;

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'approve',
                'actor_user_id' => $user->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $user->name,
                'created_at' => now(),
            ]);

            // Check if there are more pending levels
            $nextPending = $journal->approvals()
                ->where('status', 'Pending')
                ->orderByRaw("CASE approval_level WHEN 'accounting' THEN 1 WHEN 'superior' THEN 2 WHEN 'superior_of_superior' THEN 3 END")
                ->first();

            if ($nextPending) {
                // Determine the next approver user (Dept/Div Head)
                $nextUser = User::find($nextPending->assigned_user_id);
                if (!$nextUser && $nextPending->approval_level === 'superior_of_superior') {
                    $nextUser = User::where('role', 'Dept/Div Head')->where('is_active', true)->first();
                    if ($nextUser) {
                        $nextPending->update(['assigned_user_id' => $nextUser->id]);
                    }
                }

                $nextAssigneeId = $nextUser ? $nextUser->id : $nextPending->assigned_user_id;

                // Move to next approver (Update current_assign_to to Dept Head's ULID)
                $journal->update([
                    'current_assign_to' => $nextAssigneeId,
                    'last_updated_at' => now(),
                ]);

                // Create database notification for next approver (Dept Head)
                if ($nextAssigneeId) {
                    $alreadyNotifiedDeptHead = Notification::where('general_journal_id', $journal->id)
                        ->where('user_id', $nextAssigneeId)
                        ->where('type', 'approval_request')
                        ->exists();

                    if (!$alreadyNotifiedDeptHead) {
                        Notification::create([
                            'user_id' => $nextAssigneeId,
                            'general_journal_id' => $journal->id,
                            'type' => 'approval_request',
                            'message' => "Dokumen {$journal->document_number} telah disetujui Section Head dan membutuhkan persetujuan Anda.",
                            'created_at' => now(),
                        ]);
                    }
                }

                // Send email with approve button to Dept/Div Head (Only 1 email to Dept Head)
                if ($nextUser) {
                    try {
                        $approvalToken = $this->createEmailToken($journal, $nextUser->email, 'approval');
                        $previewToken = $this->createEmailToken($journal, $nextUser->email, 'preview');

                        Mail::to($nextUser->email)->send(
                            new DeptHeadApprovalMail($journal, $nextUser, $approvalToken, $previewToken)
                        );
                    } catch (\Throwable $e) {
                        Log::error("Failed sending DeptHeadApprovalMail for journal {$journal->id}: " . $e->getMessage());
                    }
                }
            } else {
                // All levels approved → final approved by Dept Head
                $journal->update([
                    'status' => 'Approved',
                    'current_assign_to' => null,
                    'last_updated_at' => now(),
                ]);

                // Cek sebelum buat notifikasi approved ke requester
                $alreadyNotified = Notification::where('general_journal_id', $journal->id)
                    ->where('user_id', $journal->requested_by)
                    ->where('type', 'approved')
                    ->exists();

                if (!$alreadyNotified) {
                    // Create database notification for requester
                    Notification::create([
                        'user_id' => $journal->requested_by,
                        'general_journal_id' => $journal->id,
                        'type' => 'approved',
                        'message' => "Dokumen {$journal->document_number} telah disetujui sepenuhnya.",
                        'created_at' => now(),
                    ]);

                    // Send final approval email ONLY to requester
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
            }
        });

        return redirect()->route('approval.index')
            ->with('success', 'General Journal berhasil di-approve.');
    }

    /**
     * Reject a General Journal.
     */
    public function reject(Request $request, string $id)
    {
        $request->validate([
            'notes' => ['required', 'string', 'min:5'],
        ]);

        $journal = GeneralJournal::with('approvals')->findOrFail($id);
        $user = Auth::user();

        $isEligibleApprover = ($journal->current_assign_to == $user->id)
            || ($user->hasRole('Dept/Div Head') && $journal->approvals()->where('approval_level', 'superior_of_superior')->where('status', 'Pending')->exists())
            || ($user->hasRole('Section Head') && $journal->approvals()->where('approval_level', 'superior')->where('status', 'Pending')->exists());

        if (!$isEligibleApprover || !$journal->isWaitingApproval()) {
            abort(403, 'Anda tidak memiliki hak untuk menolak dokumen ini.');
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
                    'status' => 'Rejected',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'approved_at' => now(),
                    'notes' => $request->notes,
                ]);
            }

            // Update journal status
            $journal->update([
                'status' => 'Rejected',
                'current_assign_to' => $journal->requested_by, // Assign back to requester
                'last_updated_at' => now(),
            ]);

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'reject',
                'actor_user_id' => $user->id,
                'target_level' => $currentApproval ? $currentApproval->approval_level : 'superior',
                'notes' => $request->notes,
                'created_at' => now(),
            ]);

            // Create database notification for requester
            Notification::create([
                'user_id' => $journal->requested_by,
                'general_journal_id' => $journal->id,
                'type' => 'rejected',
                'message' => "Dokumen {$journal->document_number} telah ditolak: {$request->notes}",
                'created_at' => now(),
            ]);

            // Send rejection email to requester
            $requester = User::find($journal->requested_by);
            if ($requester) {
                try {
                    Mail::to($requester->email)->send(
                        new ApprovalResultMail($journal, $requester, 'rejected', $request->notes)
                    );
                } catch (\Throwable $e) {
                    Log::error("Failed sending ApprovalResultMail (rejected) for journal {$journal->id}: " . $e->getMessage());
                }
            }
        });

        return redirect()->route('approval.index')
            ->with('success', 'General Journal berhasil di-reject.');
    }

    /**
     * Create an email token with 5 business days expiry.
     */
    private function createEmailToken(GeneralJournal $journal, string $email, string $purpose): EmailToken
    {
        $expiresAt = Carbon::now();
        $businessDays = 0;
        while ($businessDays < 5) {
            $expiresAt->addDay();
            if (!$expiresAt->isWeekend()) {
                $businessDays++;
            }
        }

        return EmailToken::create([
            'general_journal_id' => $journal->id,
            'token' => Str::uuid()->toString(),
            'email' => $email,
            'purpose' => $purpose,
            'expires_at' => $expiresAt,
            'created_at' => now(),
        ]);
    }
}
