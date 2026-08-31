<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournalFile;
use App\Services\PdfStampRenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * Download a file. For General Journal, dynamically render stamps.
     */
    public function download(string $id)
    {
        $file = GeneralJournalFile::with('generalJournal.approvals')->findOrFail($id);

        $this->authorizeFileAccess($file);

        if ($file->isGeneralJournal()) {
            $journal = $file->generalJournal;
            $journal->load(['approvals.approvedByUser', 'approvals.assignedUser']);

            $pdfBinary = app(PdfStampRenderService::class)->render($journal, true);

            return response($pdfBinary, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="GJ_' . $journal->document_number . '_stamped.pdf"',
            ]);
        }

        if (!Storage::exists($file->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::download($file->file_path, $file->file_name);
    }

    /**
     * Preview a file (serve inline). For General Journal, dynamically render stamps.
     */
    public function preview(string $id)
    {
        $file = GeneralJournalFile::with('generalJournal.approvals')->findOrFail($id);

        $this->authorizeFileAccess($file);

        if ($file->isGeneralJournal()) {
            $journal = $file->generalJournal;
            $journal->load(['approvals.approvedByUser', 'approvals.assignedUser']);

            $pdfBinary = app(PdfStampRenderService::class)->render($journal, false);

            return response($pdfBinary, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $file->file_name . '"',
            ]);
        }

        if (!Storage::exists($file->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return response(Storage::get($file->file_path))
            ->header('Content-Type', $file->mime_type)
            ->header('Content-Disposition', 'inline; filename="' . $file->file_name . '"');
    }

    /**
     * Verify original file integrity via SHA-256 hash.
     */
    public function verify(string $id)
    {
        $file = GeneralJournalFile::with('generalJournal.approvals')->findOrFail($id);

        $this->authorizeFileAccess($file);

        $verified = $file->verifyIntegrity();

        return response()->json([
            'verified' => $verified,
            'file_name' => $file->file_name,
            'file_hash' => $file->file_hash,
            'checked_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Authorize access to the file based on business rules.
     */
    private function authorizeFileAccess(GeneralJournalFile $file)
    {
        $user = auth()->user();
        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        // Admin can always access
        if ($user->hasRole('Admin')) {
            return;
        }

        $journal = $file->generalJournal;
        if (!$journal) {
            abort(404, 'Dokumen tidak ditemukan.');
        }

        // Requester can always access
        if ($journal->requested_by === $user->id) {
            return;
        }

        // Current assignee or approver in the chain can access
        $isCurrentAssignee = $journal->current_assign_to === $user->id;
        $isInApprovalChain = $journal->approvals->contains('assigned_user_id', $user->id);
        $isEligibleApprover = ($user->hasRole('Dept/Div Head') && $journal->approvals->where('approval_level', 'superior_of_superior')->count() > 0)
            || ($user->hasRole('Section Head') && $journal->approvals->where('approval_level', 'superior')->count() > 0);

        if ($isCurrentAssignee || $isInApprovalChain || $isEligibleApprover) {
            return;
        }

        abort(403, 'Anda tidak memiliki akses ke file ini.');
    }
}
