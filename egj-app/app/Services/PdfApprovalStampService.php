<?php

namespace App\Services;

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;

class PdfApprovalStampService
{
    /**
     * Stamp the approval on the PDF file of the General Journal.
     *
     * @param GeneralJournal $journal
     * @param string $level 'accounting', 'superior', or 'superior_of_superior'
     * @return void
     */
    public function stampApproval(GeneralJournal $journal, string $level)
    {
        // Get the active general journal file
        $file = $journal->files()
            ->where('category', 'general_journal')
            ->where('is_active', true)
            ->first();

        if (!$file) {
            return; // No file to stamp
        }

        // Get file path from local default disk
        $filePath = Storage::path($file->file_path);

        if (!file_exists($filePath)) {
            return; // File not found physically
        }

        // Determine user and date based on level
        $user = null;
        $date = now()->format('Y-m-d');

        if ($level === 'accounting') {
            $user = User::find($journal->requested_by);
        } else {
            // Find the approval record for this level that is Approved
            $approval = $journal->approvals()
                ->where('approval_level', $level)
                ->where('status', 'Approved')
                ->latest()
                ->first();

            if ($approval && $approval->approved_by_user_id) {
                $user = User::find($approval->approved_by_user_id);
                $date = $approval->approved_at ? $approval->approved_at->format('Y-m-d') : $date;
            } else {
                // If the requester is a Section Head, their superior approval is auto-approved by themselves
                $requester = User::find($journal->requested_by);
                if ($level === 'superior' && $requester && $requester->hasRole('Section Head')) {
                    $user = $requester;
                    // For auto-approve, the submission date can be used
                    $date = $journal->submitted_at ? $journal->submitted_at->format('Y-m-d') : $date;
                } else {
                    return; // Cannot determine approver
                }
            }
        }

        if (!$user) {
            return;
        }

        $userName = $user->name;

        // Absolute coordinates in mm (pre-converted from pt)
        // Top block = "Approved" + date, Bottom block = user name (just above level label)
        $stampCoords = [
            'accounting'           => ['x' => 10.62, 'topY' => 176.3, 'w' => 25.82, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
            'superior'             => ['x' => 36.44, 'topY' => 176.3, 'w' => 25.86, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
            'superior_of_superior' => ['x' => 62.30, 'topY' => 176.3, 'w' => 28.29, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
        ];

        if (!isset($stampCoords[$level])) {
            return;
        }

        $sc = $stampCoords[$level];

        try {
            \Log::info("stampApproval() called for GJ ID {$journal->id}, Level {$level}, User {$userName}, Date {$date}");

            // Initialize mPDF with mm unit and A4 landscape format
            $mpdf = new \Mpdf\Mpdf([
                'unit' => 'mm', 
                'format' => [297, 210] // A4 landscape in mm
            ]);

            $pageCount = $mpdf->SetSourceFile($filePath);

            for ($i = 1; $i <= $pageCount; $i++) {
                $tplId = $mpdf->ImportPage($i);
                $mpdf->UseTemplate($tplId);

                // Top block: "Approved" + date — centered vertically and horizontally
                $htmlTop = '<div style="font-size:22pt; font-family:Arial, sans-serif; text-align:center; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">'
                    . '<b>Approved</b><br>' . $date
                    . '</div>';
                $mpdf->WriteFixedPosHTML($htmlTop, $sc['x'], $sc['topY'], $sc['w'], $sc['topH'], 'auto');

                // Bottom block: user name — positioned just above the level label
                $htmlBottom = '<div style="font-size:7pt; font-family:Arial, sans-serif; text-align:center; width:100%;">'
                    . htmlspecialchars($userName)
                    . '</div>';
                $mpdf->WriteFixedPosHTML($htmlBottom, $sc['x'], $sc['nameY'], $sc['w'], $sc['nameH'], 'auto');

                if ($i < $pageCount) {
                    $mpdf->AddPage();
                }
            }

            // Save the modified PDF, overwriting the original file
            $mpdf->Output($filePath, \Mpdf\Output\Destination::FILE);

            // Update file size in DB
            clearstatcache();
            $newSize = filesize($filePath);
            $file->update(['file_size' => $newSize]);

            \Log::info("Successfully stamped PDF for GJ ID {$journal->id}, Level {$level}");

        } catch (\Exception $e) {
            // Log the error but do not throw to prevent breaking the flow
            \Log::error("Failed to stamp PDF for GJ ID {$journal->id}, Level {$level}: " . $e->getMessage());
        }
    }

    /**
     * Convert points (pt) to millimeters (mm)
     */
    private function ptToMm($pt)
    {
        return $pt * (25.4 / 72);
    }
}
