<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Persetujuan General Journal — JAGO</title>
    <!-- Google Fonts: Plus Jakarta Sans & Poppins -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');
        * {
            font-family: 'Plus Jakarta Sans', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
        body, table, td, p, a, h1, h2, h3, span {
            font-family: 'Plus Jakarta Sans', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Plus Jakarta Sans','Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">

    <!-- Main Outer Container -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 16px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
        <tr>
            <td align="center">
                
                <!-- Main White Card -->
                <table width="580" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;background-color:#ffffff;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e2e8f0;overflow:hidden;text-align:left;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                    
                    @if(isset($reminderNumber) && $reminderNumber > 0)
                    <!-- Reminder Alert Header -->
                    <tr>
                        <td style="background-color:#fffbeb;border-bottom:1px solid #fef3c7;padding:12px 32px;text-align:center;">
                            <span style="color:#b45309;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                ⏰ PENGINGAT APPROVAL #{{ $reminderNumber }} (Menunggu {{ $reminderNumber === 1 ? '3' : '5' }} Hari)
                            </span>
                        </td>
                    </tr>
                    @endif

                    <!-- Card Body -->
                    <tr>
                        <td style="padding:40px 38px 38px 38px;">
                            
                            <!-- Header Logo JAGO -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td align="center">
                                        <img src="{{ isset($message) ? $message->embed(public_path('images/JAGO-logo.png')) : asset('images/JAGO-logo.png') }}" alt="JAGO" width="160" style="width:160px;max-width:100%;height:auto;border:0;display:block;margin:0 auto;" />
                                    </td>
                                </tr>
                            </table>

                            <!-- Main Title -->
                            <h1 style="margin:0 0 18px 0;font-size:24px;font-weight:800;color:#1a2540;letter-spacing:-0.5px;text-align:center;font-family:'Plus Jakarta Sans','Poppins',sans-serif;line-height:1.3;">
                                @if(isset($reminderNumber) && $reminderNumber > 0)
                                    Persetujuan Diperlukan Segera
                                @else
                                    Persetujuan General Journal
                                @endif
                            </h1>

                            <!-- Intro Paragraph -->
                            <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.65;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                Yth. Bapak/Ibu <strong>{{ $approver->name }}</strong>,
                            </p>
                            <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.65;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                Dokumen General Journal berikut telah disetujui oleh <strong>Section Head</strong> dan saat ini menunggu persetujuan akhir dari Anda. File PDF lengkap telah dilampirkan pada email ini untuk ditinjau.
                            </p>

                            <!-- Document Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;overflow:hidden;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                <tr>
                                    <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0;width:38%;color:#64748b;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                        No. Dokumen
                                    </td>
                                    <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0;color:#1a2540;font-size:14px;font-weight:800;font-family:'Plus Jakarta Sans',monospace;">
                                        {{ $journal->document_number }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                        Tanggal Journal
                                    </td>
                                    <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:13.5px;font-weight:600;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                        {{ $journal->journal_date->format('d M Y') }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                        Reference
                                    </td>
                                    <td style="padding:13px 18px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:13.5px;font-weight:600;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                        {{ $journal->reference ?? '-' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;color:#64748b;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                        Diajukan Oleh
                                    </td>
                                    <td style="padding:13px 18px;color:#1e293b;font-size:13.5px;font-weight:600;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                        {{ $journal->requester->name }}
                                    </td>
                                </tr>
                            </table>

                            @if(isset($overLimitFiles) && count($overLimitFiles) > 0)
                            <!-- Over Limit Attachments Warning -->
                            <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
                                <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    📎 Dokumen Pendukung Tambahan (Unduh via Link):
                                </p>
                                @foreach($overLimitFiles as $file)
                                <p style="margin:4px 0 0 0;font-size:12.5px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    <a href="{{ route('files.download', $file->id) }}" style="color:#1a2540;font-weight:600;text-decoration:none;">
                                        &darr; {{ $file->file_name }} <span style="color:#64748b;font-weight:normal;">({{ round($file->file_size / 1024 / 1024, 1) }} MB)</span>
                                    </a>
                                </p>
                                @endforeach
                            </div>
                            @endif

                            <!-- Action Buttons CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 28px 0;">
                                <tr>
                                    <td align="center">
                                        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                            <tr>
                                                <td style="padding-right:8px;">
                                                    <a href="{{ $approveUrl }}" style="background-color:#1a2540;color:#ffffff;display:inline-block;padding:13px 32px;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;box-shadow:0 2px 6px rgba(26,37,64,0.25);text-align:center;font-family:'Plus Jakarta Sans','Poppins',sans-serif;letter-spacing:-0.2px;">
                                                        Setujui Dokumen
                                                    </a>
                                                </td>
                                                <td style="padding-left:8px;">
                                                    <a href="{{ $rejectUrl }}" style="background-color:#ffffff;color:#dc2626;border:1.5px solid #dc2626;display:inline-block;padding:11.5px 28px;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;text-align:center;font-family:'Plus Jakarta Sans','Poppins',sans-serif;letter-spacing:-0.2px;">
                                                        Tolak Dokumen
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Fallback Link Section -->
                            <div style="border-top:1px solid #e2e8f0;padding-top:22px;margin-top:24px;">
                                <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    Jika tombol di atas tidak berfungsi, salin dan tempel tautan persetujuan berikut ke browser Anda:
                                </p>
                                <p style="margin:0 0 16px 0;font-size:12px;word-break:break-all;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    <a href="{{ $approveUrl }}" style="color:#2563eb;text-decoration:none;font-weight:500;">{{ $approveUrl }}</a>
                                </p>

                                <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    Tautan penolakan dokumen:
                                </p>
                                <p style="margin:0 0 20px 0;font-size:12px;word-break:break-all;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    <a href="{{ $rejectUrl }}" style="color:#dc2626;text-decoration:none;font-weight:500;">{{ $rejectUrl }}</a>
                                </p>

                                <p style="margin:0 0 4px 0;font-size:13px;color:#64748b;line-height:1.55;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    Jika Anda memiliki pertanyaan mengenai dokumen ini, silakan hubungi pengaju atau tim finance terkait.
                                </p>
                                <p style="margin:16px 0 0 0;font-size:13px;color:#475569;line-height:1.55;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                    Salam hormat,<br>
                                    <strong style="color:#1a2540;">Tim JAGO &mdash; PT Astra Visteon Indonesia</strong>
                                </p>
                            </div>

                        </td>
                    </tr>
                </table>

                <!-- Secondary Soft Highlight Box ("Need more help?") -->
                <table width="580" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;background-color:#eef3fa;border:1px solid #d0ddeb;border-radius:10px;margin-top:20px;text-align:center;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                    <tr>
                        <td style="padding:20px 24px;">
                            <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#1a2540;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                Butuh Bantuan atau Akses Dokumen Lainnya?
                            </p>
                            <p style="margin:0;font-size:12.5px;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                <a href="{{ url('/monitoring') }}" style="color:#2563eb;font-weight:600;text-decoration:none;">
                                    Buka Portal Monitoring Dokumen &rarr;
                                </a>
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Footer Section -->
                <table width="580" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;margin-top:24px;text-align:center;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                    <tr>
                        <td style="padding:0 20px;">
                            <!-- Navigation links -->
                            <p style="margin:0 0 12px 0;font-size:12px;font-weight:600;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                <a href="{{ url('/dashboard') }}" style="color:#475569;text-decoration:none;margin:0 8px;">Dashboard</a> &bull;
                                <a href="{{ url('/monitoring') }}" style="color:#475569;text-decoration:none;margin:0 8px;">Monitoring</a> &bull;
                                <a href="{{ url('/tutorial') }}" style="color:#475569;text-decoration:none;margin:0 8px;">Panduan</a>
                            </p>
                            
                            <p style="margin:0 0 8px 0;font-size:11.5px;color:#94a3b8;line-height:1.55;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                Email ini dikirim otomatis oleh Journal Approval General Operations (JAGO). Tautan approval berlaku 48 jam.
                            </p>
                            
                            <p style="margin:0;font-size:11.5px;color:#94a3b8;font-family:'Plus Jakarta Sans','Poppins',sans-serif;">
                                &copy; {{ date('Y') }} PT Astra Visteon Indonesia. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>