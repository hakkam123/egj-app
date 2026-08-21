<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Approval Required - GJAS</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#1e3a5f;padding:24px 32px;">
                            <h1 style="color:#ffffff;margin:0;font-size:20px;">General Journal Approval System</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="color:#374151;font-size:16px;margin:0 0 16px;">
                                Yth. <strong>{{ $approver->name }}</strong>,
                            </p>
                            <p style="color:#374151;font-size:14px;margin:0 0 24px;">
                                Terdapat General Journal yang memerlukan approval Anda:
                            </p>

                            <table width="100%" cellpadding="8" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;margin-bottom:24px;">
                                <tr>
                                    <td style="color:#6b7280;font-size:13px;width:140px;">Document Number</td>
                                    <td style="color:#111827;font-size:14px;font-weight:600;">{{ $journal->document_number }}</td>
                                </tr>
                                <tr>
                                    <td style="color:#6b7280;font-size:13px;">Tanggal Journal</td>
                                    <td style="color:#111827;font-size:14px;">{{ $journal->journal_date->format('d M Y') }}</td>
                                </tr>
                                <tr>
                                    <td style="color:#6b7280;font-size:13px;">Reference</td>
                                    <td style="color:#111827;font-size:14px;">{{ $journal->reference ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="color:#6b7280;font-size:13px;">Diajukan oleh</td>
                                    <td style="color:#111827;font-size:14px;">{{ $journal->requester->name }}</td>
                                </tr>
                            </table>

                            <!-- Preview Link -->
                            <p style="color:#374151;font-size:14px;margin:0 0 16px;">
                                📄 <a href="{{ $previewUrl }}" style="color:#2563eb;text-decoration:none;font-weight:500;">Preview Dokumen (tanpa login)</a>
                            </p>

                            <!-- Portal Link -->
                            <p style="color:#374151;font-size:14px;margin:0 0 24px;">
                                Silakan login ke portal untuk melakukan approval:
                            </p>

                            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                <tr>
                                    <td style="background-color:#1e3a5f;border-radius:6px;padding:12px 32px;">
                                        <a href="{{ $portalUrl }}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                                            Buka Portal Approval
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
                            <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
                                Email ini dikirim otomatis oleh sistem GJAS. Link preview berlaku 5 hari kerja.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
