<?php

namespace App\Http\Controllers;

use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\ApprovalHistory;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use App\Mail\ApprovalResultMail;

class EmailApprovalController extends Controller
{
    /**
     * Show approval confirmation page (GET).
     */
    public function show(string $token)
    {
        $emailToken = EmailToken::where('token', $token)
            ->where('purpose', 'approval')
            ->first();

        if (!$emailToken) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Invalid token.',
            ]);
        }

        if ($emailToken->isExpired()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'This approval link has expired. Please use the link in your latest email reminder or log in to the JAGO portal.',
            ]);
        }

        if ($emailToken->isUsed()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'This token has already been used.',
            ]);
        }

        $journal = GeneralJournal::with([
            'requester',
            'activeFiles',
            'approvals.assignedUser',
        ])->findOrFail($emailToken->general_journal_id);

        if (!$journal->isWaitingApproval()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'This document is no longer pending approval.',
            ]);
        }

        return Inertia::render('EmailApproval/Confirm', [
            'journal' => $journal,
            'token' => $token,
        ]);
    }

    /**
     * Process approval via email token (POST).
     */
    public function approve(Request $request, string $token)
    {
        $emailToken = EmailToken::where('token', $token)
            ->where('purpose', 'approval')
            ->first();

        if (!$emailToken || $emailToken->isExpired() || $emailToken->isUsed()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Invalid or expired token.',
            ]);
        }

        $journal = GeneralJournal::with('approvals')->findOrFail($emailToken->general_journal_id);

        if (!$journal->isWaitingApproval()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'This document is no longer pending approval.',
            ]);
        }

        $approver = User::where('email', $emailToken->email)
            ->where('role', 'Dept/Div Head')
            ->first();

        if (!$approver) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'You are not authorized to approve this document.',
            ]);
        }

        DB::transaction(function () use ($journal, $approver, $emailToken) {
            $currentApproval = $journal->approvals()
                ->where('approval_level', 'superior_of_superior')
                ->where('status', 'Pending')
                ->first();

            if (!$currentApproval) {
                abort(403);
            }

            $currentApproval->update([
                'status' => 'Approved',
                'assigned_user_id' => $approver->id,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $approver->name,
            ]);

            EmailToken::where('general_journal_id', $journal->id)
                ->where('email', $emailToken->email)
                ->whereNull('used_at')
                ->update(['used_at' => now()]);

            $journal->update([
                'status' => 'Approved',
                'current_assign_to' => null,
                'last_updated_at' => now(),
            ]);

            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'approve',
                'actor_user_id' => $approver->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $approver->name,
                'created_at' => now(),
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
                    Log::error("Failed sending ApprovalResultMail in email approval for journal {$journal->id}: " . $e->getMessage());
                }
            }
        });

        return Inertia::render('EmailApproval/Success', [
            'journal' => $journal->fresh(['requester']),
            'action' => 'approved',
        ]);
    }

    /**
     * Show revision form via email token (GET).
     */
    public function showRevise(string $token)
    {
        $emailToken = EmailToken::where('token', $token)
            ->whereIn('purpose', ['rejection', 'revise'])
            ->first();

        if (!$emailToken) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Invalid token.',
            ]);
        }

        if ($emailToken->isExpired()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Token has expired. Please request a new notification.',
            ]);
        }

        if ($emailToken->isUsed()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'This token has already been used.',
            ]);
        }

        $journal = GeneralJournal::with([
            'requester',
            'activeFiles',
            'approvals.assignedUser',
        ])->findOrFail($emailToken->general_journal_id);

        if (!$journal->isWaitingApproval()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'This document is no longer pending approval/revision.',
            ]);
        }

        return Inertia::render('EmailApproval/Reject', [
            'journal' => $journal,
            'token' => $token,
        ]);
    }

    /**
     * Process revision request via email token (POST).
     */
    public function revise(Request $request, string $token)
    {
        $request->validate([
            'notes' => ['required', 'string', 'min:5', 'max:2000'],
        ], [
            'notes.required' => 'Revision notes are required.',
            'notes.min' => 'Revision notes must be at least 5 characters.',
        ]);

        $emailToken = EmailToken::where('token', $token)
            ->whereIn('purpose', ['rejection', 'revise'])
            ->first();

        if (!$emailToken || $emailToken->isExpired() || $emailToken->isUsed()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Invalid or expired token.',
            ]);
        }

        $journal = GeneralJournal::with('approvals')->findOrFail($emailToken->general_journal_id);

        if (!$journal->isWaitingApproval()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'This document is no longer pending approval.',
            ]);
        }

        $approver = User::where('email', $emailToken->email)
            ->where('role', 'Dept/Div Head')
            ->first();

        if (!$approver) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'You are not authorized to request revision for this document.',
            ]);
        }

        DB::transaction(function () use ($journal, $approver, $emailToken, $request) {
            $currentApproval = $journal->approvals()
                ->where('approval_level', 'superior_of_superior')
                ->where('status', 'Pending')
                ->first();

            if (!$currentApproval) {
                abort(403);
            }

            $currentApproval->update([
                'status' => 'Revised',
                'assigned_user_id' => $approver->id,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'notes' => $request->notes,
            ]);

            EmailToken::where('general_journal_id', $journal->id)
                ->where('email', $emailToken->email)
                ->whereNull('used_at')
                ->update(['used_at' => now()]);

            $journal->update([
                'status' => 'Revised',
                'current_assign_to' => $journal->requested_by,
                'last_updated_at' => now(),
            ]);

            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'revise',
                'actor_user_id' => $approver->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => $request->notes,
                'created_at' => now(),
            ]);

            Notification::create([
                'user_id' => $journal->requested_by,
                'general_journal_id' => $journal->id,
                'type' => 'revised',
                'message' => "Document {$journal->document_number} requires revision from Dept/Div Head: {$request->notes}",
                'created_at' => now(),
            ]);

            $requester = User::find($journal->requested_by);
            if ($requester) {
                try {
                    Mail::to($requester->email)->send(
                        new ApprovalResultMail($journal, $requester, 'revised', $request->notes)
                    );
                } catch (\Throwable $e) {
                    Log::error("Failed sending ApprovalResultMail in email revise for journal {$journal->id}: " . $e->getMessage());
                }
            }
        });

        return Inertia::render('EmailApproval/Success', [
            'journal' => $journal->fresh(['requester']),
            'action' => 'revised',
            'notes' => $request->notes,
        ]);
    }

    /**
     * Backward-compatibility aliases
     */
    public function showReject(string $token)
    {
        return $this->showRevise($token);
    }

    public function reject(Request $request, string $token)
    {
        return $this->revise($request, $token);
    }
}
