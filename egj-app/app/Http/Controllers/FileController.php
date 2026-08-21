<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournalFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * Download a file.
     */
    public function download(string $id)
    {
        $file = GeneralJournalFile::with('generalJournal.approvals')->findOrFail($id);

        $this->authorizeFileAccess($file);

        if (!Storage::exists($file->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::download($file->file_path, $file->file_name);
    }

    /**
     * Preview a file (serve inline).
     */
    public function preview(string $id)
    {
        $file = GeneralJournalFile::with('generalJournal.approvals')->findOrFail($id);

        $this->authorizeFileAccess($file);

        if (!Storage::exists($file->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return response(Storage::get($file->file_path))
            ->header('Content-Type', $file->mime_type)
            ->header('Content-Disposition', 'inline; filename="' . $file->file_name . '"');
    }
    /**
     * Authorize access to the file based on business rules.
     */
    private function authorizeFileAccess(GeneralJournalFile $file)
    {
        $user = auth()->user();
        $journal = $file->generalJournal;

        // Requester can always access
        if ($journal->requested_by === $user->id) {
            return;
        }

        // Current assignee or approver in the chain can access
        $isCurrentAssignee = $journal->current_assign_to === $user->id;
        $isInApprovalChain = $journal->approvals->contains('assigned_user_id', $user->id);

        if ($isCurrentAssignee || $isInApprovalChain) {
            return;
        }

        abort(403, 'Anda tidak memiliki akses ke file ini.');
    }
}
