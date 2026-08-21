<?php

namespace App\Http\Controllers;

use App\Models\EmailToken;
use App\Models\GeneralJournal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PreviewController extends Controller
{
    /**
     * Preview a document via token (no login required).
     */
    public function show(string $token)
    {
        $emailToken = EmailToken::where('token', $token)
            ->where('purpose', 'preview')
            ->first();

        if (!$emailToken) {
            return Inertia::render('Preview/Invalid', [
                'message' => 'Token tidak valid.',
            ]);
        }

        if ($emailToken->isExpired()) {
            return Inertia::render('Preview/Invalid', [
                'message' => 'Token sudah kedaluwarsa.',
            ]);
        }

        $journal = GeneralJournal::with([
            'requester',
            'activeFiles',
            'approvals.assignedUser',
        ])->findOrFail($emailToken->general_journal_id);

        return Inertia::render('Preview/Show', [
            'journal' => $journal,
            'token' => $token,
        ]);
    }
}
