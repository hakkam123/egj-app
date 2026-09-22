<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Persetujuan General Journal — E-GJ</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;border:0.5px solid #e0e0e0;">

  <!-- Header navy -->
  <tr>
    <td style="background:#1a2540;padding:20px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="middle">
            <p style="margin:0;color:#ffffff;font-size:15px;font-weight:bold;letter-spacing:0.3px;">E-GJ</p>
            <p style="margin:3px 0 0;color:rgba(255,255,255,0.45);font-size:11px;">Electronic General Journal Approval</p>
          </td>
          <td valign="middle" align="right">
            <p style="margin:0;color:rgba(255,255,255,0.55);font-size:11px;">PT Astra Visteon Indonesia</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Label persetujuan -->
  <tr>
    <td style="background:#f5f6f8;padding:10px 28px;border-bottom:0.5px solid #e8eaed;">
      <p style="margin:0;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#9aa0a6;">
        Permintaan Persetujuan
      </p>
    </td>
  </tr>

  @if(isset($reminderNumber) && $reminderNumber > 0)
  <!-- Banner Reminder -->
  <tr>
    <td style="background:#fff8e1;padding:10px 28px;border-bottom:0.5px solid #e8eaed;">
      <p style="margin:0;font-size:12px;color:#8a6500;line-height:1.5;">
        ⏰ <strong>Pengingat #{{ $reminderNumber }}</strong> — Dokumen ini belum mendapat persetujuan Anda
        sejak {{ $reminderNumber === 1 ? '3' : '5' }} hari yang lalu.
      </p>
    </td>
  </tr>
  @endif

  <!-- Body -->
  <tr>
    <td style="padding:24px 28px 20px;">

      <p style="margin:0 0 16px;font-size:13px;color:#5f6368;line-height:1.7;">
        Yth. <strong style="color:#1a1a2e;">{{ $approver->name }}</strong>,<br>
        Dokumen General Journal berikut telah disetujui oleh Section Head dan memerlukan persetujuan akhir Anda.
        File PDF terlampir pada email ini untuk ditinjau sebelum mengambil keputusan.
      </p>

      <!-- Info dokumen -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:8px;overflow:hidden;border:0.5px solid #e8eaed;">
        <tr>
          <td style="background:#f5f6f8;padding:8px 14px 6px;">
            <p style="margin:0;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;color:#9aa0a6;">No. Dokumen</p>
            <p style="margin:2px 0 0;font-size:14px;font-weight:bold;color:#1a1a2e;font-family:monospace;">{{ $journal->document_number }}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:8px 14px 6px;border-top:0.5px solid #e8eaed;">
            <p style="margin:0;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;color:#9aa0a6;">Tanggal Journal</p>
            <p style="margin:2px 0 0;font-size:13px;color:#1a1a2e;">{{ $journal->journal_date->format('d M Y') }}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f6f8;padding:8px 14px 6px;border-top:0.5px solid #e8eaed;">
            <p style="margin:0;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;color:#9aa0a6;">Reference</p>
            <p style="margin:2px 0 0;font-size:13px;color:#1a1a2e;">{{ $journal->reference ?? '-' }}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:8px 14px 10px;border-top:0.5px solid #e8eaed;">
            <p style="margin:0;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;color:#9aa0a6;">Diajukan Oleh</p>
            <p style="margin:2px 0 0;font-size:13px;color:#1a1a2e;">{{ $journal->requester->name }}</p>
          </td>
        </tr>
      </table>

      @if(isset($overLimitFiles) && count($overLimitFiles) > 0)
      <!-- Supporting Documents over limit -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:8px;overflow:hidden;border:0.5px solid #e8eaed;">
        <tr>
          <td style="background:#fff8e1;padding:8px 14px;border-bottom:0.5px solid #e8eaed;">
            <p style="margin:0;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;color:#8a6500;">
              Supporting Documents (Terlalu besar untuk dilampirkan)
            </p>
          </td>
        </tr>
        @foreach($overLimitFiles as $file)
        <tr>
          <td style="background:#ffffff;padding:8px 14px;border-top:0.5px solid #e8eaed;">
            <a href="{{ route('files.download', $file->id) }}"
               style="font-size:13px;color:#1a2540;text-decoration:none;">
              ↓ {{ $file->file_name }}
              <span style="color:#9aa0a6;font-size:11px;">({{ round($file->file_size / 1024 / 1024, 1) }} MB)</span>
            </a>
          </td>
        </tr>
        @endforeach
      </table>
      @endif

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="border-top:0.5px solid #e8eaed;"></td></tr>
      </table>

      <!-- Tombol aksi -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td width="50%" style="padding-right:6px;">
            <a href="{{ $approveUrl }}"
               style="display:block;background:#1a2540;color:#ffffff;text-decoration:none;text-align:center;padding:11px 16px;border-radius:7px;font-size:13px;font-weight:bold;">
              Setujui
            </a>
          </td>
          <td width="50%" style="padding-left:6px;">
            <a href="{{ $rejectUrl }}"
               style="display:block;background:#ffffff;color:#8b1f1f;text-decoration:none;text-align:center;padding:10px 16px;border-radius:7px;font-size:13px;font-weight:bold;border:1px solid #8b1f1f;">
              Tolak
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:11px;color:#9aa0a6;text-align:center;line-height:1.6;">
        Tombol di atas hanya berlaku <strong>sekali</strong> dan akan kedaluwarsa dalam <strong>48 jam</strong>.<br>
        Jika Anda bukan penerima yang dimaksud, abaikan email ini.
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f5f6f8;padding:14px 28px;border-top:0.5px solid #e8eaed;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:11px;color:#9aa0a6;">
              E-GJ System &mdash; PT Astra Visteon Indonesia
            </p>
          </td>
          <td align="right">
            <p style="margin:0;font-size:11px;color:#c5c8cc;">© {{ date('Y') }}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>