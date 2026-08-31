<?php

namespace App\Services;

use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;

class PdfStampRenderService
{
    /**
     * Render the General Journal PDF on-the-fly with approval stamps.
     *
     * @param GeneralJournal $journal
     * @param bool $forDownload
     * @return string Binary PDF string
     */
    public function render(GeneralJournal $journal, bool $forDownload = false): string
    {
        // 1. Ambil file original (is_active=true, category='general_journal') dari DB
        $file = GeneralJournalFile::getActive($journal->id, 'general_journal');

        if (!$file) {
            $file = $journal->files()
                ->where('category', 'general_journal')
                ->where('is_active', true)
                ->latest('version')
                ->first();
        }

        if (!$file) {
            abort(404, 'File General Journal tidak ditemukan.');
        }

        $sourceFilePath = Storage::path($file->file_path);

        if (!file_exists($sourceFilePath)) {
            abort(404, 'File fisik General Journal tidak ditemukan.');
        }

        // 2. Ambil data approval dari general_journal_approvals untuk journal ini
        $approvals = $journal->approvals()->with(['approvedByUser', 'assignedUser'])->get();

        // Koordinat stamp dinamis berdasarkan deteksi / fallback jumlah halaman
        $stampCoords = $this->getFallbackCoords($sourceFilePath);

        // 3. Inisialisasi mPDF dengan format landscape A4 dan margin 0
        $mpdf = new Mpdf([
            'mode'          => 'utf-8',
            'format'        => 'A4-L',
            'unit'          => 'mm',
            'margin_top'    => 0,
            'margin_bottom' => 0,
            'margin_left'   => 0,
            'margin_right'  => 0,
        ]);

        // 4. Loop semua halaman PDF original menggunakan SetSourceFile + ImportPage + UseTemplate
        $pageCount = $mpdf->SetSourceFile($sourceFilePath);

        for ($i = 1; $i <= $pageCount; $i++) {
            $tplId   = $mpdf->ImportPage($i);
            $tplSize = $mpdf->GetTemplateSize($tplId);

            // Selalu paksa landscape — ambil sisi terpanjang sebagai width
            $pageW = max($tplSize['width'], $tplSize['height']);
            $pageH = min($tplSize['width'], $tplSize['height']);

            if ($i > 1) {
                $mpdf->AddPage('L', '', '', '', '', 0, 0, 0, 0, 0, 0);
            }

            $mpdf->UseTemplate($tplId, 0, 0, $pageW, $pageH);

            // Overlay stamp di setiap halaman untuk semua level yang berstatus Approved
            foreach ($approvals as $approval) {
                if ($approval->status === 'Approved' && isset($stampCoords[$approval->approval_level])) {
                    $coords = $stampCoords[$approval->approval_level];

                    $approvedDate = $approval->approved_at 
                        ? $approval->approved_at->format('Y-m-d') 
                        : now()->format('Y-m-d');

                    $approverName = $approval->approvedByUser?->name 
                        ?? $approval->approvedBy?->name 
                        ?? $approval->assignedUser?->name 
                        ?? '';

                    // Blok atas: Approved + tanggal
                    $htmlTop = '<div style="font-size:8pt;font-family:Arial,sans-serif;text-align:center;width:100%;">'
                        . '<b>Approved</b><br>' . $approvedDate
                        . '</div>';
                    $mpdf->WriteFixedPosHTML($htmlTop, $coords['x'], $coords['topY'], $coords['w'], $coords['topH'], 'auto');

                    // Blok bawah: nama user
                    $htmlName = '<div style="font-size:7pt;font-family:Arial,sans-serif;text-align:center;width:100%;">'
                        . htmlspecialchars($approverName)
                        . '</div>';
                    $mpdf->WriteFixedPosHTML($htmlName, $coords['x'], $coords['nameY'], $coords['w'], $coords['nameH'], 'auto');
                }
            }
        }

        // 5. Return string PDF binary
        return $mpdf->Output('', Destination::STRING_RETURN);
    }

    /**
     * Detect or get fallback coordinates based on PDF page count.
     *
     * @param string $pdfPath
     * @return array
     */
    public function getFallbackCoords(string $pdfPath): array
    {
        $mpdfCheck = new Mpdf(['mode' => 'utf-8', 'format' => 'A4-L']);
        $pageCount = $mpdfCheck->SetSourceFile($pdfPath);
        unset($mpdfCheck);

        if ($pageCount === 1) {
            // PDF 1 halaman — kolom lebih lebar
            return [
                'accounting'           => ['x' => 10.62, 'topY' => 176.3, 'w' => 25.82, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
                'superior'             => ['x' => 36.44, 'topY' => 176.3, 'w' => 25.86, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
                'superior_of_superior' => ['x' => 62.30, 'topY' => 176.3, 'w' => 28.29, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
            ];
        } else {
            // PDF multi halaman — kolom lebih sempit
            return [
                'accounting'           => ['x' => 10.55, 'topY' => 176.3, 'w' => 23.21, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
                'superior'             => ['x' => 33.76, 'topY' => 176.3, 'w' => 25.89, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
                'superior_of_superior' => ['x' => 59.65, 'topY' => 176.3, 'w' => 29.35, 'topH' => 7, 'nameY' => 187.57, 'nameH' => 3.77],
            ];
        }
    }
}
